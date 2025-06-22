'use client'

import { Sidebar } from "@/components/sidebar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useEffect, useState } from "react"
import Link from "next/link"

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

interface Dataset {
  id: number
  name: string
  description: string
  status: string
  created_at: string
  updated_at: string
}

function getStatusBadge(status: string) {
  switch (status) {
    case "processing":
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          In Progress
        </Badge>
      )
    case "success":
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          Completed
        </Badge>
      )
    case "failed":
      return (
        <Badge variant="secondary" className="bg-red-100 text-red-800">
          Failed
        </Badge>
      )
    case "pending":
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-800">
          Pending
        </Badge>
      )
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export default function DashboardPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [evaluationRuns, setEvaluationRuns] = useState<EvaluationRun[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch datasets
        const datasetsResponse = await fetch("/api/datasets")
        const datasetsData = await datasetsResponse.json()
        const datasetsArray = Array.isArray(datasetsData) ? datasetsData : (datasetsData?.data || [])
        setDatasets(datasetsArray)

        // Fetch evaluation runs
        const evaluationsResponse = await fetch("/api/evaluation-runs")
        const evaluationsData = await evaluationsResponse.json()
        const evaluationsArray = Array.isArray(evaluationsData) ? evaluationsData : (evaluationsData?.data || [])
        setEvaluationRuns(evaluationsArray)
      } catch (error) {
        console.error('Error fetching data:', error)
        setDatasets([])
        setEvaluationRuns([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Get all evaluations sorted by creation date (most recent first)
  const allEvaluations = evaluationRuns
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10) // Limit to 10 most recent

  // Helper function to get dataset name by ID
  const getDatasetName = (datasetIds: number[]) => {
    if (datasetIds.length === 0) return "No Dataset"
    const dataset = datasets.find(d => d.id === datasetIds[0])
    return dataset ? dataset.name : `Dataset ${datasetIds[0]}`
  }

  // Helper function to get result display
  const getResultDisplay = (evaluation: EvaluationRun) => {
    if (evaluation.status === 'success') {
      return (
        <span className="font-semibold text-green-600">
          {evaluation.progress_percentage}%
        </span>
      )
    } else if (evaluation.status === 'processing') {
      return (
        <span className="font-semibold text-blue-600">
          {evaluation.progress_percentage}%
        </span>
      )
    } else {
      return (
        <span className="text-gray-500">
          -
        </span>
      )
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar currentPath="/dashboard" />
        <main className="flex-1 p-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar currentPath="/dashboard" />

      <main className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        </div>

        <div className="space-y-8">
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-xl font-semibold text-gray-900">All Evaluations</h2>

            {allEvaluations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No evaluations found. Create your first A/B test to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Evaluation Name</TableHead>
                    <TableHead>Dataset</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress/Result</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Completed At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allEvaluations.map((evaluation) => (
                    <TableRow key={evaluation.id}>
                      <TableCell className="font-medium">{evaluation.name}</TableCell>
                      <TableCell>
                        <Button variant="link" className="h-auto p-0 text-blue-600">
                          {getDatasetName(evaluation.dataset_ids)}
                        </Button>
                      </TableCell>
                      <TableCell>{getStatusBadge(evaluation.status)}</TableCell>
                      <TableCell>
                        {getResultDisplay(evaluation)}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {new Date(evaluation.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {evaluation.completed_at 
                          ? new Date(evaluation.completed_at).toLocaleDateString()
                          : '-'
                        }
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/evaluation-report/${evaluation.id}`}>
                          <Button variant="link" className="text-blue-600">
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
