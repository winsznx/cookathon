# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         User (Telegram)                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Commands (/start, /mint, etc.)
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Telegram Bot Backend                     │
│                    (Node.js + Express)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Commands   │  │   Handlers   │  │   Services   │      │
│  │              │  │              │  │              │      │
│  │ - start      │  │ - callback   │  │ - database   │      │
│  │ - mint       │  │ - webapp     │  │ - blockchain │      │
│  │ - balance    │  │              │  │ - ipfs       │      │
│  │ - collection │  │              │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────┬──────────────────────────┬────────────────────┘
              │                          │
              │ Opens WebApp             │ API Calls
              │                          │
              ▼                          ▼
┌──────────────────────────┐   ┌─────────────────────┐
│   WebApp (React + Vite)  │   │  SQLite Database    │
│   Reown AppKit           │   │                     │
│                          │   │ - users             │
│  ┌────────────────────┐  │   │ - nfts              │
│  │ Wallet Connection  │  │   │ - sessions          │
│  └────────────────────┘  │   └─────────────────────┘
│  ┌────────────────────┐  │
│  │ Mint Interface     │  │
│  └────────────────────┘  │
└────────────┬─────────────┘
             │
             │ Web3 Calls
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│                      Base Network (L2)                      │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           BaseNFT Smart Contract (ERC-721)           │  │
│  │                                                      │  │
│  │  - mint(address, tokenURI)                          │  │
│  │  - balanceOf(address)                               │  │
│  │  - tokenOfOwnerByIndex(address, index)              │  │
│  │  - totalSupply()                                    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                             │
                             │ Metadata URI
                             │
                             ▼
                   ┌──────────────────┐
                   │   IPFS (Pinata)  │
                   │                  │
                   │  NFT Metadata    │
                   │  & Images        │
                   └──────────────────┘
