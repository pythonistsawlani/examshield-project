// Admin Stats Route
const router = require('express').Router();
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

module.exports = router;
