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
        "label": "Stat label",
        "value": 12345,
        "icon": "TrendingUp" | "DollarSign" | "Users" | "BarChart3" | "Wallet" | "Target" | "Zap" | "Activity"
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

Generate 3-5 stats (KPIs) and 3-6 charts based on the user's request. Include mock data for charts. Be creative and comprehensive.`,
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
