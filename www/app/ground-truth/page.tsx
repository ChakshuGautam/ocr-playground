import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const datasets = [
  {
    name: "Dataset A",
    samples: "1000",
    referenceTexts: "500",
  },
  {
    name: "Dataset B",
    samples: "1500",
    referenceTexts: "750",
  },
  {
    name: "Dataset C",
    samples: "2000",
    referenceTexts: "1000",
  },
]

export default function GroundTruthPage() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar currentPath="/ground-truth" />

      <main className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Ground Truth</h1>
          <p className="mt-2 text-blue-600">Manage ground truth data for model evaluation</p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-6 text-xl font-semibold text-gray-900">Datasets</h2>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Samples</TableHead>
                <TableHead>Reference Texts</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {datasets.map((dataset) => (
                <TableRow key={dataset.name}>
                  <TableCell className="font-medium">{dataset.name}</TableCell>
                  <TableCell className="text-blue-600">{dataset.samples}</TableCell>
                  <TableCell className="text-blue-600">{dataset.referenceTexts}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="link" className="text-blue-600">
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-6">
            <Button className="bg-blue-600 hover:bg-blue-700">Upload Dataset</Button>
          </div>
        </div>
      </main>
    </div>
  )
}
