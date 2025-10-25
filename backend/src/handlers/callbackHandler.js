import { handleStartCommand } from '../commands/start.js';
import { handleMintCommand } from '../commands/mint.js';
import { handleBalanceCommand } from '../commands/balance.js';
import { handleCollectionCommand } from '../commands/collection.js';
import { MESSAGES } from '../config/constants.js';

/**
 * Handle callback queries from inline keyboards
 */
export async function handleCallbackQuery(bot, query) {
  const chatId = query.message.chat.id;
  const data = query.data;

  try {
    // Answer the callback query to remove loading state
    await bot.answerCallbackQuery(query.id);

    // Route based on callback data
    switch (data) {
      case 'mint':
        await handleMintCommand(bot, { chat: { id: chatId }, from: query.from });
        break;

      case 'balance':
        await handleBalanceCommand(bot, { chat: { id: chatId }, from: query.from });
        break;

      case 'collection':
        await handleCollectionCommand(bot, { chat: { id: chatId }, from: query.from });
        break;

      case 'help':
        await bot.sendMessage(chatId, MESSAGES.WELCOME);
        break;

      default:
        console.log('Unknown callback data:', data);
    }
  } catch (error) {
    console.error('Error handling callback query:', error);
    await bot.sendMessage(chatId, MESSAGES.ERROR);
  }
}
