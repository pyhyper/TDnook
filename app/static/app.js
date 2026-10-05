// ==========================================================================
// TDnook — Minimalist Paper Web App Logic (Full-Screen & Kindle UX)
// Supports Multi-Conversation History, User Session Documents & Bilingual i18n
// ==========================================================================

const API_BASE = "";

let currentPortal = "user";
let currentTheme = localStorage.getItem("docurag_theme") || "theme-sepia";
let currentTexture = localStorage.getItem("docurag_texture") || "texture-kindle";
let currentLang = localStorage.getItem("tdnook_lang") || "vi";

// ==========================================================================
// Bilingual i18n Dictionary (VI / EN) - Clean & Professional
// ==========================================================================
const I18N = {
    vi: {
        brandTag: "Trí Tuệ Tài Liệu",
        navUser: "Đọc Sách & Trò Chuyện",
        navAdmin: "Quy Định Doanh Nghiệp",
        textureTitle: "Chọn chất liệu giấy",
        textureKindle: "Kindle Micro-Grain",
        textureParchment: "Book Parchment (Giấy Dó)",
        textureLinen: "Woven Linen (Giấy Sợi Vải)",
        textureSmooth: "Smooth Matte",
        toneSepia: "Sepia Warm Paper",
        toneEink: "E-Ink Neutral Paper",
        toneDark: "Dark Ink Mode",
        fullscreenTitle: "Chế độ toàn màn hình",
        newChat: "Cuộc hội thoại mới",
        chatHistory: "Lịch sử hội thoại",
        chatsCount: (n) => `${n} cuộc trò chuyện`,
        attachedTitle: "Tài liệu đính kèm (Phiên)",
        attachedBadge: "File Người Dùng",
        attachedDesc: "Tải lên PDF, Ảnh (OCR), Word, Excel để tra cứu tạm thời trong phiên này.",
        chooseFile: "Chọn tài liệu đính kèm",
        attachBtn: "Đính Kèm & Phân Tích",
        scopeTitle: "Kho Kiến Thức Hệ Thống",
        scopeBadge: (n) => `${n} tài liệu`,
        scopeDesc: "Đối chiếu trực tiếp với kho dữ liệu mẫu của hệ thống",
        allSystemKnowledge: "Toàn bộ tài liệu hệ thống",
        scopeIndicator: (val) => `Phạm vi: ${val}`,
        botWelcome: "Chào bạn. Hãy đính kèm tài liệu cá nhân để đối chiếu với kiến thức hệ thống hoặc đặt câu hỏi trực tiếp. Tôi sẽ trả lời ngắn gọn, chuẩn mực theo đúng ngôn ngữ của bạn.",
        quickSummarize: "Tóm tắt tài liệu",
        quickSkills: "Kinh nghiệm & Kỹ năng",
        quickPolicy: "Chính sách quan trọng",
        inputPlaceholder: "Đặt câu hỏi về tài liệu...",
        sendTitle: "Gửi câu hỏi",
        userRole: "Bạn",
        botRole: "Trợ lý TDnook",
        sourceLabel: "Nguồn trích dẫn",
        pageLabel: "Trang",
        searchingNotice: "Đang tra cứu ngữ cảnh tài liệu và đối chiếu quy tắc nghiệp vụ...",
        adminTabRules: "1. Quy Định & Guardrails",
        adminTabIngest: "2. Nạp Tài Liệu Mẫu",
        adminTabManage: "3. Kho Dữ Liệu Thư Viện",
        strictModeTitle: "Chế độ Tuân Thủ Tài Liệu Tuyệt Đối (Strict Mode)",
        strictModeSub: "Chỉ trả lời dựa trên tài liệu được cung cấp. Từ chối câu hỏi ngoài phạm vi.",
        systemRoleTitle: "Vai trò hệ thống (System Role Prompt)",
        systemRoleSub: "Quy định nhân cách, giọng văn và hành vi của trợ lý.",
        fallbackTitle: "Câu trả lời khi thiếu dữ liệu (Fallback Response)",
        fallbackSub: "Thông báo xuất ra khi tài liệu không chứa câu trả lời.",
        policiesTitle: "Quy tắc nghiệp vụ cốt lõi",
        policiesSub: "Quy tắc bắt buộc áp dụng cho mọi phản hồi (mỗi dòng 1 quy tắc).",
        faqTitle: "Cấu hình phản hồi nhanh FAQ (JSON)",
        faqSub: "Khớp từ khóa để trả lời tức thì không cần qua LLM.",
        forbiddenTitle: "Từ khóa cấm & Chặn tấn công",
        forbiddenSub: "Các từ bị cấm, phân tách bởi dấu phẩy.",
        saveRulesBtn: "Lưu Cấu Hình Doanh Nghiệp",
        adminUploadTitle: "Nạp Tài Liệu Quy Chuẩn Vào Kho Kiến Thức",
        adminUploadSub: "Quy định công ty, bảng giá, sổ tay nhân viên (PDF, Word, Excel, CSV, Ảnh OCR, TXT).",
        adminUploadBtn: "Bắt Đầu Nạp & Sinh Vector",
        manualSnippetTitle: "Nhập Ghi Chú / Quy Định Thủ Công",
        manualSnippetSub: "Nhập trực tiếp thông báo hoặc quy định nội bộ mà không cần tải file.",
        manualTitleLabel: "Tiêu đề:",
        manualContentLabel: "Nội dung:",
        manualSaveBtn: "Lưu Ghi Chú Vào CSDL Vector",
        repoTitle: "Kho Kiến Thức Đã Nạp",
        repoSub: "Toàn bộ tài liệu đang phục vụ truy vấn RAG.",
        resetDbBtn: "Xóa Sạch Toàn Bộ CSDL",
        modelConfigTitle: "Cấu Hình Nơi Lưu Trữ Mô Hình LLM",
        modelConfigSub: "Đường dẫn thư mục MLX (macOS) hoặc file .gguf (Windows). Hệ thống nạp trực tiếp vào RAM/GPU.",
        modelPathLabel: "Đường dẫn mô hình (LOCAL_MODEL_PATH):",
        modelTypeLabel: "Loại kiến trúc (Model Type):",
        quickPresetsLabel: "Đường dẫn mẫu:",
        saveModelBtn: "Lưu & Nạp Lại Mô Hình",
        modelPathValid: "Đã nhận diện (Tệp tồn tại)",
        modelPathInvalid: "Không tìm thấy đường dẫn trên đĩa",
        modelSavedSuccess: "Đã lưu đường dẫn & nạp lại mô hình thành công.",
        modelSavedFailed: "Không thể lưu đường dẫn mô hình.",
        footerEngine: "TDnook Local In-Process Engine",
        footerReady: "Sẵn sàng"
    },
    en: {
        brandTag: "Document Intelligence",
        navUser: "User Reading & Chat",
        navAdmin: "Admin Business Rules",
        textureTitle: "Select paper texture",
        textureKindle: "Kindle Micro-Grain",
        textureParchment: "Book Parchment",
        textureLinen: "Woven Linen Paper",
        textureSmooth: "Smooth Matte",
        toneSepia: "Sepia Warm Paper",
        toneEink: "E-Ink Neutral Paper",
        toneDark: "Dark Ink Mode",
        fullscreenTitle: "Full Screen Mode",
        newChat: "New Conversation",
        chatHistory: "Chat History",
        chatsCount: (n) => `${n} ${n === 1 ? 'chat' : 'chats'}`,
        attachedTitle: "Attached File (Session)",
        attachedBadge: "User Doc",
        attachedDesc: "Upload PDF, Image (OCR), Word, Excel to chat in this session.",
        chooseFile: "Choose file to attach",
        attachBtn: "Attach & Parse File",
        scopeTitle: "System Knowledge Scope",
        scopeBadge: (n) => `${n} ${n === 1 ? 'file' : 'files'}`,
        scopeDesc: "Cross-reference directly with Admin knowledge base",
        allSystemKnowledge: "All System Knowledge",
        scopeIndicator: (val) => `Scope: ${val}`,
        botWelcome: "Hello. Attach a personal document to cross-reference with system knowledge, or ask questions directly. I will provide concise, grounded answers with citations.",
        quickSummarize: "Summarize Document",
        quickSkills: "Key Skills & Experience",
        quickPolicy: "Important Policies",
        inputPlaceholder: "Ask a question about the document...",
        sendTitle: "Send Question",
        userRole: "You",
        botRole: "TDnook Assistant",
        sourceLabel: "Sources",
        pageLabel: "Page",
        searchingNotice: "Searching document context and applying business rules...",
        adminTabRules: "1. Business Rules & Guardrails",
        adminTabIngest: "2. Ingest Policy Documents",
        adminTabManage: "3. Library Repository",
        strictModeTitle: "Strict Document-Only Mode",
        strictModeSub: "AI is strictly restricted to answering within provided documents. Rejects external questions.",
        systemRoleTitle: "System Persona / Role",
        systemRoleSub: "Defines the identity and behavior of the assistant.",
        fallbackTitle: "Fallback Refusal Notice",
        fallbackSub: "Message shown when the answer is not in the documents.",
        policiesTitle: "Core Business Policies",
        policiesSub: "Mandatory rules applied to every response (one rule per line).",
        faqTitle: "Direct FAQ Rules (JSON)",
        faqSub: "Keyword matching for instant script response.",
        forbiddenTitle: "Forbidden Keywords",
        forbiddenSub: "Banned words separated by commas.",
        saveRulesBtn: "Save Business Rules",
        adminUploadTitle: "Upload Standard / Policy Documents",
        adminUploadSub: "Company guidelines, price lists, employee handbooks (PDF, Word, Excel, CSV, Images OCR, TXT).",
        adminUploadBtn: "Ingest Selected Files",
        manualSnippetTitle: "Manual Policy Snippet Entry",
        manualSnippetSub: "Type internal guidelines or notices directly without creating files.",
        manualTitleLabel: "Title:",
        manualContentLabel: "Content:",
        manualSaveBtn: "Save Manual Policy",
        repoTitle: "Ingested Knowledge Base",
        repoSub: "All active documents currently serving RAG queries.",
        resetDbBtn: "Reset Entire Database",
        modelConfigTitle: "LLM Model Storage & Path Configuration",
        modelConfigSub: "Direct file path to MLX directory (macOS) or single .gguf binary (Windows).",
        modelPathLabel: "Model Path (LOCAL_MODEL_PATH):",
        modelTypeLabel: "Model Architecture Type:",
        quickPresetsLabel: "Path presets:",
        saveModelBtn: "Save & Reload Model",
        modelPathValid: "Detected (Valid Path)",
        modelPathInvalid: "Path Not Found on Disk",
        modelSavedSuccess: "Model path saved & engine reloaded successfully.",
        modelSavedFailed: "Failed to save model path.",
        footerEngine: "TDnook Local In-Process Engine",
        footerReady: "Ready"
    }
};

