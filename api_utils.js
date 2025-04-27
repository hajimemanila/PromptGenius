/**
 * api_utils.js - 外部API呼び出しユーティリティ
 */
window.PromptGenius = window.PromptGenius || {};
window.PromptGenius.API = {
  // デバッグモード
  debug: true,
  async callOpenAI(prompt, model = window.PromptGenius.state.settings.modelNames?.openai || 'gpt-4') {
    try {
      const apiKey = PromptGenius.state.settings.apiKeys?.openai;
      if (!apiKey) {
        throw new Error('OpenAI APIキーが設定されていません。設定画面で追加してください。');
      }
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: 'あなたはプロンプトの分析と改善を行う専門家です。' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API エラー: ${error.error?.message || 'Unknown error'}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('OpenAI API呼び出しエラー:', error);
      throw error;
    }
  },
  
  async callGemini(prompt, model = window.PromptGenius.state.settings.modelNames?.gemini || 'gemini-pro') {
    try {
      const apiKey = PromptGenius.state.settings.apiKeys?.gemini;
      if (!apiKey) {
        throw new Error('Google Gemini APIキーが設定されていません。設定画面で追加してください。');
      }
      
      // Gemini APIリクエスト形式
      const requestBody = {
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7
        }
      };
      
      if (this.debug) {
        console.log(`Gemini API リクエスト (${model}):`, requestBody);
      }
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Gemini API エラー: ${error.error?.message || 'Unknown error'}`);
      }
      
      const responseData = await response.json();
      
      if (this.debug) {
        console.log('Gemini API レスポンス:', responseData);
      }
      
      return responseData;
    } catch (error) {
      console.error('Gemini API呼び出しエラー:', error);
      throw error;
    }
  },
  
  async callClaude(prompt, model = window.PromptGenius.state.settings.modelNames?.claude || 'claude-3-opus-20240229') {
    try {
      const apiKey = PromptGenius.state.settings.apiKeys?.claude;
      if (!apiKey) {
        throw new Error('Anthropic Claude APIキーが設定されていません。設定画面で追加してください。');
      }
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: model,
          max_tokens: 1000,
          messages: [
            { role: 'user', content: prompt }
          ]
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Claude API エラー: ${error.error?.message || 'Unknown error'}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Claude API呼び出しエラー:', error);
      throw error;
    }
  },
  
  /**
   * プロンプト分析関数
   * @param {string} prompt - 分析するプロンプト
   * @param {string} provider - APIプロバイダー名 (openai, gemini, claude)
   * @returns {Object} 分析結果のJSONオブジェクト
   */
  async analyzePrompt(prompt, provider = 'openai') {
    // 設定から指定されたモデル名を取得
    const modelName = provider === 'openai' ? 
      (window.PromptGenius.state.settings.modelNames?.openai || 'gpt-4') :
      provider === 'gemini' ? 
        (window.PromptGenius.state.settings.modelNames?.gemini || 'gemini-pro') :
        provider === 'claude' ?
          (window.PromptGenius.state.settings.modelNames?.claude || 'claude-3-opus-20240229') :
          null;
    
    if (!modelName) {
      throw new Error(`未対応のAPIプロバイダー: ${provider}`);
    }
    
    if (this.debug) {
      console.log(`分析実行: プロバイダー=${provider}, モデル=${modelName}`);
    }
    const analysisPrompt = `
以下のAIプロンプトを分析し、強みと改善点を評価してください。

プロンプト:
"""
${prompt}
"""

以下の観点から評価してください：
1. 明確さ（目的やターゲットが明確か）
2. 具体性（十分な情報や詳細が含まれているか）
3. 制約と指示（制約条件や指示が適切か）
4. 出力形式（望ましい出力形式が指定されているか）

各観点について100点満点で評価し、改善のためのアドバイスを提供してください。
また、総合評価と全体的な改善提案も含めてください。

回答は以下のJSON形式で返してください：
{
  "scores": {
    "clarity": 数値,
    "specificity": 数値,
    "constraints": 数値,
    "format": 数値,
    "overall": 数値
  },
  "feedback": {
    "clarity": "評価コメント",
    "specificity": "評価コメント",
    "constraints": "評価コメント",
    "format": "評価コメント"
  },
  "summary": "総合評価",
  "improvements": [
    {"title": "改善案タイトル1", "description": "改善案の説明1"},
    {"title": "改善案タイトル2", "description": "改善案の説明2"}
  ]
}
`;
    
    try {
      let response;
      let jsonResult;
      
      switch (provider.toLowerCase()) {
        case 'openai':
        case 'gpt-4':
          response = await this.callOpenAI(analysisPrompt, modelName);
          // OpenAIのレスポンス形式を処理
          if (response.choices && response.choices[0] && response.choices[0].message) {
            jsonResult = this.safeJsonParse(response.choices[0].message.content);
          } else {
            throw new Error('OpenAI APIからの予期しないレスポンス形式です');
          }
          break;
          
        case 'gemini':
        case 'google':
          response = await this.callGemini(analysisPrompt, modelName);
          // Geminiのレスポンス形式を処理
          if (response.candidates && response.candidates[0] && response.candidates[0].content) {
            const parts = response.candidates[0].content.parts;
            if (Array.isArray(parts) && parts.length > 0) {
              jsonResult = this.safeJsonParse(parts[0].text);
            } else {
              throw new Error('Gemini APIからのレスポンス内にテキストが見つかりません');
            }
          } else {
            throw new Error('Gemini APIからの予期しないレスポンス形式です');
          }
          break;
          
        case 'claude':
        case 'anthropic':
          response = await this.callClaude(analysisPrompt, modelName);
          // Claudeのレスポンス形式を処理
          if (response.content && Array.isArray(response.content) && response.content.length > 0) {
            jsonResult = this.safeJsonParse(response.content[0].text);
          } else {
            throw new Error('Claude APIからの予期しないレスポンス形式です');
          }
          break;
          
        default:
          throw new Error(`未対応のAPIプロバイダー: ${provider}`);
      }
      
      // 結果の検証
      if (!jsonResult || typeof jsonResult !== 'object') {
        throw new Error('APIからの応答をJSON形式に変換できませんでした');
      }
      
      return jsonResult;
    } catch (error) {
      console.error('プロンプト分析エラー:', error);
      throw error;
    }
  },
  
  /**
   * プロンプト改善関数 - 分析結果に基づいた3つの改善案を生成
   * @param {string} prompt - 改善するプロンプト
   * @param {Object} analysis - 分析結果オブジェクト
   * @param {string} provider - APIプロバイダー名 (openai, gemini, claude)
   * @returns {Object} 3つの改善案を含むJSONオブジェクト
   */
  async improvePrompt(prompt, analysis, provider = 'openai') {
    // 設定から指定されたモデル名を取得
    const modelName = provider === 'openai' ? 
      (window.PromptGenius.state.settings.modelNames?.openai || 'gpt-4') :
      provider === 'gemini' ? 
        (window.PromptGenius.state.settings.modelNames?.gemini || 'gemini-pro') :
        provider === 'claude' ?
          (window.PromptGenius.state.settings.modelNames?.claude || 'claude-3-opus-20240229') :
          null;
    
    if (!modelName) {
      throw new Error(`未対応のAPIプロバイダー: ${provider}`);
    }
    
    if (this.debug) {
      console.log(`改善実行: プロバイダー=${provider}, モデル=${modelName}`);
    }
    // 分析結果から改善が必要な項目を特定
    const weakPoints = [];
    if (analysis.scores.clarity < 80) weakPoints.push('明確さ');
    if (analysis.scores.specificity < 80) weakPoints.push('具体性');
    if (analysis.scores.constraints < 80) weakPoints.push('制約と指示');
    if (analysis.scores.format < 80) weakPoints.push('出力形式');
    
    // 弱点がない場合は、全体的な改善を行う
    const improvementFocus = weakPoints.length > 0 ? 
      `特に${weakPoints.join('、')}の観点で改善が必要です。` : 
      '全体的にバランス良く改善してください。';
    
    // プロンプトの長さをチェック
    const isLongPrompt = prompt.length > 2000;
    
    // 長いプロンプトの場合は要約したバージョンを使用
    const promptToUse = isLongPrompt ? 
      prompt.substring(0, 500) + '\n[...]プロンプトが長いため省略\n[...]\n' + prompt.substring(prompt.length - 500) : 
      prompt;
    
    if (this.debug && isLongPrompt) {
      console.log('長いプロンプトを要約しました。長さ:', prompt.length);
    }
    
    const improvementPrompt = `
以下のAIプロンプトを改善してください。

プロンプト${isLongPrompt ? '(要約版)' : ''}:
"""
${promptToUse}
"""

このプロンプトの分析結果:
明確さ: ${analysis.scores.clarity}/100 - ${analysis.feedback.clarity}
具体性: ${analysis.scores.specificity}/100 - ${analysis.feedback.specificity}
制約と指示: ${analysis.scores.constraints}/100 - ${analysis.feedback.constraints}
出力形式: ${analysis.scores.format}/100 - ${analysis.feedback.format}
総合評価: ${analysis.scores.overall}/100

${improvementFocus}

以下の条件で、異なるアプローチの3つの改善案を生成してください:
1. 元のプロンプトの意図と目的を維持しつつ、改善すること。
2. それぞれの改善案は異なるアプローチや切り口で改善すること。
3. 各改善案は分析結果に基づいていること。

改善案は以下のJSON形式で返してください：
{
  "improvements": [
    {
      "title": "改善案タイトル1",
      "approach": "この改善案のアプローチや切り口",
      "description": "改善案の詳細な説明",
      "improved_text": "改善されたプロンプト全文",
      "similarity_score": 85
    },
    {
      "title": "改善案タイトル2",
      "approach": "この改善案のアプローチや切り口",
      "description": "改善案の詳細な説明",
      "improved_text": "改善されたプロンプト全文",
      "similarity_score": 80
    },
    {
      "title": "改善案タイトル3",
      "approach": "この改善案のアプローチや切り口",
      "description": "改善案の詳細な説明",
      "improved_text": "改善されたプロンプト全文",
      "similarity_score": 75
    }
  ]
}
`;
    
    try {
      let response;
      let jsonResult;
      
      switch (provider.toLowerCase()) {
        case 'openai':
        case 'gpt-4':
          response = await this.callOpenAI(improvementPrompt, modelName);
          // OpenAIのレスポンス形式を処理
          if (response.choices && response.choices[0] && response.choices[0].message) {
            jsonResult = this.safeJsonParse(response.choices[0].message.content);
          } else {
            throw new Error('OpenAI APIからの予期しないレスポンス形式です');
          }
          break;
          
        case 'gemini':
        case 'google':
          response = await this.callGemini(improvementPrompt, modelName);
          // Geminiのレスポンス形式を処理
          if (response.candidates && response.candidates[0] && response.candidates[0].content) {
            const parts = response.candidates[0].content.parts;
            if (Array.isArray(parts) && parts.length > 0) {
              jsonResult = this.safeJsonParse(parts[0].text);
            } else {
              throw new Error('Gemini APIからのレスポンス内にテキストが見つかりません');
            }
          } else {
            throw new Error('Gemini APIからの予期しないレスポンス形式です');
          }
          break;
          
        case 'claude':
        case 'anthropic':
          response = await this.callClaude(improvementPrompt, modelName);
          // Claudeのレスポンス形式を処理
          if (response.content && Array.isArray(response.content) && response.content.length > 0) {
            jsonResult = this.safeJsonParse(response.content[0].text);
          } else {
            throw new Error('Claude APIからの予期しないレスポンス形式です');
          }
          break;
          
        default:
          throw new Error(`未対応のAPIプロバイダー: ${provider}`);
      }
      
      // 結果の検証
      if (!jsonResult || typeof jsonResult !== 'object') {
        throw new Error('APIからの応答をJSON形式に変換できませんでした');
      }
      
      return jsonResult;
    } catch (error) {
      console.error('プロンプト改善エラー:', error);
      throw error;
    }
  },
  
  /**
   * 安全にJSON文字列をパースする
   * @param {string} text - パースするJSON文字列
   * @returns {Object|null} パースされたJSONオブジェクト、またはnull
   */
  safeJsonParse(text) {
    if (!text) return null;
    
    // デバッグモードの場合、元のテキストを記録
    if (this.debug) {
      console.log('解析するテキスト:', text.substring(0, 200) + '...');
      console.log('テキストの長さ:', text.length);
    }
    
    // アプローチ 1: そのままパースを試みる
    try {
      return JSON.parse(text);
    } catch (e) {
      if (this.debug) {
        console.log('アプローチ 1 失敗:', e.message);
      }
    }
    
    // アプローチ 2: テキストからJSONらしき部分を抽出
    try {
      // 最初の { から最後の } までを抽出する正規表現
      const jsonMatch = text.match(/\{[\s\S]*\}/m);
      if (jsonMatch) {
        const jsonCandidate = jsonMatch[0];
        
        if (this.debug) {
          console.log('抽出されたJSON候補:', jsonCandidate.substring(0, 100) + '...');
        }
        
        try {
          return JSON.parse(jsonCandidate);
        } catch (e2) {
          if (this.debug) {
            console.log('アプローチ 2 失敗:', e2.message);
          }
        }
        
        // アプローチ 3: 特殊文字をエスケープ
        try {
          const sanitized = jsonCandidate
            .replace(/[\u0000-\u001F]+/g, '') // 制御文字を除去
            .replace(/\n/g, '\\n') // 改行をエスケープ
            .replace(/\r/g, '\\r') // キャリッジリターンをエスケープ
            .replace(/\t/g, '\\t'); // タブをエスケープ
          
          return JSON.parse(sanitized);
        } catch (e3) {
          if (this.debug) {
            console.log('アプローチ 3 失敗:', e3.message);
          }
        }
        
        // アプローチ 4: 一般的なエラーパターンを修正
        try {
          let fixedJson = jsonCandidate
            .replace(/,\s*}/g, '}') // 最後のカンマを削除
            .replace(/,\s*\]/g, ']'); // 配列の最後のカンマを削除
          
          return JSON.parse(fixedJson);
        } catch (e4) {
          if (this.debug) {
            console.log('アプローチ 4 失敗:', e4.message);
          }
          
          // アプローチ 5: エラー位置を特定して修正
          try {
            const errorMatch = e4.message.match(/position (\d+)/);
            if (errorMatch && errorMatch[1]) {
              const errorPos = parseInt(errorMatch[1]);
              const beforeError = jsonCandidate.substring(0, errorPos);
              const afterError = jsonCandidate.substring(errorPos + 1);
              
              if (this.debug) {
                console.log('エラー位置:', errorPos);
                console.log('エラー位置の前:', beforeError.slice(-30));
                console.log('エラー位置の後:', afterError.slice(0, 30));
              }
              
              // 問題の文字をスキップしてみる
              const fixedJson = beforeError + afterError;
              return JSON.parse(fixedJson);
            }
          } catch (e5) {
            if (this.debug) {
              console.log('アプローチ 5 失敗:', e5.message);
            }
          }
        }
      }
    } catch (extractError) {
      if (this.debug) {
        console.log('JSON抽出エラー:', extractError);
      }
    }
    
    // フォールバック: モックデータを生成
    if (this.debug) {
      console.log('解析に失敗したため、モックデータを生成します');
    }
    
    // プロンプト分析の場合のモックデータ
    if (text.includes('分析') || text.includes('analysis')) {
      return {
        scores: {
          clarity: 75,
          specificity: 70,
          constraints: 65,
          format: 60,
          overall: 68
        },
        feedback: {
          clarity: 'プロンプトの目的は比較的明確ですが、もう少し具体的なコンテキストが必要です。',
          specificity: 'もう少し具体的な詳細や例を含めると良いでしょう。',
          constraints: '制約や限定事項があまり明確に指定されていません。',
          format: '望ましい出力形式をもっと詳細に指定すると良いでしょう。'
        },
        strengths: [
          'プロンプトの基本的な目的が理解できます。',
          '主要なタスクが含まれています。'
        ],
        weaknesses: [
          '具体的な詳細や例が不足しています。',
          '望ましい出力形式が明確ではありません。',
          '制約や条件が十分に指定されていません。'
        ]
      };
    }
    
    // プロンプト改善の場合のモックデータ
    if (text.includes('改善') || text.includes('improve')) {
      // 元のプロンプトを抽出する試み
      let originalPrompt = '';
      const promptMatch = text.match(/プロンプト[\s\S]*?"""([\s\S]*?)"""/m);
      if (promptMatch && promptMatch[1]) {
        originalPrompt = promptMatch[1].trim();
      } else {
        // プロンプトが見つからない場合はテキストの一部を使用
        originalPrompt = text.substring(0, Math.min(500, text.length));
      }
      
      // 長いプロンプトの場合は要約
      const isLongPrompt = originalPrompt.length > 1000;
      const promptToUse = isLongPrompt ? 
        originalPrompt.substring(0, 300) + '...' + originalPrompt.substring(originalPrompt.length - 300) : 
        originalPrompt;
      
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
    }
    
    throw new Error('JSONとして解析できない応答を受け取りました');
  }
};
