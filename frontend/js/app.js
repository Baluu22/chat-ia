/**
 * MailCraft AI — Frontend Application
 * Handles email composition, AI integration, and UI interactions.
 */

// ─── DOM References ───
const elements = {
    // Form
    form: document.getElementById("email-form"),
    recipient: document.getElementById("email-recipient"),
    subject: document.getElementById("email-subject"),
    context: document.getElementById("email-context"),
    draft: document.getElementById("email-draft"),
    tone: document.getElementById("email-tone"),
    language: document.getElementById("email-language"),

    // Buttons
    btnGenerate: document.getElementById("btn-generate"),
    btnGenerateText: document.getElementById("btn-generate-text"),
    btnCopy: document.getElementById("btn-copy"),
    btnRegenerate: document.getElementById("btn-regenerate"),
    btnUseAsDraft: document.getElementById("btn-use-as-draft"),
    btnRetry: document.getElementById("btn-retry"),
    btnNewEmail: document.getElementById("new-email-btn"),
    menuToggle: document.getElementById("menu-toggle"),

    // Panels & States
    resultActions: document.getElementById("result-actions"),
    emptyState: document.getElementById("empty-state"),
    loadingState: document.getElementById("loading-state"),
    resultContent: document.getElementById("result-content"),
    errorState: document.getElementById("error-state"),
    errorMessage: document.getElementById("error-message"),
    resultEmail: document.getElementById("result-email"),

    // Sidebar
    sidebar: document.getElementById("sidebar"),
    sidebarOverlay: document.getElementById("sidebar-overlay"),

    // Toast
    toast: document.getElementById("toast"),
    toastMessage: document.getElementById("toast-message"),
};

// ─── State ───
let lastRequest = null;
let isProcessing = false;

// ─── API Communication ───

/**
 * Determines the correct API endpoint.
 * Uses relative path for Vercel (production) and localhost for local dev.
 */
function getApiUrl() {
    // If running on localhost with a file:// protocol or on port 5500 (Live Server),
    // use the local Express backend
    const loc = window.location;
    if (loc.protocol === "file:" || loc.port === "5500" || loc.port === "5501" || loc.port === "3001") {
        return "http://localhost:3000/api/chat";
    }
    // Otherwise use relative path (Vercel serverless function)
    return "/api/chat";
}

/**
 * Builds the message string to send to the AI based on form fields.
 */
function buildPrompt(action) {
    const recipient = elements.recipient.value.trim();
    const subject = elements.subject.value.trim();
    const context = elements.context.value.trim();
    const draft = elements.draft.value.trim();
    const tone = elements.tone.value;
    const language = elements.language.value;

    let prompt = "";

    // Define what action the user wants
    switch (action) {
        case "generar":
            if (draft) {
                prompt += `Mejorá el siguiente email.\n\n`;
            } else {
                prompt += `Redactá un email profesional.\n\n`;
            }
            break;
        case "reescribir":
            prompt += `Reescribí completamente el siguiente email, manteniendo la idea principal pero usando diferentes palabras y estructura.\n\n`;
            break;
        case "acortar":
            prompt += `Acortá el siguiente email, manteniendo la información esencial pero siendo mucho más breve y conciso.\n\n`;
            break;
        case "profesionalizar":
            prompt += `Hacé que el siguiente email suene mucho más profesional y formal.\n\n`;
            break;
        case "corregir_gramatica":
            prompt += `Corregí todos los errores gramaticales, ortográficos y de puntuación del siguiente email. Mantené el mismo contenido y estilo.\n\n`;
            break;
        case "redactar":
            prompt += `Redactá un email profesional desde cero.\n\n`;
            break;
        case "mejorar":
            prompt += `Mejorá el siguiente email para que sea más claro, profesional y efectivo.\n\n`;
            break;
        case "corregir":
            prompt += `Corregí los errores gramaticales y de ortografía del siguiente email.\n\n`;
            break;
        case "traducir":
            prompt += `Traducí el siguiente email.\n\n`;
            break;
        default:
            prompt += `Redactá o mejorá el siguiente email.\n\n`;
    }

    // Add context
    if (recipient) prompt += `Destinatario: ${recipient}\n`;
    if (subject) prompt += `Asunto: ${subject}\n`;
    prompt += `Tono deseado: ${tone}\n`;
    prompt += `Idioma: ${language}\n`;

    if (context) {
        prompt += `\nPropósito/contexto: ${context}\n`;
    }

    if (draft) {
        prompt += `\nEmail actual/borrador:\n---\n${draft}\n---\n`;
    }

    prompt += `\nRespondé ÚNICAMENTE con el email resultante. No incluyas explicaciones ni comentarios adicionales. Si se pide un email nuevo y no hay borrador, generalo basándote en el contexto proporcionado.`;

    return prompt;
}

