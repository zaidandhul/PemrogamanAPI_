const db = require('./db');

console.log('Memeriksa struktur tabel products...');

// Periksa apakah tabel products ada
db.query(`
  CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_name (name)
  )
`, (err) => {
  if (err) {
    console.error('Gagal membuat/memeriksa tabel products:', {
      code: err.code,
      message: err.message,
      sql: err.sql,
      sqlMessage: err.sqlMessage
    });
    process.exit(1);
  }
  
  console.log('Tabel products sudah siap');
  
  // Periksa isi tabel
  db.query('SELECT * FROM products LIMIT 5', (err, results) => {
    if (err) {
      console.error('Gagal memeriksa isi tabel:', err);
    } else {
      console.log('\nData produk yang ada:');
      console.table(results);
    }
    
    // Tutup koneksi
    db.end();
  });
});
