// ==========================================================================
// DocuRAG — Minimalist Paper Web App Logic (Full-Screen & Kindle UX)
// ==========================================================================

const API_BASE = "";

let currentPortal = "user";
let currentTheme = localStorage.getItem("docurag_theme") || "theme-sepia";
let currentTexture = localStorage.getItem("docurag_texture") || "texture-kindle";

document.addEventListener("DOMContentLoaded", () => {
    // Apply saved theme and texture
    setPaperTheme(currentTheme);
    setPaperTexture(currentTexture);
    
    // Load data
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
                chosenLabel.textContent = "Choose file to ingest";
            }
        });
    }

    // Auto focus prompt input
    const qInput = document.getElementById("query-input");
    if (qInput) qInput.focus();
});

// Synchronize Body Classes for Theme + Texture
function updateBodyClasses() {
    // Remove all themes
    document.body.classList.remove("theme-sepia", "theme-eink", "theme-dark");
    // Remove all textures
    document.body.classList.remove("texture-kindle", "texture-parchment", "texture-linen", "texture-smooth");
    
    // Add current active theme and texture
    document.body.classList.add(currentTheme);
    document.body.classList.add(currentTexture);
}

// Paper Texture Handler
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

// Paper Tone Selector
function setPaperTheme(themeName) {
    currentTheme = themeName;
    localStorage.setItem("docurag_theme", themeName);
    updateBodyClasses();

    // Update tone button active states
    document.querySelectorAll(".tone-btn").forEach(btn => btn.classList.remove("active"));
    if (themeName === "theme-sepia") {
        document.querySelector(".tone-sepia")?.classList.add("active");
    } else if (themeName === "theme-eink") {
        document.querySelector(".tone-eink")?.classList.add("active");
    } else if (themeName === "theme-dark") {
        document.querySelector(".tone-dark")?.classList.add("active");
    }
}

// Portal Switching (User vs Admin)
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



