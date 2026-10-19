// Generate a unique session ID for this browser tab instance
const sessionId = "session_" + Math.random().toString(36).substring(2, 9);
const API_BASE_URL = "http://localhost:8080/api/chat";

// Optional: Load previous history when the page opens
window.onload = async function () {
  try {
    const response = await fetch(
      `${API_BASE_URL}/history?sessionId=${sessionId}`,
    );
    if (response.ok) {
      const history = await response.json();
      const chatBox = document.getElementById("chat-box");
      history.forEach((item) => {
        const senderClass = item.sender === "USER" ? "user" : "assistant";
        chatBox.innerHTML += `<div class="message ${senderClass}">${escapeHtml(item.message)}</div>`;
      });
      chatBox.scrollTop = chatBox.scrollHeight;
    }
  } catch (e) {
    console.error("Could not load chat history:", e);
  }
};

async function sendMessage() {
  const inputField = document.getElementById("user-input");
  const chatBox = document.getElementById("chat-box");
  const text = inputField.value.trim();
  if (!text) return;

  // 1. Append user message immediately to UI
  chatBox.innerHTML += `<div class="message user">${escapeHtml(text)}</div>`;
  inputField.value = "";
  chatBox.scrollTop = chatBox.scrollHeight;

  // Optional: Add a temporary "Thinking..." placeholder
  const loadingId = "loading_" + Date.now();
  chatBox.innerHTML += `<div id="${loadingId}" class="message assistant" style="color: #888;">Support is typing...</div>`;
  chatBox.scrollTop = chatBox.scrollHeight;

  try {
    // 2. Call Spring Boot REST API
    const res = await fetch(`${API_BASE_URL}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: sessionId, message: text }),
    });

    // Remove loading message
    document.getElementById(loadingId).remove();

    if (!res.ok) throw new Error("Server error");

    const data = await res.json();

    // 3. Append AI response to UI
    chatBox.innerHTML += `<div class="message assistant">${escapeHtml(data.response)}</div>`;
    chatBox.scrollTop = chatBox.scrollHeight;
  } catch (e) {
    document.getElementById(loadingId).remove();
    chatBox.innerHTML += `<div class="message assistant" style="color:red;">Error connecting to support server. Make sure Spring Boot is running.</div>`;
  }
}

function handleKey(event) {
  if (event.key === "Enter") {
    sendMessage();
  }
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
