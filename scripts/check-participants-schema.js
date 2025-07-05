#!/usr/bin/env node

import { DatabaseManager } from '../lib/database.js';

async function checkSchema() {
  const db = new DatabaseManager();
  
  try {
    // Check column names in participants table
    const schemaResult = await db.pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'participants' 
      ORDER BY ordinal_position
    `);
    
    console.log('Participants table columns:');
    schemaResult.rows.forEach(col => {
      console.log(`- ${col.column_name} (${col.data_type})`);
    });
    
    // Also check a few sample participants
    console.log('\nSample participants:');
    const sampleResult = await db.pool.query(
      "SELECT id, name, type FROM participants LIMIT 5"
    );
    
    sampleResult.rows.forEach(p => {
      console.log(`ID: ${p.id}, Name: ${p.name}, Type: ${p.type}`);
    });
    
    // Try to find Ian specifically
    console.log('\nSearching for Ian...');
    const ianResult = await db.pool.query(
      "SELECT id, name, type, metadata FROM participants WHERE name ILIKE '%ian%'"
    );
    
    if (ianResult.rows.length > 0) {
      ianResult.rows.forEach(p => {
        console.log(`\nFound: ${p.name} (ID: ${p.id})`);
        console.log('Type:', p.type);
        console.log('Metadata:', JSON.stringify(p.metadata, null, 2));
        console.log('Existing patterns:', JSON.stringify(p.metadata?.personality_patterns, null, 2));
      });
    } else {
      console.log('No participants found with "ian" in name');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await db.close();
  }
}

checkSchema().catch(console.error);