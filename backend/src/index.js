import TelegramBot from 'node-telegram-bot-api';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Import handlers
import { handleStartCommand } from './commands/start.js';
import { handleMintCommand } from './commands/mint.js';
import { handleBalanceCommand } from './commands/balance.js';
import { handleCollectionCommand } from './commands/collection.js';
import { handleCallbackQuery } from './handlers/callbackHandler.js';
import { handleWebAppData } from './handlers/webappHandler.js';

// Import services
import { initDatabase } from './services/database.js';
import { CONFIG } from './config/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../../.env') });

// Validate environment variables
if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error('Error: TELEGRAM_BOT_TOKEN is required in .env file');
  process.exit(1);
}

// Initialize database
initDatabase();

// Create bot instance
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
  polling: true,
  filepath: false
});

// Create Express app for webhook and API
const app = express();
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Session management endpoint for webapp
app.post('/api/session', (req, res) => {
  const { telegramId, walletAddress } = req.body;
  // Handle session creation
  res.json({ success: true });
});

// Upload metadata to IPFS endpoint
app.post('/api/upload-metadata', async (req, res) => {
  try {
    const { name, description, imageUrl, attributes } = req.body;

    if (!name || !description) {
      return res.status(400).json({ error: 'Name and description are required' });
    }

    // Import IPFS service
    const { createNFTMetadata, uploadMetadata } = await import('./services/ipfs.js');

    // Create metadata object
    const metadata = createNFTMetadata(
      name,
      description,
      imageUrl || 'https://via.placeholder.com/500',
      attributes || []
    );

    // Upload to IPFS
    const result = await uploadMetadata(metadata);

    res.json({
      success: true,
      ipfsHash: result.ipfsHash,
      uri: result.uri,
      gatewayUrl: result.gatewayUrl,
      metadata
    });
  } catch (error) {
    console.error('Error uploading metadata:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Bot command handlers
bot.onText(/\/start/, (msg) => handleStartCommand(bot, msg));
bot.onText(/\/mint/, (msg) => handleMintCommand(bot, msg));
bot.onText(/\/balance/, (msg) => handleBalanceCommand(bot, msg));
bot.onText(/\/collection/, (msg) => handleCollectionCommand(bot, msg));

// Callback query handler (for inline keyboard buttons)
bot.on('callback_query', (query) => handleCallbackQuery(bot, query));

// WebApp data handler
bot.on('web_app_data', (msg) => handleWebAppData(bot, msg));

// Error handling
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
});

// Start Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Bot started successfully!`);
  console.log(`Network: ${CONFIG.NETWORK_NAME}`);
  console.log(`Contract: ${process.env.CONTRACT_ADDRESS || 'Not set'}`);
});

export { bot, app };
