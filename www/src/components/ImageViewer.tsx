import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Eye, Image as ImageIcon, FileText } from 'lucide-react'
import { CSVRow, EvaluationData } from '@/types'

interface ImageViewerProps {
  data: CSVRow[]
  selectedImage: string | null
  onImageSelect: (imageId: string) => void
}

export default function ImageViewer({ data, selectedImage, onImageSelect }: ImageViewerProps) {
  const [selectedEvaluation, setSelectedEvaluation] = useState<EvaluationData | null>(null)
  
  const imagesWithFiles = data.filter(row => row['Local Image'])
  
  const handleEvaluationView = async (evaluationFile: string) => {
    try {
      // In a real implementation, you would fetch the JSON file from the server
      // For now, we'll show a placeholder
      console.log('Would fetch evaluation:', evaluationFile)
      setSelectedEvaluation({
        image_info: {
          number: '1',
          url: 'example.jpg',
          reference_text: 'Example reference text',
          timestamp: '20240101_120000'
        },
        evaluation: {
          full_text: 'Example transcribed text',
          word_evaluations: [],
          metrics: {
            total_words: 0,
            correct_words: 0,
            accuracy: 0
          }
        }
      })
    } catch (error) {
      console.error('Error loading evaluation:', error)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Image Gallery
          </CardTitle>
        </CardHeader>
        <CardContent>
          {imagesWithFiles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No images available. Process some images first to see them here.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {imagesWithFiles.map((row, index) => (
                <Card 
                  key={index} 
                  className={`cursor-pointer transition-colors ${
                    selectedImage === row['#'] ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => onImageSelect(row['#'])}
                >
                  <CardContent className="p-4">
                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-3">
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                      <span className="ml-2 text-sm text-muted-foreground">
                        Image #{row['#']}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">#{row['#']}</span>
                        {row['Accuracy'] && (
                          <Badge variant="outline">{row['Accuracy']}</Badge>
                        )}
                      </div>
                      
                      <p className="text-xs text-muted-foreground truncate" title={row['Text']}>
                        {row['Text']}
                      </p>
                      
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        {row['Evaluation JSON'] && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEvaluationView(row['Evaluation JSON']!)
                                }}
                              >
                                <FileText className="h-3 w-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
                              <DialogHeader>
                                <DialogTitle>Evaluation Details - Image #{row['#']}</DialogTitle>
                              </DialogHeader>
                              {selectedEvaluation && (
                                <EvaluationDetailView evaluation={selectedEvaluation} />
                              )}
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedImage && (
        <Card>
          <CardHeader>
            <CardTitle>Selected Image Details</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const imageData = data.find(row => row['#'] === selectedImage)
              if (!imageData) return <div>Image not found</div>
              
              return (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Image Preview</h4>
                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <ImageIcon className="h-16 w-16 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Image #{selectedImage}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {imageData['Local Image']}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Reference Text</h4>
                      <p className="text-sm bg-muted p-3 rounded">{imageData['Text']}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">OCR Output</h4>
                      <p className="text-sm bg-muted p-3 rounded">
                        {imageData['OCR Output (Gemini - Flash)'] || 'Not processed'}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Accuracy:</span>
                        <p>{imageData['Accuracy'] || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="font-medium">Correct:</span>
                        <p>{imageData['Correct Words'] || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="font-medium">Total:</span>
                        <p>{imageData['Total Words'] || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

interface EvaluationDetailViewProps {
  evaluation: EvaluationData
}

function EvaluationDetailView({ evaluation }: EvaluationDetailViewProps) {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="words">Word Analysis</TabsTrigger>
        <TabsTrigger value="metrics">Metrics</TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">Reference Text</h4>
            <p className="text-sm bg-muted p-3 rounded">{evaluation.image_info.reference_text}</p>
          </div>
          <div>
            <h4 className="font-medium mb-2">Transcribed Text</h4>
            <p className="text-sm bg-muted p-3 rounded">{evaluation.evaluation.full_text}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 border rounded">
            <div className="text-2xl font-bold">{evaluation.evaluation.metrics.accuracy.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground">Accuracy</div>
          </div>
          <div className="text-center p-3 border rounded">
            <div className="text-2xl font-bold text-green-600">{evaluation.evaluation.metrics.correct_words}</div>
            <div className="text-sm text-muted-foreground">Correct Words</div>
          </div>
          <div className="text-center p-3 border rounded">
            <div className="text-2xl font-bold">{evaluation.evaluation.metrics.total_words}</div>
            <div className="text-sm text-muted-foreground">Total Words</div>
          </div>
        </div>
      </TabsContent>
      
      <TabsContent value="words" className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference Word</TableHead>
              <TableHead>Transcribed Word</TableHead>
              <TableHead>Match</TableHead>
              <TableHead>Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {evaluation.evaluation.word_evaluations.map((word, index) => (
              <TableRow key={index}>
                <TableCell className="font-mono">{word.reference_word}</TableCell>
                <TableCell className="font-mono">{word.transcribed_word || '-'}</TableCell>
                <TableCell>{word.match ? <Badge className="bg-green-500">Match</Badge> : <Badge variant="destructive">No Match</Badge>}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{word.reason_diff}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TabsContent>
      
      <TabsContent value="metrics" className="space-y-4">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Processing Information</h4>
            <div className="text-sm space-y-1">
              <div>Image: #{evaluation.image_info.number}</div>
              <div>Timestamp: {evaluation.image_info.timestamp}</div>
              <div>URL: {evaluation.image_info.url}</div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Quality Metrics</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Word-level Accuracy:</span>
                <span>{evaluation.evaluation.metrics.accuracy.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Correct Words:</span>
                <span>{evaluation.evaluation.metrics.correct_words}/{evaluation.evaluation.metrics.total_words}</span>
              </div>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
} 