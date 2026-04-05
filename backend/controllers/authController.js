// Auth Controller — handles register, login, profile
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const db     = require('../config/db');

/* ── Generate JWT Token ── */
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/* ── REGISTER ──
   POST /api/auth/register
   Body: { name, email, password, role }
*/
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    // Security Fix: Hardcode role to 'student'. Admin creation must be done via DB manually.
    const role = 'student';

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }

    // Check if email already exists
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email already registered.' });
    }

    // Hash password (salt rounds = 12)
    const passwordHash = await bcrypt.hash(password, 12);

    // Insert user
    const [result] = await db.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, passwordHash, role]
    );

    res.status(201).json({
      message: 'Account created successfully.',
      userId: result.insertId,
    });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed.', error: err.message });
  }
};

/* ── LOGIN ──
   POST /api/auth/login
   Body: { email, password, role }
*/
const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Find user by email and role
    const query = role
      ? 'SELECT * FROM users WHERE email = ? AND role = ?'
      : 'SELECT * FROM users WHERE email = ?';
    const params = role ? [email, role] : [email];
    const [users] = await db.query(query, params);

    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials or wrong role selected.' });
    }

    const user = users[0];

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Generate JWT
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined in environment variables.');
    }
    const token = generateToken(user);

    res.json({
      message: 'Login successful.',
      token,
      user: {
        id:    user.id,
        name:  user.name,
        email: user.email,
        role:  user.role,
      },
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ 
      message: `Login failed: ${err.message}`, 
      error: err.stack 
    });
  }
};

/* ── GET PROFILE ──
   GET /api/auth/me (protected)
*/
const getMe = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'User not found.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching profile.', error: err.message });
  }
};

/* ── FORGOT PASSWORD ── */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const [users] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      // Return 200 anyway to prevent user enumeration
      return res.json({ message: 'If this email exists, a reset token has been generated.' });
    }

    // Generate secure token
    const resetToken = crypto.randomBytes(32).toString('hex');
    // Hash token before saving to database (for security if DB is compromised)
    const hash = crypto.createHash('sha256').update(resetToken).digest('hex');
    // Expires in 15 minutes
    const expires = new Date(Date.now() + 15 * 60 * 1000); 

    // Save to DB (Format Date for MySQL)
    const mysqlFormattedDate = expires.toISOString().slice(0, 19).replace('T', ' ');
    await db.query(
      'UPDATE users SET reset_token = ?, reset_expires = ? WHERE email = ?',
      [hash, mysqlFormattedDate, email]
    );

    // IMPORTANT: For presentation purposes (no SMTP server), we will log the token 
    // and return it so the frontend can mock an email link scenario.
    const mockResetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    console.log(`\x1b[36m[MAIL MOCK]\x1b[0m Reset Link for ${email}: \n► ${mockResetLink}`);

    res.json({ 
      message: 'If this email exists, a reset token has been generated.',
      mockTokenForPresentation: resetToken // Only doing this because we lack SMTP!
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to process forgot password.', error: err.message });
  }
};

/* ── RESET PASSWORD ──
   Token flow: { token, newPassword } (from forgot-password email link)
   Mock flow (no SMTP): { email, newPassword } — direct update until email is wired */
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword, email } = req.body;

    if (!newPassword || String(newPassword).length < 6) {
      return res.status(400).json({ message: 'New password is required (min 6 characters).' });
    }

    // Mock / direct reset by email (no token)
    if (email && !token) {
      const [users] = await db.query('SELECT id FROM users WHERE email = ?', [email.trim()]);
      if (users.length === 0) {
        return res.status(404).json({ message: 'No account found with that email.' });
      }
      const passwordHash = await bcrypt.hash(newPassword, 12);
      await db.query(
        'UPDATE users SET password_hash = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?',
        [passwordHash, users[0].id]
      );
      return res.json({ message: 'Password has been reset successfully.' });
    }

    if (!token) {
      return res.status(400).json({ message: 'Provide token (and newPassword) or email (and newPassword) for mock reset.' });
    }

    const hash = crypto.createHash('sha256').update(token).digest('hex');

    const [users] = await db.query(
      'SELECT id, email FROM users WHERE reset_token = ? AND reset_expires > NOW()',
      [hash]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: 'Token is invalid or has expired.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await db.query(
      'UPDATE users SET password_hash = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?',
      [passwordHash, users[0].id]
    );

    res.json({ message: 'Password has been reset successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to reset password.', error: err.message });
  }
};

module.exports = { register, login, getMe, forgotPassword, resetPassword };
