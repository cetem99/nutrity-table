import fs from 'fs';
import path from 'path';

const FILE = path.resolve(process.cwd(), 'agtaco3.json');
const BACKUP = path.resolve(process.cwd(), 'agtaco3.json.bak');

const fattyAcids = ['12:0','14:0','16:0','18:0','20:0','22:0','24:0','14:1','16:1','18:1','20:1','18:2 n-6','18:3 n-3','20:4','20:5','22:5','22:6','18:1t','18:2t'];

function transformObject(obj) {
  const out = {};
  for (const key of Object.keys(obj)) {
    let newKey = key;
    if (key === 'turados') newKey = 'Saturados (g)';
    if (key === 'insaturados') newKey = 'Monoinsaturados (g)';
    if (key === 'insaturados.1') newKey = 'Poli-insaturados (g)';
    if (key === 'Número do.1') newKey = 'Número do Alimento';
    // fatty acids -> add unit suffix if not present
    if (fattyAcids.includes(key)) newKey = `${key} (g)`;
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
  fs.copyFileSync(FILE, BACKUP);
  console.log('Backup written to', BACKUP);
  const transformed = data.map(transformObject);
  fs.writeFileSync(FILE, JSON.stringify(transformed, null, 2), 'utf8');
  console.log('Renamed fields written to', FILE);
} catch (err) {
  console.error('Error:', err);
  process.exit(1);
}
