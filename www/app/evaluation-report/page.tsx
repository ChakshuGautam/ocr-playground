import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const evaluations = [
  {
    id: "Eval 1",
    expected: "The quick brown fox",
    parsed: "The quick brown fox",
    diff: "None",
    avatar: "📄",
  },
  {
    id: "Eval 2",
    expected: "jumps over the lazy dog",
    parsed: "jumps over the lazy dog",
    diff: "None",
    avatar: "📄",
  },
  {
    id: "Eval 3",
    expected: "The five boxing wizards jump quickly",
    parsed: "The five boxing wizards jump quickly",
    diff: "None",
    avatar: "S",
  },
  {
    id: "Eval 4",
    expected: "Pack my box with five dozen liquor jugs",
    parsed: "Pack my box with five dozen liquor jugs",
    diff: "None",
    avatar: "📄",
  },
  {
    id: "Eval 5",
    expected: "How vexingly quick daft zebras jump",
    parsed: "How vexingly quick daft zebras jump",
    diff: "None",
    avatar: "📄",
  },
]

const metadata = [
  { label: "Prompt ID", value: "Prompt 123" },
  { label: "Dataset ID", value: "Dataset 456" },
  { label: "Timestamp (From)", value: "2024-01-15 10:00 AM" },
  { label: "Timestamp (To)", value: "2024-01-15 10:20 AM" },
  { label: "Overall Summary", value: "All evaluations passed successfully." },
  { label: "Improvement from Last Evaluation", value: "+5%" },
]

export default function EvaluationReportPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Evaluation Comparison Dashboard</h1>
        </div>

        <div className="space-y-8">
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-xl font-semibold text-gray-900">Detailed Evaluations</h2>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Evaluation ID</TableHead>
                  <TableHead>Expected Words</TableHead>
                  <TableHead>Parsed Words</TableHead>
                  <TableHead>Diff</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {evaluations.map((evaluation) => (
                  <TableRow key={evaluation.id}>
                    <TableCell>
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-gray-100">{evaluation.avatar}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">{evaluation.id}</TableCell>
                    <TableCell className="text-blue-600">{evaluation.expected}</TableCell>
                    <TableCell className="text-gray-600">{evaluation.parsed}</TableCell>
                    <TableCell className="text-gray-600">{evaluation.diff}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-xl font-semibold text-gray-900">Metadata</h2>

            <div className="grid gap-4 md:grid-cols-2">
              {metadata.map((item) => (
                <div key={item.label} className="flex justify-between border-b pb-2">
                  <span className="text-blue-600 font-medium">{item.label}</span>
                  <span className="text-gray-900 font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
