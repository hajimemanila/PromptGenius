/**
 * sidebar_toggle.js - サイドバー表示切替機能
 */
window.PromptGenius = window.PromptGenius || {};
window.PromptGenius.SidebarToggle = {
  initialized: false,
  
  init: function() {
    if (this.initialized) return;
    
    // サイドバーの状態を管理
    this.sidebarVisible = true;
    
    // トグルボタンの追加
    this.addToggleButton();
    
    this.initialized = true;
  },
  
  addToggleButton: function() {
    // ヘッダーにトグルボタンを追加
    const header = document.querySelector('header');
    if (!header) return;
    
    const toggleButton = document.createElement('button');
    toggleButton.className = 'text-gray-600 hover:text-gray-800 ml-2';
    toggleButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
    toggleButton.id = 'sidebar-toggle';
    
    // ヘッダーの最初の子要素の後に挿入
    const firstChild = header.firstChild;
    if (firstChild) {
      header.insertBefore(toggleButton, firstChild.nextSibling);
    } else {
      header.appendChild(toggleButton);
    }
    
    // クリックイベントの追加
    toggleButton.addEventListener('click', () => {
      this.toggleSidebar();
    });
  },
  
  toggleSidebar: function() {
    const sidebar = document.querySelector('.px-3.py-2.bg-gray-50');
    const toggleButton = document.getElementById('sidebar-toggle');
    
    if (!sidebar || !toggleButton) return;
    
    if (this.sidebarVisible) {
      // サイドバーを非表示
      sidebar.style.display = 'none';
      toggleButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
    } else {
      // サイドバーを表示
      sidebar.style.display = 'block';
      toggleButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
    }
    
    this.sidebarVisible = !this.sidebarVisible;
  }
};
