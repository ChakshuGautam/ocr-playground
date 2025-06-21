'use client'

import { useEffect, useState } from 'react'
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertCircle, TrendingUp, TrendingDown, ArrowRight, Clock } from 'lucide-react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"

interface WordEvaluation {
  reference_word: string
  transcribed_word: string
  match: boolean
  reason_diff: string
  word_position: number
  id: number
  evaluation_id: number
}

interface Image {
  number: string
  url: string
  local_path: string
  reference_text: string
  id: number
  created_at: string
  updated_at: string
}

interface Evaluation {
  prompt_version: string
  ocr_output: string
  accuracy: number
  correct_words: number
  total_words: number
  processing_status: string
  error_message: string | null
  progress_percentage: number
  current_step: string | null
  estimated_completion: string | null
  id: number
  image_id: number
  created_at: string
  updated_at: string
  image: Image
  word_evaluations: WordEvaluation[]
}

interface PromptConfiguration {
  label: string
  family_id: number
  version: string
}

interface Dataset {
  name: string
  description: string
  status: string
  id: number
  image_count: number
  created_at: string
  updated_at: string
  last_used: string | null
}

interface EvaluationRun {
  id: number
  name: string
  description: string
  status: string
  progress_percentage: number
  created_at: string
  completed_at: string | null
  dataset_ids: number[]
}

export default function EvaluationReportPage() {
  const [evaluationRuns, setEvaluationRuns] = useState<EvaluationRun[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEvaluationRuns = async () => {
      try {
        const response = await fetch('/api/evaluation-runs')
        if (!response.ok) {
          throw new Error('Failed to fetch evaluation runs')
        }
        const data = await response.json()
        setEvaluationRuns(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchEvaluationRuns()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading evaluation runs...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-4xl">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'default'
      case 'failed':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Evaluation Reports</h1>
          <p className="mt-2 text-gray-600">
            View detailed analysis and comparison results for your A/B testing evaluation runs.
          </p>
        </div>

        {evaluationRuns.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Evaluation Runs Found</h3>
              <p className="text-gray-600 mb-4">
                You haven't created any evaluation runs yet. Start by creating an A/B test to compare different prompt versions.
              </p>
              <Link href="/create-test">
                <Button>Create A/B Test</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {evaluationRuns.map((run) => (
              <Card key={run.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{run.name}</CardTitle>
                      <CardDescription className="mt-2">{run.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(run.status)}
                      <Badge variant={getStatusColor(run.status)}>
                        {run.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="space-y-2">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>Created: {new Date(run.created_at).toLocaleDateString()}</span>
                        {run.completed_at && (
                          <span>Completed: {new Date(run.completed_at).toLocaleDateString()}</span>
                        )}
                        <span>{run.dataset_ids.length} dataset(s)</span>
                      </div>
                      {run.status === 'processing' && (
                        <div className="text-sm text-gray-600">
                          Progress: {run.progress_percentage}%
                        </div>
                      )}
                    </div>
                    <Link href={`/evaluation-report/${run.id}`}>
                      <Button variant="outline" className="flex items-center gap-2">
                        View Report
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div >
  )
}