import fs from 'fs';
import path from 'path';

const FILE = path.resolve(process.cwd(), 'cmvcol_taco3.json');
const BACKUP = path.resolve(process.cwd(), 'cmvcol_taco3.json.bak');

const mapping = new Map([
  ['Umidade', 'Unidade (%)'],
  ['Energia', 'Energia (kcal)'],
  ['Unnamed: 4', 'Energia (kJ)'],
  ['Proteína', 'Proteína (g)'],
  ['Lipídeos', 'Lipídeos (g)'],
  ['Colesterol', 'Colesterol (mg)'],
  ['idrato', 'Amido (g)'],
  ['Alimentar', 'Alimentar (g)'],
  ['Cinzas', 'Cinzas (g)'],
  ['Cálcio', 'Cálcio (mg)'],
  ['Magnésio', 'Magnésio (mg)'],
  ['Número do.1', 'Número do Alimento'],
  ['Manganês', 'Manganês (mg)'],
  ['Fósforo', 'Fósforo (mg)'],
  ['Ferro', 'Ferro (mg)'],
  ['Sódio', 'Sódio (mg)'],
  ['Potássio', 'Potássio (mg)'],
  ['Cobre', 'Cobre (mg)'],
  ['Zinco', 'Zinco (mg)'],
  ['Retinol', 'Retinol (mcg)'],
  ['RE', 'RE (mcg)'],
  ['RAE ', 'RAE (mcg)'],
  ['Tiamina', 'Tiamina (mg)'],
  ['Riboflavina', 'Riboflavina (mg)'],
  ['Piridoxina', 'Piridoxina (mg)'],
  ['Niacina', 'Niacina (mg)'],
  ['C', 'C (mg)'],
]);

function transformObject(obj) {
  const out = {};
  for (const key of Object.keys(obj)) {
    let newKey = key;
    // normalize some header anomalies
    if (key === 'RAE ') newKey = 'RAE ';
    if (mapping.has(key)) {
      newKey = mapping.get(key);
    }
    out[newKey] = obj[key];
  }
  return out;
}

try {
  if (!fs.existsSync(FILE)) {
    console.error('File not found:', FILE);
    process.exit(1);
  }
  const raw = fs.readFileSync(FILE, 'utf8');
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) {
    console.error('Expected JSON array');
    process.exit(1);
  }
  // Backup
  fs.copyFileSync(FILE, BACKUP);
  console.log('Backup written to', BACKUP);

  const transformed = data.map(transformObject);
  fs.writeFileSync(FILE, JSON.stringify(transformed, null, 2), 'utf8');
  console.log('Transformed file written to', FILE);
} catch (err) {
  console.error('Error transforming file:', err);
  process.exit(1);
}
