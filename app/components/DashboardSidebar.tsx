'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Plus, X, Settings, Trash } from 'lucide-react'
import { useAuth } from '../providers/AuthProvider'

interface Dashboard {
  id: string
  name: string
  createdAt: Date
}

interface DashboardSidebarProps {
  onToggle?: (isOpen: boolean) => void
}

export default function DashboardSidebar({ onToggle }: DashboardSidebarProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [dashboards, setDashboards] = useState<Dashboard[]>([])
  const pathname = usePathname()
  const { isEnterprise } = useAuth()

  const handleToggle = (newState: boolean) => {
    setIsOpen(newState)
    if (onToggle) {
      onToggle(newState)
    }
  }

  // Load dashboards from localStorage on mount
  useEffect(() => {
    loadDashboards()
  }, [isEnterprise])

  const loadDashboards = () => {
    // Use different localStorage key for enterprise users
    const storageKey = isEnterprise ? 'enterprise_dashboards' : 'dashboards'
    const savedDashboards = localStorage.getItem(storageKey)
    if (savedDashboards) {
      const parsed = JSON.parse(savedDashboards)
      setDashboards(parsed.map((d: any) => ({ ...d, createdAt: new Date(d.createdAt) })))
    }
  }

  const handleDeleteDashboard = (e: React.MouseEvent, dashboardId: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (confirm('Are you sure you want to delete this dashboard?')) {
      // Use different localStorage key for enterprise users
      const storageKey = isEnterprise ? 'enterprise_dashboards' : 'dashboards'
      const savedDashboards = localStorage.getItem(storageKey)
      if (savedDashboards) {
        const parsed = JSON.parse(savedDashboards)
        const filtered = parsed.filter((d: any) => d.id !== dashboardId)
        localStorage.setItem(storageKey, JSON.stringify(filtered))
        loadDashboards()
      }
    }
  }

  return (
    <aside className={`fixed left-0 top-16 bg-white border-r border-gray-200 transition-all duration-300 h-[calc(100vh-4rem)] flex flex-col z-30 ${
      isOpen ? 'w-64' : 'w-0 overflow-hidden'
    }`}>
      <div className="flex items-center justify-between p-4 border-b border-gray-200 shrink-0">
        {isOpen && (
          <>
            <h2 className="font-semibold text-gray-900">Dashboards</h2>
            <button
              onClick={() => handleToggle(false)}
              className="p-1 hover:bg-gray-100 rounded transition"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </>
        )}
        {!isOpen && (
          <button
            onClick={() => handleToggle(true)}
            className="p-2 hover:bg-gray-100 rounded transition"
          >
            <LayoutDashboard className="h-5 w-5 text-gray-500" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 space-y-2 flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
            {/* Create Dashboard Button */}
            <Link
              href="/create-dashboard"
              className="flex items-center space-x-2 w-full px-4 py-3 bg-solana-gradient text-white rounded-lg hover:shadow-lg transition font-medium"
            >
              <Plus className="h-4 w-4" />
              <span>Create Dashboard</span>
            </Link>

            {/* Dashboard List */}
            <div className="mt-4">
                <div className="space-y-1">
                  {dashboards.map((dashboard) => {
                    // Check if current pathname includes this dashboard ID
                    const isActive = pathname.includes(`/dashboard/${dashboard.id}`)
                    
                    return (
                    <div
                      key={dashboard.id}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition ${
                        isActive
                          ? 'bg-solana-gradient text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Link
                        href={`/dashboard/${dashboard.id}`}
                        className="flex-1 flex items-center space-x-3 min-w-0"
                      >
                        <LayoutDashboard className="h-4 w-4 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{dashboard.name}</p>
                          <p className="text-xs opacity-70 truncate">
                            {dashboard.createdAt.toLocaleDateString()}
                          </p>
                        </div>
                      </Link>
                      <button
                        onClick={(e) => handleDeleteDashboard(e, dashboard.id)}
                        className="p-1 hover:bg-red-100 rounded transition shrink-0"
                        title="Delete dashboard"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                    )
                  })}
                </div>
            </div>
          </div>
          
          {/* Settings Link at Bottom - Fixed Position */}
          <div className="p-4 border-t border-gray-200 shrink-0 bg-white">
            <Link
              href="/settings"
              className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition w-full"
            >
              <Settings className="h-5 w-5" />
              <span className="text-sm font-medium">Settings</span>
            </Link>
          </div>
        </div>
      )}
    </aside>
  )
}
