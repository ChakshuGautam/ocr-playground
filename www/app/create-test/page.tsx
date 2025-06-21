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
    { name: "Datasets", href: "/datasets" },
    { name: "Prompt Families", href: "/prompt-families" },
    { name: "Evaluation Runs", href: "/evaluation-runs" },
  ]

  const [datasets, setDatasets] = useState<{ id: number; name: string }[]>([])
  const [selectedDataset, setSelectedDataset] = useState<string>("")
  const [families, setFamilies] = useState<any[]>([])
  const [selectedFamily, setSelectedFamily] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [versions, setVersions] = useState<any[]>([])
  const [selectedVersionA, setSelectedVersionA] = useState<string>("")
  const [selectedVersionB, setSelectedVersionB] = useState<string>("")

  const nameRef = useRef<HTMLInputElement>(null)
  const descriptionRef = useRef<HTMLInputElement>(null)
  const hypothesisRef = useRef<HTMLTextAreaElement>(null)
  const labelARef = useRef<HTMLInputElement>(null)
  const labelBRef = useRef<HTMLInputElement>(null)

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

  useEffect(() => {
    setLoading(true)
    fetch("/api/prompt-families")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setFamilies(data)
        } else if (Array.isArray(data.data)) {
          setFamilies(data.data)
        } else {
          setFamilies([])
        }
      })
      .catch(() => setFamilies([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedFamily) {
      setVersions([])
      setSelectedVersionA("")
      setSelectedVersionB("")
      return
    }
    setLoading(true)
    fetch(`/api/prompt-families/${selectedFamily}/versions`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setVersions(data)
        } else if (Array.isArray(data.data)) {
          setVersions(data.data)
        } else {
          setVersions([])
        }
        setSelectedVersionA("")
        setSelectedVersionB("")
      })
      .catch(() => setVersions([]))
      .finally(() => setLoading(false))
  }, [selectedFamily])

  async function handleCreateTest() {
    const name = nameRef.current?.value || ""
    const description = descriptionRef.current?.value || ""
    const hypothesis = hypothesisRef.current?.value || ""
    const labelA = labelARef.current?.value || "Control (Baseline)"
    const labelB = labelBRef.current?.value || "Variation (Test)"
    const datasetId = selectedDataset ? Number(selectedDataset) : null
    const promptFamilyId = selectedFamily ? Number(selectedFamily) : null
    const versionAObj = versions.find(v => String(v.id) === selectedVersionA)
    const versionBObj = versions.find(v => String(v.id) === selectedVersionB)
    if (!name || !description || !hypothesis || !datasetId || !promptFamilyId || !versionAObj || !versionBObj) {
      alert("Please fill in all fields.")
      return
    }
    setCreating(true)
    try {
      // Step: Create the evaluation run using selected versions
      const evaluationRunBody = {
        name,
        description,
        hypothesis,
        dataset_ids: [datasetId],
        prompt_configurations: [
          {
            label: labelA,
            family_id: promptFamilyId,
            version: versionAObj.version
          },
          {
            label: labelB,
            family_id: promptFamilyId,
            version: versionBObj.version
          }
        ]
      }
      console.log("evaluationRunBody : ", evaluationRunBody);
      const runResponse = await fetch("/api/evaluation-runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(evaluationRunBody),
      })
      if (!runResponse.ok) {
        const errorData = await runResponse.json()
        throw new Error(errorData.detail || "Failed to create evaluation run")
      }
      const runData = await runResponse.json()
      alert(`A/B test created successfully! Run ID: ${runData.id}`)
      // Reset form
      if (nameRef.current) nameRef.current.value = ""
      if (descriptionRef.current) descriptionRef.current.value = ""
      if (hypothesisRef.current) hypothesisRef.current.value = ""
      if (labelARef.current) labelARef.current.value = ""
      if (labelBRef.current) labelBRef.current.value = ""
      setSelectedDataset("")
      setSelectedFamily("")
      setSelectedVersionA("")
      setSelectedVersionB("")
    } catch (err: any) {
      alert(err.message || "Failed to create A/B test")
    } finally {
      setCreating(false)
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
                <BreadcrumbLink href="/evaluation-runs" className="text-blue-600">
                  Evaluation Runs
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
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">How A/B Testing Works:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Hypothesis:</strong> Define what you expect to improve (e.g., "Adding context awareness will improve OCR accuracy by 15%")</li>
              <li>• <strong>Control (Version A):</strong> Your current/baseline prompt</li>
              <li>• <strong>Variation (Version B):</strong> Your improved/test prompt</li>
              <li>• <strong>Dataset:</strong> The images you'll test both prompts on</li>
              <li>• <strong>Results:</strong> Compare accuracy, speed, and other metrics to see which performs better</li>
            </ul>
          </div>
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
                  <Input id="test-name" ref={nameRef} placeholder="e.g., Handwriting OCR - Context vs Baseline" className="mt-2" />
                </div>

                <div>
                  <Label htmlFor="test-description" className="text-base font-medium">
                    Description
                  </Label>
                  <Input id="test-description" ref={descriptionRef} placeholder="e.g., Comparing baseline OCR prompt against context-aware prompt for handwritten text recognition" className="mt-2" />
                </div>

                <div>
                  <Label htmlFor="test-hypothesis" className="text-base font-medium">
                    Hypothesis
                  </Label>
                  <Textarea
                    id="test-hypothesis"
                    ref={hypothesisRef}
                    placeholder="e.g., Adding context awareness and pattern recognition instructions will improve OCR accuracy by 15% on handwritten text because the model will use surrounding words to disambiguate unclear characters."
                    className="mt-2"
                    rows={3}
                  />
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
              <h2 className="mb-6 text-xl font-semibold text-gray-900">Prompt Family</h2>

              <div className="space-y-6">
                <div>
                  <Label htmlFor="prompt-family" className="text-base font-medium">
                    Prompt Family
                  </Label>
                  <Select value={selectedFamily} onValueChange={setSelectedFamily}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder={loading ? "Loading..." : "Select prompt family"} />
                      <div className="flex items-center gap-1">
                        <ChevronUp className="h-4 w-4" />
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {families.length === 0 && !loading && (
                        <div className="px-2 py-1">No prompt families found</div>
                      )}
                      {families.map((family) => (
                        <SelectItem key={family.id} value={String(family.id)}>
                          {family.name}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Version A */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="label-a" className="text-base font-medium">
                        Version A Label
                      </Label>
                      <Input
                        id="label-a"
                        ref={labelARef}
                        placeholder="Control (Baseline)"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="version-a" className="text-base font-medium">
                        Select Version A
                      </Label>
                      <Select value={selectedVersionA} onValueChange={setSelectedVersionA} disabled={versions.length === 0}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder={loading ? "Loading..." : "Select version A"} />
                          <div className="flex items-center gap-1">
                            <ChevronUp className="h-4 w-4" />
                            <ChevronDown className="h-4 w-4" />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="max-w-xs md:max-w-md lg:max-w-lg">
                          {versions.length === 0 && !loading && (
                            <div className="px-2 py-1">No versions found</div>
                          )}
                          {versions.map((version) => (
                            <SelectItem key={version.id} value={String(version.id)} className="max-w-xs md:max-w-md lg:max-w-lg">
                              <span className="truncate">
                                {version.version} {version.changelog_message ? `- ${version.changelog_message}` : ""}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {/* Version B */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="label-b" className="text-base font-medium">
                        Version B Label
                      </Label>
                      <Input
                        id="label-b"
                        ref={labelBRef}
                        placeholder="Variation (Context-Aware)"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="version-b" className="text-base font-medium">
                        Select Version B
                      </Label>
                      <Select value={selectedVersionB} onValueChange={setSelectedVersionB} disabled={versions.length === 0}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder={loading ? "Loading..." : "Select version B"} />
                          <div className="flex items-center gap-1">
                            <ChevronUp className="h-4 w-4" />
                            <ChevronDown className="h-4 w-4" />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="max-w-xs md:max-w-md lg:max-w-lg">
                          {versions.length === 0 && !loading && (
                            <div className="px-2 py-1">No versions found</div>
                          )}
                          {versions.map((version) => (
                            <SelectItem key={version.id} value={String(version.id)} className="max-w-xs md:max-w-md lg:max-w-lg">
                              <span className="truncate">
                                {version.version} {version.changelog_message ? `- ${version.changelog_message}` : ""}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleCreateTest}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={creating}
              >
                {creating ? "Creating Test..." : "Create A/B Test"}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
