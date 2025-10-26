'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email?: string
  role: 'individual' | 'enterprise'
  walletAddress?: string
  isAuthenticated: boolean
}

interface AuthContextType {
  user: User | null
  login: (email: string, role: 'individual' | 'enterprise') => void
  logout: () => void
  isEnterprise: boolean
  isIndividual: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { connected, publicKey, disconnect } = useWallet()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // Check for stored user data
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  useEffect(() => {
    // Update user when wallet connects/disconnects
    if (connected && publicKey) {
      setUser(prev => prev ? {
        ...prev,
        walletAddress: publicKey.toString(),
        isAuthenticated: true
      } : null)
    } else if (!connected) {
      setUser(prev => prev ? {
        ...prev,
        walletAddress: undefined,
        isAuthenticated: false
      } : null)
    }
  }, [connected, publicKey])

  const login = useCallback((email: string, role: 'individual' | 'enterprise') => {
    const newUser: User = {
      id: Date.now().toString(),
      email,
      role,
      isAuthenticated: true
    }
    setUser(newUser)
    localStorage.setItem('user', JSON.stringify(newUser))
  }, [])

  const logout = useCallback(async () => {
    setUser(null)
    localStorage.removeItem('user')
    localStorage.removeItem('onboardingData')
    localStorage.removeItem('dashboards')
    
    // Disconnect wallet if connected
    if (connected) {
      try {
        await disconnect()
      } catch (error) {
        console.error('Error disconnecting wallet:', error)
      }
    }
    
    // Navigate to homepage immediately
    router.push('/')
  }, [connected, disconnect, router])

  const isEnterprise = user?.role === 'enterprise'
  const isIndividual = user?.role === 'individual'

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isEnterprise,
      isIndividual
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
