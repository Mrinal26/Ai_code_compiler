const runButton = document.getElementById("run-button");
const askAiButton = document.getElementById("ask-ai-button");
const runLoader = document.getElementById("run-loader");
const testLoader = document.getElementById("test-loader");
const askLoader = document.getElementById("ask-loader");
const runButtonLabel = document.getElementById("run-button-label");
const testButtonLabel = document.getElementById("test-button-label");
const askButtonLabel = document.getElementById("ask-button-label");
const languageInput = document.getElementById("language");
const snippetSelect = document.getElementById("snippet-select");
const loadSnippetButton = document.getElementById("load-snippet-button");
const providerInput = document.getElementById("provider");
const modelInput = document.getElementById("ai_model");
const baseUrlInput = document.getElementById("base_url");
const apiKeyInput = document.getElementById("api_key");
const apiKeyLabel = document.getElementById("api-key-label");
const baseUrlGroup = document.getElementById("base-url-group");
const apiKeyGroup = document.getElementById("api-key-group");
const toggleSetupButton = document.getElementById("toggle-setup-button");
const toggleSetupIcon = document.getElementById("toggle-setup-icon");
const setupBody = document.getElementById("setup-body");
const toggleHistoryButton = document.getElementById("toggle-history-button");
const toggleHistoryIcon = document.getElementById("toggle-history-icon");
const historyBody = document.getElementById("history-body");
const copySetupButton = document.getElementById("copy-setup-button");
const testAiButton = document.getElementById("test-ai-button");
const setupTitle = document.getElementById("setup-title");
const setupDescription = document.getElementById("setup-description");
const setupCommand = document.getElementById("setup-command");
const setupNote = document.getElementById("setup-note");
const providerWarning = document.getElementById("provider-warning");
const connectionTestResult = document.getElementById("connection-test-result");
const codeInput = document.getElementById("code");
const stdinInput = document.getElementById("stdin_input");
const aiQuestionInput = document.getElementById("ai_question");
const aiAnswerBox = document.getElementById("ai_answer");
const copyStdoutButton = document.getElementById("copy-stdout-button");
const copyStderrButton = document.getElementById("copy-stderr-button");
const copyExplanationButton = document.getElementById("copy-explanation-button");
const refreshHistoryButton = document.getElementById("refresh-history-button");
const historyList = document.getElementById("history-list");
const stdoutBox = document.getElementById("stdout");
const stderrBox = document.getElementById("stderr");
const explanationBox = document.getElementById("llm_explanation");
const statusPill = document.getElementById("status-pill");
const metaText = document.getElementById("meta-text");
const tabButtons = document.querySelectorAll(".tab-button");
const tabPanels = document.querySelectorAll(".tab-panel");
const SESSION_STORAGE_KEY = "compiler_bot_session_id";

const SNIPPETS = {
    hello_world: {
        code: 'print("Hello from Compiler Bot")',
        stdin: "",
    },
    input_example: {
        code: "name = input()\nprint(f\"Hello, {name}!\")",
        stdin: "Mrinal",
    },
    loop_example: {
        code: "for number in range(1, 6):\n    print(f\"Step {number}\")",
        stdin: "",
    },
    error_example: {
        code: "items = [1, 2, 3]\nprint(items[10])",
        stdin: "",
    },
};

function getOrCreateSessionId() {
    const existing = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (existing) {
        return existing;
    }

    const newSessionId = crypto.randomUUID();
    window.localStorage.setItem(SESSION_STORAGE_KEY, newSessionId);
    return newSessionId;
}

const sessionId = getOrCreateSessionId();

function setStatus(status, message) {
    statusPill.textContent = status;
    statusPill.className = "status-pill";

    if (status) {
        statusPill.classList.add(status.toLowerCase());
    }

    metaText.textContent = message;
}

function getAiConfig() {
    return {
        provider: providerInput.value,
        model: modelInput.value.trim(),
        base_url: baseUrlInput.value.trim(),
        api_key: apiKeyInput.value.trim() || null,
    };
}

function setButtonLoading(button, loader, labelElement, isLoading, loadingText, idleText) {
    button.disabled = isLoading;
    loader.classList.toggle("hidden", !isLoading);
    labelElement.textContent = isLoading ? loadingText : idleText;
}

function toggleSetupPanel() {
    const isHidden = setupBody.classList.contains("hidden");
    setupBody.classList.toggle("hidden", !isHidden);
    toggleSetupIcon.classList.toggle("open", isHidden);
    toggleSetupIcon.textContent = isHidden ? "+" : "+";
}

function toggleHistoryPanel() {
    const isHidden = historyBody.classList.contains("hidden");
    historyBody.classList.toggle("hidden", !isHidden);
    toggleHistoryIcon.classList.toggle("open", isHidden);
    toggleHistoryIcon.textContent = isHidden ? "+" : "+";
}

