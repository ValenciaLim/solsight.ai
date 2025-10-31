/**
 * Solscan API Client for on-chain data and analytics
 * API: https://public-api.solscan.io/docs/
 */

import { FetcherError } from '../types';
import { retryWithBackoff, validateEnvVars } from '../utils';

const SOLSCAN_API_URL = 'https://public-api.solscan.io';

export interface SolscanAccountInfo {
  account: string;
  lamports: number;
  owner: string;
  executable: boolean;
  rentEpoch?: number;
  data?: any;
}

export interface SolscanTokenAccount {
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  tokenAmount: number;
  tokenDecimals: number;
  usdValue?: number;
}

export interface SolscanTransaction {
  signature: string;
  slot: number;
  blockTime: number;
  fee: number;
  status: string;
  err?: any;
}

/**
 * Get account info
 */
export async function getAccountInfo(account: string): Promise<SolscanAccountInfo> {
  try {
    return await retryWithBackoff(async () => {
      const response = await fetch(
        `${SOLSCAN_API_URL}/account/${account}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new FetcherError(
          `Solscan API error: ${response.statusText}`,
          'solscan',
          response.status,
          response.status >= 500
        );
      }

      const data = await response.json();
      return data;
    });
  } catch (error) {
    console.error('Error fetching account info:', error);
    throw error;
  }
}

/**
 * Get token accounts for an address
 */
export async function getTokenAccounts(account: string): Promise<SolscanTokenAccount[]> {
  try {
    const response = await fetch(
      `${SOLSCAN_API_URL}/account/tokens`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        // Solscan uses POST for account tokens with account in body
      }
    );

    if (!response.ok) {
      throw new FetcherError(
        `Solscan token accounts error: ${response.statusText}`,
        'solscan',
        response.status
      );
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching token accounts:', error);
    throw error;
  }
}

/**
 * Get account transactions
 */
export async function getAccountTransactions(
  account: string,
  limit: number = 50
): Promise<SolscanTransaction[]> {
  try {
    const response = await fetch(
      `${SOLSCAN_API_URL}/account/transactions?account=${account}&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new FetcherError(
        `Solscan transactions error: ${response.statusText}`,
        'solscan',
        response.status
      );
    }

    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
}

/**
 * Get token metadata
 */
export async function getTokenMetadata(tokenAddress: string): Promise<any> {
  try {
    const response = await fetch(
      `${SOLSCAN_API_URL}/token/meta?tokenAddress=${tokenAddress}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new FetcherError(
        `Solscan token metadata error: ${response.statusText}`,
        'solscan',
        response.status
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching token metadata:', error);
    throw error;
  }
}

/**
 * Get chain info
 */
export async function getChainInfo(): Promise<any> {
  try {
    const response = await fetch(
      `${SOLSCAN_API_URL}/chaininfo`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new FetcherError(
        `Solscan chain info error: ${response.statusText}`,
        'solscan',
        response.status
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching chain info:', error);
    throw error;
  }
}

/**
 * Get market token list
 */
export async function getMarketTokens(): Promise<any[]> {
  try {
    const response = await fetch(
      `${SOLSCAN_API_URL}/market/tokens`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new FetcherError(
        `Solscan market tokens error: ${response.statusText}`,
        'solscan',
        response.status
      );
    }

    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error('Error fetching market tokens:', error);
    throw error;
  }
}

