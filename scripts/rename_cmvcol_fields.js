import fs from 'fs';
import path from 'path';

const FILE = path.resolve(process.cwd(), 'cmvcol_taco3.json');
const BACKUP = path.resolve(process.cwd(), 'cmvcol_taco3.json.rename.bak');

function transformObject(obj) {
  const out = {};
  for (const key of Object.keys(obj)) {
    let newKey = key;
    if (key === 'Amido (g)') newKey = 'Carboidrato (g)';
    if (key === 'Alimentar (g)') newKey = 'Fibra Alimentar (g)';
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
