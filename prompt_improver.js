/**
 * prompt_improver.js - プロンプト改善機能
 */
window.PromptGenius = window.PromptGenius || {};
window.PromptGenius.Improver = {
  initialized: false,
  
  init: function() {
    if (this.initialized) return;
    // 初期化済みフラグを設定
    this.initialized = true;
  },
  
  improveCurrentPrompt: function() {
    const editorInput = document.getElementById('prompt-editor');
    if (!editorInput) return;
    
    const content = editorInput.value.trim();
    if (!content) {
      alert('改善するプロンプトがありません');
      return;
    }
    
    // 分析が必要な場合は先に分析を実行
    if (!PromptGenius.state.lastAnalysis) {
      PromptGenius.Analyze.analyzeCurrentPrompt();
      
      // 分析後に改善を実行するために少し待機
      setTimeout(() => {
        this.showImprovementDialog(content);
      }, 2000);
      
      return;
    }
    
    this.showImprovementDialog(content);
  },
  
  showImprovementDialog: function(content) {
    // モーダルを作成
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.id = 'improvement-modal';
    
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 class="text-lg font-medium text-gray-800">プロンプト改善</h2>
          <button id="close-improvement" class="text-gray-400 hover:text-gray-500">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="p-4">
          <div class="mb-4">
            <p class="text-sm text-gray-600">
              分析結果に基づいて、以下の改善案を提案します。適用したい改善を選択してください。
            </p>
          </div>
          
          <div class="space-y-3" id="improvement-options">
            <div class="animate-pulse flex space-x-4">
              <div class="flex-1 space-y-4 py-1">
                <div class="h-4 bg-gray-200 rounded w-3/4"></div>
                <div class="h-4 bg-gray-200 rounded"></div>
                <div class="h-4 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button id="apply-improvements" class="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            選択した改善を適用
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // 閉じるボタンのイベントリスナー
    document.getElementById('close-improvement').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    // 改善案を生成
    this.generateImprovements(content).then(improvements => {
      const optionsContainer = document.getElementById('improvement-options');
      optionsContainer.innerHTML = '';
      
      improvements.forEach((improvement, index) => {
        const option = document.createElement('div');
        option.className = 'bg-gray-50 p-3 rounded-md border border-gray-200';
        option.innerHTML = `
          <div class="flex items-start">
            <div class="flex items-center h-5">
              <input id="improvement-${index}" name="improvement" type="checkbox" class="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" ${index === 0 ? 'checked' : ''}>
            </div>
            <div class="ml-3 text-sm">
              <label for="improvement-${index}" class="font-medium text-gray-700">${improvement.title}</label>
              <p class="text-gray-500">${improvement.description}</p>
            </div>
          </div>
        `;
        
        optionsContainer.appendChild(option);
      });
      
      // 適用ボタンのイベントリスナー
      document.getElementById('apply-improvements').addEventListener('click', () => {
        const selectedImprovements = [];
        
        improvements.forEach((improvement, index) => {
          const checkbox = document.getElementById(`improvement-${index}`);
          if (checkbox && checkbox.checked) {
            selectedImprovements.push(improvement);
          }
        });
        
        if (selectedImprovements.length > 0) {
          this.applyImprovements(content, selectedImprovements);
        }
        
        document.body.removeChild(modal);
      });
    });
  },
  
  generateImprovements: function(content) {
    // 実際のAPIリクエストの代わりにモックデータを返す
    return new Promise((resolve) => {
      setTimeout(() => {
        // プロンプトの内容に基づいて改善案を生成
        const hasTarget = content.includes('ターゲット') || content.includes('対象');
        const hasConstraints = content.includes('制約') || content.includes('条件');
        const hasFormat = content.includes('形式') || content.includes('フォーマット');
        const hasExamples = content.includes('例') || content.includes('サンプル');
        
        const improvements = [];
        
        if (!hasTarget) {
          improvements.push({
            title: 'ターゲット層の明確化',
            description: 'プロンプトの対象となるターゲット層や目的をより明確に指定します。',
            apply: (text) => {
              return text + '\n\n# ターゲット層\n- 30〜40代の女性\n- 美容に関心が高い層';
            }
          });
        }
        
        if (!hasConstraints) {
          improvements.push({
            title: '制約条件の追加',
            description: '出力に対する制約条件や要件を追加して、より適切な回答を得られるようにします。',
            apply: (text) => {
              return text + '\n\n# 制約条件\n- 専門用語は極力避け、わかりやすい表現を使用すること\n- ポジティブな表現を心がけること';
            }
          });
        }
        
        if (!hasFormat) {
          improvements.push({
            title: '出力形式の指定',
            description: '望ましい出力形式を指定して、期待通りの回答を得られるようにします。',
            apply: (text) => {
              return text + '\n\n# 出力形式\n- 見出し、本文、まとめの3部構成で作成\n- 各セクションは300文字程度';
            }
          });
        }
        
        if (!hasExamples) {
          improvements.push({
            title: '具体例の追加',
            description: '具体例や参考情報を追加して、AIがより理解しやすくします。',
            apply: (text) => {
              return text + '\n\n# 参考例\n以下のような文体や構成を参考にしてください：\n「このスキンケア製品は、乾燥肌にお悩みの方に特におすすめです。天然由来成分を贅沢に配合し、肌に優しく潤いを与えます。」';
            }
          });
        }
        
        // 文体の改善は常に提案
        improvements.push({
          title: '文体の明確化',
          description: '望ましい文体や調子を指定して、一貫性のある回答を得られるようにします。',
          apply: (text) => {
            return text + '\n\n# 文体\n- 親しみやすく温かみのある文体\n- 専門性と信頼感を感じさせる表現';
          }
        });
        
        resolve(improvements);
      }, 1000);
    });
  },
  
  applyImprovements: function(content, improvements) {
    let improvedContent = content;
    
    // 選択された改善を適用
    improvements.forEach(improvement => {
      improvedContent = improvement.apply(improvedContent);
    });
    
    // エディタに改善されたプロンプトを設定
    const editorInput = document.getElementById('prompt-editor');
    if (editorInput) {
      editorInput.value = improvedContent;
      
      // テキストエリアの高さを調整
      editorInput.style.height = 'auto';
      editorInput.style.height = editorInput.scrollHeight + 'px';
    }
  }
};
