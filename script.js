import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { 
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { 
  getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs, deleteDoc 
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// FIREBASE ORCHESTRATION FALLBACK CONFIGURATION MATRIX
const firebaseConfig = {
  apiKey: "AIzaSyFakeKey_NovexaPlaceholderMatrixV2026",
  authDomain: "novexa-ai.firebaseapp.com",
  projectId: "novexa-ai",
  storageBucket: "novexa-ai.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => console.error('SW Registration Failure Link:', err));
  });
}

// APPLICATION RUNTIME PARAMETERS
const CORE_STATE = {
  user: null,
  theme: localStorage.getItem('novexa-theme') || 'dark',
  scale: localStorage.getItem('novexa-scale') || 'standard',
  currentChatId: null,
  chats: {},
  trashChats: {},
  activeArtifact: null, // Holds object { type: 'image'|'doc', name: '', content: base64 | text }
  webSearchActive: false,
  isVoiceActive: false,
  recognition: null,
  selectedVoiceName: localStorage.getItem('novexa-voice') || '',
  activeToolAction: null
};

const DOM = {
  authOverlay: document.getElementById('auth-overlay'),
  authEmail: document.getElementById('auth-email'),
  authPassword: document.getElementById('auth-password'),
  authError: document.getElementById('auth-error'),
  btnLogin: document.getElementById('btn-login'),
  btnRegister: document.getElementById('btn-register'),
  btnGuest: document.getElementById('btn-guest-bypass'),
  btnLogout: document.getElementById('btn-logout'),
  profileName: document.getElementById('profile-name'),
  
  sidebar: document.getElementById('sidebar'),
  toggleSidebarBtn: document.getElementById('toggle-sidebar-btn'),
  closeSidebarBtn: document.getElementById('close-sidebar-btn'),
  newChatBtn: document.getElementById('new-chat-btn'),
  searchHistory: document.getElementById('search-history'),
  historyList: document.getElementById('history-list'),
  modelSelector: document.getElementById('model-selector'),
  searchActivationBtn: document.getElementById('search-activation-btn'),
  themeToggle: document.getElementById('theme-toggle'),
  
  chatMessages: document.getElementById('chat-messages'),
  welcomeContainer: document.getElementById('welcome-container'),
  suggestionGrid: document.getElementById('suggestion-grid'),
  previewContainer: document.getElementById('preview-container'),
  artifactPreviewsGrid: document.getElementById('artifact-previews-grid'),
  chatForm: document.getElementById('chat-form'),
  userInput: document.getElementById('user-input'),
  fileUploadInput: document.getElementById('file-upload-input'),
  voiceBtn: document.getElementById('voice-btn'),
  
  settingsModal: document.getElementById('settings-modal'),
  btnOpenSettings: document.getElementById('btn-open-settings'),
  btnCloseSettings: document.getElementById('btn-close-settings'),
  voiceSelectionProfile: document.getElementById('voice-selection-profile'),
  uiScaleProfile: document.getElementById('ui-scale-profile'),
  btnForceSync: document.getElementById('btn-force-sync'),
  
  toolsModal: document.getElementById('tools-modal'),
  btnOpenTools: document.getElementById('btn-open-tools'),
  btnCloseTools: document.getElementById('btn-close-tools'),
  toolInputPayload: document.getElementById('tool-input-payload'),
  btnTriggerToolOperation: document.getElementById('btn-trigger-tool-operation'),
  toolOutputBox: document.getElementById('tool-output-box')
};

// INITIALIZATION SUBROUTINE LOOP
function boot() {
  applyThemeAndScale();
  populateSystemVoices();
  setupSpeechRecognition();
  bindDOMEvents();
  
  onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      CORE_STATE.user = firebaseUser;
      DOM.profileName.textContent = firebaseUser.email;
      DOM.authOverlay.classList.add('hidden');
      await syncFromCloud();
    } else {
      CORE_STATE.user = null;
      DOM.profileName.textContent = "Standalone Operator";
      const cached = localStorage.getItem('novexa-chats');
      if (cached) {
        CORE_STATE.chats = JSON.parse(cached);
        renderHistoryList();
        loadChatNode(Object.keys(CORE_STATE.chats)[0] || null);
      } else {
        createNewChatNode();
      }
    }
  });
}

