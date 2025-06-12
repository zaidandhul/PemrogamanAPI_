const jwt = require('jsonwebtoken');

exports.authenticate = (req, res, next) => {
  try {
    // Ambil token dari header Authorization (Bearer <token>) atau x-auth-token
    let token = null;
    const authHeader = req.header('Authorization') || req.header('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.header('x-auth-token')) {
      token = req.header('x-auth-token');
    }

    // Check if no token
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    
    // Add user from payload
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Authentication error:', err);
    res.status(401).json({ message: 'Token is not valid' });
  }
};
