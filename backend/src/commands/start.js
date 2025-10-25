import { userDB } from '../services/database.js';
import { MESSAGES, KEYBOARDS } from '../config/constants.js';

/**
 * Handle /start command
 */
export async function handleStartCommand(bot, msg) {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id;
  const username = msg.from.username;

  try {
    // Create or update user in database
    userDB.create(telegramId, username);

    // Send welcome message with main menu
    await bot.sendMessage(chatId, MESSAGES.WELCOME, {
      reply_markup: KEYBOARDS.MAIN_MENU,
      parse_mode: 'Markdown'
    });
  } catch (error) {
    console.error('Error in start command:', error);
    await bot.sendMessage(chatId, MESSAGES.ERROR);
  }
}
