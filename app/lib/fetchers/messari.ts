/**
 * Messari API Client for institutional research & market feeds
 * API: https://messari.io/api/docs
 */

import { FetcherError } from '../types';
import { retryWithBackoff, validateEnvVars } from '../utils';

const MESSARI_API_URL = 'https://data.messari.io/api';

export interface MessariAssetMetrics {
  market_data: {
    price_usd: number;
    volume_usd: number;
    market_cap_usd: number;
    circulating_supply: number;
  };
  marketcap: {
    current_marketcap_usd: number;
    rank: number;
  };
}

export interface MessariMarketData {
  price: number;
  volume_24h: number;
  market_cap: number;
  circulating_supply: number;
}

/**
 * Get asset metrics
 */
export async function getAssetMetrics(assetSlug: string): Promise<MessariMarketData> {
  try {
    return await retryWithBackoff(async () => {
      const response = await fetch(
        `${MESSARI_API_URL}/v1/assets/${assetSlug}/metrics`,
        {
          headers: {
            'X-MESSARI-API-KEY': process.env.MESSARI_API_KEY || '',
          },
        }
      );

      if (!response.ok) {
        throw new FetcherError(
          `Messari API error: ${response.statusText}`,
          'messari',
          response.status,
          response.status >= 500
        );
      }

      const data = await response.json();
      const metrics = data.data;
      
      return {
        price: metrics.market_data?.price_usd || 0,
        volume_24h: metrics.market_data?.volume_last_24_hours || 0,
        market_cap: metrics.marketcap?.current_marketcap_usd || 0,
        circulating_supply: metrics.supply?.circulating || 0,
      };
    });
  } catch (error) {
    console.error('Error fetching Messari asset metrics:', error);
    throw error;
  }
}

/**
 * Get yield rates
 */
export async function getYieldRates(protocol?: string): Promise<Array<{ name: string; apy: number }>> {
  try {
    const response = await fetch(
      `${MESSARI_API_URL}/v1/yields`,
      {
        headers: {
          'X-MESSARI-API-KEY': process.env.MESSARI_API_KEY || '',
        },
      }
    );

    if (!response.ok) {
      throw new FetcherError(
        `Messari yields error: ${response.statusText}`,
        'messari',
        response.status
      );
    }

    const data = await response.json();
    return data.data?.map((item: any) => ({
      name: item.name,
      apy: item.apy || 0,
    })) || [];
  } catch (error) {
    console.error('Error fetching yield rates:', error);
    throw error;
  }
}

/**
 * Get protocol revenue
 */
export async function getProtocolRevenue(protocolSlug: string): Promise<{ revenue: number; fees: number }> {
  try {
    const response = await fetch(
      `${MESSARI_API_URL}/v1/protocols/${protocolSlug}/revenue`,
      {
        headers: {
          'X-MESSARI-API-KEY': process.env.MESSARI_API_KEY || '',
        },
      }
    );

    if (!response.ok) {
      throw new FetcherError(
        `Messari revenue error: ${response.statusText}`,
        'messari',
        response.status
      );
    }

    const data = await response.json();
    return {
      revenue: data.revenue || 0,
      fees: data.fees || 0,
    };
  } catch (error) {
    console.error('Error fetching protocol revenue:', error);
    throw error;
  }
}

/**
 * Get market sentiment
 */
export async function getMarketSentiment(assetSlug: string): Promise<{ score: number; signal: string }> {
  try {
    const response = await fetch(
      `${MESSARI_API_URL}/v1/news/sentiment?assets=${assetSlug}`,
      {
        headers: {
          'X-MESSARI-API-KEY': process.env.MESSARI_API_KEY || '',
        },
      }
    );

    if (!response.ok) {
      throw new FetcherError(
        `Messari sentiment error: ${response.statusText}`,
        'messari',
        response.status
      );
    }

    const data = await response.json();
    return {
      score: data.score || 0,
      signal: data.signal || 'neutral',
    };
  } catch (error) {
    console.error('Error fetching market sentiment:', error);
    throw error;
  }
}

/**
 * Get trending news
 */
export async function getTrendingNews(limit: number = 10): Promise<Array<{ title: string; url: string; published: string }>> {
  try {
    const response = await fetch(
      `${MESSARI_API_URL}/v1/news?limit=${limit}`,
      {
        headers: {
          'X-MESSARI-API-KEY': process.env.MESSARI_API_KEY || '',
        },
      }
    );

    if (!response.ok) {
      throw new FetcherError(
        `Messari news error: ${response.statusText}`,
        'messari',
        response.status
      );
    }

    const data = await response.json();
    return data.data?.map((item: any) => ({
      title: item.title,
      url: item.url,
      published: item.published_at,
    })) || [];
  } catch (error) {
    console.error('Error fetching news:', error);
    throw error;
  }
}
