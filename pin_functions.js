/**
 * pin_functions.js - お気に入り（ピン留め）機能
 */
window.PromptGenius = window.PromptGenius || {};
window.PromptGenius.Pin = {
  initialized: false,
  
  init: function() {
    if (this.initialized) return;
    
    this.setupPinListeners();
    this.initialized = true;
  },
  
  setupPinListeners: function() {
    // サイドバーのピン留めアイテムのイベントリスナー
    document.querySelectorAll('.pinned-item').forEach(item => {
      // アイテムクリックでエディタにロード
      item.addEventListener('click', (e) => {
        if (!e.target.closest('button')) {
          const promptTitle = item.querySelector('.truncate').textContent;
          const prompt = PromptGenius.state.prompts.find(p => p.title === promptTitle);
          if (prompt) {
            PromptGenius.Display.loadPromptToEditor(prompt.id);
          }
        }
      });
      
      // ピンボタンクリックでピン解除
      const pinButton = item.querySelector('button');
      if (pinButton) {
        pinButton.addEventListener('click', (e) => {
          e.stopPropagation();
          const promptTitle = item.querySelector('.truncate').textContent;
          const prompt = PromptGenius.state.prompts.find(p => p.title === promptTitle);
          if (prompt) {
            this.togglePinPrompt(prompt.id);
          }
        });
      }
    });
  },
  
  togglePinPrompt: function(promptId) {
    const promptIndex = PromptGenius.state.prompts.findIndex(p => p.id === promptId);
    if (promptIndex === -1) return;
    
    // ピン状態を切り替え
    PromptGenius.state.prompts[promptIndex].pinned = !PromptGenius.state.prompts[promptIndex].pinned;
    
    // プロンプトを保存
    PromptGenius.DataManager.savePrompts(PromptGenius.state.prompts);
    
    // ピン留めリストを更新
    this.updatePinnedPrompts();
    
    // ライブラリを更新
    PromptGenius.Display.updatePromptLibrary();
    
    // 現在のプロンプトがピン留めされた場合、エディタのピンボタンを更新
    if (PromptGenius.state.currentPrompt && PromptGenius.state.currentPrompt.id === promptId) {
      const favoriteButton = document.querySelector('button:has(.fa-star)');
      if (favoriteButton) {
        const isPinned = PromptGenius.state.prompts[promptIndex].pinned;
        favoriteButton.innerHTML = `<i class="${isPinned ? 'fas' : 'far'} fa-star mr-2"></i> お気に入り`;
      }
    }
  },
  
  updatePinnedPrompts: function() {
    const pinnedContainer = document.querySelector('.px-3.py-2.bg-gray-50 .space-y-1');
    if (!pinnedContainer) return;
    
    // ピン留めリストをクリア
    pinnedContainer.innerHTML = '';
    
    // ピン留めされたプロンプトを取得
    const pinnedPrompts = PromptGenius.state.prompts.filter(p => p.pinned);
    
    // ピン留めがない場合のメッセージ
    if (pinnedPrompts.length === 0) {
      pinnedContainer.innerHTML = `
        <div class="text-sm text-gray-500 text-center py-1">
          ピン留めされたプロンプトはありません
        </div>
      `;
      return;
    }
    
    // ピン留めアイテムを生成
    pinnedPrompts.forEach(prompt => {
      const item = document.createElement('div');
      item.className = 'pinned-item flex items-center justify-between px-2 py-1 rounded text-sm text-gray-700 hover:bg-gray-200 cursor-pointer';
      item.innerHTML = `
        <div class="truncate">${this.escapeHTML(prompt.title)}</div>
        <button class="text-yellow-500 hover:text-yellow-600">
          <i class="fas fa-star"></i>
        </button>
      `;
      
      // アイテムクリックでエディタにロード
      item.addEventListener('click', (e) => {
        if (!e.target.closest('button')) {
          PromptGenius.Display.loadPromptToEditor(prompt.id);
        }
      });
      
      // ピンボタンクリックでピン解除
      const pinButton = item.querySelector('button');
      if (pinButton) {
        pinButton.addEventListener('click', (e) => {
          e.stopPropagation();
          this.togglePinPrompt(prompt.id);
        });
      }
      
      pinnedContainer.appendChild(item);
    });
  },
  
  escapeHTML: function(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
};
