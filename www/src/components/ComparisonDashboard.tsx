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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  GitCompare,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  ArrowRight,
  Download,
  Filter
} from 'lucide-react'
import { 
  EvaluationRun, 
  PromptVersion, 
  Evaluation 
} from '@/types'

interface ComparisonResult {
  prompt_a: PromptVersion
  prompt_b: PromptVersion
  accuracy_a: number
  accuracy_b: number
  accuracy_diff: number
  sample_count: number
  confidence: number
  image_comparisons: ImageComparison[]
}

interface ImageComparison {
  image_id: number
  image_name: string
  ground_truth: string
  result_a: string
  result_b: string
  accuracy_a: number
  accuracy_b: number
  is_significant: boolean
}

const ComparisonDashboard: React.FC = () => {
  const [runs, setRuns] = useState<EvaluationRun[]>([])
  const [selectedRun, setSelectedRun] = useState<string>('')
  const [comparisons, setComparisons] = useState<ComparisonResult[]>([])
  const [selectedComparison, setSelectedComparison] = useState<ComparisonResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [filterSignificant, setFilterSignificant] = useState(false)

  useEffect(() => {
    fetchCompletedRuns()
  }, [])

  useEffect(() => {
    if (selectedRun) {
      fetchComparisons(selectedRun)
    }
  }, [selectedRun])

  const fetchCompletedRuns = async () => {
    try {
      const response = await fetch('/api/evaluation-runs?status=completed')
      const data = await response.json()
      setRuns(data)
      
      if (data.length > 0) {
        setSelectedRun(data[0].id.toString())
      }
    } catch (error) {
      console.error('Error fetching runs:', error)
    }
  }

  const fetchComparisons = async (runId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/evaluation-runs/${runId}/comparisons`)
      const data = await response.json()
      setComparisons(data)
      
      if (data.length > 0) {
        setSelectedComparison(data[0])
      }
    } catch (error) {
      console.error('Error fetching comparisons:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSignificanceColor = (diff: number, confidence: number) => {
    if (confidence < 0.95) return 'text-gray-500'
    if (Math.abs(diff) < 0.01) return 'text-gray-500'
    return diff > 0 ? 'text-green-600' : 'text-red-600'
  }

  const getSignificanceIcon = (diff: number, confidence: number) => {
    if (confidence < 0.95 || Math.abs(diff) < 0.01) {
      return <div className="w-4 h-4" />
    }
    return diff > 0 ? 
      <TrendingUp className="w-4 h-4 text-green-600" /> :
      <TrendingDown className="w-4 h-4 text-red-600" />
  }

  const exportResults = () => {
    const csvContent = [
      ['Prompt A', 'Prompt B', 'Accuracy A', 'Accuracy B', 'Difference', 'Confidence', 'Sample Count'],
      ...comparisons.map(comp => [
        comp.prompt_a.version,
        comp.prompt_b.version,
        comp.accuracy_a.toFixed(3),
        comp.accuracy_b.toFixed(3),
        comp.accuracy_diff.toFixed(3),
        comp.confidence.toFixed(3),
        comp.sample_count.toString()
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `comparison-results-${selectedRun}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filteredComparisons = filterSignificant
    ? comparisons.filter(c => c.confidence >= 0.95 && Math.abs(c.accuracy_diff) >= 0.01)
    : comparisons

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
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
          <h1 className="text-3xl font-bold tracking-tight">Comparison Dashboard</h1>
          <p className="text-muted-foreground">
            Analyze A/B test results and compare prompt performance
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={selectedRun} onValueChange={setSelectedRun}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select an evaluation run" />
            </SelectTrigger>
            <SelectContent>
              {runs.map((run) => (
                <SelectItem key={run.id} value={run.id.toString()}>
                  {run.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={exportResults}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filterSignificant}
                onChange={(e) => setFilterSignificant(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Show only statistically significant results</span>
            </label>
            <Badge variant="outline">
              {filteredComparisons.length} of {comparisons.length} comparisons
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-5 gap-6">
        {/* Comparison List */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <GitCompare className="mr-2 h-5 w-5" />
              Prompt Comparisons
            </CardTitle>
            <CardDescription>
              Select a comparison to view detailed results
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {filteredComparisons.map((comparison, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedComparison === comparison 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:bg-muted/50'
                }`}
                onClick={() => setSelectedComparison(comparison)}
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="font-mono text-xs text-blue-600">
                      v{comparison.prompt_a.version}
                    </span>
                    <ArrowRight className="inline mx-2 h-3 w-3" />
                    <span className="font-mono text-xs text-green-600">
                      v{comparison.prompt_b.version}
                    </span>
                  </div>
                  {getSignificanceIcon(comparison.accuracy_diff, comparison.confidence)}
                </div>
                
                <div className="flex items-center justify-between mt-2">
                  <div className="text-xs text-muted-foreground">
                    {comparison.sample_count} samples
                  </div>
                  <div className={`text-sm font-medium ${getSignificanceColor(comparison.accuracy_diff, comparison.confidence)}`}>
                    {comparison.accuracy_diff > 0 ? '+' : ''}{(comparison.accuracy_diff * 100).toFixed(2)}%
                  </div>
                </div>
                
                <div className="mt-2">
                  <div className="flex justify-between text-xs">
                    <span>{(comparison.accuracy_a * 100).toFixed(1)}%</span>
                    <span>{(comparison.accuracy_b * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div 
                      className="bg-blue-600 h-1.5 rounded-full" 
                      style={{ width: `${comparison.accuracy_a * 100}%` }}
                    />
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div 
                      className="bg-green-600 h-1.5 rounded-full" 
                      style={{ width: `${comparison.accuracy_b * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Detailed View */}
        <Card className="col-span-3">
          {selectedComparison ? (
            <Tabs defaultValue="overview">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center">
                      <BarChart3 className="mr-2 h-5 w-5" />
                      Detailed Comparison
                    </CardTitle>
                    <CardDescription>
                      v{selectedComparison.prompt_a.version} vs v{selectedComparison.prompt_b.version}
                    </CardDescription>
                  </div>
                  <Badge 
                    variant={selectedComparison.confidence >= 0.95 ? 'default' : 'secondary'}
                  >
                    {(selectedComparison.confidence * 100).toFixed(1)}% confidence
                  </Badge>
                </div>
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="samples">Sample Analysis</TabsTrigger>
                  <TabsTrigger value="prompts">Prompt Diff</TabsTrigger>
                </TabsList>
              </CardHeader>

              <CardContent>
                <TabsContent value="overview" className="space-y-6">
                  {/* Performance Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Prompt A (v{selectedComparison.prompt_a.version})</p>
                          <p className="text-3xl font-bold text-blue-600">
                            {(selectedComparison.accuracy_a * 100).toFixed(2)}%
                          </p>
                          <p className="text-xs text-muted-foreground">Accuracy</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Prompt B (v{selectedComparison.prompt_b.version})</p>
                          <p className="text-3xl font-bold text-green-600">
                            {(selectedComparison.accuracy_b * 100).toFixed(2)}%
                          </p>
                          <p className="text-xs text-muted-foreground">Accuracy</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Statistical Summary */}
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-medium mb-3">Statistical Summary</h3>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                          <p className="font-medium">Difference</p>
                          <p className={`text-lg ${getSignificanceColor(selectedComparison.accuracy_diff, selectedComparison.confidence)}`}>
                            {selectedComparison.accuracy_diff > 0 ? '+' : ''}{(selectedComparison.accuracy_diff * 100).toFixed(3)}%
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium">Sample Size</p>
                          <p className="text-lg">{selectedComparison.sample_count}</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium">Confidence</p>
                          <p className="text-lg">{(selectedComparison.confidence * 100).toFixed(1)}%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="samples" className="space-y-4">
                  <div className="max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Image</TableHead>
                          <TableHead>Ground Truth</TableHead>
                          <TableHead>Prompt A Result</TableHead>
                          <TableHead>Prompt B Result</TableHead>
                          <TableHead>Winner</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedComparison.image_comparisons.slice(0, 20).map((img) => (
                          <TableRow key={img.image_id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <ImageIcon className="h-4 w-4" />
                                <span className="text-sm">{img.image_name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {img.ground_truth}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm">{img.result_a}</span>
                                {img.accuracy_a === 1 ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-600" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm">{img.result_b}</span>
                                {img.accuracy_b === 1 ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-600" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {img.accuracy_a > img.accuracy_b ? (
                                <Badge variant="outline" className="text-blue-600">A</Badge>
                              ) : img.accuracy_b > img.accuracy_a ? (
                                <Badge variant="outline" className="text-green-600">B</Badge>
                              ) : (
                                <Badge variant="secondary">Tie</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="prompts" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg text-blue-600">
                          Prompt A (v{selectedComparison.prompt_a.version})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <pre className="bg-gray-50 p-4 rounded text-sm font-mono whitespace-pre-wrap">
                          {selectedComparison.prompt_a.prompt_text}
                        </pre>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg text-green-600">
                          Prompt B (v{selectedComparison.prompt_b.version})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <pre className="bg-gray-50 p-4 rounded text-sm font-mono whitespace-pre-wrap">
                          {selectedComparison.prompt_b.prompt_text}
                        </pre>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Change Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Version</Badge>
                          <span className="text-sm">
                            {selectedComparison.prompt_a.version} → {selectedComparison.prompt_b.version}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Performance</Badge>
                          <span className="text-sm">
                            {(selectedComparison.accuracy_a * 100).toFixed(2)}% → {(selectedComparison.accuracy_b * 100).toFixed(2)}%
                            <span className={getSignificanceColor(selectedComparison.accuracy_diff, selectedComparison.confidence)}>
                              {' '}({selectedComparison.accuracy_diff > 0 ? '+' : ''}{(selectedComparison.accuracy_diff * 100).toFixed(2)}%)
                            </span>
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </CardContent>
            </Tabs>
          ) : (
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center">
                <GitCompare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Comparison Selected</h3>
                <p className="text-muted-foreground">
                  Select a prompt comparison from the left panel to view detailed analysis
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}

export default ComparisonDashboard