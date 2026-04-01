// Migration script to update MySQL schema
const db = require('./config/db');

async function migrate() {
  try {
    // Add columns, ignore duplicate column errors if they already exist
    console.log('Running ALTER TABLE...');
    await db.query(`ALTER TABLE users 
                    ADD COLUMN reset_token VARCHAR(255) DEFAULT NULL,
                    ADD COLUMN reset_expires DATETIME DEFAULT NULL;`);
    console.log('✅ Columns added successfully.');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('✅ Columns already exist.');
    } else {
      console.error('❌ Migration error:', err.message);
    }
  } finally {
    process.exit(0);
  }
}

migrate();