function setLanguage(lang) {
    currentLang = lang === "en" ? "en" : "vi";
    localStorage.setItem("tdnook_lang", currentLang);

    // Update active button state
    const btnEn = document.getElementById("lang-btn-en");
    const btnVi = document.getElementById("lang-btn-vi");
    if (btnEn) btnEn.classList.toggle("active", currentLang === "en");
    if (btnVi) btnVi.classList.toggle("active", currentLang === "vi");

    document.documentElement.lang = currentLang;

    // Apply i18n to all elements with data-i18n
    const dict = I18N[currentLang];
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        if (dict && dict[key]) {
            el.textContent = dict[key];
        }
    });

    // Update placeholders
    const qInput = document.getElementById("query-input");
    if (qInput) {
        qInput.placeholder = dict.inputPlaceholder;
    }
    const textureSel = document.getElementById("texture-selector");
    if (textureSel) {
        textureSel.title = dict.textureTitle;
    }
    const fsBtn = document.getElementById("btn-fullscreen");
    if (fsBtn) {
        fsBtn.title = dict.fullscreenTitle;
    }
    const submitBtn = document.getElementById("btn-submit");
    if (submitBtn) {
        submitBtn.title = dict.sendTitle;
    }

    // Refresh dynamic views
    renderConversationList();
    onScopeChange();

    if (currentModelSettings) {
        updateModelStatusBadge(currentModelSettings.exists, currentModelSettings.backend);
    }

    // If active conversation only has the initial welcome message, translate it
    const conv = getCurrentConversation();
    if (conv && conv.messages.length === 1 && conv.messages[0].role === "bot") {
        conv.messages[0].content = dict.botWelcome;
        const welcomeEl = document.getElementById("welcome-message-text");
        if (welcomeEl) welcomeEl.textContent = dict.botWelcome;
        const roleEl = document.getElementById("welcome-role-badge");
        if (roleEl) roleEl.textContent = dict.botRole;
    }
}

