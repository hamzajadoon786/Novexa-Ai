import { 
  auth, db, 
  signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail, onAuthStateChanged,
  collection, addDoc, getDocs, query, where, orderBy, limit 
} from "./firebase.js";

const state = {
  user: null,
  isGuest: false,
  activeSessionId: null,
  currentAttachment: null,
  sessionMemory: [],
  systemMode: 'login'
};

const DOM = {
  authScreen: document.getElementById('auth-screen'),
  appScreen: document.getElementById('app-screen'),
  authForm: document.getElementById('auth-form'),
  authEmail: document.getElementById('auth-email'),
  authPassword: document.getElementById('auth-password'),
  authConfirmPassword: document.getElementById('auth-confirm-password'),
  authSubmitBtn: document.getElementById('auth-submit-btn'),
  authToggleModeBtn: document.getElementById('auth-toggle-mode-btn'),
  authForgotBtn: document.getElementById('auth-forgot-btn'),
  authGuestBtn: document.getElementById('auth-guest-btn'),
  authSubtitle: document.getElementById('auth-subtitle'),
  confirmPassGroup: document.getElementById('confirm-pass-field-group'),
  passFieldGroup: document.getElementById('pass-field-group'),
  globalLoader: document.getElementById('app-global-loader'),
  toastContainer: document.getElementById('toast-container'),
  chatViewport: document.getElementById('chat-viewport'),
  emptyState: document.getElementById('empty-state'),
  chatTextarea: document.getElementById('chat-textarea'),
  messageSendBtn: document.getElementById('message-send-btn'),
  newChatBtn: document.getElementById('new-chat-btn'),
  chatHistoryContainer: document.getElementById('chat-history-container'),
  logoutActionBtn: document.getElementById('logout-action-btn'),
  profileName: document.getElementById('profile-name'),
  profileAvatar: document.getElementById('profile-avatar'),
  workspaceStatus: document.getElementById('workspace-status'),
  themeToggleBtn: document.getElementById('theme-toggle-btn'),
  pwaInstallBtn: document.getElementById('pwa-install-btn'),
  sidebarToggleMobile: document.getElementById('sidebar-toggle-mobile'),
  appSidebar: document.getElementById('app-sidebar'),
  fileUploadPdf: document.getElementById('file-upload-pdf'),
  fileUploadImg: document.getElementById('file-upload-img'),
  attachmentPreviewBar: document.getElementById('attachment-preview-bar'),
  attachmentName: document.getElementById('attachment-name'),
  attachmentClearBtn: document.getElementById('attachment-clear-btn'),
  voiceInputBtn: document.getElementById('voice-input-btn')
};

