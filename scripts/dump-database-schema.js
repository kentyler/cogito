import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({
  connectionString: 'postgresql://user:password@host/database',
  ssl: { rejectUnauthorized: false }
});

async function dumpDatabaseSchema() {
  try {
    await client.connect();
    console.log('Connected to database, dumping schema...');

    const output = [];
    const timestamp = new Date().toISOString();
    
    output.push(`# Cogito Database Schema Dump`);
    output.push(`Generated: ${timestamp}\n`);

    // Get all schemas
    const schemasQuery = `
      SELECT schema_name, schema_owner
      FROM information_schema.schemata
      WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
        AND schema_name NOT LIKE 'pg_temp_%'
        AND schema_name NOT LIKE 'pg_toast_temp_%'
      ORDER BY schema_name;
    `;
    const schemas = await client.query(schemasQuery);
    
    output.push(`## Database Schemas\n`);
    output.push(`| Schema | Owner | Likely Source |`);
    output.push(`|--------|-------|---------------|`);
    
    for (const schema of schemas.rows) {
      let source = 'User-created';
      // Identify likely sources based on schema names
      if (schema.schema_name === 'auth') source = 'Supabase Auth';
      if (schema.schema_name === 'storage') source = 'Supabase Storage';
      if (schema.schema_name === 'realtime') source = 'Supabase Realtime';
      if (schema.schema_name === 'extensions') source = 'PostgreSQL Extensions';
      if (schema.schema_name.startsWith('pg_')) source = 'PostgreSQL System';
      if (schema.schema_name === 'public') source = 'PostgreSQL Default';
      
      output.push(`| ${schema.schema_name} | ${schema.schema_owner} | ${source} |`);
    }
    
    output.push(`\n## Schema Details\n`);

    // For each schema, get all tables
    for (const schema of schemas.rows) {
      output.push(`### Schema: ${schema.schema_name}\n`);
      
      const tablesQuery = `
        SELECT 
          t.table_name,
          obj_description(c.oid) as table_comment
        FROM information_schema.tables t
        JOIN pg_class c ON c.relname = t.table_name
        JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = t.table_schema
        WHERE t.table_schema = $1 
          AND t.table_type = 'BASE TABLE'
        ORDER BY t.table_name;
      `;
      const tables = await client.query(tablesQuery, [schema.schema_name]);
      
      if (tables.rows.length === 0) {
        output.push(`*No tables in this schema*\n`);
        continue;
      }
      
      for (const table of tables.rows) {
        output.push(`#### Table: ${schema.schema_name}.${table.table_name}`);
        if (table.table_comment) {
          output.push(`> ${table.table_comment}`);
        }
        output.push('');
        
        // Get columns for each table
        const columnsQuery = `
          SELECT 
            column_name,
            data_type,
            character_maximum_length,
            is_nullable,
            column_default,
            pg_catalog.col_description(pgc.oid, cols.ordinal_position) as column_comment
          FROM information_schema.columns cols
          JOIN pg_catalog.pg_class pgc ON pgc.relname = cols.table_name
          JOIN pg_namespace n ON n.nspname = cols.table_schema AND n.oid = pgc.relnamespace
          WHERE table_schema = $1 AND table_name = $2
          ORDER BY ordinal_position;
        `;
        const columns = await client.query(columnsQuery, [schema.schema_name, table.table_name]);
        
        output.push('| Column | Type | Nullable | Default | Comment |');
        output.push('|--------|------|----------|---------|---------|');
        
        for (const col of columns.rows) {
          const type = col.character_maximum_length 
            ? `${col.data_type}(${col.character_maximum_length})`
            : col.data_type;
          const nullable = col.is_nullable === 'YES' ? 'YES' : 'NO';
          const defaultVal = col.column_default ? col.column_default.substring(0, 30) + '...' : '';
          const comment = col.column_comment || '';
          
          output.push(`| ${col.column_name} | ${type} | ${nullable} | ${defaultVal} | ${comment} |`);
        }
        
        // Get indexes
        const indexQuery = `
          SELECT 
            i.relname as index_name,
            array_to_string(array_agg(a.attname ORDER BY x.n), ', ') as columns,
            ix.indisunique as is_unique,
            ix.indisprimary as is_primary
          FROM pg_index ix
          JOIN pg_class t ON t.oid = ix.indrelid
          JOIN pg_class i ON i.oid = ix.indexrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
          JOIN LATERAL unnest(ix.indkey) WITH ORDINALITY AS x(attnum, n) ON true
          JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = x.attnum
          WHERE n.nspname = $1 AND t.relname = $2
          GROUP BY i.relname, ix.indisunique, ix.indisprimary;
        `;
        const indexes = await client.query(indexQuery, [schema.schema_name, table.table_name]);
        
        if (indexes.rows.length > 0) {
          output.push('\n**Indexes:**');
          for (const idx of indexes.rows) {
            const type = idx.is_primary ? 'PRIMARY KEY' : idx.is_unique ? 'UNIQUE' : 'INDEX';
            output.push(`- ${idx.index_name} (${type}): ${idx.columns}`);
          }
        }
        
        // Get foreign keys
        const fkQuery = `
          SELECT
            tc.constraint_name,
            kcu.column_name,
            ccu.table_schema AS foreign_table_schema,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
          FROM information_schema.table_constraints AS tc
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
          WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_schema = $1
            AND tc.table_name = $2;
        `;
        const foreignKeys = await client.query(fkQuery, [schema.schema_name, table.table_name]);
        
        if (foreignKeys.rows.length > 0) {
          output.push('\n**Foreign Keys:**');
          for (const fk of foreignKeys.rows) {
            output.push(`- ${fk.constraint_name}: ${fk.column_name} → ${fk.foreign_table_schema}.${fk.foreign_table_name}(${fk.foreign_column_name})`);
          }
        }
        
        output.push('\n');
      }
    }

    // Write to file
    const outputPath = path.join(__dirname, '..', 'docs', 'database-schema-current.md');
    fs.writeFileSync(outputPath, output.join('\n'));
    
    console.log(`Schema dumped to: ${outputPath}`);
    console.log(`Total schemas: ${schemas.rows.length}`);
    
    await client.end();
  } catch (err) {
    console.error('Error dumping schema:', err);
    process.exit(1);
  }
}

dumpDatabaseSchema();