'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, Wallet, Shield, Zap } from 'lucide-react'
import Link from 'next/link'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuth } from '../providers/AuthProvider'

export default function LoginPage() {
  const { connected } = useWallet()
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Redirect to dashboard when user is logged in and wallet is connected
    console.log('Login page state:', { user, connected })
    if (user && connected) {
      console.log('Redirecting to dashboard...')
      router.push('/dashboard')
    }
  }, [user, connected, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-indigo-600 to-cyan-500 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="text-center">
          <Link href="/" className="inline-flex items-center text-white hover:text-gray-200 mb-8">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          
          <div className="flex items-center justify-center mb-6">
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full">
              <Wallet className="h-8 w-8 text-white" />
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-2">
            Connect Your Wallet
          </h2>
          <p className="text-white/80">
            Connect your Solana wallet to access your personalized dashboard
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm p-8 rounded-xl border border-white/20">
          <div className="text-center mb-6">
            <Wallet className="h-16 w-16 text-white mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Wallet Connection
            </h3>
            <p className="text-white/80">
              Connect with Phantom, Solflare, or other Solana wallets
            </p>
          </div>

          <div className="space-y-4">
            <WalletMultiButton className="!w-full !bg-white !text-purple-600 !rounded-lg !py-3 !font-semibold hover:!bg-gray-50 transition" />
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-transparent text-white/80">Features</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center p-3 bg-white/10 rounded-lg">
                <Shield className="h-5 w-5 text-green-400 mr-3" />
                <span className="text-sm text-white">Secure wallet connection</span>
              </div>
              <div className="flex items-center p-3 bg-white/10 rounded-lg">
                <Zap className="h-5 w-5 text-yellow-400 mr-3" />
                <span className="text-sm text-white">Real-time portfolio tracking</span>
              </div>
              <div className="flex items-center p-3 bg-white/10 rounded-lg">
                <Wallet className="h-5 w-5 text-blue-400 mr-3" />
                <span className="text-sm text-white">NFT and DeFi analytics</span>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-white/60">
              Don&apos;t have a Solana wallet?{' '}
              <a href="https://phantom.app" target="_blank" rel="noopener noreferrer" className="text-white hover:text-gray-200 underline">
                Download Phantom
              </a>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}