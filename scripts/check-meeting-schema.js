#!/usr/bin/env node

import { DatabaseAgent } from '../database/database-agent.js';

async function checkSchema() {
  const db = new DatabaseAgent();

  try {
    await db.connect();

    // Check meetings table columns
    const columns = await db.connector.query(
      `SELECT column_name, data_type
       FROM information_schema.columns
       WHERE table_schema = 'meetings' AND table_name = 'meetings'
       ORDER BY ordinal_position`
    );

    console.log('📋 Meetings table columns:');
    columns.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await db.close();
  }
}

checkSchema();