import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { CONTRACT_ADDRESS, NFT_ABI, BACKEND_URL } from './config';
import './App.css';

// Access Telegram WebApp
const tg = window.Telegram?.WebApp;

function App() {
  const [status, setStatus] = useState('idle');
  const [nftName, setNftName] = useState('');
  const [nftDescription, setNftDescription] = useState('');
  const [metadataUri, setMetadataUri] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [telegramId, setTelegramId] = useState('');

  const { address, isConnected, chain } = useAccount();
  const { writeContract, data: hash, error: writeError, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    // Initialize Telegram WebApp
    if (tg) {
      tg.ready();
      tg.expand();

      // Get parameters from URL
      const urlParams = new URLSearchParams(window.location.search);
      const session = urlParams.get('session');
      const tgId = urlParams.get('telegramId');

      if (session) setSessionId(session);
      if (tgId) setTelegramId(tgId);
    }
  }, []);

  useEffect(() => {
    // Notify bot when wallet is connected
    if (isConnected && address && sessionId) {
      notifyWalletConnected();
    }
  }, [isConnected, address, sessionId]);

  useEffect(() => {
    // Handle mint confirmation
    if (isConfirmed && hash) {
      handleMintSuccess();
    }
  }, [isConfirmed, hash]);

  useEffect(() => {
    // Handle write errors
    if (writeError) {
      handleMintError(writeError.message);
    }
  }, [writeError]);

  const notifyWalletConnected = async () => {
    try {
      // Send data back to Telegram bot
      if (tg && tg.sendData) {
        tg.sendData(JSON.stringify({
          type: 'wallet_connected',
          walletAddress: address,
          sessionId
        }));
      }

      // Also send to backend API
      await fetch(`${BACKEND_URL}/api/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          telegramId,
          walletAddress: address
        })
      });
    } catch (error) {
      console.error('Error notifying wallet connection:', error);
    }
  };

  const handleMint = async () => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    if (!nftName || !metadataUri) {
      alert('Please provide NFT name and metadata URI');
      return;
    }

    try {
      setStatus('minting');

      // Call smart contract mint function
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: NFT_ABI,
        functionName: 'mint',
        args: [address, metadataUri]
      });
    } catch (error) {
      console.error('Mint error:', error);
      handleMintError(error.message);
    }
  };

  const handleMintSuccess = async () => {
    try {
      setStatus('success');

      // Get transaction receipt
      const response = await fetch(`https://mainnet.base.org`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getTransactionReceipt',
          params: [hash],
          id: 1
        })
      });

      const data = await response.json();
      const receipt = data.result;

      // Extract token ID from logs (simplified - you may need to parse logs properly)
      const tokenId = parseInt(receipt.logs[0]?.topics[3] || '0', 16);

      // Send data back to Telegram bot
      if (tg && tg.sendData) {
        tg.sendData(JSON.stringify({
          type: 'mint_success',
          tokenId,
          transactionHash: hash,
          walletAddress: address,
          metadataUri,
          blockNumber: parseInt(receipt.blockNumber, 16)
        }));
      }

      // Close the WebApp after a delay
      setTimeout(() => {
        if (tg) tg.close();
      }, 2000);
    } catch (error) {
      console.error('Error handling mint success:', error);
    }
  };

  const handleMintError = (errorMessage) => {
    setStatus('error');

    // Send error back to Telegram bot
    if (tg && tg.sendData) {
      tg.sendData(JSON.stringify({
        type: 'mint_error',
        error: errorMessage
      }));
    }
  };

  return (
    <div className="app">
      <div className="container">
        <h1>Mint Your NFT on Base</h1>

        {!isConnected ? (
          <div className="connect-section">
            <p>Connect your wallet to get started</p>
            <w3m-button />
          </div>
        ) : (
          <div className="mint-section">
            <div className="wallet-info">
              <p>Connected: {address?.slice(0, 6)}...{address?.slice(-4)}</p>
              <p>Network: {chain?.name}</p>
            </div>

            <div className="form">
              <div className="form-group">
                <label>NFT Name</label>
                <input
                  type="text"
                  value={nftName}
                  onChange={(e) => setNftName(e.target.value)}
                  placeholder="My Awesome NFT"
                  disabled={status === 'minting' || isConfirming}
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={nftDescription}
                  onChange={(e) => setNftDescription(e.target.value)}
                  placeholder="Description of your NFT"
                  rows="3"
                  disabled={status === 'minting' || isConfirming}
                />
              </div>

              <div className="form-group">
                <label>Metadata URI (IPFS)</label>
                <input
                  type="text"
                  value={metadataUri}
                  onChange={(e) => setMetadataUri(e.target.value)}
                  placeholder="ipfs://QmYourMetadataHash"
                  disabled={status === 'minting' || isConfirming}
                />
                <small>Upload your metadata to IPFS first</small>
              </div>

              <button
                onClick={handleMint}
                disabled={isPending || isConfirming || !metadataUri}
                className="mint-button"
              >
                {isPending ? 'Waiting for approval...' :
                 isConfirming ? 'Confirming transaction...' :
                 isConfirmed ? 'Minted!' :
                 'Mint NFT'}
              </button>

              {hash && (
                <div className="status">
                  <p>Transaction Hash:</p>
                  <a
                    href={`https://basescan.org/tx/${hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {hash.slice(0, 10)}...{hash.slice(-8)}
                  </a>
                </div>
              )}

              {status === 'success' && (
                <div className="success-message">
                  NFT minted successfully! Closing...
                </div>
              )}

              {status === 'error' && (
                <div className="error-message">
                  Error minting NFT. Please try again.
                </div>
              )}
            </div>

            <w3m-button />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
