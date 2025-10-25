import { userDB, nftDB } from '../services/database.js';
import { getNFTBalance } from '../services/blockchain.js';
import { MESSAGES } from '../config/constants.js';

/**
 * Handle /balance command
 */
export async function handleBalanceCommand(bot, msg) {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id;

  try {
    const user = userDB.get(telegramId);

    if (!user) {
      await bot.sendMessage(chatId, 'You haven\'t minted any NFTs yet. Use /mint to get started!');
      return;
    }

    // Get NFT count from database
    const dbCount = nftDB.getCount(telegramId);

    let message = `Your NFT Balance

Minted through this bot: ${dbCount} NFT${dbCount !== 1 ? 's' : ''}`;

    // If wallet is connected, get on-chain balance
    if (user.wallet_address) {
      try {
        const onChainBalance = await getNFTBalance(user.wallet_address);
        message += `\nTotal in wallet (${user.wallet_address.slice(0, 6)}...${user.wallet_address.slice(-4)}): ${onChainBalance} NFT${onChainBalance !== 1 ? 's' : ''}`;
      } catch (error) {
        console.error('Error getting on-chain balance:', error);
      }
    }

    message += '\n\nUse /collection to view your NFTs.';

    await bot.sendMessage(chatId, message);
  } catch (error) {
    console.error('Error in balance command:', error);
    await bot.sendMessage(chatId, MESSAGES.ERROR);
  }
}
