import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { command, reportTitle, reportContent } = await req.json()

    if (!command) {
      return new Response(JSON.stringify({ error: 'Command is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Generate modified report using AI
    const result = await generateText({
      model: openai('gpt-4o-mini'),
      system: `You are an AI assistant that modifies research reports based on natural language commands.

When a user provides a command to modify a report, you should:
1. Parse the command to understand what changes are needed
2. Apply the changes to the existing report sections
3. Return a complete JSON object with all sections (both unchanged and modified)

Return ONLY a JSON object with this structure:
{
  "sections": [
    {
      "type": "title",
      "content": "Report Title"
    },
    {
      "type": "section",
      "heading": "Section Heading",
      "content": "Section content text..."
    }
  ]
}

Important: 
- Include ALL sections, even if unchanged
- Only modify sections as specified in the command
- Maintain the existing structure and format
- Return valid JSON only, no markdown formatting`,
      messages: [
        {
          role: 'user',
          content: `Modify the following report based on this command: "${command}"

Report Title: ${reportTitle || 'Untitled Report'}

Current Report Content:
${reportContent || 'No content provided'}

Return the modified report as a JSON object.`
        }
      ]
    })

    // Parse the response
    let modifiedReport
    try {
      modifiedReport = JSON.parse(result.text)
    } catch (parseError) {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = result.text.match(/```json\n([\s\S]*?)\n```/) || result.text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        modifiedReport = JSON.parse(jsonMatch[0].replace(/```json\n?/, '').replace(/```\n?/, ''))
      } else {
        throw new Error('Failed to parse AI response')
      }
    }

    return new Response(JSON.stringify(modifiedReport), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error in modify-report route:', error)
    return new Response(JSON.stringify({ error: 'Failed to modify report' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
