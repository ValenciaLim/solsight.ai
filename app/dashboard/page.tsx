'use client'

import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import DashboardTabs from '../components/DashboardTabs'
import DashboardSidebar from '../components/DashboardSidebar'
import Chatbot from '../components/Chatbot'
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
import { Wallet, TrendingUp, TrendingDown, Coins, LayoutDashboard, BarChart3, Target, Activity } from 'lucide-react'

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
import { generateDashboardConfig, DashboardConfig, OnboardingData } from '../lib/dashboardGenerator'

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

export default function Dashboard() {
  const { connected, publicKey } = useWallet()
  const { connection } = useConnection()
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig | null>(null)
  const [dashboards, setDashboards] = useState<any[]>([])

  // Load dashboards from localStorage
  useEffect(() => {
    const savedDashboards = localStorage.getItem('dashboards')
    if (savedDashboards) {
      try {
        const parsed = JSON.parse(savedDashboards)
        setDashboards(parsed)
      } catch (error) {
        console.error('Error parsing dashboards:', error)
      }
    }
  }, [])

  useEffect(() => {
    // Load onboarding data and generate dashboard config
    const loadDashboardConfig = () => {
      const onboardingData = localStorage.getItem('onboardingData')
      if (onboardingData) {
        try {
          const data: OnboardingData = JSON.parse(onboardingData)
          const config = generateDashboardConfig(data)
          setDashboardConfig(config)
        } catch (error) {
          console.error('Error parsing onboarding data:', error)
        }
      }
    }

    loadDashboardConfig()
  }, [])

  useEffect(() => {
    const fetchBalance = async () => {
      if (connected && publicKey && connection) {
        try {
          // Fetch SOL balance
          const lamports = await connection.getBalance(publicKey)
          setBalance(lamports / 1e9) // Convert lamports to SOL
          
          // TODO: Integrate with Helius API for enhanced wallet data
          // TODO: Fetch token balances via Helius or Jupiter API
          // TODO: Fetch NFT holdings via Helius
          // TODO: Fetch DeFi positions via Jupiter API
        } catch (error) {
          console.error('Error fetching balance:', error)
        }
      }
      setLoading(false)
    }

    fetchBalance()
  }, [connected, publicKey, connection])

  if (!connected) {
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

  return (
    <>
    <div className="pt-16 flex bg-gradient-to-br from-purple-50 via-indigo-50 to-cyan-50 min-h-[calc(100vh-4rem)]">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col ml-64 min-h-[calc(100vh-4rem)]">
        <DashboardTabs />
        <main className="flex-1 flex items-center justify-center overflow-y-auto">
        {dashboards.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8 text-sm text-gray-500"
          >
            <LayoutDashboard className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No dashboards yet</p>
            <p className="text-xs">Create your first dashboard</p>
          </motion.div>
        ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8 w-full p-8"
        >
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">
              Welcome back! Here&apos;s your portfolio overview.
            </p>
          </div>

          {/* Stats Grid */}
          {dashboardConfig?.stats && dashboardConfig.stats.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {dashboardConfig.stats.map((stat, index) => {
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

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {dashboardConfig?.charts && dashboardConfig.charts.length > 0 ? (
              dashboardConfig.charts.map((chart, index) => {
                // Get mock data based on chart dataSource
                const getChartData = () => {
                  if (chart.dataSource === 'NFT') return nftData
                  if (chart.dataSource === 'Portfolio') return portfolioData
                  return portfolioData // default
                }

                const renderChart = () => {
                  const data = getChartData()
                  
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
                    return (
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={data}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey={xAxisKey} stroke="#6b7280" />
                          <YAxis stroke="#6b7280" />
                          <Tooltip />
                          <Bar dataKey="value" fill="#9333ea" />
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
                            {data.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    )
                  }
                  
                  return <div className="text-center text-gray-500 p-8">Chart type: {chart.type}</div>
                }

                return (
                  <motion.div
                    key={chart.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">{chart.title}</h3>
                    {renderChart()}
            </motion.div>
                )
              })
            ) : (
              <div className="col-span-2 bg-white p-12 rounded-xl shadow-sm border border-gray-200 text-center space-y-4">
                <p className="text-gray-500 text-lg">Complete onboarding to generate your dashboard</p>
                <Link 
                  href="/create-dashboard"
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-solana-gradient text-white rounded-lg hover:shadow-lg transition font-medium"
                >
                  <span>Create Dashboard</span>
                </Link>
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
        )}
      </main>
      </div>
    </div>
      <Chatbot />
    </>
  )
}
