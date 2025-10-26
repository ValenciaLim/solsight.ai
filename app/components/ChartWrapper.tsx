'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lightbulb, X, Download, Trash2 } from 'lucide-react'
import html2canvas from 'html2canvas'

interface ChartWrapperProps {
  chart: any
  chartIndex: number
  data: any[]
  renderChart: () => React.ReactNode
  onDelete?: (index: number) => void
  dashboardId: string
}

export default function ChartWrapper({
  chart,
  chartIndex,
  data,
  renderChart,
  onDelete,
  dashboardId
}: ChartWrapperProps) {
  const [showModal, setShowModal] = useState(false)
  const [insight, setInsight] = useState<string | null>(null)
  const [isLoadingInsight, setIsLoadingInsight] = useState(false)
  const chartRef = useRef<HTMLDivElement>(null)

  // Generate AI insight
  const generateInsight = async () => {
    setIsLoadingInsight(true)
    try {
      const response = await fetch('/api/ai-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chartType: chart.type,
          chartTitle: chart.title,
          data: data
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        setInsight(result.insight)
      } else {
        throw new Error('Failed to generate insight')
      }
    } catch (error) {
      console.error('Error generating insight:', error)
      setInsight('Unable to generate insight at this time. Please check your OpenAI API key.')
    } finally {
      setIsLoadingInsight(false)
    }
  }

  // Open modal and generate insight
  const handleOpenModal = () => {
    setShowModal(true)
    if (!insight) {
      generateInsight()
    }
  }

  // Export chart as image
  const handleExport = async () => {
    if (!chartRef.current) return

    try {
      // Load watermark image FIRST, before html2canvas
      const watermarkImg = new Image()
      let watermarkLoaded = false

      const waitForWatermark = new Promise((resolve) => {
        watermarkImg.onload = () => {
          watermarkLoaded = true
          resolve(null)
        }
        watermarkImg.onerror = () => {
          console.warn('Watermark image failed to load')
          resolve(null)
        }
        watermarkImg.src = '/assets/logo.png'
      })

      // Wait for watermark to load or timeout
      await Promise.race([
        waitForWatermark,
        new Promise(resolve => setTimeout(resolve, 2000))
      ])

      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true
      })

      // Draw watermark on canvas if image loaded successfully
      const ctx = canvas.getContext('2d')
      if (ctx && watermarkLoaded && watermarkImg.naturalWidth > 0) {
        ctx.globalAlpha = 0.3
        const watermarkSize = Math.min(canvas.width * 0.15, canvas.height * 0.15, 100)
        const x = canvas.width - watermarkSize - 20
        const y = canvas.height - watermarkSize - 20
        ctx.drawImage(watermarkImg, x, y, watermarkSize, watermarkSize)
        ctx.globalAlpha = 1.0
        console.log('✅ Watermark added successfully')
      } else {
        // Fallback: Draw text watermark
        if (ctx) {
          ctx.font = 'bold 20px Arial'
          ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'
          ctx.globalAlpha = 0.4
          ctx.fillText('SolSight', canvas.width - 120, canvas.height - 20)
          ctx.globalAlpha = 1.0
          console.log('📝 Text watermark added as fallback')
        }
      }

      // Download
      const link = document.createElement('a')
      link.download = `${chart.title.replace(/\s+/g, '_')}_chart.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (error) {
      console.error('Error exporting chart:', error)
      alert('Failed to export chart. Please try again.')
    }
  }

  // Handle delete
  const handleDelete = () => {
    if (onDelete && confirm(`Are you sure you want to delete "${chart.title}"?`)) {
      onDelete(chartIndex)
    }
  }

  return (
    <>
      <motion.div
        key={chart.id || chartIndex}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: chartIndex * 0.1 }}
        className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 relative"
      >
        {/* Header with buttons */}
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{chart.title}</h3>
          <div className="flex items-center space-x-2">
            {/* Insight Button */}
            <button
              onClick={handleOpenModal}
              className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition"
              title="View Insights"
            >
              <Lightbulb className="h-5 w-5" />
            </button>
            {/* Delete Button */}
            {onDelete && (
              <button
                onClick={handleDelete}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                title="Delete Chart"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Chart */}
        <div ref={chartRef}>
          {renderChart()}
        </div>
      </motion.div>

      {/* Insight Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">{chart.title}</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="h-6 w-6 text-gray-600" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Chart */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  {renderChart()}
                </div>

                {/* AI Insight */}
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-lg border border-yellow-200">
                  <div className="flex items-start space-x-3">
                    <Lightbulb className="h-6 w-6 text-yellow-600 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">AI Analysis</h3>
                      {isLoadingInsight ? (
                        <div className="flex items-center space-x-2 text-gray-600">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                          <span>Generating insight...</span>
                        </div>
                      ) : (
                        <p className="text-gray-700">{insight || 'Click to generate insight'}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Data Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Data Source</h4>
                    <p className="text-sm text-gray-600">{chart.dataSource || 'Portfolio'}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Chart Type</h4>
                    <p className="text-sm text-gray-600 capitalize">{chart.type}</p>
                  </div>
                </div>

                {/* Data Preview */}
                {data && data.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">Sample Data</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="text-left text-gray-600 border-b">
                            {Object.keys(data[0]).map((key) => (
                              <th key={key} className="p-2 font-medium">{key}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {data.slice(0, 5).map((row, idx) => (
                            <tr key={idx} className="border-b">
                              {Object.entries(row).map(([key, value]) => (
                                <td key={key} className="p-2 text-gray-700">{String(value)}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Dashboard ID: {dashboardId}
                </div>
                <button
                  onClick={handleExport}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                  <Download className="h-5 w-5" />
                  <span>Export Image</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
