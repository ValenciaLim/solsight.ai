'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useParams, useRouter } from 'next/navigation'
import DashboardSidebar from '../../../components/DashboardSidebar'
import DashboardTabs from '../../../components/DashboardTabs'
import Chatbot from '../../../components/Chatbot'
import { useAuth } from '../../../providers/AuthProvider'
import { useWhaleData } from '../../../hooks/useWhaleData'
import { FileText, Download, Plus, Trash2, Clock, BookOpen, Sparkles, Edit2, Save } from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface Report {
  id: string
  title: string
  introduction: string
  executiveSummary: string
  findings: Array<{
    heading: string
    content: string
    chartReferences: string[]
  }>
  insights: Array<{
    insight: string
    supportingData: string
  }>
  conclusion: string
  timestamp: Date
  chartData?: any[]
}

interface ChartConfig {
  type: string
  title: string
  data?: any[]
}

export default function ReportsPage() {
  const params = useParams()
  const router = useRouter()
  const dashboardId = params?.id as string
  const { isEnterprise } = useAuth()

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [editingReport, setEditingReport] = useState(false)
  const [editedContent, setEditedContent] = useState<Partial<Report>>({})
  const reportRef = useRef<HTMLDivElement>(null)

  // Initialize whale data hook
  const { whaleData } = useWhaleData(true)

  useEffect(() => {
    if (!dashboardId) return

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
    } else {
      router.push('/dashboard')
    }
  }, [dashboardId, router])

  const generateReport = async () => {
    if (!dashboardData) return

    setLoading(true)
    try {
      const response = await fetch('/api/ai-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dashboardData, whaleData }),
      })
      
      if (response.ok) {
        const data = await response.json()
        const newReport: Report = {
          id: Date.now().toString(),
          title: data.report.title,
          introduction: data.report.introduction,
          executiveSummary: data.report.executiveSummary,
          findings: data.report.findings || [],
          insights: data.report.insights || [],
          conclusion: data.report.conclusion,
          timestamp: new Date(data.report.timestamp || Date.now()),
          chartData: data.chartData || []
        }
        setReports(prev => [newReport, ...prev])
        setSelectedReport(newReport)
        setEditedContent(newReport)
      }
    } catch (error) {
      console.error('Error generating report:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteReport = (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return
    setReports(prev => prev.filter(r => r.id !== reportId))
    if (selectedReport?.id === reportId) {
      setSelectedReport(null)
    }
  }

  const handleEditReport = () => {
    setEditingReport(true)
    if (selectedReport) {
      setEditedContent(selectedReport)
    }
  }

  const handleSaveReport = () => {
    if (!selectedReport) return
    
    const updatedReport = { ...selectedReport, ...editedContent }
    setSelectedReport(updatedReport)
    setReports(prev => prev.map(r => r.id === selectedReport.id ? updatedReport : r))
    setEditingReport(false)
  }

  const handleDownloadReport = async (report: Report) => {
    if (!reportRef.current) return

    try {
      setLoading(true)
      
      // Create PDF document
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 20
      let yPosition = margin
      
      // Helper function to add new page if needed
      const checkPageBreak = (requiredHeight: number) => {
        if (yPosition + requiredHeight > pageHeight - margin) {
          pdf.addPage()
          yPosition = margin
        }
      }

      // Helper function to create a simple chart image as base64
      const createChartImage = async (chart: any): Promise<string> => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) return ''
        
        canvas.width = 600
        canvas.height = 400
        
        // White background
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        // Draw title (with wrapping for long titles)
        ctx.fillStyle = '#000000'
        ctx.font = 'bold 16px Arial'
        const titleMaxWidth = canvas.width - 40
        const titleLines: string[] = []
        const words = chart.title.split(' ')
        let currentLine = ''
        
        words.forEach((word: string) => {
          const testLine = currentLine + (currentLine ? ' ' : '') + word
          const metrics = ctx.measureText(testLine)
          if (metrics.width > titleMaxWidth && currentLine) {
            titleLines.push(currentLine)
            currentLine = word
          } else {
            currentLine = testLine
          }
        })
        if (currentLine) titleLines.push(currentLine)
        
        titleLines.forEach((line, index) => {
          ctx.fillText(line, 20, 30 + (index * 20))
        })
        
        // Get data
        const data = chart.data || []
        if (data.length === 0) return ''
        
        // Adjust margin top based on title lines
        const topMargin = 60 + (titleLines.length - 1) * 20
        const margin = { top: topMargin, right: 40, bottom: 40, left: 60 }
        const width = canvas.width - margin.left - margin.right
        const height = canvas.height - margin.top - margin.bottom
        const chartArea = { x: margin.left, y: margin.top, width, height }
        
        // Draw axes
        ctx.strokeStyle = '#cccccc'
        ctx.lineWidth = 1
        // X-axis
        ctx.beginPath()
        ctx.moveTo(chartArea.x, chartArea.y + chartArea.height)
        ctx.lineTo(chartArea.x + chartArea.width, chartArea.y + chartArea.height)
        ctx.stroke()
        // Y-axis
        ctx.beginPath()
        ctx.moveTo(chartArea.x, chartArea.y)
        ctx.lineTo(chartArea.x, chartArea.y + chartArea.height)
        ctx.stroke()
        
        if (chart.type === 'table') {
          // Table representation
          const tableRows = data.slice(0, 10).map((row: any) => 
            Object.values(row).slice(0, 5).join(' | ')
          )
          
          ctx.font = '12px monospace'
          let y = margin.top + 30
          tableRows.forEach((row: string) => {
            ctx.fillText(row, chartArea.x + 10, y)
            y += 20
          })
        } else if (chart.type === 'line' || chart.type === 'bar') {
          // Get x and y keys
          const xKey = chart.xKey || 'x'
          const yKey = chart.yKey || 'y'
          
          // Get min/max for scaling
          const values = data.map((d: any) => parseFloat(d[yKey]) || 0)
          const minY = Math.min(0, ...values)
          const maxY = Math.max(...values)
          const yRange = maxY - minY || 1
          
          // Draw data points
          const pointSize = 4
          const barWidth = chart.type === 'bar' ? (chartArea.width / data.length) * 0.8 : 0
          
          data.forEach((d: any, i: number) => {
            const x = chartArea.x + (i / (data.length - 1 || 1)) * chartArea.width
            const value = parseFloat(d[yKey]) || 0
            const y = chartArea.y + chartArea.height - ((value - minY) / yRange) * chartArea.height
            
            if (chart.type === 'bar') {
              // Draw bar
              ctx.fillStyle = '#9333ea'
              ctx.fillRect(x - barWidth / 2, y, barWidth, chartArea.height - (y - chartArea.y))
            } else {
              // Draw line point
              ctx.fillStyle = '#9333ea'
              ctx.beginPath()
              ctx.arc(x, y, pointSize, 0, 2 * Math.PI)
              ctx.fill()
              
              // Draw line to next point
              if (i < data.length - 1) {
                const nextX = chartArea.x + ((i + 1) / (data.length - 1 || 1)) * chartArea.width
                const nextValue = parseFloat(data[i + 1][yKey]) || 0
                const nextY = chartArea.y + chartArea.height - ((nextValue - minY) / yRange) * chartArea.height
                
                ctx.strokeStyle = '#9333ea'
                ctx.lineWidth = 2
                ctx.beginPath()
                ctx.moveTo(x, y)
                ctx.lineTo(nextX, nextY)
                ctx.stroke()
              }
            }
            
            // Label
            ctx.fillStyle = '#666666'
            ctx.font = '10px Arial'
            ctx.textAlign = 'center'
            ctx.fillText(String(d[xKey]), x, chartArea.y + chartArea.height + 20)
            ctx.textAlign = 'left'
          })
          
          // Y-axis labels
          ctx.fillStyle = '#666666'
          ctx.font = '10px Arial'
          for (let i = 0; i <= 5; i++) {
            const value = minY + (yRange / 5) * i
            const y = chartArea.y + chartArea.height - (i / 5) * chartArea.height
            ctx.fillText(value.toFixed(0), chartArea.x - 40, y + 5)
          }
                                   } else if (chart.type === 'pie') {
            // Pie chart - improve visibility and rendering
            // Try multiple possible value keys
            const getValue = (d: any): number => {
              const value = d.value || d.count || d.y || d.amount || d.volume || Object.values(d)[1] || 0
              return parseFloat(String(value)) || 0
            }
            
            // Debug: log the first data item to see its structure
            if (data.length > 0) {
              console.log('Pie chart data sample:', data[0], 'Keys:', Object.keys(data[0]))
            }
            
            const total = data.reduce((sum: number, d: any) => sum + getValue(d), 0)
            
                         console.log('Pie chart total:', total, 'Data:', data.map((d: any) => ({ keys: Object.keys(d), values: Object.values(d) })))
            
            if (total === 0 || data.length === 0) {
              console.log('Pie chart: no valid data - returning empty')
              return ''
            }
           
           const centerX = chartArea.x + chartArea.width / 2
           const centerY = chartArea.y + chartArea.height / 2
           const radius = Math.min(chartArea.width, chartArea.height) / 3
           
           let currentAngle = -Math.PI / 2
           const colors = ['#9333ea', '#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#ec4899']
           
           // Draw pie slices
           data.forEach((d: any, i: number) => {
             const value = getValue(d)
             if (value === 0) return
             
             const sliceAngle = (value / total) * 2 * Math.PI
             
             // Draw slice
             ctx.fillStyle = colors[i % colors.length]
             ctx.beginPath()
             ctx.moveTo(centerX, centerY)
             ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle)
             ctx.closePath()
             ctx.fill()
             
             // Draw border for better visibility
             ctx.strokeStyle = '#ffffff'
             ctx.lineWidth = 2
             ctx.stroke()
             
             // Label outside with percentage
             const labelAngle = currentAngle + sliceAngle / 2
             const labelX = centerX + Math.cos(labelAngle) * (radius + 30)
             const labelY = centerY + Math.sin(labelAngle) * (radius + 30)
             
             const percentage = ((value / total) * 100).toFixed(1)
             const labelText = `${d.name || d.label || d.key || d.x || String(i)}: ${percentage}%`
             
             ctx.fillStyle = '#000000'
             ctx.font = '10px Arial'
             ctx.textAlign = 'center'
             // Truncate long labels
             const maxLabelWidth = 100
             let displayText = labelText
             const metrics = ctx.measureText(displayText)
             if (metrics.width > maxLabelWidth) {
               displayText = displayText.substring(0, Math.floor(displayText.length * maxLabelWidth / metrics.width)) + '...'
             }
             ctx.fillText(displayText, labelX, labelY)
             ctx.textAlign = 'left'
             
             currentAngle += sliceAngle
           })
         }
        
        return canvas.toDataURL('image/png')
      }
      
      // Add title (with wrapping)
      pdf.setFontSize(18)
      checkPageBreak(10)
      const titleLines = pdf.splitTextToSize(report.title, pageWidth - 2 * margin)
      titleLines.forEach((line: string) => {
        checkPageBreak(7)
        pdf.text(line, margin, yPosition)
        yPosition += 7
      })
      yPosition += 5
      
      // Add executive summary
      pdf.setFontSize(14)
      pdf.text('Executive Summary', margin, yPosition)
      yPosition += 8
      pdf.setFontSize(10)
      const summaryLines = pdf.splitTextToSize(report.executiveSummary, pageWidth - 2 * margin)
      summaryLines.forEach((line: string) => {
        checkPageBreak(5)
        pdf.text(line, margin, yPosition)
        yPosition += 5
      })
      yPosition += 5
      
      // Add introduction
      pdf.setFontSize(14)
      pdf.text('Introduction', margin, yPosition)
      yPosition += 8
      pdf.setFontSize(10)
      const introLines = pdf.splitTextToSize(report.introduction, pageWidth - 2 * margin)
      introLines.forEach((line: string) => {
        checkPageBreak(5)
        pdf.text(line, margin, yPosition)
        yPosition += 5
      })
      yPosition += 5
      
      // Add findings
      pdf.setFontSize(14)
      pdf.text('Findings', margin, yPosition)
      yPosition += 8
      
      report.findings.forEach((finding, index) => {
        checkPageBreak(15)
        pdf.setFontSize(12)
        pdf.text(`${index + 1}. ${finding.heading}`, margin, yPosition)
        yPosition += 7
        
        pdf.setFontSize(10)
        const findingLines = pdf.splitTextToSize(finding.content, pageWidth - 2 * margin)
        findingLines.forEach((line: string) => {
          checkPageBreak(5)
          pdf.text(line, margin, yPosition)
          yPosition += 5
        })
        yPosition += 5
      })
      
      // Add insights
      pdf.setFontSize(14)
      checkPageBreak(15)
      pdf.text('Insights', margin, yPosition)
      yPosition += 8
      
      report.insights.forEach((insight) => {
        checkPageBreak(10)
        pdf.setFontSize(10)
        const insightText = `• ${insight.insight}: ${insight.supportingData}`
        const insightLines = pdf.splitTextToSize(insightText, pageWidth - 2 * margin)
        insightLines.forEach((line: string) => {
          checkPageBreak(5)
          pdf.text(line, margin, yPosition)
          yPosition += 5
        })
      })
      yPosition += 5
      
      // Add conclusion
      pdf.setFontSize(14)
      checkPageBreak(15)
      pdf.text('Conclusion', margin, yPosition)
      yPosition += 8
      pdf.setFontSize(10)
      const conclusionLines = pdf.splitTextToSize(report.conclusion, pageWidth - 2 * margin)
      conclusionLines.forEach((line: string) => {
        checkPageBreak(5)
        pdf.text(line, margin, yPosition)
        yPosition += 5
      })
      yPosition += 5
      
      // Add charts section if there are charts
      if (report.chartData && report.chartData.length > 0) {
        pdf.setFontSize(14)
        checkPageBreak(20)
        pdf.text('Charts and Visualizations', margin, yPosition)
        yPosition += 10
        
        // Process each chart
        for (const chart of report.chartData) {
          checkPageBreak(30)
          pdf.setFontSize(12)
          pdf.text(`Chart: ${chart.title} (${chart.type})`, margin, yPosition)
          yPosition += 8
          
                     // Try to generate and add chart image
           try {
             const chartImage = await createChartImage(chart)
             if (chartImage) {
               // Add chart image to PDF with proper aspect ratio
               const imgWidth = pageWidth - 2 * margin
               const imgHeight = 100 // Increased height for better visibility
               
               checkPageBreak(imgHeight + 5)
               pdf.addImage(chartImage, 'PNG', margin, yPosition, imgWidth, imgHeight)
               yPosition += imgHeight + 5
             } else {
              // For non-table charts, add descriptive text
              pdf.setFontSize(10)
              pdf.text('Chart visualization is available in the dashboard.', margin + 5, yPosition)
              yPosition += 7
            }
          } catch (error) {
            console.error('Error adding chart image:', error)
            pdf.setFontSize(10)
            pdf.text('Chart visualization is available in the dashboard.', margin + 5, yPosition)
            yPosition += 7
          }
          
          yPosition += 5
        }
      }
      
      // Load watermark image
      let watermarkImgData = ''
      try {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        
        await new Promise<void>((resolve) => {
          const timeout = setTimeout(() => {
            resolve()
          }, 2000)
          
          img.onload = () => {
            clearTimeout(timeout)
            try {
              const tempCanvas = document.createElement('canvas')
              tempCanvas.width = img.width
              tempCanvas.height = img.height
              const ctx = tempCanvas.getContext('2d')
              
              if (ctx) {
                ctx.drawImage(img, 0, 0)
                watermarkImgData = tempCanvas.toDataURL('image/png')
              }
            } catch (error) {
              console.error('Error processing watermark:', error)
            }
            resolve()
          }
          
          img.onerror = () => {
            clearTimeout(timeout)
            console.warn('Failed to load logo for watermark')
            resolve()
          }
          
          img.src = '/assets/logo.png'
        })
      } catch (error) {
        console.error('Error loading watermark:', error)
      }
      
      // Add watermark and footer to all pages
      const totalPages = pdf.internal.pages.length - 1
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i)
        
        // Add footer text
        pdf.setFontSize(8)
        pdf.text(
          `Generated on: ${report.timestamp.toLocaleString()}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        )
        
        // Add watermark logo if loaded
        if (watermarkImgData) {
          try {
            const watermarkSize = 40 // Size in mm
            const watermarkX = pageWidth - watermarkSize - 10
            const watermarkY = pageHeight - watermarkSize - 10
            
            pdf.addImage(watermarkImgData, 'PNG', watermarkX, watermarkY, watermarkSize, watermarkSize, '', 'FAST', 0)
          } catch (error) {
            console.error('Error adding watermark to page:', error)
          }
        }
      }
      
      // Download PDF
      pdf.save(`${report.title.replace(/\s+/g, '_')}_report.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Handle NLP command from AI sidebar
  const handleNLPCommand = async (command: string) => {
    if (!selectedReport) return

    try {
      setLoading(true)
      // Call AI API to modify the report based on the command
      const response = await fetch('/api/modify-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: command,
          reportTitle: selectedReport.title,
          reportContent: JSON.stringify(selectedReport),
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        
        // Update the selected report with the modified content
        if (data.sections) {
          // Parse sections and update the report structure
          const sections = data.sections.filter((s: any) => s.type === 'section')
          const findings = sections.map((s: any) => ({
            heading: s.heading,
            content: s.content,
            chartReferences: []
          }))
          
          const updatedReport: Report = {
            ...selectedReport!,
            findings: findings,
            timestamp: new Date()
          }
          
          // Update the selected report and saved reports list
          setSelectedReport(updatedReport)
          setEditedContent(updatedReport)
          
          // Save to localStorage
          const savedReports = localStorage.getItem(`reports_${dashboardId}`)
          if (savedReports) {
            const reports = JSON.parse(savedReports)
            const updatedReports = reports.map((r: Report) => 
              r.id === selectedReport!.id ? updatedReport : r
            )
            localStorage.setItem(`reports_${dashboardId}`, JSON.stringify(updatedReports))
            setReports(updatedReports)
          }
          
          alert('Report updated successfully!')
        } else {
          alert('Invalid response from AI')
        }
      } else {
        const error = await response.json()
        alert(`Error: ${error.error || 'Failed to update report'}`)
      }
    } catch (error) {
      console.error('Error processing NLP command:', error)
      alert('Failed to process command. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isEnterprise) {
    return (
      <div className="pt-16 h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-indigo-50 to-cyan-50">
        <div className="text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Enterprise Feature</h2>
          <p className="text-gray-600">Reports are only available for enterprise users.</p>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="pt-16 h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-indigo-50 to-cyan-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reports...</p>
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
              className="h-full flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Research Reports</h1>
                  <p className="text-gray-600">
                    Generate structured research reports for {dashboardData.name}
                  </p>
                </div>
                <button
                  onClick={generateReport}
                  disabled={loading}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                >
                  <Plus className="h-5 w-5" />
                  <span>Generate Report</span>
                </button>
              </div>

              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-gradient-to-br from-purple-50 via-indigo-50 to-cyan-50 p-6 my-4 rounded-xl border border-purple-200"
                >
                  <div className="flex items-center space-x-3">
                    <Sparkles className="h-6 w-6 text-purple-600 animate-pulse" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Generating Report...</h3>
                      <p className="text-sm text-gray-600">AI is analyzing your dashboard and creating a comprehensive report</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Two-column layout */}
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                {/* Left column: Reports list */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col col-span-1">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Saved Reports</h2>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4">
                    {reports.length > 0 ? (
                      <div className="space-y-3">
                        {reports.map((report) => (
                          <div
                            key={report.id}
                            onClick={() => {
                              setSelectedReport(report)
                              setEditedContent(report)
                              setEditingReport(false)
                            }}
                            className={`p-4 rounded-lg border cursor-pointer transition hover:shadow-md ${
                              selectedReport?.id === report.id
                                ? 'border-purple-500 bg-purple-50'
                                : 'border-gray-200 bg-gray-50'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 truncate">{report.title}</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                  <Clock className="h-3 w-3 inline mr-1" />
                                  {report.timestamp.toLocaleDateString()}
                                </p>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteReport(report.id)
                                }}
                                className="ml-2 p-1 text-gray-400 hover:text-red-500 transition"
                                title="Delete report"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">No reports yet</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right column: Report editor */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col col-span-2">
                  {selectedReport ? (
                    <>
                      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900">{selectedReport.title}</h2>
                        <div className="flex items-center space-x-2">
                          {editingReport ? (
                            <button
                              onClick={handleSaveReport}
                              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                            >
                              <Save className="h-4 w-4" />
                              <span>Save</span>
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={handleEditReport}
                                className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition"
                              >
                                <Edit2 className="h-4 w-4" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => handleDownloadReport(selectedReport)}
                                className="flex items-center space-x-2 px-4 py-2 whitespace-nowrap bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition"
                              >
                                <Download className="h-4 w-4" />
                                <span>Download PDF</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div ref={reportRef} className="flex-1 overflow-y-auto p-6">
                        <div className="prose max-w-none">
                          <h3 className="text-lg font-semibold text-gray-900 mb-3">Executive Summary</h3>
                          {editingReport ? (
                            <textarea
                              value={editedContent.executiveSummary || ''}
                              onChange={(e) => setEditedContent({ ...editedContent, executiveSummary: e.target.value })}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-6"
                              rows={3}
                            />
                          ) : (
                            <p className="text-gray-700 mb-6">{selectedReport.executiveSummary}</p>
                          )}

                          <h3 className="text-lg font-semibold text-gray-900 mb-3">Introduction</h3>
                          {editingReport ? (
                            <textarea
                              value={editedContent.introduction || ''}
                              onChange={(e) => setEditedContent({ ...editedContent, introduction: e.target.value })}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-6"
                              rows={4}
                            />
                          ) : (
                            <p className="text-gray-700 mb-6">{selectedReport.introduction}</p>
                          )}

                          <h3 className="text-lg font-semibold text-gray-900 mb-3">Findings</h3>
                          {selectedReport.findings.map((finding, index) => (
                            <div key={index} className="mb-6">
                              <h4 className="font-medium text-gray-900 mb-2">{finding.heading}</h4>
                              {editingReport ? (
                                <textarea
                                  value={editedContent.findings?.[index]?.content || finding.content}
                                  onChange={(e) => {
                                    const updatedFindings = [...(editedContent.findings || selectedReport.findings)]
                                    updatedFindings[index] = { ...finding, content: e.target.value }
                                    setEditedContent({ ...editedContent, findings: updatedFindings })
                                  }}
                                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  rows={3}
                                />
                              ) : (
                                <p className="text-gray-700">{finding.content}</p>
                              )}
                              {finding.chartReferences && finding.chartReferences.length > 0 && (
                                <div className="mt-2 text-sm text-purple-600">
                                  Charts: {finding.chartReferences.join(', ')}
                                </div>
                              )}
                            </div>
                          ))}

                          <h3 className="text-lg font-semibold text-gray-900 mb-3">Insights</h3>
                          <ul className="list-disc list-inside space-y-2 mb-6">
                            {selectedReport.insights.map((insight, index) => (
                              <li key={index} className="text-gray-700">
                                {editingReport ? (
                                  <input
                                    type="text"
                                    value={editedContent.insights?.[index]?.insight || insight.insight}
                                    onChange={(e) => {
                                      const updatedInsights = [...(editedContent.insights || selectedReport.insights)]
                                      updatedInsights[index] = { ...insight, insight: e.target.value }
                                      setEditedContent({ ...editedContent, insights: updatedInsights })
                                    }}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  />
                                ) : (
                                  <><strong>{insight.insight}</strong>: {insight.supportingData}</>
                                )}
                              </li>
                            ))}
                          </ul>

                          <h3 className="text-lg font-semibold text-gray-900 mb-3">Conclusion</h3>
                          {editingReport ? (
                            <textarea
                              value={editedContent.conclusion || ''}
                              onChange={(e) => setEditedContent({ ...editedContent, conclusion: e.target.value })}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-6"
                              rows={4}
                            />
                          ) : (
                            <p className="text-gray-700 mb-6">{selectedReport.conclusion}</p>
                          )}

                          <div className="mt-6 pt-6 border-t border-gray-200 text-sm text-gray-500">
                            Generated on: {selectedReport.timestamp.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center p-12">
                      <div className="text-center">
                        <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Report Selected</h3>
                        <p className="text-gray-600 mb-6">Select a report from the list to view and edit it</p>
                        {reports.length === 0 && (
                          <button
                            onClick={generateReport}
                            disabled={loading}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                          >
                            Generate Your First Report
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                                 </div>
               </div>
             </motion.div>
           </main>
         </div>
       </div>

       {/* Dashboard-specific AI Chatbot for Reports */}
       <Chatbot dashboardContext="reports" onNLPCommand={handleNLPCommand} />
     </>
   )
 }
