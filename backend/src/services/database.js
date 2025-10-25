import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { dirname } from 'path';
import { CONFIG } from '../config/constants.js';

let db;

export function initDatabase() {
  // Ensure data directory exists
  mkdirSync(dirname(CONFIG.DB_PATH), { recursive: true });

  // Initialize database
  db = new Database(CONFIG.DB_PATH);
  db.pragma('journal_mode = WAL');

  // Create tables
  createTables();

  console.log('Database initialized successfully');
}

function createTables() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      telegram_id INTEGER PRIMARY KEY,
      username TEXT,
      wallet_address TEXT,
      nfts_minted INTEGER DEFAULT 0,
      total_spent REAL DEFAULT 0,
      last_mint_at INTEGER,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  // NFTs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS nfts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token_id INTEGER NOT NULL,
      owner_telegram_id INTEGER NOT NULL,
      owner_wallet_address TEXT NOT NULL,
      metadata_uri TEXT NOT NULL,
      transaction_hash TEXT NOT NULL,
      block_number INTEGER,
      minted_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (owner_telegram_id) REFERENCES users (telegram_id)
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

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_nfts_owner ON nfts(owner_telegram_id);
    CREATE INDEX IF NOT EXISTS idx_nfts_token_id ON nfts(token_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_telegram_id ON sessions(telegram_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
  `);
}

// User operations
export const userDB = {
  create(telegramId, username) {
    const stmt = db.prepare(`
      INSERT INTO users (telegram_id, username)
      VALUES (?, ?)
      ON CONFLICT(telegram_id) DO UPDATE SET
        username = excluded.username,
        updated_at = strftime('%s', 'now')
    `);
    return stmt.run(telegramId, username);
  },

  get(telegramId) {
    const stmt = db.prepare('SELECT * FROM users WHERE telegram_id = ?');
    return stmt.get(telegramId);
  },

  updateWallet(telegramId, walletAddress) {
    const stmt = db.prepare(`
      UPDATE users
      SET wallet_address = ?, updated_at = strftime('%s', 'now')
      WHERE telegram_id = ?
    `);
    return stmt.run(walletAddress, telegramId);
  },

  incrementMintCount(telegramId) {
    const stmt = db.prepare(`
      UPDATE users
      SET nfts_minted = nfts_minted + 1,
          last_mint_at = strftime('%s', 'now'),
          updated_at = strftime('%s', 'now')
      WHERE telegram_id = ?
    `);
    return stmt.run(telegramId);
  },

  canMint(telegramId) {
    const user = this.get(telegramId);
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
  }
};

// NFT operations
export const nftDB = {
  create(tokenId, ownerTelegramId, ownerWalletAddress, metadataUri, transactionHash, blockNumber) {
    const stmt = db.prepare(`
      INSERT INTO nfts (token_id, owner_telegram_id, owner_wallet_address, metadata_uri, transaction_hash, block_number)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(tokenId, ownerTelegramId, ownerWalletAddress, metadataUri, transactionHash, blockNumber);
  },

  getByOwner(telegramId) {
    const stmt = db.prepare('SELECT * FROM nfts WHERE owner_telegram_id = ? ORDER BY minted_at DESC');
    return stmt.all(telegramId);
  },

  getByTokenId(tokenId) {
    const stmt = db.prepare('SELECT * FROM nfts WHERE token_id = ?');
    return stmt.get(tokenId);
  },

  getCount(telegramId) {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM nfts WHERE owner_telegram_id = ?');
    return stmt.get(telegramId).count;
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
