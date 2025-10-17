document.addEventListener('DOMContentLoaded', function() {
  // --- CONTROLE DA SIDEBAR ---
  // (código da sidebar continua o mesmo)
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebarClose = document.getElementById('sidebar-close');
  const overlay = document.getElementById('sidebar-overlay');
  if(sidebarToggle) sidebarToggle.addEventListener('click', () => { sidebar.classList.add('is-open'); overlay.classList.add('is-visible'); });
  if(sidebarClose) sidebarClose.addEventListener('click', () => { sidebar.classList.remove('is-open'); overlay.classList.remove('is-visible'); });
  if(overlay) overlay.addEventListener('click', () => { sidebar.classList.remove('is-open'); overlay.classList.remove('is-visible'); });

  // --- LÓGICA DE EXPORTAÇÃO ---
  const exportCsvBtn = document.getElementById('export-csv-btn');
  const exportPdfBtn = document.getElementById('export-pdf-btn');

  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', exportTableToCSV);
  }
  if (exportPdfBtn) {
    exportPdfBtn.addEventListener('click', exportTableToPDF);
  }

  function getProductTitle() {
      return document.getElementById('product-title')?.textContent.trim().replace(/\s+/g, '_') || 'tabela-nutricional';
  }

  // --- Função para gerar PDF ---
  function exportTableToPDF() {
    const element = document.getElementById('nutritional-table-data');
    const productTitle = getProductTitle();

    const options = {
      margin: 0.5,
      filename: `${productTitle}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    // Adiciona a classe de estilo para impressão e gera o PDF
    element.classList.add('pdf-export-style');
    
    html2pdf().from(element).set(options).save().then(() => {
      // Remove a classe de estilo após a geração do PDF
      element.classList.remove('pdf-export-style');
    });
  }

  // --- Função para gerar CSV ---
  function exportTableToCSV() {
    let csvContent = "data:text/csv;charset=utf-8,";
    const headers = ["Nutriente", "Valor por 100g", "Valor por Porção", "%VD"];
    csvContent += headers.join(",") + "\r\n";

    const rows = document.querySelectorAll('#nutritional-table-data .data-row');
    rows.forEach(row => {
      const nutrient = `"${row.dataset.nutrient}"`;
      const value100g = row.dataset.g;
      const valuePortion = row.dataset.portion;
      const valueVd = row.dataset.vd === '-' ? '' : row.dataset.vd;
      const csvRow = [nutrient, value100g, valuePortion, valueVd].join(",");
      csvContent += csvRow + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${getProductTitle()}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
});