import { useState, useEffect } from 'react';
import { useAccount, useConnect, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { CONTRACT_ADDRESS, NFT_ABI, BACKEND_URL } from './config';
import './App.css';

// Note: SDK will be initialized when the mini app loads
// The Farcaster connector automatically connects if user has a wallet

function App() {
  const [status, setStatus] = useState('idle');
  const [nftName, setNftName] = useState('');
  const [nftDescription, setNftDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [metadataUri, setMetadataUri] = useState('');
  const [isGeneratingUri, setIsGeneratingUri] = useState(false);
  const [farcasterContext, setFarcasterContext] = useState(null);

  const { address, isConnected, chain } = useAccount();
  const { connect, connectors } = useConnect();
  const [wrongNetwork, setWrongNetwork] = useState(false);

  // Base network chainId is 8453
  const BASE_CHAIN_ID = 8453;
  const { writeContract, data: hash, error: writeError, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    // Initialize Farcaster SDK
    const initFarcaster = async () => {
      try {
        // The SDK is loaded via CDN or npm package
        // For now, we'll get context via the connector
        // In a full implementation, you'd use: import { sdk } from '@farcaster/miniapp-sdk'

        // Signal to Farcaster that the app is ready
        if (window.parent) {
          window.parent.postMessage({ type: 'fc:ready' }, '*');
        }

        // Get Farcaster context (user info, cast info, etc.)
        // This would come from the SDK in production
        console.log('Farcaster Mini App initialized');
      } catch (error) {
        console.error('Error initializing Farcaster:', error);
      }
    };

    initFarcaster();
  }, []);

  useEffect(() => {
    // Auto-connect if connector is available
    if (!isConnected && connectors.length > 0) {
      // The Farcaster connector will auto-connect if user has a wallet
      connect({ connector: connectors[0] });
    }
  }, [isConnected, connectors, connect]);

  useEffect(() => {
    // Check if connected to correct network
    if (isConnected && chain) {
      setWrongNetwork(chain.id !== BASE_CHAIN_ID);
    }
  }, [isConnected, chain]);

  useEffect(() => {
    // Notify backend when wallet is connected
    if (isConnected && address) {
      notifyWalletConnected();
    }
  }, [isConnected, address]);

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
      // Send wallet connection to backend
      await fetch(`${BACKEND_URL}/api/farcaster/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          platform: 'farcaster'
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

      // Mint price is 0.00003 ETH on Base
      const mintPrice = parseEther('0.00003');

      // Call smart contract mint function
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: NFT_ABI,
        functionName: 'mint',
        args: [address, metadataUri],
        value: mintPrice
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

      // Extract token ID from logs
      const tokenId = parseInt(receipt.logs[0]?.topics[3] || '0', 16);

      // Send mint success to backend
      await fetch(`${BACKEND_URL}/api/farcaster/mint-success`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenId,
          transactionHash: hash,
          walletAddress: address,
          metadataUri,
          blockNumber: parseInt(receipt.blockNumber, 16)
        })
      });

      // Notify Farcaster that the action is complete
      if (window.parent) {
        window.parent.postMessage({
          type: 'fc:action_complete',
          success: true,
          message: 'NFT minted successfully!'
        }, '*');
      }
    } catch (error) {
      console.error('Error handling mint success:', error);
    }
  };

  const handleMintError = (errorMessage) => {
    setStatus('error');

    // Notify Farcaster of the error
    if (window.parent) {
      window.parent.postMessage({
        type: 'fc:action_complete',
        success: false,
        message: errorMessage
      }, '*');
    }
  };

  const handleGenerateMetadataUri = async () => {
    if (!nftName || !nftDescription) {
      alert('Please provide NFT name and description first');
      return;
    }

    if (!imageUrl) {
      alert('Please provide an image URL (IPFS or HTTPS)');
      return;
    }

    try {
      setIsGeneratingUri(true);

      const response = await fetch(`${BACKEND_URL}/api/upload-metadata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nftName,
          description: nftDescription,
          imageUrl: imageUrl,
          attributes: []
        })
      });

      const data = await response.json();

      if (data.success) {
        setMetadataUri(data.uri);
        alert(`✅ Metadata uploaded to IPFS!\n\nIPFS Hash: ${data.ipfsHash}\n\nYou can now mint your NFT.`);
      } else {
        throw new Error(data.error || 'Failed to upload metadata');
      }
    } catch (error) {
      console.error('Error generating metadata URI:', error);
      alert('❌ Failed to generate metadata URI. Please try again.');
    } finally {
      setIsGeneratingUri(false);
    }
  };

  return (
    <div className="app">
      <div className="container">
        <h1>🎨 Mint NFT on Base</h1>
        <p className="subtitle">via Farcaster Mini App</p>

        {!isConnected ? (
          <div className="connect-section">
            <p>Connecting your Farcaster wallet...</p>
            <button onClick={() => connect({ connector: connectors[0] })} className="connect-button">
              Connect Wallet
            </button>
          </div>
        ) : (
          <div className="mint-section">
            <div className="wallet-info">
              <p>✅ Connected: {address?.slice(0, 6)}...{address?.slice(-4)}</p>
              <p>Network: {chain?.name}</p>
            </div>

            {wrongNetwork && (
              <div className="error-message">
                ⚠️ Wrong Network! Please switch to <strong>Base Network</strong> in your wallet.
                <br />
                <small>Current: {chain?.name} (Chain ID: {chain?.id})</small>
                <br />
                <small>Required: Base (Chain ID: 8453)</small>
              </div>
            )}

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
                <label>Image URL (IPFS or HTTPS)</label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="ipfs://bafkrei... or https://..."
                  disabled={status === 'minting' || isConfirming}
                />
                <small>Paste your IPFS image URI or HTTPS URL</small>
              </div>

              <div className="form-group">
                <label>Metadata URI (IPFS)</label>
                <input
                  type="text"
                  value={metadataUri}
                  onChange={(e) => setMetadataUri(e.target.value)}
                  placeholder="ipfs://QmYourMetadataHash"
                  disabled={status === 'minting' || isConfirming || isGeneratingUri}
                  readOnly={isGeneratingUri}
                />
                <button
                  onClick={handleGenerateMetadataUri}
                  disabled={isGeneratingUri || !nftName || !nftDescription || !imageUrl}
                  className="generate-uri-button"
                  type="button"
                >
                  {isGeneratingUri ? '⏳ Uploading to IPFS...' : '🚀 Generate Metadata URI'}
                </button>
                <small>Fill in all fields above, then click to upload metadata to IPFS</small>
              </div>

              <button
                onClick={handleMint}
                disabled={isPending || isConfirming || !metadataUri || wrongNetwork}
                className="mint-button"
              >
                {wrongNetwork ? '⚠️ Switch to Base Network' :
                 isPending ? 'Waiting for approval...' :
                 isConfirming ? 'Confirming transaction...' :
                 isConfirmed ? '✅ Minted!' :
                 '🎨 Mint NFT (0.00003 ETH)'}
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
                  ✅ NFT minted successfully!
                </div>
              )}

              {status === 'error' && (
                <div className="error-message">
                  ❌ Error minting NFT. Please try again.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
