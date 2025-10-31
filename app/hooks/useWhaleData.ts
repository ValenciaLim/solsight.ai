/**
 * Custom Hook: useWhaleData
 * 
 * Fetches data from:
 * 1. Helius - Wallet portfolios, transaction history, NFT data
 * 
 * Returns unified whale analytics data for dashboard, alerts, and reports
 */

import { useState, useEffect } from 'react'
import { 
  fetchWalletPortfolio, 
  fetchTransactionHistory,
  analyzeWhaleBehavior,
  fetchWalletNFTs,
  getAssetsByOwner,
  fetchSOLPrice
} from '../lib/fetchers/helius'

export interface WhaleData {
  whaleWallets: any[]
  ownershipData: any[]
  transactionHistory: any[]
  behaviorAnalysis: any
  nftData: any[]
  stats: {
    uniqueWallets: number
    totalWhaleWallets: number
    avgPortfolioValue: number
    totalNFTs: number
  }
}

export function useWhaleData(enabled: boolean = true) {
  const [whaleData, setWhaleData] = useState<WhaleData | null>(null)
  const [loading, setLoading] = useState(false) // Start as false to prevent blocking
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    if (!enabled || isInitialized) return

    // Use requestIdleCallback or setTimeout to defer heavy operations
    const fetchDataWhenIdle = () => {
    const fetchAllData = async () => {
      try {
        setLoading(true)
          console.log('🐋 Fetching whale data from Helius API...')

          // 1. Create mock whale wallet addresses for demonstration
          const mockWhaleAddresses = [
            '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM', // Only one address initially
          ]

          // 2. Fetch wallet portfolios from Helius (reduced scope)
          console.log('💼 Fetching wallet portfolios from Helius...')
          const whaleWallets = []
          for (const address of mockWhaleAddresses) {
            try {
              const portfolio = await fetchWalletPortfolio(address)
              if (portfolio.solBalance > 0) {
                whaleWallets.push({
                  wallet: address,
                  solBalance: portfolio.solBalance,
                  tokens: portfolio.tokens || [],
                  nftCount: portfolio.nftCount || 0,
                })
              }
            } catch (error) {
              console.warn(`Failed to fetch portfolio for ${address}:`, error)
            }
          }

          console.log(`✅ Loaded ${whaleWallets.length} whale wallets from Helius`)

          // 3. Set initial data immediately to prevent UI blocking
          const initialData: WhaleData = {
            whaleWallets,
            ownershipData: whaleWallets.map((w: any) => ({
              wallet: w.wallet,
              solBalance: w.solBalance,
              usdValue: w.solBalance * 100, // Default price
              tokenCount: w.tokens?.length || 0,
              nftCount: w.nftCount || 0,
            })),
            transactionHistory: [],
            behaviorAnalysis: null,
            nftData: [],
            stats: {
              uniqueWallets: whaleWallets.length,
              totalWhaleWallets: whaleWallets.length,
              avgPortfolioValue: whaleWallets.length > 0
                ? whaleWallets.reduce((sum: number, w: any) => sum + (w.solBalance * 100), 0) / whaleWallets.length
                : 0,
              totalNFTs: 0,
            }
          }

          setWhaleData(initialData)
          setError(null)
          setLoading(false)
          setIsInitialized(true)

          // 4. Fetch additional data in background (non-blocking)
          setTimeout(async () => {
            try {
              console.log('🔄 Fetching additional data in background...')
              
              // Fetch SOL price
              const solPrice = await fetchSOLPrice()
              console.log(`✅ SOL price: $${solPrice.toFixed(2)}`)

              // Fetch transaction history (reduced limit)
        const txHistory = whaleWallets.length > 0 
                ? await fetchTransactionHistory(whaleWallets[0].wallet, 10)
                : []

              // Fetch NFT data
              let nftData = []
              if (whaleWallets.length > 0) {
                try {
                  nftData = await fetchWalletNFTs(whaleWallets[0].wallet)
                } catch (error) {
                  console.warn('Failed to fetch NFT data:', error)
                  nftData = []
                }
              }

              // Analyze whale behavior
        let behaviorAnalysis = null
        if (whaleWallets.length > 0) {
                behaviorAnalysis = await analyzeWhaleBehavior(whaleWallets[0].wallet, 20)
              }

              // Update with complete data
              setWhaleData(prev => ({
                ...prev,
                ownershipData: whaleWallets.map((w: any) => ({
          wallet: w.wallet,
          solBalance: w.solBalance,
          usdValue: w.solBalance * solPrice,
          tokenCount: w.tokens?.length || 0,
          nftCount: w.nftCount || 0,
                })),
                transactionHistory: txHistory,
                behaviorAnalysis,
                nftData,
                stats: {
                  uniqueWallets: whaleWallets.length,
          totalWhaleWallets: whaleWallets.length,
          avgPortfolioValue: whaleWallets.length > 0
            ? whaleWallets.reduce((sum: number, w: any) => sum + (w.solBalance * solPrice), 0) / whaleWallets.length
            : 0,
                  totalNFTs: nftData.length,
                }
              }))

              console.log('✅ Background data loading completed!')
            } catch (err) {
              console.error('Error fetching background data:', err)
            }
          }, 100) // Small delay to ensure UI is responsive

      } catch (err) {
        console.error('Error fetching whale data:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        setLoading(false)
      }
    }

    fetchAllData()
    }

    // Use requestIdleCallback if available, otherwise setTimeout
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as any).requestIdleCallback(fetchDataWhenIdle, { timeout: 2000 })
    } else {
      setTimeout(fetchDataWhenIdle, 0)
    }
  }, [enabled, isInitialized])

  return { whaleData, loading, error }
}
