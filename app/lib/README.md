# SolSight Research Engine Library

This directory contains the core research engine infrastructure for SolSight.ai, implementing the architecture defined in `.cursor/rules`.

## Structure

```
lib/
├── types.ts                          # Core TypeScript interfaces
├── utils.ts                          # Utility functions
├── cache.ts                          # In-memory caching with TTL
├── fetchers/                         # Data source fetchers
│   ├── helius.ts                     # ✅ Helius (26 metrics)
│   ├── jupiter.ts                    # ✅ Jupiter (6 metrics)
│   ├── magiceden.ts                  # ✅ Magic Eden (6 metrics)
│   ├── defillama.ts                  # ✅ DeFiLlama (8 metrics)
│   ├── messari.ts                    # ✅ Messari (10 metrics)
│   ├── pyth.ts                       # ✅ Pyth (8 metrics)
│   ├── solscan.ts                    # ✅ Solscan (3 metrics)
│   └── solanafm.ts                   # ✅ SolanaFM (6 metrics)
├── llm/                              # LLM orchestration modules
│   ├── intentParser.ts               # Parse user queries into intent
│   ├── domainRouter.ts               # Route to data domains
│   └── chartGenerator.ts             # Generate chart configurations
└── metrics/
    └── metrics_registry.json         # Metrics capability registry
```

## Core Components

### Types (`types.ts`)
Defines all TypeScript interfaces for the research engine, including:
- `IntentInterpretation`: Parsed user intent
- `DomainSelection`: Selected data domains
- `DataFetchPlan`: Executable data fetch plan
- `ChartConfigPlan`: Chart configurations
- `ResearchResponse`: Complete research plan

### Utils (`utils.ts`)
Helper functions for:
- Cache key generation
- Object merging
- Domain/keyword extraction
- Time range parsing
- Environment variable validation
- Retry logic with exponential backoff

### Cache (`cache.ts`)
In-memory cache with:
- TTL support
- Tag-based invalidation
- Automatic expiry cleaning
- `withCache` helper function

### LLM Modules

#### Intent Parser (`llm/intentParser.ts`)
Uses Vercel AI SDK + OpenAI to parse user queries into structured intent:
```typescript
const intent = await parseIntent("Analyze Solana NFT whale behavior");
// Returns: { intent, user_query, inferred_topics, confidence }
```

#### Domain Router (`llm/domainRouter.ts`)
Maps intent to data domains and time ranges:
```typescript
const domains = await routeDomains(intent);
// Returns: { domains: ["nft_activity", "wallet_flows"], suggested_time_range: "30d" }
```

#### Chart Generator (`llm/chartGenerator.ts`)
Generates chart configurations from intent and data sources:
```typescript
const charts = await generateChartConfig(intent, dataSources);
// Returns: { charts: [...], layout, explanations_required }
```

### Fetchers

Modular data source fetchers implementing:
- Error handling
- Retry logic
- Type-safe responses
- Environment variable validation

#### All 8 Data Sources Implemented
- **Helius** (26 metrics): NFT metadata, wallet data, transactions, program interactions, DAS API
- **Jupiter** (6 metrics): Token prices, swaps, liquidity, price impact
- **Magic Eden** (6 metrics): NFT market activity, floor prices, listings, trades, activities
- **DeFiLlama** (8 metrics): Protocol TVL, historical TVL, stablecoins, rankings
- **Messari** (10 metrics): Market cap, yields, revenue, sentiment, news
- **Pyth** (8 metrics): Price feeds, historical prices, SOL/BTC/ETH prices
- **Solscan** (3 metrics): Account info, transactions, chain info
- **SolanaFM** (6 metrics): On-chain data, transactions, transfers, account tags, blocks

**Total: 73 metrics across 7 domains**

### Metrics Registry

JSON file defining available metrics with:
- Domain mapping
- Data source
- Endpoint configuration
- Expected schema

## API Integration

The `/app/api/research` route orchestrates the entire flow:

1. **Parse intent** → Understand what user wants
2. **Route domains** → Determine which data domains to query
3. **Generate fetch plan** → Based on metrics registry
4. **Generate charts** → Visual configuration
5. **Cache & return** → Complete research plan

```typescript
POST /api/research
{
  "query": "Analyze Solana NFT whale behavior"
}

Response: ResearchResponse {
  intent_interpretation,
  domain_selection,
  data_fetch_plan,
  chart_config
}
```

## Usage Example

```typescript
import { parseIntent } from '@/app/lib/llm/intentParser';
import { routeDomains } from '@/app/lib/llm/domainRouter';
import { cache, withCache } from '@/app/lib/cache';

// Parse user query
const intent = await parseIntent("Show me NFT floor price trends");

// Route to domains
const domains = await routeDomains(intent);

// Use cache helper
const data = await withCache(
  { key: 'cache-key', ttl: 300, tags: ['nft'] },
  async () => {
    // Fetch data
    return await fetchData();
  }
);
```

## Architecture Principles

1. **No Mocks**: Production-ready code for real API integration
2. **Type Safety**: Full TypeScript interfaces
3. **Modular Fetchers**: Easily swap data sources
4. **LLM-Driven**: Dynamic intent parsing and chart generation
5. **Caching**: Built-in cache for performance
6. **Error Handling**: Retry logic, error types, validation

## Metrics Coverage

**73 Metrics** across **7 Domains**:
- `nft_activity`: 13 metrics (floor prices, volumes, listings, mints)
- `wallet_flows`: 13 metrics (balances, transactions, whale behavior, growth)
- `token_analysis`: 10 metrics (prices, volumes, market cap, supply)
- `defi_activity`: 13 metrics (TVL, yields, liquidity, stablecoins)
- `protocol_metrics`: 12 metrics (users, transactions, fees, interactions)
- `market_data`: 10 metrics (prices, volumes, sentiment, oracles)
- `research`: 2 metrics (advanced research)

**All 8 Data Sources** fully integrated with production-ready fetchers.

