import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'

export const maxDuration = 30

export async function POST(req: Request) {
  const { templateType, userType } = await req.json()

  if (!templateType || !userType) {
    return new Response(JSON.stringify({ error: 'templateType and userType are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const systemPrompt = `You are a research dashboard configuration assistant for Solana blockchain analytics. 
Generate a comprehensive dashboard template based on the requested research type.

Return ONLY valid JSON with this structure:
{
  "name": "Template name",
  "description": "Template description",
  "category": "individual" | "enterprise",
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
  "researchFocus": "Brief description of research focus",
  "useCase": "Specific use case description"
}

Template types:
- "nft-whale-behavior" → Research NFT whale transactions, accumulation patterns, floor price movements
- "defi-protocol-analysis" → Research DeFi protocol performance, yield opportunities, risk assessment
- "wallet-risk-profiling" → Research wallet behaviors, risk indicators, transaction patterns
- "regulatory-oversight" → Enterprise: Compliance monitoring, suspicious activity detection
- "whale-market-dynamics" → Enterprise: Large holder movements, market impact analysis
- "dao-treasury-monitor" → Enterprise: DAO treasury management, fund allocation tracking

Be creative and comprehensive. Generate 3-5 relevant charts per template.`

    const userPrompts: Record<string, string> = {
      'nft-whale-behavior': 'Generate a dashboard template for researching NFT whale behavior, including accumulation patterns, floor price trends, and large transaction analysis.',
      'defi-protocol-analysis': 'Generate a dashboard template for DeFi protocol research, including yield analysis, TVL trends, and protocol comparison metrics.',
      'wallet-risk-profiling': 'Generate a dashboard template for wallet risk assessment, including transaction patterns, risk scoring, and anomaly detection.',
      'regulatory-oversight': 'Generate an enterprise dashboard template for regulatory compliance, including transaction monitoring, risk indicators, and audit trails.',
      'whale-market-dynamics': 'Generate an enterprise dashboard template for whale market analysis, including large holder movements and market impact metrics.',
      'dao-treasury-monitor': 'Generate an enterprise dashboard template for DAO treasury management, including fund allocation, spending patterns, and treasury health metrics.'
    }

    const result = await generateText({
      model: openai('gpt-4o-mini'),
      system: systemPrompt,
      prompt: userPrompts[templateType] || `Generate a dashboard template for ${templateType}`,
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
      error: 'Failed to generate template',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
