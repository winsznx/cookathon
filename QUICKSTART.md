# Quick Start Guide

Get your NFT Telegram bot running in 5 minutes!

## Prerequisites Checklist

- [ ] Node.js v18+ installed
- [ ] Telegram account
- [ ] Ethereum wallet with Base ETH
- [ ] Text editor (VS Code, etc.)

## Step-by-Step Setup

### 1. Get Required Credentials (5-10 minutes)

#### A. Telegram Bot Token
1. Open Telegram and search for [@BotFather](https://t.me/BotFather)
2. Send `/newbot`
3. Follow prompts to create your bot
4. Copy the bot token (looks like: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`)

#### B. Reown Project ID
1. Go to [cloud.reown.com](https://cloud.reown.com/)
2. Sign up/login
3. Create a new project
4. Copy your Project ID

#### C. Pinata API Keys
1. Go to [pinata.cloud](https://pinata.cloud/)
2. Sign up for free account
3. Go to API Keys section
4. Create new API key
5. Copy API Key and API Secret

#### D. BaseScan API Key (Optional)
1. Go to [basescan.org](https://basescan.org/)
2. Sign up and login
3. Go to API Keys
4. Create new API key

### 2. Install Dependencies (2 minutes)

```bash
npm run install:all
```

### 3. Configure Environment (2 minutes)

```bash
# Copy environment templates
cp .env.example .env
cp webapp/.env.example webapp/.env
```

Edit `.env`:
```env
TELEGRAM_BOT_TOKEN=paste_your_bot_token_here
DEPLOYER_PRIVATE_KEY=paste_your_private_key_here
PINATA_API_KEY=paste_pinata_api_key_here
PINATA_SECRET_KEY=paste_pinata_secret_here
WEBAPP_URL=http://localhost:5173
```

Edit `webapp/.env`:
```env
VITE_REOWN_PROJECT_ID=paste_reown_project_id_here
VITE_BACKEND_URL=http://localhost:3000
```

### 4. Deploy Smart Contract (5 minutes)

```bash
cd contracts
npm run compile
npm run deploy
# Copy the contract address from output
```

Update both `.env` files with contract address:
- Root `.env`: Add `CONTRACT_ADDRESS=0x...`
- `webapp/.env`: Add `VITE_CONTRACT_ADDRESS=0x...`

### 5. Start the Bot (1 minute)

Open 2 terminals:

**Terminal 1 (Backend):**
```bash
npm run dev:backend
```

**Terminal 2 (Webapp):**
```bash
npm run dev:webapp
```

### 6. Test Your Bot (1 minute)

1. Open Telegram
2. Search for your bot by username
3. Click Start
4. Type `/mint`
5. Connect wallet and mint!

## Common First-Time Issues

### Issue: "Polling error"
**Fix:** Make sure bot token is correct and no other instance is running

### Issue: "Contract not deployed"
**Fix:** Run `npm run deploy` in contracts folder first

### Issue: "Wrong network"
**Fix:** Switch your wallet to Base Mainnet (Chain ID 8453)

### Issue: Webapp won't open
**Fix:** Make sure `npm run dev:webapp` is running and WEBAPP_URL is correct

## Next Steps

Once everything works:

1. ✅ Test minting on testnet first (use Base Sepolia)
2. ✅ Customize bot messages in `backend/src/config/constants.js`
3. ✅ Customize webapp styling in `webapp/src/App.css`
4. ✅ Deploy to production (see README.md)

## Development Commands

```bash
# Backend
npm run dev:backend        # Start bot in dev mode

# Webapp
npm run dev:webapp         # Start webapp dev server
npm run build:webapp       # Build for production

# Contracts
npm run compile            # Compile contracts
npm run test:contracts     # Run contract tests
npm run deploy             # Deploy to mainnet
npm run deploy:testnet     # Deploy to testnet
```

## Project Structure Overview

```
.
├── backend/          Bot server + API
│   ├── commands/     /start, /mint, etc.
│   ├── handlers/     Process webapp data
│   └── services/     Database, blockchain, IPFS
├── webapp/           React minting interface
│   ├── App.jsx       Main UI component
│   └── config.js     Reown AppKit setup
├── contracts/        Smart contracts
│   ├── BaseNFT.sol   Main NFT contract
│   └── deploy.js     Deployment script
└── shared/           Common utilities
```

## Getting Help

- Read full documentation in `README.md`
- Check error logs in terminal
- Ensure all environment variables are set
- Test on Base Sepolia testnet first

---

Happy Building! 🚀
