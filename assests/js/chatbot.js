const chatbotButton = document.getElementById("chatbotButton");
const chatbotWindow = document.getElementById("chatbotWindow");
const chatClose = document.getElementById("chatClose");
const chatMessages = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");
const chatSend = document.getElementById("chatSend");
const quickButtons = document.querySelectorAll(".quick-btn");

let hasShownWelcome = false;
let chatHistory = [];
let isSending = false;

function toggleChat() {
  chatbotWindow.classList.toggle("open");

  if (chatbotWindow.classList.contains("open") && !hasShownWelcome) {
    showWelcomeMessages();
    hasShownWelcome = true;
  }
}

function scrollToBottom() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addMessage(text, type = "bot") {
  const msg = document.createElement("div");
  msg.className = `chat-message ${type}`;
  msg.textContent = text;
  chatMessages.appendChild(msg);
  scrollToBottom();
  return msg;
}

function showWelcomeMessages() {
  addMessage(
    "Hello! Welcome to Nash Tax & Bookkeeping. How can I help you today?",
    "bot"
  );
  addMessage(
    "You can choose one of the quick options below or type your question.",
    "bot"
  );
}

function addTypingMessage() {
  const msg = document.createElement("div");
  msg.className = "chat-message bot typing";
  msg.innerHTML = "Typing<span>.</span><span>.</span><span>.</span>";
  chatMessages.appendChild(msg);
  scrollToBottom();
  return msg;
}

function setSendingState(sending) {
  isSending = sending;
  chatSend.disabled = sending;
  chatInput.disabled = sending;

  quickButtons.forEach((button) => {
    button.disabled = sending;
  });
}

async function sendMessage(messageText = null) {
  const message = (messageText || chatInput.value).trim();
  if (!message || isSending) return;

  addMessage(message, "user");
  chatInput.value = "";
  chatHistory.push({ role: "user", content: message });

  setSendingState(true);
  const typingMsg = addTypingMessage();

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message,
        history: chatHistory
      })
    });

    const data = await response.json();
    typingMsg.remove();

    if (!response.ok) {
      addMessage(
        data.error || "Sorry, something went wrong. Please try again.",
        "bot"
      );
      setSendingState(false);
      chatInput.focus();
      return;
    }

    const reply =
      data.reply ||
      "Sorry, I couldn't generate a response right now. Please try again.";

    addMessage(reply, "bot");
    chatHistory.push({ role: "assistant", content: reply });
  } catch (error) {
    typingMsg.remove();
    addMessage(
      "Sorry, I couldn't connect right now. Please try again in a moment.",
      "bot"
    );
  }

  setSendingState(false);
  chatInput.focus();
}

chatbotButton.addEventListener("click", toggleChat);
chatClose.addEventListener("click", toggleChat);

chatSend.addEventListener("click", () => sendMessage());

chatInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    sendMessage();
  }
});

quickButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const question = button.getAttribute("data-question");
    sendMessage(question);
  });
});