// Multi-Conversation State
let conversations = [];
let currentConvId = null;

document.addEventListener("DOMContentLoaded", () => {
    // Apply saved theme, texture, and language
    setPaperTheme(currentTheme);
    setPaperTexture(currentTexture);
    setLanguage(currentLang);
    
    // Initialize Conversations
    initConversations();

    // Load Admin Data, Documents & Model Settings
    loadDocuments();
    loadAdminRules();
    loadModelSettings();

    // User file input listener
    const fileInput = document.getElementById("user-file-input");
    const chosenLabel = document.getElementById("user-chosen-file");
    if (fileInput) {
        fileInput.addEventListener("change", () => {
            if (fileInput.files.length > 0) {
                chosenLabel.textContent = fileInput.files[0].name;
            } else {
                chosenLabel.textContent = I18N[currentLang].chooseFile;
            }
        });
    }

    // Auto focus prompt input
    const qInput = document.getElementById("query-input");
    if (qInput) qInput.focus();
});

// ==========================================================================
// Multi-Conversation Management
// ==========================================================================

function initConversations() {
    try {
        const stored = localStorage.getItem("docurag_conversations");
        if (stored) {
            conversations = JSON.parse(stored);
        }
    } catch (e) {
        console.warn("Failed to load conversations from storage:", e);
        conversations = [];
    }

    if (!Array.isArray(conversations) || conversations.length === 0) {
        const defaultConv = makeNewConversationObject(I18N[currentLang].newChat);
        conversations = [defaultConv];
        currentConvId = defaultConv.id;
    } else {
        const storedActiveId = localStorage.getItem("docurag_active_conv_id");
        if (storedActiveId && conversations.some(c => c.id === storedActiveId)) {
            currentConvId = storedActiveId;
        } else {
            currentConvId = conversations[0].id;
        }
    }

    saveConversations();
    renderConversationList();
    renderActiveConversation();
}

