#!/usr/bin/env node
/**
 * Secure Database Schema Comparison Tool
 * Uses environment variables for database connections
 * 
 * Usage:
 * DEV_DATABASE_URL="..." PROD_DATABASE_URL="..." node scripts/compare-schemas.js
 */

import { Pool } from 'pg';

const DEV_URL = process.env.DEV_DATABASE_URL;
const PROD_URL = process.env.PROD_DATABASE_URL || process.env.DATABASE_URL;

if (!DEV_URL || !PROD_URL) {
  console.error('❌ Missing required environment variables:');
  console.error('   DEV_DATABASE_URL - Development database connection string');
  console.error('   PROD_DATABASE_URL - Production database connection string');
  console.error('');
  console.error('Usage:');
  console.error('   DEV_DATABASE_URL="postgresql://..." PROD_DATABASE_URL="postgresql://..." node scripts/compare-schemas.js');
  process.exit(1);
}

async function compareDatabases() {
  const devPool = new Pool({ connectionString: DEV_URL, ssl: { rejectUnauthorized: false } });
  const prodPool = new Pool({ connectionString: PROD_URL, ssl: { rejectUnauthorized: false } });

  try {
    console.log('🔍 Comparing database schemas...\n');

    // Compare tables
    const tableQuery = `
      SELECT schemaname, tablename 
      FROM pg_tables 
      WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
      ORDER BY schemaname, tablename
    `;
    
    const [devTables, prodTables] = await Promise.all([
      devPool.query(tableQuery),
      prodPool.query(tableQuery)
    ]);
    
    const devTableSet = new Set(devTables.rows.map(r => `${r.schemaname}.${r.tablename}`));
    const prodTableSet = new Set(prodTables.rows.map(r => `${r.schemaname}.${r.tablename}`));
    
    let differences = 0;
    
    // Tables only in dev
    for (const table of devTableSet) {
      if (!prodTableSet.has(table)) {
        console.log(`❌ Table in DEV only: ${table}`);
        differences++;
      }
    }
    
    // Tables only in prod
    for (const table of prodTableSet) {
      if (!devTableSet.has(table)) {
        console.log(`❌ Table in PROD only: ${table}`);
        differences++;
      }
    }
    
    // Compare columns for common tables
    const commonTables = [...devTableSet].filter(table => prodTableSet.has(table));
    
    for (const table of commonTables) {
      const [schema, tableName] = table.split('.');
      
      const columnQuery = `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = $1 AND table_name = $2
        ORDER BY ordinal_position
      `;
      
      const [devColumns, prodColumns] = await Promise.all([
        devPool.query(columnQuery, [schema, tableName]),
        prodPool.query(columnQuery, [schema, tableName])
      ]);
      
      const devColSet = new Set(devColumns.rows.map(r => `${r.column_name}:${r.data_type}`));
      const prodColSet = new Set(prodColumns.rows.map(r => `${r.column_name}:${r.data_type}`));
      
      // Columns only in dev
      for (const col of devColSet) {
        if (!prodColSet.has(col)) {
          console.log(`❌ Column in DEV only: ${table}.${col}`);
          differences++;
        }
      }
      
      // Columns only in prod
      for (const col of prodColSet) {
        if (!devColSet.has(col)) {
          console.log(`❌ Column in PROD only: ${table}.${col}`);
          differences++;
        }
      }
    }
    
    console.log(`\n📊 Summary: ${differences} differences found`);
    
    if (differences === 0) {
      console.log('✅ Schemas are identical');
    } else {
      console.log('⚠️  Schemas have differences that need attention');
    }
    
  } catch (error) {
    console.error('❌ Error comparing databases:', error);
    process.exit(1);
  } finally {
    await devPool.end();
    await prodPool.end();
  }
}

compareDatabases();