/**
 * Farcaster Mini App Configuration for Base NFT Minting
 *
 * Required Environment Variables:
 * - VITE_CONTRACT_ADDRESS: Base NFT contract address
 * - VITE_BACKEND_URL: Backend API URL for metadata upload
 */

import { http, createConfig } from 'wagmi';
import { base } from 'wagmi/chains';
import { farcasterMiniApp as miniAppConnector } from '@farcaster/miniapp-wagmi-connector';
import { QueryClient } from '@tanstack/react-query';

// Configure networks
export const networks = [base];

// Create Wagmi Config with Farcaster Mini App Connector
export const wagmiConfig = createConfig({
  chains: [base],
  transports: {
    [base.id]: http()
  },
  connectors: [miniAppConnector()]
});

// Create Query Client
export const queryClient = new QueryClient();

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
