document.addEventListener('DOMContentLoaded', function() {
  // --- CONTROLE DA SIDEBAR (Necessário em ambas as páginas) ---
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

  // --- LÓGICA DA NOVA TABELA MULTI-ETAPAS ---
  let currentStep = 1;
  const steps = document.querySelectorAll('.step');
  const stepContents = document.querySelectorAll('.step-content');

  function updateStepUI() {
    steps.forEach((step, index) => {
      if (index + 1 === currentStep) {
        step.classList.add('current');
      } else {
        step.classList.remove('current');
      }
    });
    stepContents.forEach(content => {
      if (content && parseInt(content.id.split('-')[1]) === currentStep) {
        content.classList.remove('d-none');
      } else if (content) {
        content.classList.add('d-none');
      }
    });
  }

  document.querySelectorAll('.btn-next, #btn-step1-continue').forEach(button => {
    button.addEventListener('click', () => {
      if (currentStep < 3) {
        currentStep++;
        updateStepUI();
      }
    });
  });

  document.querySelectorAll('.btn-prev').forEach(button => {
    button.addEventListener('click', () => {
      if (currentStep > 1) {
        currentStep--;
        updateStepUI();
      }
    });
  });

  const baseCards = document.querySelectorAll('.base-card');
  const btnStep1Continue = document.getElementById('btn-step1-continue');
  
  baseCards.forEach(card => {
    card.addEventListener('click', () => {
      baseCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      if (btnStep1Continue) {
        btnStep1Continue.disabled = false;
      }
    });
  });

  const addIngredientBtn = document.getElementById('add-ingredient-btn');
  const ingredientList = document.getElementById('ingredient-list');
  let ingredientCount = 0;

  function addIngredientRow() {
    ingredientCount++;
    const row = document.createElement('div');
    row.classList.add('ingredient-row');
    row.innerHTML = `
      <div>
        ${ingredientCount === 1 ? '<label class="form-label small">Ingrediente ' + ingredientCount + '</label>' : ''}
        <input type="text" class="form-control" placeholder="Ex: Farinha de trigo">
      </div>
      <div>
        ${ingredientCount === 1 ? '<label class="form-label small">Qtd.</label>' : ''}
        <input type="number" class="form-control" value="0">
      </div>
      <div>
        ${ingredientCount === 1 ? '<label class="form-label small">Unidade</label>' : ''}
        <select class="form-select"><option>g</option><option>ml</option><option>un</option></select>
      </div>
      <div>
        ${ingredientCount === 1 ? '<label class="form-label small invisible">Ação</label>' : ''}
        <button class="btn btn-outline-danger btn-sm remove-ingredient-btn"><i class="bi bi-x-lg"></i></button>
      </div>
    `;
    if (ingredientList) {
      ingredientList.appendChild(row);
    }
  }

  if (ingredientList) {
    ingredientList.addEventListener('click', function(e) {
      if (e.target.closest('.remove-ingredient-btn')) {
        e.target.closest('.ingredient-row').remove();
      }
    });
  }

  if (addIngredientBtn) {
    addIngredientBtn.addEventListener('click', addIngredientRow);
    for(let i=0; i<3; i++) { addIngredientRow(); }
  }
  
  updateStepUI();
});