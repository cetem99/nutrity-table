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
  function createExportElement() {
    const element = document.getElementById('nutritional-table-data');
    if (!element) return null;
    const clone = element.cloneNode(true);
    // remove ingredient list + heading when exporting
    clone.querySelectorAll('.ingredients-block').forEach(block => block.remove());
    clone.removeAttribute('id');
    clone.classList.add('pdf-export-style');
    clone.style.position = 'absolute';
    clone.style.left = '-9999px';
    clone.style.top = '0';
    clone.style.width = `${element.offsetWidth}px`;
    document.body.appendChild(clone);
    return clone;
  }

  function exportTableToPDF() {
    const exportElement = createExportElement();
    if (!exportElement) return;
    const productTitle = getProductTitle();

    const options = {
      margin: 0.5,
      filename: `${productTitle}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    const worker = html2pdf().from(exportElement).set(options).save();
    if (worker && typeof worker.finally === 'function') {
      worker.finally(() => exportElement.remove());
    } else {
      exportElement.remove();
    }
  }

  // --- Função para gerar CSV ---
    function exportTableToCSV() {
      let csvContent = "data:text/csv;charset=utf-8,";
      const headers = ["Nutriente", "Por 100 g", "Por porção (g)", "%VD*"];
      csvContent += headers.join(",") + "\r\n";

      const rows = document.querySelectorAll('#nutritional-table-data .data-row');
      rows.forEach(row => {
        // row children layout: [label, per100, perPortion, vd]
        const cells = row.querySelectorAll('div');
        const nutrient = `"${row.dataset.nutrient}"`;
        // helper to extract numeric portion before space (removes unit)
        const extractNum = (text) => {
          if (!text) return '';
          const t = text.trim();
          if (t === '—' || t === '') return '';
          // usually '10,0 g' or '16,4' (vd). take first token and remove any non-digit/comma/dot
          const first = t.split('\u00A0')[0].split(' ')[0];
          return first.replace(/[^0-9,\.\-]/g, '');
        };
        const per100Text = cells[1]?.textContent || '';
        const perPortionText = cells[2]?.textContent || '';
        const vdText = cells[3]?.textContent || row.dataset.vd || '';

        const value100g = extractNum(per100Text);
        const valuePortion = extractNum(perPortionText);
        const valueVd = extractNum(vdText);

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

  // --- LOAD TABLE FROM ID ---
  let currentTableId = null;
  let currentTable = null;

  async function loadTableFromQuery() {
    try {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');
      if (!id) return; // nothing to load

      const userData = JSON.parse(localStorage.getItem('user')) || JSON.parse(sessionStorage.getItem('user')) || {};
      const token = userData.token;
      if (!token) return;

      const res = await fetch(`/api/tables/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) {
        console.error('Failed to load table', await res.text());
        return;
      }
      const json = await res.json();
  const t = json.table || json;
  currentTableId = id;
  currentTable = t;
      if (!t) return;

      // title
      const titleEl = document.getElementById('product-title');
      if (titleEl) titleEl.textContent = t.title || 'Sem título';

      // created date paragraph
      const headerDate = document.querySelector('.result-container header p.text-body-secondary');
      if (headerDate) {
        const created = t.createdAt ? new Date(t.createdAt).toLocaleDateString('pt-BR') : '';
        headerDate.textContent = `Tabela nutricional gerada em ${created}`;
      }

  // portion
  const portionInput = document.getElementById('portion');
  if (portionInput) portionInput.value = t.portionSize || 50;

      // populate nutritional table area with items
      const container = document.getElementById('nutritional-table-data');
      if (!container) return;
      const body = container.querySelector('.card-body');
      if (!body) return;

      // clear existing rows/content (keep header if present)
      // we'll build a simple ingredients list and a small nutrition summary per item
      const content = document.createElement('div');
      content.className = 'table-content';

      const ingredientsBlock = document.createElement('div');
      ingredientsBlock.className = 'ingredients-block';

      const ingHeader = document.createElement('h5');
      ingHeader.className = 'fw-bold mb-3';
      ingHeader.textContent = 'Ingredientes';
      ingredientsBlock.appendChild(ingHeader);

      const list = document.createElement('ul');
      list.className = 'list-group mb-4';

      const fmt = (v) => {
        if (v === null || v === undefined || v === '') return '—';
        const n = Number(v);
        if (Number.isNaN(n)) return v;
        // format using pt-BR locale, exactly 1 decimal place
        return n.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
      };

      (t.items || []).forEach(it => {
        const li = document.createElement('li');
        li.className = 'list-group-item';
        const name = document.createElement('div');
        name.className = 'fw-semibold';
        name.textContent = it.name || '';
        const qty = document.createElement('div');
        qty.className = 'text-muted small';
        qty.textContent = `${it.quantity || '-'} ${it.unit || ''}`;
        li.appendChild(name);
        li.appendChild(qty);

        if (it.nutrition) {
          const nut = document.createElement('div');
          nut.className = 'mt-2 small';
          const e = it.nutrition.energy_kcal != null ? `${fmt(it.nutrition.energy_kcal)} kcal` : '—';
          const p = it.nutrition.protein_g != null ? `${fmt(it.nutrition.protein_g)} g` : '—';
          const f = it.nutrition.fat_g != null ? `${fmt(it.nutrition.fat_g)} g` : '—';
          const c = it.nutrition.carbs_g != null ? `${fmt(it.nutrition.carbs_g)} g` : '—';
          nut.innerHTML = `<strong>Por 100g:</strong> Energia: ${e} • Proteína: ${p} • Gordura: ${f} • Carboidrato: ${c}`;
          li.appendChild(nut);
        }

        list.appendChild(li);
      });

      ingredientsBlock.appendChild(list);
      content.appendChild(ingredientsBlock);

      // compute nutrition totals using rule-of-three
      const nutrientsKeys = [
        { key: 'energy_kcal', label: 'Valor energético (kcal)', unit: 'kcal' },
        { key: 'carbs_g', label: 'Carboidratos (g)', unit: 'g' },
        { key: 'sugars_total_g', label: 'Açúcares totais (g)', unit: 'g' },
        { key: 'sugars_added_g', label: 'Açúcares adicionados (g)', unit: 'g' },
        { key: 'protein_g', label: 'Proteínas (g)', unit: 'g' },
        { key: 'fat_g', label: 'Gorduras totais (g)', unit: 'g' },
        { key: 'fat_saturated_g', label: 'Gorduras saturadas (g)', unit: 'g' },
        { key: 'fat_trans_g', label: 'Gorduras trans (g)', unit: 'g' },
        { key: 'fiber_g', label: 'Fibra alimentar (g)', unit: 'g' },
        { key: 'sodium_mg', label: 'Sódio (mg)', unit: 'mg' },
      ];

      // VD reference values (ANVISA RDC 429/2020) for 2.000 kcal diet
      const VD_REF = {
        carbs_g: 300.0,
        protein_g: 75.0,
        fat_g: 55.0,
        fat_saturated_g: 22.0,
        fiber_g: 25.0,
        sodium_mg: 2000.0,
        sugars_added_g: 50.0,
      };

      const totals = {};
      let totalWeight = 0;
      (t.items || []).forEach(it => { totalWeight += Number(it.quantity) || 0; });
      nutrientsKeys.forEach(n => totals[n.key] = 0);

      (t.items || []).forEach(it => {
        const qty = Number(it.quantity) || 0;
        if (!it.nutrition) return;
        nutrientsKeys.forEach(n => {
          // fallback for missing fields in nutrition object
          let valPer100 = it.nutrition[n.key];
          if (typeof valPer100 === 'undefined') {
            // tentativas de mapeamento alternativo para campos comuns
            if (n.key === 'sugars_total_g') valPer100 = it.nutrition.sugars_g ?? it.nutrition.sugar_g;
            if (n.key === 'sugars_added_g') valPer100 = it.nutrition.sugars_added_g ?? it.nutrition.sugar_added_g;
            if (n.key === 'fat_saturated_g') valPer100 = it.nutrition.saturated_fat_g ?? it.nutrition.fat_saturated_g;
            if (n.key === 'fat_trans_g') valPer100 = it.nutrition.trans_fat_g ?? it.nutrition.fat_trans_g;
            if (n.key === 'fiber_g') valPer100 = it.nutrition.fiber_g ?? it.nutrition.fibra_g;
            if (n.key === 'sodium_mg') valPer100 = it.nutrition.sodium_mg ?? it.nutrition.sodio_mg;
          }
          valPer100 = Number(valPer100);
          if (!isNaN(valPer100) && valPer100 !== null) {
            totals[n.key] += (valPer100 * qty) / 100.0;
          }
        });
      });

      const tableHeader = document.createElement('div');
      tableHeader.className = 'table-header';
      const headerTitleWrapper = document.createElement('div');
      const tableTitleEl = document.createElement('h5');
      tableTitleEl.className = 'table-title';
      tableTitleEl.textContent = 'INFORMAÇÃO NUTRICIONAL';
      headerTitleWrapper.appendChild(tableTitleEl);
      tableHeader.appendChild(headerTitleWrapper);
      content.appendChild(tableHeader);

      const portionMeta = document.createElement('p');
      portionMeta.className = 'table-summary';
      content.appendChild(portionMeta);

      const grid = document.createElement('div');
      grid.className = 'table-grid header-row mb-2';
      grid.innerHTML = `<div>Informação</div><div>Por 100 g</div><div>Porção</div><div>%VD*</div>`;
      content.appendChild(grid);

      const nutContainer = document.createElement('div');
      nutContainer.id = 'nutrient-summary-rows';
      content.appendChild(nutContainer);

      const footnote = document.createElement('p');
      footnote.className = 'table-footnote';
      footnote.textContent = '*Percentual de valores diários fornecidos pela porção.';
      content.appendChild(footnote);

      function renderNutritionRows(portionSize) {
        nutContainer.innerHTML = '';
        const ps = Number(portionSize) || Number(t.portionSize) || 50;
        portionMeta.innerHTML = `Porções por embalagem: -- <br> Porção: ${ps} g`;

        nutrientsKeys.forEach(n => {
          const totalForRecipe = totals[n.key] || 0;
          const per100g = totalWeight > 0 ? (totalForRecipe / totalWeight) * 100 : 0;
          const perPortion = totalWeight > 0 ? totalForRecipe * (ps / totalWeight) : 0;

          const showValue = (v) => (v === null || v === undefined || isNaN(v)) ? '--' : (Number(v) === 0 ? '0,0' : fmt(v));

          const row = document.createElement('div');
          row.className = 'table-grid data-row';
          row.setAttribute('data-nutrient', n.label);
          row.dataset.per100 = per100g;
          row.dataset.portion = perPortion;
          // compute %VD for the portion using VD_REF when available
          const vdValue = VD_REF[n.key] ?? null;
          let vdPercent = '-';
          if (vdValue != null && !isNaN(perPortion)) {
            const raw = (perPortion / vdValue) * 100.0;
            const rounded = Math.round(raw * 10) / 10.0;
            vdPercent = rounded.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
          }
          row.dataset.vd = vdPercent;
          row.dataset.unit = n.unit || '';
          const vdDisplay = vdPercent === '-' ? '-' : `${vdPercent}%`;
          row.innerHTML = `<div>${n.label}</div><div>${showValue(per100g)} ${n.unit}</div><div>${showValue(perPortion)} ${n.unit}</div><div>${vdDisplay}</div>`;
          nutContainer.appendChild(row);
        });
      }

      renderNutritionRows(t.portionSize || 50);

      // wire portion input to re-render per portion values on change
      const portionInputEl = document.getElementById('portion');
      if (portionInputEl) {
        portionInputEl.addEventListener('input', (ev) => {
          const v = ev.target.value;
          renderNutritionRows(v);
        });
      }

      // wire save button to persist new portionSize to server and reload
      const saveBtn = document.getElementById('save-portion-btn');
      if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
          if (!currentTableId) {
            alert('Nenhuma tabela carregada para salvar.');
            return;
          }
          const userData = JSON.parse(localStorage.getItem('user')) || JSON.parse(sessionStorage.getItem('user')) || {};
          const token = userData.token;
          if (!token) {
            alert('Você precisa estar logado para salvar.');
            return;
          }
          const portionEl = document.getElementById('portion');
          const newPortion = Number(portionEl?.value) || 0;
          saveBtn.disabled = true;
          try {
            const res = await fetch(`/api/tables/${currentTableId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ portionSize: newPortion })
            });
            if (!res.ok) {
              const txt = await res.text();
              console.error('Failed to save portion', txt);
              alert('Erro ao salvar porção');
            } else {
              // reload the table data to reflect updated portion size
              await loadTableFromQuery();
            }
          } catch (err) {
            console.error('save portion error', err);
            alert('Erro ao salvar porção');
          } finally {
            saveBtn.disabled = false;
          }
        });
      }

      // replace body content while keeping header elements like .table-header if present
      // remove everything inside body and append our content
      body.innerHTML = '';
      body.appendChild(content);

    } catch (err) {
      console.error('loadTableFromQuery error', err);
    }
  }

  // call loader
  loadTableFromQuery();

  // wire Edit button on result page to open creation page in edit mode
  const editBtn = document.querySelector('.btn.btn-outline-secondary');
  if (editBtn) {
    editBtn.addEventListener('click', (ev) => {
      ev.preventDefault();
      if (!currentTableId) return;
      window.location.href = `criar_tabela.html?edit=${encodeURIComponent(currentTableId)}`;
    });
  }
});
