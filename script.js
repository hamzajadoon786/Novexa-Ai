// Progressive Web App registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => console.error('SW Registration Failed', err));
  });
}

// App State Management
const STATE = {
  theme: localStorage.getItem('novexa-theme') || 'dark',
  currentChatId: null,
  chats: JSON.parse(localStorage.getItem('novexa-chats')) || {},
  selectedImageBase64: null,
  isRecording: false,
  recognition: null
};

// DOM Elements
const elements = {
  themeToggle: document.getElementById('theme-toggle'),
  sidebar: document.getElementById('sidebar'),
  toggleSidebarBtn: document.getElementById('toggle-sidebar-btn'),
  closeSidebarBtn: document.getElementById('close-sidebar-btn'),
  newChatBtn: document.getElementById('new-chat-btn'),
  historyList: document.getElementById('history-list'),
  chatMessages: document.getElementById('chat-messages'),
  welcomeContainer: document.getElementById('welcome-container'),
  chatForm: document.getElementById('chat-form'),
  userInput: document.getElementById('user-input'),
  imageInput: document.getElementById('image-input'),
  previewContainer: document.getElementById('preview-container'),
  imagePreview: document.getElementById('image-preview'),
  removeImageBtn: document.getElementById('remove-image-btn'),
  voiceBtn: document.getElementById('voice-btn'),
  sendBtn: document.getElementById('send-btn')
};

// Initialize App
function init() {
  document.documentElement.setAttribute('data-theme', STATE.theme);
  updateThemeIcon();
  renderHistory();
  setupSpeechRecognition();
  
  if (Object.keys(STATE.chats).length > 0) {
    const sortedChats = Object.keys(STATE.chats).sort((a, b) => STATE.chats[b].updatedAt - STATE.chats[a].updatedAt);
    loadChat(sortedChats[0]);
  } else {
    createNewChat();
  }
}

// Theme Handlers
elements.themeToggle.addEventListener('click', () => {
  STATE.theme = STATE.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', STATE.theme);
  localStorage.setItem('novexa-theme', STATE.theme);
  updateThemeIcon();
});

function updateThemeIcon() {
  const icon = elements.themeToggle.querySelector('i');
  if (STATE.theme === 'dark') {
    icon.className = 'fa-solid fa-sun';
  } else {
    icon.className = 'fa-solid fa-moon';
  }
}

// Sidebar Handlers
elements.toggleSidebarBtn.addEventListener('click', () => elements.sidebar.classList.toggle('open'));
elements.closeSidebarBtn.addEventListener('click', () => elements.sidebar.classList.remove('open'));

// Chat lifecycle
elements.newChatBtn.addEventListener('click', () => {
  createNewChat();
  if (window.innerWidth <= 768) elements.sidebar.classList.remove('open');
});

function createNewChat() {
  const id = 'chat_' + Date.now();
  STATE.chats[id] = {
    title: 'New Chat Workspace',
    messages: [],
    updatedAt: Date.now()
  };
  saveToStorage();
  renderHistory();
  loadChat(id);
}

function loadChat(id) {
  STATE.currentChatId = id;
  elements.chatMessages.innerHTML = '';
  
  const chat = STATE.chats[id];
  if (!chat || chat.messages.length === 0) {
    elements.chatMessages.appendChild(elements.welcomeContainer);
    elements.welcomeContainer.classList.remove('hidden');
  } else {
    elements.welcomeContainer.classList.add('hidden');
    chat.messages.forEach(msg => appendMessageDOM(msg.role, msg.content, msg.image, false));
  }
  
  document.querySelectorAll('.history-item').forEach(item => {
    item.classList.toggle('active', item.getAttribute('data-id') === id);
  });
}

function saveToStorage() {
  localStorage.setItem('novexa-chats', JSON.stringify(STATE.chats));
}

// Render Side History
function renderHistory() {
  elements.historyList.innerHTML = '';
  const sorted = Object.keys(STATE.chats).sort((a, b) => STATE.chats[b].updatedAt - STATE.chats[a].updatedAt);
  
  sorted.forEach(id => {
    const chat = STATE.chats[id];
    const item = document.createElement('div');
    item.className = `history-item ${id === STATE.currentChatId ? 'active' : ''}`;
    item.setAttribute('data-id', id);
    
    const text = document.createElement('span');
    text.className = 'history-text';
    text.textContent = chat.title;
    text.addEventListener('click', () => loadChat(id));
    
    const delBtn = document.createElement('button');
    delBtn.className = 'delete-history-btn';
    delBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteChat(id);
    });
    
    item.appendChild(text);
    item.appendChild(delBtn);
    elements.historyList.appendChild(item);
  });
}

function deleteChat(id) {
  delete STATE.chats[id];
  saveToStorage();
  renderHistory();
  
  if (STATE.currentChatId === id) {
    const remaining = Object.keys(STATE.chats);
    if (remaining.length > 0) {
      loadChat(remaining[0]);
    } else {
      createNewChat();
    }
  }
}

// Image handling
elements.imageInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (event) => {
    STATE.selectedImageBase64 = event.target.result;
    elements.imagePreview.src = STATE.selectedImageBase64;
    elements.previewContainer.classList.remove('hidden');
  };
  reader.readAsDataURL(file);
});

