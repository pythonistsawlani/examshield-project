// Attempts Routes
const router = require('express').Router();
const db     = require('../config/db');
const { protect } = require('../middleware/authMiddleware');

/* POST /api/attempts/start — Start or resume an exam attempt (respects max_attempts) */
router.post('/start', protect, async (req, res) => {
  try {
    const { examId } = req.body;
    if (!examId) return res.status(400).json({ message: 'examId required.' });

    const [[exam]] = await db.query(
      'SELECT * FROM exams WHERE id = ? AND is_active = 1',
      [examId]
    );
    if (!exam) return res.status(404).json({ message: 'Exam not found or not active.' });

    const maxAttempts = Math.max(1, Number(exam.max_attempts) || 3);

    const [ongoing] = await db.query(
      `SELECT id, is_submitted FROM attempts
       WHERE user_id = ? AND exam_id = ? AND is_submitted = 0
       ORDER BY started_at DESC LIMIT 1`,
      [req.user.id, examId]
    );
    if (ongoing.length > 0) {
      return res.json({ attemptId: ongoing[0].id, exam, maxAttempts });
    }

    const [[countRow]] = await db.query(
      `SELECT COUNT(*) AS completed FROM attempts
       WHERE user_id = ? AND exam_id = ? AND is_submitted = 1`,
      [req.user.id, examId]
    );
    const completed = Number(countRow?.completed) || 0;

    if (completed >= maxAttempts) {
      return res.status(403).json({
        message: 'No more attempts allowed for this exam.',
        attemptsUsed: completed,
        maxAttempts,
      });
    }

    const [result] = await db.query(
      'INSERT INTO attempts (user_id, exam_id, started_at) VALUES (?, ?, NOW())',
      [req.user.id, examId]
    );
    return res.status(201).json({
      attemptId: result.insertId,
      exam,
      maxAttempts,
      attemptsUsed: completed,
    });
  } catch (err) {
    console.error('Attempt Start Error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
