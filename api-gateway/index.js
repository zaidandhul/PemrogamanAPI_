const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const axios = require('axios');
const session = require('express-session');
const flash = require('connect-flash');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();

// Middleware untuk parsing JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware untuk session
app.use(session({
  secret: 'rahasia-saya',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set true jika menggunakan HTTPS
}));

// Middleware untuk flash messages
app.use(flash());

// Middleware untuk menyediakan flash messages ke semua view
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});

// Konfigurasi API URL
const PRODUCTS_API = 'http://localhost:3001';
const SHIPPING_API = 'http://localhost:3002';
const AUTH_API = 'http://localhost:3003';

// Middleware untuk logging (opsional tapi berguna saat debugging)
app.use((req, res, next) => {
  console.log(`[API Gateway] ${req.method} ${req.url}`);
  next();
});

// Proxy API untuk Product Service
app.use('/api/products', createProxyMiddleware({
  target: PRODUCTS_API,
  changeOrigin: true,
  pathRewrite: { '^/api': '' } // Menghapus /api dari URL
}));

// Proxy API untuk Auth Service
app.use('/api/auth', createProxyMiddleware({
  target: AUTH_API,
  changeOrigin: true,
  pathRewrite: { '^/api': '' } // Menghapus /api dari URL
}));

// Middleware untuk memeriksa autentikasi
const isAuthenticated = (req, res, next) => {
  const token = req.session.token;
  
  if (!token) {
    req.flash('error_msg', 'Silakan login terlebih dahulu');
    return res.redirect('/login');
  }

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    req.user = decoded;
    next();
  } catch (err) {
    req.flash('error_msg', 'Sesi telah berakhir, silakan login kembali');
    res.redirect('/login');
  }
};

// Route untuk halaman login
app.get('/login', (req, res) => {
  if (req.session.token) {
    return res.redirect('/');
  }
  const errorMsg = req.flash('error_msg').map(msg => 
    `<div class="alert alert-danger alert-dismissible fade show" role="alert">
      ${msg}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>`
  ).join('');

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Login - Microservice App</title>
      <!-- Bootstrap 5 CSS -->
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
      <!-- Font Awesome -->
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
      <style>
        :root {
          --primary-color: #4361ee;
          --secondary-color: #3f37c9;
          --light-color: #f8f9fa;
          --dark-color: #212529;
        }
        body {
          background-color: #f5f7fb;
          min-height: 100vh;
          display: flex;
          align-items: center;
        }
        .auth-container {
          max-width: 400px;
          width: 100%;
          margin: 0 auto;
          padding: 2rem;
          background: white;
          border-radius: 1rem;
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.1);
        }
        .auth-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        .auth-header h2 {
          color: var(--primary-color);
          font-weight: 700;
          margin-bottom: 0.5rem;
        }
        .auth-header p {
          color: #6c757d;
          margin-bottom: 0;
        }
        .form-control:focus {
          border-color: var(--primary-color);
          box-shadow: 0 0 0 0.25rem rgba(67, 97, 238, 0.25);
        }
        .btn-primary {
          background-color: var(--primary-color);
          border: none;
          padding: 0.6rem 1.5rem;
          font-weight: 500;
          transition: all 0.3s ease;
        }
        .btn-primary:hover {
          background-color: var(--secondary-color);
          transform: translateY(-1px);
        }
        .auth-footer {
          text-align: center;
          margin-top: 1.5rem;
          color: #6c757d;
        }
        .auth-footer a {
          color: var(--primary-color);
          text-decoration: none;
          font-weight: 500;
        }
        .auth-footer a:hover {
          text-decoration: underline;
        }
        .form-floating > label {
          padding: 1rem 0.75rem;
        }
        .form-floating > .form-control:focus ~ label,
        .form-floating > .form-control:not(:placeholder-shown) ~ label {
          transform: scale(0.85) translateY(-0.5rem) translateX(0.15rem);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="row justify-content-center">
          <div class="col-md-8 col-lg-6">
            <div class="auth-container">
              <div class="auth-header">
                <h2>Welcome Back</h2>
                <p>Sign in to continue to your account</p>
              </div>
              ${errorMsg}
              <form action="/login" method="POST" class="needs-validation" novalidate>
                <div class="mb-3 form-check">
                  <input type="checkbox" class="form-check-input" id="rememberMe" name="rememberMe">
                  <label class="form-check-label" for="rememberMe">Remember Me</label>
                </div>
                <div class="mb-3">
                  <div class="form-floating">
                    <input type="email" class="form-control" id="email" name="email" placeholder="name@example.com" required>
                    <label for="email">Email address</label>
                    <div class="invalid-feedback">
                      Please enter a valid email address.
                    </div>
                  </div>
                </div>
                <div class="mb-4">
                  <div class="form-floating">
                    <input type="password" class="form-control" id="password" name="password" placeholder="Password" required>
                    <label for="password">Password</label>
                    <div class="invalid-feedback">
                      Please enter your password.
                    </div>
                  </div>
                </div>
                <div class="d-grid gap-2">
                  <button type="submit" class="btn btn-primary btn-lg">
                    <i class="fas fa-sign-in-alt me-2"></i>Sign In
                  </button>
                </div>
              </form>
              <div class="auth-footer mt-4">
                <p class="mb-0">Don't have an account? <a href="/register">Create an account</a></p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bootstrap JS Bundle with Popper -->
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
      <script>
        // Form validation
        (function () {
          'use strict'
          var forms = document.querySelectorAll('.needs-validation')
          Array.prototype.slice.call(forms).forEach(function (form) {
            form.addEventListener('submit', function (event) {
              if (!form.checkValidity()) {
                event.preventDefault()
                event.stopPropagation()
              }
              form.classList.add('was-validated')
            }, false)
          })
        })()
      </script>
    </body>
    </html>
  `);
});

// Route untuk halaman register
app.get('/register', (req, res) => {
  if (req.session.token) {
    return res.redirect('/');
  }
  const errorMsg = req.flash('error_msg').map(msg => 
    `<div class="alert alert-danger alert-dismissible fade show" role="alert">
      ${msg}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>`
  ).join('');

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Register - Microservice App</title>
      <!-- Bootstrap 5 CSS -->
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
      <!-- Font Awesome -->
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
      <style>
        :root {
          --primary-color: #4361ee;
          --secondary-color: #3f37c9;
          --light-color: #f8f9fa;
          --dark-color: #212529;
        }
        body {
          background-color: #f5f7fb;
          min-height: 100vh;
          display: flex;
          align-items: center;
        }
        .auth-container {
          max-width: 500px;
          width: 100%;
          margin: 0 auto;
          padding: 2rem;
          background: white;
          border-radius: 1rem;
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.1);
        }
        .auth-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        .auth-header h2 {
          color: var(--primary-color);
          font-weight: 700;
          margin-bottom: 0.5rem;
        }
        .auth-header p {
          color: #6c757d;
          margin-bottom: 0;
        }
        .form-control:focus {
          border-color: var(--primary-color);
          box-shadow: 0 0 0 0.25rem rgba(67, 97, 238, 0.25);
        }
        .btn-primary {
          background-color: var(--primary-color);
          border: none;
          padding: 0.6rem 1.5rem;
          font-weight: 500;
          transition: all 0.3s ease;
        }
        .btn-primary:hover {
          background-color: var(--secondary-color);
          transform: translateY(-1px);
        }
        .auth-footer {
          text-align: center;
          margin-top: 1.5rem;
          color: #6c757d;
        }
        .auth-footer a {
          color: var(--primary-color);
          text-decoration: none;
          font-weight: 500;
        }
        .auth-footer a:hover {
          text-decoration: underline;
        }
        .form-floating > label {
          padding: 1rem 0.75rem;
        }
        .form-floating > .form-control:focus ~ label,
        .form-floating > .form-control:not(:placeholder-shown) ~ label {
          transform: scale(0.85) translateY(-0.5rem) translateX(0.15rem);
        }
        .password-strength {
          height: 4px;
          background-color: #e9ecef;
          margin-top: 0.5rem;
          border-radius: 2px;
          overflow: hidden;
        }
        .strength-0 { width: 0%; background-color: #dc3545; }
        .strength-1 { width: 25%; background-color: #ff6b6b; }
        .strength-2 { width: 50%; background-color: #ffd166; }
        .strength-3 { width: 75%; background-color: #51cf66; }
        .strength-4 { width: 100%; background-color: #20c997; }
        .password-requirements {
          font-size: 0.875rem;
          color: #6c757d;
          margin-top: 0.5rem;
        }
        .requirement {
          display: flex;
          align-items: center;
          margin-bottom: 0.25rem;
        }
        .requirement i {
          margin-right: 0.5rem;
          font-size: 0.75rem;
        }
        .requirement.valid {
          color: #20c997;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="row justify-content-center">
          <div class="col-md-10 col-lg-8">
            <div class="auth-container">
              <div class="auth-header">
                <h2>Create an Account</h2>
                <p>Join us today and start your journey</p>
              </div>
              ${errorMsg}
              <form id="registerForm" action="/register" method="POST" class="needs-validation" novalidate>
                <div class="row g-3">
                  <div class="col-md-6">
                    <div class="form-floating mb-3">
                      <input type="text" class="form-control" id="name" name="name" placeholder="John Doe" required>
                      <label for="name">Full Name</label>
                      <div class="invalid-feedback">
                        Please enter your full name.
                      </div>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="form-floating mb-3">
                      <input type="email" class="form-control" id="email" name="email" placeholder="name@example.com" required>
                      <label for="email">Email Address</label>
                      <div class="invalid-feedback">
                        Please enter a valid email address.
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="mb-3">
                  <div class="form-floating">
                    <input type="password" class="form-control" id="password" name="password" placeholder="Password" required
                      pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$">
                    <label for="password">Password</label>
                    <div class="invalid-feedback">
                      Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.
                    </div>
                  </div>
                  <div class="password-strength mt-2" id="passwordStrength"></div>
                  <div class="password-requirements">
                    <p class="mb-1">Password must contain:</p>
                    <div class="requirement" id="reqLength">
                      <i class="fas fa-circle"></i>
                      <span>At least 8 characters</span>
                    </div>
                    <div class="requirement" id="reqUppercase">
                      <i class="fas fa-circle"></i>
                      <span>At least one uppercase letter</span>
                    </div>
                    <div class="requirement" id="reqLowercase">
                      <i class="fas fa-circle"></i>
                      <span>At least one lowercase letter</span>
                    </div>
                    <div class="requirement" id="reqNumber">
                      <i class="fas fa-circle"></i>
                      <span>At least one number</span>
                    </div>
                    <div class="requirement" id="reqSpecial">
                      <i class="fas fa-circle"></i>
                      <span>At least one special character</span>
                    </div>
                  </div>
                </div>

                <div class="mb-4">
                  <div class="form-floating">
                    <input type="password" class="form-control" id="password2" name="password2" placeholder="Confirm Password" required>
                    <label for="password2">Confirm Password</label>
                    <div class="invalid-feedback" id="passwordMismatch">
                      Passwords do not match.
                    </div>
                  </div>
                </div>

                <div class="d-grid gap-2">
                  <button type="submit" class="btn btn-primary btn-lg">
                    <i class="fas fa-user-plus me-2"></i>Create Account
                  </button>
                </div>
              </form>
              <div class="auth-footer mt-4">
                <p class="mb-0">Already have an account? <a href="/login">Sign in</a></p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bootstrap JS Bundle with Popper -->
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
      <script>
        // Form validation
        (function () {
          'use strict'
          var forms = document.querySelectorAll('.needs-validation')
          Array.prototype.slice.call(forms).forEach(function (form) {
            form.addEventListener('submit', function (event) {
              if (!form.checkValidity()) {
                event.preventDefault()
                event.stopPropagation()
              }
              form.classList.add('was-validated')
            }, false)
          })
        })()

        // Password strength checker
        const passwordInput = document.getElementById('password');
        const passwordStrength = document.getElementById('passwordStrength');
        const requirements = {
          length: document.getElementById('reqLength'),
          uppercase: document.getElementById('reqUppercase'),
          lowercase: document.getElementById('reqLowercase'),
          number: document.getElementById('reqNumber'),
          special: document.getElementById('reqSpecial')
        };

        passwordInput.addEventListener('input', function() {
          const password = this.value;
          let strength = 0;
          
          // Check length
          if (password.length >= 8) {
            requirements.length.classList.add('valid');
            requirements.length.querySelector('i').className = 'fas fa-check-circle';
            strength++;
          } else {
            requirements.length.classList.remove('valid');
            requirements.length.querySelector('i').className = 'fas fa-circle';
          }
          
          // Check uppercase
          if (/[A-Z]/.test(password)) {
            requirements.uppercase.classList.add('valid');
            requirements.uppercase.querySelector('i').className = 'fas fa-check-circle';
            strength++;
          } else {
            requirements.uppercase.classList.remove('valid');
            requirements.uppercase.querySelector('i').className = 'fas fa-circle';
          }
          
          // Check lowercase
          if (/[a-z]/.test(password)) {
            requirements.lowercase.classList.add('valid');
            requirements.lowercase.querySelector('i').className = 'fas fa-check-circle';
            strength++;
          } else {
            requirements.lowercase.classList.remove('valid');
            requirements.lowercase.querySelector('i').className = 'fas fa-circle';
          }
          
          // Check number
          if (/\d/.test(password)) {
            requirements.number.classList.add('valid');
            requirements.number.querySelector('i').className = 'fas fa-check-circle';
            strength++;
          } else {
            requirements.number.classList.remove('valid');
            requirements.number.querySelector('i').className = 'fas fa-circle';
          }
          
          // Check special character
          if (/[^A-Za-z0-9]/.test(password)) {
            requirements.special.classList.add('valid');
            requirements.special.querySelector('i').className = 'fas fa-check-circle';
            strength++;
          } else {
            requirements.special.classList.remove('valid');
            requirements.special.querySelector('i').className = 'fas fa-circle';
          }
          
          // Update strength meter
          passwordStrength.className = 'password-strength mt-2 strength-' + (strength - 1);
          
          // Check if passwords match
          const password2 = document.getElementById('password2').value;
          if (password2) {
            validatePasswords();
          }
        });
        
        // Confirm password validation
        document.getElementById('password2').addEventListener('input', validatePasswords);
        
        function validatePasswords() {
          const password = document.getElementById('password').value;
          const password2 = document.getElementById('password2').value;
          const form = document.getElementById('registerForm');
          
          if (password !== password2) {
            document.getElementById('password2').setCustomValidity('Passwords do not match');
            document.getElementById('passwordMismatch').style.display = 'block';
          } else {
            document.getElementById('password2').setCustomValidity('');
            document.getElementById('passwordMismatch').style.display = 'none';
          }
        }
      </script>
    </body>
    </html>
  `);
});

