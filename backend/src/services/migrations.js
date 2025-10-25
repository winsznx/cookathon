/**
 * Database Migration Handler
 * Handles schema updates for existing databases
 */

/**
 * Run all migrations on the database
 */
export function runMigrations(db) {
  console.log('Running database migrations...');

  // Get current schema version
  const version = getDatabaseVersion(db);
  console.log(`Current database version: ${version}`);

  if (version < 1) {
    migrateToV1(db);
  }

  // Update version
  setDatabaseVersion(db, 1);
  console.log('Migrations complete!');
}

/**
 * Migration to v1: Add Farcaster support
 */
function migrateToV1(db) {
  console.log('Migrating to v1: Adding Farcaster support...');

  try {
    // Check if users table exists and has old schema
    const tableInfo = db.prepare("PRAGMA table_info(users)").all();

    if (tableInfo.length === 0) {
      console.log('No existing users table. Fresh database.');
      return;
    }

    const hasId = tableInfo.some(col => col.name === 'id');
    const hasFarcasterFid = tableInfo.some(col => col.name === 'farcaster_fid');
    const hasPlatform = tableInfo.some(col => col.name === 'platform');

    if (!hasId) {
      console.log('Old schema detected (telegram_id as PRIMARY KEY). Full migration needed...');

      // This is the old schema - we need to recreate tables
      // Backup old data
      db.exec(`CREATE TABLE users_backup AS SELECT * FROM users;`);
      db.exec(`CREATE TABLE nfts_backup AS SELECT * FROM nfts;`);

      // Drop old tables
      db.exec(`DROP TABLE IF EXISTS nfts;`);
      db.exec(`DROP TABLE IF EXISTS users;`);

      console.log('Old tables backed up and dropped. New schema will be created.');

    } else if (!hasFarcasterFid || !hasPlatform) {
      console.log('Partial v1 schema detected. Adding missing columns...');

      // Add new columns if they don't exist
      if (!hasFarcasterFid) {
        db.exec(`ALTER TABLE users ADD COLUMN farcaster_fid INTEGER;`);
        db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_farcaster_unique ON users(farcaster_fid) WHERE farcaster_fid IS NOT NULL;`);
      }
      if (!hasPlatform) {
        db.exec(`ALTER TABLE users ADD COLUMN platform TEXT NOT NULL DEFAULT 'telegram';`);
      }

      // Check NFTs table
      const nftsInfo = db.prepare("PRAGMA table_info(nfts)").all();
      const hasOwnerUserId = nftsInfo.some(col => col.name === 'owner_user_id');
      const hasNftPlatform = nftsInfo.some(col => col.name === 'platform');

      if (!hasOwnerUserId) {
        console.log('NFTs table needs migration...');
        db.exec(`CREATE TABLE nfts_backup AS SELECT * FROM nfts;`);
        db.exec(`DROP TABLE nfts;`);
        console.log('NFTs table backed up and dropped. Will be recreated.');
      } else if (!hasNftPlatform) {
        db.exec(`ALTER TABLE nfts ADD COLUMN platform TEXT NOT NULL DEFAULT 'telegram';`);
      }

      console.log('Farcaster columns added');
    } else {
      console.log('Database schema is up to date');
    }
  } catch (error) {
    console.error('Migration error:', error.message);
    console.error('Continuing with table creation...');
  }
}

/**
 * Get database version
 */
function getDatabaseVersion(db) {
  try {
    // Create version table if it doesn't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS schema_version (
        version INTEGER PRIMARY KEY
      )
    `);

    const result = db.prepare('SELECT version FROM schema_version LIMIT 1').get();
    return result ? result.version : 0;
  } catch (error) {
    return 0;
  }
}

/**
 * Set database version
 */
function setDatabaseVersion(db, version) {
  db.exec(`DELETE FROM schema_version`);
  db.prepare('INSERT INTO schema_version (version) VALUES (?)').run(version);
}
