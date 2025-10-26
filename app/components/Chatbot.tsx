'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MessageCircle, Bot, User, Loader2, ChevronLeft } from 'lucide-react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'

interface ChatbotProps {
  dashboardContext?: 'overview' | 'reports' | 'alerts'
  onNLPCommand?: (command: string) => void
}

export default function Chatbot({ dashboardContext, onNLPCommand }: ChatbotProps = {}) {
  const [isOpen, setIsOpen] = useState(false)
  const [command, setCommand] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
  })

  const [input, setInput] = useState('')

  // Get placeholder based on context
  const getPlaceholder = () => {
    switch (dashboardContext) {
      case 'reports':
        return 'e.g., Add a section about market trends, Update the conclusion to emphasize key findings...'
      case 'alerts':
        return 'e.g., Create an alert for unusual whale activity, Set up threshold alerts...'
      case 'overview':
        return 'e.g. Create a new chart to show NFT collections by volume, show data for last week...'
      default:
        return '...'
    }
  }

  // Get examples based on context
  const getExamples = () => {
    switch (dashboardContext) {
      case 'reports':
        return 'Examples: Add conclusion section, Update executive summary, Emphasize key findings'
      case 'alerts':
        return 'Examples: Create price alert, Set whale threshold;, Notify on anomalies'
      case 'overview':
        return 'Examples: Create new chart to show top 10 NFT collections by volume'
      default:
        return ''
    }
  }
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      sendMessage({ text: input })
      setInput('')
    }
  }

  const handleProcessCommand = async () => {
    if (!command.trim()) return
    
    setIsProcessing(true)
    try {
      // If in reports context and callback is provided, use it
      if (dashboardContext === 'reports' && onNLPCommand) {
        onNLPCommand(command)
        setCommand('')
        return
      }
      
      // Otherwise, handle dashboard modification
      const response = await fetch('/api/nlp-dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command })
      })

      if (!response.ok) throw new Error('Failed to process command')

      const result = await response.json()
      console.log('Dashboard modification result:', result)
      
      // Apply dashboard modifications dynamically
      await applyDashboardModifications(result, command)
      
      setCommand('')
    } catch (error) {
      console.error('Error processing command:', error)
      alert('Failed to process command. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const applyDashboardModifications = async (config: any, originalCommand: string) => {
    try {
      // Get current dashboard ID from URL
      const currentPath = window.location.pathname
      const dashboardId = currentPath.match(/\/dashboard\/([^/]+)/)?.[1]
      
      if (!dashboardId) {
        alert('Please navigate to a dashboard to modify it.')
        return
      }

      // Get current dashboard from localStorage
      const savedDashboards = localStorage.getItem('dashboards')
      if (!savedDashboards) {
        alert('No dashboards found.')
        return
      }

      const parsed = JSON.parse(savedDashboards)
      const dashboard = parsed.find((d: any) => d.id === dashboardId)
      
      if (!dashboard) {
        alert('Dashboard not found.')
        return
      }

      // Apply modifications based on NLP result
      console.log('Original config:', dashboard.config)
      console.log('Processing command:', originalCommand)
      const modifiedConfig = await applyNLPToConfig(dashboard.config, config, originalCommand)
      console.log('Modified config:', modifiedConfig)
      
      // Update dashboard
      const updatedDashboard = {
        ...dashboard,
        config: modifiedConfig
      }

      // Save updated dashboard
      const updatedDashboards = parsed.map((d: any) => 
        d.id === dashboardId ? updatedDashboard : d
      )
      localStorage.setItem('dashboards', JSON.stringify(updatedDashboards))
      console.log('Saved dashboards:', updatedDashboards)

      // Show success message and reload page
      alert('Dashboard updated successfully!')
      window.location.reload()
      
    } catch (error) {
      console.error('Error applying modifications:', error)
      alert('Failed to apply modifications.')
    }
  }

  const applyNLPToConfig = async (currentConfig: any, nlpResult: any, command: string): Promise<any> => {
    const newConfig = { ...currentConfig }
    
    // Convert command to lowercase for easier matching
    const lowerCommand = command.toLowerCase()
    
    // Determine operation type
    const isAddOperation = lowerCommand.includes('add') || lowerCommand.includes('create') || lowerCommand.includes('new') || lowerCommand.includes('show') || lowerCommand.includes('filter') || lowerCommand.includes('apply')
    const isChangeOperation = lowerCommand.includes('change') || lowerCommand.includes('modify') || lowerCommand.includes('update') || lowerCommand.includes('replace')
    const isRemoveOperation = lowerCommand.includes('remove') || lowerCommand.includes('delete') || lowerCommand.includes('clear')
    
    // Initialize charts array if it doesn't exist
    if (!newConfig.charts) {
      newConfig.charts = []
    }

    // Initialize filters array if it doesn't exist
    if (!newConfig.filters) {
      newConfig.filters = []
    }

    // Handle chart type changes
    if (isChangeOperation && (lowerCommand.includes('pie') || lowerCommand.includes('bar') || lowerCommand.includes('line'))) {
      const targetChart = newConfig.charts[0] // Change first chart as default
      if (targetChart) {
        if (lowerCommand.includes('pie to bar') || (lowerCommand.includes('change') && lowerCommand.includes('bar'))) {
          targetChart.type = 'bar'
        } else if (lowerCommand.includes('bar to pie') || (lowerCommand.includes('change') && lowerCommand.includes('pie'))) {
          targetChart.type = 'pie'
        } else if (lowerCommand.includes('line to bar') || (lowerCommand.includes('change') && lowerCommand.includes('bar'))) {
          targetChart.type = 'bar'
        }
      }
    }

    // Handle adding gradients to bar charts
    if ((lowerCommand.includes('gradient') || lowerCommand.includes('shade')) && lowerCommand.includes('bar')) {
      if (!newConfig.chartConfig) {
        newConfig.chartConfig = {}
      }
      newConfig.chartConfig.hasGradient = true
      newConfig.chartConfig.gradientDirection = 'vertical'
      if (lowerCommand.includes('darkest') || lowerCommand.includes('highest')) {
        newConfig.chartConfig.gradientType = 'valueBased' // Highest value = darkest
      }
    }

    // Handle adding new visualizations
    if (isAddOperation) {
      const newChart: any = {
        id: `chart-${Date.now()}`,
        type: 'line',
        title: 'New Chart',
        dataSource: 'Portfolio',
        metrics: [],
        timeframe: 'medium'
      }

      // Determine chart type
      if (lowerCommand.includes('pie')) {
        newChart.type = 'pie'
      } else if (lowerCommand.includes('bar')) {
        newChart.type = 'bar'
      } else if (lowerCommand.includes('line')) {
        newChart.type = 'line'
      }

      // Determine data source and title
      if (lowerCommand.includes('nft') || lowerCommand.includes('collection')) {
        newChart.dataSource = 'NFT'
        newChart.title = 'NFT Collection Analysis'
        newChart.metrics = ['floor_price', 'volume']
      } else if (lowerCommand.includes('defi') || lowerCommand.includes('portfolio')) {
        newChart.dataSource = 'DeFi'
        newChart.title = 'DeFi Portfolio'
        newChart.metrics = ['apy', 'value']
      } else if (lowerCommand.includes('whale') || lowerCommand.includes('wallet')) {
        newChart.dataSource = 'Portfolio'
        newChart.title = 'Wallet Analysis'
        newChart.metrics = ['balance', 'activity']
      } else if (lowerCommand.includes('transaction')) {
        newChart.dataSource = 'Transactions'
        newChart.title = 'Transaction Analysis'
        newChart.metrics = ['amount', 'date']
      }

      newConfig.charts.push(newChart)
    }

    // Handle adding filters - FULLY AI DRIVEN
    // Check for filter-related operations
    const isFilterCommand = lowerCommand.includes('filter') || lowerCommand.includes('show') || lowerCommand.includes('only') || lowerCommand.includes('with') || 
                           lowerCommand.includes('date') || lowerCommand.includes('time') || lowerCommand.includes('last') ||
                           lowerCommand.includes('token') || lowerCommand.includes('coin') || lowerCommand.includes('wallet') ||
                           lowerCommand.includes('amount') || lowerCommand.includes('under') || lowerCommand.includes('over') ||
                           lowerCommand.includes('above') || lowerCommand.includes('below')
    
    if (isAddOperation && isFilterCommand) {
      if (!newConfig.filters) {
        newConfig.filters = []
      }

      const newFilter: any = {
        id: `filter-${Date.now()}`,
        type: 'custom',
        label: 'Filter',
        value: '',
        options: []
      }

      // FULLY AI: Use AI API to parse all filter commands
      try {
        const response = await fetch('/api/nlp-filter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command })
        })
        
        if (response.ok) {
          const aiResult = await response.json()
          if (aiResult.filter) {
            newFilter.type = aiResult.filter.type
            newFilter.label = aiResult.filter.label
            newFilter.value = aiResult.filter.value
            newFilter.options = aiResult.filter.options || []
            newFilter.icon = aiResult.filter.icon || '🔍'
          }
        }
      } catch (error) {
        console.error('AI filter parsing failed:', error)
        // Fallback to a generic filter
        newFilter.type = 'custom'
        newFilter.label = 'Custom Filter'
        newFilter.value = command
        newFilter.icon = '🔍'
      }

      newConfig.filters.push(newFilter)
      console.log('Added filter (AI-generated):', newFilter)
      console.log('Updated config filters:', newConfig.filters)
    }

    // Handle removing elements
    if (isRemoveOperation) {
      if (lowerCommand.includes('chart') && newConfig.charts.length > 0) {
        newConfig.charts.pop() // Remove last chart
      } else if (lowerCommand.includes('filter') && newConfig.filters && newConfig.filters.length > 0) {
        newConfig.filters.pop() // Remove last filter
      }
    }

    console.log('Final config after NLP processing:', newConfig)
    return newConfig
  }

  return (
    <>
      {/* Collapsed Button */}
      {!isOpen && (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        onClick={() => setIsOpen(true)}
          className="fixed top-1/2 right-0 transform -translate-y-1/2 w-12 h-24 bg-solana-gradient rounded-l-lg shadow-lg flex items-center justify-center text-white z-30 hover:shadow-xl transition"
      >
        <MessageCircle className="h-6 w-6" />
      </motion.button>
      )}

      {/* Chat Sidebar */}
      <motion.aside
        initial={{ x: 400 }}
        animate={{ x: isOpen ? 0 : 400 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={`fixed right-0 top-16 bg-white border-l border-gray-200 h-[calc(100vh-4rem)] flex flex-col z-30 shadow-lg ${
          isOpen ? 'w-80' : 'w-0'
        }`}
      >
        {isOpen && (
          <>
            {/* Header */}
            <div className="bg-solana-gradient p-4 shrink-0">
              <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-5 w-5 text-white" />
                <h3 className="text-white font-semibold">AI Assistant</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                  className="text-white hover:text-gray-200 transition p-1"
              >
                  <ChevronLeft className="h-5 w-5" />
              </button>
            </div>


            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ minHeight: 0 }}>
              {/* Commands Tab */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {dashboardContext === 'reports' ? 'Edit Report' : dashboardContext === 'alerts' ? 'Configure Alerts' : 'NLP Command'}
                  </label>
                  <textarea
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    placeholder={getPlaceholder()}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows={3}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {getExamples()}
                  </p>
                </div>
                <button
                  onClick={handleProcessCommand}
                  disabled={isProcessing || !command.trim()}
                  className="w-full px-4 py-2 bg-solana-gradient text-white rounded-lg hover:shadow-lg transition disabled:opacity-50 text-sm"
                >
                  {isProcessing ? 'Processing...' : 'Execute Command'}
                </button>
              </div>

              {/* Message History (Keep for chat functionality) */}
              {messages.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
              {messages.map((message: any) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                      <div className={`flex items-start space-x-2 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        <div className={`p-2 rounded-full shrink-0 ${
                      message.role === 'user' 
                        ? 'bg-solana-gradient' 
                        : 'bg-gray-100'
                    }`}>
                      {message.role === 'user' ? (
                        <User className="h-4 w-4 text-white" />
                      ) : (
                        <Bot className="h-4 w-4 text-gray-600" />
                      )}
                    </div>
                    <div
                      className={`rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-solana-gradient text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                          <div className="text-sm whitespace-pre-wrap break-words">
                        {message.parts.map((part: any, index: number) =>
                          part.type === 'text' ? <span key={index}>{part.text}</span> : null
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
                </div>
              )}
              {(status === 'submitted' || status === 'streaming') && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-2">
                    <div className="p-2 rounded-full bg-gray-100">
                      <Bot className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="bg-gray-100 rounded-lg p-3">
                      <div className="flex items-center space-x-1">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-gray-600">
                          {status === 'submitted' ? 'AI is thinking...' : 'AI is responding...'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </>
        )}
      </motion.aside>
    </>
  )
}
