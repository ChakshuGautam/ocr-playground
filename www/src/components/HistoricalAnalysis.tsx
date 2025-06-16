import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import { 
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Calendar,
  BarChart3,
  LineChart,
  PieChart,
  Download,
  Filter,
  Clock,
  Target,
  Zap
} from 'lucide-react'

interface TrendData {
  date: string
  accuracy: number
  execution_time: number
  prompt_version: string
  dataset_name: string
  run_count: number
}

interface RegressionAlert {
  id: number
  prompt_family: string
  severity: 'high' | 'medium' | 'low'
  description: string
  detected_at: string
  threshold_breach: number
  current_accuracy: number
  baseline_accuracy: number
}

const HistoricalAnalysis: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30d')
  const [selectedMetric, setSelectedMetric] = useState('accuracy')
  const [trendData, setTrendData] = useState<TrendData[]>([])
  const [alerts, setAlerts] = useState<RegressionAlert[]>([])
  const [loading, setLoading] = useState(false)
  const [summaryStats, setSummaryStats] = useState({
    totalRuns: 0,
    averageAccuracy: 0,
    accuracyTrend: 0,
    performanceImprovements: 0,
    regressions: 0
  })

  useEffect(() => {
    fetchHistoricalData()
    fetchRegressionAlerts()
  }, [timeRange])

  const fetchHistoricalData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/analytics/trends?timeframe=${timeRange}`)
      const data = await response.json()
      setTrendData(data.trends)
      setSummaryStats(data.summary)
    } catch (error) {
      console.error('Error fetching historical data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRegressionAlerts = async () => {
    try {
      const response = await fetch(`/api/analytics/regression-alerts`)
      const data = await response.json()
      setAlerts(data)
    } catch (error) {
      console.error('Error fetching alerts:', error)
    }
  }

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'border-red-500 bg-red-50'
      case 'medium': return 'border-orange-500 bg-orange-50'
      case 'low': return 'border-yellow-500 bg-yellow-50'
      default: return 'border-gray-500 bg-gray-50'
    }
  }

  const getAlertIcon = (severity: string) => {
    const className = severity === 'high' ? 'text-red-600' : 
                    severity === 'medium' ? 'text-orange-600' : 'text-yellow-600'
    return <AlertTriangle className={`h-4 w-4 ${className}`} />
  }

  const exportTrendData = () => {
    const csvContent = [
      ['Date', 'Accuracy', 'Execution Time', 'Prompt Version', 'Dataset', 'Run Count'],
      ...trendData.map(trend => [
        trend.date,
        trend.accuracy.toFixed(3),
        trend.execution_time.toString(),
        trend.prompt_version,
        trend.dataset_name,
        trend.run_count.toString()
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `historical-analysis-${timeRange}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Mock chart data (in a real implementation, you'd use a charting library like Chart.js or Recharts)
  const renderMockChart = (title: string, description: string) => (
    <div className="h-64 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
      <div className="text-center">
        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
        <h3 className="font-medium text-gray-600">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Historical Analysis</h1>
          <p className="text-muted-foreground">
            Track performance trends and identify regression patterns over time
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 days</SelectItem>
              <SelectItem value="30d">30 days</SelectItem>
              <SelectItem value="90d">90 days</SelectItem>
              <SelectItem value="1y">1 year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={exportTrendData}>
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Runs</p>
                <p className="text-2xl font-bold">{summaryStats.totalRuns}</p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Accuracy</p>
                <p className="text-2xl font-bold">
                  {(summaryStats.averageAccuracy * 100).toFixed(1)}%
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Trend</p>
                <p className={`text-2xl font-bold ${summaryStats.accuracyTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {summaryStats.accuracyTrend > 0 ? '+' : ''}{(summaryStats.accuracyTrend * 100).toFixed(2)}%
                </p>
              </div>
              {summaryStats.accuracyTrend >= 0 ? (
                <TrendingUp className="h-8 w-8 text-green-600" />
              ) : (
                <TrendingDown className="h-8 w-8 text-red-600" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Improvements</p>
                <p className="text-2xl font-bold text-green-600">
                  {summaryStats.performanceImprovements}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Regressions</p>
                <p className="text-2xl font-bold text-red-600">
                  {summaryStats.regressions}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Regression Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5 text-red-600" />
              Active Regression Alerts
            </CardTitle>
            <CardDescription>
              Performance degradations detected that require attention
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.slice(0, 3).map((alert) => (
              <Alert key={alert.id} className={getAlertColor(alert.severity)}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getAlertIcon(alert.severity)}
                    <div>
                      <AlertTitle className="text-sm">
                        {alert.prompt_family} - {alert.severity.toUpperCase()} Severity
                      </AlertTitle>
                      <AlertDescription className="text-sm">
                        {alert.description}
                      </AlertDescription>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>Current: {(alert.current_accuracy * 100).toFixed(1)}%</span>
                        <span>Baseline: {(alert.baseline_accuracy * 100).toFixed(1)}%</span>
                        <span>Drop: {(alert.threshold_breach * 100).toFixed(1)}%</span>
                        <span>{new Date(alert.detected_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant={alert.severity === 'high' ? 'destructive' : 'secondary'}>
                    {alert.severity}
                  </Badge>
                </div>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Trend Analysis */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center">
                <LineChart className="mr-2 h-5 w-5" />
                Performance Trends
              </CardTitle>
              <CardDescription>
                Historical performance analysis over the selected time period
              </CardDescription>
            </div>
            
            <Select value={selectedMetric} onValueChange={setSelectedMetric}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="accuracy">Accuracy</SelectItem>
                <SelectItem value="execution_time">Execution Time</SelectItem>
                <SelectItem value="run_count">Run Frequency</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="chart">
            <TabsList>
              <TabsTrigger value="chart">Chart View</TabsTrigger>
              <TabsTrigger value="table">Table View</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="chart" className="space-y-4">
              {renderMockChart(
                `${selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)} Trend`,
                `Interactive chart showing ${selectedMetric} over ${timeRange}`
              )}
              
              <div className="grid grid-cols-2 gap-4">
                {renderMockChart(
                  "Prompt Version Performance",
                  "Compare accuracy across prompt versions"
                )}
                {renderMockChart(
                  "Dataset Performance",
                  "Performance breakdown by dataset"
                )}
              </div>
            </TabsContent>

            <TabsContent value="table" className="space-y-4">
              <div className="rounded-md border">
                <div className="bg-gray-50 px-4 py-2 border-b">
                  <h3 className="font-medium">Trend Data Points</h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-6 gap-4 text-sm font-medium text-muted-foreground mb-3">
                    <div>Date</div>
                    <div>Accuracy</div>
                    <div>Time (ms)</div>
                    <div>Version</div>
                    <div>Dataset</div>
                    <div>Runs</div>
                  </div>
                  {trendData.slice(0, 10).map((trend, index) => (
                    <div key={index} className="grid grid-cols-6 gap-4 text-sm py-2 border-b last:border-b-0">
                      <div>{new Date(trend.date).toLocaleDateString()}</div>
                      <div>{(trend.accuracy * 100).toFixed(1)}%</div>
                      <div>{trend.execution_time}ms</div>
                      <div className="font-mono text-xs">{trend.prompt_version}</div>
                      <div className="truncate">{trend.dataset_name}</div>
                      <div>{trend.run_count}</div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="insights" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Key Findings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-sm">Accuracy improved 2.3% over last 30 days</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <span className="text-sm">Execution time reduced by 15% on average</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full" />
                      <span className="text-sm">Version 2.1.3 shows best overall performance</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full" />
                      <span className="text-sm">2 datasets show declining accuracy trends</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-2">
                      <Target className="h-4 w-4 text-blue-600 mt-0.5" />
                      <span className="text-sm">Promote version 2.1.3 to production</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
                      <span className="text-sm">Investigate declining performance on cursive datasets</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Zap className="h-4 w-4 text-green-600 mt-0.5" />
                      <span className="text-sm">Consider A/B testing new optimization techniques</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="h-4 w-4 text-purple-600 mt-0.5" />
                      <span className="text-sm">Schedule weekly performance reviews</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Performance Distribution */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="mr-2 h-5 w-5" />
              Performance Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderMockChart(
              "Accuracy Distribution",
              "Performance distribution across all evaluations"
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Activity Heatmap
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderMockChart(
              "Evaluation Activity",
              "Daily evaluation frequency over time"
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default HistoricalAnalysis