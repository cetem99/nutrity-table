document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.getElementById('sidebar');
  const toggle = document.getElementById('btn-toggle');
  const baseCards = document.querySelectorAll('.base-card');
  const continueBtn = document.getElementById('continue');

  // restaura sidebar collapsed
  if (localStorage.getItem('nt_sidebar_collapsed') === 'true') sidebar.classList.add('collapsed');

  toggle && toggle.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    localStorage.setItem('nt_sidebar_collapsed', sidebar.classList.contains('collapsed'));
    // ajustar left da navbar se preferir (CSS usa variável)
  });

  // seleção base e habilitar botão
  let selected = localStorage.getItem('nt_selected_base') || null;
  baseCards.forEach(card => {
    // restaura visual se previamente selecionado
    if (selected && card.dataset.base === selected) card.classList.add('selected');
    card.addEventListener('click', () => {
      baseCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selected = card.dataset.base;
      localStorage.setItem('nt_selected_base', selected);
      if (continueBtn) continueBtn.disabled = false;
    });
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); } });
  });

  // continue action (simulação)
  continueBtn && continueBtn.addEventListener('click', () => {
    const sel = selected || localStorage.getItem('nt_selected_base');
    if (!sel) return;
    // atualizar step to next (visual)
    const current = document.querySelector('.step.current');
    if (current) {
      const next = current.nextElementSibling;
      if (next && next.classList.contains('step')) {
        current.classList.remove('current');
        next.classList.add('current');
      }
    }
    alert('Continuar com base: ' + sel);
  });

  // habilitar botão se já havia seleção
  if (selected && continueBtn) continueBtn.disabled = false;
});
