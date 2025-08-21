const fs = require('fs');
const path = require('path');
const pool = require('../src/config/database');

async function runMigrations() {
  try {
    // Create migrations table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get list of migration files
    const migrationDir = __dirname;
    const files = fs.readdirSync(migrationDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log(`Found ${files.length} migration files`);

    for (const file of files) {
      // Check if migration has already been run
      const result = await pool.query(
        'SELECT id FROM migrations WHERE filename = $1',
        [file]
      );

      if (result.rows.length > 0) {
        console.log(`Skipping ${file} (already executed)`);
        continue;
      }

      console.log(`Running migration: ${file}`);
      
      // Read and execute migration
      const migrationSQL = fs.readFileSync(path.join(migrationDir, file), 'utf8');
      
      // Execute migration in a transaction
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(migrationSQL);
        
        // Record migration as completed
        await client.query(
          'INSERT INTO migrations (filename) VALUES ($1)',
          [file]
        );
        
        await client.query('COMMIT');
        console.log(`✓ Migration ${file} completed successfully`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }

    console.log('All migrations completed successfully!');
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations();
}

module.exports = runMigrations;
