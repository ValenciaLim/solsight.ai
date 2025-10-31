/**
 * Domain Router - Maps intent to data domains and suggests time ranges
 */

import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { DomainSelection, IntentInterpretation } from '../types';
import { extractDomainsFromKeywords, parseTimeRange } from '../utils';

const SYSTEM_PROMPT = `You are a domain routing system for SolSight.ai research engine.

Based on user intent, determine which data domains to query and suggest an appropriate time range.

Return ONLY valid JSON with this structure:
{
  "domains": ["domain1", "domain2"],
  "suggested_time_range": "7d|30d|90d|365d|all"
}

Available domains:
- nft_activity: NFT trading, collections, floor prices, transfers, listings, mints
- defi_activity: DeFi protocols, staking, yields, liquidity pools, TVL
- wallet_flows: Wallet transactions, transfers, balances, whale behavior, growth
- token_analysis: Token prices, volumes, market cap, holders, supply
- protocol_metrics: Protocol-level metrics, active users, DAU, retention, cohorts
- market_data: General market trends, exchanges, price movements, oracles
- research: Custom SQL queries, flexible analysis

Time ranges:
- 7d: Last week
- 30d: Last month (most common)
- 90d: Last 3 months
- 365d: Last year
- all: All available data

Select 1-3 most relevant domains. Default time range is 30d unless user specifies otherwise.`;

export async function routeDomains(
  intent: IntentInterpretation
): Promise<DomainSelection> {
  try {
    const result = await generateText({
      model: openai('gpt-4o-mini'),
      system: SYSTEM_PROMPT,
      prompt: `Intent: ${intent.intent}\nQuery: ${intent.user_query}\nTopics: ${intent.inferred_topics.join(', ')}`,
      temperature: 0.2,
    });

    // Parse JSON from response
    let parsed: DomainSelection;
    try {
      parsed = JSON.parse(result.text);
    } catch {
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse domain selection');
      }
    }

    // Validate
    if (!Array.isArray(parsed.domains) || !parsed.suggested_time_range) {
      throw new Error('Invalid domain selection structure');
    }

    return parsed;
  } catch (error) {
    console.error('Error routing domains:', error);
    
    // Fallback: keyword-based routing
    const domains = extractDomainsFromKeywords(intent.user_query);
    const timeRange = parseTimeRange(intent.user_query);
    
    return {
      domains,
      suggested_time_range: timeRange,
    };
  }
}

