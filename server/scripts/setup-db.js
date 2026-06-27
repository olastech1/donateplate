require('dotenv').config({ path: '../.env' });
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function setupDatabase() {
  console.log('🔗 Connecting to database...');
  
  try {
    // 1. Run Base Schema
    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    console.log(`📄 Reading base schema from: ${schemaPath}`);
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('⚡ Executing base schema...');
    await pool.query(schemaSql);
    console.log('✅ Base schema initialized successfully.');

    // 2. Run Migration v2
    const migrationPath = path.join(__dirname, '../../database/migration_v2.sql');
    console.log(`📄 Reading migration from: ${migrationPath}`);
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('⚡ Executing migration v2...');
    await pool.query(migrationSql);
    console.log('✅ Migration v2 applied successfully.');
    
    console.log('🎉 Database setup complete! You are ready to go.');
  } catch (err) {
    console.error('❌ Database setup failed:', err);
  } finally {
    pool.end();
  }
}

setupDatabase();
