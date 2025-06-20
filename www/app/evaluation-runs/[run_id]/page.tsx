"use client"

import { Header } from "@/components/header"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import { AlertTriangle, CheckCircle, Clock } from "lucide-react"

export default function SingleEvaluationRunPage() {
  const params = useParams()
  const router = useRouter()
  const runId = params.run_id as string

  const [run, setRun] = useState<any>(null)
  const [progress, setProgress] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const ws = useRef<WebSocket | null>(null)

  useEffect(() => {
    async function fetchRunDetails() {
      if (!runId) return;
      setLoading(true)
      try {
        const res = await fetch(`/api/evaluation-runs/${runId}`)
        if (!res.ok) {
          const errData = await res.json()
          throw new Error(errData.error || "Failed to fetch run details")
        }
        const data = await res.json()
        setRun(data)
        setProgress({
          overall_progress: data.progress_percentage || 0,
          current_image: data.current_step || "Initializing...",
          log_entries: [],
          status: data.status,
        })
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    fetchRunDetails()
  }, [runId])

  useEffect(() => {
    if (!runId || !run || run.status === 'success' || run.status === 'failed') {
      return
    }

    const wsUrl = `ws://localhost:8000/ws/evaluation-runs/${runId}/progress`
    ws.current = new WebSocket(wsUrl)

    ws.current.onopen = () => console.log("WebSocket connected")
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data)
      setProgress(data)
      if (data.status === 'success' || data.status === 'failed') {
        setRun((prevRun: any) => ({...prevRun, status: data.status, progress_percentage: 100}))
        ws.current?.close()
      }
    }
    ws.current.onclose = () => console.log("WebSocket disconnected")
    ws.current.onerror = (err) => {
      console.error("WebSocket error:", err)
      setError("Connection to live progress updates failed. Please refresh the page.")
    }

    return () => {
      ws.current?.close()
    }
  }, [runId, run])

  const getStatusVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'success': return 'secondary';
      case 'processing': return 'default';
      case 'failed': return 'destructive';
      default: return 'outline';
    }
  }
  
  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default: return <Clock className="h-5 w-5 text-gray-500" />;
    }
  }

  const renderContent = () => {
    if (loading) return <div className="text-center py-8 text-gray-500">Loading run details...</div>
    if (error) return <div className="text-center py-8 text-red-500">{error}</div>
    if (!run) return <div className="text-center py-8 text-gray-500">Run not found.</div>

    const currentProgress = progress?.overall_progress ?? run.progress_percentage ?? 0;
    const currentStatus = progress?.status ?? run.status;
    const currentStep = progress?.current_image ?? run.current_step;

    return (
        <>
        <div className="mb-8 flex items-center justify-between">
            <div>
                <button className="text-blue-600 mb-2" onClick={() => router.push("/evaluation-runs")}>
                    ← Back to All Runs
                </button>
                <h1 className="text-3xl font-bold text-gray-900">{run.name}</h1>
                <p className="mt-2 text-gray-600">{run.description}</p>
            </div>
            {currentStatus === 'success' && (
                <Button className="bg-green-600 hover:bg-green-700" onClick={() => router.push(`/evaluation-report/${runId}`)}>
                    View Report
                </Button>
            )}
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Status</CardTitle>
                    {getStatusIcon(currentStatus)}
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        <Badge variant={getStatusVariant(currentStatus)}>{currentStatus}</Badge>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Hypothesis</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-gray-500">{run.hypothesis}</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Created On</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {new Date(run.created_at).toLocaleDateString()}
                    </div>
                </CardContent>
            </Card>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Live Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                    <span className="text-sm text-blue-600 font-medium">{currentProgress}% Complete</span>
                    </div>
                    <Progress value={currentProgress} className="h-2" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Current Step</label>
                    <div className="min-h-[50px] rounded-md border border-gray-200 bg-gray-50 p-4">
                        <p className="text-sm text-gray-800 font-mono">{currentStep}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
        </>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="EvalAI" navigation={[]} />
      <main className="mx-auto max-w-4xl px-6 py-8">
        {renderContent()}
      </main>
    </div>
  )
} 