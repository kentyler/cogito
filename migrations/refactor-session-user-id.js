#!/usr/bin/env node

/**
 * Refactor Session User ID
 * Updates all files to use user_id consistently instead of the fallback pattern
 */

import fs from 'fs/promises';
import path from 'path';

const filesToUpdate = [
  // Files using fallback pattern (user_id || id)
  {
    path: 'server/routes/auth/middleware.js',
    updates: [
      {
        old: 'id: req.session.user.user_id || req.session.user.id,',
        new: 'id: req.session.user.user_id,'
      }
    ]
  },
  {
    path: 'server/routes/bots-management.js', 
    updates: [
      {
        old: 'const user_id = req.session.user.user_id || req.session.user.id;',
        new: 'const user_id = req.session.user.user_id;'
      }
    ]
  },
  {
    path: 'server/routes/bots-create.js',
    updates: [
      {
        old: 'const user_id = req.session.user.user_id || req.session.user.id;',
        new: 'const user_id = req.session.user.user_id;'
      }
    ]
  },
  {
    path: 'server/routes/conversations/meeting-manager.js',
    updates: [
      {
        old: 'userId: req.session.user.user_id || req.session.user.id,',
        new: 'userId: req.session.user.user_id,'
      }
    ]
  },
  // Files that set both fields - remove the duplicate
  {
    path: 'server/routes/auth/login.js',
    updates: [
      {
        old: `    req.session.user = {
      user_id: user.id,
      id: user.id,  // Some code uses .id
      email: user.email,
      client_id: client.client_id,
      client_name: client.client_name,
      role: client.role
    };`,
        new: `    req.session.user = {
      user_id: user.id,
      email: user.email,
      client_id: client.client_id,
      client_name: client.client_name,
      role: client.role
    };`
      }
    ]
  },
  {
    path: 'server/auth/client-session-manager.js',
    updates: [
      {
        old: `    req.session.user = {
      user_id: userId,
      id: userId,  // Some code uses .id
      email: email,
      client_id: client.client_id,
      client_name: client.client_name,
      role: client.role
    };`,
        new: `    req.session.user = {
      user_id: userId,
      email: email,
      client_id: client.client_id,
      client_name: client.client_name,
      role: client.role
    };`
      }
    ]
  }
];

async function updateFile(fileInfo) {
  const filePath = path.join(process.cwd(), fileInfo.path);
  
  try {
    let content = await fs.readFile(filePath, 'utf8');
    let modified = false;
    
    for (const update of fileInfo.updates) {
      if (content.includes(update.old)) {
        content = content.replace(update.old, update.new);
        modified = true;
        console.log(`✅ Updated: ${fileInfo.path}`);
      } else {
        console.log(`⚠️  Pattern not found in: ${fileInfo.path}`);
        console.log(`   Looking for: "${update.old.substring(0, 50)}..."`);
      }
    }
    
    if (modified) {
      await fs.writeFile(filePath, content, 'utf8');
    }
    
    return modified;
  } catch (error) {
    console.error(`❌ Error updating ${fileInfo.path}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🔧 Starting Session User ID Refactoring...\n');
  
  let successCount = 0;
  let totalFiles = filesToUpdate.length;
  
  for (const fileInfo of filesToUpdate) {
    const success = await updateFile(fileInfo);
    if (success) successCount++;
  }
  
  console.log(`\n📊 Refactoring Complete:`);
  console.log(`   ✅ Successfully updated: ${successCount}/${totalFiles} files`);
  
  if (successCount === totalFiles) {
    console.log('\n🎉 All files updated successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Restart the server to test the changes');
    console.log('2. Clear any existing sessions in Redis/session store');
    console.log('3. Test login and client selection flows');
  } else {
    console.log('\n⚠️  Some files could not be updated automatically.');
    console.log('Please review and update them manually.');
  }
}

main().catch(console.error);