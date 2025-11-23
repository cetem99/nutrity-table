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
  const baseCards = document.querySelectorAll('.base-card-taco');
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
  
  function getCurrentStep() {
    const currentStep = document.querySelector('.step.current');
    return currentStep ? parseInt(currentStep.dataset.step) : 1;
  }

  if (btnStep1) {
    btnStep1.addEventListener('click', (e) => { e.preventDefault(); showStep(2); });
  }
  
  document.querySelectorAll('.btn-prev').forEach(b => {
    b.addEventListener('click', (e) => {
      e.preventDefault();
      const currentStep = getCurrentStep();
      if (currentStep > 1) showStep(currentStep - 1);
    });
  });

  // Validação
  function validarIngredientes() {
    const ingredientRows = document.querySelectorAll('.ingredient-row');
    let hasValidIngredient = false;
    
    for (const row of ingredientRows) {
      const nameInput = row.querySelector('.ingredient-name-input');
      const qtyInput = row.querySelector('.ingredient-qty');
      const name = nameInput?.value.trim();
      const qty = qtyInput?.value.trim();
      
      if (name && qty) {
        hasValidIngredient = true;
      } else if (name || qty) {
        if (!name) { nameInput.focus(); return { valido: false, mensagem: 'Por favor, preencha o nome do ingrediente.' }; }
        if (!qty) { qtyInput.focus(); return { valido: false, mensagem: 'Por favor, preencha a quantidade do ingrediente.' }; }
      }
    }
    if (!hasValidIngredient) return { valido: false, mensagem: 'Por favor, adicione pelo menos um ingrediente válido.' };
    return { valido: true };
  }
  
  document.querySelectorAll('.btn-next').forEach(b => {
    b.addEventListener('click', (e) => {
      e.preventDefault();
      if (getCurrentStep() === 2) {
        const validacao = validarIngredientes();
        if (!validacao.valido) { alert(validacao.mensagem); return; }
      }
      const currentStep = getCurrentStep();
      if (currentStep < 3) showStep(currentStep + 1);
    });
  });

  // --- INGREDIENTS MANAGEMENT + AUTOCOMPLETE ---
  const ingredientList = document.getElementById('ingredient-list');
  const addIngredientBtn = document.getElementById('add-ingredient-btn');
  const API_WARNING = window.getApiWarningMessage ? window.getApiWarningMessage() : 'Funcionalidade indisponível.';

  function buildApiUrl(path) {
    return window.getApiUrlOrWarn ? window.getApiUrlOrWarn(path, () => alert(API_WARNING)) : path;
  }

  function debounce(fn, wait = 300) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
  }

  function createIngredientRow() {
    const row = document.createElement('div');
    row.className = 'ingredient-row mb-2'; 
    
    row.innerHTML = `
      <div class="ingredient-name-col" style="position:relative">
        <input class="form-control ingredient-name-input" placeholder="Nome do ingrediente" autocomplete="off" required />
        <div class="suggestions-container" style="position:absolute;left:0;right:0;z-index:1000;display:none;"></div>
      </div>
      <input type="number" class="form-control ingredient-qty" placeholder="Qtd" required min="0.01" step="0.01" />
      <select class="form-select ingredient-unit"><option value="g">g</option><option value="unit">un</option></select>
      <button class="btn btn-outline-danger btn-remove" title="Remover"><i class="bi bi-x-lg"></i></button>
    `;

    const removeBtn = row.querySelector('.btn-remove');
    removeBtn.addEventListener('click', () => { row.remove(); });

    // Autocomplete
    const nameInput = row.querySelector('.ingredient-name-input');
    const suggestionsContainer = row.querySelector('.suggestions-container');

    const hideSuggestions = () => {
      suggestionsContainer.innerHTML = '';
      suggestionsContainer.style.display = 'none';
    };

    const renderSuggestions = (names) => {
      suggestionsContainer.innerHTML = '';
      if (!names || names.length === 0) { hideSuggestions(); return; }

      // REMOVIDOS ESTILOS INLINE. Agora o CSS controla as cores.
      suggestionsContainer.style.display = 'block';
      
      const list = document.createElement('div');
      list.className = 'list-group';
      
      names.slice(0, 12).forEach(n => {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'list-group-item list-group-item-action';
        item.textContent = n;
        
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          nameInput.value = n;
          hideSuggestions();
        });
        
        list.appendChild(item);
      });
      suggestionsContainer.appendChild(list);
    };

    const doSearch = debounce(async (value) => {
      const q = (value || '').trim();
      if (!q) { hideSuggestions(); return; }
      try {
        const url = buildApiUrl(`/api/tables/search-food?query=${encodeURIComponent(q)}`);
        if (!url) return;
        const res = await fetch(url);
        if (!res.ok) { hideSuggestions(); return; }
        const data = await res.json();
        renderSuggestions(data.names || []);
      } catch (err) { hideSuggestions(); }
    }, 250);

    nameInput.addEventListener('focus', (e) => { if(e.target.value.trim()) doSearch(e.target.value); });
    nameInput.addEventListener('input', (e) => doSearch(e.target.value));
    
    document.addEventListener('click', (ev) => {
      if (!row.contains(ev.target)) hideSuggestions();
    });

    ingredientList.appendChild(row);
    return row;
  }

  if (addIngredientBtn) {
    addIngredientBtn.addEventListener('click', (e) => { 
      e.preventDefault(); 
      createIngredientRow();
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    });
  }
  
  createIngredientRow();

  // Edição
  const params = new URLSearchParams(window.location.search);
  const editId = params.get('edit');
  let isEditMode = false;
  async function loadForEdit(id) {
    try {
      const userData = JSON.parse(localStorage.getItem('user')) || JSON.parse(sessionStorage.getItem('user')) || {};
      const token = userData.token;
      if (!token) { window.location.href = 'login.html'; return; }
      const url = buildApiUrl(`/api/tables/${id}`);
      if (!url) return;
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) return;
      const json = await res.json();
      const t = json.table || json;
      isEditMode = true;

      const titleEl = document.getElementById('product-name');
      if (titleEl) titleEl.value = t.title || '';
      const psEl = document.getElementById('portion-size');
      if (psEl) psEl.value = t.portionSize || 50;

      selectedBase = t.base || selectedBase;
      baseCards.forEach(c => c.classList.toggle('selected', c.dataset.value === selectedBase));

      ingredientList.innerHTML = '';
      (t.items || []).forEach(it => {
        const row = createIngredientRow();
        row.querySelector('.ingredient-name-input').value = it.name || '';
        row.querySelector('.ingredient-qty').value = it.quantity || '';
        const unitEl = row.querySelector('.ingredient-unit');
        if (unitEl) unitEl.value = it.unit || 'g';
      });
      showStep(2);
    } catch (err) { console.error(err); }
  }
  if (editId) loadForEdit(editId);

  // Gerar
  const generateBtn = document.querySelector('#step-3 .btn-success');
  if (generateBtn) generateBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const title = document.getElementById('product-name')?.value?.trim() || 'Sem título';
    const portionSize = Number(document.getElementById('portion-size')?.value) || 50;
    const base = selectedBase || 'taco';
    const rows = Array.from(document.querySelectorAll('.ingredient-row'));
    const items = rows.map(r => ({
      name: r.querySelector('.ingredient-name-input')?.value?.trim() || '',
      quantity: Number(r.querySelector('.ingredient-qty')?.value) || 0,
      unit: r.querySelector('.ingredient-unit')?.value || 'g'
    })).filter(i => i.name);

    if (items.length === 0) { if (!confirm('Nenhum ingrediente válido. Gerar exemplo?')) return; }

    const userData = JSON.parse(localStorage.getItem('user')) || JSON.parse(sessionStorage.getItem('user'));
    const token = userData?.token;

    try {
      let res;
      const body = JSON.stringify({ title, base, portionSize, items });
      const headers = { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) };
      
      if (isEditMode && editId) {
        const url = buildApiUrl(`/api/tables/${encodeURIComponent(editId)}`);
        if (!url) return;
        res = await fetch(url, { method: 'PUT', headers, body });
      } else {
        const url = buildApiUrl('/api/tables');
        if (!url) return;
        res = await fetch(url, { method: 'POST', headers, body });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erro');
      const table = data.table || data;
      const idToOpen = table._id || table.id || editId;
      if (idToOpen) window.location.href = `tabela_resultado.html?id=${encodeURIComponent(idToOpen)}`;
      else window.location.href = 'historico.html';
    } catch (err) { alert(err.message); }
  });
});