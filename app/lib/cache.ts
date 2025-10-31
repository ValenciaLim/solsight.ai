/**
 * Caching utilities for SolSight research engine
 * Implements in-memory cache with TTL support
 */

import { CacheConfig } from './types';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  tags?: string[];
}

class Cache {
  private storage: Map<string, CacheEntry<any>> = new Map();
  private tagIndex: Map<string, Set<string>> = new Map();

  /**
   * Get data from cache
   */
  get<T>(key: string): T | null {
    const entry = this.storage.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  /**
   * Set data in cache
   */
  set<T>(key: string, data: T, ttl: number, tags?: string[]): void {
    const entry: CacheEntry<T> = {
      data,
      expiresAt: Date.now() + ttl * 1000,
      tags,
    };
    
    this.storage.set(key, entry);
    
    // Update tag index
    if (tags) {
      for (const tag of tags) {
        if (!this.tagIndex.has(tag)) {
          this.tagIndex.set(tag, new Set());
        }
        this.tagIndex.get(tag)!.add(key);
      }
    }
  }

  /**
   * Delete a specific key from cache
   */
  delete(key: string): void {
    const entry = this.storage.get(key);
    if (entry?.tags) {
      for (const tag of entry.tags) {
        this.tagIndex.get(tag)?.delete(key);
      }
    }
    this.storage.delete(key);
  }

  /**
   * Delete all keys with a specific tag
   */
  deleteByTag(tag: string): void {
    const keys = this.tagIndex.get(tag);
    if (keys) {
      for (const key of keys) {
        this.delete(key);
      }
      this.tagIndex.delete(tag);
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.storage.clear();
    this.tagIndex.clear();
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Get cache statistics
   */
  stats(): { size: number; tagCount: number; keys: string[] } {
    return {
      size: this.storage.size,
      tagCount: this.tagIndex.size,
      keys: Array.from(this.storage.keys()),
    };
  }

  /**
   * Clean expired entries
   */
  cleanExpired(): number {
    let cleaned = 0;
    const now = Date.now();
    
    for (const [key, entry] of this.storage.entries()) {
      if (now > entry.expiresAt) {
        this.delete(key);
        cleaned++;
      }
    }
    
    return cleaned;
  }
}

// Singleton instance
export const cache = new Cache();

// Auto-clean expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cache.cleanExpired();
  }, 5 * 60 * 1000);
}

/**
 * Cache helper with configuration
 */
export async function withCache<T>(
  config: CacheConfig,
  fetcher: () => Promise<T>
): Promise<T> {
  // Check cache first
  const cached = cache.get<T>(config.key);
  if (cached !== null) {
    return cached;
  }
  
  // Fetch fresh data
  const data = await fetcher();
  
  // Store in cache
  cache.set(config.key, data, config.ttl, config.tags);
  
  return data;
}

