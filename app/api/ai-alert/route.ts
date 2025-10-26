import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { dashboardData, userCommand } = await request.json()

    const result = await generateText({
      model: openai('gpt-4o-mini'),
      system: `You are an AI alert generation system for Solana analytics dashboards. 
Generate relevant alerts based on the dashboard configuration, data patterns, and user intent.

Return ONLY a JSON object with this structure:
{
  "alert": {
    "title": "Alert title",
    "severity": "high" | "medium" | "low",
    "type": "pattern" | "anomaly" | "threshold" | "trend",
    "description": "Detailed description of the alert",
    "condition": "Specific condition that triggered this alert",
    "recommendation": "Recommended action or insight",
    "timestamp": "ISO timestamp"
  }
}

Generate realistic, context-aware alerts.`,
      prompt: `Dashboard Name: ${dashboardData.name}
Dashboard Focus: ${dashboardData.config?.researchFocus || 'General Analytics'}
Charts: ${dashboardData.config?.charts?.length || 0}
Stats: ${dashboardData.config?.stats?.length || 0}

Generate an alert for this dashboard. ${
        userCommand ? `User request: ${userCommand}` : 'Generate a relevant alert based on the dashboard.'
      }`,
    })

    // Parse the response with robust error handling
    let alertJson
    try {
      alertJson = JSON.parse(result.text)
    } catch (parseError) {
      // Try to extract JSON from markdown code blocks
      let jsonStr = result.text.trim()
      
      // Remove markdown code block markers
      jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '')
      
      // Try to find and extract JSON object
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        jsonStr = jsonMatch[0]
        alertJson = JSON.parse(jsonStr)
      } else {
        throw new Error('Failed to extract JSON from response')
      }
    }
    
    return NextResponse.json({ alert: alertJson.alert })
  } catch (error: any) {
    console.error('Error generating alert:', error)
    console.error('Error details:', error.message)
    return NextResponse.json(
      { error: 'Failed to generate alert' },
      { status: 500 }
    )
  }
}