function activateTab(panelId) {
    tabButtons.forEach((button) => {
        button.classList.toggle("active", button.dataset.tab === panelId);
    });

    tabPanels.forEach((panel) => {
        panel.classList.toggle("active", panel.id === panelId);
    });
}

function syncProviderFields() {
    const provider = providerInput.value;
    const needsApiKey = provider === "openrouter";
    apiKeyGroup.classList.toggle("hidden", !needsApiKey);
    baseUrlGroup.classList.toggle("hidden", provider !== "ollama");

    if (provider === "openrouter") {
        modelInput.value = "openrouter/free";

        apiKeyLabel.textContent = "OpenRouter API Key";
        apiKeyInput.placeholder = "Paste your OpenRouter API key";
        setupTitle.textContent = "Use OpenRouter With Your Own API Key";
        setupDescription.textContent =
            "OpenRouter works better for hosted usage. Ask the user to paste their own API key and choose a model.";
        setupCommand.textContent = "Create an OpenRouter key at https://openrouter.ai/keys";
        setupNote.textContent =
            "Tip: This keeps usage tied to the user's own key, which is the simplest hosted AI path. The default hosted model is openrouter/free.";
        providerWarning.textContent =
            "Hosted app tip: OpenRouter is a strong choice for deployed usage because it does not require local model setup.";
    } else {
        modelInput.value = "llama3.2";

        apiKeyLabel.textContent = "API Key";
        setupTitle.textContent = "Use Ollama Locally For Free";
        setupDescription.textContent =
            "Install Ollama on the user's machine, then pull a local model. Ollama only works when this app is running on the same local machine as the Ollama server.";
        setupCommand.textContent = "ollama pull llama3.2";
        setupNote.textContent =
            "Tip: Ollama is ideal for local usage only. If this app is opened from a hosted URL, use OpenRouter instead.";
        providerWarning.textContent =
            "Local-only reminder: Ollama will not work from the hosted Render app unless the backend is running on your own machine with Ollama installed.";
    }
}

function loadSelectedSnippet() {
    const selected = SNIPPETS[snippetSelect.value];
    if (!selected) {
        return;
    }

    codeInput.value = selected.code;
    stdinInput.value = selected.stdin;
}

async function copyText(text, button) {
    try {
        await navigator.clipboard.writeText(text);
        const previous = button.textContent;
        button.textContent = "Copied";
        window.setTimeout(() => {
            button.textContent = previous;
        }, 1000);
    } catch (error) {
        button.textContent = "Copy Failed";
        window.setTimeout(() => {
            button.textContent = "Copy Output";
        }, 1000);
    }
}

function renderHistory(executions) {
    if (!executions.length) {
        historyList.innerHTML = '<div class="history-empty">No executions yet. Run some code to build your history.</div>';
        return;
    }

    historyList.innerHTML = executions
        .map((execution) => {
            const preview = execution.code.replace(/\s+/g, " ").trim().slice(0, 80) || "No code preview";
            return `
                <button class="history-item" type="button" data-execution-id="${execution.id}">
                    <div class="history-meta">
                        <span>#${execution.id}</span>
                        <span class="history-status ${execution.status}">${execution.status}</span>
                    </div>
                    <p class="history-preview">${preview}</p>
                </button>
            `;
        })
        .join("");

    document.querySelectorAll(".history-item").forEach((item) => {
        item.addEventListener("click", () => loadExecutionFromHistory(item.dataset.executionId));
    });
}

async function refreshHistory() {
    historyList.innerHTML = '<div class="history-empty">Loading recent executions...</div>';

    try {
        const response = await fetch(
            `/api/v1/executions/?session_id=${encodeURIComponent(sessionId)}&limit=8`
        );
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || "Failed to load execution history");
        }

        renderHistory(data);
    } catch (error) {
        historyList.innerHTML = `<div class="history-empty">${error.message}</div>`;
    }
}

async function loadExecutionFromHistory(executionId) {
    try {
        const response = await fetch(`/api/v1/executions/${executionId}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || "Failed to load execution");
        }

        codeInput.value = data.code || "";
        stdinInput.value = data.stdin_input || "";
        stdoutBox.textContent = data.stdout || "No standard output.";
        stderrBox.textContent = data.stderr || "No errors.";
        explanationBox.textContent = data.llm_explanation || "No explanation was returned.";
        setStatus(
            data.status || "Completed",
            `Loaded execution #${data.id} with exit code ${data.exit_code}.`
        );
        activateTab("stdout-panel");
    } catch (error) {
        setStatus("Failed", error.message);
    }
}

