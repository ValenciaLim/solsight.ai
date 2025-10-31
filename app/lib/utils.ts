/**
 * Utility functions for SolSight research engine
 */

import { CacheConfig } from './types';

/**
 * Generate a cache key for data fetching
 */
export function generateCacheKey(prefix: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${JSON.stringify(params[key])}`)
    .join('|');
  
  return `${prefix}:${sortedParams}`;
}

/**
 * Deep merge two objects
 */
export function deepMerge<T extends Record<string, any>>(
  target: T,
  source: Partial<T>
): T {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge((result[key] || {}) as any, source[key] as any);
    } else {
      result[key] = (source as any)[key];
    }
  }
  
  return result;
}

/**
 * Extract domain from user query using keyword matching
 */
export function extractDomainsFromKeywords(query: string): string[] {
  const lowerQuery = query.toLowerCase();
  const domainKeywords: Record<string, string[]> = {
    nft_activity: ['nft', 'collection', 'mint', 'transfer', 'floor price', 'listing', 'trade'],
    defi_activity: ['defi', 'yield', 'staking', 'liquidity', 'pool', 'farm', 'tvl', 'total value locked'],
    wallet_flows: ['wallet', 'address', 'transaction', 'transfer', 'flow', 'whale', 'holder', 'balance', 'growth'],
    token_analysis: ['token', 'price', 'volume', 'market cap', 'holder', 'supply', 'circulating'],
    protocol_metrics: ['protocol', 'metrics', 'active users', 'dau', 'retention', 'cohort', 'gas', 'fees'],
    market_data: ['price', 'volume', 'trade', 'market', 'exchange', 'sentiment', 'oracle'],
    research: ['query', 'custom', 'analysis', 'research', 'sql', 'flipside'],
  };

  const detectedDomains: string[] = [];
  
  for (const [domain, keywords] of Object.entries(domainKeywords)) {
    if (keywords.some(keyword => lowerQuery.includes(keyword))) {
      detectedDomains.push(domain);
    }
  }

  return detectedDomains.length > 0 ? detectedDomains : ['token_analysis']; // default
}

/**
 * Parse time range from user query
 */
export function parseTimeRange(query: string): string {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('last week') || lowerQuery.includes('past week')) {
    return '7d';
  }
  if (lowerQuery.includes('last month') || lowerQuery.includes('past month')) {
    return '30d';
  }
  if (lowerQuery.includes('last 3 months') || lowerQuery.includes('past 3 months')) {
    return '90d';
  }
  if (lowerQuery.includes('last year') || lowerQuery.includes('past year')) {
    return '365d';
  }
  if (lowerQuery.includes('today')) {
    return '1d';
  }
  if (lowerQuery.includes('all time')) {
    return 'all';
  }
  
  return '30d'; // default
}

/**
 * Generate timestamp from time range
 */
export function timeRangeToTimestamp(range: string): { start?: number; end: number } {
  const end = Math.floor(Date.now() / 1000);
  
  if (range === 'all') {
    return { end };
  }

  const match = range.match(/(\d+)([dmy])/);
  if (!match) {
    return { end };
  }

  const value = parseInt(match[1]);
  const unit = match[2];

  let start: number;
  switch (unit) {
    case 'd':
      start = end - (value * 24 * 60 * 60);
      break;
    case 'm':
      start = end - (value * 30 * 24 * 60 * 60);
      break;
    case 'y':
      start = end - (value * 365 * 24 * 60 * 60);
      break;
    default:
      start = end - (30 * 24 * 60 * 60); // 30 days default
  }

  return { start, end };
}

/**
 * Validate required environment variables
 */
export function validateEnvVars(required: string[]): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  
  for (const envVar of required) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }
  
  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Retry logic with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

/**
 * Sanitize data for cache storage
 */
export function sanitizeForCache(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  if (Array.isArray(data)) {
    return data.slice(0, 100).map(item => sanitizeForCache(item)); // Limit array size
  }
  
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string' && value.length > 10000) {
      sanitized[key] = value.substring(0, 10000) + '...';
    } else {
      sanitized[key] = sanitizeForCache(value);
    }
  }
  
  return sanitized;
}

