import { NextRequest, NextResponse } from 'next/server';
import { mapMetricToChartData } from '@/app/lib/chartDataMapper';
import { 
  generateFetchPlan, 
  executeFetchPlan, 
  executeCompositionPlan,
  explainFetchError,
  FetchPlan,
  CompositionPlan
} from '@/app/lib/dataFetcher';

export const maxDuration = 60;

/**
 * POST /api/dashboard-fetch
 * 
 * Intent-based dashboard data fetching
 * Uses LLM to understand chart intent and dynamically fetch data
 * Supports composition of multiple data sources
 */
export async function POST(req: NextRequest) {
  try {
    const { charts, stats, walletAddress, params: globalParams } = await req.json();

    if ((!charts || !Array.isArray(charts)) && (!stats || !Array.isArray(stats))) {
      return NextResponse.json(
        { error: 'charts or stats array is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 Fetching data for ${charts?.length || 0} charts and ${stats?.length || 0} stats using intent-based fetching`);

    // Fetch data for each chart
    const results = (charts || []).length > 0 ? await Promise.all(
      charts.map(async (chart: any) => {
        try {
          // Generate flexible fetch plan using LLM
          const fetchPlan = await generateFetchPlan(
            {
              title: chart.title,
              dataSource: chart.dataSource,
              type: chart.type,
              description: chart.description,
              xKey: chart.xKey,
              yKey: chart.yKey,
            },
            {
              walletAddress,
              params: {
                ...chart.params,
                ...globalParams,
              },
            }
          );

          if (!fetchPlan) {
            return {
              chartId: chart.id,
              data: [],
              error: 'Could not generate fetch plan. Please provide a chart title or description.',
              source: null,
            };
          }

          let rawData: any
          let source: string

          // Check if it's a composition plan or single fetch
          if ('primary' in fetchPlan) {
            // Composition plan - combine multiple sources
            const compositionPlan = fetchPlan as CompositionPlan
            console.log(`🔄 Executing composition plan: ${compositionPlan.description}`)
            rawData = await executeCompositionPlan(compositionPlan, {
              walletAddress,
              params: {
                ...chart.params,
                ...globalParams,
              },
            })
            source = compositionPlan.primary.source
          } else {
            // Single fetch plan
            const plan = fetchPlan as FetchPlan
            console.log(`📊 Executing fetch plan: ${plan.description} from ${plan.source}`)
            rawData = await executeFetchPlan(plan, {
              walletAddress,
              params: {
                ...chart.params,
                ...globalParams,
              },
            })
            source = plan.source
          }

          // Map data to chart format
          const mappedData = mapMetricToChartData(rawData, chart);

          return {
            chartId: chart.id,
            data: mappedData,
            error: null,
            source,
          };
        } catch (error) {
          console.error(`❌ Error fetching data for chart ${chart.id}:`, error);
          
          // Generate human-readable error explanation
          let errorMessage = 'Unknown error occurred while fetching data'
          
          try {
            // Try to get the fetch plan to explain the error
            const fetchPlan = await generateFetchPlan(
              {
                title: chart.title,
                dataSource: chart.dataSource,
                type: chart.type,
              },
              { walletAddress, params: { ...chart.params, ...globalParams } }
            )
            
            if (fetchPlan) {
              errorMessage = await explainFetchError(
                error instanceof Error ? error : new Error(String(error)),
                fetchPlan as FetchPlan,
                chart
              )
            }
          } catch (explainError) {
            console.error('Error generating error explanation:', explainError)
            errorMessage = error instanceof Error ? error.message : String(error)
          }

          return {
            chartId: chart.id,
            data: [],
            error: errorMessage,
            source: null,
          };
        }
      })
    ) : [];

    // Fetch data for stats if provided
    let statsResults: any[] = []
    if (stats && Array.isArray(stats) && stats.length > 0) {
      statsResults = await Promise.all(
        stats.map(async (stat: any) => {
          try {
            // Generate fetch plan for stat using metricRef or label
            const fetchPlan = await generateFetchPlan(
              {
                title: stat.label || stat.metricRef,
                description: stat.metricRef || stat.label,
                type: 'stat',
                dataSource: stat.dataSource,
              },
              {
                walletAddress,
                params: {
                  ...stat.params,
                  ...globalParams,
                },
              }
            );

            if (!fetchPlan) {
              return {
                statId: stat.id,
                value: stat.value || 'N/A',
                error: 'Could not generate fetch plan for stat',
                source: null,
              };
            }

            let rawData: any
            let source: string

            // Execute fetch plan
            if ('primary' in fetchPlan) {
              const compositionPlan = fetchPlan as CompositionPlan
              rawData = await executeCompositionPlan(compositionPlan, {
                walletAddress,
                params: { ...stat.params, ...globalParams },
              })
              source = compositionPlan.primary.source
            } else {
              const plan = fetchPlan as FetchPlan
              rawData = await executeFetchPlan(plan, {
                walletAddress,
                params: { ...stat.params, ...globalParams },
              })
              source = plan.source
            }

            // Extract numeric value from data
            let value: string | number = 'N/A'
            
            if (typeof rawData === 'number') {
              value = rawData
            } else if (rawData && typeof rawData === 'object') {
              // Try common value fields
              value = rawData.value ?? 
                      rawData.count ?? 
                      rawData.balance ?? 
                      rawData.solBalance ?? 
                      rawData.totalValueUSD ?? 
                      rawData.tvl ??
                      rawData.activeWallets ??
                      rawData.totalTransactions ??
                      rawData.volume ??
                      rawData.price ??
                      (Array.isArray(rawData) ? rawData.length : 'N/A')
              
              // Format numbers
              if (typeof value === 'number') {
                if (value >= 1e9) {
                  value = `${(value / 1e9).toFixed(2)}B`
                } else if (value >= 1e6) {
                  value = `${(value / 1e6).toFixed(2)}M`
                } else if (value >= 1e3) {
                  value = `${(value / 1e3).toFixed(2)}K`
                } else if (value < 1 && value > 0) {
                  value = value.toFixed(4)
                } else {
                  value = value.toLocaleString()
                }
              }
            }

            return {
              statId: stat.id,
              value: value.toString(),
              error: null,
              source,
            };
          } catch (error) {
            console.error(`❌ Error fetching data for stat ${stat.id}:`, error);
            
            let errorMessage = 'Failed to fetch stat data'
            try {
              const fetchPlan = await generateFetchPlan(
                {
                  title: stat.label,
                  description: stat.metricRef,
                  type: 'stat',
                },
                { walletAddress, params: { ...stat.params, ...globalParams } }
              )
              
              if (fetchPlan) {
                errorMessage = await explainFetchError(
                  error instanceof Error ? error : new Error(String(error)),
                  fetchPlan as FetchPlan,
                  stat
                )
              }
            } catch (explainError) {
              errorMessage = error instanceof Error ? error.message : String(error)
            }

            return {
              statId: stat.id,
              value: stat.value || 'Error',
              error: errorMessage,
              source: null,
            };
          }
        })
      )
    }

    return NextResponse.json({ 
      charts: results || [],
      stats: statsResults
    });

  } catch (error) {
    console.error('❌ Error in dashboard-fetch:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch dashboard data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