function applyThemeAndScale() {
  document.documentElement.setAttribute('data-theme', CORE_STATE.theme);
  document.documentElement.setAttribute('data-scale', CORE_STATE.scale);
  DOM.uiScaleProfile.value = CORE_STATE.scale;
}

function populateSystemVoices() {
  if (!('speechSynthesis' in window)) return;
  const loadVoices = () => {
    const voices = window.speechSynthesis.getVoices();
    DOM.voiceSelectionProfile.innerHTML = voices.map(v => 
      `<option value="${v.name}" ${v.name === CORE_STATE.selectedVoiceName ? 'selected' : ''}>${v.name} (${v.lang})</option>`
    ).join('');
  };
  loadVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
}

// CORE BINDINGS FRAMEWORK
function bindDOMEvents() {
  // Authentication Matrix Event Hooks
  DOM.btnLogin.addEventListener('click', async () => {
    try {
      await signInWithEmailAndPassword(auth, DOM.authEmail.value, DOM.authPassword.value);
    } catch (err) { displayAuthError(err.message); }
  });

  DOM.btnRegister.addEventListener('click', async () => {
    try {
      await createUserWithEmailAndPassword(auth, DOM.authEmail.value, DOM.authPassword.value);
    } catch (err) { displayAuthError(err.message); }
  });

  DOM.btnGuest.addEventListener('click', () => {
    DOM.authOverlay.classList.add('hidden');
  });

  DOM.btnLogout.addEventListener('click', () => {
    signOut(auth).then(() => window.location.reload());
  });

  // Structural Navigation Layout Handlers
  DOM.toggleSidebarBtn.addEventListener('click', () => DOM.sidebar.classList.toggle('open'));
  DOM.closeSidebarBtn.addEventListener('click', () => DOM.sidebar.classList.remove('open'));
  DOM.themeToggle.addEventListener('click', () => {
    CORE_STATE.theme = CORE_STATE.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('novexa-theme', CORE_STATE.theme);
    applyThemeAndScale();
  });

  DOM.searchActivationBtn.addEventListener('click', () => {
    CORE_STATE.webSearchActive = !CORE_STATE.webSearchActive;
    DOM.searchActivationBtn.classList.toggle('active', CORE_STATE.webSearchActive);
  });

  DOM.newChatBtn.addEventListener('click', () => createNewChatNode());
  DOM.searchHistory.addEventListener('input', () => renderHistoryList());

  // Input Engine Core Framework Event Hooks
  DOM.fileUploadInput.addEventListener('change', handleFileUploadPayload);
  DOM.chatForm.addEventListener('submit', executeTransactionMessageStream);

  // Modal Control Systems Interceptors
  DOM.btnOpenSettings.addEventListener('click', () => DOM.settingsModal.classList.remove('hidden'));
  DOM.btnCloseSettings.addEventListener('click', () => {
    CORE_STATE.scale = DOM.uiScaleProfile.value;
    CORE_STATE.selectedVoiceName = DOM.voiceSelectionProfile.value;
    localStorage.setItem('novexa-scale', CORE_STATE.scale);
    localStorage.setItem('novexa-voice', CORE_STATE.selectedVoiceName);
    applyThemeAndScale();
    DOM.settingsModal.classList.add('hidden');
  });

  DOM.btnOpenTools.addEventListener('click', () => DOM.toolsModal.classList.remove('hidden'));
  DOM.btnCloseTools.addEventListener('click', () => DOM.toolsModal.classList.add('hidden'));

  // Tool Suite Subsections Routing Engine
  document.querySelectorAll('.tab-nav').forEach(tab => {
    tab.addEventListener('click', (e) => {
      document.querySelectorAll('.tab-nav').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
      e.target.classList.add('active');
      document.getElementById(e.target.getAttribute('data-tab')).classList.remove('hidden');
    });
  });

  document.querySelectorAll('.tool-action-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.tool-action-btn').forEach(b => b.style.borderColor = 'var(--border-color)');
      e.target.style.borderColor = 'var(--accent)';
      CORE_STATE.activeToolAction = {
        action: e.target.getAttribute('data-action'),
        instr: e.target.getAttribute('data-instr')
      };
    });
  });

  DOM.btnTriggerToolOperation.addEventListener('click', executeServerlessTaskPipeline);

  // Suggestion Grid Injectors
  DOM.suggestionGrid.addEventListener('click', (e) => {
    if (e.target.classList.contains('chip')) {
      DOM.userInput.value = e.target.getAttribute('data-prompt');
    }
  });
}

