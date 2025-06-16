import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  Activity, 
  BarChart3, 
  Database, 
  FileText, 
  Plus, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  PlayCircle
} from 'lucide-react'
import { 
  DashboardStats, 
  EvaluationRun, 
  Dataset, 
  PromptFamily,
  ProcessingStatus,
  DatasetStatus,
  PromptStatus
} from '@/types'

interface DashboardProps {}

const Dashboard: React.FC<DashboardProps> = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activeRuns, setActiveRuns] = useState<EvaluationRun[]>([])
  const [recentResults, setRecentResults] = useState<EvaluationRun[]>([])
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [promptFamilies, setPromptFamilies] = useState<PromptFamily[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch dashboard statistics
        const statsResponse = await fetch('/api/stats/evaluations')
        const statsData = await statsResponse.json()
        setStats(statsData)

        // Fetch active evaluation runs
        const activeResponse = await fetch('/api/evaluation-runs?status=processing')
        const activeData = await activeResponse.json()
        setActiveRuns(activeData)

        // Fetch recent completed evaluation runs
        const recentResponse = await fetch('/api/evaluation-runs?status=success&limit=5')
        const recentData = await recentResponse.json()
        setRecentResults(recentData)

        // Fetch datasets summary
        const datasetsResponse = await fetch('/api/datasets')
        const datasetsData = await datasetsResponse.json()
        setDatasets(datasetsData)

        // Fetch prompt families
        const promptsResponse = await fetch('/api/prompt-families')
        const promptsData = await promptsResponse.json()
        setPromptFamilies(promptsData)

      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
    
    // Set up periodic refresh for active runs
    const interval = setInterval(() => {
      fetchDashboardData()
    }, 5000) // Refresh every 5 seconds

    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: ProcessingStatus) => {
    switch (status) {
      case ProcessingStatus.SUCCESS:
        return 'bg-green-500'
      case ProcessingStatus.PROCESSING:
        return 'bg-blue-500'
      case ProcessingStatus.FAILED:
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: ProcessingStatus) => {
    switch (status) {
      case ProcessingStatus.SUCCESS:
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case ProcessingStatus.PROCESSING:
        return <PlayCircle className="h-4 w-4 text-blue-600" />
      case ProcessingStatus.FAILED:
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Evaluation Hub</h1>
          <p className="text-muted-foreground">
            Overview of your OCR evaluation pipeline and A/B testing workflow
          </p>
        </div>
        <Link to="/evaluation-runs/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Evaluation Run
          </Button>
        </Link>
      </div>

      {/* Main Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 1: Active Evaluation Runs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5" />
              Active Evaluation Runs
            </CardTitle>
            <CardDescription>
              Real-time status of running evaluations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeRuns.length > 0 ? (
              <div className="space-y-4">
                {activeRuns.map((run) => (
                  <div key={run.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">{run.name}</h4>
                        <p className="text-sm text-muted-foreground">{run.current_step}</p>
                      </div>
                      {getStatusIcon(run.status)}
                    </div>
                    <Progress value={run.progress_percentage} className="mb-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{run.progress_percentage}% complete</span>
                      <Link to={`/evaluation-runs/${run.id}/monitor`}>
                        <Button variant="ghost" size="sm">View Details</Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p>No active evaluation runs</p>
                <Link to="/evaluation-runs/new">
                  <Button variant="outline" size="sm" className="mt-2">
                    Start New Evaluation
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 2: Recent Evaluation Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5" />
              Recent Evaluation Results
            </CardTitle>
            <CardDescription>
              Latest completed A/B test results
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentResults.length > 0 ? (
              <div className="space-y-3">
                {recentResults.map((run) => (
                  <div key={run.id} className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <h4 className="font-medium">{run.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Completed {new Date(run.completed_at!).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="mb-1">
                        {getStatusIcon(run.status)}
                      </Badge>
                      <Link to={`/evaluation-runs/${run.id}/comparison`}>
                        <Button variant="ghost" size="sm">
                          View Comparison
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
                <Link to="/evaluation-runs" className="block">
                  <Button variant="outline" className="w-full">
                    View All Results
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p>No completed evaluations yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 3: Prompt Library Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Prompt Library Summary
            </CardTitle>
            <CardDescription>
              Overview of your prompt templates and versions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{promptFamilies.length}</div>
                  <div className="text-sm text-muted-foreground">Prompt Families</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {promptFamilies.filter(f => f.production_version).length}
                  </div>
                  <div className="text-sm text-muted-foreground">In Production</div>
                </div>
              </div>
              
              {promptFamilies.length > 0 && (
                <div className="space-y-2">
                  <h5 className="font-medium">Recent Families</h5>
                  {promptFamilies.slice(0, 3).map((family) => (
                    <div key={family.id} className="flex justify-between items-center">
                      <span className="text-sm">{family.name}</span>
                      <Badge variant={family.production_version ? "default" : "secondary"}>
                        {family.production_version || "Draft"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
              
              <Link to="/prompt-library">
                <Button variant="outline" className="w-full">
                  <FileText className="mr-2 h-4 w-4" />
                  Go to Library
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Dataset Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="mr-2 h-5 w-5" />
              Dataset Overview
            </CardTitle>
            <CardDescription>
              Ground truth data for evaluations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{datasets.length}</div>
                  <div className="text-sm text-muted-foreground">Total Datasets</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {datasets.reduce((sum, d) => sum + d.image_count, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Images</div>
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="font-medium">Dataset Status</h5>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Validated</span>
                    <span className="text-green-600">
                      {datasets.filter(d => d.status === DatasetStatus.VALIDATED).length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Draft</span>
                    <span className="text-orange-600">
                      {datasets.filter(d => d.status === DatasetStatus.DRAFT).length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Archived</span>
                    <span className="text-gray-600">
                      {datasets.filter(d => d.status === DatasetStatus.ARCHIVED).length}
                    </span>
                  </div>
                </div>
              </div>

              <Link to="/datasets">
                <Button variant="outline" className="w-full">
                  <Database className="mr-2 h-4 w-4" />
                  Manage Datasets
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Summary */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              Performance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.total_evaluations}</div>
                <div className="text-sm text-muted-foreground">Total Evaluations</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.successful_evaluations}</div>
                <div className="text-sm text-muted-foreground">Successful</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.pending_evaluations}</div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.failed_evaluations}</div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {stats.average_accuracy ? `${stats.average_accuracy.toFixed(1)}%` : 'N/A'}
                </div>
                <div className="text-sm text-muted-foreground">Avg Accuracy</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default Dashboard