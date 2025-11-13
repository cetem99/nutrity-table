import NutritionTable from '../models/nutritionTable.js';
import fs from 'fs/promises';
import path from 'path';

// Local CMVCOL JSON file (provided by user) - used as the authoritative source
const LOCAL_DB_PATH = path.resolve(process.cwd(), 'cmvcol_taco3.json');
let _localDbCache = null;
let _agtacoCache = null;

async function loadLocalDb() {
  if (_localDbCache) return _localDbCache;
  try {
    const raw = await fs.readFile(LOCAL_DB_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    // normalize into array of entries with a name field
    const entries = Array.isArray(parsed) ? parsed : [];
    _localDbCache = entries;
    return _localDbCache;
  } catch (err) {
    console.error('Failed to load local CMVCOL JSON:', err?.message || err);
    _localDbCache = [];
    return _localDbCache;
  }
}

async function loadAgtaDb() {
  if (_agtacoCache) return _agtacoCache;
  try {
    const raw = await fs.readFile(path.resolve(process.cwd(), 'agtaco3.json'), 'utf8');
    const parsed = JSON.parse(raw);
    _agtacoCache = Array.isArray(parsed) ? parsed : [];
    return _agtacoCache;
  } catch (err) {
    console.error('Failed to load agtaco JSON:', err?.message || err);
    _agtacoCache = [];
    return _agtacoCache;
  }
}

function normalizeEntry(e) {
  if (!e) return null;
  // nomes reais do JSON
  const name = (e['Unnamed: 1'] || e['Descrição dos alimentos'] || e['Alimento'] || '').toString().trim();
  // Energy: prefer the new key with unit, fallback to older keys
  const energy = e['Energia (kcal)'] ?? e['Energia'];
  // Carboidratos: prefer renamed 'Carboidrato (g)', fallback to older keys
  const carbs = e['Carboidrato (g)'] ?? e['Amido (g)'] ?? e['idrato'] ?? e['Carboidrato'];
  // Proteins
  const protein = e['Proteína (g)'] ?? e['Proteína'];
  // Lipídeos / gorduras
  const fat = e['Lipídeos (g)'] ?? e['Lipídeos'] ?? e['Gorduras totais'];
  // Fibra alimentar: prefer 'Fibra Alimentar (g)' or 'Alimentar (g)'
  const fiber = e['Fibra Alimentar (g)'] ?? e['Alimentar (g)'] ?? e['Alimentar'];
  // Corrige sódio para pegar todas as variações possíveis
  let sodium = e['Sódio'];
  if (typeof sodium === 'undefined') sodium = e['Sódio (mg)'];
  if (typeof sodium === 'undefined') sodium = e['Sodio'];

  // campos não presentes no JSON
  const sugars_total = null;
  const sugars_added = null;
  const fat_saturated = null;
  const fat_trans = null;

  return {
    source: 'local_cmvcol',
    product: name,
    energy_kcal: typeof energy === 'number' ? energy : Number(energy) || null,
    carbs_g: typeof carbs === 'number' ? carbs : Number(carbs) || null,
    sugars_total_g: null,
    sugars_added_g: null,
    protein_g: typeof protein === 'number' ? protein : Number(protein) || null,
    fat_g: typeof fat === 'number' ? fat : Number(fat) || null,
    fat_saturated_g: null,
    fat_trans_g: null,
    fiber_g: typeof fiber === 'number' ? fiber : Number(fiber) || null,
    sodium_mg: typeof sodium === 'number' ? sodium : Number(sodium) || null,
    raw: e,
  };
}

function normalizeAgtacoEntry(e) {
  if (!e) return null;
  // keys after renaming: 'Saturados (g)', 'Monoinsaturados (g)', 'Poli-insaturados (g)'
  const saturated = e['Saturados (g)'] ?? e['turados'] ?? null;
  const mono = e['Monoinsaturados (g)'] ?? e['insaturados'] ?? null;
  const poly = e['Poli-insaturados (g)'] ?? e['insaturados.1'] ?? null;

  const fattyAcids = {};
  // list of common fatty acid keys (with possible '(g)')
  const acids = ['12:0','14:0','16:0','18:0','20:0','22:0','24:0','14:1','16:1','18:1','20:1','18:2 n-6','18:3 n-3','20:4','20:5','22:5','22:6','18:1t','18:2t'];
  acids.forEach(a => {
    const k1 = `${a} (g)`;
    const k2 = a;
    let v = typeof e[k1] !== 'undefined' ? e[k1] : (typeof e[k2] !== 'undefined' ? e[k2] : null);
    if (v === ' ' || v === '') v = null;
    fattyAcids[a] = v === null ? null : Number(v);
  });

  // estimate total trans as sum of available trans isomers
  const transVals = [];
  if (fattyAcids['18:1t'] != null) transVals.push(fattyAcids['18:1t']);
  if (fattyAcids['18:2t'] != null) transVals.push(fattyAcids['18:2t']);
  const transTotal = transVals.length > 0 ? transVals.reduce((s, x) => s + (Number(x) || 0), 0) : null;

  return {
    saturated_g: typeof saturated === 'number' ? saturated : Number(saturated) || null,
    mono_g: typeof mono === 'number' ? mono : Number(mono) || null,
    poly_g: typeof poly === 'number' ? poly : Number(poly) || null,
    trans_g: transTotal,
    fattyAcids,
  };
}

async function findLocalNutrition(name) {
  const q = (name || '').toString().trim().toLowerCase();
  if (!q) return null;
  const db = await loadLocalDb();
  if (!db || db.length === 0) return null;

  // search for best match: exact (case-insensitive), then startsWith, then includes
  let hit = db.find(r => {
    const n = (r['Unnamed: 1'] || r['Descrição dos alimentos'] || '').toString().toLowerCase();
    return n === q;
  });
  if (!hit) {
    hit = db.find(r => {
      const n = (r['Unnamed: 1'] || r['Descrição dos alimentos'] || '').toString().toLowerCase();
      return n.startsWith(q);
    });
  }
  if (!hit) {
    hit = db.find(r => {
      const n = (r['Unnamed: 1'] || r['Descrição dos alimentos'] || '').toString().toLowerCase();
      return n.includes(q);
    });
  }
  const base = normalizeEntry(hit);
  // try to enrich with agtaco fatty acid data
  try {
    const agtadb = await loadAgtaDb();
    if (agtadb && agtadb.length > 0) {
      // search in agtadb by description fields
      let ahit = agtadb.find(r => {
        const n = (r['Descrição dos alimentos'] || r['Unnamed: 1'] || '').toString().toLowerCase();
        return n === q;
      });
      if (!ahit) {
        ahit = agtadb.find(r => {
          const n = (r['Descrição dos alimentos'] || r['Unnamed: 1'] || '').toString().toLowerCase();
          return n.startsWith(q);
        });
      }
      if (!ahit) {
        ahit = agtadb.find(r => {
          const n = (r['Descrição dos alimentos'] || r['Unnamed: 1'] || '').toString().toLowerCase();
          return n.includes(q);
        });
      }
      if (ahit) {
        const af = normalizeAgtacoEntry(ahit);
        if (af) {
          // fill missing saturated/trans with agtaco data
          if ((base.fat_saturated_g === null || typeof base.fat_saturated_g === 'undefined') && af.saturated_g != null) base.fat_saturated_g = af.saturated_g;
          if ((base.fat_trans_g === null || typeof base.fat_trans_g === 'undefined') && af.trans_g != null) base.fat_trans_g = af.trans_g;
          // attach additional fat breakdown
          base.fat_mono_g = af.mono_g ?? base.fat_mono_g;
          base.fat_poly_g = af.poly_g ?? base.fat_poly_g;
          base.fatty_acids = af.fattyAcids;
        }
      }
    }
  } catch (err) {
    console.error('findLocalNutrition agtaco merge error:', err?.message || err);
  }

  return base;
}

export const createTable = async (req, res) => {
  try {
    const { title: rawTitle, base, portionSize, items: rawItems } = req.body;
    const title = (rawTitle && rawTitle.toString().trim()) || 'Tabela de Exemplo';

    // If no items provided or empty, create a simple default template
    let items = Array.isArray(rawItems) ? rawItems.slice() : [];
    if (!items || items.length === 0) {
      // simple template - reasonable defaults
      items = [
        { name: 'Arroz integral, cozido', quantity: 100, unit: 'g' },
        { name: 'Feijão carioca, cozido', quantity: 50, unit: 'g' },
        { name: 'Óleo de soja', quantity: 10, unit: 'g' }
      ];
    }

    // Enrich items using the local JSON database when available
    const enriched = await Promise.all(items.map(async (it) => {
      const nutrition = await findLocalNutrition(it.name);
      return {
        name: it.name,
        quantity: it.quantity || 0,
        unit: it.unit || 'g',
        nutrition,
      };
    }));

    const table = new NutritionTable({
      user: req.userId,
      title,
      base: base || 'local',
      portionSize: portionSize || 100,
      items: enriched,
    });

    await table.save();
    return res.status(201).json({ table });
  } catch (error) {
    console.error('createTable error:', error);
    return res.status(500).json({ message: 'Erro ao criar tabela nutricional.' });
  }
};

export const listTables = async (req, res) => {
  try {
    const tables = await NutritionTable.find({ user: req.userId }).sort({ createdAt: -1 });
    return res.json({ tables });
  } catch (error) {
    console.error('listTables error:', error);
    return res.status(500).json({ message: 'Erro ao listar tabelas.' });
  }
};

export const getTable = async (req, res) => {
  try {
    const table = await NutritionTable.findById(req.params.id);
    if (!table) return res.status(404).json({ message: 'Tabela não encontrada.' });
    // ensure ownership
    if (table.user.toString() !== req.userId) return res.status(403).json({ message: 'Acesso negado.' });
    return res.json({ table });
  } catch (error) {
    console.error('getTable error:', error);
    return res.status(500).json({ message: 'Erro ao buscar tabela.' });
  }
};

// Search distinct ingredient names present in saved tables (DB-backed autocomplete)
// If DB has no matches, fallback to searching the local JSON file (cmvcol_taco3.json)
export const searchFoods = async (req, res) => {
  try {
    const q = (req.query.query || '').trim();

    // Try DB first
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&'), 'i');
    const results = await NutritionTable.aggregate([
      { $unwind: '$items' },
      ...(q ? [{ $match: { 'items.name': { $regex: regex } } }] : []),
      { $group: { _id: { $toLower: '$items.name' }, name: { $first: '$items.name' }, count: { $sum: 1 } } },
      { $sort: { count: -1, name: 1 } },
      { $limit: 30 },
      { $project: { _id: 0, name: 1 } },
    ]).allowDiskUse(true);

    let names = results.map(r => r.name);

    // Also include matches from local JSON so that generic queries (e.g. 'arroz')
    // return all related local items even if DB contains only a specific saved name.
    try {
      const local = await loadLocalDb();
      const candidates = local
        .map(e => (e['Unnamed: 1'] || e['Descrição dos alimentos'] || e['Alimento'] || '').toString().trim())
        .filter(n => n && n.length > 1);

      let localMatches;
      if (!q) {
        localMatches = Array.from(new Set(candidates)).slice(0, 30);
      } else {
        const ql = q.toLowerCase();
        localMatches = Array.from(new Set(candidates.filter(n => n.toLowerCase().includes(ql)))).slice(0, 30);
      }

      // merge DB names (higher precedence) with local matches, keeping unique case-insensitive
      const seen = new Set();
      const combined = [];
      // prefer DB results first
      for (const n of names) {
        const key = (n || '').toLowerCase();
        if (!seen.has(key)) { seen.add(key); combined.push(n); }
      }
      for (const n of localMatches) {
        const key = (n || '').toLowerCase();
        if (!seen.has(key)) { seen.add(key); combined.push(n); }
      }

      names = combined.slice(0, 30);
    } catch (err) {
      // if local load fails, keep DB names
      console.error('searchFoods local merge error:', err?.message || err);
    }

    return res.json({ names });
  } catch (error) {
    console.error('searchFoods error:', error);
    return res.status(500).json({ names: [] });
  }
};

// Return nutrition info (normalized) for a given food name from local JSON.
// Query: ?name=banana
export const getFood = async (req, res) => {
  try {
    const name = (req.query.name || '').toString().trim();
    if (!name) return res.status(400).json({ message: 'Parâmetro "name" é obrigatório.' });

    const q = name.toLowerCase();
    const db = await loadLocalDb();
    if (!db || db.length === 0) return res.status(500).json({ message: 'Local DB vazio ou não carregado.' });

    // First try exact, then startsWith, then includes (collect potentially multiple matches for includes)
    let matches = db.filter(r => {
      const n = (r['Unnamed: 1'] || r['Descrição dos alimentos'] || r['Alimento'] || '').toString().trim().toLowerCase();
      return n === q;
    });

    if (matches.length === 0) {
      matches = db.filter(r => {
        const n = (r['Unnamed: 1'] || r['Descrição dos alimentos'] || r['Alimento'] || '').toString().trim().toLowerCase();
        return n.startsWith(q);
      });
    }

    if (matches.length === 0) {
      matches = db.filter(r => {
        const n = (r['Unnamed: 1'] || r['Descrição dos alimentos'] || r['Alimento'] || '').toString().trim().toLowerCase();
        return n.includes(q);
      }).slice(0, 30);
    }

    let normalized = matches.map(normalizeEntry).filter(Boolean);
    if (normalized.length === 0) return res.status(404).json({ message: 'Nenhuma entrada encontrada.' });

    // try to enrich each normalized result with agtaco fatty-acid data
    try {
      const agtadb = await loadAgtaDb();
      if (agtadb && agtadb.length > 0) {
        normalized = normalized.map(n => {
          try {
            const qn = (n.product || '').toString().toLowerCase();
            let ahit = agtadb.find(r => {
              const nn = (r['Descrição dos alimentos'] || r['Unnamed: 1'] || '').toString().toLowerCase();
              return nn === qn;
            });
            if (!ahit) {
              ahit = agtadb.find(r => {
                const nn = (r['Descrição dos alimentos'] || r['Unnamed: 1'] || '').toString().toLowerCase();
                return nn.startsWith(qn);
              });
            }
            if (!ahit) {
              ahit = agtadb.find(r => {
                const nn = (r['Descrição dos alimentos'] || r['Unnamed: 1'] || '').toString().toLowerCase();
                return nn.includes(qn);
              });
            }
            if (ahit) {
              const af = normalizeAgtacoEntry(ahit);
              if (af) {
                if ((n.fat_saturated_g === null || typeof n.fat_saturated_g === 'undefined') && af.saturated_g != null) n.fat_saturated_g = af.saturated_g;
                if ((n.fat_trans_g === null || typeof n.fat_trans_g === 'undefined') && af.trans_g != null) n.fat_trans_g = af.trans_g;
                n.fat_mono_g = af.mono_g ?? n.fat_mono_g;
                n.fat_poly_g = af.poly_g ?? n.fat_poly_g;
                n.fatty_acids = af.fattyAcids;
              }
            }
          } catch (e) {
            // ignore per-item merge errors
          }
          return n;
        });
      }
    } catch (err) {
      console.error('getFood agtaco merge error:', err?.message || err);
    }

    // if single match, return object, else array
    return res.json({ results: normalized.length === 1 ? normalized[0] : normalized });
  } catch (error) {
    console.error('getFood error:', error);
    return res.status(500).json({ message: 'Erro ao buscar alimento.' });
  }
};

export const deleteTable = async (req, res) => {
  try {
    const table = await NutritionTable.findById(req.params.id);
    if (!table) return res.status(404).json({ message: 'Tabela não encontrada.' });
    if (table.user.toString() !== req.userId) return res.status(403).json({ message: 'Acesso negado.' });
    await NutritionTable.deleteOne({ _id: table._id });
    return res.json({ message: 'Tabela excluída.' });
  } catch (error) {
    console.error('deleteTable error:', error);
    return res.status(500).json({ message: 'Erro ao excluir tabela.' });
  }
};

export const updateTable = async (req, res) => {
  try {
    const table = await NutritionTable.findById(req.params.id);
    if (!table) return res.status(404).json({ message: 'Tabela não encontrada.' });
    if (table.user.toString() !== req.userId) return res.status(403).json({ message: 'Acesso negado.' });

    // allow updating only a small set of fields for now (portionSize, title)
    const { portionSize, title, items: rawItems, base } = req.body || {};
    let changed = false;
    if (typeof portionSize !== 'undefined') {
      const ps = Number(portionSize);
      if (!Number.isNaN(ps)) { table.portionSize = ps; changed = true; }
    }
    if (typeof title === 'string' && title.trim().length > 0) {
      table.title = title.trim(); changed = true;
    }
    if (typeof base === 'string' && base.trim().length > 0) {
      table.base = base.trim(); changed = true;
    }

    // allow replacing items (full edit). If provided, enrich items similarly to createTable
    if (Array.isArray(rawItems)) {
      try {
        const items = rawItems.slice();
        const enriched = await Promise.all(items.map(async (it) => {
          const nutrition = await findLocalNutrition(it.name);
          return {
            name: it.name,
            quantity: it.quantity || 0,
            unit: it.unit || 'g',
            nutrition,
          };
        }));
        table.items = enriched;
        changed = true;
      } catch (err) {
        console.error('updateTable enrich items error:', err?.message || err);
      }
    }

    if (changed) {
      await table.save();
    }

    return res.json({ table });
  } catch (error) {
    console.error('updateTable error:', error);
    return res.status(500).json({ message: 'Erro ao atualizar tabela.' });
  }
};
