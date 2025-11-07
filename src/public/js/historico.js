document.addEventListener('DOMContentLoaded', function() {
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

  // --- FETCH USER TABLES (HISTÓRICO) ---
  async function loadHistory() {
    try {
      const userData = JSON.parse(localStorage.getItem('user')) || JSON.parse(sessionStorage.getItem('user')) || {};
      const token = userData.token;
      if (!token) {
        // user not logged in - show message
        document.getElementById('history-list').innerHTML = '<div class="alert alert-warning">Faça login para ver seu histórico.</div>';
        return;
      }

      const res = await fetch('/api/tables', { headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) throw new Error('Falha ao carregar histórico');
      const json = await res.json();
      const tables = json.tables || [];

      const container = document.getElementById('history-list');
      if (!container) return;
      if (tables.length === 0) {
        container.innerHTML = '<div class="alert alert-info">Nenhuma tabela encontrada. Crie uma nova tabela.</div>';
        return;
      }

      container.innerHTML = '';
      tables.forEach(t => {
        const card = document.createElement('div');
        card.className = 'card history-item mb-3';
        const created = t.createdAt ? new Date(t.createdAt).toLocaleDateString('pt-BR') : '';
        const baseBadge = `<span class="badge badge-base ${t.base === 'usda' ? 'usda' : 'taco'}">${(t.base||'TACO').toUpperCase()}</span>`;
        card.innerHTML = `
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <h5 class="card-title mb-0">${t.title || 'Sem título'}</h5>
              <div class="d-flex gap-2 flex-shrink-0">${baseBadge}<span class="badge badge-status finalizada">Finalizada</span></div>
            </div>
            <p class="card-text text-muted small mb-3">Criada em ${created}</p>
            <div class="d-flex flex-wrap gap-4 align-items-center">
              <a href="tabela_resultado.html?id=${t._id}" class="action-link"><i class="bi bi-box-arrow-up-right"></i> Abrir</a>
              <a href="#" data-id="${t._id}" class="action-link btn-edit"><i class="bi bi-pencil"></i> Editar</a>
              <a href="#" data-id="${t._id}" class="action-link btn-duplicate"><i class="bi bi-files"></i> Duplicar</a>
              <a href="#" data-id="${t._id}" class="action-link btn-download"><i class="bi bi-download"></i> Baixar</a>
              <a href="#" data-id="${t._id}" class="action-link text-danger btn-delete"><i class="bi bi-trash"></i> Excluir</a>
            </div>
          </div>
        `;

        container.appendChild(card);
      });

      // attach delete handlers
      container.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.preventDefault();
          const id = btn.getAttribute('data-id');
          if (!confirm('Deseja excluir esta tabela?')) return;
          try {
            const del = await fetch(`/api/tables/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            if (!del.ok) throw new Error('Falha ao excluir');
            // reload
            loadHistory();
          } catch (err) {
            console.error(err);
            alert('Erro ao excluir tabela');
          }
        });
      });

    } catch (err) {
      console.error('loadHistory error', err);
      document.getElementById('history-list').innerHTML = '<div class="alert alert-danger">Erro ao carregar histórico.</div>';
    }
  }

  loadHistory();
});