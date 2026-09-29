// ==========================================================================
// DocuRAG — Minimalist Paper Web App Logic (Full-Screen & Kindle UX)
// Supports Multi-Conversation History, User Session Documents & Cross-Referencing
// ==========================================================================

const API_BASE = "";

let currentPortal = "user";
let currentTheme = localStorage.getItem("docurag_theme") || "theme-sepia";
let currentTexture = localStorage.getItem("docurag_texture") || "texture-kindle";

// Multi-Conversation State
let conversations = [];
let currentConvId = null;

document.addEventListener("DOMContentLoaded", () => {
    // Apply saved theme and texture
    setPaperTheme(currentTheme);
    setPaperTexture(currentTexture);
    
    // Initialize Conversations
    initConversations();

    // Load Admin Data & Documents
    loadDocuments();
    loadAdminRules();

    // User file input listener
    const fileInput = document.getElementById("user-file-input");
    const chosenLabel = document.getElementById("user-chosen-file");
    if (fileInput) {
        fileInput.addEventListener("change", () => {
            if (fileInput.files.length > 0) {
                chosenLabel.textContent = fileInput.files[0].name;
            } else {
                chosenLabel.textContent = "Choose file to attach";
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
        const defaultConv = makeNewConversationObject("Cuộc hội thoại mới");
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

function makeNewConversationObject(title = "Cuộc hội thoại mới") {
    return {
        id: "conv_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
        title: title,
        createdAt: new Date().toISOString(),
        userDoc: null, // { filename, text, pages, char_count }
        messages: [
            {
                role: "bot",
                content: "Chào bạn. Hãy đính kèm tài liệu cá nhân để đối chiếu với kiến thức hệ thống hoặc đặt câu hỏi trực tiếp. Tôi sẽ trả lời ngắn gọn, chuẩn mực theo đúng ngôn ngữ của bạn.",
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
    const newConv = makeNewConversationObject("Cuộc hội thoại mới");
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
        const newConv = makeNewConversationObject("Cuộc hội thoại mới");
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
        countBadge.textContent = `${conversations.length} ${conversations.length === 1 ? 'chat' : 'chats'}`;
    }

    listEl.innerHTML = "";
    conversations.forEach(conv => {
        const item = document.createElement("div");
        item.className = `conversation-item ${conv.id === currentConvId ? 'active' : ''}`;
        item.onclick = () => switchConversation(conv.id);

        const dateStr = new Date(conv.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' });

        item.innerHTML = `
            <div class="conv-info">
                <span class="conv-title">${escapeHtml(conv.title)}</span>
                <span class="conv-time">${dateStr} • ${conv.messages.length} msgs${conv.userDoc ? ' • 📄 Attached' : ''}</span>
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
        if (nameEl) nameEl.textContent = `📄 ${conv.userDoc.filename}`;
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

    appendMessage("bot", `Đã gỡ tài liệu đính kèm **${removedName}** khỏi cuộc trò chuyện này.`);
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

function setPaperTexture(textureClass) {
    currentTexture = textureClass;
    localStorage.setItem("docurag_texture", textureClass);
    updateBodyClasses();
    
    const sel = document.getElementById("texture-selector");
    if (sel) {
        sel.value = textureClass;
    }
}

function setPaperTheme(themeName) {
    currentTheme = themeName;
    localStorage.setItem("docurag_theme", themeName);
    updateBodyClasses();

    document.querySelectorAll(".tone-btn").forEach(btn => btn.classList.remove("active"));
    if (themeName === "theme-sepia") {
        document.querySelector(".tone-sepia")?.classList.add("active");
    } else if (themeName === "theme-eink") {
        document.querySelector(".tone-eink")?.classList.add("active");
    } else if (themeName === "theme-dark") {
        document.querySelector(".tone-dark")?.classList.add("active");
    }
}

function switchPortal(portal) {
    currentPortal = portal;
    document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));
    document.querySelectorAll(".portal-view").forEach(el => el.classList.remove("active"));

    if (portal === "user") {
        document.getElementById("nav-user").classList.add("active");
        document.getElementById("portal-user").classList.add("active");
        const qInput = document.getElementById("query-input");
        if (qInput) qInput.focus();
    } else {
        document.getElementById("nav-admin").classList.add("active");
        document.getElementById("portal-admin").classList.add("active");
        loadAdminRules();
        loadDocuments();
    }
}

function toggleSidebar() {
    const layout = document.querySelector(".workspace-layout");
    const sidebar = document.getElementById("sidebar-margin");
    const backdrop = document.getElementById("sidebar-backdrop");
    
    if (window.innerWidth <= 768) {
        if (sidebar) sidebar.classList.toggle("mobile-open");
        if (backdrop) backdrop.classList.toggle("active");
    } else {
        if (layout) layout.classList.toggle("sidebar-collapsed");
    }
}

function closeMobileSidebar() {
    if (window.innerWidth <= 768) {
        const sidebar = document.getElementById("sidebar-margin");
        const backdrop = document.getElementById("sidebar-backdrop");
        if (sidebar) sidebar.classList.remove("mobile-open");
        if (backdrop) backdrop.classList.remove("active");
    }
}

function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.warn(`Error attempting to enable full-screen mode: ${err.message}`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

function switchAdminTab(tabKey) {
    document.querySelectorAll(".subnav-item").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".subtab-pane").forEach(p => p.classList.remove("active"));

    const btn = event.currentTarget || event.target;
    btn.classList.add("active");
    document.getElementById(`admintab-${tabKey}`).classList.add("active");
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
                select.innerHTML = '<option value="All Documents">All System Knowledge</option>';
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
                badge.textContent = `${docs.length} files`;
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
    const listEl = document.getElementById("admin-doc-list");
    if (!listEl) return;

    if (docs.length === 0) {
        listEl.innerHTML = `
            <div class="empty-state">
                <p>No documents in system knowledge repository yet.</p>
            </div>
        `;
        return;
    }

    let html = `
        <div class="doc-table">
            <div class="table-head">
                <span>Filename</span>
                <span>Type</span>
                <span style="text-align: right;">Action</span>
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
                    <button class="btn-delete" onclick="deleteDocument('${escapeHtml(doc)}')">Delete</button>
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
        indicator.textContent = `Scope: ${val}`;
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
        showAlert(statusBox, "Please choose a file to attach.", "error");
        return;
    }

    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append("file", file);

    btn.disabled = true;
    showAlert(statusBox, `Parsing and reading ${file.name}...`, "info");

    try {
        const res = await fetch(`${API_BASE}/documents/parse-user-file`, {
            method: "POST",
            body: formData
        });

        if (res.ok) {
            const data = await res.json();
            showAlert(statusBox, `Attached: ${data.filename} (${data.pages} pages)`, "success");
            fileInput.value = "";
            document.getElementById("user-chosen-file").textContent = "Choose file to attach";

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

            appendMessage("bot", `Đã đính kèm tài liệu **${data.filename}** (${data.pages} trang / ${data.char_count} ký tự). Tài liệu này được dùng riêng cho cuộc trò chuyện hiện tại và sẽ được đối chiếu với kiến thức hệ thống.`);
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
    if (conv.title === "Cuộc hội thoại mới" && query.length > 0) {
        conv.title = query.slice(0, 32) + (query.length > 32 ? "..." : "");
        renderConversationList();
    }

    // Append User Message
    appendMessage("user", query);
    queryInput.value = "";

    // Append Assistant Loading Turn
    const botMsgId = "msg-" + Date.now();
    appendMessage("bot", "Searching document context and applying business rules...", null, botMsgId);

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

    const header = document.createElement("div");
    header.className = "item-header";
    header.innerHTML = `
        <span class="role-badge">${role === "user" ? "You" : "Assistant"}</span>
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
        cite.innerHTML = "<strong>Source:</strong> " + sources.map(s => `${s.filename} (p.${s.page})`).join(", ");
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
            cite.innerHTML = "<strong>Source:</strong> " + sources.map(s => `${s.filename} (p.${s.page})`).join(", ");
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
            content: "Cuộc trò chuyện đã được làm mới. Hãy đính kèm tài liệu cá nhân để đối chiếu với kiến thức hệ thống hoặc đặt câu hỏi trực tiếp.",
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
    try {
        let parsedFaq = [];
        try {
            parsedFaq = JSON.parse(document.getElementById("rule-faq").value);
        } catch (e) {
            statusSpan.textContent = "Error: Invalid JSON in Direct FAQ.";
            statusSpan.style.color = "var(--danger-ink)";
            return;
        }

        const rules = {
            strict_mode: document.getElementById("rule-strict-mode").checked,
            system_role: document.getElementById("rule-system-role").value.trim(),
            no_answer_response: document.getElementById("rule-no-answer").value.trim(),
            business_policies: document.getElementById("rule-policies").value.split("\n").map(s => s.trim()).filter(Boolean),
            direct_faq: parsedFaq,
            forbidden_keywords: document.getElementById("rule-forbidden").value.split(",").map(s => s.trim()).filter(Boolean)
        };

        const res = await fetch(`${API_BASE}/rules`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(rules)
        });

        if (res.ok) {
            statusSpan.textContent = "Rules saved successfully.";
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
        showAlert(statusBox, "Please select one or more files.", "error");
        return;
    }

    showAlert(statusBox, `Ingesting ${fileInput.files.length} file(s) into system knowledge...`, "info");

    for (let file of fileInput.files) {
        const fd = new FormData();
        fd.append("file", file);
        try {
            await fetch(`${API_BASE}/documents/upload`, { method: "POST", body: fd });
        } catch (e) {
            console.error("Upload error:", e);
        }
    }

    showAlert(statusBox, "Files ingested successfully into system knowledge base.", "success");
    fileInput.value = "";
    loadDocuments();
}

async function handleManualIngest() {
    const title = document.getElementById("manual-title").value.trim();
    const text = document.getElementById("manual-content").value.trim();
    const statusBox = document.getElementById("manual-status");

    if (!title || !text) {
        showAlert(statusBox, "Please provide both title and content.", "error");
        return;
    }

    showAlert(statusBox, "Embedding and saving manual policy...", "info");

    try {
        const res = await fetch(`${API_BASE}/documents/raw-text`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, text })
        });

        if (res.ok) {
            showAlert(statusBox, "Manual policy saved to knowledge base.", "success");
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
    if (!confirm(`Delete '${filename}' from system knowledge base?`)) return;
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
    if (!confirm("Are you sure you want to delete ALL documents and reset system vector DB?")) return;
    try {
        const res = await fetch(`${API_BASE}/documents`, { method: "DELETE" });
        if (res.ok) {
            loadDocuments();
            clearChat();
            alert("System knowledge database cleared.");
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
