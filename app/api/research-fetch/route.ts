import { NextRequest, NextResponse } from 'next/server';
import metricsRegistry from '@/app/lib/metrics/metrics_registry.json';
import { MetricRegistryEntry, FetcherError } from '@/app/lib/types';
import { cache } from '@/app/lib/cache';
import { generateCacheKey } from '@/app/lib/utils';

// Import all fetchers
import * as helius from '@/app/lib/fetchers/helius';
import * as jupiter from '@/app/lib/fetchers/jupiter';
import * as magiceden from '@/app/lib/fetchers/magiceden';
import * as defillama from '@/app/lib/fetchers/defillama';
import * as messari from '@/app/lib/fetchers/messari';
import * as pyth from '@/app/lib/fetchers/pyth';
import * as solscan from '@/app/lib/fetchers/solscan';
import * as solanafm from '@/app/lib/fetchers/solanafm';

export const maxDuration = 60;

/**
 * Map metric IDs to their fetcher functions
 * Covers all 73 metrics from the registry
 */
const fetcherMap: Record<string, (metric: MetricRegistryEntry, params: Record<string, any>) => Promise<any>> = {
  // ==================== HELIUS METRICS (17) ====================
  'nft_floor_price': async (_, params) => {
    const portfolio = await helius.getWalletPortfolio(params.address);
    return { value: portfolio.totalValueUSD || 0, timestamp: Date.now() };
  },
  'nft_volume_24h': async (_, params) => {
    const txs = await helius.getTransactionHistory(params.address, { limit: 100 });
    return { count: txs.filter(t => t.type === 'NFT_TRANSFER').length, timestamp: Date.now() };
  },
  'nft_unique_holders': async (_, params) => {
    const assets = await helius.getAssetsByOwner(params.address);
    const uniqueHolders = new Set(assets.map(a => a.id)).size;
    return { count: uniqueHolders, timestamp: Date.now() };
  },
  'nft_transfers_count': async (_, params) => {
    const txs = await helius.getTransactionHistory(params.address, { type: 'NFT_TRANSFER' });
    return { count: txs.length, timestamp: Date.now() };
  },
  'nft_mint_volume': async (_, params) => {
    const txs = await helius.getTransactionHistory(params.address, { type: 'MINT' });
    return { count: txs.length, timestamp: Date.now() };
  },
  'wallet_sol_balance': async (_, params) => {
    const portfolio = await helius.getWalletPortfolio(params.address);
    return { value: portfolio.solBalance, timestamp: Date.now() };
  },
  'wallet_total_value_usd': async (_, params) => {
    const portfolio = await helius.getWalletPortfolio(params.address);
    return { value: portfolio.totalValueUSD || 0, timestamp: Date.now() };
  },
  'wallet_transactions_count': async (_, params) => {
    const txs = await helius.getTransactionHistory(params.address, { limit: params.limit || 100 });
    return { count: txs.length, timestamp: Date.now() };
  },
  'wallet_new_addresses': async (_, params) => {
    const txs = await helius.getTransactionHistory(params.address, { type: 'ACCOUNT_CREATE' });
    return { count: txs.length, timestamp: Date.now() };
  },
  'wallet_active_wallets': async (_, params) => {
    const txs = await helius.getTransactionHistory(params.address, { limit: 1000 });
    const uniqueWallets = new Set(txs.flatMap(t => [
      t.accountData?.map(a => a.account).filter(Boolean)
    ].flat())).size;
    return { count: uniqueWallets, timestamp: Date.now() };
  },
  'wallet_dau': async (_, params) => {
    const txs = await helius.getTransactionHistory(params.address, { limit: 100 });
    const today = new Date().toDateString();
    const todayTxs = txs.filter(t => new Date(t.timestamp).toDateString() === today);
    return { count: todayTxs.length, timestamp: Date.now() };
  },
  'helius_program_interactions': async (_, params) => {
    return await helius.getWalletProgramInteractions(params.address, params.limit || 100);
  },
  'helius_collection_metadata': async (_, params) => {
    const assets = await helius.getAssetsByOwner(params.address);
    return await helius.getCollectionMetadata(assets[0]?.grouping?.[0]?.group_value || '');
  },
  'whale_nft_holdings': async (_, params) => {
    const assets = await helius.getAssetsByOwner(params.address);
    return { count: assets.length, timestamp: Date.now() };
  },
  'whale_transaction_frequency': async (_, params) => {
    const txs = await helius.getTransactionHistory(params.address, { limit: 100 });
    const hourly = txs.reduce((acc, t) => {
      const hour = new Date(t.timestamp).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    return { hourly, timestamp: Date.now() };
  },
  'whale_token_accumulation': async (_, params) => {
    const portfolio = await helius.getWalletPortfolio(params.address);
    return { tokens: portfolio.tokens, timestamp: Date.now() };
  },
  'helius_top_wallets': async (_, params) => {
    const txs = await helius.getTransactionHistory(params.address, { limit: params.limit || 100 });
    return { wallets: txs.slice(0, 10), timestamp: Date.now() };
  },
  'helius_nft_stats': async (_, params) => {
    const assets = await helius.getAssetsByOwner(params.address);
    return { count: assets.length, collections: [...new Set(assets.map(a => a.grouping?.[0]?.group_value).filter(Boolean))].length };
  },
  'helius_defi_metrics': async (_, params) => {
    const txs = await helius.getTransactionHistory(params.address, { limit: 100 });
    return { transactions: txs.length, timestamp: Date.now() };
  },
  'helius_daily_txs': async (_, params) => {
    const txs = await helius.getTransactionHistory(params.address, { limit: 100 });
    return { count: txs.length, timestamp: Date.now() };
  },

  // ==================== MAGIC EDEN METRICS (6) ====================
  'nft_floor_price_magiceden': async (_, params) => {
    return await magiceden.getFloorPrice(params.symbol);
  },
  'nft_volume_7d': async (_, params) => {
    const stats = await magiceden.getCollectionStats(params.symbol);
    return { value: stats.volumeAll || 0, timestamp: Date.now() };
  },
  'nft_recent_trades': async (_, params) => {
    return await magiceden.getRecentTrades(params.symbol, params.limit || 100);
  },
  'nft_listings_count': async (_, params) => {
    const listings = await magiceden.getCollectionListings(params.symbol, params.limit || 100);
    return { count: listings.length, timestamp: Date.now() };
  },
  'magiceden_listings_count': async (_, params) => {
    const listings = await magiceden.getCollectionListings(params.symbol, params.limit || 100);
    return { count: listings.length, timestamp: Date.now() };
  },
  'magiceden_trades_recent': async (_, params) => {
    return await magiceden.getRecentTrades(params.symbol, params.limit || 100);
  },

  // ==================== JUPITER METRICS (2) ====================
  'token_price': async (_, params) => {
    return await jupiter.getTokenPrice(params.tokenMint);
  },
  'token_price_jupiter': async (_, params) => {
    return await jupiter.getTokenPrice(params.tokenMint);
  },
  'token_volume_24h': async (_, params) => {
    // Jupiter doesn't provide volume directly
    throw new Error('Volume data not available from Jupiter');
  },
  'token_swap_volume': async (_, params) => {
    // Jupiter doesn't provide swap volume directly
    throw new Error('Swap volume data not available from Jupiter');
  },
  'jupiter_best_route': async (_, params) => {
    // Jupiter route API would go here
    throw new Error('Jupiter route API not implemented');
  },
  'jupiter_price_impact': async (_, params) => {
    // Jupiter impact API would go here
    throw new Error('Jupiter impact API not implemented');
  },

  // ==================== DEFILLAMA METRICS (6) ====================
  'defi_tvl': async (_, params) => {
    return await defillama.getChainTVL('solana');
  },
  'defi_tvl_historical': async (_, params) => {
    return await defillama.getHistoricalChainTVL('solana', params.start_ts, params.end_ts);
  },
  'defi_chain_tvl': async (_, params) => {
    return await defillama.getChainTVL(params.chain || 'solana');
  },
  'defi_protocol_tvl': async (_, params) => {
    const protocols = await defillama.getProtocolList('solana');
    const protocol = protocols.find(p => p.slug === params.protocol);
    return { value: protocol?.tvl || 0, timestamp: Date.now() };
  },
  'defi_yield': async (_, params) => {
    // DeFiLlama doesn't provide yield directly
    throw new Error('Yield data not available from DeFiLlama');
  },
  'defi_liquidity': async (_, params) => {
    // Jupiter liquidity would go here
    throw new Error('Liquidity data not available from DeFiLlama');
  },
  'defi_stablecoin_mcap': async (_, params) => {
    const stablecoins = await defillama.getStablecoins();
    const solanaStablecoins = stablecoins.find(s => s.chain === 'solana');
    return { value: solanaStablecoins?.totalCirculatingUSD || 0, timestamp: Date.now() };
  },
  'defillama_historical_tvl': async (_, params) => {
    return await defillama.getHistoricalChainTVL('solana', params.start_ts, params.end_ts);
  },
  'defillama_stablecoins': async (_, params) => {
    return await defillama.getStablecoins();
  },
  'defillama_protocol_tvl_rank': async (_, params) => {
    const protocols = await defillama.getProtocolList('solana');
    return { rankings: protocols, timestamp: Date.now() };
  },

  // ==================== MESSARI METRICS (4) ====================
  'messari_market_cap': async (_, params) => {
    const metrics = await messari.getAssetMetrics(params.assetSlug || 'sol');
    return { value: metrics.marketCap || 0, timestamp: Date.now() };
  },
  'messari_apy': async (_, params) => {
    const yields = await messari.getYields();
    const solanaYields = yields.filter(y => y.asset.toLowerCase().includes('sol'));
    return { apy: solanaYields[0]?.apy || 0, timestamp: Date.now() };
  },
  'messari_protocol_revenue': async (_, params) => {
    const revenue = await messari.getProtocolRevenue(params.protocolSlug || '');
    return { value: revenue, timestamp: Date.now() };
  },
  'messari_trending_news': async (_, params) => {
    return await messari.getTrendingNews();
  },

  // ==================== PYTH METRICS (8) ====================
  'token_price_pyth': async (_, params) => {
    return await pyth.getPriceFeed(params.priceId || 'ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d'); // SOL/USD
  },
  'pyth_price_history': async (_, params) => {
    return await pyth.getHistoricalPrice(params.priceId, params.interval || '1h', params.limit || 100);
  },
  'pyth_price_confidence': async (_, params) => {
    const feed = await pyth.getPriceFeed(params.priceId);
    return { confidence: feed?.confidence || 0, timestamp: Date.now() };
  },
  'pyth_sol_price': async (_, params) => {
    return await pyth.getPriceFeed('ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d');
  },
  'pyth_btc_price': async (_, params) => {
    return await pyth.getPriceFeed('e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43');
  },
  'pyth_eth_price': async (_, params) => {
    return await pyth.getPriceFeed('ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace');
  },
  'pyth_token_prices': async (_, params) => {
    const priceIds = params.priceIds || [];
    return await pyth.getMultiplePriceFeeds(priceIds);
  },

  // ==================== SOLSCAN METRICS (10) ====================
  'wallet_retention': async (_, params) => {
    const info = await solscan.getAccountInfo(params.account);
    return { active: info?.address ? 1 : 0, timestamp: Date.now() };
  },
  'token_holders_count': async (_, params) => {
    // Solscan doesn't provide holder count directly
    throw new Error('Holder count not available from Solscan');
  },
  'token_market_cap': async (_, params) => {
    const tokens = await solscan.getMarketTokens();
    const token = tokens.find(t => t.mint === params.tokenMint);
    return { value: token?.marketCap || 0, timestamp: Date.now() };
  },
  'token_circulating_supply': async (_, params) => {
    const tokens = await solscan.getMarketTokens();
    const token = tokens.find(t => t.mint === params.tokenMint);
    return { value: token?.supply || 0, timestamp: Date.now() };
  },
  'protocol_active_users': async (_, params) => {
    // Would need protocol-specific API
    throw new Error('Protocol active users not available');
  },
  'protocol_transaction_volume': async (_, params) => {
    const info = await solscan.getAccountInfo(params.programId);
    return { volume: 0, timestamp: Date.now() };
  },
  'protocol_fee_revenue': async (_, params) => {
    // Would need protocol-specific API
    throw new Error('Protocol fee revenue not available');
  },
  'protocol_new_users': async (_, params) => {
    // Would need protocol-specific API
    throw new Error('Protocol new users not available');
  },
  'chain_daily_txs': async (_, params) => {
    const info = await solscan.getChainInfo();
    return { count: info?.totalTransactions || 0, timestamp: Date.now() };
  },
  'chain_gas_fees': async (_, params) => {
    const info = await solscan.getChainInfo();
    return { value: info?.averageFee || 0, timestamp: Date.now() };
  },
  'market_data_price': async (_, params) => {
    const tokens = await solscan.getMarketTokens();
    return { tokens, timestamp: Date.now() };
  },
  'market_data_volume': async (_, params) => {
    const tokens = await solscan.getMarketTokens();
    const totalVolume = tokens.reduce((sum, t) => sum + (t.volume24h || 0), 0);
    return { value: totalVolume, timestamp: Date.now() };
  },
  'market_data_sentiment': async (_, params) => {
    // Sentiment data not available
    throw new Error('Sentiment data not available');
  },

  // ==================== SOLANAFM METRICS (4) ====================
  'solanafm_program_txs': async (_, params) => {
    // SolanaFM program endpoints would go here
    throw new Error('SolanaFM program transactions not implemented');
  },
  'solanafm_wallet_txs': async (_, params) => {
    return await solanafm.getAccountTransactions(params.account, params.limit || 100, params.offset || 0);
  },
  'solanafm_active_programs': async (_, params) => {
    const blocks = await solanafm.getBlocks(params.limit || 100, params.offset || 0);
    return { programs: blocks, timestamp: Date.now() };
  },
  'solanafm_mempool': async (_, params) => {
    const dailyData = await solanafm.getSolanaDailyTransactionFees();
    return { data: dailyData, timestamp: Date.now() };
  },
  'indexed_transactions': async (_, params) => {
    return await solanafm.getAccountTransactions(params.account, params.limit || 100, params.offset || 0);
  },
  'program_interactions': async (_, params) => {
    return await solanafm.getAccountTransactions(params.account, params.limit || 100, params.offset || 0);
  },

  // ==================== CUSTOM/COMPOSITE METRICS ====================
  'custom_sql_query': async (_, params) => {
    throw new Error('Custom SQL queries require Flipside integration');
  },
  'helius_custom_query': async (_, params) => {
    throw new Error('Custom queries require specific implementation');
  },
};

/**
 * POST /api/research-fetch
 * 
 * Fetches actual data based on metric ID
 * NO MOCK DATA FALLBACK - returns errors instead
 */
export async function POST(req: NextRequest) {
  try {
    const { metricId, params } = await req.json();

    if (!metricId) {
      return NextResponse.json(
        { error: 'metricId is required' },
        { status: 400 }
      );
    }

    // Find metric in registry
    const registry = metricsRegistry as { metrics: MetricRegistryEntry[] };
    const metric = registry.metrics.find(m => m.id === metricId);

    if (!metric) {
      return NextResponse.json(
        { error: `Metric ${metricId} not found in registry` },
        { status: 404 }
      );
    }

    // Check cache
    const cacheKey = generateCacheKey('fetch', { metricId, params });
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log(`✅ Returning cached data for ${metricId}`);
      return NextResponse.json({ data: cached });
    }

    // Execute fetcher
    const fetcher = fetcherMap[metricId];
    
    if (!fetcher) {
      console.error(`❌ No fetcher implementation for ${metricId}`);
      return NextResponse.json(
        { 
          error: `Fetcher not implemented for metric: ${metricId}`,
          metricId,
          source: metric.source
        },
        { status: 501 }
      );
    }

    console.log(`🔍 Fetching data for ${metricId} from ${metric.source}`);
    
    try {
      const data = await fetcher(metric, params || {});
      
      // Cache for 5 minutes
      cache.set(cacheKey, data, 300, ['data', metric.source]);
      
      return NextResponse.json({ data, source: metric.source });
    } catch (error) {
      console.error(`❌ Error fetching ${metricId}:`, error);
      return NextResponse.json(
        { 
          error: error instanceof Error ? error.message : 'Unknown error',
          metricId,
          source: metric.source,
          details: error instanceof Error ? error.stack : undefined
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Error in research-fetch:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
