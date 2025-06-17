import { Header } from "@/components/header"
import { Progress } from "@/components/ui/progress"

export default function EvaluationRunsPage() {
  const navigation = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Datasets", href: "/datasets" },
    { name: "Challenges", href: "/challenges" },
    { name: "Teams", href: "/teams" },
    { name: "Docs", href: "/docs" },
    { name: "Community", href: "/community" },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="EvalAI" navigation={navigation} showSearch />

      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Evaluation Runs</h1>
          <p className="mt-2 text-blue-600">Track the progress of your evaluation runs in real-time.</p>
        </div>

        <div className="space-y-8">
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-xl font-semibold text-gray-900">Current Run</h2>

            <div className="space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Run Progress</span>
                  <span className="text-sm text-blue-600 font-medium">60% Complete</span>
                </div>
                <Progress value={60} className="h-2" />
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-xl font-semibold text-gray-900">Live Logs</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Live Logs</label>
              <div className="min-h-[300px] rounded-md border border-gray-300 bg-gray-50 p-4">
                <div className="text-sm text-gray-500">Logs will appear here as the evaluation runs...</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t bg-white mt-16">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex justify-center space-x-8 text-sm text-blue-600">
            <a href="#" className="hover:text-blue-800">
              Terms of Service
            </a>
            <a href="#" className="hover:text-blue-800">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-blue-800">
              Contact Us
            </a>
          </div>
          <div className="mt-4 text-center text-sm text-gray-600">©2024 EvalAI. All rights reserved.</div>
        </div>
      </footer>
    </div>
  )
}
