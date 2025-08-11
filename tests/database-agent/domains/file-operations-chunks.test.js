#!/usr/bin/env node
/**
 * FileOperations Chunk tests - creation, retrieval, statistics
 */

import { getTestDbAgent, TestFixtures, cleanupTestData } from '../test-helpers/db-setup.js';

export async function runFileOperationsChunksTests() {
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
    console.log('🧪 Running FileOperations Chunks Tests\n');
    
    dbAgent = await getTestDbAgent();
    const testClient = await TestFixtures.createTestClient(dbAgent);
    const clientId = testClient.id;

    // Create a test file for chunk operations
    const testFile = await dbAgent.files.createFile({
      filename: 'chunked_file_' + Date.now() + '.txt',
      file_type: 'text/plain',
      file_size: 10240,
      source_type: 'upload',
      client_id: clientId,
      metadata: { test: true, chunked: true }
    });
    const fileId = testFile.id;

    // Test 1: Create Chunks
    console.log('📝 Testing createChunk()');
    try {
      const chunk1 = await dbAgent.files.createChunk({
        file_id: fileId,
        chunk_index: 0,
        content: 'This is the first chunk of content.',
        metadata: { test: true, index: 0 }
      });
      
      const chunk2 = await dbAgent.files.createChunk({
        file_id: fileId,
        chunk_index: 1,
        content: 'This is the second chunk of content.',
        metadata: { test: true, index: 1 }
      });
      
      logTest('createChunk() returns chunk object', !!chunk1);
      logTest('createChunk() includes id', !!chunk1.id);
      logTest('createChunk() preserves chunk_index', chunk1.chunk_index === 0);
      logTest('createChunk() preserves metadata', chunk2.metadata?.index === 1);
      
    } catch (error) {
      logTest('createChunk()', false, error.message);
    }

    // Test 2: Get File Chunks
    console.log('\n🔍 Testing getFileChunks()');
    try {
      const chunks = await dbAgent.files.getFileChunks(fileId);
      
      logTest('getFileChunks() returns array', Array.isArray(chunks));
      logTest('getFileChunks() finds all chunks', chunks.length >= 2);
      logTest('getFileChunks() orders by chunk_index', 
        chunks.length >= 2 && chunks[0].chunk_index < chunks[1].chunk_index);
      
      // Test with limit
      const limitedChunks = await dbAgent.files.getFileChunks(fileId, { limit: 1 });
      logTest('getFileChunks() respects limit', limitedChunks.length === 1);
      
      // Test with offset
      const offsetChunks = await dbAgent.files.getFileChunks(fileId, { offset: 1, limit: 1 });
      logTest('getFileChunks() respects offset', offsetChunks.length === 1 && offsetChunks[0].chunk_index === 1);
      
    } catch (error) {
      logTest('getFileChunks()', false, error.message);
    }

    // Test 3: Get File with Content
    console.log('\n📄 Testing getFileWithContent()');
    try {
      const fileWithContent = await dbAgent.files.createFile({
        filename: 'with_content_' + Date.now() + '.txt',
        file_type: 'text/plain',
        file_size: 100,
        source_type: 'text-input',
        client_id: clientId,
        content_data: 'This is the file content data.',
        metadata: { test: true }
      });
      
      const retrieved = await dbAgent.files.getFileWithContent(fileWithContent.id);
      
      logTest('getFileWithContent() returns file', !!retrieved);
      logTest('getFileWithContent() includes content_data', !!retrieved.content_data);
      
      // Handle Buffer conversion for bytea column type
      const expectedContent = 'This is the file content data.';
      const actualContent = Buffer.isBuffer(retrieved.content_data) 
        ? retrieved.content_data.toString('utf8')
        : retrieved.content_data;
      const contentMatches = actualContent === expectedContent;
      
      logTest('getFileWithContent() preserves content', contentMatches);
      
    } catch (error) {
      logTest('getFileWithContent()', false, error.message);
    }

    // Test 4: File Statistics
    console.log('\n📊 Testing getFileStats()');
    try {
      const stats = await dbAgent.files.getFileStats(clientId);
      
      logTest('getFileStats() returns stats object', !!stats);
      logTest('getFileStats() includes total_files', typeof stats.total_files === 'number');
      logTest('getFileStats() includes total_chunks', typeof stats.total_chunks === 'number');
      logTest('getFileStats() includes total_size_mb', !!stats.total_size_mb);
      logTest('getFileStats() includes files_by_source', typeof stats.files_by_source === 'object');
      logTest('getFileStats() has reasonable counts', stats.total_files >= 2);
      
    } catch (error) {
      logTest('getFileStats()', false, error.message);
    }

    // Test 5: Transactional Delete with Chunks
    console.log('\n🔄 Testing transactional delete with chunks');
    try {
      // Create file with chunks
      const transFile = await dbAgent.files.createFile({
        filename: 'transactional_' + Date.now() + '.txt',
        file_type: 'text/plain',
        file_size: 5000,
        source_type: 'upload',
        client_id: clientId,
        metadata: { test: true }
      });
      
      // Add chunks
      await dbAgent.files.createChunk({
        file_id: transFile.id,
        chunk_index: 0,
        content: 'Chunk to be deleted',
        metadata: { test: true }
      });
      
      await dbAgent.files.createChunk({
        file_id: transFile.id,
        chunk_index: 1,
        content: 'Another chunk to be deleted',
        metadata: { test: true }
      });
      
      // Delete file (should cascade to chunks)
      const deleteResult = await dbAgent.files.deleteFile(transFile.id, clientId);
      
      logTest('deleteFile() deletes file with chunks', !!deleteResult);
      logTest('deleteFile() reports chunks deleted', deleteResult.chunksDeleted === 2);
      
      // Verify chunks are gone
      const remainingChunks = await dbAgent.files.getFileChunks(transFile.id);
      logTest('deleteFile() removes all chunks', remainingChunks.length === 0);
      
    } catch (error) {
      logTest('Transactional delete', false, error.message);
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
  runFileOperationsChunksTests().then(results => {
    console.log(`\n📊 Chunks Test Results:`);
    console.log(`   ✅ Passed: ${results.passed}`);
    console.log(`   ❌ Failed: ${results.failed}`);
    console.log(`   📈 Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`);
    process.exit(results.failed > 0 ? 1 : 0);
  });
}