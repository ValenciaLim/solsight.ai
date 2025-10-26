import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'

export const maxDuration = 30

export async function POST(req: Request) {
  const { userIntention, userType } = await req.json()

  if (!userIntention || !userType) {
    return new Response(JSON.stringify({ error: 'userIntention and userType are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const systemPrompt = `You are a research dashboard configuration assistant for Solana blockchain analytics. 
Generate 3 comprehensive dashboard templates based on the user's research intention.

 Return ONLY valid JSON with this structure:
 {
   "templates": [
     {
       "id": "unique-id",
       "name": "Template name",
       "description": "Template description",
       "icon": "brief-icon-description",
       "stats": [
         {
           "id": "unique-id",
           "label": "Stat label",
           "value": "Stat value",
           "change": "Optional percentage change",
           "trend": "up" | "down" | "neutral",
           "icon": "Icon name from: Coins, TrendingUp, TrendingDown, Wallet, BarChart3, Target, Activity"
         }
       ],
       "charts": [
         {
           "id": "unique-id",
           "type": "line" | "bar" | "pie" | "table",
           "title": "Chart title",
           "dataSource": "NFT" | "DeFi" | "Portfolio" | "Transactions",
           "metrics": ["metric1", "metric2"],
           "timeframe": "short" | "medium" | "long"
         }
       ],
       "metrics": ["Metric 1", "Metric 2", "Metric 3"],
       "researchFocus": "Brief description",
       "useCase": "Specific use case"
     }
   ]
 }

User type: ${userType}
Generate 3 different templates that align with the user's intention but offer different approaches or focus areas.
Each template should have 3-5 charts. Be creative and comprehensive.`

    const result = await generateText({
      model: openai('gpt-4o-mini'),
      system: systemPrompt,
      prompt: `User intention: ${userIntention}
      
Generate 3 dashboard template options for this research goal.`,
    })

    const responseText = result.text
    console.log('AI Response:', responseText)

    let config
    try {
      config = JSON.parse(responseText)
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          config = JSON.parse(jsonMatch[0])
        } catch (e) {
          throw new Error(`Failed to parse AI response as JSON. Response: ${responseText.substring(0, 200)}`)
        }
      } else {
        throw new Error(`AI did not return valid JSON. Response: ${responseText.substring(0, 200)}`)
      }
    }

    return new Response(JSON.stringify(config), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error processing template generation:', error)
    return new Response(JSON.stringify({ 
      error: 'Failed to generate templates',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
