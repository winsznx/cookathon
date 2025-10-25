import { ethers } from 'ethers';
import { CONFIG } from '../config/constants.js';

// Initialize provider
const provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);

// NFT Contract ABI (simplified - will be replaced with actual ABI after contract deployment)
const NFT_ABI = [
  'function mint(address to, string memory tokenURI) public returns (uint256)',
  'function balanceOf(address owner) public view returns (uint256)',
  'function tokenURI(uint256 tokenId) public view returns (string)',
  'function ownerOf(uint256 tokenId) public view returns (address)',
  'function totalSupply() public view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) public view returns (uint256)',
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'
];

/**
 * Get contract instance
 */
export function getContract(signerOrProvider = provider) {
  if (!CONFIG.CONTRACT_ADDRESS) {
    throw new Error('Contract address not configured');
  }
  return new ethers.Contract(CONFIG.CONTRACT_ADDRESS, NFT_ABI, signerOrProvider);
}

/**
 * Get NFT balance for an address
 */
export async function getNFTBalance(walletAddress) {
  try {
    const contract = getContract();
    const balance = await contract.balanceOf(walletAddress);
    return Number(balance);
  } catch (error) {
    console.error('Error getting NFT balance:', error);
    throw error;
  }
}

/**
 * Get all NFTs owned by an address
 */
export async function getNFTsByOwner(walletAddress) {
  try {
    const contract = getContract();
    const balance = await getNFTBalance(walletAddress);
    const nfts = [];

    for (let i = 0; i < balance; i++) {
      const tokenId = await contract.tokenOfOwnerByIndex(walletAddress, i);
      const tokenURI = await contract.tokenURI(tokenId);
      nfts.push({
        tokenId: Number(tokenId),
        tokenURI
      });
    }

    return nfts;
  } catch (error) {
    console.error('Error getting NFTs by owner:', error);
    throw error;
  }
}

/**
 * Get NFT metadata from URI
 */
export async function getNFTMetadata(tokenURI) {
  try {
    // Handle IPFS URIs
    let url = tokenURI;
    if (tokenURI.startsWith('ipfs://')) {
      url = tokenURI.replace('ipfs://', CONFIG.IPFS_GATEWAY);
    }

    const response = await fetch(url);
    const metadata = await response.json();
    return metadata;
  } catch (error) {
    console.error('Error fetching NFT metadata:', error);
    return null;
  }
}

/**
 * Get total supply of NFTs
 */
export async function getTotalSupply() {
  try {
    const contract = getContract();
    const supply = await contract.totalSupply();
    return Number(supply);
  } catch (error) {
    console.error('Error getting total supply:', error);
    throw error;
  }
}

/**
 * Get transaction receipt
 */
export async function getTransactionReceipt(txHash) {
  try {
    const receipt = await provider.getTransactionReceipt(txHash);
    return receipt;
  } catch (error) {
    console.error('Error getting transaction receipt:', error);
    throw error;
  }
}

/**
 * Wait for transaction confirmation
 */
export async function waitForTransaction(txHash, confirmations = 1) {
  try {
    const receipt = await provider.waitForTransaction(txHash, confirmations);
    return receipt;
  } catch (error) {
    console.error('Error waiting for transaction:', error);
    throw error;
  }
}

/**
 * Estimate gas for minting
 */
export async function estimateMintGas(to, tokenURI) {
  try {
    const contract = getContract();
    const gasEstimate = await contract.mint.estimateGas(to, tokenURI);
    return gasEstimate;
  } catch (error) {
    console.error('Error estimating gas:', error);
    throw error;
  }
}

/**
 * Get current gas price
 */
export async function getGasPrice() {
  try {
    const feeData = await provider.getFeeData();
    return {
      gasPrice: feeData.gasPrice,
      maxFeePerGas: feeData.maxFeePerGas,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas
    };
  } catch (error) {
    console.error('Error getting gas price:', error);
    throw error;
  }
}

/**
 * Format ETH amount
 */
export function formatEther(amount) {
  return ethers.formatEther(amount);
}

/**
 * Parse ETH amount
 */
export function parseEther(amount) {
  return ethers.parseEther(amount);
}

/**
 * Validate Ethereum address
 */
export function isValidAddress(address) {
  return ethers.isAddress(address);
}

/**
 * Get block number
 */
export async function getBlockNumber() {
  return await provider.getBlockNumber();
}

export { provider };