```

## Component Details

### 1. Telegram Bot Backend

**Technology:** Node.js, Express, node-telegram-bot-api

**Responsibilities:**
- Handle Telegram bot commands
- Manage user sessions
- Create WebApp URLs with session tokens
- Process minting confirmations from WebApp
- Store NFT data in database
- Provide API endpoints for WebApp

**Key Files:**
- `backend/src/index.js` - Main entry point
- `backend/src/commands/*.js` - Command handlers
- `backend/src/handlers/*.js` - Event handlers
- `backend/src/services/database.js` - SQLite operations
- `backend/src/services/blockchain.js` - Web3 interactions
- `backend/src/services/ipfs.js` - IPFS operations

### 2. WebApp (Minting Interface)

**Technology:** React, Vite, Reown AppKit, Wagmi, Viem

**Responsibilities:**
- Wallet connection via Reown AppKit (WalletConnect v2)
- Display minting interface
- Interact with smart contract
- Send transaction data back to bot
- Handle transaction confirmations

**Key Files:**
- `webapp/src/App.jsx` - Main UI component
- `webapp/src/config.js` - Reown AppKit configuration
- `webapp/src/main.jsx` - App entry point

**Features:**
- Support for all WalletConnect-compatible wallets
- Real-time transaction status
- Network validation
- Gas estimation
- Error handling

### 3. Smart Contract

**Technology:** Solidity 0.8.24, OpenZeppelin, Hardhat

**Responsibilities:**
- Mint NFTs on Base network
- Store token ownership
- Manage metadata URIs
- Track total supply
- Handle payments (if configured)

**Key Files:**
- `contracts/contracts/BaseNFT.sol` - Main NFT contract
- `contracts/scripts/deploy.js` - Deployment script
- `contracts/test/BaseNFT.test.js` - Unit tests

**Standards:**
- ERC-721 (NFT standard)
- ERC-721Enumerable (token enumeration)
- ERC-721URIStorage (metadata storage)

### 4. Database

**Technology:** better-sqlite3 (SQLite)

**Schema:**

**Users Table:**
```sql
- telegram_id (PRIMARY KEY)
- username
- wallet_address
- nfts_minted
- total_spent
- last_mint_at
- created_at
- updated_at
```

**NFTs Table:**
```sql
- id (PRIMARY KEY)
- token_id
- owner_telegram_id (FOREIGN KEY)
- owner_wallet_address
- metadata_uri
- transaction_hash
- block_number
- minted_at
```

**Sessions Table:**
```sql
- id (PRIMARY KEY)
- telegram_id (FOREIGN KEY)
- wallet_address
- data
- expires_at
- created_at
```

### 5. IPFS Storage

**Technology:** Pinata (IPFS pinning service)

**Responsibilities:**
- Store NFT metadata (JSON)
- Host NFT images (optional)
- Provide decentralized access

**Metadata Format (ERC-721):**
```json
{
  "name": "NFT Name",
  "description": "NFT Description",
  "image": "ipfs://Qm...",
  "attributes": [
    {
      "trait_type": "Property",
      "value": "Value"
    }
  ]
}
```

## Data Flow

### Minting Flow

```
1. User → /mint → Bot
2. Bot → Create Session → Database
3. Bot → Send WebApp Button → User
4. User → Click Button → WebApp Opens
5. WebApp → Connect Wallet → Reown AppKit
6. User → Approve Connection → Wallet
7. WebApp → Get Wallet Address → User
8. WebApp → Notify Connected → Bot API
9. Bot → Update Session → Database
10. User → Enter Metadata → WebApp
11. WebApp → Call mint() → Smart Contract
12. Smart Contract → Request Approval → Wallet
13. User → Approve Transaction → Wallet
14. Smart Contract → Mint NFT → Blockchain
15. Blockchain → Emit Event → WebApp
16. WebApp → Send Success → Bot
17. Bot → Save NFT Data → Database
18. Bot → Confirm Success → User
19. WebApp → Close
```

### Balance Query Flow

```
1. User → /balance → Bot
2. Bot → Get User → Database
3. Bot → Query balanceOf() → Smart Contract
4. Smart Contract → Return Balance → Bot
5. Bot → Display Balance → User
```

### Collection View Flow

```
1. User → /collection → Bot
2. Bot → Get User NFTs → Database
3. For each NFT:
   a. Bot → Fetch Metadata → IPFS
   b. Bot → Parse JSON → Metadata
   c. Bot → Send Photo/Message → User
4. Bot → Complete → User
```

## Security Considerations

### Bot Backend
- No private keys stored
- Session-based authentication
- Rate limiting on minting
- Input validation
- SQL injection protection (parameterized queries)

### WebApp
- Client-side wallet connection only
- No sensitive data stored
- Secure session tokens (UUID v4)
- Network validation (Base only)
- Transaction simulation before signing

### Smart Contract
- OpenZeppelin audited contracts
- Owner-only functions protected
- Reentrancy protection (inherited)
- Integer overflow protection (Solidity 0.8+)
- Access control with Ownable

### Database
- Local SQLite (no remote access)
- No password storage
- Session expiration
- Automatic cleanup of old sessions

## Scalability

### Current Limitations
- SQLite (single-file database)
- Polling-based bot (not webhooks)
- Single server deployment

### Scaling Options

**Database:**
- Migrate to PostgreSQL/MySQL
- Implement connection pooling
- Add read replicas

**Bot:**
- Switch to webhooks
- Horizontal scaling with load balancer
- Use message queue (Redis/RabbitMQ)

**WebApp:**
- CDN for static assets
- Edge deployment (Vercel/Cloudflare)
- API caching

**Infrastructure:**
- Containerize with Docker
- Kubernetes orchestration
- Monitoring with Grafana/Prometheus

## Network Architecture (Base)

```
Ethereum Mainnet (L1)
        ↓
    [Bridge]
        ↓
Base Mainnet (L2)
        ↓
   BaseNFT Contract
```

**Advantages of Base:**
- Low gas fees (~$0.01 per transaction)
- Fast confirmations (~2 seconds)
- Ethereum-compatible
- Growing ecosystem
- Coinbase backed

## Deployment Architecture

### Development
```
Local Machine
├── Backend (localhost:3000)
├── WebApp (localhost:5173)
└── Database (./data/bot.db)
```

### Production
```
Cloud Provider (Railway/Render)
├── Backend Server
│   ├── Node.js Application
│   ├── SQLite Database
│   └── Environment Variables
└── Static WebApp (Vercel/Netlify)
    ├── React Build
    └── Environment Variables

Base Mainnet
└── BaseNFT Contract (deployed)

IPFS (Pinata)
└── Metadata & Assets
```

## Technology Stack Summary

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Bot Backend | Node.js + Express | Handle Telegram interactions |
| Bot Library | node-telegram-bot-api | Telegram Bot API wrapper |
| Database | SQLite (better-sqlite3) | Store user/NFT data |
| WebApp Framework | React + Vite | Frontend UI |
| Wallet Connection | Reown AppKit | WalletConnect integration |
| Web3 Library | Wagmi + Viem | Blockchain interactions |
| Smart Contract | Solidity 0.8.24 | NFT minting logic |
| Contract Framework | Hardhat | Development & deployment |
| Contract Standards | OpenZeppelin | Audited implementations |
| Blockchain | Base (Ethereum L2) | Low-cost NFT minting |
| Metadata Storage | IPFS (Pinata) | Decentralized storage |

## Extension Points

### Adding New Features

**1. Image Upload:**
- Handle Telegram photo messages
- Upload to Pinata
- Generate metadata automatically

**2. Payment Integration:**
- Accept crypto payments
- Integrate payment processors
- Track revenue

**3. Admin Dashboard:**
- Create admin commands
- View statistics
- Manage users

**4. Multiple Collections:**
- Deploy multiple contracts
- Collection selector in WebApp
- Separate databases per collection

**5. Gasless Minting:**
- Integrate meta-transactions
- Use Gelato/Biconomy
- Sponsored transactions

**6. Marketplace:**
- List NFTs for sale
- P2P trading
- Royalty tracking

---

This architecture provides a solid foundation for an NFT minting bot while remaining flexible for future enhancements.
