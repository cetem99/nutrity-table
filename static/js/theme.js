// js/theme.js

(function() {
  // Função para aplicar o tema
  function applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }

  // Função para definir e salvar o tema
  window.setTheme = function(theme) {
    localStorage.setItem('theme', theme);
    
    if (theme === 'auto') {
      // Verifica a preferência do sistema
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(prefersDark ? 'dark' : 'light');
    } else {
      applyTheme(theme);
    }
  }

  // Lógica que roda imediatamente ao carregar a página
  const savedTheme = localStorage.getItem('theme') || 'auto';
  window.setTheme(savedTheme);
})();