"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

export default function PromptVersionsPage() {
  const router = useRouter()
  const params = useParams()
  
  console.log("params:", params);
     
  const familyId = params.family_id as string

  const [family, setFamily] = useState<any>(null)
  const [versions, setVersions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editVersion, setEditVersion] = useState<any | null>(null)
  const [newVersion, setNewVersion] = useState({
    prompt_text: "",
    changelog_message: "",
    version_type: "minor",
    status: "draft",
  })
  const [submitting, setSubmitting] = useState(false)
  const [promoting, setPromoting] = useState<string | null>(null)

  useEffect(() => {
    fetchFamilyAndVersions()
    // eslint-disable-next-line
  }, [familyId])

  async function fetchFamilyAndVersions() {
    setLoading(true)
    setError(null)
    try {
      const famRes = await fetch(`/api/prompt-families/${familyId}`)
      const famData = await famRes.json()
      if (!famRes.ok) throw new Error(famData.error || "Failed to fetch family")
      setFamily(famData)

      const verRes = await fetch(`/api/prompt-families/${familyId}/versions`)
      const verData = await verRes.json()
      if (!verRes.ok) throw new Error(verData.error || "Failed to fetch versions")
      setVersions(verData)
    } catch (e: any) {
      setError(e.message || "Failed to fetch data")
    } finally {
      setLoading(false)
    }
  }

  function openCreateModal() {
    setEditVersion(null)
    setNewVersion({
      prompt_text: "",
      changelog_message: "",
      version_type: "minor",
      status: "draft",
    })
    setShowModal(true)
  }

  function openEditModal(version: any) {
    setEditVersion(version)
    setNewVersion({
      prompt_text: version.prompt_text || "",
      changelog_message: version.changelog_message || "",
      version_type: "minor",
      status: (version.status || "draft").toLowerCase(),
    })
    setShowModal(true)
  }

  async function handleSubmitVersion(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      let res, data
      if (editVersion) {
        // For updates, only send fields that exist in the database
        const updateData = {
          prompt_text: newVersion.prompt_text.trim(),
          changelog_message: newVersion.changelog_message.trim(),
          status: newVersion.status.toLowerCase()
        };
        res = await fetch(`/api/prompt-versions/${editVersion.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        })
      } else {
        // For creation, separate version_type from the data that will create the database record
        const createData = {
          family_id: Number(familyId),
          prompt_text: newVersion.prompt_text.trim(),
          changelog_message: newVersion.changelog_message.trim(),
          status: newVersion.status.toLowerCase(),
          // Send version_type for version number generation only
          version_type: newVersion.version_type.toLowerCase()
        };
        
        console.log('Creating version with payload:', JSON.stringify(createData, null, 2));
        
        res = await fetch(`/api/prompt-families/${familyId}/versions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(createData),
        })
      }
      
      const responseText = await res.text();
      console.log('Raw response:', responseText);
      
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse response as JSON:', e);
        data = { error: 'Invalid response format' };
      }
      
      if (res.ok) {
        setShowModal(false)
        setEditVersion(null)
        setNewVersion({ prompt_text: "", changelog_message: "", version_type: "minor", status: "draft" })
        fetchFamilyAndVersions()
      } else {
        let errorMsg = editVersion ? "Failed to update version" : "Failed to create version";
        if (data.error) {
          if (typeof data.error === "string") {
            errorMsg = data.error;
          } else if (Array.isArray(data.detail)) {
            errorMsg = data.detail.map((d: any) => d.msg).join(", ");
          } else if (typeof data.detail === "string") {
            errorMsg = data.detail;
          }
        }
        console.error('Error details:', data);
        setError(errorMsg)
      }
    } catch (e) {
      console.error('Request error:', e);
      setError(editVersion ? "Failed to update version" : "Failed to create version")
    } finally {
      setSubmitting(false)
    }
  }

  async function handlePromote(versionId: string) {
    setPromoting(versionId)
    setError(null)
    try {
      const res = await fetch(`/api/prompt-versions/${versionId}/promote`, { method: "POST" })
      const data = await res.json()
      if (res.ok) {
        fetchFamilyAndVersions()
      } else {
        setError(data.error || "Failed to promote version")
      }
    } catch (e) {
      setError("Failed to promote version")
    } finally {
      setPromoting(null)
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar currentPath={`/prompt-families/${familyId}/versions`} />

      <main className="flex-1 p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <button className="text-blue-600 mb-2" onClick={() => router.push("/prompt-families")}>
              ← Back to Families
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              {family ? family.name : "Prompt Family"} Versions
            </h1>
            <div className="text-gray-500">{family?.description}</div>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={openCreateModal}>
            New Version
          </Button>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading versions...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">{error}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Changelog</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {versions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-400">
                      No versions found.
                    </TableCell>
                  </TableRow>
                ) : (
                  versions.map((version) => (
                    <TableRow key={version.id}>
                      <TableCell className="font-medium">{version.version}</TableCell>
                      <TableCell>
                        <Badge variant={version.status === "production" ? "secondary" : "outline"}>
                          {version.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{version.changelog_message}</TableCell>
                      <TableCell>
                        {version.created_at ? new Date(version.created_at).toLocaleDateString() : "-"}
                      </TableCell>
                      <TableCell className="text-right flex gap-2 justify-end">
                        <Button
                          variant="link"
                          className="text-blue-600"
                          onClick={() => openEditModal(version)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="secondary"
                          className="text-green-700"
                          disabled={promoting === version.id || version.status === "production"}
                          onClick={() => handlePromote(version.id)}
                        >
                          {promoting === version.id
                            ? "Promoting..."
                            : version.status === "production"
                            ? "Production"
                            : "Promote"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Modal for creating or editing a version */}
        <Dialog open={showModal} onOpenChange={(open) => { setShowModal(open); if (!open) setEditVersion(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editVersion ? "Edit Version" : "New Version"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitVersion} className="space-y-4">
              <Input
                placeholder="Prompt Text"
                value={newVersion.prompt_text}
                onChange={e => setNewVersion({ ...newVersion, prompt_text: e.target.value })}
                required
              />
              <Input
                placeholder="Changelog"
                value={newVersion.changelog_message}
                onChange={e => setNewVersion({ ...newVersion, changelog_message: e.target.value })}
              />
              {!editVersion && (
                <div className="flex gap-2">
                  <label className="text-sm">Type:</label>
                  <select
                    className="border rounded px-2 py-1"
                    value={newVersion.version_type}
                    onChange={e => setNewVersion({ ...newVersion, version_type: e.target.value.toLowerCase() })}
                  >
                    <option value="major">Major</option>
                    <option value="minor">Minor</option>
                    <option value="patch">Patch</option>
                  </select>
                </div>
              )}
              <div className="flex gap-2">
                <label className="text-sm">Status:</label>
                <select
                  className="border rounded px-2 py-1"
                  value={newVersion.status}
                  onChange={e => setNewVersion({ ...newVersion, status: e.target.value.toLowerCase() })}
                >
                  <option value="draft">Draft</option>
                  <option value="staging">Staging</option>
                  <option value="production">Production</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              {error && <div className="text-red-500 text-sm">{error}</div>}
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => { setShowModal(false); setEditVersion(null); }}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600" disabled={submitting}>
                  {submitting ? (editVersion ? "Saving..." : "Creating...") : (editVersion ? "Save" : "Create")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}