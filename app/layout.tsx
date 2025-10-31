import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { WalletProviderWrapper } from './providers/WalletProvider'
import { AuthProvider } from './providers/AuthProvider'
import Navbar from './components/Navbar'
import PerformanceMonitor from './components/PerformanceMonitor'

const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-inter',
  display: 'swap',
  fallback: ['system-ui', 'arial']
})

export const metadata: Metadata = {
  title: 'Solana Analytics SaaS',
  description: 'Real-time AI-powered analytics for Solana',
  icons: {
    icon: '/assets/logo.png',
    shortcut: '/assets/logo.png',
    apple: '/assets/logo.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.variable}>
        <WalletProviderWrapper>
          <AuthProvider>
            <PerformanceMonitor />
            <Navbar />
            {children}
          </AuthProvider>
        </WalletProviderWrapper>
      </body>
    </html>
  )
}
