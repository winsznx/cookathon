import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../../.env') });

// Base Mainnet Configuration
export const BASE_MAINNET = {
  chainId: 8453,
  name: 'Base Mainnet',
  rpcUrl: 'https://mainnet.base.org',
  blockExplorer: 'https://basescan.org',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18
  }
};

// Base Sepolia Testnet Configuration
export const BASE_SEPOLIA = {
  chainId: 84532,
  name: 'Base Sepolia',
  rpcUrl: 'https://sepolia.base.org',
  blockExplorer: 'https://sepolia.basescan.org',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18
  }
};

// Current network configuration
export const NETWORK = BASE_MAINNET;

// Application configuration
export const CONFIG = {
  // Network
  NETWORK_NAME: NETWORK.name,
  CHAIN_ID: NETWORK.chainId,
  RPC_URL: process.env.BASE_RPC_URL || NETWORK.rpcUrl,
  BLOCK_EXPLORER: NETWORK.blockExplorer,

  // Contract
  CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS,

  // WebApp URL (where your Reown AppKit webapp is hosted)
  WEBAPP_URL: process.env.WEBAPP_URL || 'http://localhost:5173',

  // Bot settings
  MAX_MINT_PER_USER: 10,
  MINT_COOLDOWN: 60000, // 1 minute in milliseconds

  // IPFS settings (for metadata)
  IPFS_GATEWAY: 'https://gateway.pinata.cloud/ipfs/',
  PINATA_API_KEY: process.env.PINATA_API_KEY,
  PINATA_SECRET_KEY: process.env.PINATA_SECRET_KEY,

  // Database
  DB_PATH: process.env.DB_PATH || './data/bot.db'
};

// Bot messages
export const MESSAGES = {
  WELCOME: `Welcome to the Base NFT Minting Bot!

This bot allows you to mint NFTs directly on Base network.

Commands:
/mint - Start minting an NFT
/balance - Check your NFT balance
/collection - View your NFT collection
/help - Show help information

Get started by connecting your wallet and minting your first NFT!`,

  MINT_INTRO: `Let's mint your NFT on Base!

Click the button below to open the minting interface. You'll be able to:
- Connect your wallet using Reown AppKit
- Customize your NFT
- Mint directly to Base network

Ready? Let's go!`,

  MINT_SUCCESS: (tokenId, txHash) => `Congratulations! Your NFT has been minted successfully!

Token ID: ${tokenId}
Transaction: ${CONFIG.BLOCK_EXPLORER}/tx/${txHash}

View your collection with /collection`,

  ERROR: 'Oops! Something went wrong. Please try again later.',

  WALLET_NOT_CONNECTED: 'Please connect your wallet first using the /mint command.',

  COOLDOWN: (seconds) => `Please wait ${seconds} seconds before minting again.`,

  MAX_LIMIT: `You've reached the maximum mint limit (${CONFIG.MAX_MINT_PER_USER} NFTs).`
};

// Inline keyboard buttons
export const KEYBOARDS = {
  MAIN_MENU: {
    inline_keyboard: [
      [
        { text: 'Mint NFT', callback_data: 'mint' },
        { text: 'My Collection', callback_data: 'collection' }
      ],
      [
        { text: 'Balance', callback_data: 'balance' },
        { text: 'Help', callback_data: 'help' }
      ]
    ]
  },

  MINT_BUTTON: (webappUrl) => ({
    inline_keyboard: [
      [
        {
          text: 'Open Minting App',
          web_app: { url: webappUrl }
        }
      ]
    ]
  })
};
