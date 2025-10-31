/**
 * Pyth Network API Client for price oracles
 * API: https://docs.pyth.network/documentation/pythnet-price-feeds/best-practices
 */

import { FetcherError } from '../types';
import { retryWithBackoff, validateEnvVars } from '../utils';

const PYTH_API_URL = 'https://hermes.pyth.network';

export interface PythPriceFeed {
  id: string;
  price: number;
  confidence: number;
  exponent: number;
  publish_time: number;
}

export interface PythHistoricalPrice {
  timestamp: number;
  price: number;
  confidence: number;
}

/**
 * Get latest price feeds
 */
export async function getPriceFeed(priceIds: string[]): Promise<PythPriceFeed[]> {
  try {
    return await retryWithBackoff(async () => {
      const response = await fetch(
        `${PYTH_API_URL}/api/latest_price_feeds?ids=${priceIds.join(',')}`,
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new FetcherError(
          `Pyth API error: ${response.statusText}`,
          'pyth',
          response.status,
          response.status >= 500
        );
      }

      const data = await response.json();
      return data.map((feed: any) => ({
        id: feed.id,
        price: feed.price?.price || 0,
        confidence: feed.price?.conf || 0,
        exponent: feed.price?.expo || 0,
        publish_time: feed.price?.publish_time || 0,
      }));
    });
  } catch (error) {
    console.error('Error fetching Pyth price feed:', error);
    throw error;
  }
}

/**
 * Get historical price data
 */
export async function getHistoricalPrice(
  priceId: string,
  startTime: number,
  endTime: number
): Promise<PythHistoricalPrice[]> {
  try {
    const response = await fetch(
      `${PYTH_API_URL}/api/latest_price_feeds?ids=${priceId}&start_time=${startTime}&end_time=${endTime}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new FetcherError(
        `Pyth historical price error: ${response.statusText}`,
        'pyth',
        response.status
      );
    }

    const data = await response.json();
    return data.map((feed: any) => ({
      timestamp: feed.publish_time,
      price: feed.price?.price || 0,
      confidence: feed.price?.conf || 0,
    }));
  } catch (error) {
    console.error('Error fetching historical prices:', error);
    throw error;
  }
}

/**
 * Get price for SOL/USD
 */
export async function getSOLPrice(): Promise<number> {
  try {
    // SOL/USD price feed ID from Pyth
    const solPriceId = '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d';
    const feeds = await getPriceFeed([solPriceId]);
    return feeds[0]?.price || 0;
  } catch (error) {
    console.error('Error fetching SOL price:', error);
    return 0;
  }
}

/**
 * Get price for BTC/USD
 */
export async function getBTCPrice(): Promise<number> {
  try {
    // BTC/USD price feed ID
    const btcPriceId = '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43';
    const feeds = await getPriceFeed([btcPriceId]);
    return feeds[0]?.price || 0;
  } catch (error) {
    console.error('Error fetching BTC price:', error);
    return 0;
  }
}

/**
 * Get ETH/USD price
 */
export async function getETHPrice(): Promise<number> {
  try {
    // ETH/USD price feed ID
    const ethPriceId = '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace';
    const feeds = await getPriceFeed([ethPriceId]);
    return feeds[0]?.price || 0;
  } catch (error) {
    console.error('Error fetching ETH price:', error);
    return 0;
  }
}

/**
 * Get token prices for multiple assets
 */
export async function getTokenPrices(symbols: string[]): Promise<Record<string, number>> {
  const prices: Record<string, number> = {};
  
  // Map common symbols to Pyth price IDs
  const priceIdMap: Record<string, string> = {
    'SOL': '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
    'BTC': '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
    'ETH': '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
    'USDC': '0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a',
    'USDT': '0x1fc18861232290221461220bd4e2acd1dcdfbc89c84092c8cba5f5de2c5c3d3a',
  };

  try {
    const priceIds = symbols
      .map(s => priceIdMap[s.toUpperCase()])
      .filter(id => id !== undefined);

    if (priceIds.length > 0) {
      const feeds = await getPriceFeed(priceIds);
      feeds.forEach((feed, index) => {
        const symbol = symbols[index]?.toUpperCase() || '';
        if (symbol) {
          prices[symbol] = feed.price;
        }
      });
    }
  } catch (error) {
    console.error('Error fetching token prices:', error);
  }

  return prices;
}