async function runCode() {
    const payload = {
        session_id: sessionId,
        language: languageInput.value,
        code: codeInput.value,
        stdin_input: stdinInput.value,
        ai_config: getAiConfig(),
    };

    setButtonLoading(runButton, runLoader, runButtonLabel, true, "Running...", "Run In Sandbox");
    setStatus("Running", "Submitting code to the sandbox backend.");
    stdoutBox.textContent = "Running...";
    stderrBox.textContent = "Waiting for result...";
    explanationBox.textContent = "Generating explanation...";

    try {
        const response = await fetch("/api/v1/executions/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || "Request failed");
        }

        setStatus(
            data.status || "Completed",
            `Execution #${data.id} finished with exit code ${data.exit_code}.`
        );

        stdoutBox.textContent = data.stdout || "No standard output.";
        stderrBox.textContent = data.stderr || "No errors.";
        explanationBox.textContent = data.llm_explanation || "No explanation was returned.";
        activateTab("stdout-panel");
        refreshHistory();
    } catch (error) {
        setStatus("Failed", "The request could not be completed.");
        stdoutBox.textContent = "No standard output.";
        stderrBox.textContent = error.message;
        explanationBox.textContent = "The AI explanation could not be generated.";
    } finally {
        setButtonLoading(runButton, runLoader, runButtonLabel, false, "Running...", "Run In Sandbox");
    }
}

async function askAiQuestion() {
    const question = aiQuestionInput.value.trim();

    if (!question) {
        aiAnswerBox.textContent = "Type a question first so the AI has something to answer.";
        return;
    }

    setButtonLoading(askAiButton, askLoader, askButtonLabel, true, "Thinking...", "Ask AI");
    aiAnswerBox.textContent = "";

    try {
        const response = await fetch("/api/v1/executions/ai/chat/stream", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                question,
                context: `Language: ${languageInput.value}\n\nCode:\n${codeInput.value}\n\nstdout:\n${stdoutBox.textContent}\n\nstderr:\n${stderrBox.textContent}`,
                ai_config: getAiConfig(),
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "AI request failed");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { value, done } = await reader.read();
            if (done) {
                break;
            }
            aiAnswerBox.textContent += decoder.decode(value, { stream: true });
        }
    } catch (error) {
        aiAnswerBox.textContent = error.message;
    } finally {
        setButtonLoading(askAiButton, askLoader, askButtonLabel, false, "Thinking...", "Ask AI");
    }
}

async function copySetupCommand() {
    try {
        await navigator.clipboard.writeText(setupCommand.textContent);
        copySetupButton.textContent = "Copied";
        window.setTimeout(() => {
            copySetupButton.textContent = "Copy Setup Command";
        }, 1200);
    } catch (error) {
        copySetupButton.textContent = "Copy Failed";
        window.setTimeout(() => {
            copySetupButton.textContent = "Copy Setup Command";
        }, 1200);
    }
}

async function testAiConnection() {
    setButtonLoading(testAiButton, testLoader, testButtonLabel, true, "Testing...", "Test AI Connection");
    connectionTestResult.textContent = "Testing AI connection...";

    try {
        const response = await fetch("/api/v1/executions/ai/test", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                ai_config: getAiConfig(),
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || "AI connection test failed");
        }

        connectionTestResult.textContent =
            `Connected successfully.\nProvider: ${data.provider}\nModel: ${data.model}\nResponse: ${data.message}`;
    } catch (error) {
        connectionTestResult.textContent = `Connection failed.\n${error.message}`;
    } finally {
        setButtonLoading(testAiButton, testLoader, testButtonLabel, false, "Testing...", "Test AI Connection");
    }
}

providerInput.addEventListener("change", syncProviderFields);
loadSnippetButton.addEventListener("click", loadSelectedSnippet);
runButton.addEventListener("click", runCode);
askAiButton.addEventListener("click", askAiQuestion);
copySetupButton.addEventListener("click", copySetupCommand);
testAiButton.addEventListener("click", testAiConnection);
toggleSetupButton.addEventListener("click", toggleSetupPanel);
toggleHistoryButton.addEventListener("click", toggleHistoryPanel);
copyStdoutButton.addEventListener("click", () => copyText(stdoutBox.textContent, copyStdoutButton));
copyStderrButton.addEventListener("click", () => copyText(stderrBox.textContent, copyStderrButton));
copyExplanationButton.addEventListener("click", () => copyText(explanationBox.textContent, copyExplanationButton));
refreshHistoryButton.addEventListener("click", refreshHistory);
tabButtons.forEach((button) => {
    button.addEventListener("click", () => activateTab(button.dataset.tab));
});
syncProviderFields();
refreshHistory();
