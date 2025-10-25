import { userDB, nftDB, sessionDB } from '../services/database.js';
import { MESSAGES } from '../config/constants.js';

/**
 * Handle web_app_data from Telegram WebApp
 * This is called when the webapp sends data back to the bot
 */
export async function handleWebAppData(bot, msg) {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id;

  try {
    // Parse data from webapp
    const data = JSON.parse(msg.web_app_data.data);

    console.log('Received webapp data:', data);

    // Handle different types of webapp data
    switch (data.type) {
      case 'mint_success':
        await handleMintSuccess(bot, chatId, telegramId, data);
        break;

      case 'wallet_connected':
        await handleWalletConnected(bot, chatId, telegramId, data);
        break;

      case 'mint_error':
        await handleMintError(bot, chatId, telegramId, data);
        break;

      default:
        console.log('Unknown webapp data type:', data.type);
    }
  } catch (error) {
    console.error('Error handling webapp data:', error);
    await bot.sendMessage(chatId, MESSAGES.ERROR);
  }
}

/**
 * Handle successful NFT mint
 */
async function handleMintSuccess(bot, chatId, telegramId, data) {
  const { tokenId, transactionHash, walletAddress, metadataUri, blockNumber } = data;

  try {
    // Update user's wallet address if not already set
    const user = userDB.get(telegramId);
    if (!user.wallet_address || user.wallet_address !== walletAddress) {
      userDB.updateWallet(telegramId, walletAddress);
    }

    // Increment mint count
    userDB.incrementMintCount(telegramId);

    // Save NFT to database
    nftDB.create(tokenId, telegramId, walletAddress, metadataUri, transactionHash, blockNumber);

    // Send success message
    await bot.sendMessage(chatId, MESSAGES.MINT_SUCCESS(tokenId, transactionHash), {
      parse_mode: 'Markdown'
    });
  } catch (error) {
    console.error('Error handling mint success:', error);
    throw error;
  }
}

/**
 * Handle wallet connection
 */
async function handleWalletConnected(bot, chatId, telegramId, data) {
  const { walletAddress, sessionId } = data;

  try {
    // Update user's wallet address
    userDB.updateWallet(telegramId, walletAddress);

    // Update session with wallet address
    if (sessionId) {
      sessionDB.updateWallet(sessionId, walletAddress);
    }

    await bot.sendMessage(chatId, `Wallet connected successfully!\n\nAddress: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`);
  } catch (error) {
    console.error('Error handling wallet connection:', error);
    throw error;
  }
}

/**
 * Handle mint error
 */
async function handleMintError(bot, chatId, telegramId, data) {
  const { error } = data;

  let errorMessage = 'Failed to mint NFT. ';

  if (error.includes('rejected')) {
    errorMessage += 'Transaction was rejected by user.';
  } else if (error.includes('insufficient funds')) {
    errorMessage += 'Insufficient funds for gas fees.';
  } else {
    errorMessage += 'Please try again later.';
  }

  await bot.sendMessage(chatId, errorMessage);
}