function showNotification(msg, variant = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${variant}`;
  toast.innerText = msg;
  DOM.toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

function showLoader(visible) {
  if (visible) DOM.globalLoader.classList.remove('hidden');
  else DOM.globalLoader.classList.add('hidden');
}

onAuthStateChanged(auth, (user) => {
  showLoader(false);
  if (user) {
    state.user = user;
    state.isGuest = false;
    transitionToWorkspace();
  } else if (!state.isGuest) {
    transitionToAuth();
  }
});

function transitionToWorkspace() {
  DOM.authScreen.classList.add('hidden');
  DOM.appScreen.classList.remove('hidden');
  if (state.isGuest) {
    DOM.profileName.innerText = "Guest Active Context";
    DOM.profileAvatar.innerText = "G";
    DOM.workspaceStatus.innerText = "Local Standalone System";
    DOM.workspaceStatus.style.color = "var(--text-muted)";
    loadLocalSessionHistory();
  } else {
    DOM.profileName.innerText = state.user.email.split('@')[0];
    DOM.profileAvatar.innerText = state.user.email.substring(0,2).toUpperCase();
    DOM.workspaceStatus.innerText = "Cloud Sync Online";
    loadCloudSessionHistory();
  }
  createNewSession();
}

function transitionToAuth() {
  DOM.appScreen.classList.add('hidden');
  DOM.authScreen.classList.remove('hidden');
  resetAuthFormState('login');
}

function resetAuthFormState(targetMode) {
  state.systemMode = targetMode;
  DOM.authForm.reset();
  
  if (targetMode === 'login') {
    DOM.authSubtitle.innerText = "Sign in to your professional workspace";
    DOM.confirmPassGroup.classList.add('hidden');
    DOM.passFieldGroup.classList.remove('hidden');
    DOM.authSubmitBtn.innerText = "Sign In";
    DOM.authToggleModeBtn.innerText = "Create Account";
    DOM.authForgotBtn.classList.remove('hidden');
  } else if (targetMode === 'register') {
    DOM.authSubtitle.innerText = "Establish secure user environment parameters";
    DOM.confirmPassGroup.classList.remove('hidden');
    DOM.passFieldGroup.classList.remove('hidden');
    DOM.authSubmitBtn.innerText = "Create Account";
    DOM.authToggleModeBtn.innerText = "Return to Login";
    DOM.authForgotBtn.classList.add('hidden');
  } else if (targetMode === 'forgot') {
    DOM.authSubtitle.innerText = "Transmit profile access restoration link";
    DOM.confirmPassGroup.classList.add('hidden');
    DOM.passFieldGroup.classList.add('hidden');
    DOM.authSubmitBtn.innerText = "Reset Password";
    DOM.authToggleModeBtn.innerText = "Return to Login";
    DOM.authForgotBtn.classList.add('hidden');
  }
}

DOM.authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = DOM.authEmail.value.trim();
  const password = DOM.authPassword.value;
  const confirmPassword = DOM.authConfirmPassword.value;

  showLoader(true);
  try {
    if (state.systemMode === 'login') {
      await signInWithEmailAndPassword(auth, email, password);
      showNotification("Identity confirmed successfully.");
    } else if (state.systemMode === 'register') {
      if (password !== confirmPassword) {
        throw new Error("Form validation failure: Password verification mismatch.");
      }
      await createUserWithEmailAndPassword(auth, email, password);
      showNotification("Secure account initialized.");
    } else if (state.systemMode === 'forgot') {
      await sendPasswordResetEmail(auth, email);
      showNotification("Restoration tracking data transmitted to email target.");
      resetAuthFormState('login');
    }
  } catch (err) {
    showNotification(err.message, 'error');
  } finally {
    showLoader(false);
  }
});

DOM.authToggleModeBtn.addEventListener('click', () => {
  if (state.systemMode === 'login') resetAuthFormState('register');
  else resetAuthFormState('login');
});

DOM.authForgotBtn.addEventListener('click', () => resetAuthFormState('forgot'));

DOM.authGuestBtn.addEventListener('click', () => {
  state.isGuest = true;
  state.user = null;
  transitionToWorkspace();
  showNotification("Temporary isolated local space initialized.", 'success');
});

DOM.logoutActionBtn.addEventListener('click', async () => {
  if (state.isGuest) {
    state.isGuest = false;
    transitionToAuth();
  } else {
    await signOut(auth);
  }
});

function createNewSession() {
  state.activeSessionId = 'session_' + Date.now();
  state.sessionMemory = [];
  DOM.chatViewport.innerHTML = '';
  DOM.emptyState.classList.remove('hidden');
  clearAttachedAsset();
  renderHistorySidebarTree();
}

function appendMessageElement(sender, content) {
  DOM.emptyState.classList.add('hidden');
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${sender}`;
  
  if (content.includes('```')) {
    const segments = content.split('```');
    for(let i=0; i < segments.length; i++) {
      if (i % 2 === 1) {
        const pre = document.createElement('pre');
        pre.innerText = segments[i].trim();
        bubble.appendChild(pre);
      } else {
        const txt = document.createTextNode(segments[i]);
        bubble.appendChild(txt);
      }
    }
  } else {
    bubble.innerText = content;
  }
  
  DOM.chatViewport.appendChild(bubble);
  DOM.chatViewport.scrollTop = DOM.chatViewport.scrollHeight;
}

async function transmitSequence() {
  const textInput = DOM.chatTextarea.value.trim();
  if (!textInput && !state.currentAttachment) return;

  let computedPrompt = textInput;
  if (state.currentAttachment) {
    computedPrompt = `[Context payload attached: ${state.currentAttachment.name}]\n\n${textInput || "Extract summary details from resource context."}`;
  }

  appendMessageElement('user', computedPrompt);
  DOM.chatTextarea.value = '';
  clearAttachedAsset();

  state.sessionMemory.push({ role: 'user', content: computedPrompt });
  
  const loaderBubble = document.createElement('div');
  loaderBubble.className = 'chat-bubble assistant';
  loaderBubble.innerText = 'Analyzing stream context execution hooks...';
  DOM.chatViewport.appendChild(loaderBubble);

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: state.sessionMemory })
    });
    
    const parsed = await res.json();
    loaderBubble.remove();

    if (parsed.error) throw new Error(parsed.error);

    appendMessageElement('assistant', parsed.message);
    state.sessionMemory.push({ role: 'assistant', content: parsed.message });
    
    commitSessionToStorage();

  } catch (err) {
    loaderBubble.remove();
    showNotification(`Transmission fault: ${err.message}`, 'error');
  }
}

