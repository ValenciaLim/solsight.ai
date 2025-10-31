'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import DashboardSidebar from '../components/DashboardSidebar'
import DashboardTabs from '../components/DashboardTabs'
import Chatbot from '../components/Chatbot'
import { 
  Building2, 
  Users, 
  BarChart3, 
  Shield, 
  TrendingUp, 
  Target,
  Zap,
  Settings,
  Plus,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  Bell,
  FileText,
  Wallet,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface DashboardTemplate {
  id: string
  name: string
  description: string
  category: 'government' | 'financial' | 'dao'
  metrics: string[]
  charts: string[]
}

interface Wallet {
  id: string
  address: string
  name: string
  type: 'treasury' | 'operations' | 'investment'
  balance: number
  lastActivity: Date
}

const templates: DashboardTemplate[] = [
  {
    id: 'gov-compliance',
    name: 'Government/Regulatory Compliance',
    description: 'Monitor compliance KPIs and suspicious activity patterns',
    category: 'government',
    metrics: ['Suspicious Transactions', 'Compliance Score', 'Risk Level', 'Audit Trail'],
    charts: ['Transaction Timeline', 'Risk Distribution', 'Compliance Trends']
  },
  {
    id: 'financial-institution',
    name: 'Financial Institution',
    description: 'Portfolio aggregation and token distribution analysis',
    category: 'financial',
    metrics: ['Total AUM', 'Token Distribution', 'Yield Generated', 'Risk Metrics'],
    charts: ['Portfolio Allocation', 'Yield Trends', 'Risk Analysis']
  },
  {
    id: 'dao-community',
    name: 'DAO/Community Organization',
    description: 'NFT movement and treasury analytics for decentralized organizations',
    category: 'dao',
    metrics: ['Treasury Balance', 'NFT Holdings', 'Community Activity', 'Proposal Success Rate'],
    charts: ['Treasury Flow', 'NFT Floor Prices', 'Voting Patterns']
  }
]

const mockWallets: Wallet[] = [
  {
    id: '1',
    address: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
    name: 'Main Treasury',
    type: 'treasury',
    balance: 1250000,
    lastActivity: new Date()
  },
  {
    id: '2',
    address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    name: 'Operations Wallet',
    type: 'operations',
    balance: 45000,
    lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000)
  },
  {
    id: '3',
    address: '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1',
    name: 'Investment Fund',
    type: 'investment',
    balance: 890000,
    lastActivity: new Date(Date.now() - 24 * 60 * 60 * 1000)
  }
]

const portfolioData = [
  { name: 'SOL', value: 60, color: '#9333ea' },
  { name: 'USDC', value: 25, color: '#3b82f6' },
  { name: 'Other Tokens', value: 10, color: '#06b6d4' },
  { name: 'NFTs', value: 5, color: '#10b981' }
]

const activityData = [
  { date: 'Mon', transactions: 45, volume: 125000 },
  { date: 'Tue', transactions: 52, volume: 180000 },
  { date: 'Wed', transactions: 38, volume: 95000 },
  { date: 'Thu', transactions: 61, volume: 220000 },
  { date: 'Fri', transactions: 48, volume: 165000 },
  { date: 'Sat', transactions: 35, volume: 85000 },
  { date: 'Sun', transactions: 42, volume: 140000 }
]

interface AIAgent {
  id: string
  name: string
  description: string
  apiKey: string
  status: 'connected' | 'disconnected'
}

interface Alert {
  id: string
  type: 'warning' | 'info' | 'critical'
  title: string
  description: string
  timestamp: Date
  resolved: boolean
}

interface Report {
  id: string
  title: string
  generatedAt: Date
  data: any
}

