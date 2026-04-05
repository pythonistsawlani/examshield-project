// Exams Routes — CRUD for exam management
const router  = require('express').Router();
const db      = require('../config/db');
const { protect, isAdmin } = require('../middleware/authMiddleware');

/* GET /api/exams — List all active exams */
router.get('/', protect, async (req, res) => {
  try {
    const [exams] = await db.query(
      `SELECT e.*, COUNT(q.id) AS question_count
       FROM exams e
       LEFT JOIN questions q ON q.exam_id = e.id
       WHERE e.is_active = 1
       GROUP BY e.id
       ORDER BY e.created_at DESC`
    );
    res.json(exams);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* POST /api/exams — Create exam (Admin only) */
router.post('/', protect, isAdmin, async (req, res) => {
  try {
    const { title, subject, duration, total_marks, description, max_attempts } = req.body;
    if (!title || !duration || !total_marks) {
      return res.status(400).json({ message: 'Title, duration and total_marks required.' });
    }
    const maxAttempts = max_attempts != null ? Math.max(1, Number(max_attempts)) : 3;
    const [result] = await db.query(
      `INSERT INTO exams (title, subject, duration, total_marks, description, max_attempts, created_by)
       VALUES (?,?,?,?,?,?,?)`,
      [title, subject || null, duration, total_marks, description || null, maxAttempts, req.user.id]
    );
    res.status(201).json({ message: 'Exam created.', examId: result.insertId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* PUT /api/exams/:id — Update exam (Admin only) */
router.put('/:id', protect, isAdmin, async (req, res) => {
  try {
    const { title, subject, duration, total_marks, description, is_active, max_attempts } = req.body;
    const maxAttempts = max_attempts != null ? Math.max(1, Number(max_attempts)) : undefined;
    if (maxAttempts !== undefined) {
      await db.query(
        `UPDATE exams SET title=?, subject=?, duration=?, total_marks=?, description=?, is_active=?, max_attempts=? WHERE id=?`,
        [title, subject, duration, total_marks, description, is_active ?? 1, maxAttempts, req.params.id]
      );
    } else {
      await db.query(
        'UPDATE exams SET title=?, subject=?, duration=?, total_marks=?, description=?, is_active=? WHERE id=?',
        [title, subject, duration, total_marks, description, is_active ?? 1, req.params.id]
      );
    }
    res.json({ message: 'Exam updated.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* DELETE /api/exams/:id — Delete exam (Admin only) */
router.delete('/:id', protect, isAdmin, async (req, res) => {
  try {
    await db.query('DELETE FROM exams WHERE id = ?', [req.params.id]);
    res.json({ message: 'Exam deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* GET /api/exams/:id/questions — Randomized questions for an exam */
router.get('/:id/questions', protect, async (req, res) => {
  try {
    const [questions] = await db.query(
      `SELECT id, question_text, option_a, option_b, option_c, option_d
       FROM questions WHERE exam_id = ?
       ORDER BY RAND()`,  // Randomize question order
      [req.params.id]
    );
    res.json(questions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
