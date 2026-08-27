import os
import logging
import re

logger = logging.getLogger(__name__)

_llm = None
_backend = None

def get_llm():
    global _llm, _backend
    if _llm is not None:
        return _llm

    model_path = os.getenv("LOCAL_MODEL_PATH", "./gemma-4-E4B-it-Q4_K_M.gguf")
    
    if not os.path.exists(model_path):
        raise FileNotFoundError(
            f"Model file not found at: {model_path}. "
            f"Please set LOCAL_MODEL_PATH in .env to the correct path."
        )
    
    n_ctx = int(os.getenv("MODEL_N_CTX", 2048))
    n_batch = int(os.getenv("MODEL_N_BATCH", 512))
    n_gpu_layers = int(os.getenv("MODEL_N_GPU_LAYERS", 0))
    n_threads = int(os.getenv("MODEL_N_THREADS", max(4, os.cpu_count() or 4)))
    
    logger.info(f"Loading local LLM: {model_path}")
    logger.info(f"Context length={n_ctx}, batch={n_batch}, gpu_layers={n_gpu_layers}, threads={n_threads}")

    try:
        from llama_cpp import Llama
        logger.info("Initializing model via llama-cpp-python engine...")
        _llm = Llama(
            model_path=model_path,
            n_ctx=n_ctx,
            n_batch=n_batch,
            n_gpu_layers=n_gpu_layers,
            n_threads=n_threads,
            verbose=False,
        )
        _backend = "llama_cpp"
        logger.info("Local LLM (llama-cpp) loaded successfully.")
        return _llm
    except Exception as e:
        logger.warning(f"llama-cpp loading failed: {e}. Trying ctransformers fallback...")

    try:
        from ctransformers import AutoModelForCausalLM
        configured = os.getenv("LOCAL_MODEL_TYPE", "gemma").strip()
        candidates = [configured, "llama", "gemma", "mistral"]
        for model_type in candidates:
            try:
                _llm = AutoModelForCausalLM.from_pretrained(
                    model_path,
                    model_type=model_type,
                    gpu_layers=n_gpu_layers,
                    context_length=n_ctx,
                    threads=n_threads,
                )
                _backend = "ctransformers"
                logger.info(f"Local LLM (ctransformers) loaded with model_type='{model_type}'.")
                return _llm
            except Exception as ce:
                logger.warning(f"ctransformers model_type='{model_type}' failed: {ce}")
    except Exception as e:
        logger.error(f"ctransformers loading failed: {e}")

    raise RuntimeError(f"Failed to load LLM model at {model_path} with available engines.")

def build_prompt(query: str, retrieved_chunks: list[dict]) -> str:
    from app.rules.manager import get_business_rules
    rules = get_business_rules()
    
    no_answer_msg = rules.get("no_answer_response", "Xin lỗi, thông tin bạn hỏi không có trong tài liệu được cung cấp.")
    
    context_text = ""
    for idx, chunk in enumerate(retrieved_chunks):
        context_text += f"[Tài liệu {idx + 1} - {chunk['metadata']['filename']}, Trang/Sheet {chunk['metadata']['page']}]:\n"
        context_text += f"{chunk['text'].strip()}\n\n"
        
    # Gemma/Llama optimized concise turn-based prompt
    prompt = f"""<start_of_turn>user
Bạn là trợ lý AI trả lời câu hỏi dựa trên tài liệu được cung cấp.

QUY TẮC BẮT BUỘC:
1. Trả lời NGẮN GỌN, TRỰC DIỆN (1-3 câu) đúng trọng tâm câu hỏi.
2. CHỈ sử dụng thông tin có trong phần [TÀI LIỆU] dưới đây. Tuyệt đối không tự suy diễn hoặc bịa đặt.
3. Nếu tài liệu KHÔNG có thông tin, trả lời chính xác câu: "{no_answer_msg}"
4. Không viết các phần phân tích, không lặp lại câu từ, không viết phần suy nghĩ nội bộ.

[TÀI LIỆU]:
{context_text}

[CÂU HỎI]:
{query}<end_of_turn>
<start_of_turn>model
"""
    return prompt

def clean_llm_output(text: str) -> str:
    """
    Cleans up any repeated lines, meta-instructions, or chain-of-thought hallucinated by the model.
    """
    if not text:
        return ""
        
    text = text.strip()
    
    # 1. Truncate at common hallucinated section headers
    cut_patterns = [
        r'\n\s*YÊU CẦU ĐIỀU CHỈNH:',
        r'\n\s*PHÂN TÍCH VÀ THỰC THI:',
        r'\n\s*BẢN ĐÁP ÁN CHÍNH THỨC:',
        r'\n\s*BẢN ĐÁP ÁN CUỐI CÙNG:',
        r'\n\s*BẢN ĐÁP ÁN ĐƯỢC YÊU CẦU:',
        r'\n\s*\(Kết luận:',
        r'<end_of_turn>',
        r'<start_of_turn>',
    ]
    for cp in cut_patterns:
        match = re.search(cp, text, flags=re.IGNORECASE)
        if match:
            text = text[:match.start()].strip()
            
    # 2. Deduplicate repeated consecutive lines (like repeated "Lưu ý: ...")
    lines = text.split("\n")
    cleaned_lines = []
    seen_consecutive = None
    for line in lines:
        stripped = line.strip()
        if stripped and stripped == seen_consecutive:
            continue
        cleaned_lines.append(line)
        seen_consecutive = stripped
        
    return "\n".join(cleaned_lines).strip()

def generate_answer(query: str, retrieved_chunks: list[dict]) -> str:
    from app.rules.manager import get_business_rules
    rules = get_business_rules()
    no_answer_msg = rules.get("no_answer_response", "Xin lỗi, tôi không tìm thấy thông tin phù hợp trong tài liệu của bạn.")
    
    if not retrieved_chunks:
        return no_answer_msg
        
    prompt = build_prompt(query, retrieved_chunks)
    
    try:
        llm = get_llm()
        
        max_tokens = int(os.getenv("MODEL_MAX_TOKENS", 250))
        temperature = float(os.getenv("MODEL_TEMPERATURE", 0.1))
        stop_tokens = [
            "<end_of_turn>",
            "<start_of_turn>",
            "[CÂU HỎI]:",
            "CÂU HỎI:",
            "YÊU CẦU ĐIỀU CHỈNH:",
            "PHÂN TÍCH:",
            "</s>",
            "<|endoftext|>"
        ]
        
        logger.info(f"Generating answer (backend={_backend}, max_tokens={max_tokens}, temp={temperature})...")
        
        if _backend == "llama_cpp":
            res = llm(
                prompt,
                max_tokens=max_tokens,
                temperature=temperature,
                stop=stop_tokens,
            )
            raw_answer = res["choices"][0]["text"]
        else:
            raw_answer = llm(prompt, max_new_tokens=max_tokens, temperature=temperature, stop=stop_tokens)
            
        answer = clean_llm_output(str(raw_answer))
        if not answer:
            return no_answer_msg
            
        return answer
            
    except Exception as e:
        logger.error(f"Error generating answer from local LLM: {e}", exc_info=True)
        return f"An error occurred while generating the answer: {str(e)}"
