import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BarChart3, TrendingUp, AlertCircle, CheckCircle, Plus, Play, Eye } from 'lucide-react'

interface Image {
  id: number
  file_path: string
  expected_text: string
  created_at: string
}

interface Evaluation {
  id: number
  prompt_template_id: number
  total_images: number
  processed_images: number
  progress_percentage: number
  current_step: string
  estimated_completion: string | null
  status: string
  accuracy_average: number | null
  created_at: string
  updated_at: string
  prompt_template?: {
    id: number
    name: string
    version: string
    template: string
  }
}

interface PromptTemplate {
  id: number
  name: string
  version: string
  template: string
  created_at: string
}

interface ActiveEvaluation {
  id: number
  progress_percentage: number
  current_step: string
  estimated_completion: string | null
  total_images: number
  processed_images: number
}

const API_BASE = 'http://localhost:8000/api'

export default function EvaluationDashboard() {
  const [images, setImages] = useState<Image[]>([])
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [promptTemplates, setPromptTemplates] = useState<PromptTemplate[]>([])
  const [activeEvaluations, setActiveEvaluations] = useState<ActiveEvaluation[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  
  // Form state for creating new evaluation
  const [newEvaluation, setNewEvaluation] = useState({
    prompt_template_id: '',
    selected_images: [] as number[]
  })

  // New prompt template form
  const [newPrompt, setNewPrompt] = useState({
    name: '',
    version: '1.0',
    template: ''
  })

  useEffect(() => {
    fetchData()
    // Set up polling for active evaluations
    const interval = setInterval(fetchActiveEvaluations, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      const [imagesRes, evaluationsRes, promptsRes, activeRes] = await Promise.all([
        fetch(`${API_BASE}/images`),
        fetch(`${API_BASE}/evaluations`),
        fetch(`${API_BASE}/prompt-templates`),
        fetch(`${API_BASE}/evaluations/active`)
      ])

      const [imagesData, evaluationsData, promptsData, activeData] = await Promise.all([
        imagesRes.json(),
        evaluationsRes.json(),
        promptsRes.json(),
        activeRes.json()
      ])

      setImages(imagesData.items || [])
      setEvaluations(evaluationsData.items || [])
      setPromptTemplates(promptsData || [])
      setActiveEvaluations(activeData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchActiveEvaluations = async () => {
    try {
      const res = await fetch(`${API_BASE}/evaluations/active`)
      const data = await res.json()
      setActiveEvaluations(data || [])
      
      // Refresh evaluations if any active ones completed
      if (activeEvaluations.some(evaluation => evaluation.progress_percentage === 100)) {
        fetchData()
      }
    } catch (error) {
      console.error('Error fetching active evaluations:', error)
    }
  }

  const createPromptTemplate = async () => {
    if (!newPrompt.name || !newPrompt.template) return

    try {
      const res = await fetch(`${API_BASE}/prompt-templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPrompt)
      })

      if (res.ok) {
        setNewPrompt({ name: '', version: '1.0', template: '' })
        fetchData()
      }
    } catch (error) {
      console.error('Error creating prompt template:', error)
    }
  }

  const createEvaluation = async () => {
    if (!newEvaluation.prompt_template_id) return

    try {
      const res = await fetch(`${API_BASE}/evaluations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt_template_id: parseInt(newEvaluation.prompt_template_id),
          image_ids: newEvaluation.selected_images.length > 0 ? newEvaluation.selected_images : undefined
        })
      })

      if (res.ok) {
        setNewEvaluation({ prompt_template_id: '', selected_images: [] })
        fetchData()
      }
    } catch (error) {
      console.error('Error creating evaluation:', error)
    }
  }

  const stats = {
    total_images: images.length,
    total_evaluations: evaluations.length,
    active_evaluations: activeEvaluations.length,
    completed_evaluations: evaluations.filter(e => e.status === 'completed').length,
    average_accuracy: evaluations.length > 0 
      ? evaluations
          .filter(e => e.accuracy_average !== null)
          .reduce((sum, e) => sum + (e.accuracy_average || 0), 0) / evaluations.filter(e => e.accuracy_average !== null).length
      : 0
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Images</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_images}</div>
            <p className="text-xs text-muted-foreground">
              Available for evaluation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Evaluations</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active_evaluations}</div>
            <p className="text-xs text-muted-foreground">
              Currently processing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed_evaluations}</div>
            <p className="text-xs text-muted-foreground">
              Total evaluations completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Accuracy</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.average_accuracy.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Across all evaluations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Evaluations Progress */}
      {activeEvaluations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Evaluations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeEvaluations.map((evaluation) => (
                <div key={evaluation.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Evaluation #{evaluation.id}</span>
                    <Badge variant="outline">{evaluation.current_step}</Badge>
                  </div>
                  <Progress value={evaluation.progress_percentage} className="h-2" />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{evaluation.processed_images}/{evaluation.total_images} images processed</span>
                    <span>{evaluation.progress_percentage}% complete</span>
                  </div>
                  {evaluation.estimated_completion && (
                    <p className="text-xs text-muted-foreground">
                      Est. completion: {new Date(evaluation.estimated_completion).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="create">Create Evaluation</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="prompts">Prompt Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Evaluations</CardTitle>
            </CardHeader>
            <CardContent>
              {evaluations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No evaluations found. Create your first evaluation to get started.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Prompt Template</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Accuracy</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {evaluations.slice(0, 10).map((evaluation) => (
                      <TableRow key={evaluation.id}>
                        <TableCell>{evaluation.id}</TableCell>
                        <TableCell>
                          {evaluation.prompt_template?.name || 'Unknown'} v{evaluation.prompt_template?.version || '1.0'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            evaluation.status === 'completed' ? 'default' :
                            evaluation.status === 'processing' ? 'secondary' :
                            evaluation.status === 'failed' ? 'destructive' : 'outline'
                          }>
                            {evaluation.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {evaluation.processed_images}/{evaluation.total_images}
                        </TableCell>
                        <TableCell>
                          {evaluation.accuracy_average !== null ? 
                            `${evaluation.accuracy_average.toFixed(1)}%` : 
                            'N/A'
                          }
                        </TableCell>
                        <TableCell>
                          {new Date(evaluation.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create New Evaluation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prompt-template">Prompt Template</Label>
                <Select 
                  value={newEvaluation.prompt_template_id} 
                  onValueChange={(value) => setNewEvaluation(prev => ({ ...prev, prompt_template_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a prompt template" />
                  </SelectTrigger>
                  <SelectContent>
                    {promptTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id.toString()}>
                        {template.name} v{template.version}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Image Selection</Label>
                <p className="text-sm text-muted-foreground">
                  Leave empty to evaluate all {images.length} images, or select specific images.
                </p>
                {/* TODO: Add multi-select for specific images */}
              </div>

              <Button 
                onClick={createEvaluation} 
                disabled={!newEvaluation.prompt_template_id}
                className="w-full"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Evaluation
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Evaluation History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Prompt Template</TableHead>
                    <TableHead>Images</TableHead>
                    <TableHead>Accuracy</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {evaluations.map((evaluation) => (
                    <TableRow key={evaluation.id}>
                      <TableCell>{evaluation.id}</TableCell>
                      <TableCell>
                        {evaluation.prompt_template?.name || 'Unknown'} v{evaluation.prompt_template?.version || '1.0'}
                      </TableCell>
                      <TableCell>{evaluation.total_images}</TableCell>
                      <TableCell>
                        {evaluation.accuracy_average !== null ? 
                          `${evaluation.accuracy_average.toFixed(1)}%` : 
                          'N/A'
                        }
                      </TableCell>
                      <TableCell>
                        {/* TODO: Calculate duration from created_at to updated_at */}
                        N/A
                      </TableCell>
                      <TableCell>
                        {new Date(evaluation.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prompts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create New Prompt Template</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prompt-name">Name</Label>
                  <Input
                    id="prompt-name"
                    value={newPrompt.name}
                    onChange={(e) => setNewPrompt(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Hindi Text Evaluation"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prompt-version">Version</Label>
                  <Input
                    id="prompt-version"
                    value={newPrompt.version}
                    onChange={(e) => setNewPrompt(prev => ({ ...prev, version: e.target.value }))}
                    placeholder="e.g., 1.0"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="prompt-template">Template</Label>
                <Textarea
                  id="prompt-template"
                  value={newPrompt.template}
                  onChange={(e) => setNewPrompt(prev => ({ ...prev, template: e.target.value }))}
                  placeholder="Enter your prompt template..."
                  rows={6}
                />
              </div>
              <Button onClick={createPromptTemplate} disabled={!newPrompt.name || !newPrompt.template}>
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Existing Prompt Templates</CardTitle>
            </CardHeader>
            <CardContent>
              {promptTemplates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No prompt templates found. Create your first template above.
                </div>
              ) : (
                <div className="space-y-4">
                  {promptTemplates.map((template) => (
                    <Card key={template.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{template.name} v{template.version}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <pre className="text-sm bg-muted p-3 rounded-md whitespace-pre-wrap">
                          {template.template}
                        </pre>
                        <p className="text-xs text-muted-foreground mt-2">
                          Created: {new Date(template.created_at).toLocaleString()}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 