export default function AdminPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('wallets')
  const [wallets, setWallets] = useState<Wallet[]>(mockWallets)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [showAddWallet, setShowAddWallet] = useState(false)
  const [newWallet, setNewWallet] = useState({ name: '', address: '', type: 'treasury' as const })
  const [showAIAgentModal, setShowAIAgentModal] = useState(false)
  const [aiAgent, setAiAgent] = useState({ name: '', description: '', apiKey: '' })
  const [connectedAgents, setConnectedAgents] = useState<AIAgent[]>([])
  const [dashboards, setDashboards] = useState<any[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Check for dashboard query parameter and switch to dashboards tab
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const dashboardId = params.get('dashboard')
    if (dashboardId) {
      setActiveTab('dashboards')
      // Optionally scroll to or highlight the newly created dashboard
    }
  }, [])

  // Load dashboards from localStorage (enterprise-specific)
  useEffect(() => {
    const loadDashboards = () => {
      const savedDashboards = localStorage.getItem('enterprise_dashboards')
      if (savedDashboards) {
        try {
          setDashboards(JSON.parse(savedDashboards))
        } catch (error) {
          console.error('Error loading enterprise dashboards:', error)
        }
      }
    }
    
    // Load on mount
    loadDashboards()
    
    // Also listen for storage events (in case dashboard is created in another tab)
    window.addEventListener('storage', loadDashboards)
    
    return () => {
      window.removeEventListener('storage', loadDashboards)
    }
  }, [])
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: '1',
      type: 'critical',
      title: 'Market Concentration Spike',
      description: 'SOL concentration in top 3 wallets increased by 15% in last 24 hours',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      resolved: false
    },
    {
      id: '2',
      type: 'warning',
      title: 'NFT Floor Drop Detected',
      description: 'Bored Ape Yacht Club floor price dropped 8% below 7-day average',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      resolved: false
    },
    {
      id: '3',
      type: 'info',
      title: 'High Transaction Volume',
      description: 'Transaction volume exceeded daily average by 200%',
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
      resolved: true
    }
  ])
  const [reports, setReports] = useState<Report[]>([])

  const tabs = [
    { id: 'wallets', label: 'Wallets', icon: Wallet },
    { id: 'agents', label: 'Agents', icon: Zap },
    { id: 'dashboards', label: 'Dashboards', icon: Target },
    { id: 'settings', label: 'Settings', icon: Settings }
  ]

  const handleAddWallet = () => {
    if (newWallet.name && newWallet.address) {
      const wallet: Wallet = {
        id: Date.now().toString(),
        address: newWallet.address,
        name: newWallet.name,
        type: newWallet.type,
        balance: 0,
        lastActivity: new Date()
      }
      setWallets([...wallets, wallet])
      setNewWallet({ name: '', address: '', type: 'treasury' })
      setShowAddWallet(false)
    }
  }

  const handleDeleteWallet = (id: string) => {
    setWallets(wallets.filter(wallet => wallet.id !== id))
  }

  const handleCreateDashboard = (templateId: string) => {
    setSelectedTemplate(templateId)
    // In a real app, this would create a new dashboard
    console.log('Creating dashboard with template:', templateId)
  }

  const handleConnectAIAgent = () => {
    if (aiAgent.name && aiAgent.apiKey) {
      const newAgent: AIAgent = {
        id: Date.now().toString(),
        name: aiAgent.name,
        description: aiAgent.description,
        apiKey: aiAgent.apiKey,
        status: 'connected'
      }
      setConnectedAgents([...connectedAgents, newAgent])
      setAiAgent({ name: '', description: '', apiKey: '' })
      setShowAIAgentModal(false)
    }
  }

  const handleDisconnectAgent = (id: string) => {
    setConnectedAgents(connectedAgents.filter(agent => agent.id !== id))
  }

  const handleResolveAlert = (id: string) => {
    setAlerts(alerts.map(alert => 
      alert.id === id ? { ...alert, resolved: true } : alert
    ))
  }

  const handleGenerateReport = async () => {
    // Mock AI-generated report
    const report: Report = {
      id: Date.now().toString(),
      title: `Research Report - ${new Date().toLocaleDateString()}`,
      generatedAt: new Date(),
      data: {
        summary: 'This report analyzes your Solana portfolio performance over the past week, highlighting key trends in token distribution, NFT holdings, and transaction patterns.',
        keyInsights: [
          'Total portfolio value increased by 15%',
          'SOL remains dominant at 60% allocation',
          'NFT floor prices showing upward trend',
          'Transaction volume above average'
        ],
        charts: portfolioData.map(item => ({
          asset: item.name,
          allocation: item.value,
          color: item.color
        })),
        recommendations: [
          'Consider diversifying into stablecoins for risk management',
          'Monitor NFT market volatility closely',
          'Review transaction patterns for compliance'
        ]
      }
    }
    setReports([...reports, report])
    
    // Trigger download
    const blob = new Blob([JSON.stringify(report.data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${report.title}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="pt-16 flex bg-gradient-to-br from-purple-50 via-indigo-50 to-cyan-50 min-h-screen">
      <main className="flex-1 p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto"
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Advanced Features</h1>
            <p className="text-gray-600">
              Manage your Solana analytics, wallets, and AI agents
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                        activeTab === tab.id
                          ? 'bg-solana-gradient text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  )
                })}
              </nav>
            </div>

            {/* Content */}
            <div className="lg:col-span-3">
              {/* Overview Tab */}
              {/* Alerts Tab */}
              {activeTab === 'alerts' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Alerts & Notifications</h3>
                    <button
                      onClick={handleGenerateReport}
                      className="flex items-center px-4 py-2 bg-solana-gradient text-white rounded-lg hover:shadow-lg transition"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Generate Report
                    </button>
                    </div>

                  {/* Active Alerts */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold text-gray-900">Active Alerts</h4>
                    {alerts.filter(a => !a.resolved).map((alert) => (
                      <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-4 rounded-lg border-l-4 ${
                          alert.type === 'critical' 
                            ? 'bg-red-50 border-red-500'
                            : alert.type === 'warning'
                            ? 'bg-yellow-50 border-yellow-500'
                            : 'bg-blue-50 border-blue-500'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            {alert.type === 'critical' && <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />}
                            {alert.type === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />}
                            {alert.type === 'info' && <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />}
                            <div>
                              <h5 className="font-semibold text-gray-900">{alert.title}</h5>
                              <p className="text-sm text-gray-700 mt-1">{alert.description}</p>
                              <p className="text-xs text-gray-500 mt-2">
                                {alert.timestamp.toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleResolveAlert(alert.id)}
                            className="px-3 py-1 text-sm bg-white rounded-lg border border-gray-300 hover:bg-gray-50 transition"
                          >
                            Resolve
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Resolved Alerts */}
                  {alerts.filter(a => a.resolved).length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-md font-semibold text-gray-900">Resolved Alerts</h4>
                      {alerts.filter(a => a.resolved).map((alert) => (
                        <motion.div
                          key={alert.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="p-4 rounded-lg bg-gray-50 border border-gray-200 opacity-60"
                        >
                          <div className="flex items-start space-x-3">
                            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                              <h5 className="font-semibold text-gray-900">{alert.title}</h5>
                              <p className="text-sm text-gray-700 mt-1">{alert.description}</p>
                              <p className="text-xs text-gray-500 mt-2">
                                {alert.timestamp.toLocaleString()}
                              </p>
                            </div>
                  </div>
                </motion.div>
                      ))}
          </div>
                  )}

                  {/* Recent Reports */}
                  {reports.length > 0 && (
                    <div className="mt-8">
                      <h4 className="text-md font-semibold text-gray-900 mb-4">Recent Reports</h4>
                      <div className="space-y-3">
                        {reports.map((report) => (
                          <div
                            key={report.id}
                            className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200"
                          >
                            <div>
                              <h5 className="font-semibold text-gray-900">{report.title}</h5>
                              <p className="text-sm text-gray-500">
                                Generated: {report.generatedAt.toLocaleString()}
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                const blob = new Blob([JSON.stringify(report.data, null, 2)], { type: 'application/json' })
                                const url = URL.createObjectURL(blob)
                                const link = document.createElement('a')
                                link.href = url
                                link.download = `${report.title}.json`
                                link.click()
                                URL.revokeObjectURL(url)
                              }}
                              className="p-2 text-gray-400 hover:text-purple-600 transition"
                            >
                              <Download className="h-5 w-5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Agents Tab */}
              {activeTab === 'agents' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Agent Integration</h3>
                      <p className="text-gray-600">
                        Connect external AI agents for advanced analytics and automation
                      </p>
                    </div>
                    <button
                      onClick={() => setShowAIAgentModal(true)}
                      className="flex items-center space-x-2 px-4 py-2 bg-solana-gradient text-white rounded-lg hover:shadow-lg transition"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Connect AI Agent</span>
                    </button>
                  </div>

                  {/* Connected Agents */}
                  {connectedAgents.length > 0 ? (
                    <div className="space-y-3">
                      {connectedAgents.map((agent) => (
                        <div key={agent.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                                <Zap className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">{agent.name}</h4>
                                <p className="text-sm text-gray-600">{agent.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center space-x-2">
                                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                                <span>Connected</span>
                              </span>
                              <button
                                onClick={() => handleDisconnectAgent(agent.id)}
                                className="p-2 text-gray-400 hover:text-red-600 transition"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </div>
            </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                      <Zap className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">No AI agents connected</p>
                      <button
                        onClick={() => setShowAIAgentModal(true)}
                        className="px-4 py-2 bg-solana-gradient text-white rounded-lg hover:shadow-lg transition"
                      >
                        Connect Your First Agent
                      </button>
                    </div>
                  )}
          </div>
              )}

              {/* Wallets Tab */}
              {activeTab === 'wallets' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Managed Wallets</h3>
                    <button
                      onClick={() => setShowAddWallet(true)}
                      className="flex items-center px-4 py-2 bg-solana-gradient text-white rounded-lg hover:shadow-lg transition"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Wallet
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {wallets.map((wallet) => (
                      <motion.div
                        key={wallet.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg">
                              <Target className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{wallet.name}</h4>
                              <p className="text-sm text-gray-600 font-mono">
                                {wallet.address.slice(0, 8)}...{wallet.address.slice(-8)}
                              </p>
                              <p className="text-sm text-gray-500 capitalize">{wallet.type}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold text-gray-900">
                              ${wallet.balance.toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-500">
                              Last activity: {wallet.lastActivity.toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button className="p-2 text-gray-400 hover:text-blue-600 transition">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button className="p-2 text-gray-400 hover:text-green-600 transition">
                              <Edit className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteWallet(wallet.id)}
                              className="p-2 text-gray-400 hover:text-red-600 transition"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Add Wallet Modal */}
                  {showAddWallet && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    >
                      <div className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Wallet</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Wallet Name</label>
                            <input
                              type="text"
                              value={newWallet.name}
                              onChange={(e) => setNewWallet({ ...newWallet, name: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                              placeholder="Enter wallet name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Wallet Address</label>
                            <input
                              type="text"
                              value={newWallet.address}
                              onChange={(e) => setNewWallet({ ...newWallet, address: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                              placeholder="Enter Solana wallet address"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Wallet Type</label>
                            <select
                              value={newWallet.type}
                              onChange={(e) => setNewWallet({ ...newWallet, type: e.target.value as any })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                              <option value="treasury">Treasury</option>
                              <option value="operations">Operations</option>
                              <option value="investment">Investment</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex justify-end space-x-3 mt-6">
                          <button
                            onClick={() => setShowAddWallet(false)}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleAddWallet}
                            className="px-4 py-2 bg-solana-gradient text-white rounded-lg hover:shadow-lg transition"
                          >
                            Add Wallet
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Dashboards Tab */}
              {activeTab === 'dashboards' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Your Dashboards</h3>
                    <button
                      onClick={() => router.push('/create-dashboard')}
                      className="flex items-center px-4 py-2 bg-solana-gradient text-white rounded-lg hover:shadow-lg transition"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Dashboard
                    </button>
                  </div>

                  {dashboards.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {dashboards.map((dashboard) => (
                      <motion.div
                          key={dashboard.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition"
                      >
                          <div className="flex items-start justify-between mb-4">
                          <div>
                              <h4 className="font-semibold text-gray-900">{dashboard.name}</h4>
                              <p className="text-sm text-gray-600 mt-1">
                                Created {new Date(dashboard.createdAt || Date.now()).toLocaleDateString()}
                              </p>
                          </div>
                        </div>
                        
                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <span>Charts: {dashboard.config?.charts?.length || 0}</span>
                            <button
                              onClick={() => {
                                // Navigate to the dashboard view
                                router.push(`/dashboard/${dashboard.id}`)
                              }}
                              className="px-3 py-1 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                            >
                              Open
                            </button>
                          </div>
                        </motion.div>
                ))}
              </div>
                  ) : (
                    <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                      <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">No dashboards created yet</p>
                        <button
                        onClick={() => router.push('/create-dashboard')}
                        className="px-4 py-2 bg-solana-gradient text-white rounded-lg hover:shadow-lg transition"
                        >
                        Create Your First Dashboard
                        </button>
                  </div>
                  )}
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Organization Settings</h3>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Organization Name</label>
                        <input
                          type="text"
                          defaultValue="Acme Corporation"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                          <option>Financial Services</option>
                          <option>Technology</option>
                          <option>Healthcare</option>
                          <option>Government</option>
                          <option>Other</option>
                        </select>
                      </div>
                      
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Compliance Level</label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                          <option>Standard</option>
                          <option>Enhanced</option>
                          <option>Maximum</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <button className="bg-solana-gradient text-white px-6 py-2 rounded-lg hover:shadow-lg transition">
                        Save Settings
                      </button>
                    </div>
                  </div>
              </div>
              )}
            </div>
          </div>

          {/* AI Agent Modal */}
          {showAIAgentModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            >
              <div className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Connect AI Agent</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Agent Name</label>
                    <input
                      type="text"
                      value={aiAgent.name}
                      onChange={(e) => setAiAgent({ ...aiAgent, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="e.g., Trading Bot Agent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={aiAgent.description}
                      onChange={(e) => setAiAgent({ ...aiAgent, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Describe the agent's purpose..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
                    <input
                      type="password"
                      value={aiAgent.apiKey}
                      onChange={(e) => setAiAgent({ ...aiAgent, apiKey: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Enter API key"
                    />
                    <p className="text-xs text-gray-500 mt-1">For demonstration purposes only</p>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowAIAgentModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConnectAIAgent}
                    className="px-4 py-2 bg-solana-gradient text-white rounded-lg hover:shadow-lg transition"
                  >
                    Connect Agent
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  )
}