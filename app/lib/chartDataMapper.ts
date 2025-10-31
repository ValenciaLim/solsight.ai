/**
 * Chart Data Mapper
 * 
 * Maps metric data from various sources into chart-compatible formats
 */

export interface ChartDataPoint {
  [key: string]: any;
}

/**
 * Map metric data to chart data points based on chart configuration
 */
export function mapMetricToChartData(
  metricData: any,
  chartConfig: {
    type: string;
    dataSource: string;
    metrics: string[];
  }
): ChartDataPoint[] {
  if (!metricData) {
    return [];
  }

  switch (chartConfig.type) {
    case 'line':
    case 'area':
      return mapToTimeSeries(metricData, chartConfig);
    
    case 'bar':
      return mapToBarData(metricData, chartConfig);
    
    case 'pie':
      return mapToPieData(metricData, chartConfig);
    
    case 'table':
      return mapToTableData(metricData, chartConfig);
    
    default:
      return [];
  }
}

/**
 * Map metric data to time series format
 */
function mapToTimeSeries(metricData: any, config: any): ChartDataPoint[] {
  if (!metricData) return [];

  // If data is an array, map it directly
  if (Array.isArray(metricData)) {
    return metricData.map((item, index) => ({
      date: item.timestamp ? new Date(item.timestamp).toLocaleDateString() : `Day ${index + 1}`,
      value: item.value || item.count || item.amount || 0,
    }));
  }

  // If data is a single value, create a simple array
  if (typeof metricData === 'number') {
    return [{ date: 'Now', value: metricData }];
  }

  // If data has historical values
  if (metricData.historical) {
    return metricData.historical.map((item: any, index: number) => ({
      date: item.timestamp ? new Date(item.timestamp).toLocaleDateString() : `Day ${index + 1}`,
      value: item.value || item.count || item.amount || 0,
    }));
  }

  // Default: single data point
  return [{ date: 'Now', value: metricData.value || metricData.count || 0 }];
}

/**
 * Map metric data to bar chart format
 */
function mapToBarData(metricData: any, config: any): ChartDataPoint[] {
  if (!metricData) return [];

  // If data is an array with labels
  if (Array.isArray(metricData) && metricData[0]?.name) {
    return metricData.map(item => ({
      name: item.name,
      value: item.value || item.count || 0,
    }));
  }

  // If data has multiple series
  if (metricData.series) {
    return metricData.series.map((item: any, index: number) => ({
      name: item.name || `Series ${index + 1}`,
      value: item.value || item.count || 0,
    }));
  }

  // Default: single bar
  return [{ name: 'Total', value: metricData.value || metricData.count || 0 }];
}

/**
 * Map metric data to pie chart format
 */
function mapToPieData(metricData: any, config: any): ChartDataPoint[] {
  if (!metricData) return [];

  // If data is an array with names and values
  if (Array.isArray(metricData) && metricData[0]?.name) {
    return metricData.map(item => ({
      name: item.name,
      value: item.value || item.count || 0,
    }));
  }

  // If data has distribution
  if (metricData.distribution) {
    return metricData.distribution.map((item: any) => ({
      name: item.label || item.name,
      value: item.value || item.count || 0,
    }));
  }

  // Default: single slice
  return [{ name: 'Total', value: 1 }];
}

/**
 * Map metric data to table format
 */
function mapToTableData(metricData: any, config: any): ChartDataPoint[] {
  if (!metricData) return [];

  // If data is an array of records
  if (Array.isArray(metricData)) {
    return metricData.map(item => ({
      ...item,
      date: item.timestamp ? new Date(item.timestamp).toLocaleString() : item.date,
    }));
  }

  // If data has records
  if (metricData.records) {
    return metricData.records.map((record: any) => ({
      ...record,
      date: record.timestamp ? new Date(record.timestamp).toLocaleString() : record.date,
    }));
  }

  // Default: single row
  return [{ data: metricData }];
}

/**
 * Generate mock data for testing/fallback
 */
export function generateMockChartData(
  chartType: string,
  dataSource: string,
  count: number = 5
): ChartDataPoint[] {
  const data: ChartDataPoint[] = [];

  switch (chartType) {
    case 'line':
    case 'area':
      for (let i = 0; i < count; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (count - i - 1));
        data.push({
          date: date.toLocaleDateString(),
          value: Math.floor(Math.random() * 10000) + 5000,
        });
      }
      break;

    case 'bar':
      for (let i = 0; i < count; i++) {
        data.push({
          name: `Item ${String.fromCharCode(65 + i)}`,
          value: Math.floor(Math.random() * 10000) + 1000,
        });
      }
      break;

    case 'pie':
      data.push(
        { name: 'Series A', value: Math.floor(Math.random() * 10000) + 1000 },
        { name: 'Series B', value: Math.floor(Math.random() * 10000) + 1000 },
        { name: 'Series C', value: Math.floor(Math.random() * 10000) + 1000 },
        { name: 'Series D', value: Math.floor(Math.random() * 10000) + 1000 }
      );
      break;

    case 'table':
      for (let i = 0; i < count; i++) {
        data.push({
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toLocaleString(),
          amount: (Math.random() * 1000).toFixed(2),
          type: ['Buy', 'Sell', 'Transfer'][Math.floor(Math.random() * 3)],
        });
      }
      break;
  }

  return data;
}