/**
 * Sends the prompt to the backend API and returns the response.
 */
async function callAPI(prompt) {
    const url = getApiUrl();

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: prompt }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
        throw new Error(data.message || "Error del servidor");
    }

    return data.response;
}

// ─── UI State Management ───

function showState(stateName) {
    elements.emptyState.style.display = "none";
    elements.loadingState.style.display = "none";
    elements.resultContent.style.display = "none";
    elements.errorState.style.display = "none";
    elements.resultActions.style.display = "none";

    switch (stateName) {
        case "empty":
            elements.emptyState.style.display = "flex";
            break;
        case "loading":
            elements.loadingState.style.display = "flex";
            break;
        case "result":
            elements.resultContent.style.display = "block";
            elements.resultActions.style.display = "flex";
            break;
        case "error":
            elements.errorState.style.display = "flex";
            break;
    }
}

function setLoading(loading) {
    isProcessing = loading;

    if (loading) {
        elements.btnGenerate.classList.add("loading");
        elements.btnGenerate.disabled = true;
        elements.btnGenerateText.textContent = "Generando...";
    } else {
        elements.btnGenerate.classList.remove("loading");
        elements.btnGenerate.disabled = false;
        // Update button text based on whether there's a draft
        updateGenerateButtonText();
    }
}

function updateGenerateButtonText() {
    const hasDraft = elements.draft.value.trim().length > 0;
    elements.btnGenerateText.textContent = hasDraft ? "Mejorar Email" : "Generar Email";
}

function showToast(message, duration = 3000) {
    elements.toastMessage.textContent = message;
    elements.toast.classList.add("show");

    setTimeout(() => {
        elements.toast.classList.remove("show");
    }, duration);
}

function displayResult(text) {
    elements.resultEmail.textContent = text;
    elements.resultEmail.classList.remove("appearing");
    // Force reflow for animation restart
    void elements.resultEmail.offsetWidth;
    elements.resultEmail.classList.add("appearing");
    showState("result");
}

function showError(message) {
    elements.errorMessage.textContent = message || "Hubo un problema al conectar con el servidor. Intentá de nuevo.";
    showState("error");
}

// ─── Core Actions ───

async function processEmail(action) {
    if (isProcessing) return;

    const context = elements.context.value.trim();
    const draft = elements.draft.value.trim();

    // Validate: at least context or draft must exist
    if (!context && !draft) {
        elements.context.focus();
        elements.context.classList.add("form-input-error");
        setTimeout(() => elements.context.classList.remove("form-input-error"), 2000);
        showToast("Ingresá al menos el propósito del email o un borrador.", 4000);
        return;
    }

    // For actions that require a draft
    const draftRequired = ["reescribir", "acortar", "profesionalizar", "corregir_gramatica", "mejorar", "corregir"];
    if (draftRequired.includes(action) && !draft) {
        elements.draft.focus();
        showToast("Para esta acción necesitás un email existente en el campo de borrador.", 4000);
        return;
    }

    const prompt = buildPrompt(action);
    lastRequest = { action, prompt };

    setLoading(true);
    showState("loading");

    try {
        const result = await callAPI(prompt);
        displayResult(result);
    } catch (error) {
        console.error("Error al procesar email:", error);
        showError(error.message);
    } finally {
        setLoading(false);
    }
}

