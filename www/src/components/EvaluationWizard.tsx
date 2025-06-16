import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
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
  ChevronLeft,
  ChevronRight,
  Play,
  Settings,
  Database,
  GitBranch,
  Target,
  CheckCircle,
  AlertTriangle,
  Clock,
  Users
} from 'lucide-react'
import { 
  Dataset, 
  PromptFamily, 
  PromptVersion, 
  EvaluationRunConfig,
  DatasetStatus 
} from '@/types'

interface WizardStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
}

const EvaluationWizard: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [promptFamilies, setPromptFamilies] = useState<PromptFamily[]>([])
  const [selectedDatasets, setSelectedDatasets] = useState<number[]>([])
  const [selectedPrompts, setSelectedPrompts] = useState<{familyId: number, versionIds: number[]}[]>([])
  const [config, setConfig] = useState<Partial<EvaluationRunConfig>>({
    name: '',
    description: '',
    parallel_execution: true,
    enable_comparison: true
  })

  const steps: WizardStep[] = [
    {
      id: 'basics',
      title: 'Basic Information',
      description: 'Name and describe your evaluation run',
      icon: <Settings className="h-5 w-5" />
    },
    {
      id: 'datasets',
      title: 'Select Datasets',
      description: 'Choose which datasets to evaluate against',
      icon: <Database className="h-5 w-5" />
    },
    {
      id: 'prompts',
      title: 'Configure Prompts',
      description: 'Select prompt versions for A/B testing',
      icon: <GitBranch className="h-5 w-5" />
    },
    {
      id: 'matrix',
      title: 'Evaluation Matrix',
      description: 'Review your test combinations',
      icon: <Target className="h-5 w-5" />
    },
    {
      id: 'launch',
      title: 'Launch Run',
      description: 'Start your evaluation',
      icon: <Play className="h-5 w-5" />
    }
  ]

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [datasetsRes, promptsRes] = await Promise.all([
        fetch('/api/datasets'),
        fetch('/api/prompt-families')
      ])
      
      const datasetsData = await datasetsRes.json()
      const promptsData = await promptsRes.json()
      
      setDatasets(datasetsData.filter((d: Dataset) => d.status === DatasetStatus.READY))
      setPromptFamilies(promptsData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDatasetToggle = (datasetId: number) => {
    setSelectedDatasets(prev => 
      prev.includes(datasetId) 
        ? prev.filter(id => id !== datasetId)
        : [...prev, datasetId]
    )
  }

  const handlePromptVersionToggle = (familyId: number, versionId: number) => {
    setSelectedPrompts(prev => {
      const existing = prev.find(p => p.familyId === familyId)
      if (existing) {
        const updatedVersions = existing.versionIds.includes(versionId)
          ? existing.versionIds.filter(id => id !== versionId)
          : [...existing.versionIds, versionId]
        
        return prev.map(p => 
          p.familyId === familyId 
            ? { ...p, versionIds: updatedVersions }
            : p
        ).filter(p => p.versionIds.length > 0)
      } else {
        return [...prev, { familyId, versionIds: [versionId] }]
      }
    })
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleLaunch = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/evaluation-runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...config,
          dataset_ids: selectedDatasets,
          prompt_configurations: selectedPrompts.map(sp => ({
            family_id: sp.familyId,
            version_ids: sp.versionIds
          }))
        })
      })
      
      if (response.ok) {
        const run = await response.json()
        // Navigate to live monitor
        window.location.href = `/live-monitor/${run.id}`
      }
    } catch (error) {
      console.error('Error launching evaluation:', error)
    } finally {
      setLoading(false)
    }
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 0: return config.name && config.name.length > 0
      case 1: return selectedDatasets.length > 0
      case 2: return selectedPrompts.length > 0 && selectedPrompts.some(sp => sp.versionIds.length > 1)
      case 3: return true
      case 4: return true
      default: return false
    }
  }

  const getTotalCombinations = () => {
    const totalPromptVersions = selectedPrompts.reduce((sum, sp) => sum + sp.versionIds.length, 0)
    return selectedDatasets.length * totalPromptVersions
  }

  const getEstimatedTime = () => {
    const combinations = getTotalCombinations()
    const timePerCombination = 2 // minutes estimated
    return Math.ceil(combinations * timePerCombination)
  }

  if (loading && currentStep !== 4) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Evaluation Run Wizard</h1>
        <p className="text-muted-foreground">
          Set up a comprehensive A/B test for your OCR prompt experiments
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                index < currentStep ? 'bg-primary border-primary text-primary-foreground' :
                index === currentStep ? 'border-primary text-primary' :
                'border-muted text-muted-foreground'
              }`}>
                {index < currentStep ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  step.icon
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-2 ${
                  index < currentStep ? 'bg-primary' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>
        <Progress value={(currentStep / (steps.length - 1)) * 100} className="w-full" />
      </div>

      {/* Step Content */}
      <Card className="min-h-[500px]">
        <CardHeader>
          <CardTitle className="flex items-center">
            {steps[currentStep].icon}
            <span className="ml-2">{steps[currentStep].title}</span>
          </CardTitle>
          <CardDescription>{steps[currentStep].description}</CardDescription>
        </CardHeader>

        <CardContent>
          {/* Step 0: Basic Information */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="run-name">Evaluation Run Name</Label>
                  <Input
                    id="run-name"
                    value={config.name || ''}
                    onChange={(e) => setConfig({ ...config, name: e.target.value })}
                    placeholder="e.g., Hindi Handwriting A/B Test v2.1"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={config.description || ''}
                    onChange={(e) => setConfig({ ...config, description: e.target.value })}
                    placeholder="Describe what you're testing and why..."
                    rows={4}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Execution Options</h3>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="parallel"
                    checked={config.parallel_execution}
                    onCheckedChange={(checked) => setConfig({ ...config, parallel_execution: !!checked })}
                  />
                  <Label htmlFor="parallel">Enable parallel execution (faster but uses more resources)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="comparison"
                    checked={config.enable_comparison}
                    onCheckedChange={(checked) => setConfig({ ...config, enable_comparison: !!checked })}
                  />
                  <Label htmlFor="comparison">Enable real-time comparison dashboard</Label>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Dataset Selection */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="grid gap-4">
                {datasets.map((dataset) => (
                  <div key={dataset.id} className="flex items-center space-x-3 p-4 border rounded-lg">
                    <Checkbox
                      checked={selectedDatasets.includes(dataset.id)}
                      onCheckedChange={() => handleDatasetToggle(dataset.id)}
                    />
                    <div className="flex-1">
                      <h4 className="font-medium">{dataset.name}</h4>
                      <p className="text-sm text-muted-foreground">{dataset.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">{dataset.image_count} images</Badge>
                        <Badge variant="outline">{dataset.file_type}</Badge>
                        {dataset.tags.slice(0, 2).map((tag: string) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {selectedDatasets.length > 0 && (
                <div className="p-4 bg-primary/5 rounded-lg">
                  <p className="text-sm">
                    <strong>{selectedDatasets.length}</strong> datasets selected with{' '}
                    <strong>
                      {datasets
                        .filter(d => selectedDatasets.includes(d.id))
                        .reduce((sum, d) => sum + d.image_count, 0)
                      }
                    </strong>{' '}
                    total images
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Prompt Configuration */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-blue-600 mr-2" />
                  <p className="text-sm text-blue-800">
                    Select multiple versions from each family for A/B testing. Single versions will be used as controls.
                  </p>
                </div>
              </div>

              {promptFamilies.map((family) => (
                <Card key={family.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{family.name}</CardTitle>
                    <CardDescription>{family.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2">
                      {/* This would need to be populated with versions from the API */}
                      <p className="text-sm text-muted-foreground">
                        📝 Versions would be loaded from the API here
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Step 3: Evaluation Matrix */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <Database className="h-8 w-8 text-blue-600 mr-3" />
                      <div>
                        <p className="text-2xl font-bold">{selectedDatasets.length}</p>
                        <p className="text-sm text-muted-foreground">Datasets</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <GitBranch className="h-8 w-8 text-green-600 mr-3" />
                      <div>
                        <p className="text-2xl font-bold">
                          {selectedPrompts.reduce((sum, sp) => sum + sp.versionIds.length, 0)}
                        </p>
                        <p className="text-sm text-muted-foreground">Prompt Versions</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <Target className="h-8 w-8 text-purple-600 mr-3" />
                      <div>
                        <p className="text-2xl font-bold">{getTotalCombinations()}</p>
                        <p className="text-sm text-muted-foreground">Total Tests</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-4">Execution Estimate</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span>Estimated Duration:</span>
                    <span className="font-medium">{getEstimatedTime()} minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Parallel Execution:</span>
                    <span className="font-medium">{config.parallel_execution ? 'Enabled' : 'Disabled'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Real-time Comparison:</span>
                    <span className="font-medium">{config.enable_comparison ? 'Enabled' : 'Disabled'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Launch */}
          {currentStep === 4 && (
            <div className="space-y-6 text-center">
              <div className="space-y-4">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
                <h3 className="text-2xl font-bold">Ready to Launch</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Your evaluation run "<strong>{config.name}</strong>" is configured and ready to start.
                  You'll be redirected to the live monitoring dashboard.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 max-w-md mx-auto">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Datasets:</span>
                    <span className="font-medium">{selectedDatasets.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Prompt Versions:</span>
                    <span className="font-medium">
                      {selectedPrompts.reduce((sum, sp) => sum + sp.versionIds.length, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Evaluations:</span>
                    <span className="font-medium">{getTotalCombinations()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Est. Duration:</span>
                    <span className="font-medium">{getEstimatedTime()} min</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button 
          variant="outline" 
          onClick={handlePrevious}
          disabled={currentStep === 0}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>

        <div className="flex gap-2">
          {currentStep === steps.length - 1 ? (
            <Button 
              onClick={handleLaunch}
              disabled={loading || !isStepValid()}
            >
              {loading ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Launching...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Launch Evaluation
                </>
              )}
            </Button>
          ) : (
            <Button 
              onClick={handleNext}
              disabled={!isStepValid()}
            >
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default EvaluationWizard