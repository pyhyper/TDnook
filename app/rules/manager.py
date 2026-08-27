import os
import json
import logging
import re

logger = logging.getLogger(__name__)

RULES_FILE_PATH = os.path.join(os.getcwd(), "data", "business_rules.json")

DEFAULT_RULES = {
    "system_role": "Bạn là trợ lý AI chuyên nghiệp. Bạn trả lời câu hỏi của người dùng dựa trên tài liệu họ cung cấp và tuân thủ nghiêm ngặt các quy định nghiệp vụ do Quản trị viên (Admin) thiết lập.",
    "strict_mode": True,
    "no_answer_response": "Xin lỗi, thông tin bạn hỏi không có trong tài liệu được cung cấp. Theo quy định, tôi chỉ được phép trả lời dựa trên nội dung tài liệu.",
    "business_policies": [
        "Chỉ trả lời dựa trên tài liệu người dùng cung cấp. Tuyệt đối không tự suy diễn hoặc bịa đặt thông tin ngoài tài liệu.",
        "Trích dẫn rõ nguồn (tên file, trang/sheet) khi đưa ra câu trả lời.",
        "Luôn xưng hô chuẩn mực, lịch sự và thân thiện.",
        "Nếu câu hỏi nằm ngoài nội dung tài liệu, hãy từ chối lịch sự theo quy định."
    ],
    "admin_rule_documents": [],  # List of admin rule documents (e.g. policy.pdf, guideline.docx)
    "direct_faq": [
        {
            "keywords": ["hotline", "lien he", "tong dai", "sdt"],
            "answer": "Hotline hỗ trợ: 1900 6868 (Giờ làm việc: 8h00 - 17h30 từ Thứ 2 đến Thứ 6)."
        },
        {
            "keywords": ["gio lam viec", "thoi gian hoat dong"],
            "answer": "Thời gian làm việc từ 8:00 đến 17:30 các ngày trong tuần từ Thứ 2 đến Thứ 6."
        }
    ],
    "forbidden_keywords": [
        "hack", "jailbreak", "bypass", "mat khau admin", "root password"
    ]
}

def get_business_rules() -> dict:
    if os.path.exists(RULES_FILE_PATH):
        try:
            with open(RULES_FILE_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data
        except Exception as e:
            logger.error(f"Error reading business rules: {e}")
            return DEFAULT_RULES.copy()
    
    save_business_rules(DEFAULT_RULES)
    return DEFAULT_RULES.copy()

def save_business_rules(rules: dict) -> bool:
    try:
        os.makedirs(os.path.dirname(RULES_FILE_PATH), exist_ok=True)
        with open(RULES_FILE_PATH, "w", encoding="utf-8") as f:
            json.dump(rules, f, ensure_ascii=False, indent=2)
        logger.info("Business rules saved successfully.")
        return True
    except Exception as e:
        logger.error(f"Error saving business rules: {e}")
        return False

def check_guardrails_and_faq(query: str) -> dict | None:
    rules = get_business_rules()
    query_lower = query.lower().strip()
    
    # 1. Check forbidden keywords
    forbidden = rules.get("forbidden_keywords", [])
    for kw in forbidden:
        if kw.lower() in query_lower:
            return {
                "answer": "Yêu cầu của bạn bị từ chối do vi phạm chính sách an toàn thông tin của hệ thống.",
                "sources": []
            }
            
    # 2. Check direct FAQ
    faqs = rules.get("direct_faq", [])
    for faq in faqs:
        keywords = faq.get("keywords", [])
        for kw in keywords:
            if re.search(r'\b' + re.escape(kw.lower()) + r'\b', query_lower) or kw.lower() in query_lower:
                return {
                    "answer": faq.get("answer", ""),
                    "sources": [{"filename": "[Admin Rule: Direct FAQ]", "page": 1}]
                }
                
    return None
