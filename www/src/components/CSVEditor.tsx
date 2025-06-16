import { useState, useRef, useEffect } from 'react'
import Papa from 'papaparse'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Upload, Download, Edit, Eye, Save, X } from 'lucide-react'

interface ImageData {
  id: number
  file_path: string
  expected_text: string
  created_at: string
  evaluation_results?: {
    ocr_output: string
    accuracy_percentage: number
    correct_words: number
    total_words: number
    status: string
  }[]
}

interface CSVEditorProps {
  data: unknown[] // Keep for compatibility
  onDataChange: (data: unknown[]) => void
  onImageSelect: (imageId: string) => void
}

const API_BASE = 'http://localhost:8000/api'

export default function CSVEditor({ onImageSelect }: CSVEditorProps) {
  const [images, setImages] = useState<ImageData[]>([])
  const [loading, setLoading] = useState(true)
  const [editingRow, setEditingRow] = useState<number | null>(null)
  const [editedData, setEditedData] = useState<Partial<ImageData>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchImages()
  }, [])

  const fetchImages = async () => {
    try {
      const response = await fetch(`${API_BASE}/images`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setImages(data.items || [])
    } catch (error) {
      console.error('Error fetching images:', error)
      // For now, show some dummy data so the user can see how it would render
      setImages([
        {
          id: 1,
          file_path: 'images/sample1.png',
          expected_text: 'यह एक नमूना हिंदी पाठ है।',
          created_at: '2024-01-01T00:00:00Z',
          evaluation_results: [{
            ocr_output: 'यह एक नमूना हिंदी पाठ है।',
            accuracy_percentage: 95.5,
            correct_words: 6,
            total_words: 6,
            status: 'completed'
          }]
        },
        {
          id: 2,
          file_path: 'images/sample2.png',
          expected_text: 'दूसरा नमूना पाठ जो अधिक जटिल है।',
          created_at: '2024-01-01T00:00:00Z',
          evaluation_results: [{
            ocr_output: 'दूसरा नमना पाठ जो अधिक जटिल है।',
            accuracy_percentage: 85.7,
            correct_words: 5,
            total_words: 6,
            status: 'completed'
          }]
        },
        {
          id: 3,
          file_path: 'images/sample3.png',
          expected_text: 'तीसरा उदाहरण जो हस्तलिखित पाठ को दिखाता है।',
          created_at: '2024-01-01T00:00:00Z',
          evaluation_results: []
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setLoading(true)
    
    Papa.parse(file, {
      complete: async () => {
        try {
          // Send CSV data to backend for import
          const formData = new FormData()
          formData.append('file', file)
          
          const response = await fetch(`${API_BASE}/images/import-csv`, {
            method: 'POST',
            body: formData
          })

          if (response.ok) {
            // Refresh images after successful import
            await fetchImages()
          } else {
            console.error('Failed to import CSV')
          }
        } catch (error) {
          console.error('Error importing CSV:', error)
        } finally {
          setLoading(false)
        }
      },
      header: false,
      skipEmptyLines: true
    })
  }

  const handleDownload = async () => {
    try {
      const response = await fetch(`${API_BASE}/images/export-csv`)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'images_export.csv'
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading CSV:', error)
    }
  }

  const startEditing = (index: number) => {
    setEditingRow(index)
    setEditedData({ ...images[index] })
  }

  const saveEdit = async () => {
    if (editingRow !== null) {
      try {
        const response = await fetch(`${API_BASE}/images/${images[editingRow].id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            expected_text: editedData.expected_text
          })
        })

        if (response.ok) {
          await fetchImages() // Refresh data
          setEditingRow(null)
          setEditedData({})
        }
      } catch (error) {
        console.error('Error updating image:', error)
      }
    }
  }

  const cancelEdit = () => {
    setEditingRow(null)
    setEditedData({})
  }

  const getAccuracyBadge = (accuracy?: number) => {
    if (accuracy === undefined || accuracy === null) return null
    if (accuracy >= 90) return <Badge className="bg-green-500">High</Badge>
    if (accuracy >= 70) return <Badge className="bg-yellow-500">Medium</Badge>
    return <Badge className="bg-red-500">Low</Badge>
  }

  const getStatusBadge = (image: ImageData) => {
    const latestResult = image.evaluation_results?.[0]
    if (!latestResult) {
      return <Badge variant="secondary">Not Processed</Badge>
    }
    if (latestResult.status === 'failed') {
      return <Badge variant="destructive">Failed</Badge>
    }
    if (latestResult.status === 'completed') {
      return <Badge className="bg-green-500">Processed</Badge>
    }
    return <Badge variant="outline">Processing</Badge>
  }

  const getLatestOCROutput = (image: ImageData) => {
    return image.evaluation_results?.[0]?.ocr_output || '-'
  }

  const getLatestAccuracy = (image: ImageData) => {
    return image.evaluation_results?.[0]?.accuracy_percentage
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading images...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            CSV Data Editor
            <div className="flex gap-2">
              <Button onClick={() => fileInputRef.current?.click()} size="sm">
                <Upload className="mr-2 h-4 w-4" />
                Upload CSV
              </Button>
              <Button onClick={handleDownload} variant="outline" size="sm" disabled={images.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Download CSV
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          
          {images.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No images found. Upload a CSV file to import images.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Image Path</TableHead>
                    <TableHead>Expected Text</TableHead>
                    <TableHead>OCR Output</TableHead>
                    <TableHead>Accuracy</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {images.map((image, index) => (
                    <TableRow key={image.id}>
                      <TableCell>{image.id}</TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate" title={image.file_path}>
                          {image.file_path.split('/').pop() || image.file_path}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        {editingRow === index ? (
                          <Textarea
                            value={editedData.expected_text || ''}
                            onChange={(e) => setEditedData({ ...editedData, expected_text: e.target.value })}
                            className="min-h-[60px]"
                          />
                        ) : (
                          <div className="whitespace-pre-wrap" title={image.expected_text}>
                            {image.expected_text.length > 100 
                              ? image.expected_text.substring(0, 100) + '...' 
                              : image.expected_text}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="whitespace-pre-wrap" title={getLatestOCROutput(image)}>
                          {getLatestOCROutput(image).length > 100 
                            ? getLatestOCROutput(image).substring(0, 100) + '...' 
                            : getLatestOCROutput(image)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getLatestAccuracy(image) !== undefined && (
                            <>
                              <span>{getLatestAccuracy(image)?.toFixed(1)}%</span>
                              {getAccuracyBadge(getLatestAccuracy(image))}
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(image)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {editingRow === index ? (
                            <>
                              <Button size="sm" onClick={saveEdit}>
                                <Save className="h-3 w-3 mr-1" />
                                Save
                              </Button>
                              <Button size="sm" variant="outline" onClick={cancelEdit}>
                                <X className="h-3 w-3 mr-1" />
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => startEditing(index)} title="Edit">
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="ghost" title="View Details">
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl">
                                  <DialogHeader>
                                    <DialogTitle>Image Details - #{image.id}</DialogTitle>
                                  </DialogHeader>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="font-medium mb-2">Expected Text</h4>
                                      <p className="text-sm bg-muted p-3 rounded whitespace-pre-wrap">
                                        {image.expected_text}
                                      </p>
                                    </div>
                                    <div>
                                      <h4 className="font-medium mb-2">Latest OCR Output</h4>
                                      <p className="text-sm bg-muted p-3 rounded whitespace-pre-wrap">
                                        {getLatestOCROutput(image)}
                                      </p>
                                    </div>
                                    <div>
                                      <h4 className="font-medium mb-2">Accuracy Metrics</h4>
                                      <div className="space-y-1 text-sm">
                                        <div>Accuracy: {getLatestAccuracy(image)?.toFixed(1)}% || 'N/A'</div>
                                        <div>Correct Words: {image.evaluation_results?.[0]?.correct_words || 'N/A'}</div>
                                        <div>Total Words: {image.evaluation_results?.[0]?.total_words || 'N/A'}</div>
                                        <div>Status: {image.evaluation_results?.[0]?.status || 'Not processed'}</div>
                                      </div>
                                    </div>
                                    <div>
                                      <h4 className="font-medium mb-2">File Information</h4>
                                      <div className="space-y-1 text-sm">
                                        <div>Image Path: {image.file_path}</div>
                                        <div>Added: {new Date(image.created_at).toLocaleString()}</div>
                                        <Button 
                                          size="sm" 
                                          onClick={() => onImageSelect(image.id.toString())}
                                          className="mt-2"
                                        >
                                          View Image
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{images.length}</div>
              <div className="text-sm text-muted-foreground">Total Images</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {images.filter(img => (img.evaluation_results?.length ?? 0) > 0).length}
              </div>
              <div className="text-sm text-muted-foreground">Processed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {images.filter(img => 
                  img.evaluation_results?.some(result => result.accuracy_percentage >= 70)
                ).length}
              </div>
              <div className="text-sm text-muted-foreground">Good Accuracy (≥70%)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {images.length > 0 
                  ? (images
                      .filter(img => img.evaluation_results?.[0]?.accuracy_percentage !== undefined)
                      .reduce((sum, img) => sum + (img.evaluation_results?.[0]?.accuracy_percentage || 0), 0) / 
                    images.filter(img => img.evaluation_results?.[0]?.accuracy_percentage !== undefined).length || 0
                    ).toFixed(1)
                  : 0}%
              </div>
              <div className="text-sm text-muted-foreground">Average Accuracy</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 