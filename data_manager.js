/**
 * data_manager.js - データのインポート/エクスポートと保存管理
 */
window.PromptGenius = window.PromptGenius || {};
window.PromptGenius.DataManager = {
  initialized: false,
  
  init: function() {
    if (this.initialized) return;
    this.initialized = true;
  },
  
  savePrompts: function(prompts) {
    chrome.storage.local.set({ prompts: prompts });
  },
  
  loadPrompts: function() {
    return new Promise(resolve => {
      chrome.storage.local.get(['prompts'], data => {
        resolve(data.prompts || []);
      });
    });
  },
  
  saveAnalysisHistory: function(history) {
    chrome.storage.local.get(['analysisHistory'], data => {
      const currentHistory = data.analysisHistory || [];
      currentHistory.push(history);
      
      // 履歴は最大50件まで保存
      if (currentHistory.length > 50) {
        currentHistory.shift();
      }
      
      chrome.storage.local.set({ analysisHistory: currentHistory });
    });
  },
  
  loadAnalysisHistory: function() {
    return new Promise(resolve => {
      chrome.storage.local.get(['analysisHistory'], data => {
        resolve(data.analysisHistory || []);
      });
    });
  },
  
  exportData: function() {
    Promise.all([
      this.loadPrompts(),
      this.loadAnalysisHistory(),
      PromptGenius.Settings.loadSettings()
    ]).then(([prompts, analysisHistory, settings]) => {
      const data = {
        prompts: prompts,
        analysisHistory: analysisHistory,
        settings: settings
      };
      
      const dataStr = JSON.stringify(data, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `prompt_genius_export_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      
      URL.revokeObjectURL(url);
    });
  },
  
  importData: function(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        if (data.prompts && Array.isArray(data.prompts)) {
          // 既存プロンプトを取得し、インポート分を追加
          this.loadPrompts().then(existing => {
            const merged = existing.concat(data.prompts);
            chrome.storage.local.set({ prompts: merged }, () => {
              PromptGenius.state.prompts = merged;
              PromptGenius.Display.updatePromptLibrary();
              PromptGenius.Pin.updatePinnedPrompts();
            });
          });
        }
        
        if (data.analysisHistory && Array.isArray(data.analysisHistory)) {
          // 分析履歴をインポート
          chrome.storage.local.set({ analysisHistory: data.analysisHistory }, () => {
            if (PromptGenius.History) {
              PromptGenius.History.updateHistoryList();
            }
          });
        }
        
        if (data.settings) {
          // 設定をインポート
          chrome.storage.local.set({ settings: data.settings }, () => {
            PromptGenius.state.settings = { ...PromptGenius.state.settings, ...data.settings };
            PromptGenius.Settings.applySettings();
          });
        }
        
        alert('データのインポートが完了しました');
      } catch (error) {
        console.error('データのインポートに失敗しました:', error);
        alert('データのインポートに失敗しました。ファイル形式を確認してください。');
      }
    };
    
    reader.readAsText(file);
  },
  
  clearAllData: function() {
    // すべてのデータをクリア
    chrome.storage.local.clear(() => {
      // 状態をリセット
      PromptGenius.state.prompts = [];
      PromptGenius.state.currentPrompt = null;
      
      // デフォルト設定を適用
      PromptGenius.state.settings = {
        theme: 'light',
        fontSize: 'medium',
        autoSave: true,
        confirmOnClose: true,
        defaultApiProvider: 'openai',
        apiKeys: {}
      };
      
      // UIを更新
      PromptGenius.Display.updatePromptLibrary();
      PromptGenius.Pin.updatePinnedPrompts();
      PromptGenius.Settings.applySettings();
      
      if (PromptGenius.History) {
        PromptGenius.History.updateHistoryList();
      }
    });
  }
};
