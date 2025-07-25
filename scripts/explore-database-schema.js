#!/usr/bin/env node

import pg from 'pg';
const { Client } = pg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../conversational-repl/.env') });

async function exploreDatabaseSchema() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Get all schemas
    const schemasResult = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
      ORDER BY schema_name
    `);
    
    console.log('📁 Database Schemas:');
    schemasResult.rows.forEach(row => {
      console.log(`  - ${row.schema_name}`);
    });
    console.log();

    // Get all tables with their schemas
    const tablesResult = await client.query(`
      SELECT 
        table_schema,
        table_name,
        obj_description((table_schema||'.'||table_name)::regclass) as comment
      FROM information_schema.tables 
      WHERE table_schema NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
      ORDER BY table_schema, table_name
    `);

    console.log('📊 Tables by Schema:');
    let currentSchema = '';
    tablesResult.rows.forEach(row => {
      if (row.table_schema !== currentSchema) {
        currentSchema = row.table_schema;
        console.log(`\n  ${currentSchema}:`);
      }
      console.log(`    - ${row.table_name}${row.comment ? ' (' + row.comment + ')' : ''}`);
    });
    console.log();

    // Get some key table structures
    const keyTables = ['participants', 'blocks', 'turns', 'personalities', 'clients'];
    
    for (const tableName of keyTables) {
      console.log(`\n📋 Structure of ${tableName}:`);
      const columnsResult = await client.query(`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position
      `, [tableName]);

      if (columnsResult.rows.length > 0) {
        columnsResult.rows.forEach(col => {
          console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
        });
      } else {
        console.log('  (Table not found)');
      }
    }

    // Get available functions
    console.log('\n🔧 Database Functions:');
    const functionsResult = await client.query(`
      SELECT 
        routine_name,
        routine_type,
        specific_name
      FROM information_schema.routines
      WHERE routine_schema = 'public'
        AND (routine_name LIKE '%participant%' OR routine_name LIKE '%pattern%')
      ORDER BY routine_name
    `);

    functionsResult.rows.forEach(func => {
      console.log(`  - ${func.routine_name} (${func.routine_type})`);
    });

    // Get all helper functions mentioned in CLAUDE.md
    const helperFunctions = [
      'update_participant_patterns',
      'find_participant_id',
      'get_participant_id_by_name',
      'get_participant_id_by_email'
    ];

    console.log('\n🔍 Checking for helper functions from CLAUDE.md:');
    for (const funcName of helperFunctions) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.routines
          WHERE routine_schema = 'public' AND routine_name = $1
        )
      `, [funcName]);
      console.log(`  - ${funcName}: ${result.rows[0].exists ? '✓ Found' : '✗ Not found'}`);
    }

  } catch (error) {
    console.error('❌ Error exploring database:', error.message);
  } finally {
    await client.end();
  }
}

exploreDatabaseSchema();