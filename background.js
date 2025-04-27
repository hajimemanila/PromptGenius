// background.js - サイドパネル開放用サービスワーカー
chrome.action.onClicked.addListener((tab) => {
  console.log('Prompt Genius: アイコンがクリックされました。タブID:', tab.id);
  chrome.sidePanel.open({ tabId: tab.id }).catch(error => {
    console.error('Prompt Genius: サイドパネルを開けませんでした:', error);
  });
});

// コンテキストメニュー作成
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'edit_with_promptgenius',
    title: 'Edit with PromptGenius',
    contexts: ['selection']
  });
});

// コンテキストメニュークリック時処理
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'edit_with_promptgenius' && info.selectionText && tab) {
    // 選択テキストをstorageに保存し、サイドパネルを開く
    chrome.storage.local.set({ contextText: info.selectionText }, () => {
      chrome.sidePanel.open({ tabId: tab.id }).catch(err => console.error(err));
    });
  }
});
