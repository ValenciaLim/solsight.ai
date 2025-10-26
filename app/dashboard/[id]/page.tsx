'use client'

import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import DashboardTabs from '../../components/DashboardTabs'
import DashboardSidebar from '../../components/DashboardSidebar'
import Chatbot from '../../components/Chatbot'
import ChartWrapper from '../../components/ChartWrapper'
import { useAuth } from '../../providers/AuthProvider'
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { Wallet, TrendingUp, TrendingDown, Coins, LayoutDashboard, BarChart3, Target, Activity, ArrowLeft, Trash } from 'lucide-react'

// Icon mapping for dynamic stat icons
const iconMap: { [key: string]: any } = {
  'Coins': Coins,
  'TrendingUp': TrendingUp,
  'TrendingDown': TrendingDown,
  'Wallet': Wallet,
  'BarChart3': BarChart3,
  'Target': Target,
  'Activity': Activity,
}
import { PublicKey, Connection } from '@solana/web3.js'

// Mock data for charts
const portfolioData = [
  { date: 'Jan', value: 10000 },
  { date: 'Feb', value: 10500 },
  { date: 'Mar', value: 11200 },
  { date: 'Apr', value: 11000 },
  { date: 'May', value: 12450 },
]

const nftData = [
  { name: 'CryptoPunks', count: 3, value: 4500 },
  { name: 'Bored Ape', count: 2, value: 3200 },
  { name: 'Other', count: 5, value: 2100 },
]

