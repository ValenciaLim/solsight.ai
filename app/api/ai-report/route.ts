import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { dashboardData, whaleData } = await request.json()

    // Build a summary of dashboard components
    const statsSummary = dashboardData?.config?.stats?.map((s: any) => `- ${s.label}: ${s.value}`).join('\n') || ''
    const chartsSummary = dashboardData?.config?.charts?.map((c: any) => `- ${c.title} (${c.type}): ${JSON.stringify(c.data).substring(0, 100)}`).join('\n') || ''
    
    const result = await generateText({
      model: openai('gpt-4o-mini'),
      system: `You are an AI research report generator for Solana analytics dashboards.
Generate a complete, professional research report based on the dashboard configuration.

Available Data:
- Data: ${JSON.stringify(whaleData)}

Return ONLY a JSON object with this structure:
{
  "report": {
    "title": "Report title",
    "introduction": "Overview of research focus and purpose",
    "executiveSummary": "Brief 2-3 sentence summary",
    "findings": [
      {
        "heading": "Finding heading",
        "content": "Detailed finding description",
        "chartReferences": ["Chart title 1", "Chart title 2"]
      }
    ],
    "insights": [
      {
        "insight": "AI-generated insight",
        "supportingData": "Relevant metric or data point"
      }
    ],
    "conclusion": "Summary of findings and recommendations",
    "timestamp": "ISO timestamp"
  }
}

Generate comprehensive, research-quality content.`,
      prompt: `Generate a research report for this dashboard:

Dashboard Name: ${dashboardData?.name || 'Untitled Dashboard'}
Dashboard Focus: ${dashboardData?.config?.researchFocus || 'General Analytics'}
Dashboard Use Case: ${dashboardData?.config?.useCase || 'Portfolio Analysis'}

Key Metrics:
${statsSummary}

Charts:
${chartsSummary}

Generate a complete research report with findings, insights, and conclusions.`,
    })

    // Try to parse JSON with fallback for markdown code blocks
    let reportJson
    try {
      // Try to extract JSON from markdown code blocks if present
      let jsonText = result.text
      const jsonMatch = result.text.match(/```json\n([\s\S]*?)\n```/) || result.text.match(/```([\s\S]*?)```/)
      if (jsonMatch) {
        jsonText = jsonMatch[1]
      }
      reportJson = JSON.parse(jsonText)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      console.error('Raw response:', result.text)
      // Return a fallback report structure
      return NextResponse.json({
        error: 'Failed to parse AI response as valid JSON'
      }, { status: 500 })
    }
    
    // Include chart data in the response for PDF generation
    return NextResponse.json({ 
      report: reportJson.report,
      chartData: dashboardData?.config?.charts || []
    })
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}
