const bcrypt = require('bcryptjs');
const db = require('./config/db');

async function createSuperAdmin() {
  try {
    const name = 'Master Admin';
    const email = 'superadmin@examshield.com';
    const password = 'superadmin123';
    const role = 'admin';

    // Check if exists
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      console.log('✅ Master Admin already exists!');
      process.exit(0);
    }

    // Hash and insert
    const passwordHash = await bcrypt.hash(password, 12);
    await db.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, passwordHash, role]
    );

    console.log('✅ SUCCESS: New Master Admin Created!');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
  } catch (err) {
    console.error('❌ Error creating admin:', err.message);
  } finally {
    process.exit(0);
  }
}

createSuperAdmin();