// Sidebar Toggle (Desktop Collapse & Mobile Off-canvas Drawer)
function toggleSidebar() {
    const layout = document.querySelector(".workspace-layout");
    const sidebar = document.getElementById("sidebar-margin");
    const backdrop = document.getElementById("sidebar-backdrop");
    
    if (window.innerWidth <= 768) {
        if (sidebar) {
            sidebar.classList.toggle("mobile-open");
        }
        if (backdrop) {
            backdrop.classList.toggle("active");
        }
    } else {
        if (layout) {
            layout.classList.toggle("sidebar-collapsed");
        }
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

// Fullscreen API Toggle
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

// Admin Sub-tabs
function switchAdminTab(tabKey) {
    document.querySelectorAll(".subnav-item").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".subtab-pane").forEach(p => p.classList.remove("active"));

    const btn = event.currentTarget || event.target;
    btn.classList.add("active");
    document.getElementById(`admintab-${tabKey}`).classList.add("active");
}

// Quick Prompt Sender
function sendQuickPrompt(text) {
    const qInput = document.getElementById("query-input");
    if (qInput) {
        qInput.value = text;
        const form = document.getElementById("chat-form");
        form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    }
}

// Load Ingested Documents
async function loadDocuments() {
    try {
        const res = await fetch(`${API_BASE}/documents`);
        if (res.ok) {
            const data = await res.json();
            const docs = data.documents || [];
            
            // Badge & Footer updates
            const badge = document.getElementById("doc-count-badge");
            if (badge) badge.textContent = `${docs.length} files`;
            const footerInfo = document.getElementById("footer-doc-info");
            if (footerInfo) footerInfo.textContent = `${docs.length} documents in memory`;

            // Populate user dropdown
            const userSelect = document.getElementById("user-doc-select");
            const previousVal = userSelect.value;
            userSelect.innerHTML = '<option value="All Documents">All Ingested Documents</option>';
            docs.forEach(d => {
                const opt = document.createElement("option");
                opt.value = d;
                opt.textContent = d;
                userSelect.appendChild(opt);
            });
            if (docs.includes(previousVal)) {
                userSelect.value = previousVal;
            }
            onScopeChange();

            // Populate admin list
            const adminList = document.getElementById("documents-list");
            if (adminList) {
                adminList.innerHTML = "";
                if (docs.length === 0) {
                    adminList.innerHTML = '<p class="card-subtext">No documents in the database.</p>';
                } else {
                    docs.forEach(d => {
                        const item = document.createElement("div");
                        item.className = "repo-item";
                        item.innerHTML = `
                            <span class="repo-item-name">📄 ${d}</span>
                            <button class="btn btn-danger btn-sm" onclick="deleteDocument('${d}')">Delete</button>
                        `;
                        adminList.appendChild(item);
                    });
                }
            }
        }
    } catch (e) {
        console.error("Failed to load documents:", e);
    }
}

function onScopeChange() {
    const sel = document.getElementById("user-doc-select");
    const indicator = document.getElementById("scope-indicator");
    if (sel && indicator) {
        indicator.textContent = `Scope: ${sel.value}`;
    }
}

// User Document Upload
async function handleUserUpload() {
    const fileInput = document.getElementById("user-file-input");
    const statusBox = document.getElementById("upload-status");
    const btn = document.getElementById("btn-upload-user");

    if (!fileInput.files || fileInput.files.length === 0) {
        showAlert(statusBox, "Please select a file first.", "error");
        return;
    }

    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append("file", file);

    btn.disabled = true;
    showAlert(statusBox, `Ingesting and vectorizing ${file.name}...`, "info");

    try {
        const res = await fetch(`${API_BASE}/documents/upload`, {
            method: "POST",
            body: formData
        });

        if (res.ok) {
            const data = await res.json();
            showAlert(statusBox, `Ingested: ${data.filename} (${data.chunks} chunks)`, "success");
            fileInput.value = "";
            document.getElementById("user-chosen-file").textContent = "Choose file to ingest";
            
            await loadDocuments();
            document.getElementById("user-doc-select").value = data.filename;
            onScopeChange();
        } else {
            const err = await res.text();
            showAlert(statusBox, `Upload failed: ${err}`, "error");
        }
    } catch (e) {
        showAlert(statusBox, `Connection error: ${e.message}`, "error");
    } finally {
        btn.disabled = false;
    }
}

// Handle Query Submission
async function handleSendQuery(e) {
    e.preventDefault();
    const queryInput = document.getElementById("query-input");
    const query = queryInput.value.trim();
    if (!query) return;

    const scope = document.getElementById("user-doc-select").value;
    const filenameFilter = scope === "All Documents" ? null : scope;

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

function appendMessage(role, content, sources = null, id = null) {
    const thread = document.getElementById("chat-thread");
    const item = document.createElement("div");
    item.className = `chat-item ${role}-turn`;
    if (id) item.id = id;

    const header = document.createElement("div");
    header.className = "item-header";
    header.innerHTML = `
        <span class="role-badge">${role === "user" ? "You" : "Assistant"}</span>
        <span class="time-stamp">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
    `;

    const body = document.createElement("div");
    body.className = "item-body";
    body.textContent = content;

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
    if (!msgEl) return;

    const body = msgEl.querySelector(".item-body");
    if (body) {
        body.textContent = content;
    }

    if (sources && sources.length > 0) {
        const cite = document.createElement("div");
        cite.className = "citation-box";
        cite.innerHTML = "<strong>Source:</strong> " + sources.map(s => `${s.filename} (p.${s.page})`).join(", ");
        msgEl.appendChild(cite);
    }

    scrollCanvasToBottom();
}

function scrollCanvasToBottom() {
    const canvas = document.getElementById("canvas-scroll");
    if (canvas) {
        // Immediate scroll + delayed smooth frame to account for font reflow
        canvas.scrollTop = canvas.scrollHeight;
        requestAnimationFrame(() => {
            canvas.scrollTo({ top: canvas.scrollHeight, behavior: 'smooth' });
        });
    }
}

function clearChat() {
    const thread = document.getElementById("chat-thread");
    thread.innerHTML = `
        <div class="chat-item bot-turn">
            <div class="item-header">
                <span class="role-badge">Assistant</span>
                <span class="time-stamp">TDnook Reader</span>
            </div>
            <div class="item-body">
                <p>Cuộc trò chuyện đã được làm mới. Hãy tải lên tài liệu cá nhân hoặc đặt câu hỏi về các tài liệu đã nạp.</p>
            </div>
        </div>
    `;
    const qInput = document.getElementById("query-input");
    if (qInput) qInput.focus();
}

// --- ADMIN FEATURES ---
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

    showAlert(statusBox, `Ingesting ${fileInput.files.length} file(s)...`, "info");

    for (let file of fileInput.files) {
        const fd = new FormData();
        fd.append("file", file);
        try {
            await fetch(`${API_BASE}/documents/upload`, { method: "POST", body: fd });
        } catch (e) {
            console.error("Upload error:", e);
        }
    }

    showAlert(statusBox, "Files ingested successfully.", "success");
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
    if (!confirm(`Delete '${filename}' from knowledge base?`)) return;
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
    if (!confirm("Are you sure you want to delete ALL documents and reset vector DB?")) return;
    try {
        const res = await fetch(`${API_BASE}/documents`, { method: "DELETE" });
        if (res.ok) {
            loadDocuments();
            clearChat();
            alert("Database cleared.");
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
