import { Sidebar } from "@/components/sidebar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const activeEvaluations = [
  {
    name: "Evaluation 1",
    dataset: "Dataset A",
    status: "In Progress",
    createdAt: "2024-01-15",
  },
  {
    name: "Evaluation 2",
    dataset: "Dataset B",
    status: "Completed",
    createdAt: "2024-01-10",
  },
  {
    name: "Evaluation 3",
    dataset: "Dataset C",
    status: "Pending",
    createdAt: "2024-01-05",
  },
]

const recentResults = [
  {
    name: "Evaluation 2",
    dataset: "Dataset B",
    result: "95%",
    createdAt: "2024-01-10",
  },
  {
    name: "Evaluation 1",
    dataset: "Dataset A",
    result: "88%",
    createdAt: "2024-01-15",
  },
  {
    name: "Evaluation 3",
    dataset: "Dataset C",
    result: "76%",
    createdAt: "2024-01-05",
  },
]

function getStatusBadge(status: string) {
  switch (status) {
    case "In Progress":
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          In Progress
        </Badge>
      )
    case "Completed":
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          Completed
        </Badge>
      )
    case "Pending":
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-800">
          Pending
        </Badge>
      )
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar currentPath="/dashboard" />

      <main className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        </div>

        <div className="space-y-8">
          <div className="rounded-lg bg-white p-6 shadow-sm">
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
          </div>
        </div>
      </main>
    </div>
  )
}
