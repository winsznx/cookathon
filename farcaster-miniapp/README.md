# Farcaster Mini App - NFT Minting on Base

A Farcaster Mini App (Frames v2) for minting NFTs on the Base network. This mini app allows Farcaster users to mint NFTs directly within Farcaster clients like Warpcast.

## Features

- **Wallet Auto-Connection**: Automatically connects to the user's Farcaster wallet
- **Base Network**: Mint NFTs on Base Mainnet
- **IPFS Metadata**: Upload metadata to IPFS via Pinata
- **Seamless UX**: No manual wallet connection required
- **Multi-Platform**: Shared backend with Telegram bot

## Architecture

This mini app is part of a multi-platform NFT minting system that includes:

- **Backend**: Express.js API with Farcaster endpoints
- **Database**: SQLite database tracking both Telegram and Farcaster users
- **Smart Contract**: ERC-721 NFT contract on Base
- **IPFS**: Pinata for decentralized metadata storage

## Prerequisites

- Node.js v18+ and npm
- Deployed NFT contract on Base (from contracts/ folder)
- Backend server running
- Pinata API keys for IPFS uploads
- Domain for hosting (required for production)

## Quick Start

### 1. Configure Environment

Copy the example environment file:

```bash
cd farcaster-miniapp
cp .env.example .env
```

Edit `.env`:

```env
VITE_CONTRACT_ADDRESS=0x15d56140A49c16EA636C9a7485D8f8E22a592bF0
VITE_BACKEND_URL=http://localhost:3000
```

### 2. Install Dependencies

From the root of the project:

```bash
npm install:all
```

Or just for the mini app:

```bash
cd farcaster-miniapp
npm install
```

### 3. Start Development Server

```bash
# From root
npm run dev:farcaster

# Or from farcaster-miniapp directory
npm run dev
```

The mini app will be available at `http://localhost:5174`

### 4. Test Locally

For local testing, you'll need to:

1. Start the backend: `npm run dev:backend`
2. Start the mini app: `npm run dev:farcaster`
3. Use a tunneling service like ngrok to expose your local server
4. Update the Farcaster manifest with your public URL

## Production Deployment

### 1. Build the Mini App

```bash
npm run build:farcaster
```

This creates a production build in `farcaster-miniapp/dist/`

### 2. Deploy to Hosting

Deploy the `dist/` folder to your hosting provider:

- **Vercel**: Connect your repo and set build directory to `farcaster-miniapp/dist`
- **Netlify**: Deploy `farcaster-miniapp/dist` folder
- **Cloudflare Pages**: Deploy from GitHub with custom build settings

### 3. Configure Farcaster Manifest

Update your backend's `.env` with production URLs:

```env
FARCASTER_MINIAPP_URL=https://your-miniapp-domain.com
BACKEND_URL=https://your-backend-domain.com
```

The manifest is served at `/.well-known/farcaster.json` by your backend.

### 4. Set Up Account Association

To verify your mini app domain, you need to create a Farcaster account association:

1. Generate the association using Farcaster's signing tools
2. Update environment variables:
   - `FARCASTER_ACCOUNT_HEADER`
   - `FARCASTER_ACCOUNT_PAYLOAD`
   - `FARCASTER_ACCOUNT_SIGNATURE`

See [Farcaster Docs](https://miniapps.farcaster.xyz/docs/specification#account-association) for details.

## Development

### Project Structure

```
farcaster-miniapp/
├── src/
│   ├── App.jsx           # Main mini app component
│   ├── App.css           # Styling
│   ├── config.js         # Wagmi & contract configuration
│   └── main.jsx          # React entry point
├── public/
│   └── .well-known/
│       └── farcaster.json  # Mini app manifest (served by backend)
├── index.html            # HTML with Farcaster meta tags
├── vite.config.js        # Vite configuration
├── package.json
└── .env.example
```

### Key Components

#### App.jsx

The main component handles:

- Auto-connecting to Farcaster wallet via `@farcaster/miniapp-wagmi-connector`
- NFT metadata form
- IPFS upload
- NFT minting transaction
- Success/error handling

#### config.js

Configures Wagmi with the Farcaster Mini App connector:

```javascript
import { farcasterMiniApp as miniAppConnector } from '@farcaster/miniapp-wagmi-connector';

export const wagmiConfig = createConfig({
  chains: [base],
  transports: { [base.id]: http() },
  connectors: [miniAppConnector()]
});
```

### Backend Integration

The mini app communicates with these backend endpoints:

- `POST /api/farcaster/session` - Session creation
- `POST /api/farcaster/mint-success` - Record successful mint
- `POST /api/farcaster/webhook` - Receive Farcaster events
- `GET /api/farcaster/stats` - Get user statistics
- `POST /api/upload-metadata` - Upload metadata to IPFS

### Database Schema

Farcaster users are stored in the same `users` table as Telegram users:

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id INTEGER UNIQUE,
  farcaster_fid INTEGER UNIQUE,
  username TEXT,
  platform TEXT NOT NULL DEFAULT 'telegram',
  wallet_address TEXT,
  nfts_minted INTEGER DEFAULT 0,
  ...
)
```

## Customization

### Update Meta Tags

Edit `index.html` to customize the mini app preview:

```html
<meta name="fc:miniapp" content='{"version":"1","imageUrl":"YOUR_IMAGE","button":{"title":"Mint NFT","action":"launch_miniapp"}}' />
```

### Update Styling

Modify `src/App.css` to customize the look and feel. The current theme uses a purple gradient inspired by Farcaster's brand colors.

### Add More Features

Extend `src/App.jsx` to add:

- NFT gallery view
- Multiple NFT minting
- Image upload directly in the app
- Collection browsing

## Testing

### Local Testing

1. Start all services:
   ```bash
   npm run dev:backend    # Terminal 1
   npm run dev:farcaster  # Terminal 2
   ```

2. Access the mini app at `http://localhost:5174`

3. Test the minting flow:
   - Wallet auto-connects (or click Connect)
   - Fill in NFT details
   - Generate metadata URI
   - Mint NFT
   - Verify transaction on BaseScan

### Testing in Warpcast

To test in a real Farcaster client:

1. Deploy to a public URL (or use ngrok)
2. Create a test cast with your mini app URL
3. Open in Warpcast
4. Verify the mini app loads correctly
5. Test the full minting flow

## Troubleshooting

### "Wallet not connecting"

- Ensure you're using `@farcaster/miniapp-wagmi-connector`
- Check that the Farcaster SDK is loaded
- Verify you're accessing from a Farcaster client

### "Wrong network" error

- Make sure your wallet is on Base Mainnet (Chain ID 8453)
- The mini app should automatically prompt to switch networks

### "IPFS upload failing"

- Check Pinata API keys in backend `.env`
- Verify backend is running and accessible
- Check CORS settings if accessing from different domain

### Manifest not loading

- Ensure backend is serving `/.well-known/farcaster.json`
- Check environment variables are set correctly
- Verify domain matches in account association

## Resources

- [Farcaster Mini Apps Docs](https://miniapps.farcaster.xyz/)
- [Wagmi Documentation](https://wagmi.sh/)
- [Base Network Docs](https://docs.base.org/)
- [Viem Documentation](https://viem.sh/)

## License

MIT

---

Built for the Base ecosystem and Farcaster community
