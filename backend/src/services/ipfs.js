import axios from 'axios';
import { CONFIG } from '../config/constants.js';

const PINATA_API_URL = 'https://api.pinata.cloud';

/**
 * Upload JSON metadata to IPFS via Pinata
 */
export async function uploadMetadata(metadata) {
  if (!CONFIG.PINATA_API_KEY || !CONFIG.PINATA_SECRET_KEY) {
    throw new Error('Pinata API credentials not configured');
  }

  try {
    const response = await axios.post(
      `${PINATA_API_URL}/pinning/pinJSONToIPFS`,
      metadata,
      {
        headers: {
          'Content-Type': 'application/json',
          'pinata_api_key': CONFIG.PINATA_API_KEY,
          'pinata_secret_api_key': CONFIG.PINATA_SECRET_KEY
        }
      }
    );

    return {
      ipfsHash: response.data.IpfsHash,
      uri: `ipfs://${response.data.IpfsHash}`,
      gatewayUrl: `${CONFIG.IPFS_GATEWAY}${response.data.IpfsHash}`
    };
  } catch (error) {
    console.error('Error uploading metadata to IPFS:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Upload file to IPFS via Pinata
 */
export async function uploadFile(fileBuffer, filename) {
  if (!CONFIG.PINATA_API_KEY || !CONFIG.PINATA_SECRET_KEY) {
    throw new Error('Pinata API credentials not configured');
  }

  try {
    const FormData = (await import('form-data')).default;
    const formData = new FormData();
    formData.append('file', fileBuffer, filename);

    const response = await axios.post(
      `${PINATA_API_URL}/pinning/pinFileToIPFS`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'pinata_api_key': CONFIG.PINATA_API_KEY,
          'pinata_secret_api_key': CONFIG.PINATA_SECRET_KEY
        }
      }
    );

    return {
      ipfsHash: response.data.IpfsHash,
      uri: `ipfs://${response.data.IpfsHash}`,
      gatewayUrl: `${CONFIG.IPFS_GATEWAY}${response.data.IpfsHash}`
    };
  } catch (error) {
    console.error('Error uploading file to IPFS:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Create NFT metadata object (ERC-721 standard)
 */
export function createNFTMetadata(name, description, imageUri, attributes = []) {
  return {
    name,
    description,
    image: imageUri,
    attributes
  };
}

/**
 * Fetch metadata from IPFS
 */
export async function fetchMetadata(ipfsHash) {
  try {
    const url = `${CONFIG.IPFS_GATEWAY}${ipfsHash}`;
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching metadata from IPFS:', error);
    throw error;
  }
}

/**
 * Test Pinata connection
 */
export async function testPinataConnection() {
  if (!CONFIG.PINATA_API_KEY || !CONFIG.PINATA_SECRET_KEY) {
    return { success: false, error: 'API credentials not configured' };
  }

  try {
    const response = await axios.get(
      `${PINATA_API_URL}/data/testAuthentication`,
      {
        headers: {
          'pinata_api_key': CONFIG.PINATA_API_KEY,
          'pinata_secret_api_key': CONFIG.PINATA_SECRET_KEY
        }
      }
    );

    return { success: true, message: response.data.message };
  } catch (error) {
    return { success: false, error: error.response?.data || error.message };
  }
}
