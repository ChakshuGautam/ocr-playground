"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AddDatasetPage() {
  const [activeTab, setActiveTab] = useState("manual")

  const navigation = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Assessments", href: "/assessments" },
    { name: "Datasets", href: "/datasets", active: true },
    { name: "Reports", href: "/reports" },
    { name: "Settings", href: "/settings" },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="AssessAI" navigation={navigation} />

      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Add Dataset</h1>
          <p className="mt-2 text-gray-600">
            Choose how you want to add your dataset. You can either manually enter the details or upload a CSV file for
            bulk addition.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-fit grid-cols-2">
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="upload">Upload CSV</TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-6">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="space-y-6">
                <div>
                  <Label htmlFor="dataset-name" className="text-base font-medium">
                    Dataset Name
                  </Label>
                  <Input id="dataset-name" placeholder="Enter dataset name" className="mt-2" />
                </div>

                <div>
                  <Label htmlFor="description" className="text-base font-medium">
                    Description
                  </Label>
                  <Textarea id="description" placeholder="Enter dataset description" className="mt-2" rows={3} />
                </div>

                <div>
                  <Label htmlFor="entries" className="text-base font-medium">
                    Number of Entries
                  </Label>
                  <Input id="entries" placeholder="Enter number of entries" type="number" className="mt-2" />
                </div>

                <div className="flex justify-end">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                    Add Dataset
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="upload" className="space-y-6">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="space-y-6">
                <div>
                  <Label className="text-base font-medium">Upload CSV File</Label>
                  <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-300 px-6 py-10">
                    <div className="text-center">
                      <div className="mx-auto h-12 w-12 text-gray-400">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                      </div>
                      <div className="mt-4 flex text-sm leading-6 text-gray-600">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer rounded-md bg-white font-semibold text-blue-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 hover:text-blue-500"
                        >
                          <span>Upload a file</span>
                          <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".csv" />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs leading-5 text-gray-600">CSV up to 10MB</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
