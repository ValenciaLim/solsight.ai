import { NextRequest, NextResponse } from 'next/server';
import { parseIntent } from '@/app/lib/llm/intentParser';
import { routeDomains } from '@/app/lib/llm/domainRouter';
import { generateChartConfig } from '@/app/lib/llm/chartGenerator';
import { cache } from '@/app/lib/cache';
import { generateCacheKey, timeRangeToTimestamp } from '@/app/lib/utils';
import { DataFetchPlan, MetricRegistryEntry } from '@/app/lib/types';
import metricsRegistry from '@/app/lib/metrics/metrics_registry.json';

export const maxDuration = 30;

/**
 * POST /api/research
 * 
 * Main research API endpoint that orchestrates the entire research flow:
 * 1. Parse user intent
 * 2. Route to domains
 * 3. Generate data fetch plan
 * 4. Generate chart configurations
 * 5. Return complete research plan
 */
export async function POST(req: NextRequest) {
  try {
    const { query, context } = await req.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Step 1: Parse intent
    console.log('📝 Parsing intent for query:', query);
    const intentInterpretation = await parseIntent(query);

    // Check cache
    const cacheKey = generateCacheKey('research', {
      query: intentInterpretation.intent,
      context: context || {},
    });

    const cached = cache.get(cacheKey);
    if (cached) {
      console.log('✅ Returning cached research plan');
      return NextResponse.json(cached);
    }

    // Step 2: Route to domains
    console.log('🗺️ Routing to domains');
    const domainSelection = await routeDomains(intentInterpretation);

    // Step 3: Generate data fetch plan from metrics registry
    console.log('📊 Generating data fetch plan');
    const dataFetchPlan = generateDataFetchPlan(
      domainSelection.domains,
      domainSelection.suggested_time_range
    );

    // Step 4: Generate chart configurations
    console.log('📈 Generating chart configurations');
    const chartConfig = await generateChartConfig(
      intentInterpretation.intent,
      dataFetchPlan.data_fetch_plan.map(item => item.id)
    );

    // Step 5: Combine into complete response
    const researchPlan = {
      intent_interpretation: intentInterpretation,
      domain_selection: domainSelection,
      data_fetch_plan: dataFetchPlan,
      chart_config: chartConfig,
    };

    // Cache for 5 minutes
    cache.set(cacheKey, researchPlan, 300, ['research']);

    console.log('✅ Research plan generated successfully');
    return NextResponse.json(researchPlan);

  } catch (error) {
    console.error('❌ Error generating research plan:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate research plan',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Generate data fetch plan from metrics registry
 */
function generateDataFetchPlan(
  domains: string[],
  timeRange: string
): DataFetchPlan {
  const registry = metricsRegistry as { metrics: MetricRegistryEntry[] };
  const { start, end } = timeRangeToTimestamp(timeRange);

  const plan = registry.metrics
    .filter(metric => domains.includes(metric.domain))
    .map(metric => ({
      id: metric.id,
      domain: metric.domain,
      source: metric.source,
      endpoint: metric.endpoint || '',
      params: {
        ...metric.params,
        ...(start && { start_ts: start }),
        end_ts: end,
      },
      env_vars: getEnvVarsForSource(metric.source),
      expected_schema: generateExpectedSchema(metric),
      notes: `Fetch ${metric.description.toLowerCase()}`,
    }));

  return { data_fetch_plan: plan };
}

/**
 * Get required environment variables for a data source
 */
function getEnvVarsForSource(source: string): string[] {
  const envVarMap: Record<string, string[]> = {
    helius: ['NEXT_PUBLIC_HELIUS_API_KEY'],
    jupiter: [],
    magiceden: [],
    defillama: [],
    messari: ['MESSARI_API_KEY'],
    pyth: [],
    solscan: [],
    solanafm: [],
  };

  return envVarMap[source] || [];
}

/**
 * Generate expected schema for a metric
 */
function generateExpectedSchema(metric: MetricRegistryEntry): Record<string, any> {
  switch (metric.type) {
    case 'gauge':
      return {
        value: 'number',
        timestamp: 'integer',
      };
    case 'counter':
      return {
        count: 'number',
        timestamp: 'integer',
      };
    default:
      return {
        records: [],
      };
  }
}

