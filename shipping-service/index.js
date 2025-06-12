const express = require('express');
const bodyParser = require('body-parser');
const db = require('./db');

const app = express();
app.use(bodyParser.json());

// GET semua pengiriman
app.get('/shipping', (req, res) => {
  const query = 'SELECT * FROM shipping';
  db.query(query, (err, result) => {
    if (err) {
      console.error('Gagal ambil data pengiriman:', err);
      res.status(500).json({ error: 'Gagal ambil data pengiriman' });
    } else {
      // Tambahkan created_at jika tidak ada pada setiap item
      const now = new Date().toISOString();
      const resultWithCreatedAt = result.map(item => ({
        ...item,
        created_at: item.created_at || now
      }));
      res.json(resultWithCreatedAt);
    }
  });
});

// Daftar status pengiriman yang valid
const VALID_STATUSES = ['pending', 'dikirim', 'terkirim'];

// POST tambah pengiriman
app.post('/shipping', (req, res) => {
  const { product_id, address, status = 'pending' } = req.body;
  
  // Validasi status
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ 
      error: 'Status tidak valid', 
      valid_statuses: VALID_STATUSES 
    });
  }
  
  const query = 'INSERT INTO shipping (product_id, address, status) VALUES (?, ?, ?)';
  db.query(query, [product_id, address, status], (err, result) => {
    if (err) {
      console.error('Gagal tambah pengiriman:', err);
      res.status(500).json({ 
        error: 'Gagal tambah pengiriman',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    } else {
      res.status(201).json({ 
        message: 'Pengiriman berhasil ditambahkan', 
        id: result.insertId 
      });
    }
  });
});

// GET detail pengiriman
app.get('/shipping/:id', (req, res) => {
  const shippingId = req.params.id;
  
  if (!shippingId || isNaN(shippingId)) {
    return res.status(400).json({ error: 'ID pengiriman tidak valid' });
  }
  
  const query = 'SELECT * FROM shipping WHERE id = ?';
  
  db.query(query, [shippingId], (err, results) => {
    if (err) {
      console.error('Gagal mengambil detail pengiriman:', err);
      return res.status(500).json({ 
        error: 'Gagal mengambil detail pengiriman',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Data pengiriman tidak ditemukan' });
    }
    
    // Tambahkan created_at jika tidak ada
    const item = results[0];
    if (!item.created_at) {
      item.created_at = new Date().toISOString();
    }
    res.json(item);
  });
});

// PUT update status pengiriman
app.put('/shipping/:id/status', (req, res) => {
  const shippingId = req.params.id;
  const { status } = req.body;
  
  if (!shippingId || isNaN(shippingId)) {
    return res.status(400).json({ error: 'ID pengiriman tidak valid' });
  }
  
  if (!status || !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ 
      error: 'Status tidak valid', 
      valid_statuses: VALID_STATUSES 
    });
  }
  
  const query = 'UPDATE shipping SET status = ? WHERE id = ?';
  
  db.query(query, [status, shippingId], (err, result) => {
    if (err) {
      console.error('Gagal update status pengiriman:', err);
      return res.status(500).json({ 
        error: 'Gagal update status pengiriman',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Data pengiriman tidak ditemukan' });
    }
    
    // Ambil data terbaru untuk dikembalikan
    db.query('SELECT * FROM shipping WHERE id = ?', [shippingId], (err, results) => {
      if (err || results.length === 0) {
        return res.json({ 
          message: 'Status pengiriman berhasil diupdate',
          id: shippingId,
          status: status
        });
      }
      
      // Tambahkan created_at jika tidak ada
      const item = results[0];
      if (!item.created_at) {
        item.created_at = new Date().toISOString();
      }
      res.json({
        message: 'Status pengiriman berhasil diupdate',
        data: item
      });
    });
  });
});

// Tes endpoint /
app.get('/', (req, res) => {
  res.send('Shipping Service is running');
});

// Jalankan service
app.listen(3002, () => {
  console.log('Shipping service berjalan di http://localhost:3002/');
});