function makeNewConversationObject(title = null) {
    const defaultTitle = title || I18N[currentLang].newChat;
    return {
        id: "conv_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
        title: defaultTitle,
        createdAt: new Date().toISOString(),
        userDoc: null, // { filename, text, pages, char_count }
        messages: [
            {
                role: "bot",
                content: I18N[currentLang].botWelcome,
                sources: null,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
        ]
    };
}

function getCurrentConversation() {
    let conv = conversations.find(c => c.id === currentConvId);
    if (!conv) {
        if (conversations.length === 0) {
            conv = makeNewConversationObject();
            conversations.push(conv);
        } else {
            conv = conversations[0];
        }
        currentConvId = conv.id;
    }
    return conv;
}

function saveConversations() {
    try {
        localStorage.setItem("docurag_conversations", JSON.stringify(conversations));
        if (currentConvId) {
            localStorage.setItem("docurag_active_conv_id", currentConvId);
        }
    } catch (e) {
        console.warn("Failed to save conversations to storage:", e);
    }
}

function createNewConversation() {
    const newConv = makeNewConversationObject(I18N[currentLang].newChat);
    conversations.unshift(newConv);
    currentConvId = newConv.id;
    saveConversations();
    renderConversationList();
    renderActiveConversation();
    
    closeMobileSidebar();
    const qInput = document.getElementById("query-input");
    if (qInput) qInput.focus();
}

function switchConversation(convId) {
    if (currentConvId === convId) return;
    currentConvId = convId;
    saveConversations();
    renderConversationList();
    renderActiveConversation();
    closeMobileSidebar();
}

function deleteConversation(convId, event) {
    if (event) event.stopPropagation();
    
    conversations = conversations.filter(c => c.id !== convId);
    if (conversations.length === 0) {
        const newConv = makeNewConversationObject(I18N[currentLang].newChat);
        conversations = [newConv];
        currentConvId = newConv.id;
    } else if (currentConvId === convId) {
        currentConvId = conversations[0].id;
    }
    
    saveConversations();
    renderConversationList();
    renderActiveConversation();
}

function renderConversationList() {
    const listEl = document.getElementById("conversation-list");
    const countBadge = document.getElementById("conv-count-badge");
    if (!listEl) return;

    if (countBadge) {
        countBadge.textContent = I18N[currentLang].chatsCount(conversations.length);
    }

    listEl.innerHTML = "";
    conversations.forEach(conv => {
        const item = document.createElement("div");
        item.className = `conversation-item ${conv.id === currentConvId ? 'active' : ''}`;
        item.onclick = () => switchConversation(conv.id);

        const dateStr = new Date(conv.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' });
        const attachedLabel = currentLang === 'vi' ? 'Đã đính kèm' : 'Attached';

        item.innerHTML = `
            <div class="conv-info">
                <span class="conv-title">${escapeHtml(conv.title)}</span>
                <span class="conv-time">${dateStr} • ${conv.messages.length} msgs${conv.userDoc ? ` • [${attachedLabel}]` : ''}</span>
            </div>
            <button class="btn-delete-conv" title="Delete conversation" onclick="deleteConversation('${conv.id}', event)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        `;
        listEl.appendChild(item);
    });
}

function renderActiveConversation() {
    const conv = getCurrentConversation();
    const thread = document.getElementById("chat-thread");
    if (!thread) return;

    thread.innerHTML = "";
    conv.messages.forEach(msg => {
        appendMessageToDom(msg.role, msg.content, msg.sources, null, msg.timestamp);
    });

    // Update Attached Doc Chip
    updateAttachedDocUi();
    scrollCanvasToBottom();
}

function updateAttachedDocUi() {
    const conv = getCurrentConversation();
    const infoContainer = document.getElementById("attached-doc-info");
    const nameEl = document.getElementById("attached-file-name");

    if (conv.userDoc) {
        if (infoContainer) infoContainer.style.display = "block";
        if (nameEl) nameEl.textContent = conv.userDoc.filename;
    } else {
        if (infoContainer) infoContainer.style.display = "none";
    }
}

function removeAttachedUserDoc() {
    const conv = getCurrentConversation();
    if (!conv.userDoc) return;

    const removedName = conv.userDoc.filename;
    conv.userDoc = null;
    saveConversations();
    updateAttachedDocUi();
    renderConversationList();

    const notifyMsg = currentLang === 'vi' 
        ? `Đã gỡ tài liệu đính kèm **${removedName}** khỏi cuộc trò chuyện này.`
        : `Removed attached document **${removedName}** from this conversation.`;
    appendMessage("bot", notifyMsg);
    const statusBox = document.getElementById("upload-status");
    if (statusBox) statusBox.style.display = "none";
}

// ==========================================================================
// Theme, Texture & UI Settings
// ==========================================================================

function updateBodyClasses() {
    document.body.classList.remove("theme-sepia", "theme-eink", "theme-dark");
    document.body.classList.remove("texture-kindle", "texture-parchment", "texture-linen", "texture-smooth");
    document.body.classList.add(currentTheme);
    document.body.classList.add(currentTexture);
}

function onTextureChange() {
    const sel = document.getElementById("texture-selector");
    if (sel) {
        setPaperTexture(sel.value);
    }
}

function setPaperTexture(tex) {
    currentTexture = tex;
    localStorage.setItem("docurag_texture", tex);
    const sel = document.getElementById("texture-selector");
    if (sel && sel.value !== tex) {
        sel.value = tex;
    }
    updateBodyClasses();
}

function setPaperTheme(themeName) {
    currentTheme = themeName;
    localStorage.setItem("docurag_theme", themeName);

    document.querySelectorAll(".tone-btn").forEach(btn => {
        btn.classList.remove("active");
        if (btn.classList.contains(`tone-${themeName.replace("theme-", "")}`)) {
            btn.classList.add("active");
        }
    });

    updateBodyClasses();
}

function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.warn(`Error attempting to enable fullscreen: ${err.message}`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById("sidebar-margin");
    const backdrop = document.getElementById("sidebar-backdrop");
    if (sidebar) {
        sidebar.classList.toggle("open");
    }
    if (backdrop) {
        backdrop.classList.toggle("show");
    }
}

function closeMobileSidebar() {
    const sidebar = document.getElementById("sidebar-margin");
    const backdrop = document.getElementById("sidebar-backdrop");
    if (sidebar) sidebar.classList.remove("open");
    if (backdrop) backdrop.classList.remove("show");
}

function switchPortal(portal) {
    currentPortal = portal;
    document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));
    document.querySelectorAll(".portal-view").forEach(el => el.classList.remove("active"));

    const navBtn = document.getElementById(`nav-${portal}`);
    const viewSection = document.getElementById(`portal-${portal}`);

    if (navBtn) navBtn.classList.add("active");
    if (viewSection) viewSection.classList.add("active");

    closeMobileSidebar();
}

function switchAdminTab(tabKey) {
    document.querySelectorAll(".subnav-item").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".subtab-pane").forEach(p => p.classList.remove("active"));

    const btn = event.currentTarget || event.target;
    btn.classList.add("active");
    document.getElementById(`admintab-${tabKey}`).classList.add("active");
}

function triggerQuickPrompt(index) {
    const dict = I18N[currentLang];
    let promptText = "";
    if (index === 1) promptText = dict.quickSummarize;
    else if (index === 2) promptText = dict.quickSkills;
    else if (index === 3) promptText = dict.quickPolicy;

    sendQuickPrompt(promptText);
}

function sendQuickPrompt(text) {
    const qInput = document.getElementById("query-input");
    if (qInput) {
        qInput.value = text;
        const form = document.getElementById("chat-form");
        if (form) {
            form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
        }
    }
}

// ==========================================================================
// Document Scope & Document Management
// ==========================================================================

