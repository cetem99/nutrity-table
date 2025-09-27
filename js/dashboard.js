document.addEventListener('DOMContentLoaded', function() {
  // --- CONTROLE DA SIDEBAR ---
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


  // --- LÓGICA DOS GRÁFICOS DO DASHBOARD ---

  // Gráfico de Pizza (Ingredientes)
  const ingredientsCtx = document.getElementById('ingredientsChart');
  if (ingredientsCtx) {
    new Chart(ingredientsCtx, {
      type: 'doughnut',
      data: {
        labels: ['Farinha de Trigo', 'Açúcar', 'Óleo Vegetal', 'Ovos', 'Sal', 'Outros'],
        datasets: [{
          label: '% de Uso',
          data: [15, 12, 10, 8, 6, 49],
          backgroundColor: [
            '#3b82f6', // Blue
            '#10b981', // Green
            '#f97316', // Orange
            '#f59e0b', // Amber
            '#ef4444', // Red
            '#6b7280'  // Gray
          ],
          borderColor: '#fff',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          }
        }
      }
    });
  }

  // Gráfico de Barras (Categorias)
  const categoriesCtx = document.getElementById('categoriesChart');
  if (categoriesCtx) {
    new Chart(categoriesCtx, {
      type: 'bar',
      data: {
        labels: ['Biscoitos', 'Bebidas', 'Cereais', 'Laticínios'],
        datasets: [{
          label: 'Tipos de produtos',
          data: [8, 6, 4, 3],
          backgroundColor: '#3b82f6',
          borderRadius: 4,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: '#e5e7eb'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }
    });
  }
});