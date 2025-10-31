import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'

export const maxDuration = 30

export async function POST(req: Request) {
  const { command } = await req.json()

  if (!command) {
    return new Response(JSON.stringify({ error: 'Command is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const result = await generateText({
      model: openai('gpt-4o-mini'),
      system: `You are a dashboard configuration assistant. Analyze the user's request and return a complete JSON configuration for their Solana analytics dashboard.

Return ONLY a JSON object with this EXACT structure:
{
  "name": "Dashboard name",
  "config": {
    "stats": [
      {
        "id": "stat-1",
        "label": "Stat label",
        "value": "Loading...", // Placeholder - will be replaced with real data
        "icon": "TrendingUp" | "DollarSign" | "Users" | "BarChart3" | "Wallet" | "Target" | "Zap" | "Activity",
        "metricRef": "wallet_sol_balance", // Reference to metric or fetch plan description
        "change": "+5.2%", // Optional change indicator
        "trend": "up" | "down" | "neutral" // Optional trend
      }
    ],
    "charts": [
      {
        "type": "line" | "bar" | "pie" | "table",
        "title": "Chart title",
        "xKey": "x axis key",
        "yKey": "y axis key",
        "data": [
          { "x": "value1", "y": 123 }
        ]
      }
    ],
    "filters": [],
    "researchFocus": "Brief description",
    "useCase": "use case description",
    "category": "category"
  }
}

Generate 3-5 stats (KPIs) and 3-6 charts based on the user's request.

For stats:
- Set "value" to "Loading..." (will be replaced with real data)
- Include "metricRef" field describing what metric/data to fetch (e.g., "wallet balance", "total TVL", "active wallets", "NFT count")
- Stats will fetch real data automatically, so focus on meaningful labels and metric descriptions

For charts:
- Include mock data for visualization
- Charts will also fetch real data when dashboard loads

Be creative and comprehensive.`,
      prompt: command,
    })

    const responseText = result.text
    
    // Parse the JSON response
    let config
    try {
      config = JSON.parse(responseText)
    } catch (parseError) {
      // If parsing fails, try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        config = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Failed to parse AI response')
      }
    }

    // Ensure config has the required structure
    if (!config.config) {
      config = { name: config.name || 'Custom Dashboard', config }
    }
    
    // Ensure stats and charts exist
    if (!config.config.stats) config.config.stats = []
    if (!config.config.charts) config.config.charts = []
    
    // Ensure all stats have IDs
    config.config.stats = config.config.stats.map((stat: any, index: number) => ({
      ...stat,
      id: stat.id || `stat-${index + 1}`,
      value: stat.value || 'Loading...',
    }))
    
    // Ensure all charts have IDs
    config.config.charts = config.config.charts.map((chart: any, index: number) => ({
      ...chart,
      id: chart.id || `chart-${index + 1}`,
    }))

    return new Response(JSON.stringify(config), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error processing NLP command:', error)
    return new Response(JSON.stringify({ 
      error: 'Failed to process command',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