const systemicInstructions = {
  writing: "Transform target details into clear professional documentation profiles matching business styles.",
  code: "Provide optimized software execution structural code patterns resolving engineering constraints.",
  translate: "Translate structural language metrics into global localized variants preserving technical tone.",
  resume: "Refine candidate profiles into standard chronological curriculum vitae matching automated search engines.",
  business: "Map operational data matrices into structured financial summaries or competitive analysis frameworks."
};

document.querySelectorAll('.tool-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    const coreKey = chip.getAttribute('data-tool');
    const instructionTemplate = systemicInstructions[coreKey];
    DOM.chatTextarea.value = `[System Mode Active: ${chip.innerText}]\n${instructionTemplate}\nTarget Data Context: `;
    DOM.chatTextarea.focus();
  });
});

function commitSessionToStorage() {
  if (state.isGuest) {
    const currentLocalArchive = JSON.parse(localStorage.getItem('novexa_local_store') || '[]');
    const currentRecordIndex = currentLocalArchive.findIndex(item => item.id === state.activeSessionId);
    const archivePayload = {
      id: state.activeSessionId,
      title: state.sessionMemory[0]?.content.substring(0, 30) || "Isolated Session Asset",
      memory: state.sessionMemory
    };
    if (currentRecordIndex > -1) currentLocalArchive[currentRecordIndex] = archivePayload;
    else currentLocalArchive.unshift(archivePayload);
    localStorage.setItem('novexa_local_store', JSON.stringify(currentLocalArchive));
    loadLocalSessionHistory();
  } else {
    addDoc(collection(db, "conversations"), {
      userId: state.user.uid,
      sessionId: state.activeSessionId,
      title: state.sessionMemory[0]?.content.substring(0, 30) || "Synchronized Context Tracking Line",
      memory: state.sessionMemory,
      timestamp: Date.now()
    }).then(() => loadCloudSessionHistory()).catch(e => console.error("Cloud sync mismatch:", e));
  }
}

let localizedHistoryReference = [];
function loadLocalSessionHistory() {
  localizedHistoryReference = JSON.parse(localStorage.getItem('novexa_local_store') || '[]');
  renderHistorySidebarTree(localizedHistoryReference);
}

async function loadCloudSessionHistory() {
  try {
    const queryConstraint = query(
      collection(db, "conversations"),
      where("userId", "==", state.user.uid),
      orderBy("timestamp", "desc"),
      limit(15)
    );
    const snapshot = await getDocs(queryConstraint);
    const pulledRecords = [];
    snapshot.forEach(doc => pulledRecords.push(doc.data()));
    renderHistorySidebarTree(pulledRecords);
  } catch(e) {
    console.warn("Storage sequence fallback tracking active states:", e);
  }
}

function renderHistorySidebarTree(itemsArray = []) {
  DOM.chatHistoryContainer.innerHTML = '';
  if(itemsArray.length === 0 && localizedHistoryReference.length > 0) {
    itemsArray = localizedHistoryReference;
  }
  itemsArray.forEach(item => {
    const historicalRow = document.createElement('div');
    historicalRow.className = `history-item ${item.id === state.activeSessionId ? 'active' : ''}`;
    historicalRow.innerText = item.title || "Stored Tracking Element";
    historicalRow.addEventListener('click', () => {
      state.activeSessionId = item.id || item.sessionId;
      state.sessionMemory = item.memory;
      DOM.chatViewport.innerHTML = '';
      DOM.emptyState.classList.add('hidden');
      state.sessionMemory.forEach(msg => appendMessageElement(msg.role, msg.content));
      document.querySelectorAll('.history-item').forEach(r => r.classList.remove('active'));
      historicalRow.classList.add('active');
    });
    DOM.chatHistoryContainer.appendChild(historicalRow);
  });
}

