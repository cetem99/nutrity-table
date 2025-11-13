document.addEventListener('DOMContentLoaded', () => {
  try {
    const user = JSON.parse(localStorage.getItem('user')) || JSON.parse(sessionStorage.getItem('user')) || null;
    const name = user && user.name ? user.name : null;
    const sidebarBrand = document.querySelector('.sidebar-top .brand');
    if (sidebarBrand) sidebarBrand.textContent = name || 'Usuário';
  } catch (e) {
    // ignore JSON parse errors
  }
  // attach logout handler to all elements with class 'logout'
  try {
    const logoutEls = document.querySelectorAll('.logout');
    logoutEls.forEach(el => {
      el.addEventListener('click', (ev) => {
        ev.preventDefault();
        try { localStorage.removeItem('user'); sessionStorage.removeItem('user'); } catch (e) {}
        // redirect to login page
        window.location.href = '/login.html';
      });
    });
  } catch (e) {
    // ignore
  }
});
