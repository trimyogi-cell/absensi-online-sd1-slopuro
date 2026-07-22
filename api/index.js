const express = require('express');
const cors = require('cors');
const { kv } = require('@vercel/kv');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

async function readDB(name) {
  try {
    const data = await kv.get(name);
    return data || [];
  } catch (e) {
    return [];
  }
}

async function writeDB(name, data) {
  await kv.set(name, data);
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

const tables = ['siswa', 'absensi', 'nilai', 'libur', 'gradeSetting', 'pengaturanSekolah', 'authUser'];

tables.forEach(table => {
  app.get(`/api/${table}`, async (req, res) => {
    const data = await readDB(table);
    res.json(data);
  });

  app.get(`/api/${table}/:id`, async (req, res) => {
    const data = await readDB(table);
    const item = data.find(x => x.id === req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  });

  app.post(`/api/${table}`, async (req, res) => {
    const data = await readDB(table);
    const newItem = { id: generateId(), ...req.body };
    data.push(newItem);
    await writeDB(table, data);
    res.json(newItem);
  });

  app.put(`/api/${table}/:id`, async (req, res) => {
    const data = await readDB(table);
    const idx = data.findIndex(x => x.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    data[idx] = { ...data[idx], ...req.body };
    await writeDB(table, data);
    res.json(data[idx]);
  });

  app.delete(`/api/${table}/:id`, async (req, res) => {
    let data = await readDB(table);
    data = data.filter(x => x.id !== req.params.id);
    await writeDB(table, data);
    res.json({ success: true });
  });

  app.post(`/api/${table}/replace-all`, async (req, res) => {
    await writeDB(table, req.body);
    res.json({ success: true });
  });
});

app.post('/api/bulk-save', async (req, res) => {
  const { table, filterField, filterValue, items } = req.body;
  if (!table || !items) return res.status(400).json({ error: 'Missing table or items' });
  let data = await readDB(table);
  if (filterField && filterValue !== undefined) {
    data = data.filter(d => d[filterField] !== filterValue);
  }
  items.forEach(item => {
    data.push({ id: generateId(), ...item });
  });
  await writeDB(table, data);
  res.json({ success: true, total: data.length });
});

app.post('/api/bulk-delete', async (req, res) => {
  const { table, field, value } = req.body;
  if (!table || !field) return res.status(400).json({ error: 'Missing params' });
  let data = await readDB(table);
  data = data.filter(d => d[field] !== value);
  await writeDB(table, data);
  res.json({ success: true, total: data.length });
});

app.post('/api/import-siswa', async (req, res) => {
  const { items } = req.body;
  if (!items || !Array.isArray(items)) return res.status(400).json({ error: 'Missing items' });
  let data = await readDB('siswa');
  let added = 0;
  items.forEach(item => {
    if (!data.some(d => d.nisn === item.nisn)) {
      data.push({ id: generateId(), ...item });
      added++;
    }
  });
  await writeDB('siswa', data);
  res.json({ added, total: data.length });
});

app.post('/api/auth/login', async (req, res) => {
  const { user, pass } = req.body;
  const auth = await readDB('authUser');
  const saved = auth.length > 0 ? auth[0] : { user: 'admin', pass: 'admin123' };
  if (user === saved.user && pass === saved.pass) {
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Username atau password salah' });
  }
});

app.get('/api', (req, res) => {
  res.json({ status: 'ok', message: 'Aplikasi Absensi SD N 1 Slopuro API' });
});

module.exports = app;
