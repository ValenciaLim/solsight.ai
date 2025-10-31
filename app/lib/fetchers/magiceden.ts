/**
 * Magic Eden API Client for NFT market activity
 * API: https://docs.magiceden.io/reference/solana-overview
 */

import { FetcherError } from '../types';
import { retryWithBackoff, validateEnvVars } from '../utils';

const MAGICEDEN_API_URL = 'https://api-mainnet.magiceden.dev/v2';

export interface MagicEdenCollectionStats {
  symbol: string;
  name: string;
  floorPrice: number;
  listedCount: number;
  volumeAll: number;
  volume24h: number;
  volume7d: number;
}

export interface MagicEdenTrade {
  signature: string;
  buyer: string;
  seller: string;
  mint: string;
  price: number;
  blockTime: number;
  source: string;
}

export interface MagicEdenListing {
  pdaAddress: string;
  auctionHouse: string;
  tokenAddress: string;
  seller: string;
  price: number;
  expiry: number;
}

/**
 * Get collection statistics
 */
export async function getCollectionStats(
  collectionSymbol: string
): Promise<MagicEdenCollectionStats> {
  try {
    return await retryWithBackoff(async () => {
      const response = await fetch(
        `${MAGICEDEN_API_URL}/collections/${collectionSymbol}/stats`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new FetcherError(
          `Magic Eden API error: ${response.statusText}`,
          'magiceden',
          response.status,
          response.status >= 500
        );
      }

      const data = await response.json();
      return data as MagicEdenCollectionStats;
    });
  } catch (error) {
    console.error('Error fetching Magic Eden collection stats:', error);
    throw error;
  }
}

/**
 * Get recent trades for a collection
 */
export async function getRecentTrades(
  collectionSymbol: string,
  limit: number = 100
): Promise<MagicEdenTrade[]> {
  try {
    const response = await fetch(
      `${MAGICEDEN_API_URL}/collections/${collectionSymbol}/activities?offset=0&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new FetcherError(
        `Magic Eden trades API error: ${response.statusText}`,
        'magiceden',
        response.status
      );
    }

    const data = await response.json();
    // Filter for buyNow events (trades)
    return data
      .filter((item: any) => item.type === 'buyNow')
      .map((item: any) => ({
        signature: item.signature,
        buyer: item.buyer,
        seller: item.seller,
        mint: item.tokenMint,
        price: item.price || 0,
        blockTime: item.blockTime,
        source: item.source,
      }));
  } catch (error) {
    console.error('Error fetching Magic Eden trades:', error);
    throw error;
  }
}

/**
 * Get NFT floor price
 */
export async function getFloorPrice(collectionSymbol: string): Promise<number> {
  try {
    const stats = await getCollectionStats(collectionSymbol);
    return stats.floorPrice;
  } catch (error) {
    console.error('Error fetching floor price:', error);
    throw error;
  }
}

/**
 * Get active listings for a collection
 */
export async function getCollectionListings(
  collectionSymbol: string,
  limit: number = 100
): Promise<MagicEdenListing[]> {
  try {
    const response = await fetch(
      `${MAGICEDEN_API_URL}/collections/${collectionSymbol}/listings?offset=0&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new FetcherError(
        `Magic Eden listings API error: ${response.statusText}`,
        'magiceden',
        response.status
      );
    }

    const data = await response.json();
    return data.map((item: any) => ({
      pdaAddress: item.pdaAddress,
      auctionHouse: item.auctionHouse,
      tokenAddress: item.tokenMint,
      seller: item.seller,
      price: item.price || 0,
      expiry: item.expiry,
    }));
  } catch (error) {
    console.error('Error fetching Magic Eden listings:', error);
    throw error;
  }
}

/**
 * Get collection activities
 */
export async function getCollectionActivities(
  collectionSymbol: string,
  limit: number = 100
): Promise<any[]> {
  try {
    const response = await fetch(
      `${MAGICEDEN_API_URL}/collections/${collectionSymbol}/activities?offset=0&limit=${limit}`
    );

    if (!response.ok) {
      throw new FetcherError(
        `Magic Eden activities error: ${response.statusText}`,
        'magiceden',
        response.status
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching collection activities:', error);
    throw error;
  }
}

/**
 * Get wallet NFTs
 */
export async function getWalletNFTs(walletAddress: string): Promise<any[]> {
  try {
    const response = await fetch(
      `${MAGICEDEN_API_URL}/wallets/${walletAddress}/tokens?offset=0&limit=500`
    );

    if (!response.ok) {
      throw new FetcherError(
        `Magic Eden wallet NFTs error: ${response.statusText}`,
        'magiceden',
        response.status
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching wallet NFTs:', error);
    throw error;
  }
}

