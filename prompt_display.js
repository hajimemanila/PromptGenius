/**
 * prompt_display.js - プロンプト一覧とカード表示機能
 */
window.PromptGenius = window.PromptGenius || {};
window.PromptGenius.Display = {
  initialized: false,
  
  init: function() {
    if (this.initialized) return;
    
    // 保存ボタンのイベントリスナー
    const saveButton = document.querySelector('button:has(.fa-save)');
    if (saveButton) {
      saveButton.addEventListener('click', () => this.saveCurrentPrompt());
    }
    
    // 読み込みボタンのイベントリスナー
    const loadButton = document.querySelector('button:has(.fa-folder-open)');
    if (loadButton) {
      loadButton.addEventListener('click', () => this.showPromptSelector());
    }
    
    // コピーボタンのイベントリスナー
    const copyButton = document.querySelector('button:has(.fa-copy)');
    if (copyButton) {
      copyButton.addEventListener('click', () => this.copyPromptToClipboard());
    }
    
    // お気に入りボタンのイベントリスナー
    const favoriteButton = document.querySelector('button:has(.fa-star)');
    if (favoriteButton) {
      favoriteButton.addEventListener('click', () => {
        if (PromptGenius.state.currentPrompt) {
          PromptGenius.Pin.togglePinPrompt(PromptGenius.state.currentPrompt.id);
        }
      });
    }
    
    // 新規作成ボタンのイベントリスナー
    const newPromptButton = document.querySelector('#library-tab button:has(.fa-plus)');
    if (newPromptButton) {
      newPromptButton.addEventListener('click', () => this.createNewPrompt());
    }
    
    this.initialized = true;
  },
  
  updatePromptLibrary: function() {
    const libraryContainer = document.querySelector('#library-tab .space-y-3');
    if (!libraryContainer) return;
    
    // ライブラリをクリア
    libraryContainer.innerHTML = '';
    
    // プロンプトがない場合のメッセージ
    if (!PromptGenius.state.prompts || PromptGenius.state.prompts.length === 0) {
      libraryContainer.innerHTML = `
        <div class="text-center py-8 text-gray-500">
          <i class="fas fa-inbox text-3xl mb-2"></i>
          <p>保存されたプロンプトはありません</p>
        </div>
      `;
      return;
    }
    
    // プロンプトをソート（更新日時の新しい順）
    const sortedPrompts = [...PromptGenius.state.prompts].sort((a, b) => {
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });
    
    // プロンプトカードを生成
    sortedPrompts.forEach(prompt => {
      const card = this.createPromptCard(prompt);
      libraryContainer.appendChild(card);
    });
  },
  
  createPromptCard: function(prompt) {
    const card = document.createElement('div');
    card.className = 'prompt-card bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md';
    card.dataset.id = prompt.id;
    // プロンプト本文をdata属性として追加
    card.dataset.content = prompt.content || '';
    // タグ情報をdata属性に追加
    const tags = prompt.tags || [];
    card.dataset.tags = tags.join(',');
    
    const isPinned = prompt.pinned ? 'fas fa-star text-yellow-500' : 'far fa-star text-gray-400';
    
    const tagsHtml = tags.map(tag =>
      `<span data-tag="${this.escapeHTML(tag)}" class="tag text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded cursor-pointer hover:bg-gray-300">${this.escapeHTML(tag)}</span>`
    ).join(' ');
    
    card.innerHTML = `
      <div class="flex items-start justify-between">
        <div>
          <h3 class="font-medium text-gray-800">${this.escapeHTML(prompt.title)}</h3>
          <p class="text-sm text-gray-500 mt-1">${this.escapeHTML(this.truncateText(prompt.description || '', 60))}</p>
          <div class="mt-2 flex flex-wrap space-x-1">${tagsHtml}</div>
        </div>
        <div class="flex space-x-2">
          <button class="pin-button ${prompt.pinned ? 'text-yellow-500' : 'text-gray-400'} hover:text-yellow-600">
            <i class="${isPinned}"></i>
          </button>
          <button class="prompt-menu text-gray-400 hover:text-gray-600">
            <i class="fas fa-ellipsis-v"></i>
          </button>
        </div>
      </div>
      <div class="mt-3 text-xs text-gray-500 flex items-center justify-between">
        <span>更新: ${this.formatDate(prompt.updatedAt)}</span>
        <span>${prompt.content ? prompt.content.length : 0} 文字</span>
      </div>
    `;
    
    // カードクリックでコピー
    card.addEventListener('click', (e) => {
      if (!e.target.closest('.pin-button') && !e.target.closest('.prompt-menu') && !e.target.closest('.prompt-card-menu')) {
        navigator.clipboard.writeText(prompt.content || '');
        this.showToast('プロンプトをコピーしました');
      }
    });
    
    // カードエリアから離れたらメニューを閉じる
    card.addEventListener('mouseleave', () => {
      const openMenu = card.querySelector('.prompt-card-menu'); if (openMenu) openMenu.remove();
    });
    
    // ピンボタンのイベント
    const pinButton = card.querySelector('.pin-button');
    if (pinButton) {
      pinButton.addEventListener('click', (e) => {
        e.stopPropagation();
        PromptGenius.Pin.togglePinPrompt(prompt.id);
      });
    }
    
    // メニューの実装
    const menuButton = card.querySelector('.prompt-menu');
    if (menuButton) {
      menuButton.addEventListener('click', (e) => {
        e.stopPropagation();
        // 既存メニューを削除
        const old = card.querySelector('.prompt-card-menu'); if (old) old.remove();
        // メニュー作成
        const menu = document.createElement('div');
        menu.className = 'prompt-card-menu absolute right-4 top-8 bg-white border border-gray-200 rounded-md shadow-lg z-10';
        menu.innerHTML = `
          <ul class="bg-white rounded-md">
            <li class="px-4 py-2 hover:bg-gray-200 text-gray-800 copy">コピー</li>
            <li class="px-4 py-2 hover:bg-gray-200 text-gray-800 edit">編集</li>
            <li class="px-4 py-2 hover:bg-gray-200 text-gray-800 duplicate">複製編集</li>
            <li class="px-4 py-2 hover:bg-gray-200 text-gray-800 delete">削除</li>
          </ul>
        `;
        card.appendChild(menu);
        // メニュー項目のイベント
        menu.querySelector('.copy').addEventListener('click', () => { navigator.clipboard.writeText(prompt.content || ''); menu.remove(); });
        menu.querySelector('.edit').addEventListener('click', () => { this.loadPromptToEditor(prompt.id); menu.remove(); });
        menu.querySelector('.duplicate').addEventListener('click', () => {
          const newPrompt = { ...prompt, id: 'prompt_' + Date.now(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
          PromptGenius.state.prompts.push(newPrompt);
          PromptGenius.DataManager.savePrompts(PromptGenius.state.prompts);
          this.loadPromptToEditor(newPrompt.id);
          menu.remove();
        });
        menu.querySelector('.delete').addEventListener('click', () => {
          if (confirm('本当にこのプロンプトを削除しますか？')) {
            PromptGenius.state.prompts = PromptGenius.state.prompts.filter(p => p.id !== prompt.id);
            PromptGenius.DataManager.savePrompts(PromptGenius.state.prompts);
            this.updatePromptLibrary();
            PromptGenius.Pin.updatePinnedPrompts();
          }
          menu.remove();
        });
      });
    }
    
    // タグクリックで絞り込み
    card.querySelectorAll('.tag').forEach(tagEl => {
      tagEl.addEventListener('click', e => {
        e.stopPropagation();
        const tag = e.target.dataset.tag;
        const input = document.getElementById('prompt-search');
        if (input) input.value = tag;
        PromptGenius.Search.filterPrompts(tag.toLowerCase());
      });
    });
    
    return card;
  },
  
  loadPromptToEditor: function(promptId) {
    const prompt = PromptGenius.state.prompts.find(p => p.id === promptId);
    if (!prompt) return;
    
    // エディタにプロンプトをロード
    document.getElementById('prompt-title').value = prompt.title || '';
    document.getElementById('prompt-editor').value = prompt.content || '';
    // タグ欄を設定
    const tagsInput = document.getElementById('prompt-tags');
    if (tagsInput) tagsInput.value = prompt.tags ? prompt.tags.join(', ') : '';
    
    // 現在のプロンプトを設定
    PromptGenius.state.currentPrompt = prompt;
    
    // エディタタブに切り替え
    PromptGenius.Tabs.switchToTab('editor');
  },
  
  saveCurrentPrompt: function() {
    const titleInput = document.getElementById('prompt-title');
    const editorInput = document.getElementById('prompt-editor');
    const tagsInput = document.getElementById('prompt-tags');
    const tags = [];
    if (tagsInput) {
      tagsInput.value.split(',').forEach(t => { const ts = t.trim(); if (ts) tags.push(ts); });
    }
    
    if (!titleInput || !editorInput) return;
    
    const title = titleInput.value.trim();
    const content = editorInput.value.trim();
    
    if (!title || !content) {
      alert('タイトルと内容を入力してください');
      return;
    }
    
    let prompt;
    
    // 既存のプロンプトを編集する場合
    if (PromptGenius.state.currentPrompt) {
      prompt = PromptGenius.state.currentPrompt;
      prompt.title = title;
      prompt.content = content;
      prompt.tags = tags;
      prompt.updatedAt = new Date().toISOString();
    } else {
      // 新規プロンプトの場合
      prompt = {
        id: 'prompt_' + Date.now(),
        title: title,
        content: content,
        tags: tags,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        pinned: false
      };
      
      PromptGenius.state.prompts.push(prompt);
    }
    
    // 現在のプロンプトを更新
    PromptGenius.state.currentPrompt = prompt;
    
    // プロンプトを保存
    PromptGenius.DataManager.savePrompts(PromptGenius.state.prompts);
    
    // ライブラリを更新
    this.updatePromptLibrary();
    
    // ピン留めリストを更新
    PromptGenius.Pin.updatePinnedPrompts();
    
    this.showToast('プロンプトを保存しました');
  },
  
  copyPromptToClipboard: function() {
    const editorInput = document.getElementById('prompt-editor');
    if (!editorInput) return;
    
    const content = editorInput.value.trim();
    if (!content) {
      alert('コピーするプロンプトがありません');
      return;
    }
    
    navigator.clipboard.writeText(content)
      .then(() => {
        // コピー成功の通知
        const copyButton = document.querySelector('button:has(.fa-copy)');
        if (copyButton) {
          const originalText = copyButton.innerHTML;
          copyButton.innerHTML = '<i class="fas fa-check mr-2"></i> コピー完了';
          
          setTimeout(() => {
            copyButton.innerHTML = originalText;
          }, 2000);
        }
      })
      .catch(err => {
        console.error('クリップボードへのコピーに失敗しました:', err);
        alert('コピーに失敗しました');
      });
  },
  
  showPromptSelector: function() {
    // プロンプトがない場合
    if (!PromptGenius.state.prompts || PromptGenius.state.prompts.length === 0) {
      alert('保存されたプロンプトはありません');
      return;
    }
    
    // ライブラリタブに切り替え
    PromptGenius.Tabs.switchToTab('library');
  },
  
  truncateText: function(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  },
  
  formatDate: function(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
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
  },
  
  /**
   * showToast - 画面右下に一時フロート通知を表示
   * @param {string} message - 通知メッセージ
   */
  showToast: function(message) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded shadow-lg';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  },
  
  /**
   * 新規プロンプトを作成
   */
  createNewPrompt: function() {
    // 現在のプロンプトをクリア
    PromptGenius.state.currentPrompt = null;
    
    // エディタをクリア
    const titleInput = document.getElementById('prompt-title');
    const editorInput = document.getElementById('prompt-editor');
    
    if (titleInput && editorInput) {
      titleInput.value = '';
      editorInput.value = '';
    }
    
    // エディタタブに切り替え
    PromptGenius.Tabs.switchToTab('editor');
    
    // フォーカスをタイトル入力欄に設定
    if (titleInput) {
      setTimeout(() => {
        titleInput.focus();
      }, 100);
    }
  }
};
