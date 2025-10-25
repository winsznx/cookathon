# Base NFT Telegram Bot

A complete solution for minting NFTs on Base network through a Telegram bot with Reown AppKit wallet integration.

## Features

- **Telegram Bot Interface**: Easy-to-use commands for NFT minting
- **Reown AppKit Integration**: Seamless wallet connection via WalletConnect v2
- **Base Network**: Deploy on Base Mainnet or Sepolia testnet
- **IPFS Metadata Storage**: Decentralized metadata storage via Pinata
- **SQLite Database**: Track users and minted NFTs
- **Smart Contract**: ERC-721 NFT contract with OpenZeppelin standards

## Project Structure

```
base-nft-telegram-bot/
├── backend/           # Telegram bot backend (Node.js + Express)
│   ├── src/
│   │   ├── commands/      # Bot command handlers
│   │   ├── handlers/      # Event handlers
│   │   ├── services/      # Database, blockchain, IPFS services
│   │   ├── config/        # Configuration and constants
│   │   └── index.js       # Main entry point
│   └── package.json
├── webapp/            # Reown AppKit webapp (React + Vite)
│   ├── src/
│   │   ├── App.jsx        # Main app component
│   │   ├── config.js      # Reown AppKit configuration
│   │   └── main.jsx       # Entry point
│   ├── index.html
│   └── package.json
├── contracts/         # Smart contracts (Hardhat)
│   ├── contracts/         # Solidity contracts
│   ├── scripts/           # Deployment scripts
│   ├── test/              # Contract tests
│   └── hardhat.config.js
├── shared/            # Shared utilities
└── package.json       # Root workspace configuration
```

## Prerequisites

