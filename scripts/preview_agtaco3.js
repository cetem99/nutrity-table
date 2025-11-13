import fs from 'fs';
import path from 'path';

const FILE = path.resolve(process.cwd(), 'agtaco3.json');
try {
  const raw = fs.readFileSync(FILE, 'utf8');
  const data = JSON.parse(raw);
  const samples = data.slice(0,6);
  samples.forEach((s, i) => {
    console.log('--- ENTRY', i, '---');
    console.log('Número do:', s['Número do']);
    console.log('Descrição:', s['Descrição dos alimentos']);
    // print selected keys to confirm
    ['Saturados (g)','Monoinsaturados (g)','Poli-insaturados (g)','Carboidrato (g)','Fibra Alimentar (g)','Sódio (mg)'].forEach(k => {
      console.log(k, ':', Object.prototype.hasOwnProperty.call(s,k) ? s[k] : '(missing)');
    });
  });
} catch (err) {
  console.error('Error reading', FILE, err);
  process.exit(1);
}