// Handle login form submission
app.post('/login', async (req, res) => {
  // Catat aktivitas login
  if (!req.session.activities) req.session.activities = [];
  req.session.activities.unshift({
    type: 'login',
    desc: 'Login ke sistem',
    time: new Date().toLocaleString('id-ID')
  });
  req.session.activities = req.session.activities.slice(0, 20);
  try {
    const { email, password, rememberMe } = req.body;
    
    const response = await axios.post(`${AUTH_API}/api/auth/login`, {
      email,
      password
    });
    
    // Set session
    req.session.token = response.data.token;
    req.session.user = response.data.user;
    
    res.redirect('/');
  } catch (error) {
    console.error('Login error:', error.response?.data || error.message);
    req.flash('error_msg', error.response?.data?.message || 'Login gagal');
    res.redirect('/login');
  }
});

// Handle register form submission
app.post('/register', async (req, res) => {
  try {
    const { name, email, password, password2 } = req.body;
    
    if (password !== password2) {
      req.flash('error_msg', 'Password tidak cocok');
      return res.redirect('/register');
    }
    
    const response = await axios.post(`${AUTH_API}/api/auth/register`, {
      name,
      email,
      password
    });
    
    // Set session
    req.session.token = response.data.token;
    req.session.user = response.data.user;
    
    res.redirect('/');
  } catch (error) {
    console.error('Register error:', error.response?.data || error.message);
    req.flash('error_msg', error.response?.data?.message || 'Registrasi gagal');
    res.redirect('/register');
  }
});

// Logout
app.get('/logout', (req, res) => {
  // Catat aktivitas logout
  if (!req.session.activities) req.session.activities = [];
  req.session.activities.unshift({
    type: 'logout',
    desc: 'Logout dari sistem',
    time: new Date().toLocaleString('id-ID')
  });
  req.session.activities = req.session.activities.slice(0, 20);
  req.session.destroy();
  res.redirect('/login');
});

// Proxy API untuk Shipping Service
app.use('/api/shipping', isAuthenticated, createProxyMiddleware({
  target: SHIPPING_API,
  changeOrigin: true,
  pathRewrite: { '^/api': '' } // Menghapus /api dari URL
}));

// Fungsi untuk mengambil data dari API
async function fetchData(apiUrl) {
  try {
    const response = await axios.get(apiUrl);
    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error.message);
    return [];
  }
}

