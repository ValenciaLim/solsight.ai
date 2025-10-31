/**
 * Jupiter API Client for token prices and swap data
 * API: https://station.jup.ag/docs/apis/swap-api
 */

import { FetcherError } from '../types';
import { retryWithBackoff, validateEnvVars } from '../utils';

const JUPITER_API_URL = 'https://quote-api.jup.ag/v6';

export interface JupiterQuote {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  priceImpactPct: string;
}

export interface JupiterPrice {
  id: string;
  mintSymbol: string;
  vsToken: string;
  vsTokenSymbol: string;
  price: number;
}

export interface JupiterLiquidity {
  inputMint: string;
  outputMint: string;
  liquidity: number;
}

/**
 * Get quote for token swap
 */
export async function getSwapQuote(
  inputMint: string,
  outputMint: string,
  amount: string,
  slippageBps: number = 50
): Promise<JupiterQuote> {
  const validation = validateEnvVars([]);
  if (!validation.valid) {
    throw new Error(`Missing environment variables: ${validation.missing.join(', ')}`);
  }

  try {
    return await retryWithBackoff(async () => {
      const url = new URL(`${JUPITER_API_URL}/quote`);
      url.searchParams.append('inputMint', inputMint);
      url.searchParams.append('outputMint', outputMint);
      url.searchParams.append('amount', amount);
      url.searchParams.append('slippageBps', slippageBps.toString());

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new FetcherError(
          `Jupiter API error: ${response.statusText}`,
          'jupiter',
          response.status,
          response.status >= 500
        );
      }

      const data = await response.json();
      return data as JupiterQuote;
    });
  } catch (error) {
    console.error('Error fetching Jupiter swap quote:', error);
    throw error;
  }
}

/**
 * Get token price by swapping for SOL/USDC
 */
export async function getTokenPrice(inputMint: string): Promise<number> {
  try {
    // Default to USDC output
    const outputMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
    const amount = '1000000'; // 1 unit with 6 decimals

    const quote = await getSwapQuote(inputMint, outputMint, amount);
    
    // Convert to price per token
    const inputAmount = parseFloat(quote.inAmount) / 1e6;
    const outputAmount = parseFloat(quote.outAmount) / 1e6;
    
    return outputAmount / inputAmount;
  } catch (error) {
    console.error('Error fetching token price:', error);
    throw error;
  }
}

/**
 * Get token metadata
 */
export interface TokenMetadata {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
}

export async function getTokenList(): Promise<TokenMetadata[]> {
  try {
    const response = await fetch('https://token.jup.ag/all');
    
    if (!response.ok) {
      throw new FetcherError(
        `Jupiter token list error: ${response.statusText}`,
        'jupiter',
        response.status
      );
    }

    const tokens = await response.json();
    return tokens;
  } catch (error) {
    console.error('Error fetching token list:', error);
    throw error;
  }
}

/**
 * Get token volume (placeholder - Jupiter doesn't have volume API)
 */
export async function getTokenVolume(inputMint: string): Promise<number> {
  // Jupiter doesn't provide volume data directly
  // This would need to come from other sources like DEX aggregators or on-chain data
  console.warn('Jupiter does not provide volume data');
  return 0;
}

/**
 * Get liquidity information for a trading pair
 */
export async function getLiquidity(
  inputMint: string,
  outputMint: string
): Promise<JupiterLiquidity> {
  try {
    const quote = await getSwapQuote(inputMint, outputMint, '1000000000');
    
    // Estimate liquidity from quote (rough approximation)
    // This is not a real liquidity metric but can be used as a proxy
    const liquidity = parseFloat(quote.outAmount);
    
    return {
      inputMint,
      outputMint,
      liquidity,
    };
  } catch (error) {
    console.error('Error estimating liquidity:', error);
    throw error;
  }
}

