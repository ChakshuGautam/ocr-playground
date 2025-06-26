"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Plus, Upload } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import JSZip from "jszip"

interface DatasetEntry {
  id: number;
  avatar: string;
  expectedText: string;
  imageFile?: File;
}

export default function AddDatasetEntriesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("manual")
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("draft");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [datasetCreated, setDatasetCreated] = useState(false);
  const [datasetId, setDatasetId] = useState<number | null>(null);
  const [entries, setEntries] = useState<DatasetEntry[]>([]);
  const [nextEntryId, setNextEntryId] = useState(1);
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const navigation = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Assessments", href: "/assessments" },
    { name: "Datasets", href: "/datasets", active: true },
    { name: "Reports", href: "/reports" },
    { name: "Settings", href: "/settings" },
  ]

  // Set datasetId and datasetCreated if id is present in query string
  useEffect(() => {
    const id = searchParams.get("id");
    if (id && !isNaN(Number(id))) {
      setDatasetId(Number(id));
      setDatasetCreated(true);
      // Fetch dataset details from new Next.js API route
      fetch(`/api/datasets/${id}`)
        .then(res => res.json())
        .then(data => {
          if (data && !data.error) {
            setName(data.name || "");
            setDescription(data.description || "");
            setStatus(data.status || "draft");
          }
        });
    }
  }, [searchParams]);

  const handleCreateDataset = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/datasets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, description, status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create dataset");
      }

      const data = await response.json();
      setDatasetId(data.id);
      setDatasetCreated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleAddEntry = () => {
    const newEntry: DatasetEntry = {
      id: nextEntryId,
      avatar: "📄",
      expectedText: "",
    };
    setEntries([...entries, newEntry]);
    setNextEntryId(nextEntryId + 1);
  };

  const handleEntryChange = (id: number, field: keyof DatasetEntry, value: string | File) => {
    setEntries(entries.map(entry =>
      entry.id === id ? { ...entry, [field]: value } : entry
    ));
  };

  const handleDeleteEntry = (id: number) => {
    setEntries(entries.filter(entry => entry.id !== id));
  };

  const handleSubmitEntries = async () => {
    if (!datasetId) return;

    setLoading(true);
    setError(null);

    try {
      if (activeTab === 'manual') {
        const formData = new FormData();
        formData.append('dataset_id', datasetId.toString());

        // Create a CSV file from manual entries
        const csvContent = [
          'image_filename,reference_text',
          ...entries.map(entry =>
            `${entry.imageFile?.name || ''},${entry.expectedText}`
          )
        ].join('\n');
        const csvBlob = new Blob([csvContent], { type: 'text/csv' });
        formData.append('reference_csv', new File([csvBlob], 'reference.csv'));

        // Create a ZIP file from image files
        const zip = new JSZip();
        const imageFileNames: string[] = [];
        entries.forEach(entry => {
          if (entry.imageFile) {
            zip.file(entry.imageFile.name, entry.imageFile);
            imageFileNames.push(entry.imageFile.name);
          }
        });
        console.log('Image files being zipped:', imageFileNames);
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        formData.append('images_zip', new File([zipBlob], 'images.zip'));

        const response = await fetch('/api/datasets/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to upload dataset files");
        }
      } else {
        // CSV import
        if (!csvFile) {
          throw new Error('Please upload a CSV file');
        }

        const formData = new FormData();
        formData.append('file', csvFile);
        formData.append('overwrite_existing', 'false');

        const response = await fetch(`/api/images/${datasetId}/import-csv`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to import CSV");
        }
      }

      router.push('/datasets');
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="AssessAI" navigation={navigation} />

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Add Dataset */}
          <div>
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Add Dataset</h1>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="space-y-6">
                <div>
                  <Label htmlFor="dataset-name" className="text-base font-medium">
                    Dataset Name
                  </Label>
                  <Input
                    id="dataset-name"
                    placeholder="Enter dataset name"
                    className="mt-2"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={datasetCreated}
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-base font-medium">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Enter dataset description"
                    className="mt-2"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={datasetCreated}
                  />
                </div>

                {!datasetCreated && (
                  <Button
                    className="w-full bg-blue-100 text-blue-700 hover:bg-blue-200"
                    onClick={handleCreateDataset}
                    disabled={loading || !name}
                  >
                    {loading ? "Creating..." : "Create Dataset"}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Add Entries */}
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h1 className="text-3xl font-bold text-gray-900">Add Entries</h1>
              {datasetCreated && (
                <Button
                  className="bg-gray-900 text-white hover:bg-gray-800"
                  onClick={handleAddEntry}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Row
                </Button>
              )}
            </div>

            {datasetCreated ? (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-fit grid-cols-2">
                  <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                  <TabsTrigger value="upload">Upload CSV</TabsTrigger>
                </TabsList>

                <TabsContent value="manual">
                  <div className="rounded-lg bg-white shadow-sm">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Image</TableHead>
                          <TableHead>Expected Text</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {entries.map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell>
                              <div className="flex items-center gap-4">
                                <Avatar className="h-10 w-10">
                                  <AvatarFallback className="bg-green-100 text-green-700">
                                    {entry.avatar}
                                  </AvatarFallback>
                                </Avatar>
                                <Input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      handleEntryChange(entry.id, 'imageFile', file);
                                      handleEntryChange(entry.id, 'avatar', '📷');
                                    }
                                  }}
                                />
                              </div>
                            </TableCell>
                            <TableCell>
                              <Input
                                value={entry.expectedText}
                                onChange={(e) => handleEntryChange(entry.id, 'expectedText', e.target.value)}
                                placeholder="Enter expected text"
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="link"
                                className="text-red-600 p-0"
                                onClick={() => handleDeleteEntry(entry.id)}
                              >
                                Delete
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="upload">
                  <div className="rounded-lg bg-white p-6 shadow-sm">
                    <div className="space-y-6">
                      <div>
                        <Label className="text-base font-medium">Import CSV</Label>
                        <div className="mt-2">
                          <Input
                            type="file"
                            accept=".csv"
                            onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                          />
                        </div>
                        <p className="mt-2 text-sm text-gray-500">
                          Upload a CSV file with columns: #, Link, Text, Correctness, OCR Output
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <Button
                  className="w-full bg-blue-600 text-white hover:bg-blue-700"
                  onClick={handleSubmitEntries}
                  disabled={loading || (activeTab === 'manual' && entries.length === 0) || (activeTab === 'upload' && !csvFile)}
                >
                  {loading ? "Submitting..." : "Submit Dataset"}
                </Button>
              </Tabs>
            ) : (
              <div className="rounded-lg bg-white p-6 shadow-sm text-center text-gray-500">
                Create a dataset first to add entries
              </div>
            )}
          </div>
        </div>
        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg">
            {error}
          </div>
        )}
      </main>
    </div>
  )
}
