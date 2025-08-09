#!/usr/bin/env node
/**
 * Test suite for FileOperations domain - Basic CRUD operations
 * Tests file creation, retrieval, and deletion
 */

import { getTestDbAgent, TestFixtures, cleanupTestData } from '../test-helpers/db-setup.js';

export async function runFileOperationsBasicTests() {
  let dbAgent;
  let testResults = {
    passed: 0,
    failed: 0,
    tests: []
  };

  function logTest(name, passed, message = '') {
    const status = passed ? '✅' : '❌';
    console.log(`  ${status} ${name}${message ? ' - ' + message : ''}`);
    testResults.tests.push({ name, passed, message });
    if (passed) testResults.passed++;
    else testResults.failed++;
  }

  try {
    console.log('🧪 Running FileOperations Basic Tests\n');
    
    dbAgent = await getTestDbAgent();
    const testClient = await TestFixtures.createTestClient(dbAgent);
    const clientId = testClient.id;

    // Test 1: Create File
    console.log('📝 Testing createFile()');
    let testFileId;
    try {
      const fileData = {
        filename: 'test_file_' + Date.now() + '.txt',
        file_type: 'text/plain',
        file_size: 1024,
        source_type: 'upload',
        client_id: clientId,
        metadata: { test: true }
      };
      
      const file = await dbAgent.files.createFile(fileData);
      testFileId = file.id;
      
      logTest('createFile() returns file object', !!file);
      logTest('createFile() includes id', !!file.id);
      logTest('createFile() includes created_at', !!file.created_at);
      logTest('createFile() preserves metadata', file.metadata?.test === true);
      
    } catch (error) {
      logTest('createFile()', false, error.message);
    }

    // Test 2: Get File by ID
    console.log('\n🔍 Testing getFileById()');
    try {
      const file = await dbAgent.files.getFileById(testFileId);
      
      logTest('getFileById() finds existing file', !!file);
      logTest('getFileById() returns correct id', file.id === testFileId);
      logTest('getFileById() includes metadata', !!file.metadata);
      
      const notFound = await dbAgent.files.getFileById('00000000-0000-0000-0000-000000000000');
      logTest('getFileById() returns null for non-existent', notFound === null);
      
    } catch (error) {
      logTest('getFileById()', false, error.message);
    }

    // Test 3: Get Client Files
    console.log('\n📂 Testing getClientFiles()');
    try {
      // Create another test file
      await dbAgent.files.createFile({
        filename: 'test_file_2_' + Date.now() + '.txt',
        file_type: 'text/plain',
        file_size: 2048,
        source_type: 'text-input',
        client_id: clientId,
        metadata: { test: true }
      });
      
      const files = await dbAgent.files.getClientFiles(clientId);
      
      logTest('getClientFiles() returns array', Array.isArray(files));
      logTest('getClientFiles() finds client files', files.length >= 2);
      logTest('getClientFiles() includes chunk_count', 
        files.length > 0 && typeof files[0].chunk_count === 'string');
      
      // Test with source type filter
      const uploadFiles = await dbAgent.files.getClientFiles(clientId, ['upload']);
      logTest('getClientFiles() filters by source type', 
        uploadFiles.every(f => f.source_type === 'upload'));
      
    } catch (error) {
      logTest('getClientFiles()', false, error.message);
    }

    // Test 4: Delete File
    console.log('\n🗑️ Testing deleteFile()');
    try {
      const fileToDelete = await dbAgent.files.createFile({
        filename: 'test_delete_' + Date.now() + '.txt',
        file_type: 'text/plain',
        file_size: 512,
        source_type: 'upload',
        client_id: clientId,
        metadata: { test: true, toDelete: true }
      });
      
      const deleteResult = await dbAgent.files.deleteFile(fileToDelete.id, clientId);
      
      logTest('deleteFile() returns deletion result', !!deleteResult);
      logTest('deleteFile() includes file info', !!deleteResult.file);
      logTest('deleteFile() removes file from database', 
        (await dbAgent.files.getFileById(fileToDelete.id)) === null);
      
    } catch (error) {
      logTest('deleteFile()', false, error.message);
    }

    // Test 5: Access Control
    console.log('\n🔒 Testing access control');
    try {
      const protectedFile = await dbAgent.files.createFile({
        filename: 'protected_' + Date.now() + '.txt',
        file_type: 'text/plain',
        file_size: 256,
        source_type: 'upload',
        client_id: clientId,
        metadata: { test: true }
      });
      
      // Try to delete with wrong client ID
      try {
        await dbAgent.files.deleteFile(protectedFile.id, 99999);
        logTest('deleteFile() enforces client access control', false);
      } catch (error) {
        logTest('deleteFile() enforces client access control', 
          error.message.includes('not found') || error.message.includes('denied'));
      }
      
      // Try to delete with wrong source type
      try {
        await dbAgent.files.deleteFile(protectedFile.id, clientId, ['system']);
        logTest('deleteFile() enforces source type restrictions', false);
      } catch (error) {
        logTest('deleteFile() enforces source type restrictions', 
          error.message.includes('not found') || error.message.includes('denied'));
      }
      
    } catch (error) {
      logTest('Access control', false, error.message);
    }

    return testResults;

  } catch (error) {
    console.error('❌ Test suite error:', error);
    return testResults;
  } finally {
    if (dbAgent) {
      await cleanupTestData(dbAgent);
      await dbAgent.close();
    }
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runFileOperationsBasicTests().then(results => {
    console.log(`\n📊 Basic Test Results:`);
    console.log(`   ✅ Passed: ${results.passed}`);
    console.log(`   ❌ Failed: ${results.failed}`);
    console.log(`   📈 Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`);
    process.exit(results.failed > 0 ? 1 : 0);
  });
}