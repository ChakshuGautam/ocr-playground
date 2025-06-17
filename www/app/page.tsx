import Link from "next/link"
import { Button } from "@/components/ui/button"
import { redirect } from "next/navigation"

export default function HomePage() {
  redirect("/dashboard")

  const pages = [
    { name: "Add Dataset", href: "/add-dataset", description: "Create a new dataset with manual entry or CSV upload" },
    { name: "Dashboard", href: "/dashboard", description: "View active evaluations and recent results" },
    { name: "Evaluation Runs", href: "/evaluation-runs", description: "Track evaluation progress in real-time" },
    { name: "Prompts", href: "/prompts", description: "Manage and organize your prompts" },
    { name: "Create A/B Test", href: "/create-test", description: "Set up A/B tests for prompt comparison" },
    { name: "Evaluation Report", href: "/evaluation-report", description: "Detailed evaluation comparison dashboard" },
    { name: "Ground Truth", href: "/ground-truth", description: "Manage ground truth datasets" },
    {
      name: "Add Dataset with Entries",
      href: "/add-dataset-entries",
      description: "Add dataset with entry management",
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">AI Evaluation Platform</h1>
          <p className="text-xl text-gray-600">Explore the different pages and components of the evaluation platform</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {pages.map((page) => (
            <div key={page.name} className="rounded-lg bg-white p-6 shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{page.name}</h3>
              <p className="text-gray-600 mb-4">{page.description}</p>
              <Button asChild className="w-full">
                <Link href={page.href}>View Page</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
