"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search } from "lucide-react"

const prompts = [
  {
    name: "Prompt 1",
    status: "Active",
    lastModified: "2023-09-15",
  },
  {
    name: "Prompt 2",
    status: "Inactive",
    lastModified: "2023-08-20",
  },
  {
    name: "Prompt 3",
    status: "Active",
    lastModified: "2023-07-10",
  },
  {
    name: "Prompt 4",
    status: "Active",
    lastModified: "2023-06-05",
  },
  {
    name: "Prompt 5",
    status: "Inactive",
    lastModified: "2023-05-01",
  },
]

function getStatusBadge(status: string) {
  return status === "Active" ? (
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

  const filteredPrompts = prompts.filter((prompt) => {
    if (activeTab === "active") return prompt.status === "Active"
    if (activeTab === "inactive") return prompt.status === "Inactive"
    return true
  })

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar currentPath="/prompts" />

      <main className="flex-1 p-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Prompts</h1>
          <Button className="bg-blue-600 hover:bg-blue-700">New Prompt</Button>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input placeholder="Search prompts" className="pl-10 bg-blue-50 border-blue-200" />
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-fit grid-cols-3">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="inactive">Inactive</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Modified</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPrompts.map((prompt) => (
                    <TableRow key={prompt.name}>
                      <TableCell className="font-medium">{prompt.name}</TableCell>
                      <TableCell>{getStatusBadge(prompt.status)}</TableCell>
                      <TableCell className="text-blue-600">{prompt.lastModified}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="link" className="text-blue-600">
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
