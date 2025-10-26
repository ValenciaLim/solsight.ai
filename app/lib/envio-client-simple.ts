/**
 * Simple Envio GraphQL Client for NFT Whale Analytics
 */

const ENVIO_GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_ENVIO_GRAPHQL_ENDPOINT 
  || 'http://localhost:8080/v1/graphql';

const ENVIO_HYPERSYNC_ENDPOINT = process.env.NEXT_PUBLIC_ENVIO_HYPERSYNC_ENDPOINT
  || 'https://neon-evm.hypersync.xyz';

export interface NFTTransfer {
  id: string;
  from: string;
  to: string;
  tokenId: string;
}

export interface TransferQuery {
  NeonEVMPointsNFT_Transfer: {
    id: string;
    from: string;
    to: string;
    tokenId: string;
  }[];
}

/**
 * Fetch recent NFT transfers
 */
export async function fetchNFTTransfers(limit: number = 50): Promise<NFTTransfer[]> {
  const query = `
    query {
      NeonEVMPointsNFT_Transfer {
        id
        from
        to
        tokenId
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
      return [];
    }

    const transfers: NFTTransfer[] = (data.data?.NeonEVMPointsNFT_Transfer || []).map((t: any) => ({
      id: t.id,
      from: t.from,
      to: t.to,
      tokenId: t.tokenId.toString(),
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
      transferCount: NeonEVMPointsNFT_Transfer_aggregate {
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
            from: transfer.from,
            to: transfer.to,
            tokenId: transfer.tokenId,
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
