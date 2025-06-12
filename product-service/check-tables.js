const db = require('./db');

console.log('Memeriksa struktur tabel...');

// Periksa tabel products
db.query(`
  SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'microservice_db' 
  AND TABLE_NAME = 'products'
`, (err, results) => {
  if (err) {
    console.error('Gagal memeriksa struktur tabel:', err);
    process.exit(1);
  }
  
  console.log('\nStruktur tabel products:');
  console.table(results);
  
  // Periksa data contoh
  db.query('SELECT * FROM products LIMIT 5', (err, products) => {
    if (err) {
      console.error('Gagal mengambil data contoh:', err);
      return;
    }
    
    console.log('\nData contoh produk:');
    console.table(products);
    
    // Tutup koneksi
    db.end();
  });
});
