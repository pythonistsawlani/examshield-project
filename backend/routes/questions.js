// Questions Routes
const router = require('express').Router();
const db     = require('../config/db');
const { protect, isAdmin } = require('../middleware/authMiddleware');

/* POST /api/questions — Add question (Admin only) */
router.post('/', protect, isAdmin, async (req, res) => {
  try {
    const { exam_id, question_text, option_a, option_b, option_c, option_d, correct_answer } = req.body;
    if (!exam_id || !question_text || !option_a || !option_b || !option_c || !option_d || !correct_answer) {
      return res.status(400).json({ message: 'All fields required.' });
    }
    if (!['A','B','C','D'].includes(correct_answer)) {
      return res.status(400).json({ message: 'correct_answer must be A, B, C, or D.' });
    }
    const [result] = await db.query(
      'INSERT INTO questions (exam_id, question_text, option_a, option_b, option_c, option_d, correct_answer) VALUES (?,?,?,?,?,?,?)',
      [exam_id, question_text, option_a, option_b, option_c, option_d, correct_answer]
    );
    res.status(201).json({ message: 'Question added.', questionId: result.insertId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* GET /api/questions/exam/:examId — Get all questions for an exam (Admin) */
router.get('/exam/:examId', protect, isAdmin, async (req, res) => {
  try {
    const [questions] = await db.query(
      'SELECT * FROM questions WHERE exam_id = ? ORDER BY id',
      [req.params.examId]
    );
    res.json(questions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* PUT /api/questions/:id — Update question (Admin) */
router.put('/:id', protect, isAdmin, async (req, res) => {
  try {
    const { question_text, option_a, option_b, option_c, option_d, correct_answer } = req.body;
    
    if (!question_text || !option_a || !option_b || !option_c || !option_d || !correct_answer) {
      return res.status(400).json({ message: 'All fields required.' });
    }
    if (!['A','B','C','D'].includes(correct_answer)) {
      return res.status(400).json({ message: 'correct_answer must be A, B, C, or D.' });
    }

    await db.query(
      'UPDATE questions SET question_text=?, option_a=?, option_b=?, option_c=?, option_d=?, correct_answer=? WHERE id=?',
      [question_text, option_a, option_b, option_c, option_d, correct_answer, req.params.id]
    );

    res.json({ message: 'Question updated successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* DELETE /api/questions/:id — Delete question (Admin) */
router.delete('/:id', protect, isAdmin, async (req, res) => {
  try {
    await db.query('DELETE FROM questions WHERE id = ?', [req.params.id]);
    res.json({ message: 'Question deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