function displayAuthError(msg) {
  DOM.authError.textContent = msg;
  DOM.authError.classList.remove('hidden');
}

// STORAGE SNAPSHOT SYNC ENGINE
async function syncToCloud() {
  if (!CORE_STATE.user) {
    localStorage.setItem('novexa-chats', JSON.stringify(CORE_STATE.chats));
    return;
  }
  try {
    await setDoc(doc(db, "users_workspace", CORE_STATE.user.uid), {
      chats: CORE_STATE.chats,
      updatedTimestamp: Date.now()
    }, { merge: true });
  } catch (err) { console.error("Cloud syncing interception failure:", err); }
}

async function syncFromCloud() {
  if (!CORE_STATE.user) return;
  try {
    const snap = await getDoc(doc(db, "users_workspace", CORE_STATE.user.uid));
    if (snap.exists() && snap.data().chats) {
      CORE_STATE.chats = snap.data().chats;
      renderHistoryList();
      loadChatNode(Object.keys(CORE_STATE.chats)[0] || null);
    } else {
      createNewChatNode();
    }
  } catch (err) { console.error("Cloud hydration breakdown:", err); }
}

// CHAT OBJECT ACTIONS
function createNewChatNode() {
  const id = 'node_' + Date.now();
  CORE_STATE.chats[id] = {
    title: 'New Quantum Matrix Workspace',
    messages: [],
    pinned: false,
    favorite: false,
    updatedAt: Date.now()
  };
  syncToCloud();
  renderHistoryList();
  loadChatNode(id);
}

function loadChatNode(id) {
  if (!id || !CORE_STATE.chats[id]) {
    DOM.chatMessages.innerHTML = '';
    DOM.chatMessages.appendChild(DOM.welcomeContainer);
    DOM.welcomeContainer.classList.remove('hidden');
    CORE_STATE.currentChatId = null;
    return;
  }
  CORE_STATE.currentChatId = id;
  DOM.chatMessages.innerHTML = '';
  
  const chat = CORE_STATE.chats[id];
  if (chat.messages.length === 0) {
    DOM.chatMessages.appendChild(DOM.welcomeContainer);
    DOM.welcomeContainer.classList.remove('hidden');
  } else {
    DOM.welcomeContainer.classList.add('hidden');
    chat.messages.forEach((msg, idx) => appendMessageDOM(msg.role, msg.content, msg.image, msg.document, idx));
  }
  
  document.querySelectorAll('.history-item').forEach(item => {
    item.classList.toggle('active', item.getAttribute('data-id') === id);
  });
}

