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
  if (btnStep1) btnStep1.addEventListener('click', () => showStep(2));
  document.querySelectorAll('.btn-prev').forEach(b => b.addEventListener('click', () => showStep(1)));
  document.querySelectorAll('.btn-next').forEach(b => b.addEventListener('click', () => showStep(3)));

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
        <input class="form-control ingredient-name-input" placeholder="" autocomplete="off" />
        <div class="suggestions-container" style="position:absolute;left:0;right:0;z-index:1000"></div>
      </div>
      <input type="number" class="form-control ingredient-qty" placeholder="" />
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

  if (addIngredientBtn) addIngredientBtn.addEventListener('click', (e) => { e.preventDefault(); createIngredientRow(); });
  // add three empty rows by default
  for (let i = 0; i < 3; i++) createIngredientRow();

  

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
      const res = await fetch('/api/tables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ title, base, portionSize, items })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erro ao gerar tabela');
      alert('Tabela gerada com sucesso!');
      window.location.href = 'historico.html';
    } catch (err) {
      console.error(err);
      alert(err.message || 'Erro ao criar tabela');
    }
  });

});