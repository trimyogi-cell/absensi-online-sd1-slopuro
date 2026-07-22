const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const _memStore = {};

function readDB(name) {
  if (!_memStore[name]) _memStore[name] = [];
  return _memStore[name];
}

function writeDB(name, data) {
  _memStore[name] = data;
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

const tables = ['siswa', 'absensi', 'nilai', 'libur', 'gradeSetting', 'pengaturanSekolah', 'authUser'];

tables.forEach(table => {
  app.get(`/api/${table}`, (req, res) => {
    res.json(readDB(table));
  });

  app.get(`/api/${table}/:id`, (req, res) => {
    const data = readDB(table);
    const item = data.find(x => x.id === req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  });

  app.post(`/api/${table}`, (req, res) => {
    const data = readDB(table);
    const newItem = { id: generateId(), ...req.body };
    data.push(newItem);
    writeDB(table, data);
    res.json(newItem);
  });

  app.put(`/api/${table}/:id`, (req, res) => {
    const data = readDB(table);
    const idx = data.findIndex(x => x.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    data[idx] = { ...data[idx], ...req.body };
    writeDB(table, data);
    res.json(data[idx]);
  });

  app.delete(`/api/${table}/:id`, (req, res) => {
    let data = readDB(table);
    data = data.filter(x => x.id !== req.params.id);
    writeDB(table, data);
    res.json({ success: true });
  });

  app.post(`/api/${table}/replace-all`, (req, res) => {
    writeDB(table, req.body);
    res.json({ success: true });
  });
});

app.post('/api/bulk-save', (req, res) => {
  const { table, filterField, filterValue, items } = req.body;
  if (!table || !items) return res.status(400).json({ error: 'Missing table or items' });
  let data = readDB(table);
  if (filterField && filterValue !== undefined) {
    data = data.filter(d => d[filterField] !== filterValue);
  }
  items.forEach(item => {
    data.push({ id: generateId(), ...item });
  });
  writeDB(table, data);
  res.json({ success: true, total: data.length });
});

app.post('/api/bulk-delete', (req, res) => {
  const { table, field, value } = req.body;
  if (!table || !field) return res.status(400).json({ error: 'Missing params' });
  let data = readDB(table);
  data = data.filter(d => d[field] !== value);
  writeDB(table, data);
  res.json({ success: true, total: data.length });
});

app.post('/api/import-siswa', (req, res) => {
  const { items } = req.body;
  if (!items || !Array.isArray(items)) return res.status(400).json({ error: 'Missing items' });
  let data = readDB('siswa');
  let added = 0;
  items.forEach(item => {
    if (!data.some(d => d.nisn === item.nisn)) {
      data.push({ id: generateId(), ...item });
      added++;
    }
  });
  writeDB('siswa', data);
  res.json({ added, total: data.length });
});

app.post('/api/auth/login', (req, res) => {
  const { user, pass } = req.body;
  const auth = readDB('authUser');
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
