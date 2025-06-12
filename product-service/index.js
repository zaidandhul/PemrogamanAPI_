const express = require('express');
const bodyParser = require('body-parser');
const db = require('./db');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// GET semua produk dari database
app.get('/products', (req, res) => {
  const query = 'SELECT * FROM products';
  db.query(query, (err, result) => {
    if (err) {
      console.error('Gagal ambil data produk:', err);
      res.status(500).json({ error: 'Gagal ambil produk' });
    } else {
      // Pastikan description/deskripsi ikut dikirim
      res.json(result.map(product => ({
        ...product,
        deskripsi: product.deskripsi || ''
      })));
    }
  });
});

// POST tambah produk ke database
app.post('/products', (req, res) => {
  console.log('Menerima permintaan tambah produk:', req.body);
  
  const { name, price, description } = req.body;
  
  // Validasi input
  if (!name || typeof name !== 'string' || name.trim() === '') {
    console.error('Validasi gagal: Nama produk tidak valid');
    return res.status(400).json({ error: 'Nama produk tidak valid' });
  }
  
  if (price === undefined || price === null || isNaN(price)) {
    console.error('Validasi gagal: Harga tidak valid');
    return res.status(400).json({ error: 'Harga harus berupa angka' });
  }
  
  const priceNumber = parseFloat(price);
  if (priceNumber < 0) {
    console.error('Validasi gagal: Harga tidak boleh negatif');
    return res.status(400).json({ error: 'Harga tidak boleh negatif' });
  }
  
  console.log('Menambahkan produk ke database:', { name, price: priceNumber, description });
  
  // Cek apakah kolom deskripsi ada di tabel
  db.query(`SHOW COLUMNS FROM products LIKE 'deskripsi'`, (colErr, columns) => {
    if (colErr) {
      console.error('Gagal memeriksa kolom deskripsi:', colErr);
      return res.status(500).json({ error: 'Gagal memeriksa struktur tabel' });
    }
    const hasDeskripsi = columns.length > 0;
    const query = hasDeskripsi 
      ? 'INSERT INTO products (name, price, deskripsi) VALUES (?, ?, ?)' 
      : 'INSERT INTO products (name, price) VALUES (?, ?)';
    const queryParams = hasDeskripsi ? [name, priceNumber, description] : [name, priceNumber];
    db.query(query, queryParams, (err, result) => {
      if (err) {
        console.error('Gagal tambah produk:', err);
        return res.status(500).json({ error: 'Gagal tambah produk' });
      }
      res.status(201).json({ message: 'Produk berhasil ditambahkan', id: result.insertId, name, price: priceNumber, deskripsi: description });
    });
  });
});

      
// GET detail produk
app.get('/products/:id', (req, res) => {
  const productId = req.params.id;
  console.log('Mencari produk dengan ID:', productId);
  
  if (!productId || isNaN(productId)) {
    console.error('ID produk tidak valid:', productId);
    return res.status(400).json({ error: 'ID produk tidak valid' });
  }
  
  // Ambil produk dengan kolom description/deskripsi
  db.query('SELECT * FROM products WHERE id = ?', [productId], (err, result) => {
    if (err) {
      console.error('Gagal mengambil produk:', err);
      return res.status(500).json({ error: 'Gagal mengambil produk' });
    }
    if (result.length === 0) {
      return res.status(404).json({ error: 'Produk tidak ditemukan' });
    }
    const product = result[0];
    res.json({
      ...product,
      deskripsi: product.deskripsi || ''
    });
  });
});

// PUT update produk
app.put('/products/:id', (req, res) => {
  const productId = req.params.id;
  const { name, price, description } = req.body;
  
  if (!name || !price) {
    return res.status(400).json({ error: 'Nama dan harga harus diisi' });
  }
  
  const query = 'UPDATE products SET name = ?, price = ?, deskripsi = ? WHERE id = ?';
  
  db.query(query, [name, price, description, productId], (err, result) => {
    if (err) {
      console.error('Gagal update produk:', err);
      return res.status(500).json({ error: 'Gagal update produk' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Produk tidak ditemukan' });
    }
    
    res.json({ 
      message: 'Produk berhasil diupdate',
      id: productId,
      name,
      price,
      deskripsi: description
    });
  });
});

// DELETE hapus produk
app.delete('/products/:id', (req, res) => {
  const productId = parseInt(req.params.id);
  
  if (isNaN(productId)) {
    return res.status(400).json({ error: 'ID produk tidak valid' });
  }
  
  console.log('Mencoba menghapus produk dengan ID:', productId);
  
  // Cek apakah tabel shipping ada dan memiliki kolom product_id
  db.query(`SHOW TABLES LIKE 'shipping'`, (tableErr, tables) => {
    if (tableErr) {
      console.error('Gagal memeriksa tabel shipping:', tableErr);
      return deleteProduct();
    }
    
    if (tables.length === 0) {
      console.log('Tabel shipping tidak ditemukan, lanjutkan hapus produk');
      return deleteProduct();
    }
    
    // Jika tabel shipping ada, cek kolom product_id
    db.query(`SHOW COLUMNS FROM shipping LIKE 'product_id'`, (colErr, columns) => {
      if (colErr || columns.length === 0) {
        console.log('Kolom product_id tidak ditemukan di tabel shipping, lanjutkan hapus produk');
        return deleteProduct();
      }
      
      // Hapus data shipping yang terkait
      db.query('DELETE FROM shipping WHERE product_id = ?', [productId], (shippingErr, shippingResult) => {
        if (shippingErr) {
          console.error('Gagal hapus data shipping terkait:', shippingErr);
          return res.status(500).json({ 
            error: 'Gagal hapus data shipping terkait',
            details: process.env.NODE_ENV === 'development' ? shippingErr.message : undefined
          });
        }
        
        console.log('Data shipping terkait dihapus:', shippingResult.affectedRows, 'baris');
        deleteProduct();
      });
    });
  });
  
  // Fungsi untuk menghapus produk
  function deleteProduct() {
    db.query('DELETE FROM products WHERE id = ?', [productId], (err, productResult) => {
      if (err) {
        console.error('Gagal hapus produk:', err);
        return res.status(500).json({ 
          error: 'Gagal hapus produk',
          details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
      }
      
      if (productResult.affectedRows === 0) {
        console.log('Produk tidak ditemukan dengan ID:', productId);
        return res.status(404).json({ 
          error: 'Produk tidak ditemukan',
          id: productId 
        });
      }
      
      console.log('Produk berhasil dihapus, ID:', productId);
      res.json({ 
        success: true,
        message: 'Produk berhasil dihapus', 
        id: productId,
        affectedRows: productResult.affectedRows
      });
    });
  }
});

// Tes endpoint /
app.get('/', (req, res) => {
  res.send('Product Service is running');
});

// Jalankan server
app.listen(3001, () => {
  console.log('Product service berjalan di http://localhost:3001/');
});
