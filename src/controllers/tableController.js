import NutritionTable from '../models/nutritionTable.js';
import fs from 'fs/promises';
import path from 'path';

// Local CMVCOL JSON file (provided by user) - used as the authoritative source
const LOCAL_DB_PATH = path.resolve(process.cwd(), 'cmvcol_taco3.json');
let _localDbCache = null;

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

function normalizeEntry(e) {
  if (!e) return null;
  // many files use 'Unnamed: 1' as the description column
  const name = (e['Unnamed: 1'] || e['Descrição dos alimentos'] || e['Alimento'] || '').toString().trim();
  const energy = e['Energia'] ?? e['Energia (kcal)'] ?? null;
  const protein = e['Proteína'] ?? null;
  const fat = e['Lipídeos'] ?? null;
  const carbs = e['idrato'] ?? e['Carboidrato'] ?? e['Carbo-'] ?? null;
  return {
    source: 'local_cmvcol',
    product: name,
    energy_kcal: typeof energy === 'number' ? energy : Number(energy) || null,
    protein_g: typeof protein === 'number' ? protein : Number(protein) || null,
    fat_g: typeof fat === 'number' ? fat : Number(fat) || null,
    carbs_g: typeof carbs === 'number' ? carbs : Number(carbs) || null,
    raw: e,
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
  return normalizeEntry(hit);
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

    const normalized = matches.map(normalizeEntry).filter(Boolean);
    if (normalized.length === 0) return res.status(404).json({ message: 'Nenhuma entrada encontrada.' });
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
    const { portionSize, title } = req.body || {};
    let changed = false;
    if (typeof portionSize !== 'undefined') {
      const ps = Number(portionSize);
      if (!Number.isNaN(ps)) { table.portionSize = ps; changed = true; }
    }
    if (typeof title === 'string' && title.trim().length > 0) {
      table.title = title.trim(); changed = true;
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
