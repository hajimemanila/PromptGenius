/**
 * search_functions.js - プロンプト検索機能
 * プロンプト一覧の検索と絞り込み機能を実装
 */
window.PromptGenius = window.PromptGenius || {};
window.PromptGenius.Search = {
  initialized: false,
  
  /** 初期化 */
  init: function() {
    if (this.initialized) return;
    
    this.setupSearchListeners();
    this.initialized = true;
  },
  
  /**
   * setupSearchListeners - 検索入力およびクリアボタンのイベントを設定
   * @private
   */
  setupSearchListeners: function() {
    const searchInput = document.getElementById('prompt-search');
    const clearButton = document.getElementById('clear-search');
    
    if (!searchInput || !clearButton) return;
    
    /**
     * handleSearch - 検索キーワード更新時の共通処理
     * @private
     */
    const handleSearch = () => {
      const searchTerm = searchInput.value.trim().toLowerCase();
      if (searchTerm.length > 0) {
        clearButton.classList.remove('hidden');
      } else {
        clearButton.classList.add('hidden');
      }
      this.filterPrompts(searchTerm);
    };

    // イベント登録
    searchInput.addEventListener('input', handleSearch);
    clearButton.addEventListener('click', () => {
      searchInput.value = '';
      handleSearch();
    });
  },
  
  /** 
   * プロンプトを検索語でフィルタリング
   * @param {string} [searchTerm=''] - 検索語
   */
  filterPrompts: function(searchTerm = '') {
    const promptCards = document.querySelectorAll('.prompt-card');
    
    promptCards.forEach(card => {
      const title = card.querySelector('h3').textContent.toLowerCase();
      const description = card.querySelector('p').textContent.toLowerCase();
      const content = (card.dataset.content || '').toLowerCase();
      const tags = (card.dataset.tags || '').toLowerCase();
      
      // タイトル、説明、またはプロンプト本文、またはタグに検索語が含まれているか確認
      if (title.includes(searchTerm) || description.includes(searchTerm) || content.includes(searchTerm) || tags.includes(searchTerm)) {
        card.style.display = '';
      } else {
        card.style.display = 'none';
      }
    });
    
    // 検索結果がない場合のメッセージ表示
    this.toggleNoResultsMessage(searchTerm);
  },
  
  /**
   * 検索結果がない場合のメッセージ表示/非表示
   * @param {string} searchTerm - 検索語
   */
  toggleNoResultsMessage: function(searchTerm) {
    const promptContainer = document.querySelector('#library-tab .space-y-3');
    let noResultsMsg = document.getElementById('no-results-message');
    
    // 表示中のカード数を取得
    const visibleCount = Array.from(document.querySelectorAll('.prompt-card')).filter(
      card => card.style.display !== 'none'
    ).length;
    
    // 検索語があり、表示カードがない場合
    if (searchTerm && visibleCount === 0) {
      const messageHTML = `
        <i class="fas fa-search mb-2 text-xl"></i>
        <p>"${searchTerm}" に一致するプロンプトが見つかりませんでした</p>
      `;
      if (!noResultsMsg) {
        noResultsMsg = document.createElement('div');
        noResultsMsg.id = 'no-results-message';
        noResultsMsg.className = 'text-center py-6 text-gray-500';
        promptContainer.appendChild(noResultsMsg);
      }
      noResultsMsg.innerHTML = messageHTML;
      noResultsMsg.classList.remove('hidden');
    } else if (noResultsMsg) {
      noResultsMsg.classList.add('hidden');
    }
  }
};