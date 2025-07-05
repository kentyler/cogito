const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://user:password@host/database',
  ssl: { rejectUnauthorized: false }
});

async function updatePassword() {
  try {
    await client.connect();
    
    // Update password using PostgreSQL's crypt function with gen_salt
    const updateQuery = `
      UPDATE client_mgmt.users 
      SET password_hash = crypt('7297', gen_salt('bf'))
      WHERE email = 'ken@8thfold.com'
      RETURNING email, id;
    `;
    
    const result = await client.query(updateQuery);
    
    if (result.rows.length > 0) {
      console.log('Password updated successfully for:', result.rows[0].email);
      
      // Verify the update worked
      const verifyQuery = `
        SELECT email 
        FROM client_mgmt.users 
        WHERE email = 'ken@8thfold.com' 
        AND password_hash = crypt('7297', password_hash)
      `;
      
      const verify = await client.query(verifyQuery);
      if (verify.rows.length > 0) {
        console.log('Password verification successful!');
      } else {
        console.log('Warning: Password verification failed');
      }
    } else {
      console.log('No user found with email ken@8thfold.com');
    }
    
    await client.end();
  } catch (err) {
    console.error('Error updating password:', err);
    await client.end();
  }
}

updatePassword();