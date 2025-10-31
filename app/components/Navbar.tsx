'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useWallet } from '@solana/wallet-adapter-react'
import { Menu, X, LogOut } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../providers/AuthProvider'

export default function Navbar() {
  const { connected } = useWallet()
  const { user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Image 
              src="/assets/logo.png" 
              alt="Solana Analytics" 
              width={80} 
              height={80}
              className="object-contain"
            />
          </Link>

          {/* User Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {user && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={logout}
                  className="p-2 text-gray-400 hover:text-red-600 transition"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-700 hover:text-purple-600"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-4">
            {connected && user && (
              <>
                {user && (
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <button
                      onClick={logout}
                      className="flex items-center text-red-600 hover:text-red-700 transition"
                    >
                      <LogOut className="h-4 w-4 mr-1" />
                      Logout
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
