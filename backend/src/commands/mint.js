import { v4 as uuidv4 } from 'uuid';
import { userDB, sessionDB } from '../services/database.js';
import { MESSAGES, KEYBOARDS, CONFIG } from '../config/constants.js';

/**
 * Handle /mint command
 */
export async function handleMintCommand(bot, msg) {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id;
  const username = msg.from.username;

  try {
    // Create user if doesn't exist
    userDB.create(telegramId, username);

    // Check if user can mint
    const canMintCheck = userDB.canMint(telegramId);

    if (!canMintCheck.canMint) {
      if (canMintCheck.reason === 'max_limit') {
        await bot.sendMessage(chatId, MESSAGES.MAX_LIMIT);
        return;
      }

      if (canMintCheck.reason === 'cooldown') {
        await bot.sendMessage(chatId, MESSAGES.COOLDOWN(canMintCheck.remainingSeconds));
        return;
      }
    }

    // Create session for webapp
    const sessionId = uuidv4();
    sessionDB.create(sessionId, telegramId, 3600); // 1 hour expiry

    // Build webapp URL with session
    const webappUrl = `${CONFIG.WEBAPP_URL}?session=${sessionId}&telegramId=${telegramId}`;

    // Send mint intro with webapp button
    await bot.sendMessage(chatId, MESSAGES.MINT_INTRO, {
      reply_markup: KEYBOARDS.MINT_BUTTON(webappUrl),
      parse_mode: 'Markdown'
    });
  } catch (error) {
    console.error('Error in mint command:', error);
    await bot.sendMessage(chatId, MESSAGES.ERROR);
  }
}
