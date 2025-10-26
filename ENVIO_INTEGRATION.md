# Envio Integration Guide

## Overview

SolSight uses **Envio** to index and stream on-chain data for NFT whale analytics. Envio provides two powerful features we leverage:

1. **HyperIndex** - Historical data indexing and querying
2. **HyperSync** - Real-time WebSocket streaming

---

## Architecture

```
┌─────────────────┐
│  Neon EVM Chain │
│  (NFT Contract) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Envio Indexer  │
│  (Neon Mainnet) │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌─────────┐ ┌──────────┐
│HyperIndex│ │HyperSync │
│ (GraphQL)│ │(WebSocket)│
└─────────┘ └──────────┘
```

---

## What We Use

### ✅ HyperIndex (Currently Implemented)

**Purpose**: Query historical NFT transfer data

**Implementation**: `app/lib/envio-client-simple.ts`

```typescript
// Fetch historical NFT transfers
export async function fetchNFTTransfers(limit: number = 50): Promise<NFTTransfer[]>
```

**How It Works**:
1. Sends GraphQL query to Envio endpoint
2. Retrieves NFT transfers from indexer
3. Returns structured transfer data (id, from, to, tokenId)

**Used In**: 
- `app/hooks/useWhaleData.ts` - Data fetching hook
- Dashboard displays historical transfer data
- AI alerts and reports use this data for analysis

**Example Query**:
```graphql
query {
  NeonEVMPointsNFT_Transfer {
    id
    from
    to
    tokenId
  }
}
```

---

### ⚠️ HyperSync (Available But Not Currently Active)

**Purpose**: Real-time WebSocket streaming of new transfers

**Implementation**: `app/lib/envio-client-simple.ts`

```typescript
// Subscribe to real-time NFT transfers
export function subscribeToNFTTransfers(
  callback: (transfer: NFTTransfer) => void
): () => void
```

**How It Works**:
1. Opens WebSocket connection to HyperSync endpoint
2. Subscribes to Transfer events
3. Receives real-time updates as they happen on-chain
4. Calls callback function with each new transfer

**Status**: Code is implemented but not currently used in the dashboard

**To Enable**: Add WebSocket subscription in dashboard component

---

## Configuration

### Environment Variables

```env
# Envio GraphQL Endpoint (HyperIndex)
NEXT_PUBLIC_ENVIO_GRAPHQL_ENDPOINT=http://localhost:8080/v1/graphql

# Envio HyperSync Endpoint (Real-time streaming)
NEXT_PUBLIC_ENVIO_HYPERSYNC_ENDPOINT=https://neon-evm.hypersync.xyz
```

### Local Development

If running Envio indexer locally on Neon Mainnet:

```bash
# Deploy indexer (done in WSL/terminal)
cd solana-nft-indexer
npx envio indexer update

# Start indexer
npx envio node start

# GraphQL available at: http://localhost:8080/v1/graphql
# WebSocket available at: http://localhost:8081
```

---

## Current Implementation

### Data Flow

```
1. Dashboard loads
   ↓
2. useWhaleData hook fetches data
   ↓
3. Calls fetchNFTTransfers() via HyperIndex
   ↓
4. Envio returns historical transfers
   ↓
5. Data combined with Pyth SOL price
   ↓
6. Unified whaleData passed to AI endpoints
   ↓
7. AI generates alerts and reports
```

### Used Components

- **Envio Client**: `app/lib/envio-client-simple.ts`
- **Data Hook**: `app/hooks/useWhaleData.ts`
- **Dashboard**: `app/dashboard/[id]/page.tsx`
- **Alerts**: `app/dashboard/[id]/alerts/page.tsx`
- **Reports**: `app/dashboard/[id]/reports/page.tsx`

---

## API Data Structure

### NFTTransfer Interface

```typescript
interface NFTTransfer {
  id: string          // Unique transfer ID
  from: string        // Sender address (Ethereum format: 0x...)
  to: string          // Receiver address (Ethereum format: 0x...)
  tokenId: string     // NFT token ID
}
```

### Example Response

```json
{
  "data": {
    "NeonEVMPointsNFT_Transfer": [
      {
        "id": "0x123...",
        "from": "0xabc...",
        "to": "0xdef...",
        "tokenId": "42"
      }
    ]
  }
}
```

---

## Indexer Configuration

### Schema (`solana-nft-indexer/schema.graphql`)

```graphql
type NeonEVMPointsNFT_Transfer {
  id: ID!
  from: String!
  to: String!
  tokenId: BigInt!
}
```

### Config (`solana-nft-indexer/config.yaml`)

```yaml
networks:
  - id: 245022934  # Neon Mainnet (EVM on Solana)
    rpc: https://neon-proxy-mainnet.solana.p2p.org
    start_block: 280318744
    contracts:
      - name: NeonEVMPointsNFT
        address: 0x599329D5838d505f1ff39955D544a7d696C6bdD0
        handler: src/EventHandlers.ts
        events:
          - event: Transfer(address indexed from, address indexed to, uint256 indexed tokenId)
```

### Event Handler (`solana-nft-indexer/src/EventHandlers.ts`)

```typescript
NeonEVMPointsNFT.Transfer.handler(async ({ event, context }) => {
  context.NeonEVMPointsNFT_Transfer.set({
    id: event.transactionHash + "-" + event.logIndex,
    from: event.params.from.toString(),
    to: event.params.to.toString(),
    tokenId: event.params.tokenId,
  });
});
```

---

## HyperSync Setup (Future Enhancement)

To enable real-time updates in the dashboard:

```typescript
// In dashboard component
useEffect(() => {
  const unsubscribe = subscribeToNFTTransfers((transfer) => {
    console.log('New transfer:', transfer)
    // Update dashboard with real-time data
  })
  
  return () => unsubscribe() // Cleanup on unmount
}, [])
```

---

## Troubleshooting

### GraphQL Query Errors

**Error**: `field 'transfers' not found`
**Solution**: Use `NeonEVMPointsNFT_Transfer` (exact schema field name)

### Address Format Issues

**Issue**: Envio returns Ethereum addresses (0x...), but Helius expects Solana addresses
**Solution**: We skip Helius wallet lookups and create mock wallets from Envio data

### Connection Issues

**Error**: Cannot connect to Envio endpoint
**Solution**: 
1. Check if indexer is running (`npx envio node status`)
2. Verify endpoint in `.env.local`
3. For local dev, ensure indexer is deployed and synced

---

## Summary

- **HyperIndex**: ✅ Active - Used for historical NFT transfer queries
- **HyperSync**: ⚠️ Available - Real-time streaming not yet integrated in UI
- **Network**: Neon Mainnet (EVM on Solana)
- **Contract**: NeonEVMPointsNFT (0x599329D5838d505f1ff39955D544a7d696C6bdD0)
- **Data**: NFT transfers indexed and queryable via GraphQL
