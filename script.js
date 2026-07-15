/* ==========================================
   NOVEXA AI
   SCRIPT.JS
   PART 1A
   ========================================== */

import { auth, db } from "./firebase.js";

/* ==========================================
   APP CONFIG
   ========================================== */

const APP = {
    NAME: "Novexa AI",
    VERSION: "4.0.0",
    API_URL: "/api/chat",
    STORAGE_KEY: "novexa_chat_v4"
};

/* ==========================================
   DOM ELEMENTS
   ========================================== */

const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const voiceBtn = document.getElementById("voice-btn");
const menuBtn = document.getElementById("menu-btn");
const newChatBtn = document.getElementById("new-chat-btn");
const sidebar = document.getElementById("sidebar");
const typing = document.getElementById("typing");

/* ==========================================
   APP STATE
   ========================================== */

const state = {
    loading: false,
    typing: false,
    messages: [],
    user: null
};

/* ==========================================
   DATE & TIME
   ========================================== */

function getCurrentTime() {

    return new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });

}

/* ==========================================
   SCROLL
   ========================================== */

function scrollToBottom() {

    requestAnimationFrame(() => {

        chatBox.scrollTop = chatBox.scrollHeight;

    });

}

/* ==========================================
   LOCAL STORAGE
   ========================================== */

function saveChat() {

    localStorage.setItem(
        APP.STORAGE_KEY,
        chatBox.innerHTML
    );

}

function loadChat() {

    const savedChat = localStorage.getItem(APP.STORAGE_KEY);

    if (savedChat) {

        chatBox.innerHTML = savedChat;

    }

    scrollToBottom();

}

function clearChatStorage() {

    localStorage.removeItem(APP.STORAGE_KEY);

}

/* ==========================================
   WELCOME SCREEN
   ========================================== */

function removeWelcomeScreen() {

    const welcome = document.querySelector(".welcome");

    if (welcome) {

        welcome.remove();

    }

}

/* ==========================================
   TYPING INDICATOR
   ========================================== */

function showTyping() {

    state.typing = true;

    typing.style.display = "flex";

    scrollToBottom();

}

function hideTyping() {

    state.typing = false;

    typing.style.display = "none";

}

/* ==========================================
   END OF PART 1A
   ========================================== */

 /* ==========================================
   NOVEXA AI
   SCRIPT.JS
   PART 1B
========================================== */

/* ==========================================
   CREATE MESSAGE
========================================== */

function createMessage(text, sender = "ai") {

    removeWelcomeScreen();

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
    time.textContent = getCurrentTime();

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

    scrollToBottom();

    saveChat();

}

/* ==========================================
   CHAT MEMORY
========================================== */

function addToMemory(role, content) {

    state.messages.push({

        role,
        content

    });

    if (state.messages.length > 20) {

        state.messages.shift();

    }

}

/* ==========================================
   RESET CHAT
========================================== */

function resetChat() {

    clearChatStorage();

    state.messages = [];

    chatBox.innerHTML = `
    <div class="welcome">
        <i class="fas fa-robot"></i>
        <h2>Welcome to Novexa AI</h2>
        <p>Your Smart AI Assistant</p>
    </div>
    `;

}

/* ==========================================
   NEW CHAT BUTTON
========================================== */

newChatBtn.addEventListener("click", () => {

    if (confirm("Start a new chat?")) {

        resetChat();

    }

});

/* ==========================================
   SIDEBAR
========================================== */

menuBtn.addEventListener("click", () => {

    sidebar.classList.toggle("active");

});

/* ==========================================
   WINDOW LOAD
========================================== */

window.addEventListener("load", () => {

    loadChat();

    userInput.focus();

});

/* ==========================================
   END OF PART 1B
========================================== */
/* ==========================================
   NOVEXA AI
   SCRIPT.JS
   PART 1C
========================================== */

/* ==========================================
   INPUT VALIDATION
========================================== */

function updateSendButton() {

    sendBtn.disabled = userInput.value.trim().length === 0 || state.loading;

}

userInput.addEventListener("input", updateSendButton);

/* ==========================================
   VOICE RECOGNITION
========================================== */

voiceBtn.addEventListener("click", () => {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (!SpeechRecognition) {

        alert("Voice recognition is not supported on this device.");

        return;

    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.start();

    recognition.onresult = (event) => {

        userInput.value = event.results[0][0].transcript;

        updateSendButton();

    };

});

/* ==========================================
   SEND MESSAGE PLACEHOLDER
========================================== */

async function sendMessage() {

    // Part 2 میں مکمل Mistral API آئے گی

    console.log("sendMessage()");

}

/* ==========================================
   EVENTS
========================================== */

sendBtn.addEventListener("click", sendMessage);

userInput.addEventListener("keydown", (e) => {

    if (e.key === "Enter" && !e.shiftKey) {

        e.preventDefault();

        sendMessage();

    }

});

/* ==========================================
   APP START
========================================== */

window.addEventListener("load", () => {

    loadChat();

    updateSendButton();

    scrollToBottom();

});

/* ==========================================
   READY
========================================== */

console.log(`${APP.NAME} v${APP.VERSION} Loaded`);
/* ==========================================
   NOVEXA AI
   SCRIPT.JS
   PART 2
   AI REQUEST
========================================== */

async function sendMessage() {

    const message = userInput.value.trim();

    if (!message) return;

    if (state.loading) return;

    state.loading = true;

    updateSendButton();

    createMessage(message, "user");

    addToMemory("user", message);

    userInput.value = "";

    showTyping();

    try {

        const response = await fetch(APP.API_URL, {

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

        if (!response.ok) {

            createMessage(

                data.error || "Server Error",

                "ai"

            );

            return;

        }

        const reply = data.reply || "No response received.";

        createMessage(reply, "ai");

        addToMemory("assistant", reply);

    } catch (error) {

        console.error(error);

        hideTyping();

        createMessage(

            "Connection Error. Please check your internet and try again.",

            "ai"

        );

    } finally {

        state.loading = false;

        updateSendButton();

        userInput.focus();

    }

}

/* ==========================================
   END PART 2
========================================== */
 
