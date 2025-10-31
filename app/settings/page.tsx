'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useWallet } from '@solana/wallet-adapter-react'
import { 
  Settings, 
  Bell, 
  Shield, 
  Palette, 
  Database, 
  Zap,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  Trash2,
  Download,
  Upload
} from 'lucide-react'

interface SettingsData {
  notifications: {
    priceAlerts: boolean
    transactionAlerts: boolean
    nftAlerts: boolean
    defiAlerts: boolean
    emailNotifications: boolean
    pushNotifications: boolean
  }
  privacy: {
    showWalletAddress: boolean
    shareAnalytics: boolean
    dataRetention: string
  }
  appearance: {
    theme: string
    chartType: string
    language: string
  }
  data: {
    autoRefresh: boolean
    refreshInterval: number
    dataSources: string[]
  }
}

export default function SettingsPage() {
  const { connected, publicKey } = useWallet()
  const [activeTab, setActiveTab] = useState('notifications')
  const [settings, setSettings] = useState<SettingsData>({
    notifications: {
      priceAlerts: true,
      transactionAlerts: true,
      nftAlerts: false,
      defiAlerts: true,
      emailNotifications: true,
      pushNotifications: false
    },
    privacy: {
      showWalletAddress: true,
      shareAnalytics: false,
      dataRetention: '1year'
    },
    appearance: {
      theme: 'light',
      chartType: 'line',
      language: 'en'
    },
    data: {
      autoRefresh: true,
      refreshInterval: 30,
      dataSources: ['helius', 'jupiter']
    }
  })
  const [saving, setSaving] = useState(false)

  const tabs = [
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'data', label: 'Data', icon: Database }
  ]

  const handleSettingChange = (category: keyof SettingsData, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    localStorage.setItem('userSettings', JSON.stringify(settings))
    setSaving(false)
  }

  const handleExport = () => {
    const dataStr = JSON.stringify(settings, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'solana-analytics-settings.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target?.result as string)
          setSettings(importedSettings)
        } catch (error) {
          console.error('Error importing settings:', error)
        }
      }
      reader.readAsText(file)
    }
  }

  if (!connected) {
    return (
      <div className="pt-16 h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-indigo-50 to-cyan-50">
        <div className="text-center">
          <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Wallet</h2>
          <p className="text-gray-600">Connect your wallet to access settings</p>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-16 flex bg-gradient-to-br from-purple-50 via-indigo-50 to-cyan-50 min-h-screen">
      <main className="flex-1 p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
            <p className="text-gray-600">
              Customize your Solana Analytics experience
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
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Alert Preferences</h3>
                      <div className="space-y-4">
                        {Object.entries(settings.notifications).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between">
                            <div>
                              <label className="text-sm font-medium text-gray-900">
                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                              </label>
                              <p className="text-sm text-gray-500">
                                {key.includes('price') && 'Get notified about price changes'}
                                {key.includes('transaction') && 'Receive alerts for large transactions'}
                                {key.includes('nft') && 'Track NFT floor price changes'}
                                {key.includes('defi') && 'Monitor DeFi position changes'}
                                {key.includes('email') && 'Receive notifications via email'}
                                {key.includes('push') && 'Get push notifications in browser'}
                              </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={value}
                                onChange={(e) => handleSettingChange('notifications', key, e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
              </div>
            )}

                {/* Privacy Tab */}
                {activeTab === 'privacy' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacy Settings</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-sm font-medium text-gray-900">Show Wallet Address</label>
                            <p className="text-sm text-gray-500">Display your wallet address in the dashboard</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.privacy.showWalletAddress}
                              onChange={(e) => handleSettingChange('privacy', 'showWalletAddress', e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                          </label>
            </div>
            
                        <div className="flex items-center justify-between">
                  <div>
                            <label className="text-sm font-medium text-gray-900">Share Analytics</label>
                            <p className="text-sm text-gray-500">Help improve the platform by sharing anonymous usage data</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.privacy.shareAnalytics}
                              onChange={(e) => handleSettingChange('privacy', 'shareAnalytics', e.target.checked)}
                              className="sr-only peer"
                            />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                        <div>
                          <label className="text-sm font-medium text-gray-900 mb-2 block">Data Retention</label>
                          <select
                            value={settings.privacy.dataRetention}
                            onChange={(e) => handleSettingChange('privacy', 'dataRetention', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="1month">1 Month</option>
                            <option value="3months">3 Months</option>
                            <option value="6months">6 Months</option>
                            <option value="1year">1 Year</option>
                            <option value="forever">Forever</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Appearance Tab */}
                {activeTab === 'appearance' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Display Preferences</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-900 mb-2 block">Theme</label>
                          <div className="grid grid-cols-3 gap-3">
                            {['light', 'dark', 'auto'].map((theme) => (
                              <button
                                key={theme}
                                onClick={() => handleSettingChange('appearance', 'theme', theme)}
                                className={`p-3 rounded-lg border-2 transition ${
                                  settings.appearance.theme === theme
                                    ? 'border-purple-500 bg-purple-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <div className="text-sm font-medium capitalize">{theme}</div>
                              </button>
              ))}
            </div>
          </div>

                        <div>
                          <label className="text-sm font-medium text-gray-900 mb-2 block">Default Chart Type</label>
                          <select
                            value={settings.appearance.chartType}
                            onChange={(e) => handleSettingChange('appearance', 'chartType', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="line">Line Chart</option>
                            <option value="bar">Bar Chart</option>
                            <option value="area">Area Chart</option>
                            <option value="pie">Pie Chart</option>
                          </select>
            </div>
            
                        <div>
                          <label className="text-sm font-medium text-gray-900 mb-2 block">Language</label>
                          <select
                            value={settings.appearance.language}
                            onChange={(e) => handleSettingChange('appearance', 'language', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="en">English</option>
                            <option value="es">Spanish</option>
                            <option value="fr">French</option>
                            <option value="de">German</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Data Tab */}
                {activeTab === 'data' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Management</h3>
            <div className="space-y-4">
                        <div className="flex items-center justify-between">
              <div>
                            <label className="text-sm font-medium text-gray-900">Auto Refresh</label>
                            <p className="text-sm text-gray-500">Automatically refresh data in the background</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                <input
                              type="checkbox"
                              checked={settings.data.autoRefresh}
                              onChange={(e) => handleSettingChange('data', 'autoRefresh', e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                          </label>
              </div>

              <div>
                          <label className="text-sm font-medium text-gray-900 mb-2 block">Refresh Interval (seconds)</label>
                <input
                            type="number"
                            value={settings.data.refreshInterval}
                            onChange={(e) => handleSettingChange('data', 'refreshInterval', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            min="10"
                            max="300"
                />
              </div>

              <div>
                          <label className="text-sm font-medium text-gray-900 mb-2 block">Data Sources</label>
                          <div className="space-y-2">
                            {['helius', 'jupiter', 'raydium'].map((source) => (
                              <label key={source} className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={settings.data.dataSources.includes(source)}
                                  onChange={(e) => {
                                    const newSources = e.target.checked
                                      ? [...settings.data.dataSources, source]
                                      : settings.data.dataSources.filter(s => s !== source)
                                    handleSettingChange('data', 'dataSources', newSources)
                                  }}
                                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-700 capitalize">{source}</span>
                </label>
                            ))}
              </div>
              </div>
            </div>
            </div>
          </div>
                )}

                {/* Action Buttons */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={handleExport}
                        className="flex items-center px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 transition"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export Settings
                      </button>
                      <label className="flex items-center px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 transition cursor-pointer">
                        <Upload className="h-4 w-4 mr-2" />
                        Import Settings
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleImport}
                          className="hidden"
                        />
                      </label>
            </div>
            
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center px-6 py-2 bg-solana-gradient text-white rounded-lg hover:shadow-lg transition disabled:opacity-50"
                    >
                      {saving ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}