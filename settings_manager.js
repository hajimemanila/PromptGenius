/**
 * settings_manager.js - 設定管理
 */
window.PromptGenius = window.PromptGenius || {};
window.PromptGenius.Settings = {
  initialized: false,
  
  init: function() {
    if (this.initialized) return;
    
    // 設定ボタンのイベントリスナー
    const settingsButton = document.getElementById('settings-button');
    const closeSettings = document.getElementById('close-settings');
    const settingsModal = document.getElementById('settings-modal');
    
    if (settingsButton && closeSettings && settingsModal) {
      settingsButton.addEventListener('click', () => {
        this.updateSettingsForm();
        settingsModal.classList.remove('hidden');
      });
      
      closeSettings.addEventListener('click', () => {
        settingsModal.classList.add('hidden');
      });
    }
    
    // テーマ切り替えボタンのイベントリスナー
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        this.toggleTheme();
      });
    }
    
    // 設定保存ボタンのイベントリスナー
    const saveSettingsButton = document.querySelector('#settings-modal .bg-indigo-600');
    if (saveSettingsButton) {
      saveSettingsButton.addEventListener('click', () => {
        this.saveSettings();
        settingsModal.classList.add('hidden');
      });
    }
    
    // テーマオプションのイベントリスナー
    const themeOptions = document.querySelectorAll('input[name="theme"]');
    themeOptions.forEach(option => {
      option.addEventListener('change', () => {
        const theme = option.value;
        this.setTheme(theme);
      });
    });
    
    // データ管理ボタンのイベントリスナー
    const exportButton = document.querySelector('button:has(.fa-file-export)');
    const importButton = document.querySelector('button:has(.fa-file-import)');
    const clearButton = document.querySelector('button:has(.fa-trash-alt)');
    
    if (exportButton) {
      exportButton.addEventListener('click', () => {
        PromptGenius.DataManager.exportData();
      });
    }
    
    if (importButton) {
      importButton.addEventListener('click', () => {
        this.showImportDialog();
      });
    }
    
    if (clearButton) {
      clearButton.addEventListener('click', () => {
        if (confirm('すべてのデータを削除しますか？この操作は元に戻せません。')) {
          PromptGenius.DataManager.clearAllData();
          alert('すべてのデータを削除しました');
        }
      });
    }
    
    // 初期テーマの適用
    this.applySettings();
    
    this.initialized = true;
  },
  
  loadSettings: function() {
    return new Promise(resolve => {
      chrome.storage.local.get(['settings'], data => {
        resolve(data.settings || null);
      });
    });
  },
  
  saveSettings: function() {
    // フォームから設定を取得
    const themeValue = document.querySelector('input[name="theme"]:checked')?.value || 'light';
    const fontSizeValue = document.querySelector('#settings-modal select')?.value || 'medium';
    const autoSaveValue = document.querySelector('#settings-modal input[type="checkbox"]:nth-of-type(1)')?.checked || false;
    const confirmOnCloseValue = document.querySelector('#settings-modal input[type="checkbox"]:nth-of-type(2)')?.checked || false;
    
    // APIキーを取得
    const openaiKey = document.getElementById('openai-key')?.value || '';
    const geminiKey = document.getElementById('gemini-key')?.value || '';
    const claudeKey = document.getElementById('claude-key')?.value || '';
    // AIモデル名を取得
    const openaiModelVal = document.getElementById('openai-model')?.value || 'gpt-4';
    const geminiModelVal = document.getElementById('gemini-model')?.value || 'gemini-pro';
    const claudeModelVal = document.getElementById('claude-model')?.value || 'claude-3-opus-20240229';
    
    // 設定を更新
    PromptGenius.state.settings = {
      theme: themeValue,
      fontSize: fontSizeValue,
      autoSave: autoSaveValue,
      confirmOnClose: confirmOnCloseValue,
      apiKeys: {
        openai: openaiKey,
        gemini: geminiKey,
        claude: claudeKey
      },
      modelNames: {
        openai: openaiModelVal,
        gemini: geminiModelVal,
        claude: claudeModelVal
      }
    };
    
    // 設定を保存
    chrome.storage.local.set({ settings: PromptGenius.state.settings });
    
    // 設定を適用
    this.applySettings();
  },
  
  updateSettingsForm: function() {
    // テーマ設定
    const themeOptions = document.querySelectorAll('input[name="theme"]');
    themeOptions.forEach(option => {
      option.checked = option.value === PromptGenius.state.settings.theme;
    });
    
    // フォントサイズ設定
    const fontSizeSelect = document.querySelector('#settings-modal select');
    if (fontSizeSelect) {
      const options = fontSizeSelect.options;
      for (let i = 0; i < options.length; i++) {
        if (options[i].value === PromptGenius.state.settings.fontSize) {
          fontSizeSelect.selectedIndex = i;
          break;
        }
      }
    }
    
    // チェックボックス設定
    const autoSaveCheckbox = document.querySelector('#settings-modal input[type="checkbox"]:nth-of-type(1)');
    const confirmOnCloseCheckbox = document.querySelector('#settings-modal input[type="checkbox"]:nth-of-type(2)');
    
    if (autoSaveCheckbox) {
      autoSaveCheckbox.checked = PromptGenius.state.settings.autoSave;
    }
    
    if (confirmOnCloseCheckbox) {
      confirmOnCloseCheckbox.checked = PromptGenius.state.settings.confirmOnClose;
    }
    
    // APIキー設定
    const openaiKeyInput = document.getElementById('openai-key');
    const geminiKeyInput = document.getElementById('gemini-key');
    const claudeKeyInput = document.getElementById('claude-key');
    
    if (openaiKeyInput && PromptGenius.state.settings.apiKeys?.openai) {
      openaiKeyInput.value = PromptGenius.state.settings.apiKeys.openai;
    }
    
    if (geminiKeyInput && PromptGenius.state.settings.apiKeys?.gemini) {
      geminiKeyInput.value = PromptGenius.state.settings.apiKeys.gemini;
    }
    
    if (claudeKeyInput && PromptGenius.state.settings.apiKeys?.claude) {
      claudeKeyInput.value = PromptGenius.state.settings.apiKeys.claude;
    }
    
    // モデル名入力を復元
    const openaiModelInput = document.getElementById('openai-model');
    const geminiModelInput = document.getElementById('gemini-model');
    const claudeModelInput = document.getElementById('claude-model');
    
    if (openaiModelInput && PromptGenius.state.settings.modelNames?.openai) {
      openaiModelInput.value = PromptGenius.state.settings.modelNames.openai;
    }
    
    if (geminiModelInput && PromptGenius.state.settings.modelNames?.gemini) {
      geminiModelInput.value = PromptGenius.state.settings.modelNames.gemini;
    }
    
    if (claudeModelInput && PromptGenius.state.settings.modelNames?.claude) {
      claudeModelInput.value = PromptGenius.state.settings.modelNames.claude;
    }
  },
  
  applySettings: function() {
    // テーマの適用
    this.setTheme(PromptGenius.state.settings.theme);
    
    // フォントサイズの適用
    this.setFontSize(PromptGenius.state.settings.fontSize);
  },
  
  setTheme: function(theme) {
    const htmlElement = document.documentElement;
    const themeToggle = document.getElementById('theme-toggle');
    
    if (theme === 'dark') {
      htmlElement.classList.add('dark');
      if (themeToggle) themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else if (theme === 'light') {
      htmlElement.classList.remove('dark');
      if (themeToggle) themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    } else if (theme === 'system') {
      // システムの設定に合わせる
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        htmlElement.classList.add('dark');
        if (themeToggle) themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
      } else {
        htmlElement.classList.remove('dark');
        if (themeToggle) themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
      }
    }
  },
  
  toggleTheme: function() {
    const htmlElement = document.documentElement;
    const isDark = htmlElement.classList.contains('dark');
    
    // テーマを切り替え
    if (isDark) {
      PromptGenius.state.settings.theme = 'light';
    } else {
      PromptGenius.state.settings.theme = 'dark';
    }
    
    // 設定を適用
    this.setTheme(PromptGenius.state.settings.theme);
    
    // 設定を保存
    chrome.storage.local.set({ settings: PromptGenius.state.settings });
  },
  
  setFontSize: function(size) {
    const body = document.body;
    
    // フォントサイズクラスをリセット
    body.classList.remove('text-xs', 'text-sm', 'text-base', 'text-lg');
    
    // 新しいフォントサイズを適用
    switch (size) {
      case 'small':
        body.classList.add('text-xs');
        break;
      case 'medium':
        body.classList.add('text-sm');
        break;
      case 'large':
        body.classList.add('text-base');
        break;
      default:
        body.classList.add('text-sm');
    }
  },
  
  showImportDialog: function() {
    // ファイル選択ダイアログを表示
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        PromptGenius.DataManager.importData(file);
      }
    };
    input.click();
  }
};
