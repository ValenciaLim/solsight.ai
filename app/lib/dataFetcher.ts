/**
 * Flexible Intent-Based Data Fetcher
 * 
 * Uses LLM to understand chart intent and dynamically fetch data
 * Supports composition of multiple sources and easy extension
 */

import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { cache } from './cache'
import { generateCacheKey } from './utils'

// Import all fetchers
import * as helius from './fetchers/helius'
import * as jupiter from './fetchers/jupiter'
import * as magiceden from './fetchers/magiceden'
import * as defillama from './fetchers/defillama'
import * as messari from './fetchers/messari'
import * as pyth from './fetchers/pyth'
import * as solscan from './fetchers/solscan'
import * as solanafm from './fetchers/solanafm'

export interface FetchPlan {
  source: string
  function: string
  params: Record<string, any>
  description: string
  fallback?: FetchPlan // Optional fallback plan if primary fails
}

export interface CompositionPlan {
  primary: FetchPlan
  secondary?: FetchPlan[]
  combineStrategy: 'merge' | 'aggregate' | 'timeSeries' | 'join'
  description: string
}

/**
 * Available data sources and their functions
 * This is the "catalog" - easy to extend by adding new functions
 */
const AVAILABLE_FETCHERS = {
  helius: {
    description: 'Solana NFT, wallet, and transaction data',
    functions: [
      { name: 'fetchWalletPortfolio', params: ['walletAddress'], description: 'Get wallet SOL balance, tokens, NFTs' },
      { name: 'getAssetsByOwner', params: ['ownerAddress', 'page?', 'limit?'], description: 'Get NFTs owned by wallet' },
      { name: 'fetchTransactionHistory', params: ['address', 'limit?'], description: 'Get transaction history' },
      { name: 'getCollectionMetadata', params: ['collectionId'], description: 'Get NFT collection info' },
      { name: 'getWalletProgramInteractions', params: ['address', 'limit?'], description: 'Get program interactions' },
      { name: 'fetchTokenBalances', params: ['walletAddress'], description: 'Get token balances' },
      { name: 'fetchWalletNFTs', params: ['walletAddress'], description: 'Get NFT holdings' },
      { name: 'fetchTokenPrices', params: ['tokens[]'], description: 'Get token prices' },
    ]
  },
  jupiter: {
    description: 'Token prices and swap data',
    functions: [
      { name: 'getTokenPrice', params: ['tokenMint'], description: 'Get current token price' },
      { name: 'getQuote', params: ['inputMint', 'outputMint', 'amount'], description: 'Get swap quote' },
      { name: 'getLiquidity', params: ['inputMint', 'outputMint'], description: 'Get pool liquidity' },
    ]
  },
  magiceden: {
    description: 'NFT marketplace data',
    functions: [
      { name: 'getCollectionStats', params: ['collectionSymbol'], description: 'Get collection statistics' },
      { name: 'getRecentTrades', params: ['collectionSymbol', 'limit'], description: 'Get recent trades' },
      { name: 'getFloorPrice', params: ['collectionSymbol'], description: 'Get floor price' },
      { name: 'getCollectionListings', params: ['collectionSymbol', 'limit'], description: 'Get active listings' },
    ]
  },
  defillama: {
    description: 'DeFi protocol TVL and metrics',
    functions: [
      { name: 'getChainTVL', params: ['chain'], description: 'Get chain total TVL' },
      { name: 'getHistoricalChainTVL', params: ['chain', 'startTs', 'endTs'], description: 'Get historical TVL' },
      { name: 'getProtocolList', params: ['chain'], description: 'Get protocol list' },
      { name: 'getStablecoins', params: [], description: 'Get stablecoin data' },
    ]
  },
  messari: {
    description: 'Market data and protocol metrics',
    functions: [
      { name: 'getAssetMetrics', params: ['assetSlug'], description: 'Get asset market data' },
      { name: 'getProtocolMetrics', params: ['protocolSlug'], description: 'Get protocol metrics' },
      { name: 'getProtocolRevenue', params: ['protocolSlug'], description: 'Get protocol revenue' },
      { name: 'getTrendingNews', params: [], description: 'Get trending news' },
      { name: 'getYields', params: [], description: 'Get yield data' },
    ]
  },
  pyth: {
    description: 'Price oracles',
    functions: [
      { name: 'getPriceFeed', params: ['priceId'], description: 'Get price feed' },
      { name: 'getHistoricalPrice', params: ['priceId', 'interval', 'limit'], description: 'Get historical prices' },
      { name: 'getMultiplePriceFeeds', params: ['priceIds'], description: 'Get multiple price feeds' },
    ]
  },
  solscan: {
    description: 'Solana on-chain data',
    functions: [
      { name: 'getAccountInfo', params: ['account'], description: 'Get account information' },
      { name: 'getAccountTransactions', params: ['account', 'limit', 'offset'], description: 'Get account transactions' },
      { name: 'getChainInfo', params: [], description: 'Get chain information' },
      { name: 'getMarketTokens', params: [], description: 'Get market token data' },
    ]
  },
  solanafm: {
    description: 'Indexed transactions and program data',
    functions: [
      { name: 'getAccountTransactions', params: ['account', 'limit', 'offset'], description: 'Get account transactions' },
      { name: 'getAccountTransfers', params: ['account', 'limit', 'offset'], description: 'Get account transfers' },
      { name: 'getBlocks', params: ['limit', 'offset'], description: 'Get block data' },
      { name: 'getSolanaDailyTransactionFees', params: [], description: 'Get daily transaction fees' },
    ]
  }
}

