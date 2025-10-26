/**
 * Custom Hook: useWhaleData
 * 
 * Fetches and combines data from:
 * 1. Envio - NFT transfers
 * 2. Helius - Wallet portfolios, transaction history
 * 3. Pyth - SOL price data
 * 
 * Returns unified whale analytics data for dashboard, alerts, and reports
 */

import { useState, useEffect } from 'react'
import { fetchNFTTransfers } from '../lib/envio-client-simple'
import { 
  fetchWalletPortfolio, 
  fetchTransactionHistory,
  analyzeWhaleBehavior 
} from '../lib/helius-client'
import { fetchSOLPrice } from '../lib/pyth-client'

export interface WhaleData {
  transfers: any[]
  whaleWallets: any[]
  ownershipData: any[]
  transactionHistory: any[]
  behaviorAnalysis: any
  solPrice: number
  stats: {
    totalTransfers: number
    uniqueWallets: number
    totalWhaleWallets: number
    avgPortfolioValue: number
  }
}

export function useWhaleData(enabled: boolean = true) {
  const [whaleData, setWhaleData] = useState<WhaleData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) return

    const fetchAllData = async () => {
      try {
        setLoading(true)
        console.log('🐋 Fetching whale data from all APIs...')

        // 1. Fetch NFT transfers from Envio
        console.log('📊 Fetching NFT transfers from Envio...')
        const transfers = await fetchNFTTransfers(50)
        console.log(`✅ Loaded ${transfers.length} transfers from Envio`)

        // 2. Extract unique wallet addresses from transfers
        const uniqueWallets = Array.from(new Set([
          ...transfers.map(t => t.from),
          ...transfers.map(t => t.to)
        ]))

        // 3. Fetch wallet portfolios from Helius (top 10 wallets)
        console.log('💼 Fetching wallet portfolios from Helius...')
        const topWallets = uniqueWallets.slice(0, 10)
        const portfolios = await Promise.all(
          topWallets.map(async (wallet) => {
            try {
              const portfolio = await fetchWalletPortfolio(wallet)
              return { wallet, ...portfolio }
            } catch (error) {
              console.error(`Error fetching portfolio for ${wallet}:`, error)
              return null
            }
          })
        )

        const whaleWallets = portfolios.filter(p => p !== null).filter((p: any) => 
          p.solBalance > 10 // Only wallets with > 10 SOL
        )

        console.log(`✅ Found ${whaleWallets.length} whale wallets`)

        // 4. Fetch transaction history for top whale
        console.log('📜 Fetching transaction history...')
        const txHistory = whaleWallets.length > 0 
          ? await fetchTransactionHistory(whaleWallets[0].wallet, 20)
          : []

        // 5. Analyze whale behavior
        let behaviorAnalysis = null
        if (whaleWallets.length > 0) {
          behaviorAnalysis = await analyzeWhaleBehavior(whaleWallets[0].wallet, 50)
        }

        // 6. Fetch SOL price from Pyth
        console.log('💰 Fetching SOL price from Pyth...')
        const solPrice = await fetchSOLPrice()
        console.log(`✅ SOL price: $${solPrice.toFixed(2)}`)

        // 7. Calculate ownership concentration
        const ownershipData = whaleWallets.map((w: any) => ({
          wallet: w.wallet,
          solBalance: w.solBalance,
          usdValue: w.solBalance * solPrice,
          tokenCount: w.tokens?.length || 0,
          nftCount: w.nftCount || 0,
        }))

        // 8. Calculate aggregate stats
        const stats = {
          totalTransfers: transfers.length,
          uniqueWallets: uniqueWallets.length,
          totalWhaleWallets: whaleWallets.length,
          avgPortfolioValue: whaleWallets.length > 0
            ? whaleWallets.reduce((sum: number, w: any) => sum + (w.solBalance * solPrice), 0) / whaleWallets.length
            : 0,
        }

        // 9. Combine all data
        const combinedData: WhaleData = {
          transfers,
          whaleWallets,
          ownershipData,
          transactionHistory: txHistory,
          behaviorAnalysis,
          solPrice,
          stats,
        }

        console.log('✅ Whale data loaded successfully!')
        setWhaleData(combinedData)
        setError(null)
      } catch (err) {
        console.error('Error fetching whale data:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchAllData()
  }, [enabled])

  return { whaleData, loading, error }
}
