/**
 * SolanaFM API Client for on-chain data and transactions
 * API: https://docs.solana.fm/reference/solanafm-api-overview
 */

import { FetcherError } from '../types';
import { retryWithBackoff, validateEnvVars } from '../utils';

const SOLANAFM_API_URL = 'https://api.solana.fm/v1';

export interface SolanaFMTaggedAccount {
  account: string;
  tag: string;
  name: string;
  verified: boolean;
}

export interface SolanaFMTransaction {
  signature: string;
  slot: number;
  blockTime: number;
  fee: number;
  status: string;
  logs: string[];
  programIds: string[];
}

export interface SolanaFMTokenAccount {
  account: string;
  mint: string;
  owner: string;
  amount: string;
  decimals: number;
}

export interface SolanaFMTransfer {
  type: string;
  amount: number;
  from: string;
  to: string;
  mint?: string;
  timestamp: number;
}

/**
 * Get tagged accounts (can be used to find programs/entities)
 */
export async function getTaggedAccount(account: string): Promise<SolanaFMTaggedAccount | null> {
  try {
    return await retryWithBackoff(async () => {
      const response = await fetch(
        `${SOLANAFM_API_URL}/accounts/${account}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new FetcherError(
          `SolanaFM API error: ${response.statusText}`,
          'solanafm',
          response.status,
          response.status >= 500
        );
      }

      const data = await response.json();
      return data as SolanaFMTaggedAccount;
    });
  } catch (error) {
    console.error('Error fetching tagged account:', error);
    throw error;
  }
}

/**
 * Get account transactions
 */
export async function getAccountTransactions(
  account: string,
  limit: number = 100
): Promise<SolanaFMTransaction[]> {
  try {
    const response = await fetch(
      `${SOLANAFM_API_URL}/accounts/${account}/transactions?limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new FetcherError(
        `SolanaFM transactions error: ${response.statusText}`,
        'solanafm',
        response.status
      );
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('Error fetching account transactions:', error);
    throw error;
  }
}

/**
 * Get account transfers
 */
export async function getAccountTransfers(
  account: string,
  limit: number = 100
): Promise<SolanaFMTransfer[]> {
  try {
    const response = await fetch(
      `${SOLANAFM_API_URL}/accounts/${account}/transfers?limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new FetcherError(
        `SolanaFM transfers error: ${response.statusText}`,
        'solanafm',
        response.status
      );
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('Error fetching account transfers:', error);
    throw error;
  }
}

/**
 * Get token accounts for an owner
 */
export async function getOwnerTokenAccounts(ownerAddress: string): Promise<SolanaFMTokenAccount[]> {
  try {
    const response = await fetch(
      `${SOLANAFM_API_URL}/accounts/${ownerAddress}/token-accounts`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new FetcherError(
        `SolanaFM token accounts error: ${response.statusText}`,
        'solanafm',
        response.status
      );
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('Error fetching token accounts:', error);
    throw error;
  }
}

/**
 * Get token info
 */
export async function getTokenInfo(mint: string): Promise<any> {
  try {
    const response = await fetch(
      `${SOLANAFM_API_URL}/tokens/${mint}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new FetcherError(
        `SolanaFM token info error: ${response.statusText}`,
        'solanafm',
        response.status
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching token info:', error);
    throw error;
  }
}

/**
 * Get transfer transactions
 */
export async function getTransferTransactions(
  fromAccount?: string,
  toAccount?: string,
  limit: number = 100
): Promise<SolanaFMTransaction[]> {
  try {
    const params = new URLSearchParams();
    if (fromAccount) params.append('from', fromAccount);
    if (toAccount) params.append('to', toAccount);
    params.append('limit', limit.toString());

    const response = await fetch(
      `${SOLANAFM_API_URL}/transfers?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new FetcherError(
        `SolanaFM transfer transactions error: ${response.statusText}`,
        'solanafm',
        response.status
      );
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('Error fetching transfer transactions:', error);
    throw error;
  }
}

/**
 * Get account transaction fees
 */
export async function getAccountTransactionFees(account: string): Promise<{ total: number; count: number }> {
  try {
    const response = await fetch(
      `${SOLANAFM_API_URL}/accounts/${account}/transaction-fees`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new FetcherError(
        `SolanaFM transaction fees error: ${response.statusText}`,
        'solanafm',
        response.status
      );
    }

    const data = await response.json();
    return {
      total: data.totalFees || 0,
      count: data.transactionCount || 0,
    };
  } catch (error) {
    console.error('Error fetching transaction fees:', error);
    throw error;
  }
}

/**
 * Get blocks
 */
export async function getBlocks(limit: number = 10): Promise<any[]> {
  try {
    const response = await fetch(
      `${SOLANAFM_API_URL}/blocks?limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new FetcherError(
        `SolanaFM blocks error: ${response.statusText}`,
        'solanafm',
        response.status
      );
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('Error fetching blocks:', error);
    throw error;
  }
}

/**
 * Get Solana daily transaction fees
 */
export async function getSolanaDailyTransactionFees(): Promise<number> {
  try {
    const response = await fetch(
      `${SOLANAFM_API_URL}/solana/daily-transaction-fees`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new FetcherError(
        `SolanaFM daily fees error: ${response.statusText}`,
        'solanafm',
        response.status
      );
    }

    const data = await response.json();
    return data.totalFees || 0;
  } catch (error) {
    console.error('Error fetching daily transaction fees:', error);
    throw error;
  }
}

