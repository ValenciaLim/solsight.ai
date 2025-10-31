/**
 * Helius API Client for Solana NFT and Wallet Data
 * 
 * Current APIs Being Used:
 * 1. REST API - /addresses/{address}/balances (Token balances endpoint)
 *    - Get SOL balance, token holdings, portfolio data
 *    - Perfect for whale wallet detection
 * 
 * 2. DAS API (Digital Asset Standard) - Get NFTs by owner
 *    - Fetch NFT metadata and collection information
 * 
 * 3. Enhanced Transactions API - Get transaction history
 *    - Track whale transaction patterns
 * 
 * 4. Price API - Get token prices
 *    - Fetch SOL and token prices for portfolio valuation
 * 
 * Additional APIs Available but Not Yet Used:
 * - Webhooks - Real-time notifications for transfers
 * - RPC Methods - For direct blockchain queries
 * - LaserStream gRPC - Ultra-low latency data streaming
 */

const HELIUS_API_KEY = process.env.NEXT_PUBLIC_HELIUS_API_KEY || '';
const HELIUS_BASE_URL = 'https://api.helius.xyz';
const HELIUS_RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

export interface HeliusNFT {
  mint: string;
  name: string;
  collection: string;
  uri?: string;
  image?: string;
  attributes?: Array<{ trait_type: string; value: any }>;
}

export interface WalletPortfolio {
  solBalance: number;
  tokens: any[];
  nftCount?: number;
  totalValueUSD?: number;
}

export interface DASAsset {
  id: string;
  content?: {
    metadata?: {
      name?: string;
      symbol?: string;
    };
    files?: Array<{
      uri?: string;
    }>;
    json_uri?: string;
  };
  grouping?: Array<{
    group_value?: string;
    group_key?: string;
  }>;
  authorities?: Array<{
    address?: string;
    scopes?: string[];
  }>;
  creators?: Array<{
    address?: string;
    share?: number;
  }>;
}

export interface Transaction {
  signature: string;
  type: string;
  source: string;
  fee: number;
  feePayer: string;
  timestamp: number;
  slot: number;
  nativeTransfers?: Array<{
    fromUserAccount?: string;
    toUserAccount?: string;
    amount?: number;
  }>;
  tokenTransfers?: Array<{
    fromUserAccount?: string;
    toUserAccount?: string;
    tokenAmount?: number;
    mint?: string;
  }>;
  accountData?: Array<{
    account?: string;
    nativeBalanceChange?: number;
  }>;
}

/**
 * DAS API: Get assets by owner
 * Endpoint: POST /v1/assets/search
 * Replaces the broken NFTs endpoint with better NFT metadata
 */
export async function getAssetsByOwner(
  ownerAddress: string,
  page: number = 1,
  limit: number = 100
): Promise<DASAsset[]> {
  if (!HELIUS_API_KEY) {
    console.warn('Helius API key not configured');
    return [];
  }

  try {
    const url = `${HELIUS_RPC_URL}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'my-id',
        method: 'searchAssets',
        params: {
          ownerAddress: ownerAddress,
          page: page,
          limit: limit,
        },
      }),
    });

    if (!response.ok) {
      console.error(`Helius DAS API error: ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    
    if (data.result && data.result.items) {
      return data.result.items;
    }

    return [];
  } catch (error) {
    console.error('Error fetching assets by owner:', error);
    return [];
  }
}

/**
 * REST API: Fetch NFT holdings for a wallet (legacy - keeping for compatibility)
 * Endpoint: /v0/addresses/{address}/nfts
 * Note: Currently returns 500 error from Helius side
 * Now uses DAS API as fallback
 */