elements.removeImageBtn.addEventListener('click', () => {
  STATE.selectedImageBase64 = null;
  elements.imageInput.value = '';
  elements.previewContainer.classList.add('hidden');
});

// Speech Framework
function setupSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    elements.voiceBtn.style.display = 'none';
    return;
  }
  
  STATE.recognition = new SpeechRecognition();
  STATE.recognition.continuous = false;
  STATE.recognition.interimResults = false;
  STATE.recognition.lang = 'en-US';
  
  STATE.recognition.onstart = () => {
    STATE.isRecording = true;
    elements.voiceBtn.style.color = '#ef4444';
  };
  
  STATE.recognition.onend = () => {
    STATE.isRecording = false;
    elements.voiceBtn.style.color = 'var(--text-main)';
  };
  
  STATE.recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    elements.userInput.value = transcript;
  };
}

elements.voiceBtn.addEventListener('click', () => {
  if (!STATE.recognition) return;
  if (STATE.isRecording) {
    STATE.recognition.stop();
  } else {
    STATE.recognition.start();
  }
});

function speakText(text, btnElement) {
  if (!('speechSynthesis' in window)) return;
  
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
    btnElement.innerHTML = '<i class="fa-solid fa-volume-high"></i> Speak';
    return;
  }
  
  // Clean markdown tags for clear speech synthesis
  const cleanText = text.replace(/[#*`\-_[\]()]/g, '');
  const utterance = new SpeechSynthesisUtterance(cleanText);
  
  utterance.onend = () => {
    btnElement.innerHTML = '<i class="fa-solid fa-volume-high"></i> Speak';
  };
  
  btnElement.innerHTML = '<i class="fa-solid fa-stop"></i> Stop';
  window.speechSynthesis.speak(utterance);
}

// Append messages to workspace
function appendMessageDOM(role, content, imageSrc = null, shouldAnimate = false) {
  elements.welcomeContainer.classList.add('hidden');
  
  const wrapper = document.createElement('div');
  wrapper.className = `message-wrapper ${role}`;
  
  const meta = document.createElement('div');
  meta.className = 'message-meta';
  meta.textContent = role === 'user' ? 'You' : 'Novexa';
  
  const box = document.createElement('div');
  box.className = 'message-box';
  
  if (imageSrc) {
    const img = document.createElement('img');
    img.src = imageSrc;
    box.appendChild(img);
  }
  
  const textContainer = document.createElement('div');
  if (role === 'user') {
    textContainer.textContent = content;
  } else {
    textContainer.innerHTML = marked.parse(content);
    
    // Add Text-to-Speech action option
    const ttsBtn = document.createElement('button');
    ttsBtn.className = 'tts-btn';
    ttsBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i> Speak';
    ttsBtn.addEventListener('click', () => speakText(content, ttsBtn));
    box.appendChild(ttsBtn);
  }
  
  box.appendChild(textContainer);
  wrapper.appendChild(meta);
  wrapper.appendChild(box);
  elements.chatMessages.appendChild(wrapper);
  elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

// Handle Form Submission
elements.chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = elements.userInput.value.trim();
  if (!text && !STATE.selectedImageBase64) return;
  
  const activeChatId = STATE.currentChatId;
  const currentImage = STATE.selectedImageBase64;
  
  // Clear input fields immediately
  elements.userInput.value = '';
  STATE.selectedImageBase64 = null;
  elements.previewContainer.classList.add('hidden');
  elements.imageInput.value = '';
  
  // Update workspace structure title if first message
  if (STATE.chats[activeChatId].messages.length === 0 && text) {
    STATE.chats[activeChatId].title = text.substring(0, 30) + (text.length > 30 ? '...' : '');
  }
  
  // Append user payload to state and DOM
  STATE.chats[activeChatId].messages.push({ role: 'user', content: text, image: currentImage });
  appendMessageDOM('user', text, currentImage);
  saveToStorage();
  renderHistory();
  
  // Append thinking layout indicator
  const typingIndicator = document.createElement('div');
  typingIndicator.className = 'message-wrapper bot typing-container';
  typingIndicator.innerHTML = `
    <div class="message-meta">Novexa</div>
    <div class="message-box">
      <div class="typing-indicator"><span></span><span></span><span></span></div>
    </div>
  `;
  elements.chatMessages.appendChild(typingIndicator);
  elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
  
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: STATE.chats[activeChatId].messages,
        image: currentImage
      })
    });
    
    // Remote indicator
    typingIndicator.remove();
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to capture response pipeline.');
    }
    
    const data = await response.json();
    
    STATE.chats[activeChatId].messages.push({ role: 'assistant', content: data.reply });
    STATE.chats[activeChatId].updatedAt = Date.now();
    saveToStorage();
    
    if (STATE.currentChatId === activeChatId) {
      appendMessageDOM('assistant', data.reply);
    }
  } catch (err) {
    typingIndicator.remove();
    if (STATE.currentChatId === activeChatId) {
      appendMessageDOM('assistant', `System Error: ${err.message}`);
    }
  }
});

// Run Bootstrapper Loop
init();