/**
 * Classify if chart needs wallet-specific or aggregate data
 */
function isAggregateChart(chart: { title?: string; description?: string }): boolean {
  const title = (chart.title || '').toLowerCase()
  const desc = (chart.description || '').toLowerCase()
  const text = `${title} ${desc}`
  
  // Aggregate indicators (chain-level, ecosystem-wide metrics)
  const aggregateKeywords = [
    'growth', 'active wallets', 'new wallets', 'total wallets',
    'monthly active', 'daily active', 'distribution', 'aggregate',
    'ecosystem', 'network', 'chain', 'total', 'all wallets',
    'wallet growth', 'user growth', 'adoption', 'wallet type',
    'over time', 'trend', 'statistics', 'analytics', 'metrics'
  ]
  
  // Individual wallet indicators (personal/account-specific)
  const individualKeywords = [
    'my wallet', 'my portfolio', 'my holdings', 'my balance',
    'portfolio value', 'wallet balance', 'nft holdings',
    'my nft', 'my tokens', 'my transactions'
  ]
  
  // Check for individual indicators first (higher priority)
  if (individualKeywords.some(k => text.includes(k))) {
    return false
  }
  
  // Check for aggregate indicators
  if (aggregateKeywords.some(k => text.includes(k))) {
    return true
  }
  
  // Default: if title has "wallet" but no possessive ("my", "your"), likely aggregate
  if (title.includes('wallet') && !title.includes('my') && !title.includes('your')) {
    return true
  }
  
  return false
}

/**
 * Use LLM to generate fetch plan(s) based on chart intent
 * Supports single fetch or composition of multiple sources
 */
