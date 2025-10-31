'use client'

import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets'
import { clusterApiUrl } from '@solana/web3.js'
import { useMemo } from 'react'

require('@solana/wallet-adapter-react-ui/styles.css')

export function WalletProviderWrapper({ children }: { children: React.ReactNode }) {
  const network = WalletAdapterNetwork.Mainnet
  // Use a better RPC endpoint if available
  const endpoint = useMemo(() => {
    const heliusKey = process.env.NEXT_PUBLIC_HELIUS_API_KEY
    if (heliusKey) {
      return `https://mainnet.helius-rpc.com/?api-key=${heliusKey}`
    }
    return clusterApiUrl(network)
  }, [network])

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  )

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
