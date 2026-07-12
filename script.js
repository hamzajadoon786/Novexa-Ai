/* ==========================================
   NOVEXA AI - SCRIPT.JS
   PART 1 / 4
   ========================================== */

const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const voiceBtn = document.getElementById("voice-btn");
const newChatBtn = document.getElementById("new-chat-btn");
const menuBtn = document.getElementById("menu-btn");
const sidebar = document.getElementById("sidebar");
const typing = document.getElementById("typing");

const API_URL = "/api/chat";

let isTyping = false;

// ===============================
// Time
// ===============================

function getTime() {
    const now = new Date();

    return now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });
}

// ===============================
// Scroll Bottom
// ===============================

function scrollBottom() {
    chatBox.scrollTop = chatBox.scrollHeight;
}

// ===============================
// Save Chat
// ===============================

function saveChat() {
    localStorage.setItem(
        "novexa_chat",
        chatBox.innerHTML
    );
}

// ===============================
// Load Chat
// ===============================

function loadChat() {

    const data = localStorage.getItem("novexa_chat");

    if (data) {

        chatBox.innerHTML = data;

    }

    scrollBottom();

}

// ===============================
// Remove Welcome Screen
// ===============================

function removeWelcome() {

    const welcome = document.querySelector(".welcome");

    if (welcome) {

        welcome.remove();

    }

}

// ===============================
// Create Message
// ===============================

function addMessage(text, sender) {

    removeWelcome();

    const row = document.createElement("div");

    row.className = `message ${sender}`;

    const avatar = document.createElement("div");

    avatar.className = "avatar";

    avatar.innerHTML =
        sender === "user"
        ? '<i class="fas fa-user"></i>'
        : '<i class="fas fa-robot"></i>';

    const content = document.createElement("div");

    content.className = "message-content";

    const bubble = document.createElement("div");

    bubble.className = "bubble";

    bubble.textContent = text;

    const time = document.createElement("div");

    time.className = "message-time";

    time.textContent = getTime();

    content.appendChild(bubble);

    content.appendChild(time);

    if (sender === "user") {

        row.appendChild(content);

        row.appendChild(avatar);

    } else {

        row.appendChild(avatar);

        row.appendChild(content);

    }

    chatBox.appendChild(row);

    scrollBottom();

    saveChat();

  }
/* ==========================================
   NOVEXA AI - SCRIPT.JS
   PART 2 / 4
   API + Typing + Send Message
========================================== */

// ===============================
// Typing Indicator
// ===============================

function showTyping() {

    typing.style.display = "flex";

    isTyping = true;

    scrollBottom();

}

function hideTyping() {

    typing.style.display = "none";

    isTyping = false;

}

// ===============================
// Send Message To AI
// ===============================

async function sendMessage() {

    const message = userInput.value.trim();

    if (!message || isTyping) return;
  addMessage(message, "user");

userInput.value = "";

showTyping();

sendBtn.disabled = true;

try {

    const response = await fetch(API_URL, {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            message: message
        })

    });

    const data = await response.json();

    hideTyping();

    sendBtn.disabled = false;

    if (!response.ok) {

        addMessage(
            data.error || "Server Error",
            "ai"
        );

        return;

    }

    addMessage(data.reply, "ai");

} catch (error) {

    hideTyping();

    sendBtn.disabled = false;

    addMessage(
        "Connection Error. Please try again.",
        "ai"
    );

    console.error(error);

}

}
/* ==========================================
   NOVEXA AI - SCRIPT.JS
   PART 3 / 4
   Events + Sidebar + New Chat
========================================== */

// ===============================
// New Chat
// ===============================

newChatBtn.addEventListener("click", () => {

    if (confirm("Start a new chat?")) {

        localStorage.removeItem("novexa_chat");

        chatBox.innerHTML = `
        <div class="welcome">
            <i class="fas fa-robot"></i>
            <h2>Welcome to Novexa AI</h2>
            <p>Your Smart AI Assistant</p>
        </div>
        `;

    }

});

// ===============================
// Sidebar Toggle
// ===============================

menuBtn.addEventListener("click", () => {

    sidebar.classList.toggle("active");

});

// ===============================
// Auto Focus
// ===============================

window.addEventListener("load", () => {

    loadChat();

    userInput.focus();

});

// ===============================
// Voice Button
// ===============================

voiceBtn.addEventListener("click", () => {

    if (!("webkitSpeechRecognition" in window)) {

        alert("Voice recognition is not supported.");

        return;

    }

    const recognition = new webkitSpeechRecognition();

    recognition.lang = "en-US";

    recognition.start();

    recognition.onresult = function(event) {

        userInput.value =
            event.results[0][0].transcript;

    };

});
/* ==========================================
   NOVEXA AI - SCRIPT.JS
   PART 4 / 4 (FINAL)
========================================== */

// ===============================
// Prevent Empty Spaces
// ===============================

userInput.addEventListener("input", () => {

    if (userInput.value.trim().length > 0) {
        sendBtn.disabled = false;
    } else {
        sendBtn.disabled = true;
    }

});

// ===============================
// Initial State
// ===============================

sendBtn.disabled = true;

loadChat();

scrollBottom();

// ===============================
// Auto Resize On Window
// ===============================

window.addEventListener("resize", () => {

    scrollBottom();

});

// ===============================
// App Loaded
// ===============================

console.log("Novexa AI Loaded Successfully");

// ==========================================
// END OF SCRIPT.JS
// ==========================================