export async function generateFetchPlan(
  chart: { 
    title?: string
    dataSource?: string
    type?: string
    description?: string
    xKey?: string
    yKey?: string
  },
  context: { 
    walletAddress?: string
    params?: Record<string, any>
  }
): Promise<FetchPlan | CompositionPlan | null> {
  // Check cache first
  const cacheKey = generateCacheKey('fetch-plan', {
    title: chart.title,
    dataSource: chart.dataSource,
    type: chart.type,
  })
  const cached = cache.get(cacheKey) as FetchPlan | CompositionPlan | null
  if (cached) {
    console.log('✅ Using cached fetch plan')
    return cached
  }

  // Classify chart type before generating plan
  const isAggregate = isAggregateChart(chart)
  console.log(`📊 Chart classification: "${chart.title}" → ${isAggregate ? 'AGGREGATE' : 'INDIVIDUAL'}`)

  try {
    const result = await generateText({
      model: openai('gpt-4o-mini'),
      system: `You are a data fetching planner for Solana analytics. Analyze chart intent and generate fetch plans.

AVAILABLE DATA SOURCES:
${JSON.stringify(AVAILABLE_FETCHERS, null, 2)}

CRITICAL DISTINCTION - Chart Classification:
📊 AGGREGATE/CHAIN-LEVEL charts (DO NOT use walletAddress):
   Examples: "Wallet Growth Over Time", "Monthly Active Wallets", "Wallet Type Distribution", 
            "New Wallets", "Total Wallets", "Daily Active Users", "Wallet Adoption"
   → Use chain-level functions: solscan.getChainInfo(), solanafm.getSolanaDailyTransactionFees(), 
     defillama.getHistoricalChainTVL(), etc.
   → NEVER pass walletAddress parameter for aggregate queries

👤 INDIVIDUAL WALLET charts (USE walletAddress):
   Examples: "My Portfolio", "Wallet Balance", "My NFT Holdings", "Token Balances",
            "My Transactions", "Portfolio Value"
   → Use wallet-specific functions: helius.fetchWalletPortfolio(walletAddress),
     helius.getAssetsByOwner(walletAddress), etc.
   → MUST pass walletAddress parameter from context

Chart Title Patterns:
❌ AGGREGATE (no walletAddress): "Growth", "Active Wallets", "Distribution", "New Users", 
   "Monthly Active", "Total", "Over Time", "Trend", "Statistics"
✅ INDIVIDUAL (use walletAddress): "My Portfolio", "My Wallet", "My Holdings", "Portfolio Value"

Generate a JSON fetch plan. You can return either:
1. Single fetch: { "source": "helius", "function": "fetchWalletPortfolio", "params": {...}, "description": "..." }
2. Composition: { "primary": {...}, "secondary": [...], "combineStrategy": "merge|aggregate|timeSeries|join", "description": "..." }

Rules:
- ONLY use walletAddress if chart is clearly about an INDIVIDUAL wallet (e.g., "My Portfolio", "Wallet Balance")
- For AGGREGATE charts (e.g., "Wallet Growth", "Active Wallets"), use chain-level functions WITHOUT walletAddress
- Choose the most appropriate source and function based on chart classification
- For composite queries, use "secondary" array for additional data sources
- Return ONLY valid JSON, no explanation text
- For time series charts, prefer historical functions when available`,
      prompt: `Chart Intent:
Title: ${chart.title || 'N/A'}
Type: ${chart.type || 'N/A'}
DataSource: ${chart.dataSource || 'N/A'}
Description: ${chart.description || 'N/A'}
X-axis: ${chart.xKey || 'N/A'}
Y-axis: ${chart.yKey || 'N/A'}

Context:
Wallet: ${context.walletAddress || 'N/A'}
Chart Classification: ${isAggregate ? 'AGGREGATE (DO NOT use walletAddress - use chain-level functions)' : 'INDIVIDUAL (MAY use walletAddress if about specific wallet)'}
Params: ${JSON.stringify(context.params || {})}

CLASSIFICATION EXAMPLES:
- "Wallet Growth Over Time" → AGGREGATE → solscan.getChainInfo() (NO walletAddress)
- "Monthly Active Wallets" → AGGREGATE → solscan.getChainInfo() or solanafm.getSolanaDailyTransactionFees() (NO walletAddress)
- "Wallet Type Distribution" → AGGREGATE → solscan.getChainInfo() (NO walletAddress)
- "My Portfolio Value" → INDIVIDUAL → helius.fetchWalletPortfolio(walletAddress) (WITH walletAddress)
- "My NFT Holdings" → INDIVIDUAL → helius.getAssetsByOwner(walletAddress) (WITH walletAddress)

IMPORTANT: 
1. Check chart classification above
2. If AGGREGATE: Do NOT include walletAddress in params, use chain-level functions
3. If INDIVIDUAL: Include walletAddress from context in params
4. Generate params matching the exact function signature from AVAILABLE_FETCHERS
5. Generate the best fetch plan:`,
      temperature: 0.2,
    })

    // Parse response
    let plan
    try {
      const jsonMatch = result.text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        plan = JSON.parse(jsonMatch[0])
      } else {
        plan = JSON.parse(result.text.trim())
      }
    } catch (parseError) {
      console.error('Failed to parse LLM response:', result.text)
      return null
    }

    // Validate plan structure
    if (!plan.source && !plan.primary) {
      console.error('Invalid plan structure:', plan)
      return null
    }

    // Cache for 1 hour
    cache.set(cacheKey, plan, 3600, ['fetch-plan'])

    return plan
  } catch (error) {
    console.error('Error generating fetch plan:', error)
    return null
  }
}

/**
 * Execute a single fetch plan
 */
