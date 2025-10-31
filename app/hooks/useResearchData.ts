import { useState, useEffect } from 'react';

export interface ResearchData {
  [metricId: string]: {
    data: any;
    loading: boolean;
    error?: string;
    isMock?: boolean;
  };
}

/**
 * Hook to fetch research data for multiple metrics
 */
export function useResearchData(metrics: Array<{ id: string; params?: Record<string, any> }>) {
  const [data, setData] = useState<ResearchData>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (metrics.length === 0) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      const results: ResearchData = {};

      // Initialize all metrics as loading
      metrics.forEach(metric => {
        results[metric.id] = { data: null, loading: true };
      });

      setData(results);

      // Fetch data for each metric in parallel
      const fetchPromises = metrics.map(async (metric) => {
        try {
          const response = await fetch('/api/research-fetch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              metricId: metric.id,
              params: metric.params || {},
            }),
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.error || 'Failed to fetch data');
          }

          results[metric.id] = {
            data: result.data,
            loading: false,
            isMock: result.isMock,
          };
        } catch (error) {
          console.error(`Error fetching ${metric.id}:`, error);
          results[metric.id] = {
            data: null,
            loading: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            isMock: true,
          };
        }
      });

      await Promise.all(fetchPromises);
      setData(results);
      setLoading(false);
    };

    fetchData();
  }, [JSON.stringify(metrics)]);

  return { data, loading };
}

