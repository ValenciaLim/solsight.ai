'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email?: string
  walletAddress?: string
  isAuthenticated: boolean
}

interface AuthContextType {
  user: User | null
  login: (email: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { connected, publicKey, disconnect } = useWallet()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    // Check for stored user data after mount (avoid SSR issues)
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser))
        } catch (e) {
          console.error('Failed to parse stored user:', e)
        }
      }
      setIsHydrated(true)
    }
  }, [])

  useEffect(() => {
    // Update user when wallet connects/disconnects
    if (connected && publicKey) {
      const updatedUser = {
        id: Date.now().toString(),
        walletAddress: publicKey.toString(),
        isAuthenticated: true
      }
      setUser(updatedUser)
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('user')
        if (stored) {
          const parsed = JSON.parse(stored)
          localStorage.setItem('user', JSON.stringify({ ...parsed, ...updatedUser }))
        } else {
          localStorage.setItem('user', JSON.stringify(updatedUser))
        }
      }
    } else if (!connected) {
      setUser(prev => prev ? {
        ...prev,
        walletAddress: undefined,
        isAuthenticated: false
      } : null)
    }
  }, [connected, publicKey])

  const login = useCallback((email: string) => {
    const newUser: User = {
      id: Date.now().toString(),
      email,
      isAuthenticated: true,
      walletAddress: publicKey?.toString()
    }
    setUser(newUser)
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(newUser))
    }
  }, [publicKey])

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

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout
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
