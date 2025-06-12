# Authentication Service

Layanan otentikasi untuk microservices yang menangani registrasi, login, dan manajemen sesi pengguna.

## Fitur

- Registrasi pengguna baru dengan hashing password
- Login dengan email dan password
- Manajemen sesi dengan JWT (JSON Web Tokens)
- Proteksi rute dengan middleware autentikasi
- Validasi input

## Persyaratan Sistem

- Node.js (v14 atau lebih baru)
- MySQL (v5.7 atau lebih baru)
- NPM atau Yarn

## Instalasi

1. Clone repositori
2. Masuk ke direktori auth-service
   ```
   cd auth-service
   ```
3. Install dependencies
   ```
   npm install
   ```
4. Buat file `.env` di root direktori dengan konfigurasi berikut:
   ```
   PORT=3003
   JWT_SECRET=your_jwt_secret_key
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=microservice_db
   ```
5. Jalankan skrip SQL yang ada di `database.sql` untuk membuat tabel users
6. Jalankan server
   ```
   npm start
   ```
   Atau untuk mode development dengan auto-reload:
   ```
   npm run dev
   ```

## API Endpoints

### POST /api/auth/register
Mendaftarkan pengguna baru.

**Request Body:**
```json
{
  "name": "Nama Pengguna",
  "email": "user@example.com",
  "password": "password123"
}
```

### POST /api/auth/login
Login pengguna.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### GET /api/auth/me
Mendapatkan informasi pengguna yang sedang login (memerlukan token JWT).

**Headers:**
```
Authorization: Bearer <token>
```

## Keamanan

- Password disimpan dalam bentuk hash menggunakan bcryptjs
- Menggunakan JWT untuk autentikasi
- Validasi input untuk mencegah serangan SQL injection dan XSS
- Menggunakan environment variables untuk data sensitif

## Kontribusi

1. Fork repositori
2. Buat branch untuk fitur baru (`git checkout -b fitur-baru`)
3. Commit perubahan (`git commit -am 'Menambahkan fitur baru'`)
4. Push ke branch (`git push origin fitur-baru`)
5. Buat Pull Request

## Lisensi

MIT
