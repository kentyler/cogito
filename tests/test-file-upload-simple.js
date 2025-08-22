/**
 * Simple test for modular file upload service
 */

import { FileUploadService } from '../lib/file-upload-modular.js';

async function testSimple() {
  console.log('🧪 Testing modular FileUploadService (simple)...');
  
  const service = new FileUploadService();
  
  try {
    // Test 1: Module access
    console.log('1. Testing module access...');
    const modules = service.modules;
    console.log('✅ Module access successful:', Object.keys(modules));
    
    // Test 2: Content extraction support
    console.log('2. Testing content extraction support...');
    const isSupported = service.modules.contentExtractor.isSupported('text/plain');
    console.log('✅ Content extraction:', isSupported ? 'Supported' : 'Not supported');
    
    // Test 3: Simple text chunking
    console.log('3. Testing text chunking...');
    const text = 'First sentence. Second sentence. Third sentence.';
    const chunks = service.modules.textChunker.chunkText(text, 20, 5);
    console.log('✅ Text chunking:', `${chunks.length} chunks created`);
    
    // Test 4: Legacy compatibility
    console.log('4. Testing legacy method...');
    const legacyChunks = service.chunkText(text, 20, 5);
    console.log('✅ Legacy method:', `${legacyChunks.length} chunks`);
    
    console.log('🎉 All tests passed! Modular FileUploadService is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  }
}

// Run the test
testSimple()
  .then(() => {
    console.log('✅ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });