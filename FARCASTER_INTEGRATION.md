# Farcaster Mini App Integration Guide

This document explains the Farcaster Mini App integration added to the Base NFT minting project.

## Overview

The project now supports **two platforms** for NFT minting:

1. **Telegram Bot** - Original implementation using Reown AppKit
2. **Farcaster Mini App** - New implementation using Farcaster's native wallet

Both platforms share the same:
- Backend API and services
- Smart contract on Base
- Database (with platform tracking)
- IPFS/Pinata integration

## What Was Added

### New Components

#### 1. Farcaster Mini App (`/farcaster-miniapp`)

A complete React app built with Vite that runs as a Farcaster Mini App:

- **Auto Wallet Connection**: Uses `@farcaster/miniapp-wagmi-connector`
- **Base Network Support**: Mints on Base Mainnet
- **Custom UI**: Purple-themed design matching Farcaster branding
- **Metadata Upload**: IPFS integration via backend API

**Key Files:**
- `src/App.jsx` - Main component with minting logic
- `src/config.js` - Wagmi configuration with Farcaster connector
- `index.html` - Includes Farcaster meta tags
- `public/.well-known/farcaster.json` - Mini app manifest

#### 2. Backend Updates

**New Handler** (`backend/src/handlers/farcasterHandler.js`):
- `handleFarcasterSession()` - Creates/updates Farcaster user sessions
- `handleFarcasterMintSuccess()` - Records successful NFT mints
- `handleFarcasterWebhook()` - Receives Farcaster events
- `getFarcasterUserStats()` - Returns user statistics

**New Endpoints** (in `backend/src/index.js`):
- `POST /api/farcaster/session`
- `POST /api/farcaster/mint-success`
- `POST /api/farcaster/webhook`
- `GET /api/farcaster/stats`
- `GET /.well-known/farcaster.json`

#### 3. Database Schema Changes

Updated `users` table to support both platforms:

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id INTEGER UNIQUE,          -- For Telegram users
  farcaster_fid INTEGER UNIQUE,        -- For Farcaster users
  username TEXT,
  platform TEXT NOT NULL DEFAULT 'telegram',
  wallet_address TEXT,
  nfts_minted INTEGER DEFAULT 0,
  ...
)
```

Updated `nfts` table to track platform:

```sql
CREATE TABLE nfts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token_id INTEGER NOT NULL,
  owner_user_id INTEGER NOT NULL,     -- References users.id
  platform TEXT NOT NULL DEFAULT 'telegram',
  ...
)
```

**New Database Methods:**
- `userDB.createFarcaster()` - Create Farcaster user
- `userDB.getByFarcasterFid()` - Get user by FID
- `userDB.updateWalletFarcaster()` - Update Farcaster user wallet
- `nftDB.getByUserId()` - Get NFTs by internal user ID

## How It Works

### User Flow (Farcaster)

1. User opens the mini app in Warpcast or another Farcaster client
2. Mini app auto-connects to user's Farcaster wallet via the connector
3. User fills in NFT details (name, description, image URL)
4. User clicks "Generate Metadata URI" to upload to IPFS
5. Backend uploads metadata to Pinata and returns IPFS URI
6. User clicks "Mint NFT" to initiate transaction
7. Transaction is signed with Farcaster wallet
8. On success, backend records mint in database
9. User sees success message with transaction link

### Technical Flow

```
Farcaster Client (Warpcast)
        ↓
Mini App (React + Vite)
        ↓ [Auto wallet connect]
Farcaster Wagmi Connector
        ↓ [Metadata upload]
Backend API (/api/upload-metadata)
        ↓
Pinata IPFS
        ↓ [Mint transaction]
Base Network (Smart Contract)
        ↓ [Record mint]
Backend API (/api/farcaster/mint-success)
        ↓
SQLite Database
```

## Configuration

### Environment Variables

**Root `.env`** (Backend):
```env
# Existing variables...

# Farcaster Mini App
FARCASTER_MINIAPP_URL=https://your-farcaster-app.com
FARCASTER_ACCOUNT_HEADER=eyJ...
FARCASTER_ACCOUNT_PAYLOAD=eyJ...
FARCASTER_ACCOUNT_SIGNATURE=MHg...
BACKEND_URL=https://your-backend.com
```

**`farcaster-miniapp/.env`** (Frontend):
```env
VITE_CONTRACT_ADDRESS=0x15d56140A49c16EA636C9a7485D8f8E22a592bF0
VITE_BACKEND_URL=https://your-backend.com
```

### NPM Scripts

New scripts added to root `package.json`:

```bash
npm run dev:farcaster      # Start Farcaster mini app dev server
npm run build:farcaster    # Build Farcaster mini app for production
```

## Development Workflow

### Running Both Platforms

You can run both platforms simultaneously:

```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Telegram Web App
npm run dev:webapp

# Terminal 3 - Farcaster Mini App
npm run dev:farcaster
```

Each runs on a different port:
- Backend: `http://localhost:3000`
- Telegram WebApp: `http://localhost:5173`
- Farcaster Mini App: `http://localhost:5174`

### Database Tracking

The database automatically tracks which platform each user and NFT came from:

```javascript
// Create Telegram user
userDB.create(telegramId, username);  // platform = 'telegram'

// Create Farcaster user
userDB.createFarcaster(fid, username);  // platform = 'farcaster'

// Mint NFT (platform is tracked)
nftDB.create(tokenId, userId, wallet, uri, hash, block, 'farcaster');
```

## Key Differences: Telegram vs Farcaster

| Feature | Telegram Bot | Farcaster Mini App |
|---------|-------------|-------------------|
| **Wallet Connection** | Reown AppKit Modal | Auto-connect via Farcaster |
| **User ID** | `telegram_id` | `farcaster_fid` |
| **Entry Point** | `/mint` command | Mini app URL |
| **Platform** | Telegram WebApp | Farcaster Frames v2 |
| **SDK** | `@reown/appkit` | `@farcaster/miniapp-wagmi-connector` |
| **Port** | 5173 | 5174 |

## Migration Notes

### Backward Compatibility

All existing Telegram bot functionality remains unchanged. The database schema is backward compatible:

- Old code using `telegram_id` still works
- NFT queries use internal `user.id` for cross-platform support
- Legacy methods maintained (e.g., `userDB.get()`, `nftDB.getByOwner()`)

### Shared Resources

Both platforms share:
- Smart contract address
- Backend API endpoints (except platform-specific ones)
- IPFS/Pinata configuration
- Database file (`./data/bot.db`)

## Deployment

### Backend Deployment

No changes needed to backend deployment process. The same backend serves both platforms.

### Farcaster Mini App Deployment

1. Build the mini app:
   ```bash
   npm run build:farcaster
   ```

2. Deploy `farcaster-miniapp/dist/` to:
   - Vercel
   - Netlify
   - Cloudflare Pages
   - Any static hosting

3. Update `FARCASTER_MINIAPP_URL` in backend `.env`

4. Set up Farcaster account association (see [Farcaster docs](https://miniapps.farcaster.xyz/docs/specification#account-association))

### Manifest Configuration

The manifest is dynamically served by the backend at `/.well-known/farcaster.json`:

```javascript
app.get('/.well-known/farcaster.json', (req, res) => {
  res.json({
    accountAssociation: { ... },
    miniapp: {
      version: "1",
      name: "Base NFT Minting",
      homeUrl: process.env.FARCASTER_MINIAPP_URL,
      ...
    }
  });
});
```

## Testing

### Local Testing

1. Start all services
2. Access mini app at `http://localhost:5174`
3. Test without Farcaster client first
4. Use ngrok for testing in Warpcast:
   ```bash
   ngrok http 5174
   ```

### Production Testing

1. Deploy mini app to production URL
2. Update backend environment variables
3. Create a cast with your mini app URL
4. Open in Warpcast and test full flow

## Next Steps

### Recommended Enhancements

1. **Notifications**: Implement Farcaster notifications for mint confirmations
2. **User Gallery**: Show user's NFTs within the mini app
3. **Farcaster Frames**: Create static frames for previews
4. **Analytics**: Track platform-specific metrics
5. **Social Sharing**: Let users share minted NFTs to Farcaster

### Code Improvements

- Add Farcaster signature verification
- Implement rate limiting per platform
- Add platform-specific error handling
- Create shared UI components between platforms

## Resources

- [Farcaster Mini Apps Docs](https://miniapps.farcaster.xyz/)
- [Farcaster Wagmi Connector](https://www.npmjs.com/package/@farcaster/miniapp-wagmi-connector)
- [Base Network Documentation](https://docs.base.org/)
- [Original README](./README.md)
- [Farcaster Mini App README](./farcaster-miniapp/README.md)

---

Integration completed! Both Telegram and Farcaster users can now mint NFTs on Base using the same smart contract and backend infrastructure.
