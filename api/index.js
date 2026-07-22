const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

async function supabaseRequest(method, path, body) {
  const url = `${SUPABASE_URL}/rest/v1/${path}`;
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': method === 'POST' ? 'return=representation' : undefined,
  };
  if (body) headers['Prefer'] = 'return=representation';
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase ${res.status}: ${text}`);
  }
  return res.json();
}

async function readDB(name) {
  try {
    const rows = await supabaseRequest('GET', `data_store?key=eq.${encodeURIComponent(name)}&select=value`);
    if (rows && rows.length > 0) {
      return rows[0].value || [];
    }
    return [];
  } catch (e) {
    console.error('readDB error:', name, e.message);
    return [];
  }
}

async function writeDB(name, data) {
  const clean = JSON.parse(JSON.stringify(data));
  const existing = await supabaseRequest('GET', `data_store?key=eq.${encodeURIComponent(name)}&select=key`);
  if (existing && existing.length > 0) {
    await supabaseRequest('PATCH', `data_store?key=eq.${encodeURIComponent(name)}`, {
      value: clean,
      updated_at: new Date().toISOString(),
    });
  } else {
    await supabaseRequest('POST', 'data_store', {
      key: name,
      value: clean,
      updated_at: new Date().toISOString(),
    });
  }
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

const tables = ['siswa', 'absensi', 'nilai', 'libur', 'gradeSetting', 'pengaturanSekolah', 'authUser'];

tables.forEach(table => {
  app.get(`/api/${table}`, async (req, res) => {
    try {
      const data = await readDB(table);
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get(`/api/${table}/:id`, async (req, res) => {
    try {
      const data = await readDB(table);
      const item = data.find(x => x.id === req.params.id);
      if (!item) return res.status(404).json({ error: 'Not found' });
      res.json(item);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post(`/api/${table}`, async (req, res) => {
    try {
      const data = await readDB(table);
      const newItem = { id: generateId(), ...req.body };
      data.push(newItem);
      await writeDB(table, data);
      res.json(newItem);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put(`/api/${table}/:id`, async (req, res) => {
    try {
      const data = await readDB(table);
      const idx = data.findIndex(x => x.id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'Not found' });
      data[idx] = { ...data[idx], ...req.body };
      await writeDB(table, data);
      res.json(data[idx]);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete(`/api/${table}/:id`, async (req, res) => {
    try {
      let data = await readDB(table);
      data = data.filter(x => x.id !== req.params.id);
      await writeDB(table, data);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post(`/api/${table}/replace-all`, async (req, res) => {
    try {
      await writeDB(table, req.body);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
});

app.post('/api/bulk-save', async (req, res) => {
  try {
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
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/bulk-delete', async (req, res) => {
  try {
    const { table, field, value } = req.body;
    if (!table || !field) return res.status(400).json({ error: 'Missing params' });
    let data = await readDB(table);
    data = data.filter(d => d[field] !== value);
    await writeDB(table, data);
    res.json({ success: true, total: data.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/import-siswa', async (req, res) => {
  try {
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
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { user, pass } = req.body;
    const auth = await readDB('authUser');
    const saved = auth.length > 0 ? auth[0] : { user: 'admin', pass: 'admin123' };
    if (user === saved.user && pass === saved.pass) {
      res.json({ success: true });
    } else {
      res.status(401).json({ error: 'Username atau password salah' });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api', (req, res) => {
  res.json({ status: 'ok', message: 'Aplikasi Absensi SD N 1 Slopuro API', db: 'supabase' });
});

module.exports = app;