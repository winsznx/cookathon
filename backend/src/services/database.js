import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { dirname } from 'path';
import { CONFIG } from '../config/constants.js';
import { runMigrations } from './migrations.js';

let db;

export function initDatabase() {
  // Ensure data directory exists
  mkdirSync(dirname(CONFIG.DB_PATH), { recursive: true });

  // Initialize database
  db = new Database(CONFIG.DB_PATH);
  db.pragma('journal_mode = WAL');

  // Run migrations first
  runMigrations(db);

  // Create tables (will be skipped if they exist)
  createTables();

  console.log('Database initialized successfully');
}

function createTables() {
  // Users table - supports both Telegram and Farcaster users
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id INTEGER UNIQUE,
      farcaster_fid INTEGER UNIQUE,
      username TEXT,
      platform TEXT NOT NULL DEFAULT 'telegram',
      wallet_address TEXT,
      nfts_minted INTEGER DEFAULT 0,
      total_spent REAL DEFAULT 0,
      last_mint_at INTEGER,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now')),
      CHECK (telegram_id IS NOT NULL OR farcaster_fid IS NOT NULL)
    )
  `);

  // NFTs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS nfts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token_id INTEGER NOT NULL,
      owner_user_id INTEGER NOT NULL,
      owner_wallet_address TEXT NOT NULL,
      metadata_uri TEXT NOT NULL,
      transaction_hash TEXT NOT NULL,
      block_number INTEGER,
      platform TEXT NOT NULL DEFAULT 'telegram',
      minted_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (owner_user_id) REFERENCES users (id)
    )
  `);

  // Sessions table (for webapp authentication)
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      telegram_id INTEGER NOT NULL,
      wallet_address TEXT,
      data TEXT,
      expires_at INTEGER NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (telegram_id) REFERENCES users (telegram_id)
    )
  `);

  // Create indexes (separately to avoid issues)
  try {
    db.exec(`CREATE INDEX IF NOT EXISTS idx_users_telegram ON users(telegram_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_users_farcaster ON users(farcaster_fid)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_users_platform ON users(platform)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_nfts_owner ON nfts(owner_user_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_nfts_token_id ON nfts(token_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_nfts_platform ON nfts(platform)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_sessions_telegram_id ON sessions(telegram_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at)`);
  } catch (error) {
    console.error('Error creating indexes:', error.message);
    // Continue anyway - indexes are not critical
  }
}

// User operations
export const userDB = {
  // Create or update user (Telegram)
  create(telegramId, username) {
    const stmt = db.prepare(`
      INSERT INTO users (telegram_id, username, platform)
      VALUES (?, ?, 'telegram')
      ON CONFLICT(telegram_id) DO UPDATE SET
        username = excluded.username,
        updated_at = strftime('%s', 'now')
    `);
    return stmt.run(telegramId, username);
  },

  // Create or update user (Farcaster)
  createFarcaster(farcasterFid, username) {
    const stmt = db.prepare(`
      INSERT INTO users (farcaster_fid, username, platform)
      VALUES (?, ?, 'farcaster')
      ON CONFLICT(farcaster_fid) DO UPDATE SET
        username = excluded.username,
        updated_at = strftime('%s', 'now')
    `);
    return stmt.run(farcasterFid, username);
  },

  // Get user by Telegram ID
  get(telegramId) {
    const stmt = db.prepare('SELECT * FROM users WHERE telegram_id = ?');
    return stmt.get(telegramId);
  },

  // Get user by Farcaster FID
  getByFarcasterFid(farcasterFid) {
    const stmt = db.prepare('SELECT * FROM users WHERE farcaster_fid = ?');
    return stmt.get(farcasterFid);
  },

  // Get user by ID
  getById(userId) {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(userId);
  },

  // Get user by wallet address
  getByWallet(walletAddress) {
    const stmt = db.prepare('SELECT * FROM users WHERE wallet_address = ?');
    return stmt.get(walletAddress);
  },

  // Update wallet for Telegram user
  updateWallet(telegramId, walletAddress) {
    const stmt = db.prepare(`
      UPDATE users
      SET wallet_address = ?, updated_at = strftime('%s', 'now')
      WHERE telegram_id = ?
    `);
    return stmt.run(walletAddress, telegramId);
  },

  // Update wallet for Farcaster user
  updateWalletFarcaster(farcasterFid, walletAddress) {
    const stmt = db.prepare(`
      UPDATE users
      SET wallet_address = ?, updated_at = strftime('%s', 'now')
      WHERE farcaster_fid = ?
    `);
    return stmt.run(walletAddress, farcasterFid);
  },

  // Increment mint count by user ID
  incrementMintCount(userId) {
    const stmt = db.prepare(`
      UPDATE users
      SET nfts_minted = nfts_minted + 1,
          last_mint_at = strftime('%s', 'now'),
          updated_at = strftime('%s', 'now')
      WHERE id = ?
    `);
    return stmt.run(userId);
  },

  // Check if user can mint by user ID
  canMintById(userId) {
    const user = this.getById(userId);
    if (!user) return true;

    // Check max mint limit
    if (user.nfts_minted >= CONFIG.MAX_MINT_PER_USER) {
      return { canMint: false, reason: 'max_limit' };
    }

    // Check cooldown
    const now = Math.floor(Date.now() / 1000);
    if (user.last_mint_at && (now - user.last_mint_at) * 1000 < CONFIG.MINT_COOLDOWN) {
      const remainingSeconds = Math.ceil(CONFIG.MINT_COOLDOWN / 1000 - (now - user.last_mint_at));
      return { canMint: false, reason: 'cooldown', remainingSeconds };
    }

    return { canMint: true };
  },

  // Legacy method for backwards compatibility
  canMint(telegramId) {
    const user = this.get(telegramId);
    if (!user) return true;
    return this.canMintById(user.id);
  }
};

// NFT operations
export const nftDB = {
  // Create NFT record
  create(tokenId, ownerUserId, ownerWalletAddress, metadataUri, transactionHash, blockNumber, platform = 'telegram') {
    const stmt = db.prepare(`
      INSERT INTO nfts (token_id, owner_user_id, owner_wallet_address, metadata_uri, transaction_hash, block_number, platform)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(tokenId, ownerUserId, ownerWalletAddress, metadataUri, transactionHash, blockNumber, platform);
  },

  // Get NFTs by user ID
  getByUserId(userId) {
    const stmt = db.prepare('SELECT * FROM nfts WHERE owner_user_id = ? ORDER BY minted_at DESC');
    return stmt.all(userId);
  },

  // Legacy method - get by Telegram ID
  getByOwner(telegramId) {
    const user = userDB.get(telegramId);
    if (!user) return [];
    return this.getByUserId(user.id);
  },

  // Get by token ID
  getByTokenId(tokenId) {
    const stmt = db.prepare('SELECT * FROM nfts WHERE token_id = ?');
    return stmt.get(tokenId);
  },

  // Get count by user ID
  getCountByUserId(userId) {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM nfts WHERE owner_user_id = ?');
    return stmt.get(userId).count;
  },

  // Legacy method for backwards compatibility
  getCount(telegramId) {
    const user = userDB.get(telegramId);
    if (!user) return 0;
    return this.getCountByUserId(user.id);
  }
};

// Session operations
export const sessionDB = {
  create(sessionId, telegramId, expiresInSeconds = 3600) {
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const stmt = db.prepare(`
      INSERT INTO sessions (id, telegram_id, expires_at)
      VALUES (?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        telegram_id = excluded.telegram_id,
        expires_at = excluded.expires_at,
        created_at = strftime('%s', 'now')
    `);
    return stmt.run(sessionId, telegramId, expiresAt);
  },

  get(sessionId) {
    const stmt = db.prepare(`
      SELECT * FROM sessions
      WHERE id = ? AND expires_at > strftime('%s', 'now')
    `);
    return stmt.get(sessionId);
  },

  updateWallet(sessionId, walletAddress) {
    const stmt = db.prepare(`
      UPDATE sessions
      SET wallet_address = ?
      WHERE id = ?
    `);
    return stmt.run(walletAddress, sessionId);
  },

  updateData(sessionId, data) {
    const stmt = db.prepare(`
      UPDATE sessions
      SET data = ?
      WHERE id = ?
    `);
    return stmt.run(JSON.stringify(data), sessionId);
  },

  delete(sessionId) {
    const stmt = db.prepare('DELETE FROM sessions WHERE id = ?');
    return stmt.run(sessionId);
  },

  cleanup() {
    const stmt = db.prepare(`DELETE FROM sessions WHERE expires_at < strftime('%s', 'now')`);
    return stmt.run();
  }
};

// Cleanup expired sessions every hour
setInterval(() => {
  sessionDB.cleanup();
}, 3600000);

export { db };
