"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Plus } from "lucide-react"

const entries = [
  {
    id: 1,
    avatar: "A",
    expectedText: "The quick brown fox jumps over the lazy dog.",
  },
  {
    id: 2,
    avatar: "S",
    expectedText: "All work and no play makes Alex a dull boy.",
  },
  {
    id: 3,
    avatar: "📄",
    expectedText: "Better late than never.",
  },
]

export default function AddDatasetEntriesPage() {
  const [activeTab, setActiveTab] = useState("manual")
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("draft");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigation = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Assessments", href: "/assessments" },
    { name: "Datasets", href: "/datasets", active: true },
    { name: "Reports", href: "/reports" },
    { name: "Settings", href: "/settings" },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="AssessAI" navigation={navigation} />

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Add Dataset */}
          <div>
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Add Dataset</h1>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="space-y-6">
                <div>
                  <Label htmlFor="dataset-name" className="text-base font-medium">
                    Dataset Name
                  </Label>
                  <Input id="dataset-name" placeholder="Enter dataset name" className="mt-2" value={name} onChange={(e) => setName(e.target.value)} />
                </div>

                <div>
                  <Label htmlFor="description" className="text-base font-medium">
                    Description
                  </Label>
                  <Textarea id="description" placeholder="Enter dataset description" className="mt-2" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>

                <div>
                  <Label htmlFor="entries" className="text-base font-medium">
                    Number of Entries
                  </Label>
                  <Input id="entries" placeholder="Enter number of entries" type="number" className="mt-2" />
                </div>

                <Button className="w-full bg-blue-100 text-blue-700 hover:bg-blue-200" onClick={async () => {
                  setLoading(true);
                  setError(null);
                  try {
                    const response = await fetch("/api/datasets", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({ name, description, status }),
                    });
                    if (!response.ok) {
                      const errorData = await response.json();
                      setError(errorData.detail || "Failed to create dataset");
                      setLoading(false);
                      return;
                    }
                    await response.json();
                    alert("Dataset created!");
                  } catch (err) {
                    setError("An error occurred");
                  } finally {
                    setLoading(false);
                  }
                }} disabled={loading}>
                  {loading ? "Adding..." : "Add Dataset"}
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column - Add Entries */}
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h1 className="text-3xl font-bold text-gray-900">Add Entries</h1>
              <Button className="bg-gray-900 text-white hover:bg-gray-800">
                <Plus className="mr-2 h-4 w-4" />
                Add New Row
              </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-fit grid-cols-2">
                <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                <TabsTrigger value="upload">Upload CSV</TabsTrigger>
              </TabsList>

              <TabsContent value="manual">
                <div className="rounded-lg bg-white shadow-sm">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Image</TableHead>
                        <TableHead>Expected Text</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entries.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell>
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-green-100 text-green-700">{entry.avatar}</AvatarFallback>
                            </Avatar>
                          </TableCell>
                          <TableCell className="text-gray-600">{entry.expectedText}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="link" className="text-blue-600 p-0">
                                Edit
                              </Button>
                              <span className="text-gray-400">|</span>
                              <Button variant="link" className="text-gray-600 p-0">
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="upload">
                <div className="rounded-lg bg-white p-6 shadow-sm">
                  <div className="flex justify-center rounded-lg border border-dashed border-gray-300 px-6 py-10">
                    <div className="text-center">
                      <div className="mx-auto h-12 w-12 text-gray-400">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                      </div>
                      <div className="mt-4 flex text-sm leading-6 text-gray-600">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer rounded-md bg-white font-semibold text-blue-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 hover:text-blue-500"
                        >
                          <span>Upload a file</span>
                          <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".csv" />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs leading-5 text-gray-600">CSV up to 10MB</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        {error && <div className="text-red-500">{error}</div>}
      </main>
    </div>
  )
}
