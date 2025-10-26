# Dashboard Generation Implementation

## Overview
This implementation enables users to create personalized dashboards through two methods:
1. **Onboarding Questionnaire** - Structured multi-step questionnaire
2. **NLP Command** - Natural language commands processed by AI

## Files Created/Modified

### New Files
- `app/lib/dashboardGenerator.ts` - Core dashboard generation logic

### Modified Files
- `app/dashboard/page.tsx` - Now uses dynamic chart generation
- `app/onboarding/page.tsx` - Collects user preferences

## How It Works

### 1. Onboarding Flow
1. User completes the onboarding questionnaire
2. Answers are stored in `localStorage` as `onboardingData`
3. Dashboard configuration is generated using `generateDashboardConfig()`

### 2. Dashboard Generation
The `generateDashboardConfig()` function:
- Takes onboarding data or NLP JSON as input
- Analyzes preferences (analysis type, chart types, time focus)
- Generates appropriate charts, alerts, and filters
- Returns a `DashboardConfig` object

### 3. Dynamic Chart Rendering
The dashboard page:
- Loads onboarding data from `localStorage`
- Generates configuration via `generateDashboardConfig()`
- Dynamically renders charts based on configuration
- Supports: Line, Bar, Pie, and Table chart types

## Chart Generation Logic

### Based on Analysis Type
- **NFTs**: Floor price trends, collection distribution
- **DeFi**: Yields, position values, TVL
- **Portfolio**: Overall performance, token allocation
- **Public Wallets**: Whale movements, large transactions

### Based on Chart Types Selected
- **Line Charts**: Time-series data (trends)
- **Bar Charts**: Comparisons
- **Pie Charts**: Distribution/allocations
- **Tables**: Transaction history

### Based on Time Focus
- **Short-term**: Daily movements
- **Medium-term**: Weekly patterns
- **Long-term**: Monthly/yearly analysis

## Future Enhancements

### NLP Command Processing
To implement NLP-based dashboard creation:

1. Add AI parsing in the chat API (`app/api/chat/route.ts`)
2. Parse natural language into structured JSON
3. Pass JSON to `generateFromNLP()` function
4. Example JSON structure:
```json
{
  "nftCollection": true,
  "defiPortfolio": true,
  "weeklyTransactions": true
}
```

### Database Integration
Currently using `localStorage`. For production:
- Store onboarding data in database
- Link to user account
- Allow multiple dashboard configurations

## Usage Example

```typescript
import { generateDashboardConfig } from '@/lib/dashboardGenerator'

// From onboarding data
const onboardingData = {
  analysisType: 'nfts',
  walletFocus: 'own',
  alertsFrequency: 'daily',
  chartTypes: ['line', 'pie'],
  aiSuggestions: true,
  autoTrending: true,
  timeFocus: 'medium',
  weeklySummaries: true
}

const config = generateDashboardConfig(onboardingData)
// config contains charts, alerts, aiFeatures, and filters
```

## Testing

To test the dashboard generation:
1. Complete the onboarding flow at `/onboarding`
2. Select different preferences
3. Complete setup and navigate to `/dashboard`
4. Verify charts match selected preferences
