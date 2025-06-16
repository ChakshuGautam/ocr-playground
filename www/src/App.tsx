import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  FileText, 
  BarChart3, 
  Upload, 
  Database, 
  Home, 
  Beaker,
  TrendingUp,
  Settings,
  HelpCircle,
  Eye,
  LayoutDashboard,
  Target,
  GitCompare
} from 'lucide-react'
import CSVEditor from '@/components/CSVEditor'
import EvaluationDashboard from '@/components/EvaluationDashboard'
import ImageViewer from '@/components/ImageViewer'
import Dashboard from '@/components/Dashboard'
import DatasetsManager from '@/components/DatasetsManager'
import PromptLibrary from './components/PromptLibrary'
import EvaluationWizard from './components/EvaluationWizard'
import LiveMonitor from './components/LiveMonitor'
import ComparisonDashboard from './components/ComparisonDashboard'
import HistoricalAnalysis from './components/HistoricalAnalysis'
import { CSVRow } from '@/types'

function Navigation() {
  const location = useLocation()
  
  const navItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/datasets', label: 'Datasets', icon: Database },
    { path: '/prompts', label: 'Prompts', icon: FileText },
    { path: '/evaluate', label: 'Evaluate', icon: Target },
    { path: '/compare', label: 'Compare', icon: GitCompare },
    { path: '/analysis', label: 'Analysis', icon: TrendingUp },
    { path: '/csv-editor', label: 'CSV Editor', icon: Upload },
    { path: '/legacy-dashboard', label: 'Legacy Dashboard', icon: BarChart3 },
  ]
  
  return (
    <nav className="border-b bg-white">
      <div className="flex h-16 items-center px-6">
        <Link to="/" className="flex items-center space-x-2">
          <Eye className="h-6 w-6" />
          <span className="text-xl font-bold">OCR Evaluation Platform</span>
        </Link>
        
        <div className="ml-auto flex items-center space-x-6">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            
            return (
              <Link key={item.path} to={item.path} className="flex items-center space-x-2 text-sm font-medium hover:text-primary">
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            )
          })}
          
          <div className="flex items-center space-x-2 ml-4 border-l pl-4">
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <HelpCircle className="h-4 w-4" />
            </Button>
          </div>
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
            {/* Main Dashboard - The Evaluation Hub */}
            <Route path="/" element={<Dashboard />} />
            
            {/* Dataset Management */}
            <Route path="/datasets" element={<DatasetsManager />} />
            <Route path="/datasets/:id" element={<DatasetDetailView />} />
            
            {/* Prompt Library */}
            <Route path="/prompts" element={<PromptLibrary />} />
            <Route path="/prompts/families/:familyId" element={<PromptFamilyDetail />} />
            
            {/* Evaluation Runs */}
            <Route path="/evaluate" element={<EvaluationWizard />} />
            <Route path="/live-monitor/:runId" element={<LiveMonitor runId={""} />} />
            <Route path="/compare" element={<ComparisonDashboard />} />
            
            {/* Historical Analysis */}
            <Route path="/analysis" element={<HistoricalAnalysis />} />
            <Route path="/analysis/trends" element={<PerformanceTrends />} />
            
            {/* Batch Processing for Educators */}
            <Route path="/batch-processing" element={<BatchProcessingInterface />} />
            
            {/* API Integration Portal */}
            <Route path="/api-portal" element={<APIIntegrationPortal />} />
            
            {/* Legacy Routes - keeping for backwards compatibility */}
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
              path="/legacy-dashboard" 
              element={<EvaluationDashboard />} 
            />
            <Route 
              path="/image-viewer" 
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

// Placeholder components for routes that need to be implemented
const DatasetDetailView = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold">Dataset Detail View</h1>
    <p className="text-muted-foreground">Dataset detail and image gallery view - to be implemented</p>
  </div>
)

const PromptFamilyDetail = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold">Prompt Family Detail</h1>
    <p className="text-muted-foreground">Prompt version history and editor - to be implemented</p>
  </div>
)

const PerformanceTrends = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold">Performance Trends</h1>
    <p className="text-muted-foreground">Detailed performance trend analysis - to be implemented</p>
  </div>
)

const BatchProcessingInterface = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold">Batch Processing</h1>
    <p className="text-muted-foreground">Simplified interface for educators to process student work - to be implemented</p>
  </div>
)

const APIIntegrationPortal = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold">API Integration Portal</h1>
    <p className="text-muted-foreground">Developer portal with API documentation and key management - to be implemented</p>
  </div>
)

export default App