function renderHistoryList() {
  DOM.historyList.innerHTML = '';
  const filter = DOM.searchHistory.value.toLowerCase();
  
  const targetKeys = Object.keys(CORE_STATE.chats).filter(id => 
    CORE_STATE.chats[id].title.toLowerCase().includes(filter)
  ).sort((a, b) => {
    if (CORE_STATE.chats[a].pinned !== CORE_STATE.chats[b].pinned) {
      return CORE_STATE.chats[a].pinned ? -1 : 1;
    }
    return CORE_STATE.chats[b].updatedAt - CORE_STATE.chats[a].updatedAt;
  });

  targetKeys.forEach(id => {
    const chat = CORE_STATE.chats[id];
    const item = document.createElement('div');
    item.className = `history-item ${id === CORE_STATE.currentChatId ? 'active' : ''}`;
    item.setAttribute('data-id', id);
    
    const metaGroup = document.createElement('div');
    metaGroup.className = 'history-item-meta-group';
    metaGroup.innerHTML = `
      <i class="${chat.pinned ? 'fa-solid fa-thumbtack' : chat.favorite ? 'fa-solid fa-star' : 'fa-regular fa-message'}"></i>
      <span class="history-text">${chat.title}</span>
    `;
    metaGroup.addEventListener('click', () => {
      loadChatNode(id);
      if (window.innerWidth <= 768) DOM.sidebar.classList.remove('open');
    });
    
    const actionsCluster = document.createElement('div');
    actionsCluster.className = 'history-actions-cluster';
    
    const pinBtn = document.createElement('button');
    pinBtn.className = 'history-action-trigger';
    pinBtn.innerHTML = `<i class="fa-solid fa-thumbtack"></i>`;
    pinBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleChatProperty(id, 'pinned'); });

    const favBtn = document.createElement('button');
    favBtn.className = 'history-action-trigger';
    favBtn.innerHTML = `<i class="fa-solid fa-star"></i>`;
    favBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleChatProperty(id, 'favorite'); });

    const delBtn = document.createElement('button');
    delBtn.className = 'history-action-trigger';
    delBtn.innerHTML = `<i class="fa-solid fa-trash"></i>`;
    delBtn.addEventListener('click', (e) => { e.stopPropagation(); purgeChatNode(id); });

    actionsCluster.appendChild(pinBtn);
    actionsCluster.appendChild(favBtn);
    actionsCluster.appendChild(delBtn);
    
    item.appendChild(metaGroup);
    item.appendChild(actionsCluster);
    DOM.historyList.appendChild(item);
  });
}

function toggleChatProperty(id, property) {
  if (!CORE_STATE.chats[id]) return;
  CORE_STATE.chats[id][property] = !CORE_STATE.chats[id][property];
  syncToCloud();
  renderHistoryList();
}

function purgeChatNode(id) {
  CORE_STATE.trashChats[id] = CORE_STATE.chats[id];
  delete CORE_STATE.chats[id];
  syncToCloud();
  renderHistoryList();
  if (CORE_STATE.currentChatId === id) {
    loadChatNode(Object.keys(CORE_STATE.chats)[0] || null);
  }
  showRestoreNotificationBanner(id);
}

function showRestoreNotificationBanner(id) {
  const banner = document.createElement('div');
  banner.className = 'artifact-chip';
  banner.style.position = 'absolute';
  banner.style.bottom = '70px';
  banner.style.left = '20px';
  banner.style.zIndex = '100';
  banner.innerHTML = `Node purged. <button class="btn-secondary-action">Restore Cluster Context</button>`;
  banner.querySelector('button').addEventListener('click', () => {
    if (CORE_STATE.trashChats[id]) {
      CORE_STATE.chats[id] = CORE_STATE.trashChats[id];
      delete CORE_STATE.trashChats[id];
      syncToCloud();
      renderHistoryList();
      loadChatNode(id);
    }
    banner.remove();
  });
  DOM.chatMessages.appendChild(banner);
  setTimeout(() => banner.remove(), 6000);
}

// MULTI-MODAL FILE INGESTION PREPARATION
function handleFileUploadPayload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  const fileType = file.type;

  if (fileType.startsWith('image/')) {
    reader.onload = (event) => {
      CORE_STATE.activeArtifact = { type: 'image', name: file.name, content: event.target.result };
      renderArtifactPreviewChip();
    };
    reader.readAsDataURL(file);
  } else {
    // Parser for plain text based formats (TXT, CSV). For DOCX/PDF, we pass native strings.
    reader.onload = (event) => {
      CORE_STATE.activeArtifact = { type: 'doc', name: file.name, content: event.target.result };
      renderArtifactPreviewChip();
    };
    reader.readAsText(file);
  }
}

function renderArtifactPreviewChip() {
  DOM.artifactPreviewsGrid.innerHTML = '';
  if (!CORE_STATE.activeArtifact) {
    DOM.previewContainer.classList.add('hidden');
    return;
  }
  DOM.previewContainer.classList.remove('hidden');
  const chip = document.createElement('div');
  chip.className = 'artifact-chip';
  chip.innerHTML = `
    <i class="${CORE_STATE.activeArtifact.type === 'image' ? 'fa-solid fa-image' : 'fa-solid fa-file-lines'}"></i>
    <span>${CORE_STATE.activeArtifact.name}</span>
    <button type="button" class="btn-secondary-action" id="btn-clear-artifact"><i class="fa-solid fa-circle-xmark"></i></button>
  `;
  DOM.artifactPreviewsGrid.appendChild(chip);
  document.getElementById('btn-clear-artifact').addEventListener('click', () => {
    CORE_STATE.activeArtifact = null;
    DOM.fileUploadInput.value = '';
    DOM.previewContainer.classList.add('hidden');
  });
}