async function loadDocuments() {
    try {
        const res = await fetch(`${API_BASE}/documents`);
        if (res.ok) {
            const data = await res.json();
            const docs = data.documents || [];
            
            // 1. Update user portal select dropdown
            const select = document.getElementById("user-doc-select");
            if (select) {
                const currentVal = select.value;
                const allLabel = I18N[currentLang].allSystemKnowledge;
                select.innerHTML = `<option value="All Documents">${allLabel}</option>`;
                docs.forEach(doc => {
                    const opt = document.createElement("option");
                    opt.value = doc;
                    opt.textContent = doc;
                    select.appendChild(opt);
                });
                if (docs.includes(currentVal)) {
                    select.value = currentVal;
                }
            }

            // 2. Update doc count badge
            const badge = document.getElementById("doc-count-badge");
            if (badge) {
                badge.textContent = I18N[currentLang].scopeBadge(docs.length);
            }

            // 3. Update admin list table
            renderAdminDocList(docs);
            onScopeChange();
        }
    } catch (e) {
        console.error("Failed to load documents:", e);
    }
}

function renderAdminDocList(docs) {
    const listEl = document.getElementById("documents-list");
    if (!listEl) return;

    if (docs.length === 0) {
        listEl.innerHTML = `
            <div class="empty-state">
                <p>${currentLang === 'vi' ? 'Chưa có tài liệu nào trong kho kiến thức hệ thống.' : 'No documents in system knowledge repository yet.'}</p>
            </div>
        `;
        return;
    }

    let html = `
        <div class="doc-table">
            <div class="table-head">
                <span>${currentLang === 'vi' ? 'Tên tài liệu' : 'Filename'}</span>
                <span>${currentLang === 'vi' ? 'Định dạng' : 'Type'}</span>
                <span style="text-align: right;">${currentLang === 'vi' ? 'Thao tác' : 'Action'}</span>
            </div>
    `;

    docs.forEach(doc => {
        const ext = doc.split('.').pop().toUpperCase();
        html += `
            <div class="table-row">
                <span class="doc-name">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                    ${escapeHtml(doc)}
                </span>
                <span class="doc-type">${ext}</span>
                <span class="doc-action">
                    <button class="btn-delete" onclick="deleteDocument('${escapeHtml(doc)}')">${currentLang === 'vi' ? 'Xóa' : 'Delete'}</button>
                </span>
            </div>
        `;
    });

    html += `</div>`;
    listEl.innerHTML = html;
}

function onScopeChange() {
    const select = document.getElementById("user-doc-select");
    const indicator = document.getElementById("scope-indicator");
    if (select && indicator) {
        const val = select.value;
        const displayVal = val === "All Documents" ? I18N[currentLang].allSystemKnowledge : val;
        indicator.textContent = I18N[currentLang].scopeIndicator(displayVal);
    }
}

// ==========================================================================
// User Attached File (Session Scope) & Admin Upload (Permanent)
// ==========================================================================

async function handleUserUpload() {
    const fileInput = document.getElementById("user-file-input");
    const statusBox = document.getElementById("upload-status");
    const btn = document.getElementById("btn-upload-user");

    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        showAlert(statusBox, currentLang === 'vi' ? "Vui lòng chọn một file để đính kèm." : "Please choose a file to attach.", "error");
        return;
    }

    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append("file", file);

    btn.disabled = true;
    showAlert(statusBox, currentLang === 'vi' ? `Đang đọc và phân tích ${file.name}...` : `Parsing and reading ${file.name}...`, "info");

    try {
        const res = await fetch(`${API_BASE}/documents/parse-user-file`, {
            method: "POST",
            body: formData
        });

        if (res.ok) {
            const data = await res.json();
            showAlert(statusBox, currentLang === 'vi' ? `Đã đính kèm: ${data.filename} (${data.pages} trang)` : `Attached: ${data.filename} (${data.pages} pages)`, "success");
            fileInput.value = "";
            document.getElementById("user-chosen-file").textContent = I18N[currentLang].chooseFile;

            // Save to current conversation
            const conv = getCurrentConversation();
            conv.userDoc = {
                filename: data.filename,
                text: data.text,
                pages: data.pages,
                char_count: data.char_count
            };
            saveConversations();
            updateAttachedDocUi();
            renderConversationList();

            const attachedBotMsg = currentLang === 'vi'
                ? `Đã đính kèm tài liệu **${data.filename}** (${data.pages} trang / ${data.char_count} ký tự). Tài liệu này được dùng riêng cho cuộc trò chuyện hiện tại và sẽ được đối chiếu với kiến thức hệ thống.`
                : `Attached document **${data.filename}** (${data.pages} pages / ${data.char_count} chars). This file is scoped to the current conversation.`;
            appendMessage("bot", attachedBotMsg);
        } else {
            const err = await res.text();
            showAlert(statusBox, `Attachment failed: ${err}`, "error");
        }
    } catch (e) {
        showAlert(statusBox, `Connection error: ${e.message}`, "error");
    } finally {
        btn.disabled = false;
    }
}

// ==========================================================================
// Query & Chat Messaging
// ==========================================================================

async function handleSendQuery(e) {
    e.preventDefault();
    const queryInput = document.getElementById("query-input");
    const query = queryInput.value.trim();
    if (!query) return;

    const conv = getCurrentConversation();
    const scope = document.getElementById("user-doc-select").value;
    const filenameFilter = scope === "All Documents" ? null : scope;

    // Update conversation title if it's the first question
    if (conv.title === I18N[currentLang].newChat && query.length > 0) {
        conv.title = query.slice(0, 32) + (query.length > 32 ? "..." : "");
        renderConversationList();
    }

    // Append User Message
    appendMessage("user", query);
    queryInput.value = "";

    // Append Assistant Loading Turn
    const botMsgId = "msg-" + Date.now();
    appendMessage("bot", I18N[currentLang].searchingNotice, null, botMsgId);

    const submitBtn = document.getElementById("btn-submit");
    submitBtn.disabled = true;

    try {
        const payload = { question: query };
        if (filenameFilter) {
            payload.filename = filenameFilter;
        }
        if (conv.userDoc) {
            payload.user_document_text = conv.userDoc.text;
            payload.user_document_name = conv.userDoc.filename;
        }

        const res = await fetch(`${API_BASE}/query`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            const data = await res.json();
            updateBotMessage(botMsgId, data.answer, data.sources);
        } else {
            const err = await res.text();
            updateBotMessage(botMsgId, `Error: ${err}`);
        }
    } catch (err) {
        updateBotMessage(botMsgId, `Connection error: ${err.message}`);
    } finally {
        submitBtn.disabled = false;
        queryInput.focus();
    }
}

