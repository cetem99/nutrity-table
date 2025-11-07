document.addEventListener('DOMContentLoaded', () => {
  try {
    const user = JSON.parse(localStorage.getItem('user')) || JSON.parse(sessionStorage.getItem('user')) || null;
    const name = user && user.name ? user.name : null;
    const sidebarBrand = document.querySelector('.sidebar-top .brand');
    if (sidebarBrand) sidebarBrand.textContent = name || 'Usuário';
  } catch (e) {
    // ignore JSON parse errors
  }
});
