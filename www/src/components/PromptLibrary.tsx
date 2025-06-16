import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Plus, 
  FileText, 
  GitBranch,
  Play,
  Archive,
  Edit,
  Eye,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { 
  PromptFamily, 
  PromptFamilyWithVersions, 
  PromptVersion, 
  PromptStatus, 
  VersionType 
} from '@/types'

const PromptLibrary: React.FC = () => {
  const [promptFamilies, setPromptFamilies] = useState<PromptFamily[]>([])
  const [selectedFamily, setSelectedFamily] = useState<PromptFamilyWithVersions | null>(null)
  const [loading, setLoading] = useState(true)
  const [showNewFamilyDialog, setShowNewFamilyDialog] = useState(false)
  const [showNewVersionDialog, setShowNewVersionDialog] = useState(false)
  const [newFamily, setNewFamily] = useState({ name: '', description: '', tags: '' })
  const [newVersion, setNewVersion] = useState({
    prompt_text: '',
    changelog_message: '',
    version_type: VersionType.PATCH
  })

  useEffect(() => {
    fetchPromptFamilies()
  }, [])

  useEffect(() => {
    if (promptFamilies.length > 0 && !selectedFamily) {
      fetchFamilyDetails(promptFamilies[0].id)
    }
  }, [promptFamilies])

  const fetchPromptFamilies = async () => {
    try {
      const response = await fetch('/api/prompt-families')
      const data = await response.json()
      setPromptFamilies(data)
    } catch (error) {
      console.error('Error fetching prompt families:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFamilyDetails = async (familyId: number) => {
    try {
      const response = await fetch(`/api/prompt-families/${familyId}`)
      const data = await response.json()
      setSelectedFamily(data)
    } catch (error) {
      console.error('Error fetching family details:', error)
    }
  }

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/prompt-families', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFamily.name,
          description: newFamily.description,
          tags: newFamily.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        })
      })
      
      if (response.ok) {
        await fetchPromptFamilies()
        setShowNewFamilyDialog(false)
        setNewFamily({ name: '', description: '', tags: '' })
      }
    } catch (error) {
      console.error('Error creating family:', error)
    }
  }

  const handleCreateVersion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFamily) return

    try {
      const response = await fetch(`/api/prompt-families/${selectedFamily.id}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVersion)
      })
      
      if (response.ok) {
        await fetchFamilyDetails(selectedFamily.id)
        setShowNewVersionDialog(false)
        setNewVersion({
          prompt_text: '',
          changelog_message: '',
          version_type: VersionType.PATCH
        })
      }
    } catch (error) {
      console.error('Error creating version:', error)
    }
  }

  const handlePromoteVersion = async (versionId: number) => {
    try {
      const response = await fetch(`/api/prompt-versions/${versionId}/promote`, {
        method: 'POST'
      })
      
      if (response.ok && selectedFamily) {
        await fetchFamilyDetails(selectedFamily.id)
        await fetchPromptFamilies() // Refresh to update production version
      }
    } catch (error) {
      console.error('Error promoting version:', error)
    }
  }

  const getStatusIcon = (status: PromptStatus) => {
    switch (status) {
      case PromptStatus.PRODUCTION:
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case PromptStatus.STAGING:
        return <Clock className="h-4 w-4 text-blue-600" />
      case PromptStatus.DRAFT:
        return <Edit className="h-4 w-4 text-orange-600" />
      case PromptStatus.ARCHIVED:
        return <Archive className="h-4 w-4 text-gray-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-red-600" />
    }
  }

  const getStatusBadgeVariant = (status: PromptStatus) => {
    switch (status) {
      case PromptStatus.PRODUCTION: return 'default'
      case PromptStatus.STAGING: return 'secondary'
      case PromptStatus.DRAFT: return 'outline'
      case PromptStatus.ARCHIVED: return 'destructive'
      default: return 'destructive'
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-3 gap-6">
            <div className="h-96 bg-gray-200 rounded"></div>
            <div className="col-span-2 h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Prompt Template Library</h1>
          <p className="text-muted-foreground">
            Manage and version your OCR prompt templates with professional workflows
          </p>
        </div>
        
        <Dialog open={showNewFamilyDialog} onOpenChange={setShowNewFamilyDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Prompt Family
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Prompt Family</DialogTitle>
              <DialogDescription>
                Create a new family to group related prompt versions together.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateFamily}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Family Name</Label>
                  <Input
                    id="name"
                    value={newFamily.name}
                    onChange={(e) => setNewFamily({ ...newFamily, name: e.target.value })}
                    placeholder="e.g., General Hindi OCR"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newFamily.description}
                    onChange={(e) => setNewFamily({ ...newFamily, description: e.target.value })}
                    placeholder="Describe the purpose of this prompt family..."
                    rows={3}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={newFamily.tags}
                    onChange={(e) => setNewFamily({ ...newFamily, tags: e.target.value })}
                    placeholder="hindi, cursive, beginner"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Create Family</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Main Content - Two Pane Layout */}
      <div className="grid grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Left Pane: Prompt List */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Prompt Families
            </CardTitle>
            <CardDescription>
              Select a family to view and edit versions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {promptFamilies.map((family) => (
              <div
                key={family.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedFamily?.id === family.id 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:bg-muted/50'
                }`}
                onClick={() => fetchFamilyDetails(family.id)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{family.name}</h4>
                    <p className="text-sm text-muted-foreground truncate">
                      {family.description}
                    </p>
                  </div>
                  {family.production_version && (
                    <Badge variant="default" className="text-xs">
                      v{family.production_version}
                    </Badge>
                  )}
                </div>
                {family.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {family.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {family.tags.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{family.tags.length - 2}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Right Pane: Editor and Version Management */}
        <Card className="col-span-2">
          {selectedFamily ? (
            <Tabs defaultValue="versions" className="h-full">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center">
                      <GitBranch className="mr-2 h-5 w-5" />
                      {selectedFamily.name}
                    </CardTitle>
                    <CardDescription>{selectedFamily.description}</CardDescription>
                  </div>
                  <Dialog open={showNewVersionDialog} onOpenChange={setShowNewVersionDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        New Version
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Create New Version</DialogTitle>
                        <DialogDescription>
                          Create a new version of {selectedFamily.name} with semantic versioning.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreateVersion}>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="version-type">Version Type</Label>
                            <Select 
                              value={newVersion.version_type} 
                              onValueChange={(value) => setNewVersion({ ...newVersion, version_type: value as VersionType })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={VersionType.MAJOR}>Major (Breaking changes)</SelectItem>
                                <SelectItem value={VersionType.MINOR}>Minor (New features)</SelectItem>
                                <SelectItem value={VersionType.PATCH}>Patch (Bug fixes)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="changelog">Changelog Message</Label>
                            <Input
                              id="changelog"
                              value={newVersion.changelog_message}
                              onChange={(e) => setNewVersion({ ...newVersion, changelog_message: e.target.value })}
                              placeholder="e.g., Added explicit instruction to handle visarga"
                              required
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="prompt-text">Prompt Text</Label>
                            <Textarea
                              id="prompt-text"
                              value={newVersion.prompt_text}
                              onChange={(e) => setNewVersion({ ...newVersion, prompt_text: e.target.value })}
                              placeholder="Enter the prompt text here..."
                              rows={8}
                              className="font-mono"
                              required
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="submit">Create Version</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
                <TabsList>
                  <TabsTrigger value="versions">Version History</TabsTrigger>
                  <TabsTrigger value="editor">Editor</TabsTrigger>
                  <TabsTrigger value="metadata">Metadata</TabsTrigger>
                </TabsList>
              </CardHeader>

              <CardContent className="h-full">
                <TabsContent value="versions" className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Version</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Changelog</TableHead>
                        <TableHead>Author</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Accuracy</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedFamily.versions.map((version) => (
                        <TableRow key={version.id}>
                          <TableCell className="font-mono">{version.version}</TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(version.status)} className="flex items-center gap-1 w-fit">
                              {getStatusIcon(version.status)}
                              {version.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {version.changelog_message}
                          </TableCell>
                          <TableCell>{version.author || 'System'}</TableCell>
                          <TableCell>
                            {new Date(version.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {version.last_evaluation_accuracy ? 
                              `${version.last_evaluation_accuracy.toFixed(1)}%` : 
                              '-'
                            }
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Play className="h-4 w-4" />
                              </Button>
                              {version.status !== PromptStatus.PRODUCTION && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handlePromoteVersion(version.id)}
                                >
                                  <TrendingUp className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>

                <TabsContent value="editor" className="space-y-4">
                  <div className="grid gap-4">
                    <Label htmlFor="editor">Prompt Editor</Label>
                    <Textarea
                      id="editor"
                      placeholder="Select a version to edit or create a new one..."
                      rows={12}
                      className="font-mono"
                      disabled
                    />
                    <p className="text-sm text-muted-foreground">
                      💡 Use the "New Version" button to create and edit prompt templates with syntax highlighting
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="metadata" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Family ID</Label>
                      <p className="text-sm text-muted-foreground">{selectedFamily.id}</p>
                    </div>
                    <div>
                      <Label>Production Version</Label>
                      <p className="text-sm text-muted-foreground">
                        {selectedFamily.production_version || 'None'}
                      </p>
                    </div>
                    <div>
                      <Label>Total Versions</Label>
                      <p className="text-sm text-muted-foreground">{selectedFamily.versions.length}</p>
                    </div>
                    <div>
                      <Label>Created</Label>
                      <p className="text-sm text-muted-foreground">
                        {new Date(selectedFamily.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Tags</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedFamily.tags.map((tag) => (
                        <Badge key={tag} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </CardContent>
            </Tabs>
          ) : (
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Family Selected</h3>
                <p className="text-muted-foreground">
                  Select a prompt family from the left panel to view and manage versions
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}

export default PromptLibrary