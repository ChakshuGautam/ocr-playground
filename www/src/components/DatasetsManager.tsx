import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Plus, 
  Upload, 
  Eye, 
  Archive, 
  Download,
  FileImage,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react'
import { Dataset, DatasetStatus, DatasetCreate } from '@/types'

const DatasetsManager: React.FC = () => {
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newDataset, setNewDataset] = useState<DatasetCreate>({
    name: '',
    description: '',
    status: DatasetStatus.DRAFT
  })
  const [uploadFiles, setUploadFiles] = useState<{
    imagesZip?: File;
    referenceCSV?: File;
  }>({})

  useEffect(() => {
    fetchDatasets()
  }, [])

  const fetchDatasets = async () => {
    try {
      const response = await fetch('/api/datasets')
      const data = await response.json()
      setDatasets(data)
    } catch (error) {
      console.error('Error fetching datasets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateDataset = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/datasets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newDataset),
      })
      
      if (response.ok) {
        const createdDataset = await response.json()
        setDatasets([createdDataset, ...datasets])
        setShowCreateDialog(false)
        setNewDataset({ name: '', description: '', status: DatasetStatus.DRAFT })
      }
    } catch (error) {
      console.error('Error creating dataset:', error)
    }
  }

  const handleFileUpload = async (datasetId: number) => {
    if (!uploadFiles.imagesZip || !uploadFiles.referenceCSV) {
      alert('Please select both images ZIP and reference CSV files')
      return
    }

    const formData = new FormData()
    formData.append('images_zip', uploadFiles.imagesZip)
    formData.append('reference_csv', uploadFiles.referenceCSV)

    try {
      const response = await fetch(`/api/datasets/${datasetId}/upload`, {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        await fetchDatasets() // Refresh the list
        setUploadFiles({})
      } else {
        const error = await response.json()
        alert(`Upload failed: ${error.detail}`)
      }
    } catch (error) {
      console.error('Error uploading files:', error)
      alert('Upload failed')
    }
  }

  const getStatusIcon = (status: DatasetStatus) => {
    switch (status) {
      case DatasetStatus.VALIDATED:
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case DatasetStatus.DRAFT:
        return <Clock className="h-4 w-4 text-orange-600" />
      case DatasetStatus.ARCHIVED:
        return <Archive className="h-4 w-4 text-gray-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-red-600" />
    }
  }

  const getStatusBadgeVariant = (status: DatasetStatus) => {
    switch (status) {
      case DatasetStatus.VALIDATED:
        return 'default'
      case DatasetStatus.DRAFT:
        return 'secondary'
      case DatasetStatus.ARCHIVED:
        return 'outline'
      default:
        return 'destructive'
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Evaluation Datasets</h1>
          <p className="text-muted-foreground">
            Manage ground truth data for OCR evaluations and A/B testing
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Dataset
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Dataset</DialogTitle>
              <DialogDescription>
                Create a new evaluation dataset. You can upload images and reference text after creation.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateDataset}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Dataset Name</Label>
                  <Input
                    id="name"
                    value={newDataset.name}
                    onChange={(e) => setNewDataset({ ...newDataset, name: e.target.value })}
                    placeholder="e.g., Class 4 Final Exam"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newDataset.description}
                    onChange={(e) => setNewDataset({ ...newDataset, description: e.target.value })}
                    placeholder="Describe the purpose and contents of this dataset..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Create Dataset</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Datasets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Available Datasets</CardTitle>
          <CardDescription>
            Manage your evaluation datasets and their validation status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {datasets.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dataset Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Image Count</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {datasets.map((dataset) => (
                  <TableRow key={dataset.id}>
                    <TableCell className="font-medium">
                      <Link 
                        to={`/datasets/${dataset.id}`}
                        className="hover:underline text-blue-600"
                      >
                        {dataset.name}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {dataset.description || '-'}
                    </TableCell>
                    <TableCell>{dataset.image_count}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(dataset.status)} className="flex items-center gap-1 w-fit">
                        {getStatusIcon(dataset.status)}
                        {dataset.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(dataset.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {dataset.last_used ? new Date(dataset.last_used).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link to={`/datasets/${dataset.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        
                        {dataset.status === DatasetStatus.DRAFT && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Upload className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Upload Dataset Files</DialogTitle>
                                <DialogDescription>
                                  Upload a ZIP file containing images and a CSV file with reference texts.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                  <Label htmlFor="images-zip">Images ZIP File</Label>
                                  <div className="flex items-center gap-2">
                                    <Input
                                      id="images-zip"
                                      type="file"
                                      accept=".zip"
                                      onChange={(e) => setUploadFiles({
                                        ...uploadFiles,
                                        imagesZip: e.target.files?.[0]
                                      })}
                                    />
                                    <FileImage className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    ZIP archive containing all handwritten image files
                                  </p>
                                </div>
                                
                                <div className="grid gap-2">
                                  <Label htmlFor="reference-csv">Reference CSV File</Label>
                                  <div className="flex items-center gap-2">
                                    <Input
                                      id="reference-csv"
                                      type="file"
                                      accept=".csv"
                                      onChange={(e) => setUploadFiles({
                                        ...uploadFiles,
                                        referenceCSV: e.target.files?.[0]
                                      })}
                                    />
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    CSV with columns: image_filename, reference_text
                                  </p>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button 
                                  onClick={() => handleFileUpload(dataset.id)}
                                  disabled={!uploadFiles.imagesZip || !uploadFiles.referenceCSV}
                                >
                                  Upload & Validate
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}
                        
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <FileImage className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No datasets yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first evaluation dataset to get started with A/B testing
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Dataset
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{datasets.length}</div>
            <p className="text-xs text-muted-foreground">Total Datasets</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {datasets.filter(d => d.status === DatasetStatus.VALIDATED).length}
            </div>
            <p className="text-xs text-muted-foreground">Validated</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">
              {datasets.filter(d => d.status === DatasetStatus.DRAFT).length}
            </div>
            <p className="text-xs text-muted-foreground">Draft</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {datasets.reduce((sum, d) => sum + d.image_count, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Total Images</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default DatasetsManager