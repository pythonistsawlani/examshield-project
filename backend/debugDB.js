const db = require('./config/db');

async function test() {
  try {
    const [exams] = await db.query('SELECT id, title FROM exams');
    console.log('--- EXAMS ---');
    console.log(exams);

    const [questions] = await db.query('SELECT id, exam_id, question_text FROM questions');
    console.log('--- QUESTIONS COUNT BY EXAM ---');
    const counts = {};
    questions.forEach(q => {
      counts[q.exam_id] = (counts[q.exam_id] || 0) + 1;
    });
    console.log(counts);
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
test();