export async function fetchWalletNFTs(walletAddress: string): Promise<HeliusNFT[]> {
  if (!HELIUS_API_KEY) {
    console.error('Helius API key not configured');
    return [];
  }

  try {
    const url = `${HELIUS_BASE_URL}/v0/addresses/${walletAddress}/nfts?api-key=${HELIUS_API_KEY}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        return data.map((item: any) => ({
          mint: item.id,
          name: item.content?.metadata?.name || 'Unknown',
          collection: item.grouping?.[0]?.group_value || 'Unknown',
          uri: item.content?.metadata?.uri,
          image: item.content?.files?.[0]?.uri,
          attributes: item.content?.metadata?.attributes || [],
        }));
      }
    }

    // Fallback to DAS API
    console.log('Legacy NFTs endpoint failed, trying DAS API...');
    const assets = await getAssetsByOwner(walletAddress, 1, 100);
    
    if (assets.length > 0) {
      return assets.map((asset) => ({
        mint: asset.id,
        name: asset.content?.metadata?.name || 'Unknown',
        collection: asset.grouping?.[0]?.group_value || 'Unknown',
        uri: asset.content?.json_uri,
        image: asset.content?.files?.[0]?.uri,
        attributes: [],
      }));
    }

    return [];
  } catch (error) {
    console.error('Error fetching wallet NFTs from Helius:', error);
    return [];
  }
}

/**
 * REST API: Get token balances for a wallet
 * Endpoint: /v0/addresses/{address}/balances
 * Status: ✅ Working perfectly
 */
export async function fetchTokenBalances(walletAddress: string): Promise<any[]> {
  if (!HELIUS_API_KEY) {
    console.warn('Helius API key not configured');
    return [];
  }

  try {
    const url = `${HELIUS_BASE_URL}/v0/addresses/${walletAddress}/balances?api-key=${HELIUS_API_KEY}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      console.error(`Helius balances API error: ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    return data.tokens || [];
  } catch (error) {
    console.error('Error fetching token balances:', error);
    return [];
  }
}

/**
 * REST API: Fetch wallet portfolio data (enhanced for whale analytics)
 * Endpoint: /v0/addresses/{address}/balances
 * Status: ✅ Working perfectly
 * Use Case: Whale wallet detection, portfolio analysis
 */
export async function fetchWalletPortfolio(walletAddress: string): Promise<WalletPortfolio> {
  if (!HELIUS_API_KEY) {
    console.warn('Helius API key not configured');
    return { solBalance: 0, tokens: [] };
  }

  try {
    const url = `${HELIUS_BASE_URL}/v0/addresses/${walletAddress}/balances?api-key=${HELIUS_API_KEY}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      console.error(`Helius portfolio API error: ${response.statusText}`);
      return { solBalance: 0, tokens: [] };
    }

    const data = await response.json();
    return {
      solBalance: data.nativeBalance ? data.nativeBalance / 1e9 : 0,
      tokens: data.tokens || [],
      nftCount: data.tokens?.filter((t: any) => t.nft).length || 0,
    };
  } catch (error) {
    console.error('Error fetching wallet portfolio:', error);
    return { solBalance: 0, tokens: [] };
  }
}

/**
 * Enhanced Transactions API: Get transaction history
 * Endpoint: POST /v0/addresses/{address}/transaction-history
 * Use Case: Track whale transaction patterns
 * Note: May require paid Helius tier
 */
export async function fetchTransactionHistory(
  address: string,
  limit: number = 100
): Promise<Transaction[]> {
  if (!HELIUS_API_KEY) {
    console.warn('Helius API key not configured');
    return [];
  }

  try {
    // Try the enhanced transactions endpoint
    const url = `${HELIUS_BASE_URL}/v0/addresses/${address}/transaction-history?api-key=${HELIUS_API_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        limit: limit,
        type: 'ALL',
      }),
    });

    // If enhanced endpoint fails, fall back to RPC
    if (!response.ok || response.status === 404) {
      console.warn('Enhanced transactions API not available, using RPC fallback');
      return await fetchTransactionHistoryRPC(address, limit);
    }

    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    return [];
  }
}

/**
 * RPC fallback for transaction history
 * Uses getSignaturesForAddress + getTransaction
 */
async function fetchTransactionHistoryRPC(
  address: string,
  limit: number = 100
): Promise<Transaction[]> {
  try {
    const url = `${HELIUS_RPC_URL}`;
    
    // Get transaction signatures
    const sigsResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'my-id',
        method: 'getSignaturesForAddress',
        params: [address, { limit }],
      }),
    });

    const sigsData = await sigsResponse.json();
    
    if (!sigsData.result || !Array.isArray(sigsData.result)) {
      return [];
    }

    // Get transaction details for first few signatures (to avoid too many RPC calls)
    const signatures = sigsData.result.slice(0, 10).map((sig: any) => sig.signature);
    
    const transactionPromises = signatures.map((signature: string) => {
      return fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: signature,
          method: 'getTransaction',
          params: [signature, { maxSupportedTransactionVersion: 0 }],
        }),
      }).then(r => r.json());
    });

    const transactions = await Promise.all(transactionPromises);
    
    // Map to our Transaction interface
    return transactions
      .filter(tx => tx.result)
      .map(tx => ({
        signature: tx.id,
        type: 'UNKNOWN',
        source: 'RPC',
        fee: tx.result.meta?.fee || 0,
        feePayer: '',
        timestamp: Date.now() / 1000,
        slot: tx.result.slot || 0,
        nativeTransfers: tx.result.meta?.postBalances?.map((bal: number, i: number) => ({
          fromUserAccount: address,
          toUserAccount: address,
          amount: bal - (tx.result.meta?.preBalances?.[i] || 0),
        })) || [],
      }));
  } catch (error) {
    console.error('Error fetching transaction history via RPC:', error);
    return [];
  }
}

/**
 * Analyze whale behavior from transaction history
 * Useful for identifying NFT trading patterns, swaps, etc.
 */
export async function analyzeWhaleBehavior(
  address: string,
  limit: number = 100
): Promise<{
  totalTransactions: number;
  nftTransfers: number;
  swaps: number;
  nativeTransfers: number;
  topCollections: { [key: string]: number };
}> {
  const transactions = await fetchTransactionHistory(address, limit);
  
  const analysis = {
    totalTransactions: transactions.length,
    nftTransfers: 0,
    swaps: 0,
    nativeTransfers: 0,
    topCollections: {} as { [key: string]: number },
  };

  transactions.forEach((tx) => {
    // Count transaction types
    if (tx.type === 'NFT_TRANSFER' || tx.type.includes('NFT')) {
      analysis.nftTransfers++;
    }
    if (tx.type === 'JUPITER_SWAP' || tx.type === 'SWAP' || tx.type.includes('SWAP')) {
      analysis.swaps++;
    }
    if (tx.nativeTransfers && tx.nativeTransfers.length > 0) {
      analysis.nativeTransfers += tx.nativeTransfers.length;
    }

    // Analyze token transfers for collection patterns
    if (tx.tokenTransfers) {
      tx.tokenTransfers.forEach((transfer) => {
        // This is simplified - you'd need to look up collection data
        const collection = transfer.mint?.substring(0, 8) || 'unknown';
        analysis.topCollections[collection] = (analysis.topCollections[collection] || 0) + 1;
      });
    }
  });

  return analysis;
}

/**
 * Price API: Get token prices
 * Endpoint: /v0/token-metadata
 * Use Case: Portfolio valuation, price tracking
 */
export async function fetchTokenPrices(tokens: string[]): Promise<{ [key: string]: number }> {
  if (!HELIUS_API_KEY) {
    console.warn('Helius API key not configured');
    return {};
  }

  try {
    const url = `${HELIUS_BASE_URL}/v0/token-metadata?api-key=${HELIUS_API_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mintAccounts: tokens,
        includeOffChain: true,
        disableCache: false,
      }),
    });

    if (!response.ok) {
      console.error(`Helius price API error: ${response.statusText}`);
      return {};
    }

    const data = await response.json();
    const prices: { [key: string]: number } = {};
    
    if (Array.isArray(data)) {
      data.forEach((token: any) => {
        if (token.mint && token.offChainMetadata?.symbol) {
          // Use off-chain metadata for price if available
          prices[token.mint] = token.offChainMetadata?.price || 0;
        }
      });
    }

    return prices;
  } catch (error) {
    console.error('Error fetching token prices:', error);
    return {};
  }
}

