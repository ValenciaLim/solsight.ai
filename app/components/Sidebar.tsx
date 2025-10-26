'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Brain, Bell, Settings, TrendingUp } from 'lucide-react'

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'AI Insights', href: '/dashboard/ai-insights', icon: Brain },
  { name: 'Alerts', href: '/dashboard/alerts', icon: Bell },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-200">
      <div className="p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                isActive
                  ? 'bg-solana-gradient text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          )
        })}
      </div>
      
      {/* Additional Info */}
      <div className="absolute bottom-4 left-4 right-4 p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          <TrendingUp className="h-5 w-5 text-purple-600" />
          <span className="text-sm font-semibold text-gray-900">Portfolio Value</span>
        </div>
        <p className="text-2xl font-bold bg-solana-gradient bg-clip-text text-transparent">
          $12,450
        </p>
        <p className="text-sm text-green-600 mt-1">+5.2% today</p>
      </div>
    </aside>
  )
}
