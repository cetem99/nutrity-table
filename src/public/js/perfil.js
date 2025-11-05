document.addEventListener('DOMContentLoaded', async function() {
  // --- CONTROLE DA SIDEBAR ---
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebarClose = document.getElementById('sidebar-close');
  const overlay = document.getElementById('sidebar-overlay');

  function openSidebar() {
    sidebar?.classList.add('is-open');
    overlay?.classList.add('is-visible');
  }

  function closeSidebar() {
    sidebar?.classList.remove('is-open');
    overlay?.classList.remove('is-visible');
  }

  sidebarToggle?.addEventListener('click', openSidebar);
  sidebarClose?.addEventListener('click', closeSidebar);
  overlay?.addEventListener('click', closeSidebar);

  // --- PEGAR DADOS DO USUÁRIO LOGADO ---
  const userData = JSON.parse(localStorage.getItem('user')) || JSON.parse(sessionStorage.getItem('user'));
  if (!userData || !userData.userId) {
    alert('Usuário não autenticado. Faça login novamente.');
    window.location.href = 'login.html';
    return;
  }

  const token = userData.token;
  const userId = userData.userId;

  const nameInput = document.getElementById('fullName');
  const emailInput = document.getElementById('email');
  const nameSidebar = document.querySelector('.brand'); // nome no topo da sidebar

  // --- BUSCAR DADOS ATUALIZADOS DO BACKEND ---
  // Use the protected route /api/users/profile which reads the user from the token (req.userId)
  async function carregarPerfil() {
    try {
      const res = await fetch(`/api/users/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const json = await res.json();

      if (!res.ok) throw new Error(json.message || 'Erro ao buscar perfil');

      // userController returns { user: { ... } }
      const user = json.user || json;

      nameInput.value = user.name || '';
      emailInput.value = user.email || '';
      if (nameSidebar) nameSidebar.textContent = user.name || 'Usuário';
    } catch (err) {
      console.error(err);
      alert('Erro ao carregar dados do perfil.');
    }
  }

  await carregarPerfil();

  // --- SALVAR ALTERAÇÕES DE NOME E EMAIL ---
  const formInfo = document.querySelector('.profile-card form');
  formInfo.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();

    try {
      const res = await fetch(`/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, email })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Erro ao atualizar perfil.');

      alert('Informações atualizadas com sucesso!');

      // Atualiza dados armazenados
      const updatedUser = {
        ...userData,
        name,
        email
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      sessionStorage.setItem('user', JSON.stringify(updatedUser));

      if (nameSidebar) nameSidebar.textContent = name;
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  });

  // --- ALTERAR SENHA ---
  const passwordForm = document.querySelector('.profile-card:nth-of-type(2) form');
  passwordForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const currentPassword = document.getElementById('currentPassword').value.trim();
    const newPassword = document.getElementById('newPassword').value.trim();
    const confirmPassword = document.getElementById('confirmPassword').value.trim();

    if (newPassword !== confirmPassword) {
      alert('As senhas novas não coincidem.');
      return;
    }

    try {
      // profile controller now reads the user from the token (req.userId).
      const res = await fetch(`/api/profile/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erro ao alterar senha.');

      alert('Senha alterada com sucesso!');
      passwordForm.reset();
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  });

  // --- EXCLUIR CONTA ---
  const deleteButton = document.querySelector('.btn.btn-danger');
  deleteButton.addEventListener('click', async () => {
    if (!confirm('Tem certeza que deseja excluir sua conta permanentemente?')) return;

    try {
      // Use the protected delete route registered at /api/users/profile
      const res = await fetch(`/api/users/profile`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erro ao excluir conta.');

      alert('Conta excluída com sucesso!');
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = 'login.html';
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  });

  // --- LOGOUT (Sair) ---
  const logoutLink = document.querySelector('.logout');
  if (logoutLink) {
    logoutLink.addEventListener('click', (e) => {
      e.preventDefault();
      // Clear stored user state and redirect to login
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');
      // Optional: clear everything
      // localStorage.clear(); sessionStorage.clear();
      window.location.href = 'login.html';
    });
  }

  // --- TOGGLE SENHA (Perfil) ---
  // Create/show toggle buttons for password fields on the profile page.
  function registerBootstrapPasswordToggle(input) {
    if (!input) return;
    // if a toggle button already exists next to this input, use it
    let wrapper = input.parentNode;
    let existing = wrapper.querySelector('.toggle-password');
    if (existing) {
      existing.addEventListener('click', () => {
        const visible = input.type === 'text';
        input.type = visible ? 'password' : 'text';
        existing.innerHTML = visible ? '<i class="bi bi-eye"></i>' : '<i class="bi bi-eye-slash"></i>';
      });
      return;
    }

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'toggle-password btn btn-sm btn-outline-secondary';
    btn.style.marginLeft = '8px';
    btn.innerHTML = '<i class="bi bi-eye"></i>';
    btn.addEventListener('click', () => {
      const visible = input.type === 'text';
      input.type = visible ? 'password' : 'text';
      btn.innerHTML = visible ? '<i class="bi bi-eye"></i>' : '<i class="bi bi-eye-slash"></i>';
    });

    wrapper.appendChild(btn);
  }

  // Attach toggles to the three password fields in perfil.html
  registerBootstrapPasswordToggle(document.getElementById('currentPassword'));
  registerBootstrapPasswordToggle(document.getElementById('newPassword'));
  registerBootstrapPasswordToggle(document.getElementById('confirmPassword'));
});
