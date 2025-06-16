import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileText, BarChart3, Upload } from 'lucide-react'
import CSVEditor from '@/components/CSVEditor'
import EvaluationDashboard from '@/components/EvaluationDashboard'
import ImageViewer from '@/components/ImageViewer'
import { CSVRow } from '@/types'

function Navigation() {
  const location = useLocation()
  
  return (
    <nav className="border-b bg-background">
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold">OCR Evaluation Dashboard</h1>
        </div>
        <div className="ml-auto flex items-center space-x-4">
          <Link to="/">
            <Button variant={location.pathname === '/' || location.pathname === '/csv-editor' ? 'default' : 'ghost'} size="sm">
              <FileText className="mr-2 h-4 w-4" />
              CSV Editor
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button variant={location.pathname === '/dashboard' ? 'default' : 'ghost'} size="sm">
              <BarChart3 className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </Link>
          <Link to="/images">
            <Button variant={location.pathname === '/images' ? 'default' : 'ghost'} size="sm">
              <Upload className="mr-2 h-4 w-4" />
              Images
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  )
}

function App() {
  const [csvData, setCsvData] = useState<CSVRow[]>([])
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-6">
          <Routes>
            <Route 
              path="/" 
              element={
                <CSVEditor 
                  data={csvData}
                  onDataChange={setCsvData}
                  onImageSelect={setSelectedImage}
                />
              } 
            />
            <Route 
              path="/csv-editor" 
              element={
                <CSVEditor 
                  data={csvData}
                  onDataChange={setCsvData}
                  onImageSelect={setSelectedImage}
                />
              } 
            />
            <Route 
              path="/dashboard" 
              element={<EvaluationDashboard />} 
            />
            <Route 
              path="/images" 
              element={
                <ImageViewer 
                  data={csvData}
                  selectedImage={selectedImage}
                  onImageSelect={setSelectedImage}
                />
              } 
            />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