/**
 * Get SOL price (simplified - in production, use a dedicated price API)
 */
export async function fetchSOLPrice(): Promise<number> {
  try {
    // Use a simple price API as fallback
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
    const data = await response.json();
    return data.solana?.usd || 100; // Default to $100 if API fails
  } catch (error) {
    console.error('Error fetching SOL price:', error);
    return 100; // Default fallback price
  }
}

/**
 * Get programs interacted by a wallet
 */
export async function getWalletProgramInteractions(
  walletAddress: string,
  limit: number = 100
): Promise<Array<{ programId: string; signature: string; timestamp: number }>> {
  if (!HELIUS_API_KEY) {
    console.warn('Helius API key not configured');
    return [];
  }

  try {
    const url = `${HELIUS_BASE_URL}/v0/addresses/${walletAddress}/transaction-history?api-key=${HELIUS_API_KEY}&limit=${limit}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Helius transaction history error: ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    const programs = new Map<string, { programId: string; signature: string; timestamp: number }>();
    
    if (data && data.length > 0) {
      data.forEach((tx: any) => {
        if (tx.feePayer === walletAddress && tx.signature) {
          // Extract program interactions from transaction
          tx.nativeTransfers?.forEach((transfer: any) => {
            if (transfer.toUserAccount) {
              programs.set(transfer.toUserAccount, {
                programId: transfer.toUserAccount,
                signature: tx.signature,
                timestamp: tx.timestamp,
              });
            }
          });
        }
      });
    }

    return Array.from(programs.values());
  } catch (error) {
    console.error('Error fetching program interactions:', error);
    return [];
  }
}

/**
 * Get NFT collection metadata
 */
export async function getCollectionMetadata(
  collectionId: string
): Promise<{ name: string; symbol: string; description: string; image: string } | null> {
  if (!HELIUS_API_KEY) {
    console.warn('Helius API key not configured');
    return null;
  }

  try {
    const url = `${HELIUS_BASE_URL}/v0/collections/${collectionId}?api-key=${HELIUS_API_KEY}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Helius collection error: ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    return {
      name: data.name || 'Unknown',
      symbol: data.symbol || 'UNK',
      description: data.description || '',
      image: data.image || '',
    };
  } catch (error) {
    console.error('Error fetching collection metadata:', error);
    return null;
  }
}

/**
 * Get mint count for a collection (placeholder)
 */
export async function getCollectionMintCount(collectionId: string): Promise<number> {
  console.warn('Collection mint count not yet implemented');
  return 0;
}

// Removed mock data fallback - all functions now return empty arrays or errors 