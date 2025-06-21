'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertCircle, TrendingUp, TrendingDown, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

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
    name: string
    description: string
    hypothesis: string
    dataset_ids: number[]
    id: number
    status: string
    progress_percentage: number
    current_step: string
    created_at: string
    updated_at: string
    completed_at: string | null
    datasets: Dataset[]
    prompt_configurations: PromptConfiguration[]
    evaluations: Evaluation[]
    comparison_results: any
}

export default function EvaluationReportPage() {
    const params = useParams()
    const evaluationRunId = params.id as string

    const [evaluationRun, setEvaluationRun] = useState<EvaluationRun | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedImageId, setSelectedImageId] = useState<number | null>(null)

    useEffect(() => {
        const fetchEvaluationRun = async () => {
            try {
                const response = await fetch(`/api/evaluation-runs/${evaluationRunId}`)
                if (!response.ok) {
                    throw new Error('Failed to fetch evaluation run data')
                }
                const data = await response.json()
                setEvaluationRun(data)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred')
            } finally {
                setLoading(false)
            }
        }

        if (evaluationRunId) {
            fetchEvaluationRun()
        }
    }, [evaluationRunId])

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading evaluation data...</p>
                </div>
            </div>
        )
    }

    if (error || !evaluationRun) {
        return (
            <div className="min-h-screen bg-gray-50 p-8">
                <div className="mx-auto max-w-7xl">
                    <Link href="/evaluation-report" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Evaluation Reports
                    </Link>
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            {error || 'Failed to load evaluation run data'}
                        </AlertDescription>
                    </Alert>
                </div>
            </div>
        )
    }

    // Calculate summary statistics
    const evaluationsByVersion = evaluationRun.evaluations.reduce((acc, evaluation) => {
        if (!acc[evaluation.prompt_version]) {
            acc[evaluation.prompt_version] = []
        }
        acc[evaluation.prompt_version].push(evaluation)
        return acc
    }, {} as Record<string, Evaluation[]>)

    const summaryStats = Object.entries(evaluationsByVersion).map(([version, evals]) => {
        const avgAccuracy = evals.reduce((sum, evaluation) => sum + evaluation.accuracy, 0) / evals.length
        const totalCorrectWords = evals.reduce((sum, evaluation) => sum + evaluation.correct_words, 0)
        const totalWords = evals.reduce((sum, evaluation) => sum + evaluation.total_words, 0)
        const promptConfig = evaluationRun.prompt_configurations.find(pc => pc.version === version)

        return {
            version,
            label: promptConfig?.label || `Version ${version}`,
            avgAccuracy: Math.round(avgAccuracy * 100) / 100,
            totalCorrectWords,
            totalWords,
            totalEvaluations: evals.length,
            successRate: (evals.filter(e => e.processing_status === 'success').length / evals.length) * 100
        }
    })

    // Get unique images
    const uniqueImages = Array.from(new Set(evaluationRun.evaluations.map(e => e.image_id)))
        .map(imageId => evaluationRun.evaluations.find(e => e.image_id === imageId)?.image)
        .filter(Boolean) as Image[]

    // Get evaluations for selected image
    const selectedImageEvaluations = selectedImageId
        ? evaluationRun.evaluations.filter(e => e.image_id === selectedImageId)
        : []

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="mx-auto max-w-7xl">
                {/* Back Button */}
                <Link href="/evaluation-report" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Evaluation Reports
                </Link>

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">{evaluationRun.name}</h1>
                    <p className="mt-2 text-gray-600">{evaluationRun.description}</p>
                    <div className="mt-4 flex items-center gap-4">
                        <Badge variant={evaluationRun.status === 'success' ? 'default' : 'secondary'}>
                            {evaluationRun.status}
                        </Badge>
                        <span className="text-sm text-gray-500">
                            Created: {new Date(evaluationRun.created_at).toLocaleDateString()}
                        </span>
                        {evaluationRun.completed_at && (
                            <span className="text-sm text-gray-500">
                                Completed: {new Date(evaluationRun.completed_at).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                </div>

                {/* Hypothesis */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            Hypothesis
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-700">{evaluationRun.hypothesis}</p>
                    </CardContent>
                </Card>

                {/* Summary Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {summaryStats.map((stat) => (
                        <Card key={stat.version}>
                            <CardHeader>
                                <CardTitle className="text-lg">{stat.label}</CardTitle>
                                <CardDescription>Version {stat.version}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-medium">Average Accuracy</span>
                                            <span className="text-2xl font-bold text-blue-600">{stat.avgAccuracy}%</span>
                                        </div>
                                        <Progress value={stat.avgAccuracy} className="h-2" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-500">Correct Words</span>
                                            <p className="font-semibold">{stat.totalCorrectWords}/{stat.totalWords}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Evaluations</span>
                                            <p className="font-semibold">{stat.totalEvaluations}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Detailed Analysis */}
                <Tabs defaultValue="overview" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="images">Image Analysis</TabsTrigger>
                        <TabsTrigger value="word-level">Word-Level Analysis</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        {/* Dataset Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Datasets Used</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {evaluationRun.datasets.map((dataset) => (
                                        <div key={dataset.id} className="flex justify-between items-center p-4 border rounded-lg">
                                            <div>
                                                <h4 className="font-semibold">{dataset.name}</h4>
                                                <p className="text-sm text-gray-600">{dataset.description}</p>
                                            </div>
                                            <div className="text-right">
                                                <Badge variant="outline">{dataset.status}</Badge>
                                                <p className="text-sm text-gray-500 mt-1">{dataset.image_count} images</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Prompt Configurations */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Prompt Configurations</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {evaluationRun.prompt_configurations.map((config, index) => (
                                        <div key={index} className="p-4 border rounded-lg">
                                            <h4 className="font-semibold">{config.label}</h4>
                                            <p className="text-sm text-gray-600">Version {config.version}</p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="images" className="space-y-6">
                        {/* Image Selection */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Select Image for Detailed Analysis</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {uniqueImages.map((image) => (
                                        <div
                                            key={image.id}
                                            className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedImageId === image.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                            onClick={() => setSelectedImageId(image.id)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-12 w-12">
                                                    <AvatarFallback className="bg-gray-100">
                                                        {image.number}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <h4 className="font-semibold">Image {image.number}</h4>
                                                    <p className="text-sm text-gray-600 truncate">
                                                        {image.reference_text.substring(0, 50)}...
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Selected Image Analysis */}
                        {selectedImageId && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Image {uniqueImages.find(img => img.id === selectedImageId)?.number} Analysis</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-6">
                                        {selectedImageEvaluations.map((evaluation) => {
                                            const promptConfig = evaluationRun.prompt_configurations.find(
                                                pc => pc.version === evaluation.prompt_version
                                            )

                                            return (
                                                <div key={evaluation.id} className="p-6 border rounded-lg">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div>
                                                            <h4 className="font-semibold">{promptConfig?.label || `Version ${evaluation.prompt_version}`}</h4>
                                                            <p className="text-sm text-gray-600">Accuracy: {evaluation.accuracy}%</p>
                                                        </div>
                                                        <Badge variant={evaluation.accuracy >= 90 ? 'default' : evaluation.accuracy >= 70 ? 'secondary' : 'destructive'}>
                                                            {evaluation.accuracy >= 90 ? 'Excellent' : evaluation.accuracy >= 70 ? 'Good' : 'Needs Improvement'}
                                                        </Badge>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                        <div>
                                                            <h5 className="font-medium text-gray-700 mb-2">Reference Text</h5>
                                                            <p className="text-sm bg-gray-50 p-3 rounded border">{evaluation.image.reference_text}</p>
                                                        </div>
                                                        <div>
                                                            <h5 className="font-medium text-gray-700 mb-2">OCR Output</h5>
                                                            <p className="text-sm bg-blue-50 p-3 rounded border">{evaluation.ocr_output}</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-4 text-sm">
                                                        <span>Correct: {evaluation.correct_words}/{evaluation.total_words} words</span>
                                                        <span>Processing: {evaluation.processing_status}</span>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="word-level" className="space-y-6">
                        {selectedImageId ? (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Word-Level Analysis - Image {uniqueImages.find(img => img.id === selectedImageId)?.number}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-6">
                                        {selectedImageEvaluations.map((evaluation) => {
                                            const promptConfig = evaluationRun.prompt_configurations.find(
                                                pc => pc.version === evaluation.prompt_version
                                            )

                                            return (
                                                <div key={evaluation.id} className="space-y-4">
                                                    <h4 className="font-semibold text-lg">{promptConfig?.label || `Version ${evaluation.prompt_version}`}</h4>

                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>Position</TableHead>
                                                                <TableHead>Reference Word</TableHead>
                                                                <TableHead>Transcribed Word</TableHead>
                                                                <TableHead>Status</TableHead>
                                                                <TableHead>Difference</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {evaluation.word_evaluations.map((wordEval) => (
                                                                <TableRow key={wordEval.id}>
                                                                    <TableCell className="font-mono text-sm">{wordEval.word_position}</TableCell>
                                                                    <TableCell className="font-medium">{wordEval.reference_word}</TableCell>
                                                                    <TableCell className="font-medium">{wordEval.transcribed_word}</TableCell>
                                                                    <TableCell>
                                                                        {wordEval.match ? (
                                                                            <div className="flex items-center gap-2 text-green-600">
                                                                                <CheckCircle className="h-4 w-4" />
                                                                                <span className="text-sm">Match</span>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="flex items-center gap-2 text-red-600">
                                                                                <XCircle className="h-4 w-4" />
                                                                                <span className="text-sm">Mismatch</span>
                                                                            </div>
                                                                        )}
                                                                    </TableCell>
                                                                    <TableCell className="text-sm text-gray-600 max-w-xs">
                                                                        {wordEval.reason_diff}
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card>
                                <CardContent className="p-8 text-center">
                                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-600">Please select an image from the Images tab to view word-level analysis</p>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
} 