export default function DashboardPage() {
  const { connected, publicKey } = useWallet()
  const { connection } = useConnection()
  const { isEnterprise } = useAuth()
  const router = useRouter()
  const params = useParams()
  const dashboardId = params?.id as string

  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Load dashboard from localStorage
  useEffect(() => {
    if (!dashboardId) return

    // Check both 'dashboards' (individual) and 'enterprise_dashboards' (enterprise)
    const individualDashboards = localStorage.getItem('dashboards')
    const enterpriseDashboards = localStorage.getItem('enterprise_dashboards')
    
    let dashboard = null
    
    // Try individual dashboards first
    if (individualDashboards) {
      try {
        const parsed = JSON.parse(individualDashboards)
        dashboard = parsed.find((d: any) => d.id === dashboardId)
      } catch (error) {
        console.error('Error parsing individual dashboards:', error)
      }
    }
    
    // If not found, try enterprise dashboards
    if (!dashboard && enterpriseDashboards) {
      try {
        const parsed = JSON.parse(enterpriseDashboards)
        dashboard = parsed.find((d: any) => d.id === dashboardId)
      } catch (error) {
        console.error('Error parsing enterprise dashboards:', error)
      }
    }
    
    if (dashboard) {
      setDashboardData(dashboard)
    } else {
      // Dashboard not found, redirect to main dashboard
      router.push('/dashboard')
    }
  }, [dashboardId, router])

  useEffect(() => {
    const fetchBalance = async () => {
      if (connected && publicKey && connection) {
        try {
          const lamports = await connection.getBalance(publicKey)
          setBalance(lamports / 1e9)
        } catch (error) {
          console.error('Error fetching balance:', error)
        }
      }
      setLoading(false)
    }

    fetchBalance()
  }, [connected, publicKey, connection])

  // Update dashboard filters in localStorage
  const updateDashboardFilters = (updatedFilters: any[]) => {
    if (!dashboardData) return

    const updatedDashboard = {
      ...dashboardData,
      config: {
        ...dashboardData.config,
        filters: updatedFilters
      }
    }

    setDashboardData(updatedDashboard)

    // Determine which storage key to use
    const individualDashboards = localStorage.getItem('dashboards')
    const enterpriseDashboards = localStorage.getItem('enterprise_dashboards')
    
    // Check which storage contains this dashboard
    let storageKey = 'dashboards'
    if (individualDashboards) {
      try {
        const parsed = JSON.parse(individualDashboards)
        if (!parsed.find((d: any) => d.id === dashboardId)) {
          storageKey = 'enterprise_dashboards'
        }
      } catch (error) {
        console.error('Error parsing dashboards:', error)
      }
    }
    
    // Save to the correct localStorage key
    const savedDashboards = localStorage.getItem(storageKey)
    if (savedDashboards) {
      try {
        const parsed = JSON.parse(savedDashboards)
        const updatedDashboards = parsed.map((d: any) => 
          d.id === dashboardId ? updatedDashboard : d
        )
        localStorage.setItem(storageKey, JSON.stringify(updatedDashboards))
      } catch (error) {
        console.error('Error updating dashboards:', error)
      }
    }
  }

  // Remove filter
  const removeFilter = (index: number) => {
    const currentFilters = dashboardData?.config?.filters || []
    const updatedFilters = currentFilters.filter((_: any, i: number) => i !== index)
    updateDashboardFilters(updatedFilters)
  }

  // Delete stat
  const deleteStat = (index: number) => {
    if (!dashboardData) return

    const updatedStats = dashboardData.config.stats.filter((_: any, i: number) => i !== index)
    
    const updatedDashboard = {
      ...dashboardData,
      config: {
        ...dashboardData.config,
        stats: updatedStats
      }
    }

    setDashboardData(updatedDashboard)

    // Determine which storage key to use
    const individualDashboards = localStorage.getItem('dashboards')
    const enterpriseDashboards = localStorage.getItem('enterprise_dashboards')
    
    // Check which storage contains this dashboard
    let storageKey = 'dashboards'
    if (individualDashboards) {
      try {
        const parsed = JSON.parse(individualDashboards)
        if (!parsed.find((d: any) => d.id === dashboardId)) {
          storageKey = 'enterprise_dashboards'
        }
      } catch (error) {
        console.error('Error parsing dashboards:', error)
      }
    }
    
    // Save to the correct localStorage key
    const savedDashboards = localStorage.getItem(storageKey)
    if (savedDashboards) {
      try {
        const parsed = JSON.parse(savedDashboards)
        const updatedDashboards = parsed.map((d: any) => 
          d.id === dashboardId ? updatedDashboard : d
        )
        localStorage.setItem(storageKey, JSON.stringify(updatedDashboards))
      } catch (error) {
        console.error('Error updating dashboards:', error)
      }
    }
  }

  // Delete chart
  const deleteChart = (index: number) => {
    if (!dashboardData) return

    const updatedCharts = dashboardData.config.charts.filter((_: any, i: number) => i !== index)
    
    const updatedDashboard = {
      ...dashboardData,
      config: {
        ...dashboardData.config,
        charts: updatedCharts
      }
    }

    setDashboardData(updatedDashboard)

    // Determine which storage key to use
    const individualDashboards = localStorage.getItem('dashboards')
    const enterpriseDashboards = localStorage.getItem('enterprise_dashboards')
    
    // Check which storage contains this dashboard
    let storageKey = 'dashboards'
    if (individualDashboards) {
      try {
        const parsed = JSON.parse(individualDashboards)
        if (!parsed.find((d: any) => d.id === dashboardId)) {
          storageKey = 'enterprise_dashboards'
        }
      } catch (error) {
        console.error('Error parsing dashboards:', error)
      }
    }
    
    // Save to the correct localStorage key
    const savedDashboards = localStorage.getItem(storageKey)
    if (savedDashboards) {
      try {
        const parsed = JSON.parse(savedDashboards)
        const updatedDashboards = parsed.map((d: any) => 
          d.id === dashboardId ? updatedDashboard : d
        )
        localStorage.setItem(storageKey, JSON.stringify(updatedDashboards))
      } catch (error) {
        console.error('Error updating dashboards:', error)
      }
    }
  }

  // Only require wallet connection for individual users
  if (!isEnterprise && !connected) {
    return (
      <div className="pt-16 h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-indigo-50 to-cyan-50">
        <div className="text-center">
          <Wallet className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Please Connect Your Wallet</h2>
          <p className="text-gray-600">Connect your Solana wallet to access your dashboard</p>
        </div>
      </div>
    )
  }

  // Render loading state
  if (!dashboardData) {
    return (
      <div className="pt-16 h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-indigo-50 to-cyan-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="pt-16 flex bg-gradient-to-br from-purple-50 via-indigo-50 to-cyan-50 h-screen overflow-hidden">
        <DashboardSidebar onToggle={setSidebarOpen} />
        <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
          <DashboardTabs />
          <main className="flex-1 overflow-y-auto p-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Header */}
              <div>
                {isEnterprise && (
                  <Link 
                    href="/admin" 
                    className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition"
                  >
                    <ArrowLeft className="h-5 w-5" />
                    <span className="font-medium">Back to Admin</span>
                  </Link>
                )}
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{dashboardData.name}</h1>
                <p className="text-gray-600">
                  Welcome back! Here&apos;s your portfolio overview.
                </p>
              </div>

              {/* Stats Grid */}
              {dashboardData.config?.stats && dashboardData.config.stats.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {dashboardData.config.stats.map((stat: any, index: number) => {
                    const Icon = iconMap[stat.icon] || Coins
                    return (
                      <motion.div
                        key={stat.id || index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-2 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg">
                            <Icon className="h-6 w-6 text-purple-600" />
                          </div>
                          <div className="flex items-center space-x-2">
                            {stat.change && (
                              <span
                                className={`text-sm font-medium ${
                                  stat.trend === 'up'
                                    ? 'text-green-600'
                                    : stat.trend === 'down'
                                    ? 'text-red-600'
                                    : 'text-gray-600'
                                }`}
                              >
                                {stat.change}
                              </span>
                            )}
                            <button
                              onClick={() => deleteStat(index)}
                              className="text-gray-400 hover:text-red-500 transition p-1"
                              title="Delete stat"
                            >
                              <Trash className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                          <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
                             )}

               {/* Filters Section */}
               <motion.div
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
               >
                 <div className="flex items-center justify-between mb-4">
                   <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                   {dashboardData.config?.filters && dashboardData.config.filters.length > 0 ? (
                     <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                       {dashboardData.config.filters.length} active
                     </span>
                   ) : null}
                 </div>
                 {dashboardData.config?.filters && dashboardData.config.filters.length > 0 ? (
                   <div className="flex flex-wrap gap-3">
                                           {dashboardData.config.filters.map((filter: any, index: number) => {
                        const renderFilter = () => {
                          // Get icon for filter
                          const getIcon = () => {
                            if (filter.icon) return filter.icon
                            switch (filter.type) {
                              case 'date': return '📅'
                              case 'token': return '🪙'
                              case 'wallet': return '💼'
                              case 'amount': return '💰'
                              default: return '🔍'
                            }
                          }

                          // Get color classes
                          const getColorClasses = () => {
                            switch (filter.type) {
                              case 'date': return 'bg-purple-50 border-purple-200 text-purple-700'
                              case 'token': return 'bg-blue-50 border-blue-200 text-blue-700'
                              case 'wallet': return 'bg-green-50 border-green-200 text-green-700'
                              case 'amount': return 'bg-orange-50 border-orange-200 text-orange-700'
                              default: return 'bg-gray-50 border-gray-200 text-gray-700'
                            }
                          }

                          // If filter has options, render as dropdown
                          if (filter.options && filter.options.length > 0) {
                            return (
                              <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${getColorClasses()}`}>
                                <span>{getIcon()}</span>
                                <select
                                  value={filter.value || filter.options[0]}
                                  onChange={(e) => {
                                    const updatedFilters = [...(dashboardData.config?.filters || [])]
                                    updatedFilters[index].value = e.target.value
                                    updateDashboardFilters(updatedFilters)
                                  }}
                                  className="text-sm font-medium bg-transparent border-none outline-none cursor-pointer"
                                >
                                  {filter.options.map((option: string) => (
                                    <option key={option} value={option}>{option}</option>
                                  ))}
                                </select>
                              </div>
                            )
                          }

                          // Otherwise render as static badge (for custom filters)
                          return (
                            <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${getColorClasses()}`}>
                              <span>{getIcon()}</span>
                              <span className="text-sm font-medium">{filter.label}: {filter.value}</span>
                            </div>
                          )
                        }
                       
                       return (
                         <motion.div
                           key={filter.id || index}
                           initial={{ opacity: 0, scale: 0.9 }}
                           animate={{ opacity: 1, scale: 1 }}
                           transition={{ delay: index * 0.05 }}
                           className="flex items-center space-x-2"
                         >
                           {renderFilter()}
                           <button
                             onClick={() => removeFilter(index)}
                             className="text-gray-400 hover:text-red-500 transition p-1"
                           >
                             ×
                           </button>
                         </motion.div>
                       )
                     })}
                   </div>
                 ) : (
                   <div className="text-center py-8 text-gray-500">
                     <p className="text-sm">No filters applied</p>
                     <p className="text-xs mt-2">Use NLP commands to add filters (e.g., &quot;Show only wallets with more than 100 SOL&quot;)</p>
                   </div>
                 )}
               </motion.div>

               {/* Charts */}
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {dashboardData.config?.charts && dashboardData.config.charts.length > 0 ? (
                  dashboardData.config.charts.map((chart: any, index: number) => {
                    // Get filtered data
                    const getChartData = () => {
                      let filteredData: any[] = []
                      if (chart.dataSource === 'NFT') filteredData = [...nftData]
                      else if (chart.dataSource === 'Portfolio') filteredData = [...portfolioData]
                      else filteredData = [...portfolioData]

                      // Apply filters to data
                      const filters = dashboardData.config?.filters || []
                      filters.forEach((filter: any) => {
                        if (filter.type === 'date' && filter.value) {
                          // Filter by date based on filter value
                          const filterValue = filter.value.toLowerCase()
                          
                          // For demo purposes, simulate filtering
                          // In a real app, this would filter actual data based on timestamps
                          if (filterValue.includes('today')) {
                            // Show only recent data
                            filteredData = filteredData.slice(filteredData.length - 1)
                          } else if (filterValue.includes('yesterday')) {
                            // Show last 2 data points
                            filteredData = filteredData.slice(filteredData.length - 2)
                          } else if (filterValue.includes('last 7 days') || filterValue.includes('last week')) {
                            // Show last 7 data points
                            filteredData = filteredData.slice(-7)
                          } else if (filterValue.includes('last 30 days') || filterValue.includes('last month')) {
                            // Show last 30 data points
                            filteredData = filteredData.slice(-30)
                          } else if (filterValue.includes('last year')) {
                            // Show all data for last year
                            filteredData = filteredData.slice(-12)
                          }
                        } else if (filter.type === 'amount' && filter.value) {
                          // Filter by amount (simplified - would filter actual amount values)
                          // For demo, we'll apply a multiplier to values
                          const filterValue = filter.value.toLowerCase()
                          if (filterValue.includes('under')) {
                            filteredData = filteredData.map(d => ({ ...d, value: d.value * 0.8 }))
                          } else if (filterValue.includes('over')) {
                            filteredData = filteredData.map(d => ({ ...d, value: d.value * 1.2 }))
                          }
                        }
                      })

                      return filteredData
                    }

                    const chartData = getChartData()

                    const renderChart = () => {
                      const data = chartData
                      const xAxisKey = data[0] && 'name' in data[0] ? 'name' : 'date'
                      
                      if (chart.type === 'line') {
                        return (
                          <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={data}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis dataKey={xAxisKey} stroke="#6b7280" />
                              <YAxis stroke="#6b7280" />
                              <Tooltip />
                              <Line type="monotone" dataKey="value" stroke="#9333ea" strokeWidth={2} />
                            </LineChart>
                          </ResponsiveContainer>
                        )
                      }
                      
                      if (chart.type === 'bar') {
                        // Check if gradient is enabled
                        const hasGradient = dashboardData.config.chartConfig?.hasGradient
                        
                        return (
                          <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={data}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis dataKey={xAxisKey} stroke="#6b7280" />
                              <YAxis stroke="#6b7280" />
                              <Tooltip />
                              {hasGradient ? (
                                // Gradient bars: darker = higher value
                                <Bar dataKey="value">
                                  {data.map((entry: any, index: number) => {
                                    // Calculate min and max values for this specific data set
                                    const values = data.map((d: any) => d.value)
                                    const maxValue = Math.max(...values)
                                    const minValue = Math.min(...values)
                                    const valueRange = maxValue - minValue || 1
                                    
                                    // Calculate opacity based on value (highest = darkest = 1.0, lowest = lightest = 0.3)
                                    const normalizedValue = valueRange > 0 ? (entry.value - minValue) / valueRange : 0
                                    const opacity = 0.3 + (normalizedValue * 0.7)
                                    
                                    return <Cell key={`cell-${index}`} fill={`rgba(147, 51, 234, ${opacity})`} />
                                  })}
                                </Bar>
                              ) : (
                                <Bar dataKey="value" fill="#9333ea" />
                              )}
                            </BarChart>
                          </ResponsiveContainer>
                        )
                      }
                      
                      if (chart.type === 'pie') {
                        const COLORS = ['#9333ea', '#6366f1', '#ec4899', '#f59e0b']
                        return (
                          <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                              <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {data.map((entry: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        )
                      }
                      
                      if (chart.type === 'table' && data.length > 0) {
                        const columns = Object.keys(data[0])
                        return (
                          <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                              <thead>
                                <tr className="border-b border-gray-200 bg-gray-50">
                                  {columns.map((col) => (
                                    <th key={col} className="px-4 py-3 text-left font-semibold text-gray-900">
                                      {col.charAt(0).toUpperCase() + col.slice(1)}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {data.map((row: any, idx: number) => (
                                  <tr key={idx} className="hover:bg-gray-50 transition">
                                    {columns.map((col) => (
                                      <td key={col} className="px-4 py-3 text-gray-700">
                                        {String(row[col])}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )
                      }
                      
                      return <div className="text-center text-gray-500 p-8">Chart type: {chart.type}</div>
                    }

                    return (
                      <ChartWrapper
                        key={chart.id || index}
                        chart={chart}
                        chartIndex={index}
                        data={chartData}
                        renderChart={renderChart}
                        onDelete={deleteChart}
                        dashboardId={dashboardId}
                      />
                    )
                  })
                ) : (
                  <div className="col-span-2 bg-white p-12 rounded-xl shadow-sm border border-gray-200 text-center space-y-4">
                    <p className="text-gray-500 text-lg">No charts configured for this dashboard</p>
                  </div>
                )}
              </div>

              {/* Data Sources Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-purple-50 via-indigo-50 to-cyan-50 p-6 rounded-xl border border-purple-200"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Sources</h3>
                <div className="flex items-center justify-between p-4 bg-white rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Data Providers</p>
                    <p className="text-sm text-gray-500">Helius, Pyth Network, Jupiter API</p>
                  </div>
                  <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    Real-time
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </main>
        </div>
      </div>
      <Chatbot dashboardContext="overview" />
    </>
  )
}
