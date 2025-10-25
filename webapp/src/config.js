/**
 * AppKit Configuration for Base NFT Minting
 *
 * Required Environment Variables for Vercel:
 * - VITE_REOWN_PROJECT_ID: Get from https://cloud.reown.com/
 * - VITE_CONTRACT_ADDRESS: Base NFT contract address
 * - VITE_BACKEND_URL: Backend API URL for metadata upload
 */

import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { base } from 'viem/chains';
import { http } from 'wagmi';
import { QueryClient } from '@tanstack/react-query';

// Get project ID from environment or use placeholder
export const projectId = import.meta.env.VITE_REOWN_PROJECT_ID || 'YOUR_PROJECT_ID';

if (!projectId || projectId === 'YOUR_PROJECT_ID') {
  console.warn('Warning: VITE_REOWN_PROJECT_ID not set. Please create a project at https://cloud.reown.com/');
}

// Configure networks
export const networks = [base];

// Create Wagmi Adapter
export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: false
});

// Create Query Client
export const queryClient = new QueryClient();

// Create AppKit instance
export const modal = createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata: {
    name: 'Base NFT Minting',
    description: 'Mint NFTs on Base network',
    url: window.location.origin,
    icons: ['https://avatars.githubusercontent.com/u/179229932']
  },
  features: {
    analytics: true,
    email: false,
    socials: []
  },
  themeMode: 'light',
  themeVariables: {
    '--w3m-accent': '#0052FF'
  }
});

// Contract configuration
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

// NFT Contract ABI
export const NFT_ABI = [
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'metadataURI', type: 'string' }
    ],
    name: 'mint',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'mintPrice',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
];

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
