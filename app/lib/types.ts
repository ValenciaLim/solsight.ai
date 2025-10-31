/**
 * Core TypeScript interfaces for SolSight research engine
 * Based on .cursor/rules output formats
 */

// Intent interpretation
export interface IntentInterpretation {
  intent: string;
  user_query: string;
  inferred_topics: string[];
  confidence: number;
}

// Domain selection
export interface DomainSelection {
  domains: string[];
  suggested_time_range: string;
}

// Data fetch plan
export interface DataFetchPlanItem {
  id: string;
  domain: string;
  source: string;
  endpoint: string;
  params: Record<string, any>;
  env_vars: string[];
  expected_schema: Record<string, any>;
  notes?: string;
}

export interface DataFetchPlan {
  data_fetch_plan: DataFetchPlanItem[];
}

// Preprocessing instructions
export interface PreprocessInstruction {
  id: string;
  action: string;
  params: Record<string, any>;
}

export interface PreprocessPlan {
  preprocess: PreprocessInstruction[];
}

// Chart configuration
export interface ChartConfig {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'table' | 'area';
  title: string;
  data_source: string;
  x?: string;
  y?: string;
  layout?: 'stacked' | 'side-by-side' | 'grid';
  explanations_required?: boolean;
}

export interface ChartConfigPlan {
  charts: ChartConfig[];
  layout?: string;
  explanations_required?: boolean;
}

// Insights and follow-ups
export interface Insights {
  insights: string[];
  confidence: number;
  suggested_followups: string[];
}

// Complete research response
export interface ResearchResponse {
  intent_interpretation?: IntentInterpretation;
  domain_selection?: DomainSelection;
  data_fetch_plan?: DataFetchPlan;
  preprocess?: PreprocessPlan;
  chart_config?: ChartConfigPlan;
  insights?: Insights;
}

// Domain types
export type DomainType = 
  | 'nft_activity'
  | 'defi_activity'
  | 'wallet_flows'
  | 'token_analysis'
  | 'protocol_metrics'
  | 'market_data';

// Data source types
export type DataSource = 
  | 'helius'
  | 'triton'
  | 'tensor'
  | 'jupiter'
  | 'pyth'
  | 'defillama'
  | 'artemis'
  | 'flipside'
  | 'messari'
  | 'switchboard';

// Metric registry entry
export interface MetricRegistryEntry {
  id: string;
  domain: DomainType;
  source: DataSource;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  unit: string;
  description: string;
  endpoint?: string;
  params?: Record<string, any>;
}

// Cache configuration
export interface CacheConfig {
  key: string;
  ttl: number; // in seconds
  tags?: string[];
}

// Fetcher error
export class FetcherError extends Error {
  constructor(
    message: string,
    public source: string,
    public statusCode?: number,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'FetcherError';
  }
}

