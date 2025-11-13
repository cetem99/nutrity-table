// Utility to compute Percentual do Valor Diário (%VD) based on ANVISA RDC 429/2020
// Reference values assume a 2.000 kcal diet.
const VD_REFERENCE = {
  // grams
  carbs_g: 300.0,
  protein_g: 75.0,
  fat_g: 55.0,
  fat_saturated_g: 22.0,
  fiber_g: 25.0,
  // milligrams
  sodium_mg: 2000.0,
  // added sugars
  sugars_added_g: 50.0,
};

function getVDValueByKey(key) {
  return VD_REFERENCE[key] ?? null;
}

/**
 * Given an array of nutrient rows, add a percentVD field computed for the provided
 * quantityPerPortion. Rows are objects and should include at least:
 *   - key: the internal nutrient key (e.g., 'carbs_g', 'protein_g', 'sodium_mg')
 *   - quantity: numeric amount for the portion (in same unit as VD)
 *   - unit: string like 'g' or 'mg'
 *
 * Returns a new array with an added percentVD field (number rounded to 1 decimal) or null
 * when no VD reference exists for that nutrient.
 */
function computePercentVDForRows(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map(r => {
    const key = r.key || r.nutrientKey || r.k;
    const qty = (r.quantity === null || r.quantity === undefined) ? null : Number(r.quantity);
    const vd = key ? getVDValueByKey(key) : null;
    let percent = null;
    if (vd != null && qty != null && !Number.isNaN(qty)) {
      percent = (qty / vd) * 100.0;
      // round to 1 decimal
      percent = Math.round(percent * 10) / 10.0;
    }
    return Object.assign({}, r, { percentVD: percent });
  });
}

module.exports = { computePercentVDForRows, getVDValueByKey, VD_REFERENCE };
