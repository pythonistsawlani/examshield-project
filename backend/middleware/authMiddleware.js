// JWT Authentication Middleware
const jwt = require('jsonwebtoken');

/*
  Protects routes — verifies JWT token from Authorization header.
  Usage: router.get('/protected', protect, handler)
  Optional role check: router.get('/admin-only', protect, isAdmin, handler)
*/
const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Check if header exists and starts with 'Bearer'
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided. Access denied.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verify token with secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user info to request
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

// Admin-only middleware — use after protect
const isAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }
  next();
};

// Student-only middleware
const isStudent = (req, res, next) => {
  if (req.user?.role !== 'student') {
    return res.status(403).json({ message: 'Access denied. Students only.' });
  }
  next();
};

module.exports = { protect, isAdmin, isStudent };
