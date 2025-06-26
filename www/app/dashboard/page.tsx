'use client'

import { Sidebar } from "@/components/sidebar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { UserNav } from "@/components/user-nav"
import { ChevronLeft, ChevronRight } from "lucide-react"

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

interface ApiLog {
  id: number;
  image_url: string;
  ocr_output: string;
  prompt_version: string;
  user_id: string;
  created_at: string;
  log_metadata: {
    accuracy: number;
    latency_ms?: number;
    status?: 'success' | 'failed';
    [key: string]: any;
  };
}

const dummyAPIData = [
  {
    imageURL: 'https://minio.nl.samagra.io/assessment-images/ap_955139_11_42766918_20250217051749.jpg',
    ocr_text: 'हम सब फल खा गए। शमा छत पर ताली बजा',
    metadata: {
      assessed_at: '2025-06-22 20:20:48.996773',
      status: 'success',
      latency: '2500ms',
      school_id: '001',
      student_id: '001',
      class_id: '001'
    }
  },
  {
    imageURL: 'https://minio.nl.samagra.io/assessment-images/ap_15279_11_035931658_20250217044126.jpg',
    ocr_text: '-',
    metadata: {
      assessed_at: '2025-06-22 20:20:48.996773',
      status: 'failed',
      latency: '5000ms',
      school_id: '001',
      student_id: '002',
      class_id: '001'
    }
  },
  {
    imageURL: 'https://minio.nl.samagra.io/assessment-images/ap_15269_11_40446725_20250220073646.jpg',
    ocr_text: 'डर कर मत रहा कर यह सब कब घटा था छाया दिन भर गाना गाती चाकू को सिल पर घिस',
    metadata: {
      assessed_at: '2025-06-22 20:20:48.996773',
      status: 'success',
      latency: '8400ms',
      school_id: '001',
      student_id: '002',
      class_id: '001'
    }
  },
  {
    imageURL: 'https://minio.nl.samagra.io/assessment-images/ap_685780_11_41393074_20250219045755.jpg',
    ocr_text: 'सब एक साथ वन गए हार मत मान काम कर',
    metadata: {
      assessed_at: '2025-06-22 20:20:48.996773',
      status: 'success',
      latency: '470ms',
      school_id: '001',
      student_id: '003',
      class_id: '001'
    }
  }
]


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
  const [apiLogs, setApiLogs] = useState<ApiLog[]>([])
  const [loading, setLoading] = useState(true)
  const [modalImage, setModalImage] = useState<string | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const modalRef = useRef<HTMLDivElement | null>(null)
  
  // Pagination state for API logs
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

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

        // Fetch API logs
        const apiLogsResponse = await fetch("/api/api-logs");
        const apiLogsData = await apiLogsResponse.json();
        const apiLogsArray = Array.isArray(apiLogsData) ? apiLogsData : (apiLogsData?.data || []);
        setApiLogs(apiLogsArray);
        console.log(apiLogsArray[0])
        console.log(apiLogsArray[1])
      } catch (error) {
        console.error('Error fetching data:', error)
        setDatasets([])
        setEvaluationRuns([])
        setApiLogs([]);
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setModalImage(null)
      }
    }

    if (modalImage) {
      document.addEventListener('keydown', handleKeyDown)
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const firstElement = focusableElements?.[0] as HTMLElement | undefined
      const lastElement = focusableElements?.[focusableElements.length - 1] as HTMLElement | undefined

      const handleTabKeyPress = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              lastElement?.focus()
              e.preventDefault()
            }
          } else {
            if (document.activeElement === lastElement) {
              firstElement?.focus()
              e.preventDefault()
            }
          }
        }
      }

      modalRef.current?.addEventListener('keydown', handleTabKeyPress)
      firstElement?.focus()

      return () => {
        document.removeEventListener('keydown', handleKeyDown)
        modalRef.current?.removeEventListener('keydown', handleTabKeyPress)
        triggerRef.current?.focus()
      }
    }
  }, [modalImage])

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

  // Calculate pagination values
  const totalPages = Math.ceil(apiLogs.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentApiLogs = apiLogs.slice(startIndex, endIndex)

  // Pagination handlers
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const goToPreviousPage = () => {
    goToPage(currentPage - 1)
  }

  const goToNextPage = () => {
    goToPage(currentPage + 1)
  }

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Show pages around current page
      let start = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
      let end = Math.min(totalPages, start + maxVisiblePages - 1)
      
      // Adjust if we're near the end
      if (end - start < maxVisiblePages - 1) {
        start = Math.max(1, end - maxVisiblePages + 1)
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
    }
    
    return pages
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
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <UserNav />
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
          <div className="space-y-8">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">API Logs</h2>
                <div className="text-sm text-gray-600">
                  Showing {startIndex + 1}-{Math.min(endIndex, apiLogs.length)} of {apiLogs.length} logs
                </div>
              </div>

              {apiLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No logs to be shown
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Image</TableHead>
                        <TableHead>OCR Text</TableHead>
                        <TableHead>Created At</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Latency</TableHead>
                        <TableHead>Tokens Used</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentApiLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            <button
                              className="focus:outline-none"
                              onClick={e => {
                                setModalImage(log.image_url)
                                triggerRef.current = e.currentTarget
                              }}
                              title="Click to enlarge"
                            >
                              <img
                                src={log.image_url}
                                alt="OCR"
                                className="h-12 w-12 object-cover rounded-full border border-gray-200 shadow-sm hover:scale-105 transition-transform"
                              />
                            </button>
                          </TableCell>
                          <TableCell className="whitespace-pre-line max-w-xs break-words">
                            {log.ocr_output || <span className="text-gray-400 italic">No OCR text</span>}
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {log.created_at ? new Date(log.created_at).toLocaleDateString() : '-'}
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {log.log_metadata.status === 'success' ? (
                              <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>
                            ) : log.log_metadata.status === 'failed' ? (
                              <Badge variant="secondary" className="bg-red-100 text-red-800">Failed</Badge>
                            ) : (
                              <Badge variant="secondary">{log.log_metadata.status || 'Unknown'}</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {log.log_metadata.latency_ms ? `${log.log_metadata.latency_ms}ms` : '-'}
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {log.log_metadata.tokens_used ? log.log_metadata.tokens_used : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <div className="text-sm text-gray-700">
                        Page {currentPage} of {totalPages}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={goToPreviousPage}
                          disabled={currentPage === 1}
                          className="flex items-center space-x-1"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          <span>Previous</span>
                        </Button>
                        
                        <div className="flex items-center space-x-1">
                          {getPageNumbers().map((pageNum) => (
                            <Button
                              key={pageNum}
                              variant={pageNum === currentPage ? "default" : "outline"}
                              size="sm"
                              onClick={() => goToPage(pageNum)}
                              className="w-8 h-8 p-0"
                            >
                              {pageNum}
                            </Button>
                          ))}
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={goToNextPage}
                          disabled={currentPage === totalPages}
                          className="flex items-center space-x-1"
                        >
                          <span>Next</span>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
              {modalImage && (
                <div
                  ref={modalRef}
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
                  onClick={() => setModalImage(null)}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="modal-title"
                >
                  <div className="bg-white rounded-lg shadow-lg max-w-3xl max-h-[90vh] flex flex-col items-center relative" onClick={e => e.stopPropagation()}>
                    <h2 id="modal-title" className="sr-only">Enlarged image</h2>
                    <button
                      className="absolute top-2 right-2 text-gray-500 hover:text-gray-600 text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        </div>
      </main>
    </div>
  )
}
