/**
 * Chart Generator - Creates chart configurations from data sources
 */

import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { ChartConfigPlan } from '../types';

const SYSTEM_PROMPT = `You are a chart configuration generator for SolSight.ai research engine.

Generate chart configurations based on the research intent and available data.

Return ONLY valid JSON with this structure:
{
  "charts": [
    {
      "id": "unique_id",
      "type": "line|bar|pie|table|area",
      "title": "Chart title",
      "data_source": "DataSourceID",
      "x": "x_axis_key",
      "y": "y_axis_key"
    }
  ],
  "layout": "stacked|side-by-side|grid",
  "explanations_required": true|false
}

Chart types:
- line: Time series, trends over time
- bar: Comparisons, distributions, top-N lists
- pie: Proportions, percentages
- table: Raw data, detailed lists
- area: Cumulative values, stacked trends

Layout:
- stacked: Charts in vertical stack
- side-by-side: Charts arranged in grid
- grid: Multiple charts in responsive grid

Generate 3-6 relevant charts. Each chart should have a clear purpose.
Use descriptive titles and appropriate visualizations for the data.`;

export async function generateChartConfig(
  intent: string,
  dataSources: string[]
): Promise<ChartConfigPlan> {
  try {
    const result = await generateText({
      model: openai('gpt-4o-mini'),
      system: SYSTEM_PROMPT,
      prompt: `Research Intent: ${intent}\nAvailable Data Sources: ${dataSources.join(', ')}\n\nGenerate chart configurations that best visualize this research.`,
      temperature: 0.4,
    });

    // Parse JSON from response
    let parsed: ChartConfigPlan;
    try {
      parsed = JSON.parse(result.text);
    } catch {
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse chart config');
      }
    }

    // Validate
    if (!Array.isArray(parsed.charts)) {
      throw new Error('Invalid chart configuration structure');
    }

    // Set defaults
    parsed.layout = parsed.layout || 'stacked';
    parsed.explanations_required = parsed.explanations_required ?? true;

    return parsed;
  } catch (error) {
    console.error('Error generating chart config:', error);
    
    // Fallback: basic chart config
    return {
      charts: [
        {
          id: 'c1',
          type: 'line',
          title: 'Overview',
          data_source: dataSources[0] || 'default',
        },
      ],
      layout: 'stacked',
      explanations_required: true,
    };
  }
}

/**
 * Generate insights from research results
 */
export async function generateInsights(
  intent: string,
  dataSummary: string
): Promise<{ insights: string[]; confidence: number; suggested_followups: string[] }> {
  try {
    const result = await generateText({
      model: openai('gpt-4o-mini'),
      system: `You are an insights generator for SolSight.ai. Analyze research data and provide:
1. Key insights (2-4 bullet points)
2. Confidence level (0-1)
3. Suggested follow-up questions (2-3 questions)

Return ONLY valid JSON:
{
  "insights": ["insight1", "insight2"],
  "confidence": 0.85,
  "suggested_followups": ["question1", "question2"]
}`,
      prompt: `Intent: ${intent}\nData Summary: ${dataSummary}\n\nGenerate insights.`,
      temperature: 0.5,
    });

    const parsed = JSON.parse(result.text.match(/\{[\s\S]*\}/)?.[0] || '{}');
    
    return {
      insights: parsed.insights || [],
      confidence: parsed.confidence || 0.5,
      suggested_followups: parsed.suggested_followups || [],
    };
  } catch (error) {
    console.error('Error generating insights:', error);
    return {
      insights: ['Unable to generate insights at this time'],
      confidence: 0.3,
      suggested_followups: [],
    };
  }
}

