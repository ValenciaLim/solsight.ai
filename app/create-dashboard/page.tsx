'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useWallet } from '@solana/wallet-adapter-react'
import { useAuth } from '../providers/AuthProvider'
import { 
  ArrowLeft, 
  ArrowRight, 
  Brain, 
  BarChart3, 
  Bell, 
  Target,
  TrendingUp,
  Wallet,
  Zap,
  Check,
  MessageSquare,
  FileText,
  Sparkles
} from 'lucide-react'
import Link from 'next/link'

export default function OnboardingPage() {
  const router = useRouter()
  const { connected } = useWallet()
  const { user, isEnterprise } = useAuth()
  const [mode, setMode] = useState<'intention' | 'nlp'>('intention')
  const [userIntention, setUserIntention] = useState('')
  const [isGeneratingTemplates, setIsGeneratingTemplates] = useState(false)
  const [generatedTemplates, setGeneratedTemplates] = useState<any[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [nlpCommand, setNlpCommand] = useState('')
  const [isProcessingNLP, setIsProcessingNLP] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  const handleGenerateTemplates = async () => {
    if (!userIntention.trim()) return
    
    setIsGeneratingTemplates(true)
    
    try {
      // Call the AI API to generate templates
      const response = await fetch('/api/generate-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userIntention,
          userType: 'individual' // You can get this from auth context
        })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.details || result.error || 'Failed to generate templates')
      }
      
      setGeneratedTemplates(result.templates || [])
      setCurrentStep(1) // Move to template selection step
    } catch (error) {
      console.error('Error generating templates:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate templates. Please try again.'
      alert(errorMessage)
    } finally {
      setIsGeneratingTemplates(false)
    }
  }

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template)
    
    // Create dashboard with the selected template
    const dashboardId = Date.now().toString()
    
    const dashboard = {
      id: dashboardId,
      name: template.name,
      config: {
        stats: template.stats || [],
        charts: template.charts || [],
        metrics: template.metrics || [],
        researchFocus: template.researchFocus,
        useCase: template.useCase,
        category: template.category
      },
      createdAt: new Date().toISOString()
    }
    
    // Get existing dashboards (enterprise or individual)
    const storageKey = isEnterprise ? 'enterprise_dashboards' : 'dashboards'
    const existingDashboards = JSON.parse(localStorage.getItem(storageKey) || '[]')
    
    // Add new dashboard
    existingDashboards.push(dashboard)
    
    // Save to localStorage
    localStorage.setItem(storageKey, JSON.stringify(existingDashboards))
    
    // Redirect based on user type
    if (isEnterprise) {
      router.push(`/admin?dashboard=${dashboardId}`)
    } else {
      router.push(`/dashboard/${dashboardId}`)
    }
  }

  const handleNLPSubmit = async () => {
    if (!nlpCommand.trim()) return
    
    setIsProcessingNLP(true)
    
    try {
      // Call the AI API to process the NLP command
      const response = await fetch('/api/nlp-dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: nlpCommand })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.details || result.error || 'Failed to process NLP command')
      }
      
      // Create dashboard with the parsed configuration
      const dashboardId = Date.now().toString()
      const dashboardName = result.name || `Dashboard ${new Date().toLocaleDateString()}`
      
      const dashboard = {
        id: dashboardId,
        name: dashboardName,
        config: result.config,
        createdAt: new Date().toISOString()
      }
      
      // Get existing dashboards (enterprise or individual)
      const storageKey = isEnterprise ? 'enterprise_dashboards' : 'dashboards'
      const existingDashboards = JSON.parse(localStorage.getItem(storageKey) || '[]')
      
      // Add new dashboard
      existingDashboards.push(dashboard)
      
      // Save to localStorage
      localStorage.setItem(storageKey, JSON.stringify(existingDashboards))
      localStorage.setItem('onboardingData', JSON.stringify(result.config))
      
      // Redirect based on user type
      if (isEnterprise) {
        router.push(`/admin?dashboard=${dashboardId}`)
    } else {
        router.push(`/dashboard/${dashboardId}`)
      }
    } catch (error) {
      console.error('Error processing NLP command:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to process your command. Please try again or use the template selection instead.'
      alert(errorMessage)
    } finally {
      setIsProcessingNLP(false)
    }
  }

  // Only require wallet connection for individual users
  if (!isEnterprise && !connected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-indigo-600 to-cyan-500 flex items-center justify-center">
        <div className="text-center text-white">
          <Wallet className="h-16 w-16 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Please Connect Your Wallet</h2>
          <p className="mb-4">You need to connect your wallet to continue</p>
          <Link href="/login" className="bg-white text-purple-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition">
            Connect Wallet
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-indigo-600 to-cyan-500 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <Link href={isEnterprise ? "/admin" : "/dashboard"} className="inline-flex items-center text-white hover:text-gray-200 mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
            
            <h1 className="text-3xl font-bold text-white mb-2">
              Create Your Dashboard
            </h1>
            <p className="text-white/80 mb-6">
              Choose how you want to create your dashboard
            </p>

            {/* Mode Toggle */}
            <div className="flex items-center justify-center space-x-4 mb-6">
              <button
                onClick={() => setMode('intention')}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition ${
                  mode === 'intention'
                    ? 'bg-white text-purple-600'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <FileText className="h-4 w-4" />
                <span className="font-medium">Choose Template</span>
              </button>
              <button
                onClick={() => setMode('nlp')}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition ${
                  mode === 'nlp'
                    ? 'bg-white text-purple-600'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <Sparkles className="h-4 w-4" />
                <span className="font-medium">AI Command</span>
              </button>
            </div>
          </div>

          {mode === 'nlp' ? (
            /* NLP Command Interface */
            <div className="space-y-6">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <div className="flex items-start space-x-3 mb-4">
                  <MessageSquare className="h-6 w-6 text-white mt-1" />
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Describe Your Dashboard</h3>
                    <p className="text-white/70 text-sm">
                      Tell us what you want to see. Our AI will create a custom dashboard for you.
                    </p>
                  </div>
                </div>
                
                <textarea
                  value={nlpCommand}
                  onChange={(e) => setNlpCommand(e.target.value)}
                  placeholder="Example: Create a dashboard showing my NFT collection, DeFi portfolio, and weekly transactions"
                  className="w-full h-40 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 resize-none"
                />
                
                <div className="mt-4 space-y-2">
                  <p className="text-white/70 text-sm font-medium">Examples:</p>
                  <div className="space-y-1">
                    {[
                      "Show me my NFT collection and trading activity",
                      "Create a dashboard for my DeFi positions and yields",
                      "Display my portfolio performance with weekly summaries",
                      "Track my wallet transactions and token balances"
                    ].map((example, index) => (
                      <button
                        key={index}
                        onClick={() => setNlpCommand(example)}
                        className="w-full text-left px-3 py-2 bg-white/5 hover:bg-white/10 rounded text-white/80 text-sm transition"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Link
                  href="/login"
                  className="flex items-center px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition"
                >
                  Cancel
                </Link>
                
                <button
                  onClick={handleNLPSubmit}
                  disabled={!nlpCommand.trim() || isProcessingNLP}
                  className="flex items-center px-6 py-3 bg-white text-purple-600 rounded-lg hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  {isProcessingNLP ? (
                    <>
                      <Zap className="h-4 w-4 mr-2 animate-pulse" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Dashboard
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Template Selection Interface */
            <div>
              {currentStep === 0 ? (
                // Step 1: Enter user intention
                <div className="space-y-6">
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                    <div className="flex items-start space-x-3 mb-4">
                      <Target className="h-6 w-6 text-white mt-1" />
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-2">What is your dashboard for?</h3>
                        <p className="text-white/70 text-sm">
                          Tell us your intention, and we'll generate 3 custom dashboard templates for you to choose from.
            </p>
          </div>
                    </div>
                    
                    <textarea
                      value={userIntention}
                      onChange={(e) => setUserIntention(e.target.value)}
                      placeholder="Example: I want to research NFT whale behavior and trading patterns..."
                      className="w-full h-40 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 resize-none"
                    />
                    
                    <div className="mt-4 space-y-2">
                      <p className="text-white/70 text-sm font-medium">Example intentions:</p>
                      <div className="space-y-1">
                        {[
                          "Research NFT whale accumulation patterns and floor price movements",
                          "Analyze DeFi protocol performance and yield opportunities",
                          "Track wallet risk indicators and transaction patterns"
                        ].map((example, index) => (
                          <button
                            key={index}
                            onClick={() => setUserIntention(example)}
                            className="w-full text-left px-3 py-2 bg-white/5 hover:bg-white/10 rounded text-white/80 text-sm transition"
                          >
                            {example}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Link
                      href="/login"
                      className="flex items-center px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition"
                    >
                      Cancel
                    </Link>
                    
                    <button
                      onClick={handleGenerateTemplates}
                      disabled={!userIntention.trim() || isGeneratingTemplates}
                      className="flex items-center px-6 py-3 bg-white text-purple-600 rounded-lg hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                    >
                      {isGeneratingTemplates ? (
                        <>
                          <Zap className="h-4 w-4 mr-2 animate-pulse" />
                          Generating Templates...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate Templates
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                // Step 2: Select a template
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-white mb-2">Choose Your Dashboard Template</h2>
                    <p className="text-white/70">Select one of the AI-generated templates below</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {generatedTemplates.map((template, index) => (
                <motion.button
                        key={template.id || index}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                        onClick={() => handleTemplateSelect(template)}
                        className="bg-white/5 border-2 border-white/20 rounded-xl p-6 text-left hover:border-white/40 hover:bg-white/10 transition text-white"
                      >
                        <h3 className="font-semibold text-lg mb-2">{template.name}</h3>
                        <p className="text-white/70 text-sm mb-4">{template.description}</p>
                        
                        <div className="space-y-2 mb-4">
                          <p className="text-xs font-medium text-white/50">Research Focus:</p>
                          <p className="text-xs text-white/70">{template.researchFocus}</p>
                    </div>
                        
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-white/50">Includes:</p>
                          <div className="flex flex-wrap gap-2">
                            {template.metrics?.slice(0, 3).map((metric: string, i: number) => (
                              <span key={i} className="px-2 py-1 bg-white/10 rounded text-xs text-white/80">
                                {metric}
                              </span>
                            ))}
                    </div>
                  </div>
                </motion.button>
                    ))}
          </div>

                  <div className="flex justify-center">
            <button
                      onClick={() => setCurrentStep(0)}
                      className="flex items-center px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
            </button>
          </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
