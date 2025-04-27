/**
 * tab_functions.js - タブ切り替え機能
 * 各タブの表示切替と関連処理を実装
 */
window.PromptGenius = window.PromptGenius || {};
window.PromptGenius.Tabs = {
  initialized: false,
  
  /** 初期化 */
  init: function() {
    if (this.initialized) return;
    
    this.setupTabListeners();
    this.updateTabNames();
    this.initialized = true;
  },
  
  /** タブの表示名を更新 */
  updateTabNames: function() {
    // ライブラリタブの表示名を「一覧」に変更
    const libraryTab = document.querySelector('.tab-button[data-tab="library"]');
    if (libraryTab) {
      const iconElement = libraryTab.querySelector('i');
      if (iconElement) {
        // アイコンの後のテキストノードを取得して変更
        const textNode = Array.from(libraryTab.childNodes).find(node => 
          node.nodeType === Node.TEXT_NODE && node.textContent.trim());
        if (textNode) {
          textNode.textContent = ' 一覧';
        } else {
          // テキストノードが見つからない場合は、内容全体を置き換え
          libraryTab.innerHTML = '';
          libraryTab.appendChild(iconElement);
          libraryTab.appendChild(document.createTextNode(' 一覧'));
        }
      }
    }
    
    // ライブラリタブ内の「プロンプトライブラリ」という見出しを「プロンプト一覧」に変更
    const libraryTabContent = document.querySelector('#library-tab');
    if (libraryTabContent) {
      const heading = libraryTabContent.querySelector('h2');
      if (heading && heading.textContent === 'プロンプトライブラリ') {
        // 見出しのテキストを変更し、マージンを追加
        heading.textContent = 'プロンプト一覧';
        heading.className = 'text-lg font-medium text-gray-800 mb-4';
        
        // 検索窓の親要素を取得
        const searchContainer = libraryTabContent.querySelector('.relative.mr-3');
        if (searchContainer) {
          // 検索窓の親要素に上部マージンを追加
          searchContainer.className = 'relative mr-3 mt-2';
        }
        
        // フレックスコンテナのレイアウトを調整
        const flexContainer = heading.parentElement;
        if (flexContainer && flexContainer.className.includes('flex')) {
          // フレックスコンテナを縦方向に変更
          flexContainer.className = 'flex flex-col mb-4';
          
          // 子要素のレイアウトを調整
          const childElements = flexContainer.querySelectorAll(':scope > div');
          childElements.forEach(element => {
            if (element.className.includes('flex items-center')) {
              // 子要素の幅を100%に設定
              element.className = 'flex items-center w-full mt-2';
            }
          });
        }
      }
    }
  },
  
  /** 各タブにクリックリスナーを設定 */
  setupTabListeners: function() {
    const tabButtons = document.querySelectorAll('.tab-button');
    
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const tabId = button.getAttribute('data-tab');
        this.switchToTab(tabId);
      });
    });
  },
  
  /** 指定したIDのタブに切り替え */
  switchToTab: function(tabId) {
    // 現在のタブを記録
    PromptGenius.state.currentTab = tabId;
    
    // タブボタンのアクティブ状態を切り替え
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(btn => {
      btn.classList.remove('text-indigo-600', 'border-indigo-500', 'border-b-2');
      btn.classList.add('text-gray-500', 'hover:text-gray-700');
    });
    
    const activeButton = document.querySelector(`.tab-button[data-tab="${tabId}"]`);
    if (activeButton) {
      activeButton.classList.remove('text-gray-500', 'hover:text-gray-700');
      activeButton.classList.add('text-indigo-600', 'border-indigo-500', 'border-b-2');
    }
    
    // タブコンテンツの表示を切り替え
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
      content.classList.remove('active');
    });
    
    const activeContent = document.getElementById(`${tabId}-tab`);
    if (activeContent) {
      activeContent.classList.add('active');
    }
    
    // タブに応じたコンテンツ更新
    this.refreshTabContent(tabId);
  },
  
  /** 現在タブに応じたコンテンツ更新 */
  refreshTabContent: function(tabId) {
    switch(tabId) {
      case 'library':
        PromptGenius.Display.updatePromptLibrary();
        break;
      case 'analysis':
        // 分析タブの更新処理
        break;
      case 'improvement':
        // 改善タブの更新処理
        // 何もしない（分析関数のタブ切り替えイベントハンドラーが処理する）
        break;
      case 'history':
        PromptGenius.History.updateHistoryList();
        break;
    }
  }
};
