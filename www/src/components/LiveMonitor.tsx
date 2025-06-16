import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Play,
  Pause,
  Square,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Monitor,
  Download,
  RefreshCw,
  Zap,
  Target
} from 'lucide-react'
import { 
  EvaluationRun, 
  ProcessingStatus,
  EvaluationRunStatus 
} from '@/types'

interface LiveMonitorProps {
  runId: string
}

interface LogEntry {
  timestamp: string
  level: 'info' | 'warning' | 'error' | 'success'
  message: string
  details?: any
}

const LiveMonitor: React.FC<LiveMonitorProps> = ({ runId }) => {
  const [run, setRun] = useState<EvaluationRun | null>(null)
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [metrics, setMetrics] = useState({
    completed: 0,
    total: 0,
    averageAccuracy: 0,
    averageTime: 0,
    errorRate: 0
  })
  
  const logsEndRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    fetchRunDetails()
    connectWebSocket()
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [runId])

  useEffect(() => {
    scrollToBottom()
  }, [logs])

  const fetchRunDetails = async () => {
    try {
      const response = await fetch(`/api/evaluation-runs/${runId}`)
      const data = await response.json()
      setRun(data)
      
      // Calculate initial metrics
      updateMetrics(data)
    } catch (error) {
      console.error('Error fetching run details:', error)
    } finally {
      setLoading(false)
    }
  }

  const connectWebSocket = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws/evaluation-runs/${runId}`
    
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      setIsStreaming(true)
      addLog('info', 'Connected to live monitoring stream')
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      
      switch (data.type) {
        case 'log':
          addLog(data.level, data.message, data.details)
          break
        case 'progress':
          updateProgress(data)
          break
        case 'metrics':
          setMetrics(data)
          break
        case 'status_change':
          setRun(prev => prev ? { ...prev, status: data.status } : null)
          break
      }
    }

    ws.onclose = () => {
      setIsStreaming(false)
      addLog('warning', 'Disconnected from live monitoring stream')
    }

    ws.onerror = (error) => {
      addLog('error', 'WebSocket error occurred', error)
    }
  }

  const addLog = (level: LogEntry['level'], message: string, details?: any) => {
    const newLog: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      details
    }
    setLogs(prev => [...prev, newLog])
  }

  const updateProgress = (data: any) => {
    setRun(prev => prev ? {
      ...prev,
      progress: data.progress,
      current_step: data.current_step,
      total_steps: data.total_steps
    } : null)
  }

  const updateMetrics = (runData: EvaluationRun) => {
    // This would be calculated from the actual evaluation data
    const completed = runData.progress || 0
    const total = runData.total_steps || 100
    
    setMetrics({
      completed,
      total,
      averageAccuracy: 0, // Would be calculated from results
      averageTime: 0, // Would be calculated from execution times
      errorRate: 0 // Would be calculated from failed evaluations
    })
  }

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleControlAction = async (action: 'pause' | 'resume' | 'stop') => {
    try {
      const response = await fetch(`/api/evaluation-runs/${runId}/${action}`, {
        method: 'POST'
      })
      
      if (response.ok) {
        addLog('info', `Evaluation run ${action}d`)
        await fetchRunDetails()
      }
    } catch (error) {
      addLog('error', `Failed to ${action} evaluation run`, error)
    }
  }

  const downloadLogs = () => {
    const logsText = logs.map(log => 
      `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}`
    ).join('\n')
    
    const blob = new Blob([logsText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `evaluation-run-${runId}-logs.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getStatusIcon = (status: EvaluationRunStatus) => {
    switch (status) {
      case EvaluationRunStatus.RUNNING:
        return <Activity className="h-5 w-5 text-blue-600 animate-pulse" />
      case EvaluationRunStatus.COMPLETED:
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case EvaluationRunStatus.FAILED:
        return <AlertCircle className="h-5 w-5 text-red-600" />
      case EvaluationRunStatus.PAUSED:
        return <Pause className="h-5 w-5 text-orange-600" />
      default:
        return <Clock className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusBadge = (status: EvaluationRunStatus) => {
    const variants = {
      [EvaluationRunStatus.RUNNING]: 'default',
      [EvaluationRunStatus.COMPLETED]: 'default',
      [EvaluationRunStatus.FAILED]: 'destructive',
      [EvaluationRunStatus.PAUSED]: 'secondary',
      [EvaluationRunStatus.PENDING]: 'outline'
    }
    return variants[status] || 'outline'
  }

  const getLogIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'warning': return <AlertCircle className="h-4 w-4 text-orange-600" />
      case 'error': return <AlertCircle className="h-4 w-4 text-red-600" />
      default: return <Monitor className="h-4 w-4 text-blue-600" />
    }
  }

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

  if (!run) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-red-600 mb-4" />
              <h3 className="text-lg font-medium mb-2">Evaluation Run Not Found</h3>
              <p className="text-muted-foreground">
                The evaluation run with ID {runId} could not be found.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            {getStatusIcon(run.status)}
            <span className="ml-3">{run.name}</span>
          </h1>
          <p className="text-muted-foreground mt-1">{run.description}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant={getStatusBadge(run.status) as any} className="flex items-center gap-1">
            {run.status}
          </Badge>
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-muted-foreground">
              {isStreaming ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Progress</p>
                <p className="text-2xl font-bold">
                  {Math.round((run.progress || 0) * 100)}%
                </p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
            <Progress value={(run.progress || 0) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">
                  {metrics.completed}/{metrics.total}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Accuracy</p>
                <p className="text-2xl font-bold">
                  {metrics.averageAccuracy.toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Runtime</p>
                <p className="text-2xl font-bold">
                  {Math.floor(metrics.averageTime / 60)}m
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="mr-2 h-5 w-5" />
            Execution Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            {run.status === EvaluationRunStatus.RUNNING && (
              <Button 
                variant="outline"
                onClick={() => handleControlAction('pause')}
              >
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </Button>
            )}
            
            {run.status === EvaluationRunStatus.PAUSED && (
              <Button 
                onClick={() => handleControlAction('resume')}
              >
                <Play className="mr-2 h-4 w-4" />
                Resume
              </Button>
            )}
            
            {[EvaluationRunStatus.RUNNING, EvaluationRunStatus.PAUSED].includes(run.status) && (
              <Button 
                variant="destructive"
                onClick={() => handleControlAction('stop')}
              >
                <Square className="mr-2 h-4 w-4" />
                Stop
              </Button>
            )}
            
            <Button 
              variant="outline"
              onClick={downloadLogs}
            >
              <Download className="mr-2 h-4 w-4" />
              Download Logs
            </Button>
            
            <Button 
              variant="outline"
              onClick={fetchRunDetails}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-2 gap-6">
        {/* Live Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Monitor className="mr-2 h-5 w-5" />
                Live Logs
              </span>
              <Badge variant={isStreaming ? 'default' : 'secondary'}>
                {isStreaming ? 'Streaming' : 'Offline'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-black text-green-400 font-mono text-sm p-4 rounded h-96 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="flex items-start gap-2 mb-1">
                  {getLogIcon(log.level)}
                  <span className="text-gray-400 text-xs min-w-[80px]">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="flex-1">{log.message}</span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </CardContent>
        </Card>

        {/* Progress Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5" />
              Progress Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Overall Progress</span>
                  <span>{Math.round((run.progress || 0) * 100)}%</span>
                </div>
                <Progress value={(run.progress || 0) * 100} />
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Current Step</h4>
                <p className="text-sm text-muted-foreground">
                  {run.current_step || 'Initializing...'}
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Performance Metrics</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span>Success Rate:</span>
                    <span>{((1 - metrics.errorRate) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Error Rate:</span>
                    <span>{(metrics.errorRate * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Time/Image:</span>
                    <span>{(metrics.averageTime / 1000).toFixed(2)}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Throughput:</span>
                    <span>{Math.round(60000 / metrics.averageTime)}/min</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results Preview */}
      {run.status === EvaluationRunStatus.COMPLETED && (
        <Card>
          <CardHeader>
            <CardTitle>Results Summary</CardTitle>
            <CardDescription>
              Evaluation completed successfully. View detailed results in the comparison dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {metrics.averageAccuracy.toFixed(1)}%
                </p>
                <p className="text-sm text-muted-foreground">Average Accuracy</p>
              </div>
              <Button>
                View Detailed Results
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default LiveMonitor