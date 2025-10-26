// Test script to query Envio GraphQL endpoint
const fetch = require('node-fetch');

async function testEnvio() {
  const graphqlEndpoint = 'http://localhost:8080/v1/graphql';
  
  // Query to get recent transfers
  const query = `
    query {
      transfers(
        first: 10
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
    const response = await fetch(graphqlEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    const data = await response.json();
    
    console.log('✅ Query successful!');
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (data.data && data.data.transfers) {
      console.log(`\n📊 Found ${data.data.transfers.length} transfers`);
    }
  } catch (error) {
    console.error('❌ Error querying Envio:', error.message);
  }
}

testEnvio();
