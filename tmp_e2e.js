(async () => {
  try {
    const base = 'http://localhost:3000';
    const email = `e2e_test_${Date.now()}@example.com`;
    const password = 'Password123!';
    const name = 'E2E Test User';

    console.log('Registering user', email);
    let res = await fetch(`${base}/api/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    if (res.status === 409) {
      console.log('User already exists, attempting login');
      res = await fetch(`${base}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
    }
    const j = await res.json();
    if (!res.ok) throw new Error(`Auth failed: ${JSON.stringify(j)}`);
    const token = j.token;
    console.log('Got token, creating table...');

    const tableRes = await fetch(`${base}/api/tables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: 'E2E Table Test', base: 'local', portionSize: 100, items: [{ name: 'banana', quantity: 100, unit: 'g' }, { name: 'arroz, integral, cozido', quantity: 100, unit: 'g' }] }),
    });
    const tableJson = await tableRes.json();
    if (!tableRes.ok) throw new Error(`Create table failed: ${JSON.stringify(tableJson)}`);
    console.log('Table created:', tableJson.table._id);

    const listRes = await fetch(`${base}/api/tables`, { headers: { Authorization: `Bearer ${token}` } });
    const listJson = await listRes.json();
    if (!listRes.ok) throw new Error(`List tables failed: ${JSON.stringify(listJson)}`);
    console.log('Tables count for user:', listJson.tables.length);
    console.log('Sample saved table items:', JSON.stringify(listJson.tables[0].items, null, 2));

  } catch (err) {
    console.error('E2E error:', err);
    process.exit(1);
  }
})();
