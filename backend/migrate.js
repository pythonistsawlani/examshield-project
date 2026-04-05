// Migration script to update MySQL schema
const db = require('./config/db');

async function migrate() {
  try {
    console.log('Running ALTER TABLE (users reset columns)...');
    await db.query(`ALTER TABLE users 
                    ADD COLUMN reset_token VARCHAR(255) DEFAULT NULL,
                    ADD COLUMN reset_expires DATETIME DEFAULT NULL;`);
    console.log('✅ Users columns OK.');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('✅ Users reset columns already exist.');
    } else {
      console.error('❌ Migration error:', err.message);
    }
  }

  try {
    console.log('Adding exams.max_attempts...');
    await db.query(
      'ALTER TABLE exams ADD COLUMN max_attempts INT NOT NULL DEFAULT 3 AFTER pass_marks'
    );
    console.log('✅ max_attempts added.');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('✅ max_attempts already exists.');
    } else {
      console.error('❌ max_attempts migration:', err.message);
    }
  }

  try {
    console.log('Dropping attempts UNIQUE (user_id, exam_id) for retakes...');
    await db.query('ALTER TABLE attempts DROP INDEX uq_attempt');
    console.log('✅ Unique constraint dropped.');
  } catch (err) {
    if (err.code === 'ER_CANT_DROP_FIELD_OR_KEY' || err.errno === 1091) {
      console.log('✅ uq_attempt already removed or missing.');
    } else {
      console.error('❌ attempts index migration:', err.message);
    }
  }

  try {
    await db.query(
      'ALTER TABLE attempts ADD INDEX idx_user_exam (user_id, exam_id)'
    );
    console.log('✅ idx_user_exam ensured.');
  } catch (err) {
    if (err.code === 'ER_DUP_KEYNAME') {
      console.log('✅ idx_user_exam already exists.');
    } else {
      console.error('❌ idx_user_exam:', err.message);
    }
  } finally {
    process.exit(0);
  }
}

migrate();
