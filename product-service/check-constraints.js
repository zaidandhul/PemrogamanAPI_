const db = require('./db');

// Cek foreign key constraints di database
const checkConstraints = async () => {
  try {
    // Cek foreign key di tabel shipping
    const [shippingConstraints] = await db.promise().query(`
      SELECT 
        TABLE_NAME,
        COLUMN_NAME,
        CONSTRAINT_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM 
        INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE 
        REFERENCED_TABLE_NAME = 'products' AND
        TABLE_SCHEMA = 'microservice_db';
    `);
    
    console.log('Foreign key constraints yang terdeteksi:');
    console.table(shippingConstraints);
    
    // Cek data di tabel shipping yang terkait dengan produk
    const [shippingData] = await db.promise().query(`
      SELECT * FROM shipping WHERE product_id IS NOT NULL;
    `);
    
    console.log('\nData shipping yang terkait dengan produk:');
    console.table(shippingData);
    
  } catch (error) {
    console.error('Error checking constraints:', error);
  } finally {
    process.exit();
  }
};

checkConstraints();
