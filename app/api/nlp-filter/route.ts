import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'

export async function POST(request: Request) {
  try {
    const { command } = await request.json()
    
    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: `Parse this filter command and return ONLY valid JSON (no other text).

Command: "${command}"

Return this exact JSON structure:
{
  "filter": {
    "type": "date" | "token" | "wallet" | "amount" | "custom",
    "label": "string",
    "value": "string",
    "options": ["array of options for dropdown"],
    "icon": "emoji for icon"
  }
}

Examples:
- "show data from last week" → {"filter": {"type": "date", "label": "Date Range", "value": "Last 7 days", "options": ["Today", "Yesterday", "Last 7 days", "Last 30 days", "All Time"], "icon": "📅"}}
- "filter by SOL" → {"filter": {"type": "token", "label": "Token", "value": "SOL", "options": ["All Tokens", "SOL", "USDC", "USDT", "BTC", "ETH"], "icon": "🪙"}}
- "wallets with over 500 SOL" → {"filter": {"type": "amount", "label": "Amount", "value": "Over 500 SOL", "options": ["All Amounts", "Under 10 SOL", "10-100 SOL", "100-1000 SOL", "Over 1000 SOL"], "icon": "💰"}}

Parse this command:`,
      temperature: 0.1,
      maxTokens: 200
    })
    
    // Clean the response (remove markdown code blocks if present)
    let cleanedText = text.trim()
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/```\n?/g, '').trim()
    }
    
    const result = JSON.parse(cleanedText)
    return Response.json(result)
  } catch (error) {
    console.error('Error parsing filter with AI:', error)
    return Response.json(
      { error: 'Failed to parse filter command' },
      { status: 500 }
    )
  }
}
