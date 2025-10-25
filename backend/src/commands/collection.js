import { userDB, nftDB } from '../services/database.js';
import { getNFTMetadata } from '../services/blockchain.js';
import { CONFIG, MESSAGES } from '../config/constants.js';

/**
 * Handle /collection command
 */
export async function handleCollectionCommand(bot, msg) {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id;

  try {
    const user = userDB.get(telegramId);

    if (!user) {
      await bot.sendMessage(chatId, 'You haven\'t minted any NFTs yet. Use /mint to get started!');
      return;
    }

    // Get user's NFTs from database
    const nfts = nftDB.getByOwner(telegramId);

    if (nfts.length === 0) {
      await bot.sendMessage(chatId, 'You haven\'t minted any NFTs yet. Use /mint to get started!');
      return;
    }

    // Send header message
    await bot.sendMessage(chatId, `Your NFT Collection\n\nYou own ${nfts.length} NFT${nfts.length !== 1 ? 's' : ''}:`);

    // Send each NFT as a separate message with details
    for (const nft of nfts.slice(0, 10)) { // Limit to 10 to avoid spam
      try {
        const metadata = await getNFTMetadata(nft.metadata_uri);

        let message = `Token ID: ${nft.token_id}\n`;

        if (metadata) {
          message += `Name: ${metadata.name || 'Unknown'}\n`;
          if (metadata.description) {
            message += `Description: ${metadata.description}\n`;
          }
        }

        message += `\nTransaction: ${CONFIG.BLOCK_EXPLORER}/tx/${nft.transaction_hash}`;
        message += `\nMinted: ${new Date(nft.minted_at * 1000).toLocaleString()}`;

        // If metadata has image, send as photo
        if (metadata?.image) {
          let imageUrl = metadata.image;
          if (imageUrl.startsWith('ipfs://')) {
            imageUrl = imageUrl.replace('ipfs://', CONFIG.IPFS_GATEWAY);
          }

          try {
            await bot.sendPhoto(chatId, imageUrl, { caption: message });
          } catch (photoError) {
            // If photo fails, send as text
            await bot.sendMessage(chatId, message);
          }
        } else {
          await bot.sendMessage(chatId, message);
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error displaying NFT ${nft.token_id}:`, error);
      }
    }

    if (nfts.length > 10) {
      await bot.sendMessage(chatId, `... and ${nfts.length - 10} more NFTs`);
    }
  } catch (error) {
    console.error('Error in collection command:', error);
    await bot.sendMessage(chatId, MESSAGES.ERROR);
  }
}
