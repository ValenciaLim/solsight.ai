import { openai } from '@ai-sdk/openai'
import { convertToModelMessages, ModelMessage, streamText, UIMessage } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { messages } = body

    // Validate messages
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'No messages provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const result = await streamText({
    model: openai('gpt-4o-mini'),
    system: `You are an AI assistant for a Solana analytics platform. You help users understand their portfolio, create dashboards, and analyze blockchain data.

Key capabilities:
- Create dashboards from natural language commands
- Analyze portfolio composition and performance
- Explain DeFi positions and yields
- Track NFT collections and floor prices
- Monitor wallet transactions and activity
- Provide market insights and trends

When users ask to create dashboards, respond with structured JSON that can be used to generate charts and visualizations.

Example dashboard creation:
User: "Create a dashboard showing my NFT collection"
Response: I'll create a dashboard showing your NFT collection with floor prices, recent sales, and collection performance.

Available data sources:
- Helius API for wallet data and NFT information
- Jupiter API for DeFi positions and price data
- Real-time blockchain data

Always be helpful, accurate, and provide actionable insights about Solana ecosystem data.`,
    messages: convertToModelMessages(messages) as ModelMessage[],
  })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('Error in chat route:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
