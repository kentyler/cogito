require('dotenv').config();
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

async function updateUserPassword() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    // Generate hash for password "7297"
    const password = '7297';
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    console.log('Generated password hash:', passwordHash);
    
    // Update user ID 1 with the hashed password
    const result = await pool.query(
      'UPDATE client_mgmt.users SET password_hash = $1 WHERE user_id = 1 RETURNING user_id, email',
      [passwordHash]
    );
    
    if (result.rows.length > 0) {
      console.log('✅ Password updated for user:', result.rows[0]);
      console.log('📧 Email:', result.rows[0].email);
      console.log('🔑 Password: 7297');
    } else {
      console.log('❌ User ID 1 not found');
    }
    
  } catch (error) {
    console.error('Error updating password:', error);
  } finally {
    await pool.end();
  }
}

updateUserPassword();