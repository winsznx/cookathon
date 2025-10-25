/**
 * Farcaster Mini App Handler
 * Handles Farcaster-specific events and webhooks
 */

import { userDB, nftDB } from '../services/database.js';

/**
 * Handle Farcaster session creation
 * Called when a user connects their wallet in the mini app
 */
export async function handleFarcasterSession(req, res) {
  try {
    const { walletAddress, farcasterFid, username } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    // Create or update Farcaster user if FID is provided
    if (farcasterFid) {
      userDB.createFarcaster(farcasterFid, username || `fc_${farcasterFid}`);
      userDB.updateWalletFarcaster(farcasterFid, walletAddress);
    } else {
      // If no FID, just track by wallet
      console.log('Farcaster session created for wallet:', walletAddress);
    }

    res.json({
      success: true,
      message: 'Session created successfully'
    });
  } catch (error) {
    console.error('Error handling Farcaster session:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Handle successful NFT mint from Farcaster
 */
export async function handleFarcasterMintSuccess(req, res) {
  try {
    const {
      tokenId,
      transactionHash,
      walletAddress,
      metadataUri,
      blockNumber,
      farcasterFid
    } = req.body;

    if (!tokenId || !transactionHash || !walletAddress) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get or create user
    let user;
    if (farcasterFid) {
      user = userDB.getByFarcasterFid(farcasterFid);
      if (!user) {
        userDB.createFarcaster(farcasterFid, `fc_${farcasterFid}`);
        user = userDB.getByFarcasterFid(farcasterFid);
      }
    } else {
      user = userDB.getByWallet(walletAddress);
      if (!user) {
        // Create a Farcaster user without FID
        userDB.createFarcaster(Date.now(), walletAddress);
        userDB.updateWalletFarcaster(Date.now(), walletAddress);
        user = userDB.getByWallet(walletAddress);
      }
    }

    // Save NFT to database
    nftDB.create(
      tokenId,
      user.id,
      walletAddress,
      metadataUri,
      transactionHash,
      blockNumber || 0,
      'farcaster'
    );

    // Increment user's mint count
    userDB.incrementMintCount(user.id);

    console.log(`NFT minted successfully via Farcaster: Token ID ${tokenId}`);

    res.json({
      success: true,
      message: 'NFT minted successfully',
      tokenId,
      transactionHash
    });
  } catch (error) {
    console.error('Error handling Farcaster mint success:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Handle Farcaster webhooks
 * Receives events like miniapp_added, notifications_enabled, etc.
 */
export async function handleFarcasterWebhook(req, res) {
  try {
    const { event, data } = req.body;

    console.log('Farcaster webhook received:', event, data);

    switch (event) {
      case 'miniapp_added':
        console.log('User added mini app:', data);
        // Track that user added the mini app
        break;

      case 'miniapp_removed':
        console.log('User removed mini app:', data);
        // Track that user removed the mini app
        break;

      case 'notifications_enabled':
        console.log('User enabled notifications:', data);
        // Update user notification preferences
        break;

      case 'notifications_disabled':
        console.log('User disabled notifications:', data);
        // Update user notification preferences
        break;

      default:
        console.log('Unknown webhook event:', event);
    }

    res.json({
      success: true,
      message: 'Webhook processed'
    });
  } catch (error) {
    console.error('Error handling Farcaster webhook:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Get user stats for Farcaster users
 */
export async function getFarcasterUserStats(req, res) {
  try {
    const { farcasterFid, walletAddress } = req.query;

    let user;
    if (farcasterFid) {
      user = userDB.getByFarcasterFid(parseInt(farcasterFid));
    } else if (walletAddress) {
      user = userDB.getByWallet(walletAddress);
    }

    if (!user) {
      return res.json({
        success: true,
        nftsMinted: 0,
        nfts: []
      });
    }

    const nfts = nftDB.getByUserId(user.id);

    res.json({
      success: true,
      user: {
        username: user.username,
        nftsMinted: user.nfts_minted,
        walletAddress: user.wallet_address
      },
      nfts
    });
  } catch (error) {
    console.error('Error getting Farcaster user stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