function escapeHtml(text) {
    if (!text) return "";
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function renderMarkdown(rawText) {
    if (!rawText) return "";
    let text = escapeHtml(rawText);

    // Separate inline items
    text = text.replace(/([.!?:]|\*\*)\s+(\d+\.\s+)/g, "$1\n\n$2");
    text = text.replace(/([.!?:]|\*\*)\s+([\*\-]\s+)/g, "$1\n\n$2");
    text = text.replace(/:\s+(\*\s+\*\*)/g, ":\n\n$1");

    // Code blocks
    text = text.replace(/```([\s\S]*?)```/g, (match, code) => `<pre class="code-block"><code>${code.trim()}</code></pre>`);
    text = text.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

    // Bold
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/__(.*?)__/g, '<strong>$1</strong>');

    // Headers
    text = text.replace(/^### (.*$)/gim, '<h4 class="md-h4">$1</h4>');
    text = text.replace(/^## (.*$)/gim, '<h3 class="md-h3">$1</h3>');
    text = text.replace(/^# (.*$)/gim, '<h2 class="md-h2">$1</h2>');

    const lines = text.split("\n");
    let result = [];
    let listStack = [];

    function closeAllLists() {
        while (listStack.length > 0) {
            const tag = listStack.pop();
            result.push(`</${tag}>`);
        }
    }

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line) continue;

        const ulMatch = line.match(/^[\*\-]\s+(.*)$/);
        const olMatch = line.match(/^(\d+)\.\s+(.*)$/);

        if (ulMatch) {
            let content = ulMatch[1];
            content = content.replace(/(^|[^\*])\*([^\*]+)\*([^\*]|$)/g, '$1<em>$2</em>$3');
            if (listStack.length === 0 || listStack[listStack.length - 1] !== "ul") {
                if (listStack.includes("ol")) {
                    result.push('<ul class="md-ul">');
                    listStack.push("ul");
                } else {
                    closeAllLists();
                    result.push('<ul class="md-ul">');
                    listStack.push("ul");
                }
            }
            result.push(`<li>${content}</li>`);
        } else if (olMatch) {
            let content = olMatch[2];
            content = content.replace(/(^|[^\*])\*([^\*]+)\*([^\*]|$)/g, '$1<em>$2</em>$3');
            while (listStack.length > 0 && listStack[listStack.length - 1] === "ul") {
                result.push("</ul>");
                listStack.pop();
            }
            if (listStack.length === 0 || listStack[listStack.length - 1] !== "ol") {
                closeAllLists();
                result.push('<ol class="md-ol">');
                listStack.push("ol");
            }
            result.push(`<li>${content}</li>`);
        } else {
            closeAllLists();
            line = line.replace(/(^|[^\*])\*([^\*]+)\*([^\*]|$)/g, '$1<em>$2</em>$3');
            if (line.startsWith("<h2") || line.startsWith("<h3") || line.startsWith("<h4") || line.startsWith("<pre")) {
                result.push(line);
            } else {
                result.push(`<p class="md-p">${line}</p>`);
            }
        }
    }

    closeAllLists();
    return result.join("\n");
}

function appendMessage(role, content, sources = null, id = null) {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    appendMessageToDom(role, content, sources, id, timestamp);

    // Save to active conversation messages
    if (!id || !id.startsWith("msg-")) {
        const conv = getCurrentConversation();
        conv.messages.push({ role, content, sources, timestamp });
        saveConversations();
    }
}

function appendMessageToDom(role, content, sources = null, id = null, timestamp = null) {
    const thread = document.getElementById("chat-thread");
    if (!thread) return;

    const item = document.createElement("div");
    item.className = `chat-item ${role}-turn`;
    if (id) item.id = id;

    const time = timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const roleLabel = role === "user" ? I18N[currentLang].userRole : I18N[currentLang].botRole;

    const header = document.createElement("div");
    header.className = "item-header";
    header.innerHTML = `
        <span class="role-badge">${roleLabel}</span>
        <span class="time-stamp">${time}</span>
    `;

    const body = document.createElement("div");
    body.className = "item-body";
    if (role === "user") {
        body.textContent = content;
    } else {
        body.innerHTML = renderMarkdown(content);
    }

    item.appendChild(header);
    item.appendChild(body);

    if (sources && sources.length > 0) {
        const cite = document.createElement("div");
        cite.className = "citation-box";
        cite.innerHTML = `<strong>${I18N[currentLang].sourceLabel}:</strong> ` + sources.map(s => `${s.filename} (${I18N[currentLang].pageLabel} ${s.page})`).join(", ");
        item.appendChild(cite);
    }

    thread.appendChild(item);
    scrollCanvasToBottom();
}

function updateBotMessage(id, content, sources = null) {
    const msgEl = document.getElementById(id);
    if (msgEl) {
        const body = msgEl.querySelector(".item-body");
        if (body) {
            body.innerHTML = renderMarkdown(content);
        }

        const oldCite = msgEl.querySelector(".citation-box");
        if (oldCite) oldCite.remove();

        if (sources && sources.length > 0) {
            const cite = document.createElement("div");
            cite.className = "citation-box";
            cite.innerHTML = `<strong>${I18N[currentLang].sourceLabel}:</strong> ` + sources.map(s => `${s.filename} (${I18N[currentLang].pageLabel} ${s.page})`).join(", ");
            msgEl.appendChild(cite);
        }
    }

    // Save final message to active conversation
    const conv = getCurrentConversation();
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    conv.messages.push({ role: "bot", content, sources, timestamp });
    saveConversations();

    scrollCanvasToBottom();
}

function scrollCanvasToBottom() {
    const canvas = document.getElementById("canvas-scroll");
    if (canvas) {
        canvas.scrollTop = canvas.scrollHeight;
        requestAnimationFrame(() => {
            canvas.scrollTo({ top: canvas.scrollHeight, behavior: 'smooth' });
        });
    }
}

function clearChat() {
    const conv = getCurrentConversation();
    conv.messages = [
        {
            role: "bot",
            content: I18N[currentLang].botWelcome,
            sources: null,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
    ];
    saveConversations();
    renderActiveConversation();

    const qInput = document.getElementById("query-input");
    if (qInput) qInput.focus();
}

// ==========================================================================
// Admin Rules & Features
// ==========================================================================

async function loadAdminRules() {
    try {
        const res = await fetch(`${API_BASE}/rules`);
        if (res.ok) {
            const rules = await res.json();
            document.getElementById("rule-strict-mode").checked = rules.strict_mode ?? true;
            document.getElementById("rule-system-role").value = rules.system_role || "";
            document.getElementById("rule-no-answer").value = rules.no_answer_response || "";
            document.getElementById("rule-policies").value = (rules.business_policies || []).join("\n");
            document.getElementById("rule-faq").value = JSON.stringify(rules.direct_faq || [], null, 2);
            document.getElementById("rule-forbidden").value = (rules.forbidden_keywords || []).join(", ");
        }
    } catch (e) {
        console.error("Failed to load rules:", e);
    }
}

async function saveAdminRules() {
    const statusSpan = document.getElementById("rules-save-status");
    statusSpan.textContent = currentLang === 'vi' ? "Đang lưu..." : "Saving...";
    statusSpan.style.color = "var(--text-subtle)";

    try {
        let faqParsed = [];
        const faqRaw = document.getElementById("rule-faq").value.trim();
        if (faqRaw) {
            try {
                faqParsed = JSON.parse(faqRaw);
            } catch (err) {
                statusSpan.textContent = "JSON Error in FAQ field.";
                statusSpan.style.color = "var(--danger-ink)";
                return;
            }
        }

        const rules = {
            strict_mode: document.getElementById("rule-strict-mode").checked,
            system_role: document.getElementById("rule-system-role").value.trim(),
            no_answer_response: document.getElementById("rule-no-answer").value.trim(),
            business_policies: document.getElementById("rule-policies").value.split("\n").map(s => s.trim()).filter(Boolean),
            direct_faq: faqParsed,
            forbidden_keywords: document.getElementById("rule-forbidden").value.split(",").map(s => s.trim()).filter(Boolean)
        };

        const res = await fetch(`${API_BASE}/rules`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(rules)
        });

        if (res.ok) {
            statusSpan.textContent = currentLang === 'vi' ? "Đã lưu quy định thành công." : "Rules saved successfully.";
            statusSpan.style.color = "var(--accent-ink)";
            setTimeout(() => { statusSpan.textContent = ""; }, 3500);
        } else {
            statusSpan.textContent = "Failed to save rules.";
            statusSpan.style.color = "var(--danger-ink)";
        }
    } catch (e) {
        statusSpan.textContent = "Error: " + e.message;
        statusSpan.style.color = "var(--danger-ink)";
    }
}

async function handleAdminUpload() {
    const fileInput = document.getElementById("admin-file-input");
    const statusBox = document.getElementById("admin-upload-status");

    if (!fileInput.files || fileInput.files.length === 0) {
        showAlert(statusBox, currentLang === 'vi' ? "Vui lòng chọn ít nhất một file." : "Please select one or more files.", "error");
        return;
    }

    showAlert(statusBox, currentLang === 'vi' ? `Đang nạp ${fileInput.files.length} file vào kho kiến thức...` : `Ingesting ${fileInput.files.length} file(s) into system knowledge...`, "info");

    for (let file of fileInput.files) {
        const fd = new FormData();
        fd.append("file", file);
        try {
            await fetch(`${API_BASE}/documents/upload`, { method: "POST", body: fd });
        } catch (e) {
            console.error("Upload error:", e);
        }
    }

    showAlert(statusBox, currentLang === 'vi' ? "Các file đã được nạp thành công vào hệ thống." : "Files ingested successfully into system knowledge base.", "success");
    fileInput.value = "";
    loadDocuments();
}

async function handleManualIngest() {
    const title = document.getElementById("manual-title").value.trim();
    const text = document.getElementById("manual-content").value.trim();
    const statusBox = document.getElementById("manual-status");

    if (!title || !text) {
        showAlert(statusBox, currentLang === 'vi' ? "Vui lòng nhập cả tiêu đề và nội dung." : "Please provide both title and content.", "error");
        return;
    }

    showAlert(statusBox, currentLang === 'vi' ? "Đang sinh embedding và lưu quy định..." : "Embedding and saving manual policy...", "info");

    try {
        const res = await fetch(`${API_BASE}/documents/raw-text`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, text })
        });

        if (res.ok) {
            showAlert(statusBox, currentLang === 'vi' ? "Đã lưu quy định vào kho kiến thức." : "Manual policy saved to knowledge base.", "success");
            document.getElementById("manual-title").value = "";
            document.getElementById("manual-content").value = "";
            loadDocuments();
        } else {
            const err = await res.text();
            showAlert(statusBox, `Error: ${err}`, "error");
        }
    } catch (e) {
        showAlert(statusBox, `Error: ${e.message}`, "error");
    }
}

