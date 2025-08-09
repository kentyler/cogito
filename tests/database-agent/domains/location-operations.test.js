#!/usr/bin/env node
/**
 * LocationOperations Test Suite - Validates location tracking functionality
 * Tests all core location operations functionality
 */

import { getTestDbAgent, TestFixtures, cleanupTestData } from '../test-helpers/db-setup.js';

async function runLocationOperationsTests() {
  let dbAgent;
  let testResults = { passed: 0, failed: 0, tests: [] };

  function logTest(name, passed, message = '') {
    const status = passed ? '✅' : '❌';
    console.log(`  ${status} ${name}${message ? ' - ' + message : ''}`);
    testResults.tests.push({ name, passed, message });
    if (passed) testResults.passed++;
    else testResults.failed++;
  }

  try {
    console.log('🧪 Running LocationOperations Tests\n');
    
    dbAgent = await getTestDbAgent();
    console.log('✅ Connected to dev database\n');

    // Test table creation
    console.log('🏗️ Testing table creation...');
    const tableResult = await dbAgent.locations.createTable();
    logTest('createTable() works', !!tableResult.success);

    // Test location operations
    console.log('📍 Testing location operations...');
    
    const locationData = {
      file_path: '/test/path/example.js',
      description: 'Test file for location operations',
      project: 'test-project',
      category: 'javascript',
      tags: 'test,example,javascript'
    };
    
    const location = await dbAgent.locations.upsertLocation(locationData);
    logTest('upsertLocation() works', !!location && location.file_path === locationData.file_path);
    
    const foundLocation = await dbAgent.locations.getByPath(locationData.file_path);
    logTest('getByPath() works', !!foundLocation && foundLocation.file_path === locationData.file_path);
    
    // Test search functionality
    console.log('🔍 Testing search operations...');
    
    await dbAgent.locations.upsertLocation({
      file_path: '/search/test1.js',
      description: 'First search test file',
      project: 'search-project',
      category: 'javascript',
      tags: 'search,test'
    });
    
    const searchResults = await dbAgent.locations.searchWithAccessUpdate('search-project');
    logTest('searchWithAccessUpdate() works', Array.isArray(searchResults) && searchResults.length > 0);
    
    const recentLocations = await dbAgent.locations.getRecent(5);
    logTest('getRecent() works', Array.isArray(recentLocations));
    
    const projectLocations = await dbAgent.locations.getByProject('test-project');
    logTest('getByProject() works', Array.isArray(projectLocations));
    
    const categoryLocations = await dbAgent.locations.getByCategory('javascript');
    logTest('getByCategory() works', Array.isArray(categoryLocations));
    
    // Test statistics and utilities
    console.log('📊 Testing statistics...');
    
    const stats = await dbAgent.locations.getStats();
    logTest('getStats() works', !!stats && typeof stats.total_locations === 'number');
    
    const projects = await dbAgent.locations.getProjects();
    logTest('getProjects() works', Array.isArray(projects));
    
    const categories = await dbAgent.locations.getCategories();
    logTest('getCategories() works', Array.isArray(categories));
    
    const allLocations = await dbAgent.locations.getAll({ limit: 10 });
    logTest('getAll() works', Array.isArray(allLocations));
    
    // Test updates and cleanup
    console.log('🔄 Testing updates and cleanup...');
    
    const updatedTags = await dbAgent.locations.updateTags(locationData.file_path, 'new,tags');
    logTest('updateTags() works', !!updatedTags);
    
    const accessResult = await dbAgent.locations.updateAccessTimes([locationData.file_path]);
    logTest('updateAccessTimes() works', !!accessResult && accessResult.updated >= 0);
    
    const deleted = await dbAgent.locations.delete(locationData.file_path);
    logTest('delete() works', !!deleted);

    console.log(`\n📊 Test Results: ✅ ${testResults.passed} passed, ❌ ${testResults.failed} failed`);
    
    if (testResults.failed === 0) {
      console.log('🎉 All LocationOperations tests passed!');
    }

  } catch (error) {
    console.error('❌ Test suite error:', error);
    testResults.failed++;
  } finally {
    if (dbAgent) {
      await cleanupTestData(dbAgent);
      await dbAgent.close();
      console.log('🧹 Test cleanup completed');
    }
  }

  return testResults;
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runLocationOperationsTests().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  });
}

export { runLocationOperationsTests };