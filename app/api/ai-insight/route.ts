import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'

export async function POST(request: Request) {
  try {
    const { chartType, chartTitle, data } = await request.json()
    
    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: `Analyze this ${chartType} chart titled "${chartTitle}" with data: ${JSON.stringify(data)}. 
      Provide a brief insight (2-3 sentences) covering: trends, anomalies, or key metrics. Be concise.`
    })
    
    return Response.json({ insight: text })
  } catch (error) {
    console.error('Error generating insight:', error)
    return Response.json(
      { error: 'Failed to generate insight' },
      { status: 500 }
    )
  }
}
