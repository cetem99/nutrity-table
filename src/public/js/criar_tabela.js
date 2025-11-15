document.addEventListener('DOMContentLoaded', () => {
  // --- SIDEBAR CONTROL ---
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebarClose = document.getElementById('sidebar-close');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebarToggle) sidebarToggle.addEventListener('click', () => { sidebar.classList.add('is-open'); overlay.classList.add('is-visible'); });
  if (sidebarClose) sidebarClose.addEventListener('click', () => { sidebar.classList.remove('is-open'); overlay.classList.remove('is-visible'); });
  if (overlay) overlay.addEventListener('click', () => { sidebar.classList.remove('is-open'); overlay.classList.remove('is-visible'); });

  // --- STEP WIZARD ---
  let selectedBase = null;
  const baseCards = document.querySelectorAll('.base-card');
  const btnStep1 = document.getElementById('btn-step1-continue');
  baseCards.forEach(card => {
    card.addEventListener('click', () => {
      baseCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedBase = card.dataset.value;
      if (btnStep1) btnStep1.disabled = false;
    });
  });

  function showStep(n) {
    document.querySelectorAll('.step-content').forEach(el => el.classList.add('d-none'));
    document.querySelectorAll('.step').forEach(s => s.classList.remove('current'));
    document.querySelector(`.step[data-step="${n}"]`)?.classList.add('current');
    document.getElementById(`step-${n}`)?.classList.remove('d-none');
  }
  // Função para obter a etapa atual
  function getCurrentStep() {
    const currentStep = document.querySelector('.step.current');
    return currentStep ? parseInt(currentStep.dataset.step) : 1;
  }

  // Evento do botão da primeira etapa
  if (btnStep1) {
    btnStep1.addEventListener('click', (e) => {
      e.preventDefault();
      showStep(2);
    });
  }
  
  // Evento dos botões de voltar
  document.querySelectorAll('.btn-prev').forEach(b => {
    b.addEventListener('click', (e) => {
      e.preventDefault();
      const currentStep = getCurrentStep();
      if (currentStep > 1) {
        showStep(currentStep - 1);
      }
    });
  });
  // Função para validar os ingredientes
  function validarIngredientes() {
    const ingredientRows = document.querySelectorAll('.ingredient-row');
    let hasValidIngredient = false;
    
    // Verifica cada linha de ingrediente
    for (const row of ingredientRows) {
      const nameInput = row.querySelector('.ingredient-name-input');
      const qtyInput = row.querySelector('.ingredient-qty');
      const name = nameInput?.value.trim();
      const qty = qtyInput?.value.trim();
      
      // Se ambos os campos estiverem preenchidos, é um ingrediente válido
      if (name && qty) {
        hasValidIngredient = true;
      } 
      // Se apenas um dos campos estiver preenchido, mostra erro
      else if (name || qty) {
        if (!name) {
          nameInput.focus();
          return { valido: false, mensagem: 'Por favor, preencha o nome do ingrediente.' };
        }
        if (!qty) {
          qtyInput.focus();
          return { valido: false, mensagem: 'Por favor, preencha a quantidade do ingrediente.' };
        }
      }
    }
    
    // Verifica se há pelo menos um ingrediente válido
    if (!hasValidIngredient) {
      return { 
        valido: false, 
        mensagem: 'Por favor, adicione pelo menos um ingrediente com nome e quantidade válidos.' 
      };
    }
    
    return { valido: true };
  }
  
  // Adiciona o evento de clique ao botão Próximo
  document.querySelectorAll('.btn-next').forEach(b => {
    b.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Valida os ingredientes apenas se estiver na etapa de ingredientes (etapa 2)
      if (getCurrentStep() === 2) {
        const validacao = validarIngredientes();
        
        // Se não for válido, mostra mensagem e impede o avanço
        if (!validacao.valido) {
          alert(validacao.mensagem);
          return;
        }
      }
      
      // Avança para o próximo passo
      const currentStep = getCurrentStep();
      if (currentStep < 3) { // 3 é o número máximo de etapas
        showStep(currentStep + 1);
      }
    });
  });

  // --- INGREDIENTS MANAGEMENT + AUTOCOMPLETE ---
  const ingredientList = document.getElementById('ingredient-list');
  const addIngredientBtn = document.getElementById('add-ingredient-btn');

  function debounce(fn, wait = 300) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  }

  function createIngredientRow() {
    const row = document.createElement('div');
  row.className = 'ingredient-row d-grid gap-2 align-items-center mb-2';
  row.style.gridTemplateColumns = '1fr 120px 120px 40px';
    row.innerHTML = `
      <div style="position:relative">
        <input class="form-control ingredient-name-input" placeholder="Nome do ingrediente" autocomplete="off" required />
        <div class="suggestions-container" style="position:absolute;left:0;right:0;z-index:1000"></div>
      </div>
      <input type="number" class="form-control ingredient-qty" placeholder="Qtd" required min="0.01" step="0.01" />
      <select class="form-select ingredient-unit"><option value="g">g</option><option value="ml">ml</option><option value="unit">un</option></select>
      <button class="btn btn-outline-danger btn-remove" title="Remover"><i class="bi bi-x-lg"></i></button>
    `;

    const removeBtn = row.querySelector('.btn-remove');
    removeBtn.addEventListener('click', () => { row.remove(); });

    // attach autocomplete behavior
    const nameInput = row.querySelector('.ingredient-name-input');
    const suggestionsContainer = row.querySelector('.suggestions-container');

    const renderSuggestions = (names) => {
      suggestionsContainer.innerHTML = '';
      if (!names || names.length === 0) return;

      // container styling (inlined to ensure visibility regardless of page CSS)
      suggestionsContainer.style.background = '#fff';
      suggestionsContainer.style.border = '1px solid rgba(0,0,0,0.12)';
      suggestionsContainer.style.borderTop = 'none';
      suggestionsContainer.style.maxHeight = '220px';
      suggestionsContainer.style.overflowY = 'auto';
      suggestionsContainer.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
      suggestionsContainer.style.padding = '0.15rem';

      const list = document.createElement('div');
      list.className = 'list-group';
      names.slice(0, 12).forEach(n => {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'list-group-item list-group-item-action';
        item.textContent = n;
        item.addEventListener('click', () => {
          nameInput.value = n;
          // ensure other listeners see the change
          nameInput.dispatchEvent(new Event('input', { bubbles: true }));
          nameInput.dispatchEvent(new Event('change', { bubbles: true }));
          suggestionsContainer.innerHTML = '';
        });
        list.appendChild(item);
      });
      suggestionsContainer.appendChild(list);
    };

    const doSearch = debounce(async (value) => {
      const q = (value || '').trim();
      try {
        // backend now returns a short list when query is empty
        const res = await fetch(`/api/tables/search-food?query=${encodeURIComponent(q)}`);
        if (!res.ok) { suggestionsContainer.innerHTML = ''; return; }
        const data = await res.json();
        renderSuggestions(data.names || []);
      } catch (err) {
        console.error('search error', err);
        suggestionsContainer.innerHTML = '';
      }
    }, 250);

    // show suggestions when input is focused (including an empty value)
    nameInput.addEventListener('focus', (e) => doSearch(e.target.value));

  nameInput.addEventListener('input', (e) => doSearch(e.target.value));
    
    document.addEventListener('click', (ev) => {
      if (!row.contains(ev.target)) suggestionsContainer.innerHTML = '';
    });

    ingredientList.appendChild(row);
    return row;
  }

  if (addIngredientBtn) {
    addIngredientBtn.addEventListener('click', (e) => { 
      e.preventDefault(); 
      createIngredientRow();
      // Rola para o novo ingrediente adicionado
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth'
      });
    });
  }
  
  // Add only one empty row by default
  createIngredientRow();

  // if ?edit=<id> present, load table and populate form for editing
  const params = new URLSearchParams(window.location.search);
  const editId = params.get('edit');
  let isEditMode = false;
  async function loadForEdit(id) {
    try {
      const userData = JSON.parse(localStorage.getItem('user')) || JSON.parse(sessionStorage.getItem('user')) || {};
      const token = userData.token;
      if (!token) { alert('Você precisa estar logado para editar uma tabela.'); window.location.href = 'login.html'; return; }
      const res = await fetch(`/api/tables/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) { alert('Falha ao carregar tabela para edição.'); return; }
      const json = await res.json();
      const t = json.table || json;
      if (!t) { alert('Tabela não encontrada'); return; }
      isEditMode = true;

      // populate title
      const titleEl = document.getElementById('product-name');
      if (titleEl) titleEl.value = t.title || '';
      // portion size
      const psEl = document.getElementById('portion-size');
      if (psEl) psEl.value = t.portionSize || 100;

      // select base card
      selectedBase = t.base || selectedBase;
      baseCards.forEach(c => c.classList.toggle('selected', c.dataset.value === selectedBase));

      // clear existing ingredient rows and create from items
      ingredientList.innerHTML = '';
      (t.items || []).forEach(it => {
        const row = createIngredientRow();
        row.querySelector('.ingredient-name-input').value = it.name || '';
        row.querySelector('.ingredient-qty').value = it.quantity || '';
        const unitEl = row.querySelector('.ingredient-unit');
        if (unitEl) unitEl.value = it.unit || 'g';
      });

      // scroll to step 2 (ingredients)
      showStep(2);
    } catch (err) {
      console.error('loadForEdit error', err);
      alert('Erro ao carregar tabela para edição.');
    }
  }
  if (editId) loadForEdit(editId);

  

  // --- GENERATE / SUBMIT TABLE ---
  const generateBtn = document.querySelector('#step-3 .btn-success');
  if (generateBtn) generateBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const title = document.getElementById('product-name')?.value?.trim() || 'Sem título';
    const portionSize = Number(document.getElementById('portion-size')?.value) || 100;
    const base = selectedBase || 'taco';
    const rows = Array.from(document.querySelectorAll('.ingredient-row'));
    const items = rows.map(r => ({
      name: r.querySelector('.ingredient-name-input')?.value?.trim() || '',
      quantity: Number(r.querySelector('.ingredient-qty')?.value) || 0,
      unit: r.querySelector('.ingredient-unit')?.value || 'g'
    })).filter(i => i.name);

    if (items.length === 0) {
      if (!confirm('Nenhum ingrediente válido adicionado. Gerar tabela de exemplo?')) return;
    }

    const userData = JSON.parse(localStorage.getItem('user')) || JSON.parse(sessionStorage.getItem('user'));
    const token = userData?.token;

    try {
      let res;
      if (isEditMode && editId) {
        // update existing table
        res = await fetch(`/api/tables/${encodeURIComponent(editId)}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ title, base, portionSize, items })
        });
      } else {
        res = await fetch('/api/tables', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ title, base, portionSize, items })
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erro ao gerar/atualizar tabela');
      const table = data.table || data;
      alert(isEditMode ? 'Tabela atualizada com sucesso!' : 'Tabela gerada com sucesso!');
      // redirect to the table result view for the created/updated table
      const idToOpen = table._id || table.id || editId;
      if (idToOpen) window.location.href = `tabela_resultado.html?id=${encodeURIComponent(idToOpen)}`;
      else window.location.href = 'historico.html';
    } catch (err) {
      console.error(err);
      alert(err.message || 'Erro ao criar/atualizar tabela');
    }
  });

});