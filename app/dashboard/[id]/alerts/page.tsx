'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useWallet } from '@solana/wallet-adapter-react'
import { useParams, useRouter } from 'next/navigation'
import DashboardTabs from '../../../components/DashboardTabs'
import DashboardSidebar from '../../../components/DashboardSidebar'
import Chatbot from '../../../components/Chatbot'
import { useAuth } from '../../../providers/AuthProvider'
import { useWhaleData } from '../../../hooks/useWhaleData'
import { 
  Bell, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Shield,
  Zap,
  Target,
  Clock,
  Settings,
  Filter,
  Search,
  Check,
  X,
  Plus,
  MessageSquare,
  Sparkles
} from 'lucide-react'

interface Alert {
  id: string
  type: 'pattern' | 'anomaly' | 'threshold' | 'trend'
  severity: 'high' | 'medium' | 'low'
  title: string
  description: string
  condition: string
  recommendation: string
  timestamp: Date
  read: boolean
  acknowledged: boolean
  status: 'active' | 'acknowledged' | 'resolved'
}

export default function AlertsPage() {
  const { connected } = useWallet()
  const { isEnterprise } = useAuth()
  const params = useParams()
  const router = useRouter()
  const dashboardId = params?.id as string
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loading, setLoading] = useState(false)
  const [showExplainModal, setShowExplainModal] = useState<string | null>(null)
  const [explanation, setExplanation] = useState<string>('')

  // Initialize whale data hook
  const { whaleData } = useWhaleData(true)

  // Load dashboard from localStorage
  useEffect(() => {
    if (dashboardId) {
      const individualDashboards = localStorage.getItem('dashboards')
      const enterpriseDashboards = localStorage.getItem('enterprise_dashboards')
      
      let dashboard = null
      
      if (individualDashboards) {
        try {
          const parsed = JSON.parse(individualDashboards)
          dashboard = parsed.find((d: any) => d.id === dashboardId)
        } catch (error) {
          console.error('Error parsing individual dashboards:', error)
        }
      }
      
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
        // Don't auto-generate alerts on navigation - only when user clicks "Generate Alert" button
      } else {
        router.push('/dashboard')
      }
    }
  }, [dashboardId, router])

  const generateAIAlerts = async (dashboard: any) => {
    setLoading(true)
    try {
      const response = await fetch('/api/ai-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dashboardData: dashboard, whaleData }),
      })
      
      if (response.ok) {
        const data = await response.json()
        const newAlert: Alert = {
          id: Date.now().toString(),
          type: data.alert.type,
          severity: data.alert.severity,
          title: data.alert.title,
          description: data.alert.description,
          condition: data.alert.condition,
          recommendation: data.alert.recommendation,
          timestamp: new Date(data.alert.timestamp || Date.now()),
          read: false,
          acknowledged: false,
          status: 'active',
        }
        setAlerts(prev => [newAlert, ...prev])
      }
    } catch (error) {
      console.error('Error generating alert:', error)
    } finally {
      setLoading(false)
    }
  }

  const explainAlert = async (alert: Alert) => {
    setShowExplainModal(alert.id)
    setLoading(true)
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `Explain this alert in detail: ${alert.title}. Condition: ${alert.condition}. ${alert.description}. Provide context and implications.`,
            },
          ],
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        setExplanation(data.response || 'Unable to generate explanation.')
      }
    } catch (error) {
      console.error('Error explaining alert:', error)
      setExplanation('Unable to generate explanation at this time.')
    } finally {
      setLoading(false)
    }
  }

  const acknowledgeAlert = (id: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, acknowledged: true, status: 'acknowledged' as const, read: true } : alert
    ))
  }

  const markAsRead = (id: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, read: true } : alert
    ))
  }

  const markAllAsRead = () => {
    setAlerts(prev => prev.map(alert => ({ ...alert, read: true })))
  }

  const deleteAlert = (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id))
  }

  const filteredAlerts = alerts.filter(alert => {
    const matchesFilter = filter === 'all' || alert.type === filter || alert.severity === filter
    const matchesSearch = alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesUnread = !showUnreadOnly || !alert.read
    return matchesFilter && matchesSearch && matchesUnread
  })

  const unreadCount = alerts.filter(alert => !alert.read).length
  const activeAlerts = alerts.filter(alert => alert.status === 'active').length

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'pattern': return Target
      case 'anomaly': return AlertTriangle
      case 'threshold': return TrendingUp
      case 'trend': return TrendingDown
      default: return Bell
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      default: return 'text-blue-600 bg-blue-50 border-blue-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-red-100 text-red-700'
      case 'acknowledged': return 'bg-yellow-100 text-yellow-700'
      case 'resolved': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  // Only require wallet connection for individual users
  if (!isEnterprise && !connected) {
    return (
      <div className="pt-16 h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-indigo-50 to-cyan-50">
        <div className="text-center">
          <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Wallet</h2>
          <p className="text-gray-600">Connect your wallet to access alerts</p>
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
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {dashboardData ? `${dashboardData.name} - Alerts` : 'Alerts & Notifications'}
                  </h1>
                  <p className="text-gray-600">
                    AI-generated alerts based on your dashboard activity
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  {activeAlerts > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="flex items-center px-4 py-2 bg-solana-gradient text-white rounded-lg hover:shadow-lg transition"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Mark All Read
                    </button>
                  )}
                  <button
                    onClick={() => dashboardData && generateAIAlerts(dashboardData)}
                    disabled={loading}
                    className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Generate Alert
                  </button>
                </div>
              </div>

              {/* AI Summary Panel */}
              {activeAlerts > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-purple-50 via-indigo-50 to-cyan-50 p-6 rounded-xl border border-purple-200"
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    <h3 className="text-lg font-semibold text-gray-900">AI Summary</h3>
                  </div>
                  <p className="text-gray-700">
                    {activeAlerts} active alert{activeAlerts > 1 ? 's' : ''} detected in your dashboard.
                    {unreadCount > 0 && ` ${unreadCount} unread alert${unreadCount > 1 ? 's' : ''} requiring attention.`}
                  </p>
                </motion.div>
              )}

              {/* Filters and Search */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search alerts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Filter */}
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="all">All Types</option>
                      <option value="pattern">Pattern</option>
                      <option value="anomaly">Anomaly</option>
                      <option value="threshold">Threshold</option>
                      <option value="trend">Trend</option>
                      <option value="high">High Severity</option>
                      <option value="medium">Medium Severity</option>
                      <option value="low">Low Severity</option>
                    </select>
                  </div>

                  {/* Unread Toggle */}
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={showUnreadOnly}
                      onChange={(e) => setShowUnreadOnly(e.target.checked)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Unread only</span>
                  </label>
                </div>
              </div>

              {/* Alerts List */}
              <div className="space-y-4">
                {loading && filteredAlerts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Generating alerts...</p>
                  </div>
                ) : filteredAlerts.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No alerts found</h3>
                    <p className="text-gray-500 mb-4">Try adjusting your filters or generating new alerts</p>
                    {dashboardData && (
                      <button
                        onClick={() => generateAIAlerts(dashboardData)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                      >
                        Generate Alert
                      </button>
                    )}
                  </div>
                ) : (
                  filteredAlerts.map((alert, index) => {
                    const Icon = getAlertIcon(alert.type)
                    return (
                      <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition ${
                          !alert.read ? 'ring-2 ring-purple-100' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4 flex-1">
                            <div className={`p-2 rounded-lg ${getSeverityColor(alert.severity)}`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {alert.title}
                                </h3>
                                {!alert.read && (
                                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                )}
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                                  {alert.severity}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(alert.status)}`}>
                                  {alert.status}
                                </span>
                                <span className="text-xs font-medium text-gray-600">
                                  {alert.type}
                                </span>
                              </div>
                              
                              <p className="text-gray-600 mb-2">
                                {alert.description}
                              </p>
                              
                              {alert.condition && (
                                <div className="p-3 bg-blue-50 rounded-lg mb-3">
                                  <p className="text-sm text-blue-800">
                                    <strong>Condition:</strong> {alert.condition}
                                  </p>
                                </div>
                              )}
                              
                              {alert.recommendation && (
                                <div className="p-3 bg-green-50 rounded-lg mb-3">
                                  <p className="text-sm text-green-800">
                                    <strong>Recommendation:</strong> {alert.recommendation}
                                  </p>
                                </div>
                              )}
                              
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-4 w-4" />
                                  <span>{alert.timestamp.toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-4">
                            {!alert.acknowledged && (
                              <button
                                onClick={() => acknowledgeAlert(alert.id)}
                                className="p-2 text-gray-400 hover:text-green-600 transition"
                                title="Acknowledge alert"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => explainAlert(alert)}
                              className="p-2 text-gray-400 hover:text-purple-600 transition"
                              title="Explain alert"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteAlert(alert.id)}
                              className="p-2 text-gray-400 hover:text-red-600 transition"
                              title="Delete alert"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })
                )}
              </div>
            </motion.div>
          </main>
        </div>
      </div>

      {/* Explain Alert Modal */}
      {showExplainModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 w-full max-w-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">AI Explanation</h2>
              <button
                onClick={() => {
                  setShowExplainModal(null)
                  setExplanation('')
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Generating explanation...</p>
              </div>
            ) : (
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{explanation}</p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </>
  )
}
