/**
 * Intent Parser - Uses Vercel AI SDK to parse user queries into structured intent
 */

import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { IntentInterpretation } from '../types';

const SYSTEM_PROMPT = `You are an AI assistant for SolSight.ai, a Solana on-chain research engine.

Your task is to parse user queries and extract structured intent information.

Return ONLY valid JSON with this structure:
{
  "intent": "Brief, clear description of what the user wants to research",
  "user_query": "Original user query",
  "inferred_topics": ["topic1", "topic2", "topic3"],
  "confidence": 0.0-1.0
}

Topics should be relevant to Solana blockchain analysis:
- NFT activity, collections, floor prices
- DeFi protocols, yields, liquidity
- Wallet behavior, flows, whale tracking
- Token analysis, prices, volumes
- Protocol metrics, TVL, active users
- Market trends, sentiment

Be precise and only infer topics that are clearly present in the query.`;

export async function parseIntent(userQuery: string): Promise<IntentInterpretation> {
  try {
    const result = await generateText({
      model: openai('gpt-4o-mini'),
      system: SYSTEM_PROMPT,
      prompt: userQuery,
      temperature: 0.3,
    });

    // Parse JSON from response
    let parsed: IntentInterpretation;
    try {
      parsed = JSON.parse(result.text);
    } catch {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = result.text.match(/```json\s*([\s\S]*?)\s*```/) || 
                       result.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } else {
        throw new Error('Failed to parse AI response as JSON');
      }
    }

    // Validate structure
    if (!parsed.intent || !parsed.user_query || !parsed.inferred_topics || 
        typeof parsed.confidence !== 'number') {
      throw new Error('Invalid intent structure from AI');
    }

    return parsed;
  } catch (error) {
    console.error('Error parsing intent:', error);
    
    // Fallback: simple keyword-based parsing
    return {
      intent: userQuery,
      user_query: userQuery,
      inferred_topics: [],
      confidence: 0.5,
    };
  }
}

