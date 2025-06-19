'use client'

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
import { useEffect, useState, useRef } from "react"

export default function CreateTestPage() {
  const navigation = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Tasks", href: "/tasks" },
    { name: "Datasets", href: "/datasets" },
    { name: "Docs", href: "/docs" },
    { name: "Community", href: "/community" },
  ]

  const [datasets, setDatasets] = useState<{ id: number; name: string }[]>([])
  const [selectedDataset, setSelectedDataset] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const nameRef = useRef<HTMLInputElement>(null)
  const descriptionRef = useRef<HTMLInputElement>(null)
  const hypothesisRef = useRef<HTMLInputElement>(null)
  const promptARef = useRef<HTMLTextAreaElement>(null)
  const promptBRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setLoading(true)
    fetch("/api/datasets")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch datasets")
        return res.json()
      })
      .then((data) => {
        // If the API returns { data: [...] }
        if (Array.isArray(data)) {
          setDatasets(data)
        } else if (Array.isArray(data.data)) {
          setDatasets(data.data)
        } else {
          setDatasets([])
        }
        setError(null)
      })
      .catch((err) => {
        setError(err.message)
        setDatasets([])
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleCreateTest() {
    const name = nameRef.current?.value || ""
    const description = descriptionRef.current?.value || ""
    const hypothesis = hypothesisRef.current?.value || ""
    const promptA = promptARef.current?.value || ""
    const promptB = promptBRef.current?.value || ""
    const datasetId = selectedDataset ? Number(selectedDataset) : null
    if (!name || !description || !hypothesis || !datasetId || !promptA || !promptB) {
      alert("Please fill in all fields.")
      return
    }
    const body = {
      name,
      description,
      hypothesis,
      dataset_ids: [datasetId],
      prompt_version_a: promptA,
      prompt_version_b: promptB,
    }
    try {
      const res = await fetch("/api/evaluation-runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to create test")
      alert("Test created successfully!")
      // Optionally, redirect or reset form here
    } catch (err: any) {
      alert(err.message || "Failed to create test")
    }
  }

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
                  <Input id="test-name" ref={nameRef} placeholder="Enter a name for your A/B test" className="mt-2" />
                </div>

                <div>
                  <Label htmlFor="test-description" className="text-base font-medium">
                    Description
                  </Label>
                  <Input id="test-description" ref={descriptionRef} placeholder="Enter description for your A/B test" className="mt-2" />
                </div>

                <div>
                  <Label htmlFor="test-hypothesis" className="text-base font-medium">
                    Hypothesis
                  </Label>
                  <Input id="test-hypothesis" ref={hypothesisRef} placeholder="Enter hypothesis for your A/B test" className="mt-2" />
                </div>

                <div>
                  <Label htmlFor="dataset" className="text-base font-medium">
                    Dataset
                  </Label>
                  <Select value={selectedDataset} onValueChange={setSelectedDataset}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder={loading ? "Loading..." : "Select dataset"} />
                      <div className="flex items-center gap-1">
                        <ChevronUp className="h-4 w-4" />
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {error && (
                        <div className="text-red-500 px-2 py-1">{error}</div>
                      )}
                      {!error && datasets.length === 0 && !loading && (
                        <div className="px-2 py-1">No datasets found</div>
                      )}
                      {datasets.map((dataset) => (
                        <SelectItem key={dataset.id} value={String(dataset.id)}>
                          {dataset.name}
                        </SelectItem>
                      ))}
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
                  <Textarea id="prompt-a" ref={promptARef} placeholder="Enter prompt version A" className="mt-2" rows={4} />
                </div>

                <div>
                  <Label htmlFor="prompt-b" className="text-base font-medium">
                    Prompt Version B
                  </Label>
                  <Textarea id="prompt-b" ref={promptBRef} placeholder="Enter prompt version B" className="mt-2" rows={4} />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleCreateTest} size="lg" className="bg-blue-600 hover:bg-blue-700">
                Create Test
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
