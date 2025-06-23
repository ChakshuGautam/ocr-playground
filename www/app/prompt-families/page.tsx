"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

export default function PromptFamiliesPage() {
  const router = useRouter()
  const [families, setFamilies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [editFamily, setEditFamily] = useState<any | null>(null)
  const [newFamily, setNewFamily] = useState({
    name: "",
    description: "",
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchFamilies()
  }, [])

  async function fetchFamilies() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/prompt-families")
      const data = await res.json()
      if (res.ok) {
        setFamilies(data)
      } else {
        setError(data.error || "Failed to fetch prompt families")
      }
    } catch (e) {
      setError("Failed to fetch prompt families")
    } finally {
      setLoading(false)
    }
  }

  function openEditModal(family: any) {
    setEditFamily(family)
    setNewFamily({
      name: family.name || "",
      description: family.description || "",
    })
    setShowModal(true)
  }

  function openCreateModal() {
    setEditFamily(null)
    setNewFamily({ name: "", description: "" })
    setShowModal(true)
  }

  async function handleSubmitFamily(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      let res, data
      if (editFamily) {
        res = await fetch(`/api/prompt-families/${editFamily.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newFamily),
        })
      } else {
        res = await fetch("/api/prompt-families", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newFamily),
        })
      }
      data = await res.json()
      if (res.ok) {
        setShowModal(false)
        setEditFamily(null)
        setNewFamily({ name: "", description: "" })
        fetchFamilies()
      } else {
        setError(data.error || (editFamily ? "Failed to update family" : "Failed to create family"))
      }
    } catch (e) {
      setError(editFamily ? "Failed to update family" : "Failed to create family")
    } finally {
      setSubmitting(false)
    }
  }

  const filteredFamilies = families.filter((family) => {
    return (
      family.name.toLowerCase().includes(search.toLowerCase()) ||
      family.description?.toLowerCase().includes(search.toLowerCase())
    )
  })

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar currentPath="/prompt-families" />

      <main className="flex-1 p-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Prompt Families</h1>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={openCreateModal}>
            New Family
          </Button>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search families"
                className="pl-10 bg-blue-50 border-blue-200"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading families...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">{error}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  {/* <TableHead>Version Count</TableHead> */}
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFamilies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-400">
                      No families found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFamilies.map((family) => (
                    <TableRow key={family.id}>
                      <TableCell className="font-medium">{family.name}</TableCell>
                      <TableCell className="max-w-sm truncate" title={family.description}>
                        {family.description}
                      </TableCell>
                      {/* <TableCell>
                        <Badge variant="secondary">{family.version_count ?? 0}</Badge>
                      </TableCell> */}
                      <TableCell>{family.created_at ? new Date(family.created_at).toLocaleDateString() : "-"}</TableCell>
                      {/* <TableCell>{family.updated_at ? new Date(family.updated_at).toLocaleDateString() : "-"}</TableCell> */}
                      <TableCell className="text-right flex gap-2 justify-end">
                        <Button variant="link" className="text-blue-600" onClick={() => openEditModal(family)}>
                          Edit
                        </Button>
                        <Button
                          variant="secondary"
                          className="text-blue-600"
                          onClick={() => router.push(`/prompt-families/${family.id}/versions`)}
                        >
                          Manage Versions
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Modal for creating or editing a family */}
        <Dialog open={showModal} onOpenChange={(open) => { setShowModal(open); if (!open) setEditFamily(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editFamily ? "Edit Family" : "New Family"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitFamily} className="space-y-4">
              <Input
                placeholder="Family Name"
                value={newFamily.name}
                onChange={e => setNewFamily({ ...newFamily, name: e.target.value })}
                required
              />
              <Input
                placeholder="Description"
                value={newFamily.description}
                onChange={e => setNewFamily({ ...newFamily, description: e.target.value })}
              />
              {error && <div className="text-red-500 text-sm">{error}</div>}
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => { setShowModal(false); setEditFamily(null); }}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600" disabled={submitting}>
                  {submitting ? (editFamily ? "Saving..." : "Creating...") : (editFamily ? "Save" : "Create")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
} 