async function deleteDocument(filename) {
    const confirmMsg = currentLang === 'vi' 
        ? `Xóa tài liệu '${filename}' khỏi kho kiến thức hệ thống?`
        : `Delete '${filename}' from system knowledge base?`;
    if (!confirm(confirmMsg)) return;
    try {
        const res = await fetch(`${API_BASE}/documents/${encodeURIComponent(filename)}`, { method: "DELETE" });
        if (res.ok) {
            loadDocuments();
        }
    } catch (e) {
        alert("Failed to delete: " + e.message);
    }
}

async function handleResetDatabase() {
    const confirmMsg = currentLang === 'vi'
        ? "Bạn có chắc chắn muốn xóa TOÀN BỘ tài liệu và làm mới cơ sở dữ liệu vector?"
        : "Are you sure you want to delete ALL documents and reset system vector DB?";
    if (!confirm(confirmMsg)) return;
    try {
        const res = await fetch(`${API_BASE}/documents`, { method: "DELETE" });
        if (res.ok) {
            loadDocuments();
            clearChat();
            alert(currentLang === 'vi' ? "Đã xóa sạch cơ sở dữ liệu kiến thức." : "System knowledge database cleared.");
        }
    } catch (e) {
        alert("Failed to reset: " + e.message);
    }
}

