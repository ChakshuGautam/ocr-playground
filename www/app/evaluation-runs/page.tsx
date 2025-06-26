"use client"

import { Header } from "@/components/header"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface EvaluationRun {
  id: number
  name: string
  description: string;
  status: string;
  progress_percentage: number;
  created_at: string;
}

export default function EvaluationRunsListPage() {
  const router = useRouter()
  const navigation = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Datasets", href: "/datasets" },
    { name: "Prompt Families", href: "/prompt-families" },
    { name: "Create A/B Test", href: "/create-test" },
  ]

  
  const [runs, setRuns] = useState<EvaluationRun[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchRuns() {
      setLoading(true)
      try {
        const res = await fetch("/api/evaluation-runs")
        if (!res.ok) {
          const errData = await res.json()
          throw new Error(errData.error || "Failed to fetch evaluation runs")
        }
        const data = await res.json()
        setRuns(data)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    fetchRuns()
  }, [])

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
        return 'secondary';
      case 'processing':
        return 'default';
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="AI" navigation={navigation} />

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Evaluation Runs</h1>
            <p className="mt-2 text-gray-600">
              Track and manage all your A/B tests and evaluation runs.
            </p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => router.push('/create-test')}>
            Create A/B Test
          </Button>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading evaluation runs...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">{error}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-400 py-8">
                      You haven't created any evaluation runs yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  runs.map((run) => (
                    <TableRow key={run.id}>
                      <TableCell className="font-medium">
                        <div className="text-gray-900">{run.name}</div>
                        <div className="text-xs text-gray-500 truncate" style={{ maxWidth: '300px' }}>{run.description}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(run.status)}>
                          {run.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={run.progress_percentage || 0} className="h-2 w-24" />
                          <span className="text-sm text-gray-600">{run.progress_percentage || 0}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {run.created_at ? new Date(run.created_at).toLocaleDateString() : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="link"
                          className="text-blue-600"
                          onClick={() => router.push(`/evaluation-runs/${run.id}`)}
                        >
                          View Details
                        </Button>
                        {run.status === 'success' &&
                          <Button
                            variant="link"
                            className="text-blue-600"
                            onClick={() => router.push(`/evaluation-report/${run.id}`)}
                          >
                            View Report
                          </Button>}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </main>
    </div>
  )
}
