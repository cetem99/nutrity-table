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
    // Mudamos de CSV para Excel para poder ter bordas
    exportCsvBtn.addEventListener('click', exportTableToExcel);
    // Opcional: Mude o texto do botão visualmente se quiser
    exportCsvBtn.innerHTML = '<i class="bi bi-file-earmark-excel me-1"></i> Exportar Excel';
  }

  // --- Nova Função: Gera Excel (.xls) com formatação visual ---
  function exportTableToExcel() {
      const productTitle = getProductTitle();
      
      // 1. Pegamos os dados da tela
      const rows = document.querySelectorAll('#nutritional-table-data .data-row');
      
      let tableRows = '';
      
      rows.forEach(row => {
        const cells = row.querySelectorAll('div');
        if(cells.length < 4) return;
        
        // Limpa o texto
        const c1 = cells[0].textContent.trim();
  const rawC2 = cells[1].textContent.trim();
  const rawC3 = cells[2].textContent.trim();
  const c2 = rawC2.replace(/%/g, '').replace(/[^0-9,\.\-]/g, '').trim();
  const c3 = rawC3.replace(/%/g, '').replace(/[^0-9,\.\-]/g, '').trim();
  let c4 = cells[3].textContent.trim();
  // remove percent sign if present and convert dash to empty
  c4 = c4.replace(/%/g, '').trim();
  if (c4 === '-' || c4 === '') c4 = '';

        tableRows += `
          <tr>
            <td style="border: 1px solid #000; padding: 5px;">${c1}</td>
            <td style="border: 1px solid #000; text-align: center;">${c2}</td>
            <td style="border: 1px solid #000; text-align: center;">${c3}</td>
            <td style="border: 1px solid #000; text-align: center;">${c4}</td>
          </tr>
        `;
      });

      // 2. Montamos um HTML especial que o Excel entende como planilha
      // Isso permite usar CSS (style) para definir as bordas grossas
      const excelTemplate = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; }
            table { border-collapse: collapse; width: 100%; }
            .header { 
                background-color: #f0f0f0; 
                font-weight: bold; 
                text-align: center;
                border-top: 2px solid #000;
                border-bottom: 2px solid #000;
                border-left: 2px solid #000;
                border-right: 2px solid #000;
            }
            .header td {
                border: 1px solid #000;
                padding: 10px;
            }
            .title {
                font-size: 16px; 
                font-weight: bold; 
                text-align: center; 
                border: 2px solid #000;
                padding: 10px;
                background-color: #fff;
            }
          </style>
        </head>
        <body>
          <table>
            <tr>
              <td colspan="4" class="title">INFORMAÇÃO NUTRICIONAL</td>
            </tr>
            <tr>
              <td colspan="4" style="text-align: center; border-left: 2px solid #000; border-right: 2px solid #000;">
                 Porções por embalagem: -- <br> Porção: ${document.getElementById('portion').value}
              </td>
            </tr>
            
            <tr class="header">
              <td style="text-align: left;">Informação</td>
              <td>Por 100 g</td>
              <td>Por porção</td>
              <td>%VD*</td>
            </tr>
            
            ${tableRows}
            
            <tr>
              <td colspan="4" style="font-size: 10px; border-top: 2px solid #000;">*Percentual de valores diários fornecidos pela porção.</td>
            </tr>
          </table>
        </body>
        </html>
      `;

      // 3. Cria o arquivo .xls (Excel)
      const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      // Importante: Extensão .xls para o Windows abrir direto no Excel
      link.download = `${productTitle}.xls`; 
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
    if (!element) return;
    const productTitle = getProductTitle();

    // 1. Ocultar ingredientes (se quiser que saia só a tabela)
    const ingredientsBlock = document.querySelector('.ingredients-block');
    if (ingredientsBlock) ingredientsBlock.style.display = 'none';

    // 2. ATIVAR MODO PDF (Transforma o visual apenas para a exportação)
    element.classList.add('pdf-mode');

    const options = {
      margin: [0.5, 0.5], // Margens
      filename: `${productTitle}.pdf`,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { 
        scale: 4, // Alta resolução
        useCORS: true, 
        letterRendering: true,
        scrollY: 0 
      },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().from(element).set(options).save()
      .then(() => {
        // 3. DESATIVAR MODO PDF (Volta ao visual bonito)
        element.classList.remove('pdf-mode');
        if (ingredientsBlock) ingredientsBlock.style.display = 'block';
      })
      .catch((err) => {
        console.error(err);
        element.classList.remove('pdf-mode');
        if (ingredientsBlock) ingredientsBlock.style.display = 'block';
      });
  }

  // --- Função para gerar CSV (Ajustada para ler os dados da tela corretamente) ---
function exportTableToCSV() {
      // 1. Definição do separador (Ponto e vírgula é o padrão para Excel em PT-BR)
      const SEPARATOR = ";";
      
      // 2. Cabeçalho
      const headers = ["Nutriente", "Por 100 g", "Por porção (g)", "%VD*"];
      let csvContent = headers.join(SEPARATOR) + "\r\n";

      // 3. Pega as linhas de dados da tela atual
      const rows = document.querySelectorAll('#nutritional-table-data .data-row');
      
      rows.forEach(row => {
        const cells = row.querySelectorAll('div');
        if(cells.length < 4) return;

        // Função auxiliar para limpar o texto e tratar aspas internas (se houver)
        const clean = (text) => {
          let t = text.textContent.trim();
          // Se o texto tiver aspas, duplicamos elas para não quebrar o CSV (padrão CSV)
          return t.replace(/"/g, '""');
        };

        // Envolvemos os valores em aspas duplas para garantir segurança
        const nutrient = `"${clean(cells[0])}"`;
    const val100 = `"${clean(cells[1]).replace(/%/g, '').replace(/[^0-9,\.\-]/g, '')}"`;
    const valPortion = `"${clean(cells[2]).replace(/%/g, '').replace(/[^0-9,\.\-]/g, '')}"`;
    // remove percent sign from VD column for CSV export and strip any non-numeric chars
    const vdClean = clean(cells[3]).replace(/%/g, '').trim();
    const valVD = `"${vdClean === '-' ? '' : vdClean.replace(/[^0-9,\.\-]/g, '')}"`;

        csvContent += [nutrient, val100, valPortion, valVD].join(SEPARATOR) + "\r\n";
      });

      const productTitle = getProductTitle();

      // 4. CRÍTICO: Adicionamos o BOM (\uFEFF) no início para o Excel reconhecer os acentos (UTF-8)
      const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // Cria o link de download usando o Blob
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${productTitle}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  }
  // --- LOAD TABLE FROM ID ---
  let currentTableId = null;
  let currentTable = null;

  const API_WARNING = window.getApiWarningMessage
    ? window.getApiWarningMessage()
    : 'Funcionalidade indisponível sem backend configurado.';

  function buildApiUrl(path) {
    return window.getApiUrlOrWarn
      ? window.getApiUrlOrWarn(path, () => alert(API_WARNING))
      : path;
  }

  async function loadTableFromQuery() {
    try {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');
      if (!id) return; // nothing to load

      const userData = JSON.parse(localStorage.getItem('user')) || JSON.parse(sessionStorage.getItem('user')) || {};
      const token = userData.token;
      if (!token) return;

      const url = buildApiUrl(`/api/tables/${id}`);
      if (!url) return;
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
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
          // show numbers only (no units)
          const e = it.nutrition.energy_kcal != null ? `${fmt(it.nutrition.energy_kcal)}` : '—';
          const p = it.nutrition.protein_g != null ? `${fmt(it.nutrition.protein_g)}` : '—';
          const f = it.nutrition.fat_g != null ? `${fmt(it.nutrition.fat_g)}` : '—';
          const c = it.nutrition.carbs_g != null ? `${fmt(it.nutrition.carbs_g)}` : '—';
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
        // Energia em kcal para dieta de 2000 kcal
        energy_kcal: 2000.0,
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
  // show portion number only (no unit)
  portionMeta.innerHTML = `Porções por embalagem: -- <br> Porção: ${ps}`;

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
            // Round to nearest integer percent as requested
            const raw = (perPortion / vdValue) * 100.0;
            const roundedInt = Math.round(raw);
            vdPercent = roundedInt.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
          } else {
            // Special case: if there's no VD defined but the nutrient amount in the portion is exactly zero,
            // show 0 for certain nutrients (Açúcares totais and Gorduras trans) instead of leaving blank.
            if (!isNaN(perPortion) && Math.abs(Number(perPortion)) < 1e-6 && (n.key === 'sugars_total_g' || n.key === 'fat_trans_g')) {
              // treat very small values as zero for display purposes
              vdPercent = (0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
            }
          }
          row.dataset.vd = vdPercent;
          row.dataset.unit = n.unit || '';
          // show %VD value as number only (no percent sign). Empty when no VD available.
          const vdDisplay = vdPercent === '-' ? '' : vdPercent;
          // display numbers only (no units)
          row.innerHTML = `<div>${n.label}</div><div>${showValue(per100g)}</div><div>${showValue(perPortion)}</div><div>${vdDisplay}</div>`;
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
            const url = buildApiUrl(`/api/tables/${currentTableId}`);
            if (!url) {
              saveBtn.disabled = false;
              return;
            }
            const res = await fetch(url, {
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
