import Link from "next/link"
import { Home, FileText, Database, MessageSquare, Settings, Users, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarProps {
  currentPath?: string
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Assessments", href: "/assessments", icon: FileText },
  { name: "Evaluations", href: "/evaluations", icon: BarChart3 },
  { name: "Evaluation Runs", href: "/evaluation-runs", icon: BarChart3 },
  { name: "Datasets", href: "/datasets", icon: Database },
  { name: "Add Dataset", href: "/add-dataset", icon: Database },
  { name: "Add Dataset Entries", href: "/add-dataset-entries", icon: Database },
  { name: "Prompts", href: "/prompts", icon: MessageSquare },
  { name: "Prompts Families", href: "/prompt-families", icon: MessageSquare },
  { name: "Create A/B Test", href: "/create-test", icon: MessageSquare },
  { name: "Ground Truth", href: "/ground-truth", icon: Database },
  { name: "Evaluation Report", href: "/evaluation-report", icon: BarChart3 },
  { name: "Users", href: "/users", icon: Users },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function Sidebar({ currentPath }: SidebarProps) {
  return (
    <div className="flex h-full w-64 flex-col bg-white border-r">
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Handwriting AI</h2>
          <p className="text-sm text-gray-600">AI-Powered Handwriting Analysis</p>
        </div>

        <nav className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = currentPath === item.href

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
