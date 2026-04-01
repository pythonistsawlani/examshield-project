// Attempts Routes
const router = require('express').Router();
const db     = require('../config/db');
const { protect } = require('../middleware/authMiddleware');

/* POST /api/attempts/start — Start a new exam attempt */
router.post('/start', protect, async (req, res) => {
  try {
    const { examId } = req.body;
    if (!examId) return res.status(400).json({ message: 'examId required.' });

    // Get exam info
    const [[exam]] = await db.query('SELECT * FROM exams WHERE id = ? AND is_active = 1', [examId]);
    if (!exam) return res.status(404).json({ message: 'Exam not found or not active.' });

    // Check if student already has an unsubmitted attempt (ongoing)
    const [existing] = await db.query(
      'SELECT id, is_submitted FROM attempts WHERE user_id = ? AND exam_id = ? ORDER BY started_at DESC LIMIT 1',
      [req.user.id, examId]
    );

    // If their most recent attempt is NOT submitted, return it so they resume it
    if (existing.length > 0 && !existing[0].is_submitted) {
      return res.json({ attemptId: existing[0].id, exam });
    }

    // Schema has UNIQUE(user_id, exam_id): only one attempt row per user+exam.
    // If that row is already submitted, do not INSERT again (would duplicate key).
    const [[completed]] = await db.query(
      'SELECT id FROM attempts WHERE user_id = ? AND exam_id = ? AND is_submitted = 1 LIMIT 1',
      [req.user.id, examId]
    );
    if (completed) {
      return res.status(400).json({ message: 'You have already completed this exam.' });
    }

    // Otherwise (no attempt yet), CREATE a new attempt
    const [result] = await db.query(
      'INSERT INTO attempts (user_id, exam_id, started_at) VALUES (?, ?, NOW())',
      [req.user.id, examId]
    );
    return res.status(201).json({ attemptId: result.insertId, exam });
    
  } catch (err) {
    console.error('Attempt Start Error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