DOM.fileUploadPdf.addEventListener('change', async (e) => {
  const targetFile = e.target.files[0];
  if (!targetFile) return;
  showLoader(true);
  try {
    const reader = new FileReader();
    reader.onload = async function() {
      const typedarray = new Uint8Array(this.result);
      const pdf = await pdfjsLib.getDocument(typedarray).promise;
      let aggregateTextBuffer = "";
      
      const checkedPageBounds = Math.min(pdf.numPages, 5); 
      for (let i = 1; i <= checkedPageBounds; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        aggregateTextBuffer += textContent.items.map(item => item.str).join(" ") + "\n";
      }
      
      state.currentAttachment = {
        name: targetFile.name,
        type: 'text_document_stream',
        payload: aggregateTextBuffer
      };
      displayAttachmentMetadataRow(targetFile.name);
      showLoader(false);
      showNotification("Document vector structures mapped.");
    };
    reader.readAsArrayBuffer(targetFile);
  } catch (err) {
    showLoader(false);
    showNotification("Failed to parse document stream data properly.", 'error');
  }
});

DOM.fileUploadImg.addEventListener('change', async (e) => {
  const targetFile = e.target.files[0];
  if (!targetFile) return;
  showLoader(true);
  try {
    const result = await Tesseract.recognize(targetFile, 'eng');
    state.currentAttachment = {
      name: targetFile.name,
      type: 'image_ocr_stream',
      payload: result.data.text
    };
    displayAttachmentMetadataRow(targetFile.name);
    showNotification("Optical Character Recognition sequence succeeded.");
  } catch (err) {
    showNotification("System component failed during OCR capture route.", 'error');
  } finally {
    showLoader(false);
  }
});

function displayAttachmentMetadataRow(name) {
  DOM.attachmentName.innerText = name;
  DOM.attachmentPreviewBar.classList.remove('hidden');
}

function clearAttachedAsset() {
  state.currentAttachment = null;
  DOM.attachmentPreviewBar.classList.add('hidden');
  DOM.fileUploadPdf.value = "";
  DOM.fileUploadImg.value = "";
}
DOM.attachmentClearBtn.addEventListener('click', clearAttachedAsset);

let speechRecognitionEngine = null;
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  const SpeechEngineClass = window.SpeechRecognition || window.webkitSpeechRecognition;
  speechRecognitionEngine = new SpeechEngineClass();
  speechRecognitionEngine.continuous = false;
  speechRecognitionEngine.interimResults = false;
  speechRecognitionEngine.lang = 'en-US';

  speechRecognitionEngine.onresult = (e) => {
    const textOutput = e.results[0][0].transcript;
    DOM.chatTextarea.value += textOutput;
    showNotification("Audio context mapped successfully.");
  };

  speechRecognitionEngine.onerror = () => {
    showNotification("Audio capturing system runtime intercept failed.", 'error');
  };
}

DOM.voiceInputBtn.addEventListener('click', () => {
  if (!speechRecognitionEngine) {
    return showNotification("Browser ecosystem configuration restricts Speech-to-Text contexts.", 'error');
  }
  speechRecognitionEngine.start();
  showNotification("Audio capturing stream active... Speak clearly.");
});

DOM.themeToggleBtn.addEventListener('click', () => {
  const root = document.documentElement;
  const targetTheme = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', targetTheme);
});

DOM.sidebarToggleMobile.addEventListener('click', () => {
  DOM.appSidebar.classList.toggle('open');
});

DOM.newChatBtn.addEventListener('click', createNewSession);
DOM.messageSendBtn.addEventListener('click', transmitSequence);
DOM.chatTextarea.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    transmitSequence();
  }
});

let deferredPwaPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPwaPrompt = e;
  DOM.pwaInstallBtn.classList.remove('hidden');
});

DOM.pwaInstallBtn.addEventListener('click', () => {
  if (!deferredPwaPrompt) return;
  deferredPwaPrompt.prompt();
  deferredPwaPrompt.userChoice.then((choice) => {
    if (choice.outcome === 'accepted') {
      DOM.pwaInstallBtn.classList.add('hidden');
    }
    deferredPwaPrompt = null;
  });
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('Service Worker context operating state normal.', reg.scope))
      .catch(err => console.warn('Service Worker allocation blocked:', err));
  });
    }
