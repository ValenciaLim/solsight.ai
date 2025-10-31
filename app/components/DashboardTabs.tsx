'use client'

import Link from 'next/link'
import { usePathname, useParams } from 'next/navigation'
import { LayoutDashboard, Bell, FileText } from 'lucide-react'

export default function DashboardTabs() {
  const pathname = usePathname()
  const params = useParams()
  const dashboardId = params?.id as string

  // Check if we're on a dashboard page
  const isDashboardPage = pathname.startsWith('/dashboard')

  if (!isDashboardPage) return null

  // Build navigation links with dashboard ID if present
  const navigation = [
    { name: 'Overview', href: dashboardId ? `/dashboard/${dashboardId}` : '/dashboard', icon: LayoutDashboard },
    { name: 'Alerts', href: dashboardId ? `/dashboard/${dashboardId}/alerts` : '/dashboard/alerts', icon: Bell },
    { name: 'Reports', href: dashboardId ? `/dashboard/${dashboardId}/reports` : '/dashboard/reports', icon: FileText },
  ]

  return (
    <div className="bg-white border-b border-gray-200 shrink-0">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Tabs */}
        <div className="flex items-center space-x-2">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
                  isActive
                    ? 'bg-solana-gradient text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="font-medium text-sm">{item.name}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
