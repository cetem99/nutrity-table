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
  const API_WARNING = window.getApiWarningMessage
    ? window.getApiWarningMessage()
    : 'Funcionalidade indisponível sem um backend configurado.';

  function buildApiUrl(path) {
    return window.getApiUrlOrWarn
      ? window.getApiUrlOrWarn(path, () => alert(API_WARNING))
      : path;
  }

  const nameInput = document.getElementById('fullName');
  const emailInput = document.getElementById('email');
  const nameSidebar = document.querySelector('.brand'); 

  // --- BUSCAR DADOS ATUALIZADOS DO BACKEND ---
  async function carregarPerfil() {
    try {
      const url = buildApiUrl(`/api/users/profile`);
      if (!url) return;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const json = await res.json();

      if (!res.ok) throw new Error(json.message || 'Erro ao buscar perfil');

      const user = json.user || json;

      if(nameInput) nameInput.value = user.name || '';
      if(emailInput) emailInput.value = user.email || '';
      if(nameSidebar) nameSidebar.textContent = user.name || 'Usuário';
    } catch (err) {
      console.error(err);
      alert('Erro ao carregar dados do perfil.');
    }
  }

  await carregarPerfil();

  // --- SALVAR ALTERAÇÕES DE NOME E EMAIL ---
  const formInfo = document.querySelector('.profile-card form');
  if (formInfo) {
    formInfo.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = nameInput.value.trim();
      const email = emailInput.value.trim();

      try {
        const url = buildApiUrl(`/api/users/profile`);
        if (!url) return;
        const res = await fetch(url, {
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
  }

  // --- ALTERAR SENHA ---
  const passwordForm = document.querySelector('.profile-card:nth-of-type(2) form');
  if (passwordForm) {
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
        const url = buildApiUrl(`/api/profile/password`);
        if (!url) return;
        const res = await fetch(url, {
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
  }

  // --- EXCLUIR CONTA ---
  const deleteButton = document.querySelector('.btn.btn-danger');
  if (deleteButton) {
    deleteButton.addEventListener('click', async () => {
      if (!confirm('Tem certeza que deseja excluir sua conta permanentemente?')) return;

      try {
        const url = buildApiUrl(`/api/users/profile`);
        if (!url) return;
        const res = await fetch(url, {
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
  }

  // --- LOGOUT (Sair) ---
  const logoutLink = document.querySelector('.logout');
  if (logoutLink) {
    logoutLink.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');
      window.location.href = 'login.html';
    });
  }

  // --- TOGGLE SENHA (MODIFICADO PARA INPUT-GROUP) ---
  function registerBootstrapPasswordToggle(input) {
    if (!input) return;
    
    // O wrapper agora é a .input-group criada no HTML
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
    // REMOVIDO: 'btn-sm' e margens. Agora ele é um addon do input-group.
    btn.className = 'toggle-password btn btn-outline-secondary'; 
    
    btn.innerHTML = '<i class="bi bi-eye"></i>';
    btn.addEventListener('click', () => {
      const visible = input.type === 'text';
      input.type = visible ? 'password' : 'text';
      btn.innerHTML = visible ? '<i class="bi bi-eye"></i>' : '<i class="bi bi-eye-slash"></i>';
    });

    wrapper.appendChild(btn);
  }

  // Ativar nos 3 campos
  registerBootstrapPasswordToggle(document.getElementById('currentPassword'));
  registerBootstrapPasswordToggle(document.getElementById('newPassword'));
  registerBootstrapPasswordToggle(document.getElementById('confirmPassword'));
});