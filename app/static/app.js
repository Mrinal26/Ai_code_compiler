const runButton = document.getElementById("run-button");
const askAiButton = document.getElementById("ask-ai-button");
const languageInput = document.getElementById("language");
const providerInput = document.getElementById("provider");
const modelInput = document.getElementById("ai_model");
const baseUrlInput = document.getElementById("base_url");
const apiKeyInput = document.getElementById("api_key");
const apiKeyLabel = document.getElementById("api-key-label");
const baseUrlGroup = document.getElementById("base-url-group");
const apiKeyGroup = document.getElementById("api-key-group");
const copySetupButton = document.getElementById("copy-setup-button");
const setupTitle = document.getElementById("setup-title");
const setupDescription = document.getElementById("setup-description");
const setupCommand = document.getElementById("setup-command");
const setupNote = document.getElementById("setup-note");
const codeInput = document.getElementById("code");
const stdinInput = document.getElementById("stdin_input");
const aiQuestionInput = document.getElementById("ai_question");
const aiAnswerBox = document.getElementById("ai_answer");
const stdoutBox = document.getElementById("stdout");
const stderrBox = document.getElementById("stderr");
const explanationBox = document.getElementById("llm_explanation");
const statusPill = document.getElementById("status-pill");
const metaText = document.getElementById("meta-text");

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

function syncProviderFields() {
    const provider = providerInput.value;
    const needsApiKey = provider === "openrouter" || provider === "groq";
    apiKeyGroup.classList.toggle("hidden", !needsApiKey);
    baseUrlGroup.classList.toggle("hidden", provider !== "ollama");

    if (provider === "ollama" && !modelInput.value.trim()) {
        modelInput.value = "llama3.2";
    }

    if (provider === "openrouter") {
        if (!modelInput.value.trim() || modelInput.value === "llama3.2") {
            modelInput.value = "deepseek/deepseek-r1:free";
        }

        apiKeyLabel.textContent = "OpenRouter API Key";
        apiKeyInput.placeholder = "Paste your OpenRouter API key";
        setupTitle.textContent = "Use OpenRouter With Your Own API Key";
        setupDescription.textContent =
            "OpenRouter works better for hosted usage. Ask the user to paste their own API key and choose a model.";
        setupCommand.textContent = "Create an OpenRouter key at https://openrouter.ai/keys";
        setupNote.textContent =
            "Tip: This keeps usage tied to the user's own key, which is the simplest hosted AI path.";
    } else if (provider === "groq") {
        if (!modelInput.value.trim() || modelInput.value === "llama3.2") {
            modelInput.value = "llama-3.1-8b-instant";
        }

        apiKeyLabel.textContent = "Groq API Key";
        apiKeyInput.placeholder = "Paste your Groq API key";
        setupTitle.textContent = "Use Groq For Fast Cloud Responses";
        setupDescription.textContent =
            "Groq is a strong no-install hosted option. Ask the user to paste their own Groq API key and select a supported model.";
        setupCommand.textContent = "Create a Groq key at https://console.groq.com/keys";
        setupNote.textContent =
            "Tip: Groq is often a great hosted demo option when you want fast responses without local model setup.";
    } else {
        if (!modelInput.value.trim() || modelInput.value === "deepseek/deepseek-r1:free") {
            modelInput.value = "llama3.2";
        }

        apiKeyLabel.textContent = "API Key";
        setupTitle.textContent = "Use Ollama Locally For Free";
        setupDescription.textContent =
            "Install Ollama on the user's machine, then pull a local model. This is the best free local-first option.";
        setupCommand.textContent = "ollama pull llama3.2";
        setupNote.textContent =
            "Tip: Ollama is ideal for local usage. For hosted usage, OpenRouter is usually the better fit.";
    }
}

async function runCode() {
    const payload = {
        language: languageInput.value,
        code: codeInput.value,
        stdin_input: stdinInput.value,
        ai_config: getAiConfig(),
    };

    runButton.disabled = true;
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
    } catch (error) {
        setStatus("Failed", "The request could not be completed.");
        stdoutBox.textContent = "No standard output.";
        stderrBox.textContent = error.message;
        explanationBox.textContent = "The AI explanation could not be generated.";
    } finally {
        runButton.disabled = false;
    }
}

async function askAiQuestion() {
    const question = aiQuestionInput.value.trim();

    if (!question) {
        aiAnswerBox.textContent = "Type a question first so the AI has something to answer.";
        return;
    }

    askAiButton.disabled = true;
    aiAnswerBox.textContent = "Thinking...";

    try {
        const response = await fetch("/api/v1/executions/ai/chat", {
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

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || "AI request failed");
        }

        aiAnswerBox.textContent = data.answer;
    } catch (error) {
        aiAnswerBox.textContent = error.message;
    } finally {
        askAiButton.disabled = false;
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

providerInput.addEventListener("change", syncProviderFields);
runButton.addEventListener("click", runCode);
askAiButton.addEventListener("click", askAiQuestion);
copySetupButton.addEventListener("click", copySetupCommand);
syncProviderFields();