// ─── Event Listeners ───

// Form submit (primary action)
elements.form.addEventListener("submit", (e) => {
    e.preventDefault();
    const hasDraft = elements.draft.value.trim().length > 0;
    processEmail(hasDraft ? "mejorar" : "generar");
});

// Secondary action buttons
document.querySelectorAll(".btn-secondary[data-action]").forEach((btn) => {
    btn.addEventListener("click", () => {
        const action = btn.dataset.action;
        processEmail(action);
    });
});

// Sidebar quick actions
document.querySelectorAll(".sidebar-action[data-action]").forEach((btn) => {
    btn.addEventListener("click", () => {
        const action = btn.dataset.action;
        closeSidebar();

        // For "redactar", clear the form and focus on context
        if (action === "redactar") {
            clearForm();
            elements.context.focus();
            return;
        }

        // For "traducir", process immediately if there's a draft
        if (action === "traducir") {
            if (elements.draft.value.trim() || elements.resultEmail.textContent.trim()) {
                // If no draft but there's a result, use result as draft
                if (!elements.draft.value.trim() && elements.resultEmail.textContent.trim()) {
                    elements.draft.value = elements.resultEmail.textContent.trim();
                }
                processEmail(action);
            } else {
                elements.draft.focus();
                showToast("Primero necesitás un email para traducir.", 3000);
            }
            return;
        }

        // For "mejorar" and "corregir", focus on draft field
        if (action === "mejorar" || action === "corregir") {
            elements.draft.focus();
            if (elements.draft.value.trim()) {
                processEmail(action);
            } else {
                showToast("Pegá un email existente en el campo de borrador.", 3000);
            }
            return;
        }

        processEmail(action);
    });
});

// Copy button
elements.btnCopy.addEventListener("click", async () => {
    const text = elements.resultEmail.textContent;
    if (!text) return;

    try {
        await navigator.clipboard.writeText(text);
        showToast("Email copiado al portapapeles");
    } catch {
        // Fallback for older browsers
        const range = document.createRange();
        range.selectNodeContents(elements.resultEmail);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        document.execCommand("copy");
        sel.removeAllRanges();
        showToast("Email copiado al portapapeles");
    }
});

// Regenerate button
elements.btnRegenerate.addEventListener("click", () => {
    if (lastRequest) {
        processEmail(lastRequest.action);
    }
});

// Use as draft button
elements.btnUseAsDraft.addEventListener("click", () => {
    const text = elements.resultEmail.textContent;
    if (!text) return;

    elements.draft.value = text;
    updateGenerateButtonText();
    showToast("Email copiado al campo de borrador");

    // Scroll to compose panel on mobile
    if (window.innerWidth <= 1024) {
        document.getElementById("panel-compose").scrollIntoView({ behavior: "smooth" });
    }
});

// Retry button
elements.btnRetry.addEventListener("click", () => {
    if (lastRequest) {
        processEmail(lastRequest.action);
    } else {
        showState("empty");
    }
});

// New email button
elements.btnNewEmail.addEventListener("click", () => {
    clearForm();
    showState("empty");
    closeSidebar();
    elements.context.focus();
});

// Update button text when draft changes
elements.draft.addEventListener("input", updateGenerateButtonText);

// Mobile sidebar toggle
elements.menuToggle.addEventListener("click", toggleSidebar);
elements.sidebarOverlay.addEventListener("click", closeSidebar);

// Close sidebar on Escape
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        closeSidebar();
    }
});

// ─── Utility Functions ───

function clearForm() {
    elements.recipient.value = "";
    elements.subject.value = "";
    elements.context.value = "";
    elements.draft.value = "";
    elements.tone.value = "profesional";
    elements.language.value = "español";
    updateGenerateButtonText();
}

function toggleSidebar() {
    elements.sidebar.classList.toggle("open");
    elements.sidebarOverlay.classList.toggle("active");
}

function closeSidebar() {
    elements.sidebar.classList.remove("open");
    elements.sidebarOverlay.classList.remove("active");
}

// ─── Initialize ───
updateGenerateButtonText();