function showAlert(el, msg, type) {
    if (!el) return;
    el.style.display = "block";
    el.textContent = msg;
    if (type === "error") {
        el.style.backgroundColor = "rgba(138, 45, 45, 0.1)";
        el.style.color = "var(--danger-ink)";
    } else if (type === "success") {
        el.style.backgroundColor = "rgba(44, 74, 62, 0.1)";
        el.style.color = "var(--accent-ink)";
    } else {
        el.style.backgroundColor = "var(--accent-highlight)";
        el.style.color = "var(--text-primary)";
    }
}

// ==========================================================================
// LLM Model Storage & Path Management
// ==========================================================================

let currentModelSettings = null;

async function loadModelSettings() {
    const badge = document.getElementById("model-status-badge");
    const pathInput = document.getElementById("setting-model-path");
    const typeSelect = document.getElementById("setting-model-type");
    if (!badge || !pathInput) return;

    try {
        const res = await fetch(`${API_BASE}/settings/model`);
        if (res.ok) {
            const data = await res.json();
            currentModelSettings = data;

            if (!pathInput.dataset.userEdited) {
                pathInput.value = data.local_model_path || "";
            }
            if (typeSelect && data.local_model_type) {
                typeSelect.value = data.local_model_type;
            }

            updateModelStatusBadge(data.exists, data.backend);
        }
    } catch (e) {
        console.warn("Failed to load model settings:", e);
    }
}

function updateModelStatusBadge(exists, backend) {
    const badge = document.getElementById("model-status-badge");
    if (!badge) return;
    const dict = I18N[currentLang];

    if (exists) {
        badge.className = "badge badge-valid";
        const backendText = backend ? ` • ${backend}` : "";
        badge.textContent = `${dict.modelPathValid}${backendText}`;
    } else {
        badge.className = "badge badge-invalid";
        badge.textContent = dict.modelPathInvalid;
    }
}

async function saveModelSettings() {
    const pathInput = document.getElementById("setting-model-path");
    const typeSelect = document.getElementById("setting-model-type");
    const statusSpan = document.getElementById("model-save-status");
    if (!pathInput || !typeSelect || !statusSpan) return;

    const path = pathInput.value.trim();
    const type = typeSelect.value;
    const dict = I18N[currentLang];

    statusSpan.textContent = currentLang === 'vi' ? "Đang kiểm tra & nạp lại mô hình..." : "Checking & reloading model...";
    statusSpan.style.color = "var(--text-subtle)";

    try {
        const res = await fetch(`${API_BASE}/settings/model`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                local_model_path: path,
                local_model_type: type
            })
        });

        if (res.ok) {
            const result = await res.json();
            currentModelSettings = result;
            delete pathInput.dataset.userEdited;
            statusSpan.textContent = dict.modelSavedSuccess;
            statusSpan.style.color = "var(--accent-ink)";
            updateModelStatusBadge(result.exists, result.backend);
            setTimeout(() => { statusSpan.textContent = ""; }, 4000);
        } else {
            const err = await res.text();
            statusSpan.textContent = `${dict.modelSavedFailed}: ${err}`;
            statusSpan.style.color = "var(--danger-ink)";
        }
    } catch (e) {
        statusSpan.textContent = `${dict.modelSavedFailed}: ${e.message}`;
        statusSpan.style.color = "var(--danger-ink)";
    }
}

function fillPresetPath(preset) {
    const pathInput = document.getElementById("setting-model-path");
    const typeSelect = document.getElementById("setting-model-type");
    if (!pathInput) return;

    if (preset === 'mac-mlx') {
        pathInput.value = "/Users/daotan/.lmstudio/models/lmstudio-community/Qwen3.5-2B-MLX-4bit";
        if (typeSelect) typeSelect.value = "qwen";
    } else if (preset === 'win-gguf') {
        pathInput.value = "C:\\Users\\User\\.lmstudio\\models\\qwen2.5-3b-instruct-q4_k_m.gguf";
        if (typeSelect) typeSelect.value = "qwen";
    }
    pathInput.dataset.userEdited = "true";
    pathInput.focus();
}

