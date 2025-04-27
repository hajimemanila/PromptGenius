/**
 * analyze_functions.js - プロンプト分析機能
 */
window.PromptGenius = window.PromptGenius || {};
window.PromptGenius.Analyze = {
  initialized: false,
  
  // スタイル要素の参照を保持
  styleElement: null,
  
  // 最後の分析結果と改善案を保持
  lastAnalysisResult: null,
  lastImprovementResult: null,
  lastAnalyzedPrompt: null,
  
  /**
   * 初期化関数 - イベントリスナーを設定
   */
  init: function() {
    if (this.initialized) return;
    
    // 共通のイベントハンドラー関数を作成
    const handleAnalyzeClick = () => this.analyzeCurrentPrompt();
    
    // メインの分析ボタン
    const analyzeButton = document.querySelector('button:has(.fa-chart-bar)');
    if (analyzeButton) {
      analyzeButton.addEventListener('click', handleAnalyzeClick);
    }
    
    // 分析タブの分析ボタン
    const analyzeTabButton = document.querySelector('#analysis-tab button:has(.fa-chart-bar)');
    if (analyzeTabButton) {
      analyzeTabButton.addEventListener('click', handleAnalyzeClick);
    }
    
    // タブ切り替えイベントをフックして改善タブが表示されたときに改善案を再表示
    document.querySelectorAll('.tab-button').forEach(button => {
      button.addEventListener('click', (e) => {
        const tabName = e.currentTarget.getAttribute('data-tab');
        if (tabName === 'improvement' && this.lastImprovementResult) {
          // 改善タブが選択され、かつ改善結果がある場合に表示
          this.displayImprovements(this.lastAnalyzedPrompt, this.lastImprovementResult);
        }
      });
    });
    
    // スタイル要素を一度だけ追加
    this.addCustomStyles();
    
    this.initialized = true;
  },
  
  /**
   * カスタムスタイルを追加する関数
   */
  addCustomStyles: function() {
    // 既にスタイル要素があれば何もしない
    if (this.styleElement) return;
    
    this.styleElement = document.createElement('style');
    this.styleElement.textContent = `
      .improvement-approach {
        color: #1f2937; /* text-gray-800 */
        font-weight: 500; /* font-medium */
        background-color: #f3f4f6; /* bg-gray-100 */
        padding: 0.5rem 0.75rem;
        border-radius: 0.375rem;
        border-left: 3px solid #4f46e5; /* indigo-600 */
      }
      .improvement-description {
        color: #374151; /* text-gray-700 */
        background-color: #fafafa;
        padding: 0.75rem;
        border-radius: 0.375rem;
        line-height: 1.5;
        border: 1px solid #e5e7eb; /* border-gray-200 */
      }
    `;
    document.head.appendChild(this.styleElement);
  },
  
  analyzeCurrentPrompt: function() {
    const editorInput = document.getElementById('prompt-editor');
    const titleInput = document.getElementById('prompt-title');
    
    if (!editorInput || !titleInput) return;
    
    const content = editorInput.value.trim();
    const title = titleInput.value.trim();
    
    if (!content) {
      alert('分析するプロンプトがありません');
      return;
    }
    
    // 最後に分析したプロンプトを保存
    this.lastAnalyzedPrompt = content;
    
    // 分析タブに切り替え
    PromptGenius.Tabs.switchToTab('analysis');
    
    // 分析中の表示
    this.showAnalysisLoading(true);
    
    // APIプロバイダーを取得
    const apiProviderSelect = document.getElementById('api-provider-select');
    const apiProvider = apiProviderSelect?.value || 'OpenAI (GPT-4)';
    
    // 分析の詳細度を取得
    const detailLevelSelect = document.getElementById('analysis-detail-select');
    const detailLevel = detailLevelSelect?.value || '標準';
    
    // 分析リクエストを作成
    const analysisRequest = {
      prompt: content,
      title: title,
      apiProvider: apiProvider,
      detailLevel: detailLevel,
      timestamp: new Date().toISOString()
    };
    
    // APIプロバイダーを直接取得（value属性から）
    let providerKey = apiProvider || 'openai';
    // 分析を実行 (APIリクエスト)
    PromptGenius.API.analyzePrompt(content, providerKey).then(result => {
      // 分析結果を保存
      this.lastAnalysisResult = result;
      
      // 分析結果を表示
      this.displayAnalysisResult(result);
      
      // 分析中の表示を終了
      this.showAnalysisLoading(false);
    }).catch(error => {
      console.error('分析に失敗しました:', error);
      alert('分析に失敗しました: ' + error.message);
      this.showAnalysisLoading(false);
    });
  },
  
  mockAnalyzePrompt: function(request) {
    // 実際のAPIリクエストの代わりにモックデータを返す
    return new Promise((resolve) => {
      setTimeout(() => {
        // プロンプトの長さに基づいて簡易的なスコアを計算
        const length = request.prompt.length;
        const hasTarget = request.prompt.includes('ターゲット') || request.prompt.includes('対象');
        const hasConstraints = request.prompt.includes('制約') || request.prompt.includes('条件');
        const hasFormat = request.prompt.includes('形式') || request.prompt.includes('フォーマット');
        
        // 各項目のスコアを計算
        const clarityScore = hasTarget ? Math.min(85, 50 + Math.random() * 35) : 40 + Math.random() * 30;
        const specificityScore = length > 200 ? Math.min(80, 60 + Math.random() * 20) : 40 + Math.random() * 30;
        const constraintsScore = hasConstraints ? Math.min(75, 50 + Math.random() * 25) : 30 + Math.random() * 30;
        const formatScore = hasFormat ? Math.min(80, 60 + Math.random() * 20) : 40 + Math.random() * 20;
        
        // 総合スコアを計算
        const overallScore = Math.round((clarityScore + specificityScore + constraintsScore + formatScore) / 4);
        
        // 分析結果を作成
        const result = {
          id: 'analysis_' + Date.now(),
          title: request.title,
          prompt: request.prompt,
          timestamp: request.timestamp,
          apiProvider: request.apiProvider,
          detailLevel: request.detailLevel,
          scores: {
            clarity: Math.round(clarityScore),
            specificity: Math.round(specificityScore),
            constraints: Math.round(constraintsScore),
            format: Math.round(formatScore),
            overall: overallScore
          },
          feedback: {
            clarity: hasTarget ? 
              'ターゲット層と目的が明確に指定されています。' : 
              'ターゲット層や目的をより明確に指定すると良いでしょう。',
            specificity: length > 200 ? 
              '具体的な情報が含まれています。' : 
              'より具体的な情報や例を追加すると良いでしょう。',
            constraints: hasConstraints ? 
              '制約条件が指定されています。' : 
              '制約条件や要件をより明確に指定すると良いでしょう。',
            format: hasFormat ? 
              '出力形式が指定されています。' : 
              '望ましい出力形式を指定すると良いでしょう。'
          },
          summary: length > 300 ? 
            '全体的に良好なプロンプトです。具体的な情報が含まれており、目的も明確です。' : 
            'プロンプトの基本要素は含まれていますが、より詳細な情報や具体例を追加することで改善できます。'
        };
        
        resolve(result);
      }, 1500); // 分析に1.5秒かかるシミュレーション
    });
  },
  
  displayAnalysisResult: function(result) {
    const analysisContainer = document.querySelector('#analysis-tab .bg-white.p-4');
    if (!analysisContainer) return;
    
    // スコアと評価のマッピング
    const getScoreRating = (score) => {
      if (score >= 80) return { text: '良好', color: 'green' };
      if (score >= 60) return { text: '普通', color: 'blue' };
      return { text: '改善余地あり', color: 'yellow' };
    };
    
    // 各スコアの評価を取得
    const clarityRating = getScoreRating(result.scores.clarity);
    const specificityRating = getScoreRating(result.scores.specificity);
    const constraintsRating = getScoreRating(result.scores.constraints);
    const formatRating = getScoreRating(result.scores.format);
    
    // 結果HTMLを構築
    let analysisHTML = `
      <h3 class="font-medium text-gray-800 mb-3">分析結果</h3>
      
      <div class="space-y-3">
        <div>
          <div class="flex items-center justify-between">
            <h4 class="text-sm font-medium text-gray-700">明確さ</h4>
            <div class="flex items-center">
              <span class="text-sm font-medium text-${clarityRating.color}-600 mr-2">${clarityRating.text}</span>
              <div class="bg-gray-200 rounded-full h-2 w-24">
                <div class="bg-${clarityRating.color}-500 h-2 rounded-full" style="width: ${result.scores.clarity}%"></div>
              </div>
            </div>
          </div>
          <p class="text-xs text-gray-600 mt-1">${result.feedback.clarity}</p>
        </div>
        
        <div>
          <div class="flex items-center justify-between">
            <h4 class="text-sm font-medium text-gray-700">具体性</h4>
            <div class="flex items-center">
              <span class="text-sm font-medium text-${specificityRating.color}-600 mr-2">${specificityRating.text}</span>
              <div class="bg-gray-200 rounded-full h-2 w-24">
                <div class="bg-${specificityRating.color}-500 h-2 rounded-full" style="width: ${result.scores.specificity}%"></div>
              </div>
            </div>
          </div>
          <p class="text-xs text-gray-600 mt-1">${result.feedback.specificity}</p>
        </div>
        
        <div>
          <div class="flex items-center justify-between">
            <h4 class="text-sm font-medium text-gray-700">制約と指示</h4>
            <div class="flex items-center">
              <span class="text-sm font-medium text-${constraintsRating.color}-600 mr-2">${constraintsRating.text}</span>
              <div class="bg-gray-200 rounded-full h-2 w-24">
                <div class="bg-${constraintsRating.color}-500 h-2 rounded-full" style="width: ${result.scores.constraints}%"></div>
              </div>
            </div>
          </div>
          <p class="text-xs text-gray-600 mt-1">${result.feedback.constraints}</p>
        </div>
        
        <div>
          <div class="flex items-center justify-between">
            <h4 class="text-sm font-medium text-gray-700">出力形式</h4>
            <div class="flex items-center">
              <span class="text-sm font-medium text-${formatRating.color}-600 mr-2">${formatRating.text}</span>
              <div class="bg-gray-200 rounded-full h-2 w-24">
                <div class="bg-${formatRating.color}-500 h-2 rounded-full" style="width: ${result.scores.format}%"></div>
              </div>
            </div>
          </div>
          <p class="text-xs text-gray-600 mt-1">${result.feedback.format}</p>
        </div>
      </div>
      
      <div class="mt-4 pt-3 border-t border-gray-200">
        <h4 class="text-sm font-medium text-gray-700 mb-2">総合評価</h4>
        <p class="text-sm text-gray-600">
          ${result.summary}
        </p>
      </div>
      
      <div class="mt-4 pt-3 border-t border-gray-200">
        <button id="generate-improvements-btn" class="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          <i class="fas fa-magic mr-2"></i> 改善プロンプトを生成する
        </button>
      </div>
    `;
    
    // HTMLを表示
    analysisContainer.innerHTML = analysisHTML;
    
    // 改善プロンプト生成ボタンにイベントリスナーを追加
    const generateBtn = document.getElementById('generate-improvements-btn');
    if (generateBtn) {
      generateBtn.addEventListener('click', () => {
        // APIプロバイダーを取得
        const apiProviderSelect = document.getElementById('api-provider-select');
        const providerKey = apiProviderSelect?.value || 'openai';
        
        // 改善案を生成
        this.generateImprovements(this.lastAnalyzedPrompt, result, providerKey);
        
        // 改善タブに切り替え
        PromptGenius.Tabs.switchToTab('improvement');
      });
    }
  },
  
  /**
   * 改善案を表示する
   * @param {string} originalPrompt - 元のプロンプト
   * @param {Object} improvementResult - 改善結果
   */
  displayImprovements: function(originalPrompt, improvementResult) {
    // カスタムスタイルが追加されているか確認
    this.addCustomStyles();
    const improvementContainer = document.querySelector('#improvement-tab .bg-white.p-4');
    if (!improvementContainer) return;
    
    // 改善案のHTMLを生成
    let improvementsHTML = `
      <h3 class="font-medium text-gray-800 mb-3">改善案</h3>
      <div class="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
        <h4 class="text-sm font-medium text-gray-700 mb-2">元のプロンプト</h4>
        <p class="text-sm text-gray-600 whitespace-pre-wrap">${this.escapeHTML(originalPrompt)}</p>
      </div>
      <div class="space-y-4">
    `;
    
    // 改善案が存在するか確認
    if (improvementResult && Array.isArray(improvementResult.improvements) && improvementResult.improvements.length > 0) {
      // 各改善案を追加
      improvementResult.improvements.forEach((improvement, index) => {
        const colorClass = index === 0 ? 'border-green-200 bg-green-50' : 
                          index === 1 ? 'border-blue-200 bg-blue-50' : 'border-purple-200 bg-purple-50';
        
        improvementsHTML += `
          <div class="border ${colorClass} rounded-md p-4">
            <div class="flex items-center justify-between mb-2">
              <h4 class="font-medium text-gray-800">${improvement.title || `改善案 ${index + 1}`}</h4>
              <span class="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">類似度: ${improvement.similarity_score || '80'}%</span>
            </div>
            <p class="text-sm improvement-approach mb-2"><strong>アプローチ:</strong> ${improvement.approach || '一般的な改善'}</p>
            <p class="text-sm improvement-description mb-3">${improvement.description || 'このプロンプトの改善案です。'}</p>
            <div class="relative">
              <pre class="text-sm bg-white border border-gray-200 rounded-md p-3 whitespace-pre-wrap">${this.escapeHTML(improvement.improved_text || '')}</pre>
              <button class="copy-btn absolute top-2 right-2 text-gray-500 hover:text-gray-700 bg-white rounded-md p-1" data-text="${this.escapeHTML(improvement.improved_text || '')}">
                <i class="fas fa-copy"></i>
              </button>
              <button class="use-btn mt-2 inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700" data-text="${this.escapeHTML(improvement.improved_text || '')}">
                <i class="fas fa-check mr-1"></i> この案を使用
              </button>
            </div>
          </div>
        `;
      });
    } else {
      // 改善案がない場合のメッセージ
      improvementsHTML += `
        <div class="border border-yellow-200 bg-yellow-50 rounded-md p-4">
          <div class="flex items-center mb-2">
            <svg class="h-5 w-5 text-yellow-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>
            <h4 class="font-medium text-gray-800">改善案を生成できませんでした</h4>
          </div>
          <p class="text-sm text-gray-600 mb-3">プロンプトの改善案を生成する際に問題が発生しました。以下のことを試してみてください：</p>
          <ul class="text-sm text-gray-600 list-disc list-inside ml-2">
            <li>別のAPIプロバイダーを選択する</li>
            <li>プロンプトを短くする</li>
            <li>特殊な書式や記号を減らす</li>
            <li>しばらく待ってから再試行する</li>
          </ul>
        </div>
      `;
    }
    
    improvementsHTML += `</div>`;
    
    // HTMLを表示
    improvementContainer.innerHTML = improvementsHTML;
    
    // ボタンのイベントリスナーを設定
    const copyButtons = improvementContainer.querySelectorAll('.copy-btn');
    copyButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const text = btn.getAttribute('data-text');
        navigator.clipboard.writeText(text).then(() => {
          // コピー成功時の表示
          const originalIcon = btn.innerHTML;
          btn.innerHTML = '<i class="fas fa-check"></i>';
          setTimeout(() => {
            btn.innerHTML = originalIcon;
          }, 1500);
        });
      });
    });
    
    const useButtons = improvementContainer.querySelectorAll('.use-btn');
    useButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const text = btn.getAttribute('data-text');
        const editorInput = document.getElementById('prompt-editor');
        if (editorInput) {
          editorInput.value = text;
          // 選択した改善案を最新の分析対象プロンプトとして保存
          this.lastAnalyzedPrompt = text;
          // エディタタブに切り替え
          PromptGenius.Tabs.switchToTab('editor');
        }
      });
    });
  },
  
  /**
   * 改善中の読み込み表示
   * @param {boolean} isLoading - 読み込み中かどうか
   */
  showImprovementLoading: function(isLoading) {
    const container = document.querySelector('#improvement-tab .bg-white.p-4');
    if (!container) return;
    
    if (isLoading) {
      container.innerHTML = `
        <div class="flex flex-col items-center justify-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
          <p class="text-gray-600">改善案を生成中...</p>
        </div>
      `;
    }
  },
  
  /**
   * HTML特殊文字をエスケープする
   * @param {string} text - エスケープするテキスト
   * @returns {string} エスケープされたテキスト
   */
  escapeHTML: function(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },
  
  /**
   * 分析中の読み込み表示
   * @param {boolean} isLoading - 読み込み中かどうか
   */
  showAnalysisLoading: function(isLoading) {
    const container = document.querySelector('#analysis-tab .bg-white.p-4');
    if (!container) return;
    
    if (isLoading) {
      container.innerHTML = `
        <div class="flex flex-col items-center justify-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
          <p class="text-gray-600">プロンプトを分析中...</p>
        </div>
      `;
    }
  },
  
  /**
   * 分析結果に基づいて改善案を生成する
   * @param {string} prompt - 元のプロンプト
   * @param {Object} analysisResult - 分析結果
   * @param {string} provider - APIプロバイダー
   */
  generateImprovements: function(prompt, analysisResult, provider) {
    // 改善中の表示
    this.showImprovementLoading(true);
    
    // 改善リクエストを実行
    PromptGenius.API.improvePrompt(prompt, analysisResult, provider).then(result => {
      // 改善結果を保存
      this.lastImprovementResult = result;
      
      // 改善案を表示
      this.displayImprovements(prompt, result);
      
      // 改善中の表示を終了
      this.showImprovementLoading(false);
    }).catch(error => {
      console.error('改善案の生成に失敗しました:', error);
      
      // エラーメッセージをコンソールに記録するが、アラートは表示しない
      console.log('エラーの詳細:', error.message);
      
      // モックデータを生成して表示
      const mockImprovements = this.generateMockImprovements(prompt);
      this.lastImprovementResult = mockImprovements;
      this.displayImprovements(prompt, mockImprovements);
      
      // エラーが発生したことをユーザーに通知（アラートではなく画面上に表示）
      const container = document.getElementById('improvement-container');
      if (container) {
        const errorNotice = document.createElement('div');
        errorNotice.className = 'bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4';
        errorNotice.innerHTML = `
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm text-yellow-700">
                APIからの応答に問題がありましたが、代替の改善案を表示しています。
              </p>
            </div>
          </div>
        `;
        container.prepend(errorNotice);
      }
      
      this.showImprovementLoading(false);
    });
  },
  
  /**
   * モックの改善案を生成する
   * @param {string} prompt - 元のプロンプト
   * @returns {Object} モックの改善案
   */
  generateMockImprovements: function(prompt) {
    // 長いプロンプトの場合は要約
    const isLongPrompt = prompt.length > 1000;
    const promptToUse = isLongPrompt ? 
      prompt.substring(0, 300) + '...' + prompt.substring(prompt.length - 300) : 
      prompt;
    
    // 改善アプローチを決定
    const approaches = [
      'ターゲット層と目的の明確化',
      '制約条件と指示の追加',
      '出力形式の詳細化',
      '具体例とコンテキストの追加',
      '文体とトーンの指定',
      '構造とフォーマットの改善'
    ];
    
    // ランダムにアプローチを選択
    const selectedApproaches = [];
    while (selectedApproaches.length < 3 && approaches.length > 0) {
      const randomIndex = Math.floor(Math.random() * approaches.length);
      selectedApproaches.push(approaches.splice(randomIndex, 1)[0]);
    }
    
    // 改善案を生成
    const improvements = selectedApproaches.map((approach, index) => {
      let improvedText = '';
      
      switch (approach) {
        case 'ターゲット層と目的の明確化':
          improvedText = promptToUse + '\n\n# ターゲット\n- 対象者: [対象者の詳細]\n- 目的: [具体的な目的]';
          break;
        case '制約条件と指示の追加':
          improvedText = promptToUse + '\n\n# 制約条件\n- [制約条件1]\n- [制約条件2]\n\n# 指示\n1. [手順ステップ1]\n2. [手順ステップ2]';
          break;
        case '出力形式の詳細化':
          improvedText = promptToUse + '\n\n# 出力形式\n- 形式: [望ましい形式の詳細]\n- 長さ: [望ましい長さや量]\n- スタイル: [望ましい文体やトーン]';
          break;
        case '具体例とコンテキストの追加':
          improvedText = promptToUse + '\n\n# 具体例\n```\n[望ましい出力の例]\n```\n\n# コンテキスト\n- [背景情報]\n- [関連知識]';
          break;
        case '文体とトーンの指定':
          improvedText = promptToUse + '\n\n# 文体とトーン\n- 文体: [望ましい文体]\n- トーン: [望ましいトーン]\n- 言語スタイル: [望ましい言語スタイル]';
          break;
        case '構造とフォーマットの改善':
          improvedText = '# プロンプトの目的\n[目的の詳細]\n\n# 背景\n[背景情報]\n\n# 主要タスク\n' + promptToUse + '\n\n# 望ましい出力\n[望ましい出力の詳細]';
          break;
        default:
          improvedText = promptToUse + '\n\n# 改善点\n- [改善点1]\n- [改善点2]\n- [改善点3]';
      }
      
      return {
        title: `改善案 ${index + 1}: ${approach}`,
        approach: approach,
        description: `この改善案は${approach}に焦点を当てています。`,
        improved_text: improvedText,
        similarity_score: 85 - (index * 5)
      };
    });
    
    return {
      improvements: improvements
    };
  },
};
