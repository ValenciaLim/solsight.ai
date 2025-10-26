/**
 * Simple Envio GraphQL Client for NFT Whale Analytics
 */

const ENVIO_GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_ENVIO_GRAPHQL_ENDPOINT 
  || 'http://localhost:8080/v1/graphql';

const ENVIO_HYPERSYNC_ENDPOINT = process.env.NEXT_PUBLIC_ENVIO_HYPERSYNC_ENDPOINT
  || 'https://neon-evm.hypersync.xyz';

export interface NFTTransfer {
  id: string;
  timestamp: number;
  from: string;
  to: string;
  tokenId: string;
  transaction?: {
    hash: string;
    status: string;
  };
}

export interface TransferQuery {
  transfers: {
    id: string;
    timestamp: string;
    from: string;
    to: string;
    tokenId: string;
    transaction: {
      hash: string;
      status: string;
    };
  }[];
}

/**
 * Fetch recent NFT transfers
 */
export async function fetchNFTTransfers(limit: number = 50): Promise<NFTTransfer[]> {
  const query = `
    query GetTransfers($limit: Int!) {
      transfers(
        first: $limit
        orderBy: timestamp
        orderDirection: desc
      ) {
        id
        timestamp
        from
        to
        tokenId
        transaction {
          hash
          status
        }
      }
    }
  `;

  try {
    const response = await fetch(ENVIO_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        query, 
        variables: { limit } 
      }),
    });

    const data = await response.json();
    
    if (data.errors) {
      console.error('GraphQL errors:', data.errors);
      return [];
    }

    const transfers: NFTTransfer[] = data.data.transfers.map((t: any) => ({
      id: t.id,
      timestamp: parseInt(t.timestamp),
      from: t.from,
      to: t.to,
      tokenId: t.tokenId,
      transaction: t.transaction,
    }));

    return transfers;
  } catch (error) {
    console.error('Error fetching NFT transfers:', error);
    return [];
  }
}

/**
 * Get transfer statistics
 */
export async function getTransferStats() {
  const query = `
    query GetStats {
      transferCount: transfers_aggregate {
        aggregate {
          count
        }
      }
    }
  `;

  try {
    const response = await fetch(ENVIO_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    const data = await response.json();
    
    if (data.errors) {
      console.error('GraphQL errors:', data.errors);
      return null;
    }

    return {
      totalTransfers: data.data.transferCount.aggregate.count,
    };
  } catch (error) {
    console.error('Error fetching stats:', error);
    return null;
  }
}

/**
 * Subscribe to real-time NFT transfers via HyperSync WebSocket
 * @param callback Function to call when a new transfer is received
 * @returns Function to unsubscribe
 */
export function subscribeToNFTTransfers(
  callback: (transfer: NFTTransfer) => void
): () => void {
  let ws: WebSocket | null = null;
  
  try {
    // Convert HTTPS to WSS for WebSocket connection
    const wsUrl = ENVIO_HYPERSYNC_ENDPOINT.replace('https://', 'wss://').replace('http://', 'ws://');
    
    ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('✅ Connected to HyperSync');
      
      // Subscribe to transfer events
      ws?.send(JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'subscribe',
        params: {
          event: 'Transfer',
        }
      }));
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.params && data.params.result) {
          const transfer = data.params.result;
          callback({
            id: transfer.id || transfer.transaction?.hash,
            timestamp: transfer.timestamp || Date.now(),
            from: transfer.from,
            to: transfer.to,
            tokenId: transfer.tokenId,
            transaction: transfer.transaction,
          });
        }
      } catch (error) {
        console.error('Error parsing HyperSync message:', error);
      }
    };
    
    ws.onerror = (error) => {
      console.error('HyperSync WebSocket error:', error);
    };
    
    ws.onclose = () => {
      console.log('❌ Disconnected from HyperSync');
    };
  } catch (error) {
    console.error('Error connecting to HyperSync:', error);
  }
  
  // Return unsubscribe function
  return () => {
    if (ws) {
      ws.close();
      ws = null;
    }
  };
}
