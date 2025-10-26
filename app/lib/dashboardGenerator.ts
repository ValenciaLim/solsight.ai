export interface StatConfig {
  id: string
  label: string
  value: string
  change?: string
  trend?: 'up' | 'down' | 'neutral'
  icon: string
}

export interface DashboardConfig {
  stats?: StatConfig[]
  charts: ChartConfig[]
  alerts: AlertConfig
  aiFeatures: AIFeatureConfig
  filters: FilterConfig[]
}

export interface ChartConfig {
  id: string
  type: 'line' | 'bar' | 'pie' | 'table'
  title: string
  dataSource: string
  metrics: string[]
  timeframe: 'short' | 'medium' | 'long'
}

export interface AlertConfig {
  frequency: 'realtime' | 'daily' | 'weekly'
  triggers: string[]
}

export interface AIFeatureConfig {
  suggestions: boolean
  autoTrending: boolean
  weeklySummaries: boolean
}

export interface FilterConfig {
  type: 'wallet' | 'token' | 'timeframe' | 'category'
  value: string
}

export interface OnboardingData {
  analysisType: string
  walletFocus: string
  alertsFrequency: string
  chartTypes: string[]
  aiSuggestions: boolean
  autoTrending: boolean
  timeFocus: string
  weeklySummaries: boolean
}

export interface NLPCommand {
  command: string
  json?: any
}

export function generateDashboardConfig(
  input: OnboardingData | NLPCommand
): DashboardConfig {
  // Check if input is NLP command
  if ('command' in input && input.json) {
    return generateFromNLP(input.json)
  }

  // Generate from onboarding data
  const data = input as OnboardingData
  return {
    charts: generateCharts(data),
    alerts: {
      frequency: data.alertsFrequency as 'realtime' | 'daily' | 'weekly',
      triggers: generateAlertTriggers(data)
    },
    aiFeatures: {
      suggestions: data.aiSuggestions,
      autoTrending: data.autoTrending,
      weeklySummaries: data.weeklySummaries
    },
    filters: generateFilters(data)
  }
}

function generateCharts(data: OnboardingData): ChartConfig[] {
  const charts: ChartConfig[] = []
  const chartTypes = data.chartTypes
  const analysisType = data.analysisType
  const timeFocus = data.timeFocus

  if (analysisType === 'nfts') {
    if (chartTypes.includes('line')) {
      charts.push({
        id: 'nft-floor-price',
        type: 'line',
        title: 'NFT Floor Price Trends',
        dataSource: 'NFT',
        metrics: ['floor_price', 'volume_24h'],
        timeframe: timeFocus as 'short' | 'medium' | 'long'
      })
    }
    if (chartTypes.includes('pie')) {
      charts.push({
        id: 'nft-collection-dist',
        type: 'pie',
        title: 'NFT Collection Distribution',
        dataSource: 'NFT',
        metrics: ['collection_count'],
        timeframe: 'short'
      })
    }
  }

  if (analysisType === 'defi') {
    if (chartTypes.includes('bar')) {
      charts.push({
        id: 'defi-yields',
        type: 'bar',
        title: 'DeFi Position Yields',
        dataSource: 'DeFi',
        metrics: ['apy', 'tvl'],
        timeframe: timeFocus as 'short' | 'medium' | 'long'
      })
    }
    if (chartTypes.includes('line')) {
      charts.push({
        id: 'defi-positions',
        type: 'line',
        title: 'DeFi Position Value',
        dataSource: 'DeFi',
        metrics: ['position_value', 'total_value_locked'],
        timeframe: timeFocus as 'short' | 'medium' | 'long'
      })
    }
  }

  if (analysisType === 'portfolio' || analysisType === '') {
    if (chartTypes.includes('line')) {
      charts.push({
        id: 'portfolio-value',
        type: 'line',
        title: 'Portfolio Value Over Time',
        dataSource: 'Portfolio',
        metrics: ['total_value', 'token_distribution'],
        timeframe: timeFocus as 'short' | 'medium' | 'long'
      })
    }
    if (chartTypes.includes('pie')) {
      charts.push({
        id: 'token-allocation',
        type: 'pie',
        title: 'Token Allocation',
        dataSource: 'Portfolio',
        metrics: ['token_distribution'],
        timeframe: 'short'
      })
    }
  }

  if (chartTypes.includes('table')) {
    charts.push({
      id: 'transaction-history',
      type: 'table',
      title: 'Transaction History',
      dataSource: 'Transactions',
      metrics: ['amount', 'date', 'type'],
      timeframe: 'medium'
    })
  }

  return charts
}

function generateAlertTriggers(data: OnboardingData): string[] {
  const triggers: string[] = []
  
  if (data.analysisType === 'nfts') {
    triggers.push('nft_sale', 'floor_price_change')
  }
  if (data.analysisType === 'defi') {
    triggers.push('yield_change', 'position_value_change')
  }
  if (data.walletFocus === 'public') {
    triggers.push('whale_movement', 'large_transaction')
  }

  return triggers
}

function generateFilters(data: OnboardingData): FilterConfig[] {
  const filters: FilterConfig[] = []

  if (data.walletFocus === 'own') {
    filters.push({ type: 'wallet', value: 'own' })
  } else if (data.walletFocus === 'public') {
    filters.push({ type: 'wallet', value: 'public' })
  }

  filters.push({ type: 'timeframe', value: data.timeFocus })

  if (data.analysisType !== '') {
    filters.push({ type: 'category', value: data.analysisType })
  }

  return filters
}

function generateFromNLP(json: any): DashboardConfig {
  // Parse NLP JSON and generate dashboard config
  // This is a simplified implementation
  const charts: ChartConfig[] = []
  
  if (json.nftCollection) {
    charts.push({
      id: 'nft-collection',
      type: 'line',
      title: 'NFT Collection',
      dataSource: 'NFT',
      metrics: ['floor_price', 'volume'],
      timeframe: 'medium'
    })
  }

  if (json.defiPortfolio) {
    charts.push({
      id: 'defi-portfolio',
      type: 'bar',
      title: 'DeFi Portfolio',
      dataSource: 'DeFi',
      metrics: ['apy', 'value'],
      timeframe: 'medium'
    })
  }

  if (json.weeklyTransactions) {
    charts.push({
      id: 'weekly-transactions',
      type: 'table',
      title: 'Weekly Transactions',
      dataSource: 'Transactions',
      metrics: ['date', 'amount', 'type'],
      timeframe: 'short'
    })
  }

  return {
    charts,
    alerts: {
      frequency: 'weekly',
      triggers: []
    },
    aiFeatures: {
      suggestions: true,
      autoTrending: true,
      weeklySummaries: true
    },
    filters: []
  }
}
