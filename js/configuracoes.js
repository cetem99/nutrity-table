document.addEventListener('DOMContentLoaded', function() {
  // --- CONTROLE DA SIDEBAR ---
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebarClose = document.getElementById('sidebar-close');
  const overlay = document.getElementById('sidebar-overlay');

  function openSidebar() {
    if (sidebar && overlay) {
      sidebar.classList.add('is-open');
      overlay.classList.add('is-visible');
    }
  }
  function closeSidebar() {
    if (sidebar && overlay) {
      sidebar.classList.remove('is-open');
      overlay.classList.remove('is-visible');
    }
  }
  if(sidebarToggle) sidebarToggle.addEventListener('click', openSidebar);
  if(sidebarClose) sidebarClose.addEventListener('click', closeSidebar);
  if(overlay) overlay.addEventListener('click', closeSidebar);


  // --- LÓGICA DA PÁGINA DE CONFIGURAÇÕES ---
  const themeSelect = document.getElementById('theme-select');
  
  // Sincroniza o dropdown com o tema salvo no localStorage
  const savedTheme = localStorage.getItem('theme') || 'auto';
  if (themeSelect) {
    themeSelect.value = savedTheme;
  }

  // Adiciona o evento para trocar o tema
  if (themeSelect) {
    themeSelect.addEventListener('change', function() {
      // A função window.setTheme() vem do arquivo js/theme.js
      window.setTheme(this.value);
    });
  }
});