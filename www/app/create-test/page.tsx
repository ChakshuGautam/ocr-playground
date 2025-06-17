import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { ChevronDown, ChevronUp } from "lucide-react"

export default function CreateTestPage() {
  const navigation = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Tasks", href: "/tasks" },
    { name: "Datasets", href: "/datasets" },
    { name: "Docs", href: "/docs" },
    { name: "Community", href: "/community" },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="EvalAI" navigation={navigation} />

      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard" className="text-blue-600">
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/tasks" className="text-blue-600">
                  Tasks
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Create A/B Test</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create A/B Test</h1>
          <p className="mt-2 text-blue-600">
            Set up an A/B test to compare different versions of your prompts and datasets.
          </p>
        </div>

        <div className="rounded-lg bg-white p-8 shadow-sm">
          <div className="space-y-8">
            <div>
              <h2 className="mb-6 text-xl font-semibold text-gray-900">Test Configuration</h2>

              <div className="space-y-6">
                <div>
                  <Label htmlFor="test-name" className="text-base font-medium">
                    Test Name
                  </Label>
                  <Input id="test-name" placeholder="Enter a name for your A/B test" className="mt-2" />
                </div>

                <div>
                  <Label htmlFor="dataset" className="text-base font-medium">
                    Dataset
                  </Label>
                  <Select>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select dataset" />
                      <div className="flex items-center gap-1">
                        <ChevronUp className="h-4 w-4" />
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dataset-a">Dataset A</SelectItem>
                      <SelectItem value="dataset-b">Dataset B</SelectItem>
                      <SelectItem value="dataset-c">Dataset C</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div>
              <h2 className="mb-6 text-xl font-semibold text-gray-900">Prompt Versions</h2>

              <div className="space-y-6">
                <div>
                  <Label htmlFor="prompt-a" className="text-base font-medium">
                    Prompt Version A
                  </Label>
                  <Textarea id="prompt-a" placeholder="Enter prompt version A" className="mt-2" rows={4} />
                </div>

                <div>
                  <Label htmlFor="prompt-b" className="text-base font-medium">
                    Prompt Version B
                  </Label>
                  <Textarea id="prompt-b" placeholder="Enter prompt version B" className="mt-2" rows={4} />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Create Test
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
