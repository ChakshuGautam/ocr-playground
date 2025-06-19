"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"

function getStatusBadge(is_active: boolean) {
  return is_active ? (
    <Badge variant="secondary" className="bg-green-100 text-green-800">
      Active
    </Badge>
  ) : (
    <Badge variant="secondary" className="bg-gray-100 text-gray-800">
      Inactive
    </Badge>
  )
}

export default function PromptsPage() {
  const [activeTab, setActiveTab] = useState("all")
  const [prompts, setPrompts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [editPrompt, setEditPrompt] = useState<any | null>(null)
  const [newPrompt, setNewPrompt] = useState({
    name: "",
    version: "",
    prompt_text: "",
    description: "",
    is_active: false,
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchPrompts()
  }, [])

  async function fetchPrompts() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/prompts")
      const data = await res.json()
      if (res.ok) {
        setPrompts(data)
      } else {
        setError(data.error || "Failed to fetch prompts")
      }
    } catch (e) {
      setError("Failed to fetch prompts")
    } finally {
      setLoading(false)
    }
  }

  function openEditModal(prompt: any) {
    setEditPrompt(prompt)
    setNewPrompt({
      name: prompt.name || "",
      version: prompt.version || "",
      prompt_text: prompt.prompt_text || "",
      description: prompt.description || "",
      is_active: prompt.is_active || false,
    })
    setShowModal(true)
  }

  function openCreateModal() {
    setEditPrompt(null)
    setNewPrompt({ name: "", version: "", prompt_text: "", description: "", is_active: false })
    setShowModal(true)
  }

  async function handleSubmitPrompt(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      let res, data
      if (editPrompt) {
        res = await fetch(`/api/prompts/${editPrompt.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newPrompt),
        })
      } else {
        res = await fetch("/api/prompts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newPrompt),
        })
      }
      data = await res.json()
      if (res.ok) {
        setShowModal(false)
        setEditPrompt(null)
        setNewPrompt({ name: "", version: "", prompt_text: "", description: "", is_active: false })
        fetchPrompts()
      } else {
        setError(data.error || (editPrompt ? "Failed to update prompt" : "Failed to create prompt"))
      }
    } catch (e) {
      setError(editPrompt ? "Failed to update prompt" : "Failed to create prompt")
    } finally {
      setSubmitting(false)
    }
  }

  const filteredPrompts = prompts.filter((prompt) => {
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "active" && prompt.is_active) ||
      (activeTab === "inactive" && !prompt.is_active)
    const matchesSearch =
      prompt.name.toLowerCase().includes(search.toLowerCase()) ||
      prompt.prompt_text?.toLowerCase().includes(search.toLowerCase()) ||
      prompt.description?.toLowerCase().includes(search.toLowerCase())
    return matchesTab && matchesSearch
  })

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar currentPath="/prompts" />

      <main className="flex-1 p-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Prompts</h1>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={openCreateModal}>
            New Prompt
          </Button>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search prompts"
                className="pl-10 bg-blue-50 border-blue-200"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-fit grid-cols-3">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="inactive">Inactive</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading prompts...</div>
              ) : error ? (
                <div className="text-center py-8 text-red-500">{error}</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Last Modified</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPrompts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-gray-400">
                          No prompts found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPrompts.map((prompt) => (
                        <TableRow key={prompt.id}>
                          <TableCell className="font-medium">{prompt.name}</TableCell>
                          <TableCell>{getStatusBadge(prompt.is_active)}</TableCell>
                          <TableCell>{prompt.version}</TableCell>
                          <TableCell>{prompt.description}</TableCell>
                          <TableCell className="text-blue-600">
                            {prompt.updated_at ? new Date(prompt.updated_at).toLocaleDateString() : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="link" className="text-blue-600" onClick={() => openEditModal(prompt)}>
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Modal for creating or editing a prompt */}
        <Dialog open={showModal} onOpenChange={(open) => { setShowModal(open); if (!open) setEditPrompt(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editPrompt ? "Edit Prompt" : "New Prompt"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitPrompt} className="space-y-4">
              <Input
                placeholder="Prompt Name"
                value={newPrompt.name}
                onChange={e => setNewPrompt({ ...newPrompt, name: e.target.value })}
                required
              />
              <Input
                placeholder="Version (e.g. v1.0.0)"
                value={newPrompt.version}
                onChange={e => setNewPrompt({ ...newPrompt, version: e.target.value })}
                required
              />
              <textarea
                placeholder="Prompt Text"
                className="w-full rounded border border-gray-200 p-2 min-h-[80px]"
                value={newPrompt.prompt_text}
                onChange={e => setNewPrompt({ ...newPrompt, prompt_text: e.target.value })}
                required
              />
              <Input
                placeholder="Description"
                value={newPrompt.description}
                onChange={e => setNewPrompt({ ...newPrompt, description: e.target.value })}
              />
              <div className="flex items-center gap-2">
                <Switch
                  checked={newPrompt.is_active}
                  onCheckedChange={checked => setNewPrompt({ ...newPrompt, is_active: checked })}
                  id="is_active"
                />
                <label htmlFor="is_active" className="text-sm">Active</label>
              </div>
              {error && <div className="text-red-500 text-sm">{error}</div>}
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => { setShowModal(false); setEditPrompt(null); }}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600" disabled={submitting}>
                  {submitting ? (editPrompt ? "Saving..." : "Creating...") : (editPrompt ? "Save" : "Create")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
