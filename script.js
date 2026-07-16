/* =========================================================================
   NOVEXA AI — script.js
   Complete vanilla JavaScript application logic.

   NOTE ON ELEMENT IDs
   This script was generated without access to your actual index.html.
   It looks for the element IDs listed below and safely no-ops if an
   element isn't found, so it will not throw errors on a different markup.
   Adjust the IDs in your HTML (or the CONFIG.selectors map below) to match.

   Expected IDs:
     chatMessages, messageForm, messageInput, sendBtn,
     newChatBtn, sidebar, sidebarToggleBtn, historyList,
     themeToggleBtn, voiceBtn, ttsToggleBtn,
     imageUploadInput, imageUploadBtn, imagePreviewContainer,
     fileUploadInput, fileUploadBtn, dropZone,
     settingsBtn, settingsPanel, closeSettingsBtn,
     exportTxtBtn, exportPdfBtn, importChatInput, importChatBtn,
     onlineStatus, toastContainer, appRoot
   ========================================================================= */

(function () {
  'use strict';

  /* =======================================================================
     CONFIG & STATE
     ======================================================================= */
  const CONFIG = {
    apiEndpoint: '/api/chat',
    storageKeys: {
      chats: 'novexa_chats',
      currentChat: 'novexa_current_chat_id',
      settings: 'novexa_settings',
      theme: 'novexa_theme'
    },
    defaultSettings: {
      theme: 'light',
      ttsEnabled: false,
      voiceEnabled: true,
      autoScroll: true,
      fontSize: 'medium'
    }
  };

  const state = {
    chats: [],          // [{ id, title, messages: [{role, content, attachments, timestamp}], createdAt, updatedAt }]
    currentChatId: null,
    settings: { ...CONFIG.defaultSettings },
    pendingAttachments: [], // [{type:'image'|'file', name, dataUrl|null, size}]
    isSending: false,
    recognition: null,
    isRecording: false
  };

  /* =======================================================================
     DOM ELEMENT CACHE
     ======================================================================= */
  const $ = (id) => document.getElementById(id);

  const el = {
    chatMessages: $('chatMessages'),
    messageForm: $('messageForm'),
    messageInput: $('messageInput'),
    sendBtn: $('sendBtn'),
    newChatBtn: $('newChatBtn'),
    sidebar: $('sidebar'),
    sidebarToggleBtn: $('sidebarToggleBtn'),
    historyList: $('historyList'),
    themeToggleBtn: $('themeToggleBtn'),
    voiceBtn: $('voiceBtn'),
    ttsToggleBtn: $('ttsToggleBtn'),
    imageUploadInput: $('imageUploadInput'),
    imageUploadBtn: $('imageUploadBtn'),
    imagePreviewContainer: $('imagePreviewContainer'),
    fileUploadInput: $('fileUploadInput'),
    fileUploadBtn: $('fileUploadBtn'),
    dropZone: $('dropZone') || $('chatMessages') || document.body,
    settingsBtn: $('settingsBtn'),
    settingsPanel: $('settingsPanel'),
    closeSettingsBtn: $('closeSettingsBtn'),
    exportTxtBtn: $('exportTxtBtn'),
    exportPdfBtn: $('exportPdfBtn'),
    importChatInput: $('importChatInput'),
    importChatBtn: $('importChatBtn'),
    onlineStatus: $('onlineStatus'),
    toastContainer: $('toastContainer'),
    appRoot: $('appRoot') || document.body
  };

  /* =======================================================================
     UTILITIES
     ======================================================================= */
  function uid(prefix) {
    return (prefix || 'id') + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function safeJSONParse(str, fallback) {
    try {
      return JSON.parse(str);
    } catch (e) {
      return fallback;
    }
  }

  function downloadBlob(content, filename, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function formatTimestamp(ts) {
    const d = new Date(ts);
    return d.toLocaleString();
  }

  /* =======================================================================
     TOAST NOTIFICATIONS
     ======================================================================= */
  function ensureToastContainer() {
    if (el.toastContainer) return el.toastContainer;
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'novexa-toast-container';
    Object.assign(container.style, {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: '9999',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    });
    document.body.appendChild(container);
    el.toastContainer = container;
    return container;
  }

  function showToast(message, type) {
    const container = ensureToastContainer();
    const toast = document.createElement('div');
    toast.className = 'novexa-toast novexa-toast-' + (type || 'info');
    toast.textContent = message;
    Object.assign(toast.style, {
      padding: '10px 16px',
      borderRadius: '8px',
      color: '#fff',
      fontSize: '14px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      opacity: '0',
      transform: 'translateY(10px)',
      transition: 'opacity 0.25s ease, transform 0.25s ease',
      background:
        type === 'error' ? '#e53e3e' :
        type === 'success' ? '#38a169' :
        type === 'warning' ? '#dd6b20' : '#3182ce'
    });
    container.appendChild(toast);
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    });
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  /* =======================================================================
     SETTINGS MANAGEMENT
     ======================================================================= */
  function loadSettings() {
    const saved = safeJSONParse(localStorage.getItem(CONFIG.storageKeys.settings), null);
    state.settings = saved ? { ...CONFIG.defaultSettings, ...saved } : { ...CONFIG.defaultSettings };
    applyTheme(state.settings.theme);
    applyFontSize(state.settings.fontSize);
  }

  function saveSettings() {
    localStorage.setItem(CONFIG.storageKeys.settings, JSON.stringify(state.settings));
  }

  function applyFontSize(size) {
    document.documentElement.setAttribute('data-font-size', size);
  }

  function initSettingsPanel() {
    if (el.settingsBtn && el.settingsPanel) {
      el.settingsBtn.addEventListener('click', () => {
        el.settingsPanel.classList.toggle('open');
        el.settingsPanel.setAttribute('aria-hidden', el.settingsPanel.classList.contains('open') ? 'false' : 'true');
      });
    }
    if (el.closeSettingsBtn && el.settingsPanel) {
      el.closeSettingsBtn.addEventListener('click', () => {
        el.settingsPanel.classList.remove('open');
        el.settingsPanel.setAttribute('aria-hidden', 'true');
      });
    }

    // Optional settings inputs, wired defensively if present in HTML.
    const ttsCheckbox = document.getElementById('settingTtsEnabled');
    if (ttsCheckbox) {
      ttsCheckbox.checked = state.settings.ttsEnabled;
      ttsCheckbox.addEventListener('change', (e) => {
        state.settings.ttsEnabled = e.target.checked;
        saveSettings();
      });
    }

    const voiceCheckbox = document.getElementById('settingVoiceEnabled');
    if (voiceCheckbox) {
      voiceCheckbox.checked = state.settings.voiceEnabled;
      voiceCheckbox.addEventListener('change', (e) => {
        state.settings.voiceEnabled = e.target.checked;
        saveSettings();
      });
    }

    const fontSizeSelect = document.getElementById('settingFontSize');
    if (fontSizeSelect) {
      fontSizeSelect.value = state.settings.fontSize;
      fontSizeSelect.addEventListener('change', (e) => {
        state.settings.fontSize = e.target.value;
        applyFontSize(e.target.value);
        saveSettings();
      });
    }
  }

  /* =======================================================================
     THEME (DARK / LIGHT)
     ======================================================================= */
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    state.settings.theme = theme;
  }

  function toggleTheme() {
    const next = state.settings.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    saveSettings();
    showToast('Switched to ' + next + ' theme', 'info');
  }

  function initTheme() {
    loadSettings();
    if (el.themeToggleBtn) {
      el.themeToggleBtn.addEventListener('click', toggleTheme);
    }
  }

  /* =======================================================================
     SIDEBAR TOGGLE
     ======================================================================= */
  function initSidebar() {
    if (el.sidebarToggleBtn && el.sidebar) {
      el.sidebarToggleBtn.addEventListener('click', () => {
        el.sidebar.classList.toggle('open');
        el.appRoot.classList.toggle('sidebar-open');
      });
    }
  }

  /* =======================================================================
     CHAT HISTORY (localStorage persistence)
     ======================================================================= */
  function loadChats() {
    const saved = safeJSONParse(localStorage.getItem(CONFIG.storageKeys.chats), null);
    state.chats = Array.isArray(saved) ? saved : [];
    state.currentChatId = localStorage.getItem(CONFIG.storageKeys.currentChat) || null;

    if (!state.chats.length) {
      createNewChat();
    } else if (!state.currentChatId || !state.chats.find((c) => c.id === state.currentChatId)) {
      state.currentChatId = state.chats[0].id;
    }
    renderHistoryList();
    renderMessages();
  }

  function persistChats() {
    localStorage.setItem(CONFIG.storageKeys.chats, JSON.stringify(state.chats));
    if (state.currentChatId) {
      localStorage.setItem(CONFIG.storageKeys.currentChat, state.currentChatId);
    }
  }

  function getCurrentChat() {
    return state.chats.find((c) => c.id === state.currentChatId) || null;
  }

  function createNewChat() {
    const chat = {
      id: uid('chat'),
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    state.chats.unshift(chat);
    state.currentChatId = chat.id;
    persistChats();
    renderHistoryList();
    renderMessages();
    return chat;
  }

  function deleteChat(chatId) {
    state.chats = state.chats.filter((c) => c.id !== chatId);
    if (state.currentChatId === chatId) {
      state.currentChatId = state.chats.length ? state.chats[0].id : null;
      if (!state.chats.length) createNewChat();
    }
    persistChats();
    renderHistoryList();
    renderMessages();
  }

  function switchChat(chatId) {
    if (!state.chats.find((c) => c.id === chatId)) return;
    state.currentChatId = chatId;
    persistChats();
    renderHistoryList();
    renderMessages();
    if (window.innerWidth <= 768 && el.sidebar) {
      el.sidebar.classList.remove('open');
    }
  }

  function renderHistoryList() {
    if (!el.historyList) return;
    el.historyList.innerHTML = '';
    state.chats
      .slice()
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .forEach((chat) => {
        const item = document.createElement('div');
        item.className = 'history-item' + (chat.id === state.currentChatId ? ' active' : '');
        item.dataset.chatId = chat.id;

        const titleSpan = document.createElement('span');
        titleSpan.className = 'history-item-title';
        titleSpan.textContent = chat.title || 'New Chat';
        item.appendChild(titleSpan);

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'history-item-delete';
        deleteBtn.setAttribute('aria-label', 'Delete chat');
        deleteBtn.textContent = '✕';
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (confirm('Delete this chat?')) deleteChat(chat.id);
        });
        item.appendChild(deleteBtn);

        item.addEventListener('click', () => switchChat(chat.id));
        el.historyList.appendChild(item);
      });
  }

  function initNewChatButton() {
    if (el.newChatBtn) {
      el.newChatBtn.addEventListener('click', () => {
        createNewChat();
        showToast('Started a new chat', 'success');
      });
    }
  }

  /* =======================================================================
     MARKDOWN RENDERING (lightweight, dependency-free)
     ======================================================================= */
  function renderMarkdown(rawText) {
    const text = String(rawText);
    const codeBlocks = [];

    // Extract fenced code blocks first so their contents are never
    // touched by other markdown rules.
    let working = text.replace(/```(\w+)?\n?([\s\S]*?)```/g, (match, lang, code) => {
      const idx = codeBlocks.length;
      codeBlocks.push({ lang: (lang || 'plaintext').toLowerCase(), code: code.replace(/\n$/, '') });
      return '\u0000CODEBLOCK' + idx + '\u0000';
    });

    // Escape remaining HTML to prevent injection.
    working = escapeHtml(working);

    // Inline code
    working = working.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

    // Bold / italic
    working = working.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    working = working.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    working = working.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Links [text](url)
    working = working.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // Headers
    working = working.replace(/^### (.*)$/gm, '<h3>$1</h3>');
    working = working.replace(/^## (.*)$/gm, '<h2>$1</h2>');
    working = working.replace(/^# (.*)$/gm, '<h1>$1</h1>');

    // Unordered lists
    working = working.replace(/(^|\n)((?:[-*] .*(?:\n|$))+)/g, (match, lead, block) => {
      const items = block.trim().split('\n').map((line) =>
        '<li>' + line.replace(/^[-*]\s+/, '') + '</li>').join('');
      return lead + '<ul>' + items + '</ul>';
    });

    // Numbered lists
    working = working.replace(/(^|\n)((?:\d+\. .*(?:\n|$))+)/g, (match, lead, block) => {
      const items = block.trim().split('\n').map((line) =>
        '<li>' + line.replace(/^\d+\.\s+/, '') + '</li>').join('');
      return lead + '<ol>' + items + '</ol>';
    });

    // Line breaks (paragraphs)
    working = working
      .split(/\n{2,}/)
      .map((para) => (/^<(h1|h2|h3|ul|ol)/.test(para.trim()) ? para : '<p>' + para.replace(/\n/g, '<br>') + '</p>'))
      .join('');

    // Re-insert code blocks as syntax-highlighted <pre><code> with copy button.
    working = working.replace(/\u0000CODEBLOCK(\d+)\u0000/g, (match, idx) => {
      const block = codeBlocks[Number(idx)];
      const highlighted = highlightCode(block.code, block.lang);
      const blockId = uid('code');
      return (
        '<div class="code-block-wrapper" data-code-id="' + blockId + '">' +
          '<div class="code-block-header">' +
            '<span class="code-block-lang">' + escapeHtml(block.lang) + '</span>' +
            '<button type="button" class="code-copy-btn" data-copy-target="' + blockId + '">Copy</button>' +
          '</div>' +
          '<pre><code id="' + blockId + '" class="language-' + escapeHtml(block.lang) + '">' + highlighted + '</code></pre>' +
        '</div>'
      );
    });

    return working;
  }

  /* =======================================================================
     LIGHTWEIGHT SYNTAX HIGHLIGHTING (regex-based, no external library)
     ======================================================================= */
  function highlightCode(code, lang) {
    const escaped = escapeHtml(code);
    const keywordsByLang = {
      javascript: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'new', 'import', 'export', 'default', 'from', 'async', 'await', 'try', 'catch', 'finally', 'switch', 'case', 'break', 'continue', 'typeof', 'null', 'undefined', 'true', 'false', 'this', 'extends', 'super'],
      python: ['def', 'return', 'if', 'elif', 'else', 'for', 'while', 'class', 'import', 'from', 'as', 'try', 'except', 'finally', 'with', 'lambda', 'None', 'True', 'False', 'self', 'yield', 'pass', 'break', 'continue', 'raise'],
      html: [],
      css: []
    };
    const keywords = keywordsByLang[lang] || keywordsByLang.javascript;

    // Tokenize with placeholders to avoid double-highlighting inside strings/comments.
    const tokens = [];
    let out = escaped;

    // Comments: // ... and # ... and /* ... */
    out = out.replace(/(\/\/.*?$|#.*?$)/gm, (m) => stash(m, 'comment'));
    out = out.replace(/\/\*[\s\S]*?\*\//g, (m) => stash(m, 'comment'));

    // Strings: 'x', "x", `x`
    out = out.replace(/(&quot;.*?&quot;|&#39;.*?&#39;|`.*?`)/g, (m) => stash(m, 'string'));

    // Numbers
    out = out.replace(/\b(\d+(\.\d+)?)\b/g, (m) => stash(m, 'number'));

    // Keywords
    if (keywords.length) {
      const kwPattern = new RegExp('\\b(' + keywords.join('|') + ')\\b', 'g');
      out = out.replace(kwPattern, (m) => stash(m, 'keyword'));
    }

    // Function calls: identifier(
    out = out.replace(/\b([A-Za-z_$][\w$]*)\s*(?=\()/g, (m, name) => stash(name, 'function') + '');

    function stash(text, type) {
      const idx = tokens.length;
      tokens.push('<span class="tok-' + type + '">' + text + '</span>');
      return '\u0001TOK' + idx + '\u0001';
    }

    out = out.replace(/\u0001TOK(\d+)\u0001/g, (m, idx) => tokens[Number(idx)]);
    return out;
  }

  /* =======================================================================
     COPY BUTTON HANDLING (event delegation)
     ======================================================================= */
  function initCodeCopyDelegation() {
    if (!el.chatMessages) return;
    el.chatMessages.addEventListener('click', (e) => {
      const btn = e.target.closest('.code-copy-btn');
      if (!btn) return;
      const targetId = btn.getAttribute('data-copy-target');
      const codeEl = document.getElementById(targetId);
      if (!codeEl) return;
      const text = codeEl.textContent;
      navigator.clipboard.writeText(text).then(() => {
        const original = btn.textContent;
        btn.textContent = 'Copied!';
        showToast('Code copied to clipboard', 'success');
        setTimeout(() => (btn.textContent = original), 1500);
      }).catch(() => {
        showToast('Failed to copy code', 'error');
      });
    });
  }

  /* =======================================================================
     MESSAGE RENDERING
     ======================================================================= */
  function renderMessages() {
    if (!el.chatMessages) return;
    const chat = getCurrentChat();
    el.chatMessages.innerHTML = '';
    if (!chat) return;

    chat.messages.forEach((msg) => appendMessageToDOM(msg));

    if (state.settings.autoScroll) {
      scrollToBottom();
    }
  }

  function appendMessageToDOM(msg) {
    if (!el.chatMessages) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'message message-' + msg.role;

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.innerHTML = renderMarkdown(msg.content);

    // Render attachments (images/files) if present.
    if (msg.attach
