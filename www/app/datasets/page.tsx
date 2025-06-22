'use client'

import { Sidebar } from "@/components/sidebar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useEffect, useState } from "react"
import Link from "next/link"

// const activeEvaluations = [
//   {
//     name: "Evaluation 1",
//     dataset: "Dataset A",
//     status: "In Progress",
//     createdAt: "2024-01-15",
//   },
//   {
//     name: "Evaluation 2",
//     dataset: "Dataset B",
//     status: "Completed",
//     createdAt: "2024-01-10",
//   },
//   {
//     name: "Evaluation 3",
//     dataset: "Dataset C",
//     status: "Pending",
//     createdAt: "2024-01-05",
//   },
// ]

// const recentResults = [
//   {
//     name: "Evaluation 2",
//     dataset: "Dataset B",
//     result: "95%",
//     createdAt: "2024-01-10",
//   },
//   {
//     name: "Evaluation 1",
//     dataset: "Dataset A",
//     result: "88%",
//     createdAt: "2024-01-15",
//   },
//   {
//     name: "Evaluation 3",
//     dataset: "Dataset C",
//     result: "76%",
//     createdAt: "2024-01-05",
//   },
// ]

function getStatusBadge(status: string) {
  switch (status) {
    case "draft":
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          Draft
        </Badge>
      )
    case "validated":
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          Validated
        </Badge>
      )
    case "archived":
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-800">
          Archived
        </Badge>
      )
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState<any[]>([])

  useEffect(() => {
    fetch("/api/datasets")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setDatasets(data)
        else if (Array.isArray(data?.data)) setDatasets(data.data)
      })
      .catch(() => setDatasets([]))
  }, [])

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar currentPath="/datasets" />

      <main className="flex-1 p-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Datasets</h1>
          <Link href="/add-dataset-entries">
            <Button className="bg-blue-600 hover:bg-blue-700">
              Add Dataset
            </Button>
          </Link>
        </div>

        <div className="space-y-8">
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {datasets.map((dataset) => (
                  <TableRow key={dataset.id}>
                    <TableCell className="font-medium">{dataset.name}</TableCell>
                    <TableCell>{getStatusBadge(dataset.status)}</TableCell>
                    <TableCell className="text-gray-600">{dataset.created_at ? new Date(dataset.created_at).toLocaleDateString() : "-"}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="link"
                        className="text-blue-600"
                        onClick={() => window.location.href = `/datasets/view/${dataset.id}`}
                      >
                        View
                      </Button>
                      <Button
                        variant="link"
                        className="text-green-600 ml-2"
                        onClick={() => window.location.href = `/edit-dataset?id=${dataset.id}`}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {/* <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-xl font-semibold text-gray-900">Active Evaluations</h2>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Evaluation Name</TableHead>
                  <TableHead>Dataset</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeEvaluations.map((evaluation) => (
                  <TableRow key={evaluation.name}>
                    <TableCell className="font-medium">{evaluation.name}</TableCell>
                    <TableCell>
                      <Button variant="link" className="h-auto p-0 text-blue-600">
                        {evaluation.dataset}
                      </Button>
                    </TableCell>
                    <TableCell>{getStatusBadge(evaluation.status)}</TableCell>
                    <TableCell className="text-gray-600">{evaluation.createdAt}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="link" className="text-blue-600">
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-xl font-semibold text-gray-900">Recent Results</h2>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Evaluation Name</TableHead>
                  <TableHead>Dataset</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentResults.map((result) => (
                  <TableRow key={result.name}>
                    <TableCell className="font-medium">{result.name}</TableCell>
                    <TableCell>
                      <Button variant="link" className="h-auto p-0 text-blue-600">
                        {result.dataset}
                      </Button>
                    </TableCell>
                    <TableCell className="font-semibold text-green-600">{result.result}</TableCell>
                    <TableCell className="text-gray-600">{result.createdAt}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="link" className="text-blue-600">
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div> */}
        </div>
      </main>
    </div>
  )
}
