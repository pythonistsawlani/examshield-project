const bcrypt = require('bcryptjs');
const db = require('./config/db');

async function seedAdmin() {
  try {
    const name = 'System Admin';
    const email = 'admin@examshield.com';
    const password = 'admin@123';
    const role = 'admin';

    console.log('🔄 Seeding Admin account...');

    // Check if exists
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    
    // Hash the password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    if (existing.length > 0) {
      console.log(`ℹ️ User ${email} already exists. Updating password...`);
      await db.query(
        'UPDATE users SET name = ?, password_hash = ?, role = ? WHERE email = ?',
        [name, passwordHash, role, email]
      );
    } else {
      console.log(`🆕 Creating new admin: ${email}`);
      await db.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [name, email, passwordHash, role]
      );
    }

    console.log('\n✅ SUCCESS: Admin Seeding Complete!');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`🛡️ Role: ${role}\n`);
    
  } catch (err) {
    console.error('❌ Error seeding admin:', err.message);
  } finally {
    process.exit(0);
  }
}

seedAdmin();