export async function executeFetchPlan(
  plan: FetchPlan,
  context: { walletAddress?: string; params?: Record<string, any> }
): Promise<any> {
  const { source, function: funcName, params: planParams } = plan

  // Dynamic fetcher mapping
  const fetchers: Record<string, any> = {
    helius,
    jupiter,
    magiceden,
    defillama,
    messari,
    pyth,
    solscan,
    solanafm,
  }

  const fetcher = fetchers[source]
  if (!fetcher) {
    throw new Error(`Data source "${source}" not found`)
  }

  if (!fetcher[funcName] || typeof fetcher[funcName] !== 'function') {
    throw new Error(`Function "${funcName}" not found in ${source}`)
  }

  // Merge context params with plan params
  const mergedParams: Record<string, any> = { 
    ...planParams,
    // Map common parameter names
    address: context.walletAddress || planParams.address,
    walletAddress: context.walletAddress || planParams.walletAddress,
    account: context.walletAddress || planParams.account,
    ...context.params 
  }

  // Remove undefined values
  Object.keys(mergedParams).forEach(key => {
    if (mergedParams[key] === undefined) {
      delete mergedParams[key]
    }
  })

  // Execute function
  // Fetcher functions typically take positional parameters
  // The LLM should generate params in the correct order
  try {
    const func = fetcher[funcName]

    // Extract parameters in order based on function signature
    // The LLM generates params with correct names matching function signatures
    const funcParamNames = AVAILABLE_FETCHERS[source as keyof typeof AVAILABLE_FETCHERS]
      ?.functions.find(f => f.name === funcName)?.params || []
    
    // Map parameter names from plan to actual values
    const params: any[] = []
    
    for (const paramName of funcParamNames) {
      // Remove optional indicator (?) if present
      const cleanName = paramName.replace('?', '').replace('[]', '')
      
      // Try exact match first
      if (mergedParams[cleanName] !== undefined) {
        params.push(mergedParams[cleanName])
      }
      // Try common aliases
      else if (cleanName.includes('address') || cleanName.includes('wallet')) {
        params.push(mergedParams.address || mergedParams.walletAddress || mergedParams.account || mergedParams.ownerAddress)
      }
      else if (cleanName.includes('symbol') || cleanName.includes('collection')) {
        params.push(mergedParams.collectionSymbol || mergedParams.symbol || mergedParams.collectionId)
      }
      // For array params (like tokens[])
      else if (paramName.includes('[]')) {
        params.push(mergedParams[cleanName] || mergedParams[`${cleanName}s`] || [])
      }
      // For optional params, pass undefined if not found
      else if (paramName.includes('?')) {
        params.push(mergedParams[cleanName])
      }
    }

    // If we couldn't map params but have something, try passing the object
    if (params.length === 0 && Object.keys(mergedParams).length > 0) {
      // Try single object parameter
      try {
        return await func(mergedParams)
      } catch {
        // Try with first value
        const firstValue = Object.values(mergedParams)[0]
        return await func(firstValue)
      }
    }

    return await func(...params.filter(p => p !== undefined))
  } catch (error) {
    // Try fallback plan if available
    if (plan.fallback) {
      console.log(`⚠️ Primary fetch failed, trying fallback: ${plan.fallback.description}`)
      return await executeFetchPlan(plan.fallback, context)
    }
    throw error
  }
}

/**
 * Execute composition plan (multiple data sources)
 */
export async function executeCompositionPlan(
  plan: CompositionPlan,
  context: { walletAddress?: string; params?: Record<string, any> }
): Promise<any> {
  const { primary, secondary = [], combineStrategy } = plan

  // Execute primary fetch
  const primaryData = await executeFetchPlan(primary, context)

  // Execute secondary fetches in parallel
  const secondaryData = await Promise.all(
    secondary.map(sec => executeFetchPlan(sec, context).catch(err => {
      console.warn(`Secondary fetch failed: ${err.message}`)
      return null
    }))
  )

  // Combine based on strategy
  switch (combineStrategy) {
    case 'merge':
      // Merge all data into single object
      return {
        ...primaryData,
        ...secondaryData.reduce((acc, data) => ({ ...acc, ...(data || {}) }), {})
      }

    case 'aggregate':
      // Aggregate numeric values
      const aggregate = { ...primaryData }
      secondaryData.forEach(data => {
        if (data && typeof data === 'object') {
          Object.entries(data).forEach(([key, value]) => {
            if (typeof value === 'number') {
              aggregate[key] = (aggregate[key] || 0) + value
            }
          })
        }
      })
      return aggregate

    case 'timeSeries':
      // Combine time series data
      const series = Array.isArray(primaryData) ? [...primaryData] : [primaryData]
      secondaryData.forEach(data => {
        if (Array.isArray(data)) {
          series.push(...data)
        } else if (data) {
          series.push(data)
        }
      })
      return series.sort((a, b) => {
        const aTime = a.timestamp || a.date || 0
        const bTime = b.timestamp || b.date || 0
        return aTime - bTime
      })

    case 'join':
      // Join by common key (default: timestamp or date)
      const joined = Array.isArray(primaryData) ? [...primaryData] : [primaryData]
      // Simple join - in production, you'd match on keys
      return joined

    default:
      return primaryData
  }
}

/**
 * Generate human-readable error explanation using LLM
 */
export async function explainFetchError(
  error: Error,
  plan: FetchPlan | CompositionPlan,
  chart: any
): Promise<string> {
  try {
    const result = await generateText({
      model: openai('gpt-4o-mini'),
      system: `You are an error explainer for data fetching. Generate user-friendly error messages.

Explain what went wrong and suggest solutions. Be concise (2-3 sentences max).`,
      prompt: `Chart: ${chart.title || 'Unknown'}
Fetch Plan: ${JSON.stringify(plan, null, 2)}
Error: ${error.message}

Explain what happened:`,
      temperature: 0.3,
    })

    return result.text.trim()
  } catch (explainError) {
    // Fallback to simple error message
    return `Failed to fetch data: ${error.message}. The fetch plan was: ${JSON.stringify(plan)}`
  }
}

