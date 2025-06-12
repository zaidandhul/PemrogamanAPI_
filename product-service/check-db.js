const db = require('./db');

// Periksa struktur tabel products
db.query('DESCRIBE products', (err, result) => {
  if (err) {
    console.error('Error:', err);
    console.log('Mencoba membuat tabel products...');
    
    // Buat tabel jika belum ada
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;
    
    db.query(createTableQuery, (err, result) => {
      if (err) {
        console.error('Gagal membuat tabel:', err);
      } else {
        console.log('Tabel products berhasil dibuat');
        
        // Tambahkan data contoh
        const sampleData = [
          { name: 'Produk 1', price: 100000 },
          { name: 'Produk 2', price: 150000 },
          { name: 'Produk 3', price: 200000 }
        ];
        
        sampleData.forEach(product => {
          db.query('INSERT INTO products (name, price) VALUES (?, ?)', 
            [product.name, product.price]);
        });
        console.log('Data contoh berhasil ditambahkan');
      }
      process.exit();
    });
  } else {
    console.log('Struktur tabel products:');
    console.table(result);
    
    // Tampilkan data yang ada
    db.query('SELECT * FROM products', (err, products) => {
      if (err) {
        console.error('Gagal mengambil data produk:', err);
      } else {
        console.log('\nData produk yang ada:');
        console.table(products);
      }
      process.exit();
    });
  }
});
