clea# API Integration Guide

This document outlines how to integrate various data sources for the read-only analytics platform.

## Data Sources

### 1. Helius API
**Purpose**: Enhanced wallet data, transaction parsing, NFT holdings

**Setup**:
```typescript
// Get API key from https://helius.dev
const HELIUS_API_KEY = process.env.NEXT_PUBLIC_HELIUS_API_KEY
const rpcUrl = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`

// Example: Fetch wallet tokens
const response = await fetch(
  `https://api.helius.xyz/v0/addresses/${walletAddress}/balances?api-key=${HELIUS_API_KEY}`
)
const data = await response.json()
```

**Features**:
- Token balances
- NFT holdings
- Transaction history parsing
- WebSocket for real-time updates

### 2. Pyth Network
**Purpose**: Real-time token price feeds

**Setup**:
```typescript
import { PriceServiceConnection } from '@pythnetwork/pyth-evm-js'

const connection = new PriceServiceConnection(
  'https://hermes.pyth.network',
  { priceFeedRequestConfig: { binary: true } }
)

// Fetch SOL price
const priceId = '0x...' // SOL/USD price ID
const priceFeed = connection.getLatestPriceFeeds([priceId])
```

### 3. Jupiter API
**Purpose**: Token prices, swap rates, DeFi positions

**Setup**:
```typescript
// Fetch token prices
const response = await fetch('https://price.jup.ag/v4/price?ids=SOL&ids=USDC')
const prices = await response.json()

// Fetch swap routes
const swapQuote = await fetch(
  `https://quote-api.jup.ag/v6/quote?inputMint=SOL&outputMint=USDC&amount=1000000000`
)
```

### 4. Envio HyperSync
**Purpose**: Real-time blockchain event indexing

**Setup**:
```typescript
// Subscribe to wallet transactions
const ws = new WebSocket('wss://hyperrpc.shyft.to')
ws.on('message', (data) => {
  const event = JSON.parse(data)
  // Handle real-time updates
})
```

## Recommended File Structure

```
app/
├── lib/
│   ├── helius.ts          # Helius API integration
│   ├── pyth.ts            # Pyth price feeds
│   ├── jupiter.ts         # Jupiter swaps & prices
│   └── types.ts           # TypeScript interfaces
├── hooks/
│   ├── useWalletData.ts   # Fetch wallet data
│   ├── usePrices.ts       # Fetch token prices
│   └── useTransactions.ts # Fetch transaction history
```

## Example Integration

```typescript
// app/hooks/useWalletData.ts
import { useWallet } from '@solana/wallet-adapter-react'
import { useState, useEffect } from 'react'

export function useWalletData() {
  const { publicKey } = useWallet()
  const [data, setData] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!publicKey) return

      try {
        // Fetch from Helius
        const balances = await fetchBalances(publicKey)
        const nfts = await fetchNFTs(publicKey)
        const transactions = await fetchTransactions(publicKey)

        setData({
          tokens: balances.tokens,
          nfts: nfts.items,
          transactions: transactions
        })
      } catch (error) {
        console.error('Error fetching wallet data:', error)
      }
    }

    fetchData()
  }, [publicKey])

  return data
}
```

## Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_HELIUS_API_KEY=your_helius_key
NEXT_PUBLIC_PYTH_ENDPOINT=https://hermes.pyth.network
NEXT_PUBLIC_JUPITER_API_KEY=your_jupiter_key
```

## Important Notes

1. **Read-Only**: This platform only fetches data. No transactions are executed.
2. **API Keys**: Get free API keys from:
   - Helius: https://helius.dev
   - Pyth: https://pyth.network
   - Jupiter: https://jup.ag
3. **Rate Limits**: Be mindful of API rate limits in production
4. **Caching**: Consider implementing caching for price data to reduce API calls
