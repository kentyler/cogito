const bcrypt = require('bcrypt');

async function testPassword() {
  const password = 'harmony';
  const hash = process.argv[2];
  
  if (!hash) {
    console.log('Usage: node test-password.js <hash>');
    console.log('Example: node test-password.js \'$2b$12$...\' ');
    return;
  }
  
  console.log('Testing password:', password);
  console.log('Against hash:', hash);
  console.log('Hash length:', hash.length);
  
  try {
    const match = await bcrypt.compare(password, hash);
    console.log('Match result:', match);
    
    // Also generate a new hash for comparison
    const newHash = await bcrypt.hash(password, 12);
    console.log('\nNew hash for "harmony":', newHash);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testPassword();