/**
 * DeFiLlama API Client for DeFi protocol metrics
 * API: https://defillama.com/docs/api
 */

import { FetcherError } from '../types';
import { retryWithBackoff } from '../utils';

const DEFILLAMA_API_URL = 'https://api.llama.fi';

export interface ProtocolTVL {
  name: string;
  symbol: string;
  tvl: number;
  chains: string[];
}

export interface ChainTVL {
  name: string;
  tvl: number;
  tokensInUsd: Record<string, number>;
}

export interface HistoricalTVL {
  date: number;
  tvl: number;
}

/**
 * Get TVL for a specific protocol
 */
export async function getProtocolTVL(
  protocolSlug: string
): Promise<ProtocolTVL> {
  try {
    return await retryWithBackoff(async () => {
      const response = await fetch(
        `${DEFILLAMA_API_URL}/tvl/${protocolSlug}`
      );

      if (!response.ok) {
        throw new FetcherError(
          `DeFiLlama API error: ${response.statusText}`,
          'defillama',
          response.status,
          response.status >= 500
        );
      }

      const data = await response.json();
      return data as ProtocolTVL;
    });
  } catch (error) {
    console.error('Error fetching DeFiLlama protocol TVL:', error);
    throw error;
  }
}

/**
 * Get TVL for a specific chain
 */
export async function getChainTVL(chainName: string): Promise<ChainTVL> {
  try {
    const response = await fetch(
      `${DEFILLAMA_API_URL}/v2/historicalChainTvl/${chainName}`
    );

    if (!response.ok) {
      throw new FetcherError(
        `DeFiLlama chain TVL error: ${response.statusText}`,
        'defillama',
        response.status
      );
    }

    const data = await response.json();
    
    // Get latest TVL
    const latest = data[data.length - 1];
    
    return {
      name: chainName,
      tvl: latest.tvl || 0,
      tokensInUsd: {},
    };
  } catch (error) {
    console.error('Error fetching chain TVL:', error);
    throw error;
  }
}

/**
 * Get Solana TVL
 */
export async function getSolanaTVL(): Promise<ChainTVL> {
  return getChainTVL('Solana');
}

/**
 * Get historical TVL for a chain
 */
export async function getHistoricalChainTVL(
  chainName: string,
  startTimestamp?: number,
  endTimestamp?: number
): Promise<HistoricalTVL[]> {
  try {
    let url = `${DEFILLAMA_API_URL}/v2/historicalChainTvl/${chainName}`;
    if (startTimestamp || endTimestamp) {
      const params = new URLSearchParams();
      if (startTimestamp) params.append('start', startTimestamp.toString());
      if (endTimestamp) params.append('end', endTimestamp.toString());
      url += `?${params.toString()}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new FetcherError(
        `DeFiLlama historical TVL error: ${response.statusText}`,
        'defillama',
        response.status
      );
    }

    const data = await response.json();
    return data.map((item: any) => ({
      date: item.date,
      tvl: item.tvl || 0,
    }));
  } catch (error) {
    console.error('Error fetching historical TVL:', error);
    throw error;
  }
}

/**
 * Get stablecoin data
 */
export async function getStablecoins(): Promise<Array<{ name: string; chains: Record<string, number>; tvl: number }>> {
  try {
    const response = await fetch(`${DEFILLAMA_API_URL}/stablecoins`);

    if (!response.ok) {
      throw new FetcherError(
        `DeFiLlama stablecoins error: ${response.statusText}`,
        'defillama',
        response.status
      );
    }

    const data = await response.json();
    return data.peggedAssets?.map((asset: any) => ({
      name: asset.name,
      chains: asset.chainBalances || {},
      tvl: asset.tvl || 0,
    })) || [];
  } catch (error) {
    console.error('Error fetching stablecoins:', error);
    throw error;
  }
}

/**
 * Get protocol list
 */
export async function getProtocolList(): Promise<Array<{ name: string; slug: string; tvl: number }>> {
  try {
    const response = await fetch(`${DEFILLAMA_API_URL}/protocols`);

    if (!response.ok) {
      throw new FetcherError(
        `DeFiLlama protocols error: ${response.statusText}`,
        'defillama',
        response.status
      );
    }

    const data = await response.json();
    return data.map((p: any) => ({
      name: p.name,
      slug: p.slug,
      tvl: p.tvl || 0,
    }));
  } catch (error) {
    console.error('Error fetching protocol list:', error);
    throw error;
  }
}

