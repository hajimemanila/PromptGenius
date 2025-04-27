/**
 * script.js - アプリケーション起動とモジュール初期化
 */
window.PromptGenius = window.PromptGenius || {};
window.PromptGenius.state = {
  currentTab: 'editor',
  prompts: [],
  currentPrompt: null,
  editor: null,
  settings: {
    theme: 'light',
    fontSize: 'medium',
    autoSave: true,
    confirmOnClose: true,
    defaultApiProvider: 'openai'
  }
};

function initializeModules() {
  // 各モジュールの初期化
  PromptGenius.Tabs.init();
  PromptGenius.Display.init();
  PromptGenius.Search.init();
  PromptGenius.Pin.init();
  PromptGenius.Settings.init();
  PromptGenius.Analyze.init();
  PromptGenius.Improver.init();
  PromptGenius.DataManager.init();
  PromptGenius.History.init();
  
  // 保存されたプロンプトを読み込む
  PromptGenius.DataManager.loadPrompts().then(prompts => {
    PromptGenius.state.prompts = prompts;
    PromptGenius.Display.updatePromptLibrary();
    PromptGenius.Pin.updatePinnedPrompts();
  });
  
  // 保存された設定を読み込む
  PromptGenius.Settings.loadSettings().then(settings => {
    if (settings) {
      PromptGenius.state.settings = { ...PromptGenius.state.settings, ...settings };
      PromptGenius.Settings.applySettings();
    }
  });
  
  // コンテクストメニューからのテキスト取得
  chrome.storage.local.get(['contextText'], data => {
    const text = data.contextText;
    if (text) {
      // 新規プロンプト状態にし、エディタにテキストを設定
      PromptGenius.state.currentPrompt = null;
      const titleEl = document.getElementById('prompt-title'); if (titleEl) titleEl.value = '';
      const tagsEl = document.getElementById('prompt-tags'); if (tagsEl) tagsEl.value = '';
      const editorEl = document.getElementById('prompt-editor'); if (editorEl) editorEl.value = text;
      PromptGenius.Tabs.switchToTab('editor');
      chrome.storage.local.remove('contextText');
    }
  });
}

// コンテキストメニューのテキストを受信し、エディタに設定
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.contextText) {
    PromptGenius.state.currentPrompt = null;
    const titleEl = document.getElementById('prompt-title'); if (titleEl) titleEl.value = '';
    const tagsEl = document.getElementById('prompt-tags'); if (tagsEl) tagsEl.value = '';
    const editorEl = document.getElementById('prompt-editor'); if (editorEl) editorEl.value = message.contextText;
    PromptGenius.Tabs.switchToTab('editor');
  }
});

// storage に設定された contextText の変更を監視し、サイドパネル開状態でも反映
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.contextText && changes.contextText.newValue) {
    const text = changes.contextText.newValue;
    PromptGenius.state.currentPrompt = null;
    const titleEl = document.getElementById('prompt-title'); if (titleEl) titleEl.value = '';
    const tagsEl = document.getElementById('prompt-tags'); if (tagsEl) tagsEl.value = '';
    const editorEl = document.getElementById('prompt-editor'); if (editorEl) editorEl.value = text;
    PromptGenius.Tabs.switchToTab('editor');
    chrome.storage.local.remove('contextText');
  }
});

document.addEventListener('DOMContentLoaded', initializeModules);
