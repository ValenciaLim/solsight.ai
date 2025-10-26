# Setting Up Envio with Neon Mainnet

## Issue
Ethereum works with template, but Neon (network ID: 245022934) requires **Contract Import** approach.

## Why Template Doesn't Work for Neon
- Templates use built-in contracts for **specific networks** (Ethereum, Polygon, etc.)
- Neon's network ID (245022934) is not in Envio's default supported networks list
- Templates validate network compatibility at initialization

## Solution: Use Contract Import

### Step 1: Re-initialize with Contract Import
```bash
cd envio-indexer/solana-nft-indexer
rm -rf src/ generated/ config.yaml schema.graphql
envio init
```

When prompted:
1. **Name**: `solana-nft-whale-indexer`
2. **Initialization**: Choose **`Contract Import`** (NOT Template)
3. **Network**: Enter custom network
   - Network ID: `245022934`
   - Network Name: `Neon Mainnet`
   - RPC URL: `https://neon-mainnet.g.alchemy.com/v2/your-key`
4. **Contract Address**: Your NFT contract address on Neon
5. **Contract Type**: ERC721 or ERC1155

### Step 2: Custom Network Configuration

After initialization, edit `config.yaml`:

```yaml
networks:
  - id: 245022934  # Neon Mainnet
    start_block: <your_start_block>
    rpc_url: "https://neon-mainnet.g.alchemy.com/v2/your-key"
    contracts:
      - name: YourContract
        address: "0x..."  # Your NFT contract on Neon
        handler: src/EventHandlers.ts
        events:
          - event: "Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
```

### Step 3: Update Schema (if needed)

Your `schema.graphql` will be auto-generated based on your contract.

### Step 4: Update Event Handlers

The generated handlers will be contract-specific.

## Alternative: Use Template on Ethereum, Then Migrate

1. Get your indexer working on Ethereum with template
2. Test and verify it's working
3. Later, switch network ID to Neon
4. Update RPC URL to Neon endpoint
5. Deploy

## Recommended Approach for NFT Whale Analytics

Since you're doing NFT whale analytics:
1. Use the template approach with standard NFT contracts (like OpenSea's registry) on Ethereum
2. Once working, adapt it for Neon
3. Or, use **Helius Enhanced Webhooks** for Solana-native NFT tracking

## Next Steps

Choose one:
1. **Try Contract Import** for Neon (more complex, but direct)
2. **Use Template on Ethereum** first (easier, then adapt)
3. **Use Helius** for Solana native indexing (recommended for Solana NFTs)
