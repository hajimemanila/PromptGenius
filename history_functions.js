/**
 * history_functions.js - 分析履歴管理
 */
window.PromptGenius = window.PromptGenius || {};
window.PromptGenius.History = {
  initialized: false,
  
  init: function() {
    if (this.initialized) return;
    
    // 履歴タブが選択されたときに履歴リストを更新
    document.querySelector('.tab-button[data-tab="history"]')?.addEventListener('click', () => {
      this.updateHistoryList();
    });
    
    this.initialized = true;
  },
  
  updateHistoryList: function() {
    const historyContainer = document.querySelector('#history-tab .space-y-4');
    if (!historyContainer) return;
    
    // 履歴を読み込む
    PromptGenius.DataManager.loadAnalysisHistory().then(history => {
      // 履歴をクリア
      historyContainer.innerHTML = '';
      
      // 履歴がない場合のメッセージ
      if (!history || history.length === 0) {
        historyContainer.innerHTML = `
          <div class="text-center py-8 text-gray-500">
            <i class="fas fa-history text-3xl mb-2"></i>
            <p>分析履歴はありません</p>
          </div>
        `;
        return;
      }
      
      // 履歴を新しい順にソート
      const sortedHistory = [...history].sort((a, b) => {
        return new Date(b.timestamp) - new Date(a.timestamp);
      });
      
      // 履歴アイテムを生成
      sortedHistory.forEach(item => {
        const historyItem = this.createHistoryItem(item);
        historyContainer.appendChild(historyItem);
      });
    });
  },
  
  createHistoryItem: function(item) {
    const container = document.createElement('div');
    container.className = 'bg-white p-4 rounded-lg border border-gray-200 shadow-sm';
    container.dataset.id = item.id;
    
    // スコアの色を決定
    const scoreColor = item.scores.overall >= 80 ? 'green' : 
                       item.scores.overall >= 60 ? 'blue' : 'yellow';
    
    container.innerHTML = `
      <div class="flex items-start justify-between mb-2">
        <div>
          <h3 class="font-medium text-gray-800">${this.escapeHTML(item.title || '無題のプロンプト')}</h3>
          <div class="text-xs text-gray-500 mt-1">${this.formatDate(item.timestamp)}</div>
        </div>
        <span class="px-2 py-1 text-xs font-medium bg-${scoreColor}-100 text-${scoreColor}-800 rounded-full">スコア: ${item.scores.overall}%</span>
      </div>
      <p class="text-sm text-gray-600 line-clamp-2 mb-2">
        ${this.escapeHTML(item.summary)}
      </p>
      <button class="text-sm text-indigo-600 hover:text-indigo-800 font-medium view-details">詳細を表示</button>
    `;
    
    // 詳細表示ボタンのイベントリスナー
    container.querySelector('.view-details').addEventListener('click', () => {
      this.showHistoryDetails(item);
    });
    
    return container;
  },
  
  showHistoryDetails: function(item) {
    // 分析タブに切り替え
    PromptGenius.Tabs.switchToTab('analysis');
    
    // 分析結果を表示
    PromptGenius.Analyze.displayAnalysisResult(item);
    
    // エディタにプロンプトをロード
    document.getElementById('prompt-title').value = item.title || '';
    document.getElementById('prompt-editor').value = item.prompt || '';
  },
  
  formatDate: function(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
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
