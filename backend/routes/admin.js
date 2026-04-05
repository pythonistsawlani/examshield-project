// Admin Stats Route
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const db     = require('../config/db');
const { protect, isAdmin } = require('../middleware/authMiddleware');

/* GET /api/admin/stats — Dashboard stats for admin */
router.get('/stats', protect, isAdmin, async (req, res) => {
  try {
    const [[{ totalStudents }]]  = await db.query("SELECT COUNT(*) AS totalStudents FROM users WHERE role='student'");
    const [[{ activeExams }]]    = await db.query("SELECT COUNT(*) AS activeExams FROM exams WHERE is_active=1");
    const [[{ totalQuestions }]] = await db.query("SELECT COUNT(*) AS totalQuestions FROM questions");
    const [[{ avgPassRate }]]    = await db.query("SELECT ROUND(AVG(CASE WHEN percentage >= 60 THEN 1 ELSE 0 END)*100, 1) AS avgPassRate FROM results");

    res.json({ totalStudents, activeExams, totalQuestions, avgPassRate: avgPassRate || 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* GET /api/admin/students — List all students */
router.get('/students', protect, isAdmin, async (req, res) => {
  try {
    const [students] = await db.query(
      "SELECT id, name, email, department, is_active, created_at FROM users WHERE role='student' ORDER BY created_at DESC"
    );
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* GET /api/admin/all-results — Recent exam results (all students) */
router.get('/all-results', protect, isAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.id, r.score, r.percentage, r.\`rank\`, r.created_at,
              u.name AS student_name, u.email AS student_email,
              e.id AS exam_id, e.title AS exam_title
       FROM results r
       JOIN users u ON u.id = r.user_id
       JOIN exams e ON e.id = r.exam_id
       ORDER BY r.created_at DESC
       LIMIT 200`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* POST /api/admin/create — Create another admin (admin only) */
router.post('/create', protect, isAdmin, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email, and password are required.' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email.trim()]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email already registered.' });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const [result] = await db.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name.trim(), email.trim(), passwordHash, 'admin']
    );
    res.status(201).json({ message: 'Admin account created.', userId: result.insertId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* POST /api/admin/change-password — Current admin changes own password */
router.post('/change-password', protect, isAdmin, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'oldPassword and newPassword are required.' });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters.' });
    }
    const [rows] = await db.query('SELECT id, password_hash FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'User not found.' });
    const ok = await bcrypt.compare(oldPassword, rows[0].password_hash);
    if (!ok) return res.status(401).json({ message: 'Current password is incorrect.' });
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, req.user.id]);
    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
