'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertCircle, ArrowLeft, ChevronDown, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

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
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
    const [modalImage, setModalImage] = useState<string | null>(null)
    const [issuesState, setIssuesState] = useState<Record<string, string>>({});
    const [savingIssue, setSavingIssue] = useState<string | null>(null);
    const [issueError, setIssueError] = useState<string | null>(null);

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

    const toggleRowExpansion = (imageId: number, promptVersion: string) => {
        const key = `${imageId}-${promptVersion}`
        const newExpandedRows = new Set(expandedRows)
        if (newExpandedRows.has(key)) {
            newExpandedRows.delete(key)
        } else {
            newExpandedRows.add(key)
        }
        setExpandedRows(newExpandedRows)
    }

    function getPromptVersionConfig(version: string) {
        return evaluationRun?.prompt_configurations.find(pc => pc.version === version);
    }
    function getPromptVersionId(version: string) {
        // Try to get it from evaluations (not ideal, but works if all evaluations for a version have the same id)
        const evalForVersion = evaluationRun?.evaluations.find(e => e.prompt_version === version);
        // Use only 'id' as fallback, since 'prompt_version_id' does not exist
        return evalForVersion?.id;
    }
    function getIssuesForPromptVersion(version: string) {
        // Try to get issues from the prompt configuration for this version
        const config = evaluationRun?.prompt_configurations.find(pc => pc.version === version);
        // @ts-ignore
        return config?.issues || [];
    }

    async function handleIssueChange(imageId: number, promptVersion: string, newIssue: string) {
        const key = `${imageId}-${promptVersion}`;
        setIssuesState(prev => ({ ...prev, [key]: newIssue }));
        setSavingIssue(key);
        setIssueError(null);
        const versionId = getPromptVersionId(promptVersion);
        if (!versionId) {
            setIssueError('Prompt version ID not found');
            setSavingIssue(null);
            return;
        }
        let issuesArr = getIssuesForPromptVersion(promptVersion) || [];
        issuesArr = issuesArr.filter((item: any) => item.image_id !== imageId);
        if (newIssue.trim()) {
            issuesArr.push({ image_id: imageId, issue: newIssue });
        }
        try {
            const res = await fetch(`/api/prompt-versions/${versionId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ issues: issuesArr }),
            });
            if (!res.ok) {
                const err = await res.json();
                setIssueError(err.error || 'Failed to update issues');
            } else {
                // Optionally, refetch or update local state
            }
        } catch (e) {
            setIssueError('Network error');
        } finally {
            setSavingIssue(null);
        }
    }

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

                {/* Dataset Information */}
                <Card className="mb-8">
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
                <Card className="mb-8">
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

                {/* Evaluation Results Table */}
                <div className="mt-8">
                    <h2 className="text-2xl text-gray-900 mb-4">Evaluation Results</h2>
                    <div className="rounded-lg bg-white shadow-sm">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Image</TableHead>
                                    <TableHead>Reference Text</TableHead>
                                    <TableHead>OCR Output</TableHead>
                                    <TableHead>Correct Words</TableHead>
                                    <TableHead>Accuracy</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {uniqueImages.map((image) => {
                                    const imageEvaluations = evaluationRun.evaluations.filter(e => e.image_id === image.id)

                                    return imageEvaluations.map((evaluation) => {
                                        const promptConfig = evaluationRun.prompt_configurations.find(
                                            pc => pc.version === evaluation.prompt_version
                                        )
                                        const isExpanded = expandedRows.has(`${image.id}-${evaluation.prompt_version}`)

                                        return (
                                            <React.Fragment key={`${image.id}-${evaluation.prompt_version}`}>
                                                <TableRow>
                                                    <TableCell className="relative">
                                                        <div className="absolute left-0 top-0 bottom-0 w-6 flex items-center justify-center border-r border-gray-200">
                                                            <span className="text-xs font-mono text-black transform -rotate-90 whitespace-nowrap">
                                                                {evaluation.prompt_version}
                                                            </span>
                                                        </div>
                                                        <div className="pl-8">
                                                            <button
                                                                className="focus:outline-none"
                                                                onClick={() => setModalImage(image.url)}
                                                                title="Click to enlarge"
                                                            >
                                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                <img
                                                                    src={image.url}
                                                                    alt={`Image ${image.number}`}
                                                                    className="h-12 w-12 object-cover rounded-full border border-gray-200 shadow-sm hover:scale-105 transition-transform"
                                                                />
                                                            </button>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <p className="whitespace-pre-wrap text-sm">{image.reference_text}</p>
                                                    </TableCell>
                                                    <TableCell>
                                                        <p className="whitespace-pre-wrap text-sm">{evaluation.ocr_output}</p>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-sm font-medium">
                                                            {evaluation.correct_words}/{evaluation.total_words}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-medium">{evaluation.accuracy}%</span>
                                                            <Badge
                                                                variant={evaluation.accuracy >= 90 ? 'default' : evaluation.accuracy >= 70 ? 'secondary' : 'destructive'}
                                                                className="text-xs"
                                                            >
                                                                {evaluation.accuracy >= 90 ? 'Excellent' : evaluation.accuracy >= 70 ? 'Good' : 'Needs Improvement'}
                                                            </Badge>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant={evaluation.processing_status === 'success' ? 'default' : 'secondary'}
                                                            className="text-xs"
                                                        >
                                                            {evaluation.processing_status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <button
                                                            onClick={() => toggleRowExpansion(image.id, evaluation.prompt_version)}
                                                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                                                            title="Toggle word-level analysis"
                                                        >
                                                            {isExpanded ? (
                                                                <ChevronDown className="h-4 w-4" />
                                                            ) : (
                                                                <ChevronRight className="h-4 w-4" />
                                                            )}
                                                        </button>
                                                    </TableCell>
                                                </TableRow>

                                                {/* Expanded Word-Level Analysis */}
                                                {isExpanded && (
                                                    <TableRow>
                                                        <TableCell colSpan={7} className="p-0">
                                                            <div className="bg-gray-50 p-4">
                                                                <h4 className="font-semibold text-lg mb-4">
                                                                    Word-Level Analysis - Image {image.number} ({promptConfig?.label || `Version ${evaluation.prompt_version}`})
                                                                </h4>
                                                                <Table>
                                                                    <TableHeader>
                                                                        <TableRow>
                                                                            {/* <TableHead>Position</TableHead> */}
                                                                            <TableHead>Reference Word</TableHead>
                                                                            <TableHead>Transcribed Word</TableHead>
                                                                            <TableHead>Status</TableHead>
                                                                            <TableHead>Difference</TableHead>
                                                                        </TableRow>
                                                                    </TableHeader>
                                                                    <TableBody>
                                                                        {evaluation.word_evaluations.map((wordEval) => (
                                                                            <TableRow key={wordEval.id}>
                                                                                {/* <TableCell className="font-mono text-sm">{wordEval.word_position}</TableCell> */}
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
                                                                <div className="mt-4">
                                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Issues for this image and prompt version:</label>
                                                                    <textarea
                                                                        className="w-full border rounded p-2 text-sm"
                                                                        rows={2}
                                                                        value={issuesState[`${image.id}-${evaluation.prompt_version}`] !== undefined ? issuesState[`${image.id}-${evaluation.prompt_version}`] : getIssuesForPromptVersion(evaluation.prompt_version).find((item: any) => item.image_id === image.id)?.issue || ''}
                                                                        onChange={e => setIssuesState(prev => ({ ...prev, [`${image.id}-${evaluation.prompt_version}`]: e.target.value }))}
                                                                        onBlur={e => handleIssueChange(image.id, evaluation.prompt_version, e.target.value)}
                                                                        disabled={savingIssue === `${image.id}-${evaluation.prompt_version}`}
                                                                        placeholder="Describe any issues noticed for this image and prompt version..."
                                                                    />
                                                                    {savingIssue === `${image.id}-${evaluation.prompt_version}` && <span className="text-xs text-gray-500">Saving...</span>}
                                                                    {issueError && <span className="text-xs text-red-500">{issueError}</span>}
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </React.Fragment>
                                        )
                                    })
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* Modal for full image */}
                {modalImage && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setModalImage(null)}>
                        <div className="bg-white rounded-lg shadow-lg max-w-3xl max-h-[90vh] flex flex-col items-center relative" onClick={e => e.stopPropagation()}>
                            <button
                                className="absolute top-2 right-2 text-gray-500 hover:text-gray-600 text-2xl font-bold focus:outline-none"
                                onClick={() => setModalImage(null)}
                                aria-label="Close"
                            >
                                ×
                            </button>
                            <img src={modalImage} alt="Full" className="max-h-[70vh] max-w-full rounded mb-4" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
} 