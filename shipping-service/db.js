const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',               // sesuaikan password MySQL kamu
  database: 'microservice_db' // pastikan ini sama
});

db.connect((err) => {
  if (err) {
    console.error('Gagal konek ke MySQL:', err);
    return;
  }
  console.log('Terhubung ke database MySQL');
});

module.exports = db;