// SPEECH ENGINE LOGIC ARCHITECTURE
function setupSpeechRecognition() {
  const SpeechEngine = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechEngine) {
    DOM.voiceBtn.style.display = 'none';
    return;
  }
  CORE_STATE.recognition = new SpeechEngine();
  CORE_STATE.recognition.continuous = false;
  CORE_STATE.recognition.interimResults = false;
  CORE_STATE.recognition.lang = 'en-US';

  CORE_STATE.recognition.onstart = () => {
    CORE_STATE.isVoiceActive = true;
    DOM.voiceBtn.style.color = '#ef4444';
  };
  CORE_STATE.recognition.onend = () => {
    CORE_STATE.isVoiceActive = false;
    DOM.voiceBtn.style.color = 'var(--text-main)';
  };
  CORE_STATE.recognition.onresult = (event) => {
    DOM.userInput.value = event.results[0][0].transcript;
  };
}

DOM.voiceBtn.addEventListener('click', () => {
  if (!CORE_STATE.recognition) return;
  if (CORE_STATE.isVoiceActive) CORE_STATE.recognition.stop();
  else CORE_STATE.recognition.start();
});

function synthesizeVoiceOutput(text, buttonRef) {
  if (!('speechSynthesis' in window)) return;
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
    buttonRef.innerHTML = `<i class="fa-solid fa-volume-high"></i>`;
    return;
  }
  const cleanMarkup = text.replace(/[#*`\-_[\]()]/g, '');
  const transmission = new SpeechSynthesisUtterance(cleanMarkup);
  
  if (CORE_STATE.selectedVoiceName) {
    const target = window.speechSynthesis.getVoices().find(v => v.name === CORE_STATE.selectedVoiceName);
    if (target) transmission.voice = target;
  }

  transmission.onend = () => { buttonRef.innerHTML = `<i class="fa-solid fa-volume-high"></i>`; };
  buttonRef.innerHTML = `<i class="fa-solid fa-stop-circle"></i>`;
  window.speechSynthesis.speak(transmission);
}

// APPEND INTERFACE CORE ELEMENTS
function appendMessageDOM(role, content, imageSrc = null, docArtifact = null, index = null) {
  DOM.welcomeContainer.classList.add('hidden');
  const wrapper = document.createElement('div');
  wrapper.className = `message-wrapper ${role}`;
  wrapper.setAttribute('data-index', index);

  const meta = document.createElement('div');
  meta.className = 'message-meta';
  meta.innerHTML = `<span>${role === 'user' ? 'Operator' : 'Novexa Intelligence'}</span>`;

  const box = document.createElement('div');
  box.className = 'message-box';

  if (imageSrc) {
    const img = document.createElement('img');
    img.src = imageSrc;
    box.appendChild(img);
  }
  if (docArtifact) {
    const dChip = document.createElement('div');
    dChip.className = 'artifact-chip';
    dChip.style.marginBottom = '0.5rem';
    dChip.innerHTML = `<i class="fa-solid fa-file-contract"></i> <span>Ref: ${docArtifact.name}</span>`;
    box.appendChild(dChip);
  }

  const textNode = document.createElement('div');
  textNode.className = 'markdown-payload-container';
  if (role === 'user') {
    textNode.textContent = content;
  } else {
    textNode.innerHTML = marked.parse(content);
  }
  box.appendChild(textNode);

  // UTILITY ACTION ACTION STRIPS TOOLBAR
  const toolbar = document.createElement('div');
  toolbar.className = 'message-actions-toolbar';
  
  const copyBtn = document.createElement('button');
  copyBtn.className = 'msg-action-btn';
  copyBtn.innerHTML = `<i class="fa-regular fa-copy"></i>`;
  copyBtn.addEventListener('click', () => navigator.clipboard.writeText(content));

  const speakBtn = document.crea