- Node.js v18+ and npm
- A Telegram Bot Token (from [@BotFather](https://t.me/BotFather))
- Ethereum wallet with ETH on Base Mainnet for deployment
- Reown Project ID (from [cloud.reown.com](https://cloud.reown.com/))
- Pinata API keys (from [pinata.cloud](https://pinata.cloud/))
- BaseScan API key (optional, for contract verification)

## Quick Start

### 1. Clone and Install

```bash
# Clone the repository (or create from this structure)
cd cookathon

# Install all dependencies
npm run install:all
```

### 2. Configure Environment Variables

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Telegram Bot
TELEGRAM_BOT_TOKEN=your_telegram_bot_token

# Smart Contract (will be filled after deployment)
CONTRACT_ADDRESS=

# Base Network
BASE_RPC_URL=https://mainnet.base.org

# Deployer (for contract deployment)
DEPLOYER_PRIVATE_KEY=your_private_key
BASESCAN_API_KEY=your_basescan_api_key

# IPFS (Pinata)
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key

# WebApp
WEBAPP_URL=http://localhost:5173

# Backend
PORT=3000
DB_PATH=./data/bot.db
```

Also configure webapp environment:

```bash
cd webapp
cp .env.example .env
```

Edit `webapp/.env`:

```env
VITE_REOWN_PROJECT_ID=your_reown_project_id
VITE_CONTRACT_ADDRESS=
VITE_BACKEND_URL=http://localhost:3000
```

### 3. Deploy Smart Contract

```bash
# Compile contracts
cd contracts
npm run compile

# Run tests
npm run test

# Deploy to Base Mainnet
npm run deploy

# Or deploy to Base Sepolia testnet
npm run deploy:testnet
```

After deployment, copy the contract address and update both `.env` files:
- Root `.env`: `CONTRACT_ADDRESS=0x...`
- `webapp/.env`: `VITE_CONTRACT_ADDRESS=0x...`

### 4. Verify Contract (Optional)

```bash
npx hardhat verify --network base <CONTRACT_ADDRESS> "Base Telegram NFT" "BTNFT" "0" "0"
```

### 5. Start Development Servers

Open three terminal windows:

**Terminal 1 - Backend:**
```bash
npm run dev:backend
```

**Terminal 2 - Webapp:**
```bash
npm run dev:webapp
```

**Terminal 3 - Test Bot:**
```bash
# Open Telegram and start a chat with your bot
# Use /start to begin
```

## Usage

### Bot Commands

- `/start` - Welcome message and main menu
- `/mint` - Open minting interface
- `/balance` - Check your NFT balance
- `/collection` - View your minted NFTs

### Minting Flow

1. User sends `/mint` command to bot
2. Bot creates a session and sends WebApp button
3. User clicks button, opens minting interface
4. User connects wallet via Reown AppKit
5. User provides NFT metadata URI (IPFS)
6. User approves transaction in wallet
7. Smart contract mints NFT on Base
8. Bot confirms and saves NFT data

## Deployment to Production

### Deploy WebApp

Deploy the webapp to Vercel, Netlify, or similar:

```bash
cd webapp
npm run build

# Deploy the 'dist' folder to your hosting provider
```

Update `WEBAPP_URL` in root `.env` with your production URL.

### Deploy Backend

Deploy backend to Railway, Render, or DigitalOcean:

1. Push your code to GitHub
2. Connect your repository to hosting provider
3. Set environment variables in hosting dashboard
4. Deploy

### Update Telegram Bot

If using webhooks instead of polling:

```javascript
// In backend/src/index.js, replace polling with webhook
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
bot.setWebHook(`${YOUR_BACKEND_URL}/webhook/${process.env.TELEGRAM_BOT_TOKEN}`);

app.post(`/webhook/${process.env.TELEGRAM_BOT_TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});
```

## Configuration

### Contract Parameters

Edit `contracts/scripts/deploy.js` to customize:

```javascript
const name = 'Your NFT Name';
const symbol = 'SYMBOL';
const mintPrice = ethers.parseEther('0.001'); // 0.001 ETH
const maxSupply = 1000; // or 0 for unlimited
```

### Bot Settings

Edit `backend/src/config/constants.js`:

```javascript
MAX_MINT_PER_USER: 10,      // Max NFTs per user
MINT_COOLDOWN: 60000,        // 1 minute cooldown
```

### Reown AppKit Theme

Edit `webapp/src/config.js`:

```javascript
themeMode: 'dark',
themeVariables: {
  '--w3m-accent': '#0052FF'
}
```

## Testing

### Test Smart Contract

```bash
cd contracts
npm run test
```

### Test Bot Locally

1. Start backend: `npm run dev:backend`
2. Use a tool like ngrok to expose localhost:
   ```bash
   ngrok http 3000
   ```
3. Update `WEBAPP_URL` with ngrok URL
4. Chat with your bot on Telegram

## Troubleshooting

### "Polling error" in bot

- Check your `TELEGRAM_BOT_TOKEN` is correct
- Ensure no other bot instance is running with same token

### "Contract address not configured"

- Make sure you deployed the contract
- Update `CONTRACT_ADDRESS` in both `.env` files

### "VITE_REOWN_PROJECT_ID not set"

- Create a project at [cloud.reown.com](https://cloud.reown.com/)
- Add the project ID to `webapp/.env`

### Webapp shows "Wrong network"

- Make sure you're connected to Base Mainnet (Chain ID 8453)
- Switch network in your wallet

### IPFS uploads failing

- Verify Pinata API keys are correct
- Check Pinata account has available storage

## Advanced Features

### Add Image Upload

Allow users to upload images directly in Telegram:

1. Handle photo messages in backend
2. Upload to Pinata via IPFS service
3. Generate metadata automatically
4. Send to contract

### Implement Gasless Minting

Use meta-transactions with Gelato or Biconomy:

1. Set up relayer
2. Modify contract to support EIP-2771
3. Update webapp to use relayer

### Add Whitelist/Allowlist

```solidity
mapping(address => bool) public allowlist;

function mint(...) public {
    require(allowlist[msg.sender], "Not allowlisted");
    // ... rest of mint logic
}
```

### Multiple Collections

Deploy multiple contracts or add collection ID to metadata.

## Security Notes

- **Never commit `.env` files** - They contain sensitive keys
- **Secure your private key** - Use hardware wallet for mainnet deployments
- **Rate limiting** - Implement rate limiting on backend API
- **Input validation** - Validate all user inputs
- **Test thoroughly** - Test on testnet before mainnet deployment

## Resources

- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Reown AppKit Docs](https://docs.reown.com/appkit/overview)
- [Base Network Docs](https://docs.base.org/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Pinata IPFS](https://docs.pinata.cloud/)

## License

MIT

## Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation
- Review error logs in backend/webapp

---

Built with ❤️ for Base network
