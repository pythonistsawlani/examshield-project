// Results Routes
const router = require('express').Router();
const db     = require('../config/db');
const { protect } = require('../middleware/authMiddleware');

/* POST /api/results/submit — Submit exam, calculate score */
router.post('/submit', protect, async (req, res) => {
  try {
    const { attemptId, answers } = req.body; // answers: { questionId: 'A', ... }

    if (!attemptId || !answers) {
      return res.status(400).json({ message: 'attemptId and answers are required.' });
    }

    // Get attempt info
    const [[attempt]] = await db.query(
      'SELECT * FROM attempts WHERE id = ? AND user_id = ?',
      [attemptId, req.user.id]
    );
    if (!attempt) return res.status(404).json({ message: 'Attempt not found.' });
    if (attempt.is_submitted) return res.status(400).json({ message: 'Exam already submitted.' });

    // Get all questions with correct answers
    const [questions] = await db.query(
      'SELECT id, correct_answer FROM questions WHERE exam_id = ?',
      [attempt.exam_id]
    );

    // Calculate score
    let correct = 0, wrong = 0, skipped = 0;
    for (const q of questions) {
      const given = answers[q.id] ?? answers[String(q.id)];
      if (!given)                       skipped++;
      else if (given === q.correct_answer) correct++;
      else                              wrong++;
    }

    // Get exam total marks
    const [[exam]] = await db.query('SELECT total_marks FROM exams WHERE id = ?', [attempt.exam_id]);
    const marksPerQ  = exam.total_marks / questions.length;
    const score      = Math.round(correct * marksPerQ);
    const percentage = Math.round((score / exam.total_marks) * 100);

    // Mark attempt as submitted
    await db.query(
      'UPDATE attempts SET is_submitted=1, submitted_at=NOW(), answers=? WHERE id=?',
      [JSON.stringify(answers), attemptId]
    );

    // Insert result
    const [inserted] = await db.query(
      'INSERT INTO results (attempt_id, user_id, exam_id, score, percentage, correct, wrong, skipped) VALUES (?,?,?,?,?,?,?,?)',
      [attemptId, req.user.id, attempt.exam_id, score, percentage, correct, wrong, skipped]
    );

    // Calculate rank for this exam
    const [[rankRow]] = await db.query(
      `SELECT COUNT(*) + 1 AS \`rank\` FROM results WHERE exam_id = ? AND score > ?`,
      [attempt.exam_id, score]
    );
    await db.query('UPDATE results SET `rank`=? WHERE id=?', [rankRow.rank, inserted.insertId]);

    res.json({ message: 'Exam submitted.', resultId: inserted.insertId, score, percentage, correct, wrong, skipped });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* GET /api/results/my — Get current user's results */
router.get('/my', protect, async (req, res) => {
  try {
    const [results] = await db.query(
      `SELECT r.*, e.title AS exam_title FROM results r
       JOIN exams e ON e.id = r.exam_id
       WHERE r.user_id = ?
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* GET /api/results/leaderboard — Global leaderboard
   MUST be registered before /:id or Express will treat "leaderboard" as an id. */
router.get('/leaderboard', protect, async (req, res) => {
  try {
    const rawExam = req.query.examId;
    const examId =
      rawExam != null && rawExam !== '' && !Number.isNaN(Number(rawExam))
        ? Number(rawExam)
        : null;
    const query = examId
      ? `SELECT u.id AS user_id, u.name, u.department,
              MAX(r.score) AS score, MAX(r.percentage) AS accuracy, MIN(r.\`rank\`) AS \`rank\`
         FROM results r JOIN users u ON u.id = r.user_id
         WHERE r.exam_id = ?
         GROUP BY u.id ORDER BY score DESC LIMIT 50`
      : `SELECT u.id AS user_id, u.name, u.department,
              SUM(r.score) AS score, AVG(r.percentage) AS accuracy
         FROM results r JOIN users u ON u.id = r.user_id
         GROUP BY u.id ORDER BY score DESC LIMIT 50`;
    const params = examId ? [examId] : [];
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* GET /api/results/:id — Get specific result with answer review */
router.get('/:id', protect, async (req, res) => {
  try {
    const [[result]] = await db.query(
      `SELECT r.*, e.title AS exam_title, e.total_marks, a.answers AS submitted_answers
       FROM results r
       JOIN exams e ON e.id = r.exam_id
       JOIN attempts a ON a.id = r.attempt_id
       WHERE r.id = ? AND r.user_id = ?`,
      [req.params.id, req.user.id]
    );
    if (!result) return res.status(404).json({ message: 'Result not found.' });

    // Get questions for review
    const [questions] = await db.query(
      'SELECT id, question_text, option_a, option_b, option_c, option_d, correct_answer FROM questions WHERE exam_id = ?',
      [result.exam_id]
    );

    const submittedAnswers = JSON.parse(result.submitted_answers || '{}');
    const answers = questions.map(q => ({
      question_text:  q.question_text,
      your_answer:    submittedAnswers[q.id] ?? submittedAnswers[String(q.id)] ?? null,
      correct_answer: q.correct_answer,
      is_correct:     (submittedAnswers[q.id] ?? submittedAnswers[String(q.id)]) === q.correct_answer,
    }));

    res.json({ ...result, answers });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