// Menampilkan form tambah produk
// Route untuk menampilkan form tambah produk
app.get('/products/add', isAuthenticated, (req, res) => {
  const user = req.session.user || {};
  const userName = user.name || 'User';
  const userInitial = userName.charAt(0).toUpperCase();

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Add Product - Microservice App</title>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
      <style>
        :root {
          --primary: #4361ee;
          --primary-light: rgba(67, 97, 238, 0.1);
          --secondary: #6c757d;
          --success: #28a745;
          --info: #17a2b8;
          --warning: #ffc107;
          --danger: #dc3545;
          --light: #f8f9fa;
          --dark: #343a40;
          --gray: #6c757d;
          --gray-light: #e9ecef;
          --white: #ffffff;
          --sidebar-width: 250px;
        }
        body { background-color: #f5f7fb; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        .sidebar { position: fixed; top: 0; left: 0; bottom: 0; width: var(--sidebar-width); background: var(--white); box-shadow: 0 0 20px rgba(0,0,0,0.05); z-index: 1000; padding: 1.5rem 0; overflow-y: auto; }
        .sidebar-brand { padding: 0 1.5rem 1.5rem; margin-bottom: 1rem; border-bottom: 1px solid var(--gray-light); }
        .sidebar-brand a { display: flex; align-items: center; color: var(--primary); font-size: 1.5rem; font-weight: 700; text-decoration: none; }
        .sidebar-brand i { margin-right: 0.75rem; font-size: 1.75rem; }
        .sidebar-menu { padding: 0 1rem; }
        .menu-title { color: var(--gray); font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.5rem 1rem; margin: 1.5rem 0 0.5rem; }
        .menu-item { margin-bottom: 0.25rem; }
        .menu-link { display: flex; align-items: center; padding: 0.75rem 1rem; color: var(--gray); text-decoration: none; border-radius: 0.5rem; transition: all 0.2s; }
        .menu-link:hover, .menu-link.active { background-color: var(--primary-light); color: var(--primary); }
        .menu-link i { width: 1.5rem; margin-right: 0.75rem; text-align: center; font-size: 1.1rem; }
        .main-content { margin-left: var(--sidebar-width); padding: 2rem; min-height: 100vh; }
        .top-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid var(--gray-light); }
        .page-title { font-size: 1.75rem; font-weight: 600; margin: 0; color: var(--dark); }
        .btn-primary { background-color: var(--primary); border: none; padding: 0.5rem 1.25rem; font-weight: 500; }
        .btn-primary:hover { background-color: #3a56d4; transform: translateY(-1px); }
        .btn-sm { padding: 0.25rem 0.5rem; font-size: 0.75rem; }
        .card { border-radius: 0.75rem; box-shadow: 0 0.125rem 0.25rem rgba(0,0,0,0.05); }
        .form-control, .form-select { padding: 0.75rem 1rem; border-radius: 0.5rem; border: 1px solid #e2e8f0; font-size: 0.9375rem; }
        .form-control:focus, .form-select:focus { border-color: var(--primary); box-shadow: 0 0 0 0.25rem rgba(67,97,238,0.25); }
        .form-label { font-weight: 500; margin-bottom: 0.5rem; color: #4a5568; }
        @media (max-width: 992px) { .sidebar { transform: translateX(-100%); } .sidebar.show { transform: translateX(0); } .main-content { margin-left: 0; } .top-bar { flex-direction: column; align-items: flex-start; } }
      </style>
    </head>
    <body>
      <!-- Sidebar -->
      <div class="sidebar">
        <div class="sidebar-brand">
          <a href="/">
            <i class="fas fa-boxes"></i>
            <span>Microservice</span>
          </a>
        </div>
        <div class="sidebar-menu">
          <div class="menu-title">MAIN</div>
          <div class="menu-item">
            <a href="/" class="menu-link">
              <i class="fas fa-home"></i>
              <span>Dashboard</span>
            </a>
          </div>
          <div class="menu-item">
            <a href="/products" class="menu-link active">
              <i class="fas fa-box"></i>
              <span>Products</span>
            </a>
          </div>
          <div class="menu-item">
            <a href="/shipping" class="menu-link">
              <i class="fas fa-truck"></i>
              <span>Shipping</span>
            </a>
          </div>
          <div class="menu-title">ACCOUNT</div>
          <div class="menu-item">
            <a href="/profile" class="menu-link">
              <i class="fas fa-user"></i>
              <span>Profile</span>
            </a>
          </div>
          <div class="menu-item">
            <a href="/settings" class="menu-link">
              <i class="fas fa-cog"></i>
              <span>Settings</span>
            </a>
          </div>
          <div class="menu-item">
            <a href="/logout" class="menu-link text-danger">
              <i class="fas fa-sign-out-alt"></i>
              <span>Logout</span>
            </a>
          </div>
        </div>
      </div>
      <!-- Main Content -->
      <div class="main-content">
        <!-- Top Bar -->
        <div class="top-bar">
          <div>
            <h1 class="page-title">Add New Product</h1>
            <p class="text-muted mb-0">Add a new product to your inventory</p>
          </div>
          <div class="d-flex align-items-center">
            <a href="/products" class="btn btn-outline-secondary me-2">
              <i class="fas fa-arrow-left"></i> Back
            </a>
          </div>
        </div>
        <!-- Product Form -->
        <div class="card">
          <div class="card-body">
            <form action="/products" method="POST">
              <div class="row mb-3">
                <div class="col-md-6">
                  <label for="name" class="form-label">Product Name</label>
                  <input type="text" class="form-control" id="name" name="name" required>
                </div>
                <div class="col-md-6">
                  <label for="price" class="form-label">Price</label>
                  <div class="input-group">
                    <span class="input-group-text">Rp</span>
                    <input type="number" class="form-control" id="price" name="price" step="0.01" min="0" required>
                  </div>
                </div>
              </div>
              <div class="row mb-3">
                <div class="col-12">
                  <label for="description" class="form-label">Description</label>
                  <textarea class="form-control" id="description" name="description" rows="3"></textarea>
                </div>
              </div>
              <div class="d-flex justify-content-end">
                <button type="submit" class="btn btn-primary">
                  <i class="fas fa-save"></i> Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    </body>
    </html>
  `;
  
  res.send(html);
});

// Route untuk menampilkan form edit produk
app.get('/products/edit/:id', isAuthenticated, async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await fetchData(`${PRODUCTS_API}/products/${productId}`);
    const user = req.session.user || {};
    const userName = user.name || 'User';
    const userInitial = userName.charAt(0).toUpperCase();

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Edit Product - Microservice App</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <style>
          :root {
            --primary: #4361ee;
            --primary-light: rgba(67, 97, 238, 0.1);
            --secondary: #6c757d;
            --success: #28a745;
            --info: #17a2b8;
            --warning: #ffc107;
            --danger: #dc3545;
            --light: #f8f9fa;
            --dark: #343a40;
            --gray: #6c757d;
            --gray-light: #e9ecef;
            --white: #ffffff;
            --sidebar-width: 250px;
          }
          body { background-color: #f5f7fb; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
          .sidebar { position: fixed; top: 0; left: 0; bottom: 0; width: var(--sidebar-width); background: var(--white); box-shadow: 0 0 20px rgba(0,0,0,0.05); z-index: 1000; padding: 1.5rem 0; overflow-y: auto; }
          .sidebar-brand { padding: 0 1.5rem 1.5rem; margin-bottom: 1rem; border-bottom: 1px solid var(--gray-light); }
          .sidebar-brand a { display: flex; align-items: center; color: var(--primary); font-size: 1.5rem; font-weight: 700; text-decoration: none; }
          .sidebar-brand i { margin-right: 0.75rem; font-size: 1.75rem; }
          .sidebar-menu { padding: 0 1rem; }
          .menu-title { color: var(--gray); font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.5rem 1rem; margin: 1.5rem 0 0.5rem; }
          .menu-item { margin-bottom: 0.25rem; }
          .menu-link { display: flex; align-items: center; padding: 0.75rem 1rem; color: var(--gray); text-decoration: none; border-radius: 0.5rem; transition: all 0.2s; }
          .menu-link:hover, .menu-link.active { background-color: var(--primary-light); color: var(--primary); }
          .menu-link i { width: 1.5rem; margin-right: 0.75rem; text-align: center; font-size: 1.1rem; }
          .main-content { margin-left: var(--sidebar-width); padding: 2rem; min-height: 100vh; }
          .top-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid var(--gray-light); }
          .page-title { font-size: 1.75rem; font-weight: 600; margin: 0; color: var(--dark); }
          .btn-primary { background-color: var(--primary); border: none; padding: 0.5rem 1.25rem; font-weight: 500; }
          .btn-primary:hover { background-color: #3a56d4; transform: translateY(-1px); }
          .btn-sm { padding: 0.25rem 0.5rem; font-size: 0.75rem; }
          .card { border-radius: 0.75rem; box-shadow: 0 0.125rem 0.25rem rgba(0,0,0,0.05); }
          .form-control, .form-select { padding: 0.75rem 1rem; border-radius: 0.5rem; border: 1px solid #e2e8f0; font-size: 0.9375rem; }
          .form-control:focus, .form-select:focus { border-color: var(--primary); box-shadow: 0 0 0 0.25rem rgba(67,97,238,0.25); }
          .form-label { font-weight: 500; margin-bottom: 0.5rem; color: #4a5568; }
          @media (max-width: 992px) { .sidebar { transform: translateX(-100%); } .sidebar.show { transform: translateX(0); } .main-content { margin-left: 0; } .top-bar { flex-direction: column; align-items: flex-start; } }
        </style>
      </head>
      <body>
        <!-- Sidebar -->
        <div class="sidebar">
          <div class="sidebar-brand">
            <a href="/">
              <i class="fas fa-boxes"></i>
              <span>Microservice</span>
            </a>
          </div>
          <div class="sidebar-menu">
            <div class="menu-title">MAIN</div>
            <div class="menu-item">
              <a href="/" class="menu-link">
                <i class="fas fa-home"></i>
                <span>Dashboard</span>
              </a>
            </div>
            <div class="menu-item">
              <a href="/products" class="menu-link active">
                <i class="fas fa-box"></i>
                <span>Products</span>
              </a>
            </div>
            <div class="menu-item">
              <a href="/shipping" class="menu-link">
                <i class="fas fa-truck"></i>
                <span>Shipping</span>
              </a>
            </div>
            <div class="menu-title">ACCOUNT</div>
            <div class="menu-item">
              <a href="/profile" class="menu-link">
                <i class="fas fa-user"></i>
                <span>Profile</span>
              </a>
            </div>
            <div class="menu-item">
              <a href="/settings" class="menu-link">
                <i class="fas fa-cog"></i>
                <span>Settings</span>
              </a>
            </div>
            <div class="menu-item">
              <a href="/logout" class="menu-link text-danger">
                <i class="fas fa-sign-out-alt"></i>
                <span>Logout</span>
              </a>
            </div>
          </div>
        </div>
        <!-- Main Content -->
        <div class="main-content">
          <!-- Top Bar -->
          <div class="top-bar">
            <div>
              <h1 class="page-title">Edit Product</h1>
              <p class="text-muted mb-0">Update product details</p>
            </div>
            <div class="d-flex align-items-center">
              <a href="/products" class="btn btn-outline-secondary me-2">
                <i class="fas fa-arrow-left"></i> Back
              </a>
            </div>
          </div>
          <!-- Product Form -->
          <div class="card">
            <div class="card-body">
              <form action="/products/update/${product.id}" method="POST">
                <div class="row mb-3">
                  <div class="col-md-6">
                    <label for="name" class="form-label">Product Name</label>
                    <input type="text" class="form-control" id="name" name="name" value="${product.name}" required>
                  </div>
                  <div class="col-md-6">
                    <label for="price" class="form-label">Price</label>
                    <div class="input-group">
                      <span class="input-group-text">Rp</span>
                      <input type="number" class="form-control" id="price" name="price" step="0.01" min="0" value="${product.price}" required>
                    </div>
                  </div>
                </div>
                <div class="row mb-3">
                  <div class="col-12">
                    <label for="description" class="form-label">Description</label>
                    <textarea class="form-control" id="description" name="description" rows="3">${product.description || ''}</textarea>
                  </div>
                </div>
                <div class="d-flex justify-content-between">
                  <button type="button" class="btn btn-outline-danger" onclick="if(confirm('Are you sure you want to delete this product?')) { document.getElementById('deleteForm').submit(); }">
                    <i class="fas fa-trash"></i> Delete
                  </button>
                  <button type="submit" class="btn btn-primary">
                    <i class="fas fa-save"></i> Update Product
                  </button>
                </div>
              </form>
              
              <!-- Hidden delete form -->
              <form id="deleteForm" action="/products/delete/${product.id}" method="POST" style="display: none;"></form>
            </div>
          </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
      </body>
      </html>
    `;
    
    res.send(html);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.redirect('/products?message=Error loading product');
  }
});

// Menampilkan detail produk
app.get('/products/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    console.log('Mengambil detail produk ID:', productId);
    
    if (!productId || isNaN(productId)) {
      console.error('ID produk tidak valid');
      return res.status(400).send('ID produk tidak valid');
    }
    
    // Ambil data produk
    let product;
    try {
      console.log('Mengambil data dari:', `${PRODUCTS_API}/products/${productId}`);
      const response = await axios.get(`${PRODUCTS_API}/products/${productId}`, {
        timeout: 5000 // Timeout 5 detik
      });
      
      product = response.data;
      console.log('Data produk yang diterima:', JSON.stringify(product, null, 2));
      
      if (!product) {
        console.error('Data produk kosong');
        return res.status(404).send('Produk tidak ditemukan');
      }
      
      // Pastikan data yang diperlukan ada
      if (product.error) {
        console.error('Error dari service:', product.error);
        return res.status(404).send(product.error);
      }
      
      // Pastikan minimal ada ID
      if (!product.id) {
        console.error('Format data produk tidak valid:', product);
        return res.status(500).send('Format data produk tidak valid');
      }
      
    } catch (error) {
      console.error('Gagal mengambil detail produk:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      let errorMessage = 'Gagal mengambil detail produk';
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = 'Produk tidak ditemukan';
        } else if (error.response.data?.error) {
          errorMessage = error.response.data.error;
        }
      }
      
      return res.status(error.response?.status || 500).send(errorMessage);
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Detail Produk</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
          .container { max-width: 800px; margin: 0 auto; }
          .product-detail { 
            background: #f9f9f9; 
            padding: 20px; 
            border-radius: 8px; 
            margin-top: 20px;
          }
          .btn { 
            display: inline-block; 
            padding: 8px 16px; 
            margin: 5px; 
            text-decoration: none; 
            border-radius: 4px; 
            font-weight: bold;
          }
          .btn-primary { background-color: #3498db; color: white; }
          .btn-secondary { background-color: #7f8c8d; color: white; }
          .btn-danger { background-color: #e74c3c; color: white; }
          .actions { margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>📋 Detail Produk</h1>
          <a href="/products" class="btn btn-secondary">Kembali ke Daftar</a>
          
          <div class="product-detail">
            <h2 style="color: #2c3e50; margin-top: 0;">${product.name || 'Tidak ada nama'}</h2>
            
            <div style="margin-bottom: 20px;">
              <p style="margin: 10px 0;"><strong style="display: inline-block; width: 120px;">ID:</strong> ${product.id || '-'}</p>
              <p style="margin: 10px 0;"><strong style="display: inline-block; width: 120px;">Harga:</strong> Rp ${(product.price ? Number(product.price).toLocaleString('id-ID') : '0')}</p>
              <p style="margin: 10px 0;"><strong style="display: inline-block; width: 120px;">Dibuat pada:</strong> ${product.created_at ? new Date(product.created_at).toLocaleString('id-ID') : 'Tidak diketahui'}</p>
            </div>
            
            <div class="actions" style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; display: flex; gap: 10px;">
              <a href="/products" class="btn" style="background-color: #7f8c8d; color: white; text-decoration: none; padding: 8px 16px; border-radius: 4px; border: none; cursor: pointer; font-size: 14px; font-weight: 500; transition: background-color 0.2s;">
                Kembali
              </a>
              <a href="/products/edit/${product.id}" class="btn" style="background-color: #3498db; color: white; text-decoration: none; padding: 8px 16px; border-radius: 4px; border: none; cursor: pointer; font-size: 14px; font-weight: 500; transition: background-color 0.2s;">
                Edit
              </a>
              <form action="/products/delete/${product.id}" method="POST" style="margin: 0;">
                <button type="submit" 
                        style="background-color: #e74c3c; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 14px; font-weight: 500; transition: background-color 0.2s;"
                        onmouseover="this.style.opacity='0.9'"
                        onmouseout="this.style.opacity='1'"
                        onclick="return confirm('Yakin ingin menghapus produk ini?')">
                  Hapus
                </button>
              </form>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
    res.send(html);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Terjadi kesalahan saat memuat detail produk');
  }
});

// Menampilkan form edit produk
app.get('/products/edit/:id', async (req, res) => {
  try {
    const product = await fetchData(`${PRODUCTS_API}/products/${req.params.id}`);
    
    if (!product || product.error) {
      return res.status(404).send('Produk tidak ditemukan');
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Edit Produk</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            line-height: 1.6; 
            background-color: #f5f5f5;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
          }
          .card {
            background: #fff;
            border-radius: 8px;
            padding: 25px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-top: 20px;
          }
          h1 { 
            color: #2c3e50; 
            margin-top: 0;
          }
          .form-group { 
            margin-bottom: 20px; 
          }
          label { 
            display: block; 
            margin-bottom: 8px; 
            font-weight: bold;
            color: #555;
          }
          input[type="text"], 
          input[type="number"] {
            width: 100%;
            padding: 10px;
            margin-bottom: 5px;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-sizing: border-box;
            font-size: 16px;
          }
          input[type="text"]:focus, 
          input[type="number"]:focus {
            border-color: #3498db;
            outline: none;
            box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
          }
          .btn { 
            display: inline-block; 
            padding: 10px 20px; 
            margin-right: 10px;
            text-decoration: none; 
            border-radius: 4px; 
            font-weight: bold;
            font-size: 14px;
            border: none;
            cursor: pointer;
            transition: background-color 0.2s;
          }
          .btn:hover {
            opacity: 0.9;
          }
          .btn-primary { 
            background-color: #3498db; 
            color: white; 
          }
          .btn-secondary { 
            background-color: #7f8c8d; 
            color: white; 
          }
          .btn-cancel {
            background-color: #e74c3c;
            color: white;
          }
          .form-actions {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            display: flex;
            justify-content: flex-end;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>✏️ Edit Produk</h1>
          
          <div class="card">
            <form action="/products/update/${product.id}" method="POST">
              <input type="hidden" name="_method" value="PUT">
              
              <div class="form-group">
                <label for="name">Nama Produk</label>
                <input type="text" 
                       id="name" 
                       name="name" 
                       value="${product.name || ''}" 
                       placeholder="Masukkan nama produk"
                       required>
              </div>
              
              <div class="form-group">
                <label for="price">Harga (Rp)</label>
                <input type="number" 
                       id="price" 
                       name="price" 
                       value="${product.price || ''}" 
                       min="0" 
                       step="1000" 
                       placeholder="Masukkan harga produk"
                       required>
              </div>
              
              <div class="form-actions">
                <a href="/products/${product.id}" class="btn btn-cancel">Batal</a>
                <button type="submit" class="btn btn-primary">Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      </body>
      </html>
    `;
    res.send(html);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Terjadi kesalahan saat memuat form edit');
  }
});

// Menangani update produk
app.post('/products/update/:id', async (req, res) => {
  try {
    const { name, price, description } = req.body;
    
    if (!name || !price) {
      return res.status(400).send('Nama dan harga produk harus diisi');
    }

    await axios.put(`${PRODUCTS_API}/products/${req.params.id}`, { name, price, description });
    res.redirect('/products');
  } catch (error) {
    console.error('Error updating product:', error.message);
    res.status(500).send('Gagal memperbarui produk');
  }
});

// Menangani hapus produk
app.post('/products/delete/:id', async (req, res) => {
  try {
    console.log('Menghapus produk dengan ID:', req.params.id);
    const response = await axios.delete(`${PRODUCTS_API}/products/${req.params.id}`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response dari Product Service:', response.data);
    
    if (response.data && response.data.error) {
      throw new Error(response.data.error);
    }
    
    // Redirect ke halaman produk dengan pesan sukses
    res.redirect('/products?message=Produk berhasil dihapus');
  } catch (error) {
    console.error('Error deleting product:', error.message);
    res.status(500).send(`Gagal menghapus produk: ${error.message}`);
  }
});

// Menangani form submission
app.post('/products', async (req, res) => {
  try {
    console.log('Menerima permintaan tambah produk:', req.body);
    
    const { name, price } = req.body;
    
    // Validasi input
    if (!name || !price) {
      console.error('Validasi gagal: Nama atau harga kosong');
      return res.status(400).send('Nama dan harga produk harus diisi');
    }

    // Pastikan price adalah number
    const priceNumber = parseFloat(price);
    if (isNaN(priceNumber)) {
      console.error('Validasi gagal: Harga harus berupa angka');
      return res.status(400).send('Harga harus berupa angka');
    }

    console.log('Mengirim data ke Product Service:', { name, price: priceNumber });
    
    try {
      // Kirim data ke Product Service
      const response = await axios.post(`${PRODUCTS_API}/products`, { 
        name, 
        price: priceNumber 
      });
      
      console.log('Berhasil menambahkan produk:', response.data);
      
      // Redirect ke halaman daftar produk dengan pesan sukses
      res.redirect('/products');
    } catch (error) {
      console.error('Error dari Product Service:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      const errorMessage = error.response?.data?.error || 'Gagal menambahkan produk';
      res.status(error.response?.status || 500).send(`Error: ${errorMessage}`);
    }
  } catch (error) {
    console.error('Error dalam menangani permintaan:', error);
    res.status(500).send('Terjadi kesalahan internal');
  }
});

// Di api-gateway/index.js, ganti route '/products' dengan kode berikut:

app.get('/products', isAuthenticated, async (req, res) => {
  try {
    const products = await fetchData(`${PRODUCTS_API}/products`);
    console.log('DEBUG products:', products);
    if (!Array.isArray(products) || products.length === 0) {
      return res.send('<h2 style="text-align:center;">Tidak ada produk</h2>');
    }
    const user = req.session.user || {};

    const userName = user.name || 'User';
    const userInitial = userName.charAt(0).toUpperCase();
    const message = req.query.message || '';

    let alert = '';
    if (message) {
      alert = `
        <div class="alert alert-success alert-dismissible fade show" role="alert">
          ${message}
          <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      `;
    }

    const productsList = products.map(product => `
      <tr>
        <td>${product.id}</td>
        <td>${product.name}</td>
        <td>${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(product.price)}</td>
        <td>${product.deskripsi || '-'}</td>
        <td>${(product.created_at && !isNaN(Date.parse(product.created_at))) ? new Date(product.created_at).toLocaleDateString('id-ID') : '-'}</td>
        <td class="text-nowrap">
          <a href="/products/edit/${product.id}" class="btn btn-sm btn-outline-primary me-1" title="Edit Product">
            <i class="fas fa-edit"></i>
          </a>
          <form action="/products/delete/${product.id}" method="POST" class="d-inline" onsubmit="return confirm('Are you sure you want to delete this product?');">
            <button type="submit" class="btn btn-sm btn-outline-danger" title="Delete Product">
              <i class="fas fa-trash"></i>
            </button>
          </form>
        </td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Products - Microservice App</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <style>
          :root {
            --primary: #4361ee;
            --primary-light: rgba(67, 97, 238, 0.1);
            --secondary: #6c757d;
            --success: #28a745;
            --info: #17a2b8;
            --warning: #ffc107;
            --danger: #dc3545;
            --light: #f8f9fa;
            --dark: #343a40;
            --gray: #6c757d;
            --gray-light: #e9ecef;
            --white: #ffffff;
            --sidebar-width: 250px;
          }
          
          body {
            background-color: #f5f7fb;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          }
          
          /* Sidebar Styles */
          .sidebar {
            position: fixed;
            top: 0;
            left: 0;
            bottom: 0;
            width: var(--sidebar-width);
            background: var(--white);
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.05);
            z-index: 1000;
            padding: 1.5rem 0;
            overflow-y: auto;
          }
          
          .sidebar-brand {
            padding: 0 1.5rem 1.5rem;
            margin-bottom: 1rem;
            border-bottom: 1px solid var(--gray-light);
          }
          
          .sidebar-brand a {
            display: flex;
            align-items: center;
            color: var(--primary);
            font-size: 1.5rem;
            font-weight: 700;
            text-decoration: none;
          }
          
          .sidebar-brand i {
            margin-right: 0.75rem;
            font-size: 1.75rem;
          }
          
          .sidebar-menu {
            padding: 0 1rem;
          }
          
          .menu-title {
            color: var(--gray);
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            padding: 0.5rem 1rem;
            margin: 1.5rem 0 0.5rem;
          }
          
          .menu-item {
            margin-bottom: 0.25rem;
          }
          
          .menu-link {
            display: flex;
            align-items: center;
            padding: 0.75rem 1rem;
            color: var(--gray);
            text-decoration: none;
            border-radius: 0.5rem;
            transition: all 0.2s;
          }
          
          .menu-link:hover,
          .menu-link.active {
            background-color: var(--primary-light);
            color: var(--primary);
          }
          
          .menu-link i {
            width: 1.5rem;
            margin-right: 0.75rem;
            text-align: center;
            font-size: 1.1rem;
          }
          
          /* Main Content */
          .main-content {
            margin-left: var(--sidebar-width);
            padding: 2rem;
            min-height: 100vh;
          }
          
          /* Top Bar */
          .top-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid var(--gray-light);
          }
          
          .page-title {
            font-size: 1.75rem;
            font-weight: 600;
            margin: 0;
            color: var(--dark);
          }
          
          .btn-primary {
            background-color: var(--primary);
            border: none;
            padding: 0.5rem 1.25rem;
            font-weight: 500;
          }
          
          .btn-primary:hover {
            background-color: #3a56d4;
            transform: translateY(-1px);
          }
          
          .btn-sm {
            padding: 0.25rem 0.5rem;
            font-size: 0.75rem;
          }
          
          /* Table Styles */
          .table-container {
            background: var(--white);
            border-radius: 0.75rem;
            box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.05);
            overflow: hidden;
          }
          
          .table {
            margin-bottom: 0;
          }
          
          .table thead th {
            background-color: #f8f9fa;
            border-bottom: 2px solid #e9ecef;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.75rem;
            letter-spacing: 0.05em;
            color: var(--gray);
            padding: 1rem 1.5rem;
          }
          
          .table tbody td {
            padding: 1rem 1.5rem;
            vertical-align: middle;
            border-color: #edf2f7;
          }
          
          .table tbody tr:last-child td {
            border-bottom: none;
          }
          
          .table tbody tr:hover {
            background-color: #f8f9fa;
          }
          
          /* Badges */
          .badge {
            font-weight: 500;
            padding: 0.35em 0.65em;
            font-size: 0.75em;
            border-radius: 0.25rem;
          }
          
          .badge-success {
            background-color: rgba(40, 167, 69, 0.1);
            color: var(--success);
          }
          
          .badge-warning {
            background-color: rgba(255, 193, 7, 0.1);
            color: var(--warning);
          }
          
          .badge-danger {
            background-color: rgba(220, 53, 69, 0.1);
            color: var(--danger);
          }
          
          .badge-info {
            background-color: rgba(23, 162, 184, 0.1);
            color: var(--info);
          }
          
          /* Buttons */
          .btn {
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            font-weight: 500;
            font-size: 0.875rem;
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }
          
          .btn i {
            margin-right: 0.5rem;
            font-size: 0.9em;
          }
          
          .btn-sm {
            padding: 0.25rem 0.5rem;
            font-size: 0.75rem;
          }
          
          .btn-outline-primary {
            color: var(--primary);
            border-color: var(--primary);
          }
          
          .btn-outline-primary:hover {
            background-color: var(--primary);
            border-color: var(--primary);
          }
          
          .btn-outline-danger {
            color: var(--danger);
            border-color: var(--danger);
          }
          
          .btn-outline-danger:hover {
            background-color: var(--danger);
            border-color: var(--danger);
            color: white;
          }
          
          /* Forms */
          .form-control, .form-select {
            padding: 0.75rem 1rem;
            border-radius: 0.5rem;
            border: 1px solid #e2e8f0;
            font-size: 0.9375rem;
          }
          
          .form-control:focus, .form-select:focus {
            border-color: var(--primary);
            box-shadow: 0 0 0 0.25rem rgba(67, 97, 238, 0.25);
          }
          
          .form-label {
            font-weight: 500;
            margin-bottom: 0.5rem;
            color: #4a5568;
          }
          
          /* Alerts */
          .alert {
            border: none;
            border-radius: 0.5rem;
            padding: 1rem 1.25rem;
          }
          
          .alert-dismissible .btn-close {
            padding: 1.2rem 1.25rem;
          }
          
          /* Responsive */
          @media (max-width: 992px) {
            .sidebar {
              transform: translateX(-100%);
            }
            
            .sidebar.show {
              transform: translateX(0);
            }
            
            .main-content {
              margin-left: 0;
            }
            
            .top-bar {
              flex-direction: column;
              align-items: flex-start;
            }
            
            .page-actions {
              margin-top: 1rem;
              width: 100%;
            }
          }
          
          @media (max-width: 768px) {
            .table-responsive {
              border-radius: 0.5rem;
              border: 1px solid #e9ecef;
        </style>
      </head>
      <body>
        <!-- Sidebar -->
        <div class="sidebar">
          <div class="sidebar-brand">
            <a href="/">
              <i class="fas fa-boxes"></i>
              <span>Microservice</span>
            </a>
          </div>
          
          <div class="sidebar-menu">
            <div class="menu-title">MAIN</div>
            
            <div class="menu-item">
              <a href="/" class="menu-link active">
                <i class="fas fa-home"></i>
                <span>Dashboard</span>
              </a>
            </div>
            
            <div class="menu-item">
              <a href="/products" class="menu-link">
                <i class="fas fa-box"></i>
                <span>Products</span>
              </a>
            </div>
            
            <div class="menu-item">
              <a href="/shipping" class="menu-link">
                <i class="fas fa-truck"></i>
                <span>Shipping</span>
              </a>
            </div>
            
            <div class="menu-title">ACCOUNT</div>
            
            <div class="menu-item">
              <a href="/profile" class="menu-link">
                <i class="fas fa-user"></i>
                <span>Profile</span>
              </a>
            </div>
            
            <div class="menu-item">
              <a href="/settings" class="menu-link">
                <i class="fas fa-cog"></i>
                <span>Settings</span>
              </a>
            </div>
            
            <div class="menu-item">
              <a href="/logout" class="menu-link text-danger">
                <i class="fas fa-sign-out-alt"></i>
                <span>Logout</span>
              </a>
            </div>
          </div>
        </div>
        
        <!-- Main Content -->
        <div class="main-content">
          <!-- Top Bar -->
          <div class="top-bar">
            <div>
              <h1 class="page-title">Products</h1>
              <p class="text-muted mb-0">Manage your product inventory</p>
            </div>
            
            <div class="d-flex align-items-center">
              <a href="/products/add" class="btn btn-primary">
                <i class="fas fa-plus"></i> Add Product
              </a>
            </div>
          </div>
          
          ${alert}
          
          <!-- Products Table -->
          <div class="table-container">
  <div class="table-responsive">
    <table class="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Nama</th>
          <th>Harga</th>
          <th>Deskripsi</th>
          <th>Dibuat</th>
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody>
        ${productsList}
      </tbody>
    </table>
  </div>
</div>
        </div>

        <!-- Bootstrap JS Bundle with Popper -->
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
        <script>
          // Enable tooltips
          var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
          var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
          });
          
          // Toggle sidebar on mobile
          document.addEventListener('DOMContentLoaded', function() {
            const sidebar = document.querySelector('.sidebar');
            const sidebarToggle = document.querySelector('.sidebar-toggle');
            
            if (sidebarToggle) {
              sidebarToggle.addEventListener('click', function() {
                sidebar.classList.toggle('show');
              });
            }
          });
        </script>
      </body>
      </html>
    `;
    
    res.send(html);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Route untuk halaman settings
app.get('/settings', isAuthenticated, (req, res) => {
  const user = req.session.user || {};
  const settings = req.session.settings || { theme: 'light', notif: false };
  const message = req.flash('success_msg').map(msg => `<div class="alert alert-success">${msg}</div>`).join('') + req.flash('error_msg').map(msg => `<div class="alert alert-danger">${msg}</div>`).join('');
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Settings</title>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    </head>
    <body class="bg-light">
      <div class="container py-5">
        <div class="row justify-content-center">
          <div class="col-md-6">
            <div class="card">
              <div class="card-header bg-secondary text-white">Settings</div>
              <div class="card-body">
                ${message}
                <form method="POST" action="/settings">
                  <div class="mb-3">
                    <label for="theme" class="form-label">Tema UI</label>
                    <select class="form-select" id="theme" name="theme">
  <option value="light" ${settings.theme === 'light' ? 'selected' : ''}>Light</option>
  <option value="dark" ${settings.theme === 'dark' ? 'selected' : ''}>Dark</option>
</select>
                  </div>
                  <div class="mb-3 form-check">
                    <input type="checkbox" class="form-check-input" id="notif" name="notif" ${settings.notif ? 'checked' : ''}>
                    <label class="form-check-label" for="notif">Aktifkan Notifikasi Email</label>
                  </div>
                  <button type="submit" class="btn btn-secondary">Simpan Pengaturan</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Handle update settings (simpan ke session)
app.post('/settings', isAuthenticated, (req, res) => {
  // Catat aktivitas update settings
  if (!req.session.activities) req.session.activities = [];
  req.session.activities.unshift({
    type: 'settings',
    desc: 'Mengubah pengaturan aplikasi',
    time: new Date().toLocaleString('id-ID')
  });
  req.session.activities = req.session.activities.slice(0, 20);
  req.session.settings = {
    theme: req.body.theme,
    notif: !!req.body.notif
  };
  req.flash('success_msg', 'Pengaturan berhasil disimpan');
  res.redirect('/'); // redirect ke dashboard
});

// Route untuk halaman profil user
app.get('/profile', isAuthenticated, (req, res) => {
  const user = req.session.user || {};
  const message = req.flash('success_msg').map(msg => `<div class="alert alert-success">${msg}</div>`).join('') + req.flash('error_msg').map(msg => `<div class="alert alert-danger">${msg}</div>`).join('');
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Profil Saya</title>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    </head>
    <body class="bg-light">
      <div class="container py-5">
        <div class="row justify-content-center">
          <div class="col-md-6">
            <div class="card">
              <div class="card-header bg-primary text-white">Profil Saya</div>
              <div class="card-body">
                ${message}
                <form method="POST" action="/profile" onsubmit="return confirm('Apakah Anda yakin ingin mengubah profil Anda?')">
                  <div class="mb-3">
                    <label for="name" class="form-label">Nama</label>
                    <input type="text" class="form-control" id="name" name="name" value="${user.name || ''}" required>
                  </div>
                  <div class="mb-3">
                    <label for="email" class="form-label">Email</label>
                    <input type="email" class="form-control" id="email" name="email" value="${user.email || ''}" required>
                  </div>
                  <div class="mb-3">
                    <label for="password" class="form-label">Password Baru <small class="text-muted">(Kosongkan jika tidak ingin ganti)</small></label>
                    <input type="password" class="form-control" id="password" name="password" autocomplete="new-password">
                  </div>
                  <button type="submit" class="btn btn-primary">Simpan Perubahan</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Handle update profil user
app.post('/profile', isAuthenticated, async (req, res) => {
  // Catat aktivitas update profil
  if (!req.session.activities) req.session.activities = [];
  req.session.activities.unshift({
    type: 'profile',
    desc: 'Memperbarui profil',
    time: new Date().toLocaleString('id-ID')
  });
  req.session.activities = req.session.activities.slice(0, 20);
  try {
    if (!req.session.token) {
      req.flash('error_msg', 'Session Anda sudah habis. Silakan login ulang.');
      return res.redirect('/login');
    }
    const { name, email, password } = req.body;
    const token = req.session.token;
    const response = await axios.put(`${AUTH_API}/api/auth/profile`, { name, email, password }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    req.session.user = response.data.user;
    req.flash('success_msg', 'Profil berhasil diperbarui');
    res.redirect('/');
  } catch (error) {
    console.error('Update profil error:', error.response?.data || error.message);
    req.flash('error_msg', error.response?.data?.message || 'Gagal memperbarui profil');
    res.redirect('/profile');
  }
});

// Menampilkan daftar pengiriman
app.get('/shipping', isAuthenticated, async (req, res) => {
  try {
    const shippings = await fetchData(`${SHIPPING_API}/shipping`);
    // Ambil data produk dan buat productMap
    const products = await fetchData(`${PRODUCTS_API}/products`);
    const productMap = {};
    if (Array.isArray(products)) {
      products.forEach(product => {
        productMap[product.id] = product.name;
      });
    }
    const user = req.session.user || {};
    const userName = user.name || 'User';
    const userInitial = userName.charAt(0).toUpperCase();
    const message = req.query.message || '';

    let alert = '';
    if (message) {
      alert = `
        <div class="alert alert-success alert-dismissible fade show" role="alert">
          ${message}
          <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      `;
    }

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Daftar Pengiriman - Microservice App</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
        <style>
          /* Tambahkan style yang sama dengan halaman products */
          :root {
            --primary-color: #4e73df;
            --secondary-color: #858796;
            --success-color: #1cc88a;
            --info-color: #36b9cc;
            --warning-color: #f6c23e;
            --danger-color: #e74a3b;
            --light-color: #f8f9fc;
            --dark-color: #5a5c69;
          }
          /* Tambahkan style lainnya dari halaman products */
        </style>
      </head>
      <body>
        <div class="container-fluid">
          <div class="row">
            <!-- Sidebar -->
            <div class="col-auto px-0">
              <div class="sidebar d-flex flex-column flex-shrink-0 p-3" style="width: 14rem;">
                <a href="/" class="d-flex align-items-center mb-3 mb-md-0 me-md-auto text-white text-decoration-none">
                  <span class="fs-4">Microservice App</span>
                </a>
                <hr>
                <ul class="nav nav-pills flex-column mb-auto">
                  <li class="nav-item">
                    <a href="/" class="nav-link">
                      <i class="fas fa-fw fa-tachometer-alt"></i>
                      Dashboard
                    </a>
                  </li>
                  <li>
                    <a href="/products" class="nav-link">
                      <i class="fas fa-fw fa-box"></i>
                      Produk
                    </a>
                  </li>
                  <li>
                    <a href="/shipping" class="nav-link active">
                      <i class="fas fa-fw fa-truck"></i>
                      Pengiriman
                    </a>
                  </li>
                </ul>
                <hr>
                <div class="dropdown">
                  <a href="#" class="d-flex align-items-center text-white text-decoration-none dropdown-toggle" id="dropdownUser1" data-bs-toggle="dropdown" aria-expanded="false">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random" alt="Profile" width="32" height="32" class="rounded-circle me-2">
                    <strong>${userName}</strong>
                  </a>
                  <ul class="dropdown-menu dropdown-menu-dark text-small shadow" aria-labelledby="dropdownUser1">
                    <li><a class="dropdown-item" href="/profile"><i class="fas fa-fw fa-user me-2"></i>Profil</a></li>
                    <li><a class="dropdown-item" href="/settings"><i class="fas fa-fw fa-cog me-2"></i>Pengaturan</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item" href="/logout"><i class="fas fa-fw fa-sign-out-alt me-2"></i>Keluar</a></li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- Main Content -->
            <div class="col px-0">
              <!-- Topbar -->
              <nav class="navbar navbar-expand topbar mb-4 static-top shadow-sm bg-white">
                <div class="container-fluid">
                  <button class="btn btn-link d-md-none rounded-circle me-3" id="sidebarToggle">
                    <i class="fas fa-bars"></i>
                  </button>
                  
                  <div class="d-flex align-items-center">
                    <h1 class="h3 mb-0 text-gray-800">Daftar Pengiriman</h1>
                  </div>
                </div>
              </nav>

              <!-- Begin Page Content -->
              <div class="container-fluid px-4">
                <!-- Page Heading -->
                <div class="d-sm-flex align-items-center justify-content-between mb-4">
                  <nav aria-label="breadcrumb">
                    <ol class="breadcrumb mb-0">
                      <li class="breadcrumb-item"><a href="/">Dashboard</a></li>
                      <li class="breadcrumb-item active" aria-current="page">Pengiriman</li>
                    </ol>
                  </nav>
                  <a href="/shipping/add" class="btn btn-primary btn-sm d-none d-sm-inline-block">
                    <i class="fas fa-plus fa-sm text-white-50"></i> Tambah Pengiriman
                  </a>
                </div>

                <!-- Content Row -->
                <div class="row">
                  <div class="col-12">
                    ${alert}
                    <div class="card shadow-sm mb-4">
                      <div class="card-header py-3 d-flex flex-row align-items-center justify-content-between">
                        <h6 class="m-0 font-weight-bold text-primary">Daftar Pengiriman</h6>
                        <div class="dropdown no-arrow">
                          <a class="dropdown-toggle" href="#" role="button" id="dropdownMenuLink" data-bs-toggle="dropdown" aria-expanded="false">
                            <i class="fas fa-ellipsis-v fa-sm fa-fw text-gray-400"></i>
                          </a>
                          <ul class="dropdown-menu dropdown-menu-end shadow" aria-labelledby="dropdownMenuLink">
                            <li><a class="dropdown-item" href="#"><i class="fas fa-file-export fa-sm fa-fw me-2 text-gray-400"></i> Ekspor Data</a></li>
                            <li><a class="dropdown-item" href="#"><i class="fas fa-print fa-sm fa-fw me-2 text-gray-400"></i> Cetak</a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item" href="#"><i class="fas fa-sync-alt fa-sm fa-fw me-2 text-gray-400"></i> Refresh</a></li>
                          </ul>
                        </div>
                      </div>
                      <div class="card-body">
                        <div class="table-responsive">
                          <table class="table table-bordered" id="dataTable" width="100%" cellspacing="0">
                            <thead>
                              <tr>
                                <th>ID</th>
                                <th>Produk</th>
                                <th>Alamat</th>
                                <th>Status</th>
                                <th>Terakhir Diupdate</th>
                                <th>Aksi</th>
                              </tr>
                            </thead>
                            <tbody>
                              ${shippings.map(shipping => `
                                <tr>
                                  <td>${shipping.id}</td>
                                  <td>${productMap[shipping.product_id] || shipping.product_id}</td>
                                  <td>${shipping.address}</td>
                                  <td>
                                    <span class="badge bg-${getStatusBadgeClass(shipping.status)}">
                                      ${shipping.status}
                                    </span> 
                                  </td>
                                  <td>${shipping.created_at ? new Date(shipping.created_at).toLocaleDateString('id-ID') : '-'}</td>
                                  <td class="text-nowrap">
                                    <a href="/shipping/${shipping.id}" class="btn btn-sm btn-info me-1" data-bs-toggle="tooltip" title="Detail">
                                      <i class="fas fa-eye"></i>
                                    </a>
                                    <a href="/shipping/edit/${shipping.id}" class="btn btn-sm btn-primary me-1" data-bs-toggle="tooltip" title="Edit">
                                      <i class="fas fa-edit"></i>
                                    </a>
                                    <form action="/shipping/delete/${shipping.id}" method="POST" class="d-inline" onsubmit="return confirm('Apakah Anda yakin ingin menghapus pengiriman ini?');">
                                      <button type="submit" class="btn btn-sm btn-danger" data-bs-toggle="tooltip" title="Hapus">
                                        <i class="fas fa-trash"></i>
                                      </button>
                                    </form>
                                  </td>
                                </tr>
                              `).join('')}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
            </div>
          </div>
        </div>

        <script>
          // Enable tooltips
          var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
          var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
          });

          // Toggle sidebar on mobile
          document.getElementById('sidebarToggle').addEventListener('click', function() {
            document.querySelector('.sidebar').classList.toggle('d-none');
          });

          // Auto-hide sidebar on small screens
          function handleResize() {
            const sidebar = document.querySelector('.sidebar');
            if (window.innerWidth < 768) {
              sidebar.classList.add('d-none');
            } else {
              sidebar.classList.remove('d-none');
            }
          }

          // Run on page load
          handleResize();

          // Run on window resize
          window.addEventListener('resize', handleResize);
        </script>
      </body>
      </html>
    `;
    res.send(html);
  } catch (error) {
    console.error('Error fetching shipping data:', error);
    res.status(500).send('Terjadi kesalahan saat mengambil data pengiriman');
  }
});

// Helper function untuk menentukan class badge berdasarkan status
function getStatusBadgeClass(status) {
  switch(status?.toLowerCase()) {
    case 'diproses':
      return 'info';
    case 'dikirim':
      return 'primary';
    case 'dalam perjalanan':
      return 'warning';
    case 'terkirim':
      return 'success';
    case 'dibatalkan':
      return 'danger';
    default:
      return 'secondary';
  }
}

// Menampilkan form tambah pengiriman
app.get('/shipping/add', isAuthenticated, (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Tambah Pengiriman - Microservice App</title>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
      <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
      <style>
        :root {
          --primary-color: #4e73df;
          --secondary-color: #858796;
          --success-color: #1cc88a;
          --info-color: #36b9cc;
          --warning-color: #f6c23e;
          --danger-color: #e74a3b;
          --light-color: #f8f9fc;
          --dark-color: #5a5c69;
        }
        .sidebar {
          min-height: 100vh;
          background: linear-gradient(180deg, var(--primary-color) 0%, #224abe 100%);
          color: white;
          transition: all 0.3s;
        }
        .sidebar .nav-link {
          color: rgba(255, 255, 255, 0.8);
          padding: 0.75rem 1rem;
          margin: 0.2rem 0;
          border-radius: 0.35rem;
        }
        .sidebar .nav-link:hover {
          color: white;
          background-color: rgba(255, 255, 255, 0.1);
        }
        .sidebar .nav-link.active {
          color: white;
          background-color: rgba(255, 255, 255, 0.2);
          font-weight: 600;
        }
        .sidebar .nav-link i {
          margin-right: 0.5rem;
          width: 20px;
          text-align: center;
        }
        .topbar {
          height: 4.375rem;
          box-shadow: 0 0.15rem 1.75rem 0 rgba(58, 59, 69, 0.15);
        }
        .topbar .nav-item .nav-link {
          height: 4.375rem;
          display: flex;
          align-items: center;
          padding: 0 0.75rem;
          color: #d1d3e2;
        }
        .topbar .nav-item .nav-link:hover {
          color: #b7b9cc;
        }
        .topbar .dropdown-menu {
          border: none;
          box-shadow: 0 0.15rem 1.75rem 0 rgba(58, 59, 69, 0.2);
        }
        .card {
          border: none;
          border-radius: 0.35rem;
          box-shadow: 0 0.15rem 1.75rem 0 rgba(58, 59, 69, 0.1);
          margin-bottom: 1.5rem;
        }
        .card-header {
          background-color: #f8f9fc;
          border-bottom: 1px solid #e3e6f0;
          padding: 1rem 1.25rem;
          font-weight: 600;
        }
        .form-control, .form-select {
          border-radius: 0.35rem;
          padding: 0.5rem 0.75rem;
          border: 1px solid #d1d3e2;
        }
        .form-control:focus, .form-select:focus {
          border-color: #bac8f3;
          box-shadow: 0 0 0 0.2rem rgba(78, 115, 223, 0.25);
        }
        .btn-primary {
          background-color: var(--primary-color);
          border-color: var(--primary-color);
        }
        .btn-primary:hover {
          background-color: #2e59d9;
          border-color: #2653d4;
        }
        .btn-outline-secondary {
          color: #6c757d;
          border-color: #d1d3e2;
        }
        .btn-outline-secondary:hover {
          background-color: #f8f9fc;
          border-color: #d1d3e2;
          color: #5a5c69;
        }
        .form-label {
          font-weight: 600;
          color: #5a5c69;
          margin-bottom: 0.5rem;
        }
        .required-field::after {
          content: " *";
          color: #e74a3b;
        }
      </style>
    </head>
    <body>
      <div class="container-fluid">
        <div class="row">
          <!-- Sidebar -->
          <div class="col-auto px-0">
            <div class="sidebar d-flex flex-column flex-shrink-0 p-3" style="width: 14rem;">
              <a href="/" class="d-flex align-items-center mb-3 mb-md-0 me-md-auto text-white text-decoration-none">
                <span class="fs-4">Microservice App</span>
              </a>
              <hr>
              <ul class="nav nav-pills flex-column mb-auto">
                <li class="nav-item">
                  <a href="/" class="nav-link">
                    <i class="fas fa-fw fa-tachometer-alt"></i>
                    Dashboard
                  </a>
                </li>
                <li>
                  <a href="/products" class="nav-link">
                    <i class="fas fa-fw fa-box"></i>
                    Produk
                  </a>
                </li>
                <li>
                  <a href="/shipping" class="nav-link active">
                    <i class="fas fa-fw fa-truck"></i>
                    Pengiriman
                  </a>
                </li>
              </ul>
              <hr>
              <div class="dropdown">
                <a href="#" class="d-flex align-items-center text-white text-decoration-none dropdown-toggle" id="dropdownUser1" data-bs-toggle="dropdown" aria-expanded="false">
                  <img src="https://ui-avatars.com/api/?name=Admin&background=random" alt="Profile" width="32" height="32" class="rounded-circle me-2">
                  <strong>Admin</strong>
                </a>
                <ul class="dropdown-menu dropdown-menu-dark text-small shadow" aria-labelledby="dropdownUser1">
                  <li><a class="dropdown-item" href="/profile"><i class="fas fa-fw fa-user me-2"></i>Profil</a></li>
                  <li><a class="dropdown-item" href="/settings"><i class="fas fa-fw fa-cog me-2"></i>Pengaturan</a></li>
                  <li><hr class="dropdown-divider"></li>
                  <li><a class="dropdown-item" href="/logout"><i class="fas fa-fw fa-sign-out-alt me-2"></i>Keluar</a></li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Main Content -->
          <div class="col px-0">
            <!-- Topbar -->
            <nav class="navbar navbar-expand topbar mb-4 static-top shadow-sm bg-white">
              <div class="container-fluid">
                <button class="btn btn-link d-md-none rounded-circle me-3" id="sidebarToggle">
                  <i class="fas fa-bars"></i>
                </button>
                
                <div class="d-flex align-items-center">
                  <h1 class="h3 mb-0 text-gray-800">Tambah Data Pengiriman</h1>
                </div>
              </div>
            </nav>

            <!-- Begin Page Content -->
            <div class="container-fluid px-4">
              <!-- Page Heading -->
              <div class="d-sm-flex align-items-center justify-content-between mb-4">
                <nav aria-label="breadcrumb">
                  <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item"><a href="/">Dashboard</a></li>
                    <li class="breadcrumb-item"><a href="/shipping">Pengiriman</a></li>
                    <li class="breadcrumb-item active" aria-current="page">Tambah Data</li>
                  </ol>
                </nav>
              </div>

              <!-- Content Row -->
              <div class="row">
                <div class="col-lg-12">
                  <div class="card shadow-sm mb-4">
                    <div class="card-header py-3 d-flex flex-row align-items-center justify-content-between">
                      <h6 class="m-0 font-weight-bold text-primary">Form Tambah Pengiriman</h6>
                    </div>
                    <div class="card-body">
                      <form action="/shipping/add" method="POST">
                        <div class="row mb-3">
                          <div class="col-md-6 mb-3">
                            <label for="orderId" class="form-label required">ID Pesanan</label>
                            <input type="text" class="form-control" id="orderId" name="orderId" required>
                          </div>
                          <div class="col-md-6 mb-3">
                            <label for="trackingNumber" class="form-label">Nomor Resi</label>
                            <input type="text" class="form-control" id="trackingNumber" name="trackingNumber">
                          </div>
                        </div>

                        <div class="row mb-3">
                          <div class="col-md-6 mb-3">
                            <label for="shippingMethod" class="form-label required">Metode Pengiriman</label>
                            <select class="form-select" id="shippingMethod" name="shippingMethod" required>
                              <option value="" selected disabled>Pilih Metode Pengiriman</option>
                              <option value="JNE">JNE</option>
                              <option value="POS">POS Indonesia</option>
                              <option value="TIKI">TIKI</option>
                              <option value="J&T">J&T</option>
                              <option value="SiCepat">SiCepat</option>
                              <option value="GoSend">GoSend</option>
                              <option value="GrabExpress">GrabExpress</option>
                            </select>
                          </div>
                          <div class="col-md-6 mb-3">
                            <label for="shippingCost" class="form-label required">Biaya Pengiriman</label>
                            <div class="input-group">
                              <span class="input-group-text">Rp</span>
                              <input type="number" class="form-control" id="shippingCost" name="shippingCost" required>
                            </div>
                          </div>
                        </div>

                        <div class="row mb-3">
                          <div class="col-md-6 mb-3">
                            <label for="shippingDate" class="form-label required">Tanggal Pengiriman</label>
                            <input type="date" class="form-control" id="shippingDate" name="shippingDate" required>
                          </div>
                          <div class="col-md-6 mb-3">
                            <label for="estimatedArrival" class="form-label">Perkiraan Sampai</label>
                            <input type="date" class="form-control" id="estimatedArrival" name="estimatedArrival">
                          </div>
                        </div>

                        <div class="row mb-3">
                          <div class="col-12">
                            <label for="shippingAddress" class="form-label required">Alamat Pengiriman</label>
                            <textarea class="form-control" id="shippingAddress" name="shippingAddress" rows="3" required></textarea>
                          </div>
                        </div>

                        <div class="row mb-3">
                          <div class="col-md-4 mb-3">
                            <label for="recipientName" class="form-label required">Nama Penerima</label>
                            <input type="text" class="form-control" id="recipientName" name="recipientName" required>
                          </div>
                          <div class="col-md-4 mb-3">
                            <label for="recipientPhone" class="form-label">No. Telepon Penerima</label>
                            <input type="tel" class="form-control" id="recipientPhone" name="recipientPhone">
                          </div>
                          <div class="col-md-4 mb-3">
                            <label for="status" class="form-label required">Status</label>
                            <select class="form-select" id="status" name="status" required>
                              <option value="Diproses" selected>Diproses</option>
                              <option value="Dikirim">Dikirim</option>
                              <option value="Dalam Perjalanan">Dalam Perjalanan</option>
                              <option value="Terkirim">Terkirim</option>
                              <option value="Dibatalkan">Dibatalkan</option>
                            </select>
                          </div>
                        </div>

                        <div class="row mb-3">
                          <div class="col-12">
                            <label for="notes" class="form-label">Catatan</label>
                            <textarea class="form-control" id="notes" name="notes" rows="2"></textarea>
                          </div>
                        </div>

                        <div class="d-flex justify-content-end gap-2">
                          <a href="/shipping" class="btn btn-outline-secondary">
                            <i class="fas fa-arrow-left me-1"></i> Kembali
                          </a>
                          <button type="submit" class="btn btn-primary">
                            <i class="fas fa-save me-1"></i> Simpan
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <!-- /.container-fluid -->
          </div>
        </div>
      </div>

      <!-- Bootstrap core JavaScript-->
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
      <script>
        // Toggle sidebar on mobile
        document.getElementById('sidebarToggle').addEventListener('click', function() {
          document.querySelector('.sidebar').classList.toggle('d-none');
        });

        // Auto-hide sidebar on small screens
        function handleResize() {
          const sidebar = document.querySelector('.sidebar');
          if (window.innerWidth < 768) {
            sidebar.classList.add('d-none');
          } else {
            sidebar.classList.remove('d-none');
          }
        }

        // Run on page load
        handleResize();

        // Run on window resize
        window.addEventListener('resize', handleResize);

        // Format currency input
        document.getElementById('shippingCost').addEventListener('input', function(e) {
          let value = e.target.value.replace(/[^0-9]/g, '');
          e.target.value = value ? parseInt(value).toLocaleString('id-ID') : '';
        });

        // Set default date to today for shipping date
        document.addEventListener('DOMContentLoaded', function() {
          const today = new Date().toISOString().split('T')[0];
          document.getElementById('shippingDate').value = today;
          
          // Set estimated arrival to 3 days from today
          const estimatedDate = new Date();
          estimatedDate.setDate(estimatedDate.getDate() + 3);
          const formattedDate = estimatedDate.toISOString().split('T')[0];
          document.getElementById('estimatedArrival').value = formattedDate;
        });
      </script>
    </body>
    </html>
  `;
  res.send(html);
});

// Menangani form submission pengiriman
app.post('/shipping', async (req, res) => {
  try {
    const { product_id, address, status = 'pending' } = req.body;
    
    // Validasi input
    if (!product_id || !address) {
      req.flash('error_msg', 'Semua field harus diisi');
      return res.redirect('/shipping/add');
    }

    // Validasi status
    const validStatuses = ['pending', 'dikirim', 'terkirim'];
    if (!validStatuses.includes(status)) {
      req.flash('error_msg', 'Status pengiriman tidak valid');
      return res.redirect('/shipping/add');
    }

    // Kirim data ke Shipping Service
    const response = await axios.post(`${SHIPPING_API}/shipping`, { 
      product_id: parseInt(product_id), 
      address, 
      status 
    });
    
    // Set flash message sukses
    req.flash('success_msg', 'Pengiriman berhasil ditambahkan');
    
    // Catat aktivitas tambah pengiriman
    if (!req.session.activities) req.session.activities = [];
    req.session.activities.unshift({
      type: 'shipping',
      desc: 'Menambah pengiriman baru',
      time: new Date().toLocaleString('id-ID')
    });
    req.session.activities = req.session.activities.slice(0, 20);
    
    // Redirect ke halaman daftar pengiriman
    res.redirect('/shipping');
  } catch (error) {
    console.error('Error adding shipping:', error.message);
    
    // Set flash message error
    const errorMessage = error.response?.data?.error || 'Gagal menambahkan pengiriman';
    req.flash('error_msg', errorMessage);
    
    // Redirect kembali ke form dengan data yang sudah diisi
    res.redirect('/shipping/add');
  }
});

// Endpoint untuk memperbarui status pengiriman
app.post('/shipping/:id/status', async (req, res) => {
  const shippingId = req.params.id;
  const { status } = req.body;
  
  try {
    // Validasi input
    if (!status) {
      req.flash('error_msg', 'Status pengiriman harus diisi');
      return res.redirect(`/shipping/${shippingId}`);
    }
    
    // Validasi status
    const validStatuses = ['pending', 'dikirim', 'terkirim'];
    if (!validStatuses.includes(status)) {
      req.flash('error_msg', `Status tidak valid. Harus salah satu dari: ${validStatuses.join(', ')}`);
      return res.redirect(`/shipping/${shippingId}`);
    }
    
    // Kirim permintaan update status ke Shipping Service
    await axios.put(`${SHIPPING_API}/shipping/${shippingId}/status`, { status });
    
    // Set flash message sukses
    req.flash('success_msg', `Status pengiriman berhasil diubah menjadi: ${status}`);
    
    // Catat aktivitas update status pengiriman
    if (!req.session.activities) req.session.activities = [];
    req.session.activities.unshift({
      type: 'shipping',
      desc: `Mengubah status pengiriman menjadi ${status}`,
      time: new Date().toLocaleString('id-ID')
    });
    req.session.activities = req.session.activities.slice(0, 20);
  } catch (error) {
    console.error('Gagal update status pengiriman:', error.response?.data || error.message);
    
    // Set flash message error
    const errorMessage = error.response?.data?.error || 'Gagal memperbarui status pengiriman';
    req.flash('error_msg', errorMessage);
  }
  
  // Redirect kembali ke halaman detail pengiriman
  res.redirect(`/shipping/${shippingId}`);
});

// Endpoint untuk menampilkan detail pengiriman
app.get('/shipping/:id', async (req, res) => {
  try {
    const shippingId = req.params.id;
    if (!shippingId || isNaN(shippingId)) {
      req.flash('error_msg', 'ID pengiriman tidak valid');
      return res.redirect('/shipping');
    }
    
    // Ambil data pengiriman
    const shippingResponse = await axios.get(`${SHIPPING_API}/shipping/${shippingId}`);
    const shipping = shippingResponse.data;
    
    // Ambil detail produk terkait
    const productResponse = await axios.get(`${PRODUCTS_API}/products/${shipping.product_id}`);
    const product = productResponse.data;
    
    // Tentukan status yang tersedia untuk dropdown
    const allStatuses = ['pending', 'dikirim', 'terkirim'];
    const currentStatus = shipping.status || 'pending';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Detail Pengiriman #${shipping.id}</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
        <style>
          .status-pending { color: #ffc107; font-weight: bold; }
          .status-dikirim { color: #0d6efd; font-weight: bold; }
          .status-terkirim { color: #198754; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container mt-4">
          <h2>Detail Pengiriman #${shipping.id}</h2>
          
          ${res.locals.success_msg ? `<div class="alert alert-success">${res.locals.success_msg}</div>` : ''}
          ${res.locals.error_msg ? `<div class="alert alert-danger">${res.locals.error_msg}</div>` : ''}
          
          <div class="card mb-4">
            <div class="card-body">
              <h5 class="card-title">${product.name || 'Produk tidak ditemukan'}</h5>
              ${product.price ? `<p class="card-text">Harga: Rp ${parseFloat(product.price).toLocaleString('id-ID')}</p>` : ''}
              <p class="card-text">Alamat Pengiriman: ${shipping.address || '-'}</p>
              
              <form method="POST" action="/shipping/${shipping.id}/status" class="mb-3">
                <div class="row g-3 align-items-center">
                  <div class="col-auto">
                    <label for="status" class="col-form-label">Status Pengiriman:</label>
                  </div>
                  <div class="col-auto">
                    <select name="status" id="status" class="form-select">
                      ${allStatuses.map(s => 
                        `<option value="${s}" ${s === currentStatus ? 'selected' : ''}>
                          ${s.charAt(0).toUpperCase() + s.slice(1)}
                        </option>`
                      ).join('')}
                    </select>
                  </div>
                  <div class="col-auto">
                    <button type="submit" class="btn btn-primary">Update Status</button>
                  </div>
                </div>
              </form>
              
              <p class="card-text">
                Status saat ini: 
                <span class="status-${currentStatus}">
                  ${currentStatus.toUpperCase()}
                </span>
              </p>
              
              <p class="card-text">
                <small class="text-muted">
                  Terakhir diupdate: ${new Date(shipping.created_at || Date.now()).toLocaleString('id-ID')}
                </small>
              </p>
            </div>
          </div>
          
          <a href="/shipping" class="btn btn-secondary">Kembali ke Daftar Pengiriman</a>
        </div>
        
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
      </body>
      </html>
    `;
    
    res.send(html);
  } catch (error) {
    console.error('Gagal mengambil detail pengiriman:', error.response?.data || error.message);
    req.flash('error_msg', 'Gagal memuat detail pengiriman: ' + (error.response?.data?.error || error.message));
    res.redirect('/shipping');
  }
});

// Endpoint untuk menampilkan daftar pengiriman
app.get('/shipping', async (req, res) => {
  try {
    const shippingData = await fetchData(`${SHIPPING_API}/shipping`);
    const products = await fetchData(`${PRODUCTS_API}/products`);
    
    // Buat mapping product_id ke nama produk
    const productMap = {};
    products.forEach(product => {
      productMap[product.id] = product.name;
    });

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Daftar Pengiriman</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
        <style>
          .status-pending { color: #ffc107; font-weight: bold; }
          .status-dikirim { color: #0d6efd; font-weight: bold; }
          .status-terkirim { color: #198754; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container mt-4">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h1>🚚 Daftar Pengiriman</h1>
            <div>
              <a href="/shipping/add" class="btn btn-primary">Tambah Pengiriman Baru</a>
              <a href="/" class="btn btn-secondary">Kembali ke Beranda</a>
            </div>
          </div>
          
          ${res.locals.success_msg ? `<div class="alert alert-success">${res.locals.success_msg}</div>` : ''}
          ${res.locals.error_msg ? `<div class="alert alert-danger">${res.locals.error_msg}</div>` : ''}
          
          <div class="table-responsive">
            <table class="table table-striped table-hover">
              <thead class="table-dark">
                <tr>
                  <th>ID</th>
                  <th>Produk</th>
                  <th>Alamat</th>
                  <th>Status</th>
                  <th>Terakhir Diupdate</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                ${shippingData.map(item => {
                  const productName = productMap[item.product_id] || 'Produk tidak ditemukan';
                  const statusClass = `status-${item.status || 'pending'}`;
                  const statusText = (item.status || 'pending').toUpperCase();
                  const updatedAt = item.updated_at ? new Date(item.updated_at).toLocaleString('id-ID') : '-';
                  
                  return `
                    <tr>
                      <td>${item.id}</td>
                      <td>${productName}</td>
                      <td>${item.address || '-'}</td>
                      <td><span class="${statusClass}">${statusText}</span></td>
                      <td>${updatedAt}</td>
                      <td>
                        <a href="/shipping/${item.id}" class="btn btn-sm btn-info">Detail</a>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
        
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
      </body>
      </html>
    `;
    res.send(html);
  } catch (error) {
    console.error('Error:', error);
    req.flash('error_msg', 'Terjadi kesalahan saat memuat data pengiriman: ' + error.message);
    res.redirect('/');
  }
});

// Endpoint root untuk navigasi layanan
// Di api-gateway/index.js, ganti route '/' dengan kode berikut:

app.get('/', isAuthenticated, async (req, res) => {
  const activities = (req.session.activities || []).slice(0, 5);
  const settings = req.session.settings || { theme: 'light', notif: false };

  const user = req.session.user || {};
  const userName = user.name ? user.name.split(' ')[0] : 'User';

  // Fetch real data for dashboard cards
  let totalProducts = 0;
  let activeOrders = 0;
  let totalRevenue = 0;
  try {
    const products = await fetchData(`${PRODUCTS_API}/products`);
    const shippingData = await fetchData(`${SHIPPING_API}/shipping`);
    totalProducts = Array.isArray(products) ? products.length : 0;
    // Active orders: status 'pending' or 'dikirim'
    activeOrders = Array.isArray(shippingData) ? shippingData.filter(item => item.status === 'pending' || item.status === 'dikirim').length : 0;
    // Total revenue: sum of product prices for all completed (status 'terkirim') shipments
    if (Array.isArray(shippingData) && Array.isArray(products)) {
      const productPriceMap = {};
      products.forEach(p => { productPriceMap[p.id] = Number(p.price) || 0; });
      totalRevenue = shippingData
        .filter(item => item.status === 'terkirim')
        .reduce((sum, item) => sum + (productPriceMap[item.product_id] || 0), 0);
    }
  } catch (err) {
    console.error('Error fetching dashboard data:', err);
  }

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Dashboard - Microservice App</title>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
      <style>
        :root {
          --primary-color: #4361ee;
          --secondary-color: #3f37c9;
          --success-color: #2ecc71;
          --info-color: #3498db;
          --warning-color: #f39c12;
          --danger-color: #e74c3c;
          --light-color: #f8f9fa;
          --dark-color: #212529;
          --sidebar-width: 250px;
        }
        
        body {
          background-color: #f5f7fb;
          min-height: 100vh;
        }
        
        /* Sidebar Styles */
        .sidebar {
          width: var(--sidebar-width);
          background: white;
          box-shadow: 2px 0 10px rgba(0, 0, 0, 0.05);
          position: fixed;
          height: 100vh;
          overflow-y: auto;
          z-index: 1000;
          transition: all 0.3s;
        }
        
        .sidebar-brand {
          padding: 1.5rem;
          border-bottom: 1px solid #eee;
          margin-bottom: 1rem;
          color: var(--primary-color);
          font-weight: 700;
          font-size: 1.25rem;
          text-decoration: none;
          display: block;
        }
        
        .sidebar-menu {
          padding: 0 1rem;
        }
        
        .menu-title {
          color: #6c757d;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0.5rem 1rem;
          margin: 1.5rem 0 0.5rem;
        }
        
        .menu-item {
          margin-bottom: 0.25rem;
        }
        
        .menu-link {
          display: flex;
          align-items: center;
          padding: 0.75rem 1rem;
          color: #4a5568;
          text-decoration: none;
          border-radius: 0.375rem;
          transition: all 0.2s;
        }
        
        .menu-link:hover,
        .menu-link.active {
          background-color: rgba(67, 97, 238, 0.1);
          color: var(--primary-color);
        }
        
        .menu-link i {
          width: 1.5rem;
          margin-right: 0.75rem;
          text-align: center;
          font-size: 1.1rem;
        }
        
        /* Main Content */
        .main-content {
          margin-left: var(--sidebar-width);
          padding: 2rem;
          transition: all 0.3s;
        }
        
        .top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--gray-light);
        }
        
        .user-menu {
          display: flex;
          align-items: center;
        }
        
        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: var(--primary-color);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          margin-right: 0.75rem;
          text-transform: uppercase;
        }
        
        .user-info {
          margin-right: 1rem;
        }
        
        .user-name {
          font-weight: 600;
          margin: 0;
          line-height: 1.2;
        }
        
        .user-email {
          font-size: 0.875rem;
          color: #6c757d;
          margin: 0;
        }
        
        /* Dashboard Cards */
        .dashboard-cards {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        
        .card {
          border: none;
          border-radius: 0.75rem;
          box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
          transition: transform 0.2s, box-shadow 0.2s;
          overflow: hidden;
        }
        
        .card:hover {
          transform: translateY(-5px);
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.1);
        }
        
        .card-body {
          padding: 1.5rem;
        }
        
        .card-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
          font-size: 1.5rem;
        }
        
        .card-icon.primary {
          background-color: rgba(67, 97, 238, 0.1);
          color: var(--primary-color);
        }
        
        .card-icon.success {
          background-color: rgba(46, 204, 113, 0.1);
          color: var(--success-color);
        }
        
        .card-icon.warning {
          background-color: rgba(243, 156, 18, 0.1);
          color: var(--warning-color);
        }
        
        .card-title {
          font-size: 0.875rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #6c757d;
          margin-bottom: 0.5rem;
        }
        
        .card-value {
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--dark-color);
          margin-bottom: 0.5rem;
          line-height: 1.2;
        }
        
        /* Recent Activity */
        .recent-activity {
          background: white;
          border-radius: 0.75rem;
          box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
          padding: 1.5rem;
          margin-bottom: 2rem;
        }
        
        .section-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
          color: var(--dark-color);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .btn-primary {
          background-color: var(--primary-color);
          border: none;
          padding: 0.5rem 1.25rem;
          font-weight: 500;
        }
        
        .btn-primary:hover {
          background-color: var(--secondary-color);
          transform: translateY(-1px);
        }
        
        /* Responsive */
        @media (max-width: 992px) {
          .sidebar {
            transform: translateX(-100%);
          }
          
          .sidebar.show {
            transform: translateX(0);
          }
          
          .main-content {
            margin-left: 0;
          }
          
          .top-bar {
            padding-left: 1rem;
          }
        }
      </style>
    </head>
    <body>
      <!-- Sidebar -->
      <div class="sidebar">
        <a href="/" class="sidebar-brand d-flex align-items-center">
          <i class="fas fa-cubes me-2"></i>
          <span>Microservice App</span>
        </a>
        <div class="sidebar-menu">
          <div class="menu-title">MAIN MENU</div>
          <div class="menu-item">
            <a href="/" class="menu-link active">
              <i class="fas fa-home"></i>
              <span>Dashboard</span>
            </a>
          </div>
          <div class="menu-item">
            <a href="/products" class="menu-link">
              <i class="fas fa-box"></i>
              <span>Products</span>
            </a>
          </div>
          <div class="menu-item">
            <a href="/shipping" class="menu-link">
              <i class="fas fa-truck"></i>
              <span>Shipping</span>
            </a>
          </div>
          <div class="menu-title">ACCOUNT</div>
          <div class="menu-item">
            <a href="/profile" class="menu-link">
              <i class="fas fa-user"></i>
              <span>Profile</span>
            </a>
          </div>
          <div class="menu-item">
            <a href="/settings" class="menu-link">
              <i class="fas fa-cog"></i>
              <span>Settings</span>
            </a>
          </div>
          <div class="menu-item">
            <a href="/logout" class="menu-link text-danger">
              <i class="fas fa-sign-out-alt"></i>
              <span>Logout</span>
            </a>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="main-content">
        <!-- Top Bar -->
        <div class="top-bar">
          <h1 class="h3 mb-0">Dashboard</h1>
          
          <div class="user-menu dropdown">
            <a href="#" class="d-flex align-items-center text-decoration-none dropdown-toggle" id="userDropdown" data-bs-toggle="dropdown" aria-expanded="false">
              <div class="user-avatar">${userName ? userName.charAt(0).toUpperCase() : 'U'}</div>
              <div class="user-info d-none d-md-block">
                <div class="user-name">${user.name || 'User'}</div>
                <div class="user-email">${user.email || ''}</div>
              </div>
            </a>
            <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
              <li><a class="dropdown-item" href="/profile"><i class="fas fa-user me-2"></i> Profile</a></li>
              <li><a class="dropdown-item" href="/settings"><i class="fas fa-cog me-2"></i> Settings</a></li>
              <li><hr class="dropdown-divider"></li>
              <li><a class="dropdown-item text-danger" href="/logout"><i class="fas fa-sign-out-alt me-2"></i> Logout</a></li>
            </ul>
          </div>
        </div>
        
        <!-- Dashboard Cards -->
        <div class="dashboard-cards">
          <div class="card">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <div class="card-title">Total Products</div>
                  <div class="card-value">${totalProducts}</div>
                  <div class="text-success small"><i class="fas fa-arrow-up me-1"></i> &nbsp;</div>
                </div>
                <div class="card-icon primary">
                  <i class="fas fa-box"></i>
                </div>
              </div>
            </div>
          </div>
          <div class="card">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <div class="card-title">Active Orders</div>
                  <div class="card-value">${activeOrders}</div>
                  <div class="text-warning small"><i class="fas fa-arrow-up me-1"></i> &nbsp;</div>
                </div>
                <div class="card-icon success">
                  <i class="fas fa-shopping-cart"></i>
                </div>
              </div>
            </div>
          </div>
          <div class="card">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <div class="card-title">Total Revenue</div>
                  <div class="card-value">Rp${totalRevenue.toLocaleString('id-ID')}</div>
                  <div class="text-success small"><i class="fas fa-arrow-up me-1"></i> &nbsp;</div>
                </div>
                <div class="card-icon warning">
                  <i class="fas fa-dollar-sign"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- Recent Activity -->
        <div class="recent-activity">
          <div class="section-title">
            <span>Recent Activity</span>
            <a href="/activity" class="btn btn-sm btn-link">View All</a>
          </div>
          
          <div class="activity-list">
            ${activities.length === 0 ? `<div class="text-muted p-2">Belum ada aktivitas</div>` : activities.map(act => `
              <div class="activity-item">
                <div class="activity-icon bg-${act.type === 'product' ? 'primary' : act.type === 'profile' ? 'info' : act.type === 'settings' ? 'secondary' : act.type === 'login' ? 'success' : act.type === 'logout' ? 'danger' : 'dark'} bg-opacity-10 text-${act.type === 'product' ? 'primary' : act.type === 'profile' ? 'info' : act.type === 'settings' ? 'secondary' : act.type === 'login' ? 'success' : act.type === 'logout' ? 'danger' : 'dark'}">
                  <i class="fas ${act.type === 'product' ? 'fa-box' : act.type === 'profile' ? 'fa-user-edit' : act.type === 'settings' ? 'fa-cog' : act.type === 'login' ? 'fa-sign-in-alt' : act.type === 'logout' ? 'fa-sign-out-alt' : 'fa-info-circle'}"></i>
                </div>
                <div class="activity-details">
                  <div class="activity-title">${act.desc}</div>
                  <div class="activity-time">${act.time}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Bootstrap JS Bundle with Popper -->
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
      <script>
        // Enable tooltips
        var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
          return new bootstrap.Tooltip(tooltipTriggerEl);
        });
        
        // Toggle sidebar on mobile
        document.addEventListener('DOMContentLoaded', function() {
          const sidebar = document.querySelector('.sidebar');
          const sidebarToggle = document.querySelector('.sidebar-toggle');
          
          if (sidebarToggle) {
            sidebarToggle.addEventListener('click', function() {
              sidebar.classList.toggle('show');
            });
          }
          
          // Close sidebar when clicking outside
          document.addEventListener('click', function(event) {
            if (!sidebar.contains(event.target) && !event.target.matches('.sidebar-toggle')) {
              sidebar.classList.remove('show');
            }
          });
        });
      </script>
    </body>
    </html>
  `;
  
  res.send(html);
});

// Jalankan gateway di port 8080
app.listen(8080, () => {
  console.log('API Gateway berjalan di http://localhost:8080');
});
