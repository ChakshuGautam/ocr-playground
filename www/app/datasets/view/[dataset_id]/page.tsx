"use client"

import { Sidebar } from "@/components/sidebar"
import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useParams, useRouter } from "next/navigation"
import { useRef } from "react"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"

interface ImageEntry {
    id: number;
    number: string;
    url: string;
    local_path: string;
    reference_text: string;
    created_at: string;
    updated_at: string;
    user_id: string;
}

interface Dataset {
    id: number;
    name: string;
    description: string;
    status: string;
    image_count: number;
    created_at: string;
    updated_at: string;
    last_used: string | null;
    images: ImageEntry[];
    user_id: string;
}


export default function ViewDatasetPage() {
    const params = useParams()
    const dataset_id = params.dataset_id as string
    const router = useRouter()
    const { user } = useUser();

    const [dataset, setDataset] = useState<Dataset | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalImage, setModalImage] = useState<string | null>(null);
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const modalRef = useRef<HTMLDivElement | null>(null);

    const navigation = [
        { name: "Dashboard", href: "/dashboard" },
        { name: "Assessments", href: "/assessments" },
        { name: "Datasets", href: "/datasets", active: true },
        { name: "Reports", href: "/reports" },
        { name: "Settings", href: "/settings" },
    ]

    useEffect(() => {
        if (dataset_id) {
            setLoading(true);
            fetch(`/api/datasets/${dataset_id}`)
                .then(res => {
                    if (!res.ok) {
                        throw new Error('Failed to fetch dataset');
                    }
                    return res.json()
                })
                .then(data => {
                    if (data && !data.error) {
                        setDataset(data);
                    } else {
                        setError(data.error || 'Failed to fetch dataset');
                    }
                })
                .catch(err => {
                    setError(err.message);
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [dataset_id]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setModalImage(null)
            }
        }

        if (modalImage) {
            document.addEventListener('keydown', handleKeyDown)
            const focusableElements = modalRef.current?.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            )
            const firstElement = focusableElements?.[0] as HTMLElement | undefined
            const lastElement = focusableElements?.[focusableElements.length - 1] as HTMLElement | undefined

            const handleTabKeyPress = (e: KeyboardEvent) => {
                if (e.key === 'Tab') {
                    if (e.shiftKey) {
                        if (document.activeElement === firstElement) {
                            lastElement?.focus()
                            e.preventDefault()
                        }
                    } else {
                        if (document.activeElement === lastElement) {
                            firstElement?.focus()
                            e.preventDefault()
                        }
                    }
                }
            }

            modalRef.current?.addEventListener('keydown', handleTabKeyPress)
            firstElement?.focus()

            return () => {
                document.removeEventListener('keydown', handleKeyDown)
                modalRef.current?.removeEventListener('keydown', handleTabKeyPress)
                triggerRef.current?.focus()
            }
        }
    }, [modalImage])

    const handleDeleteImage = async (imageId: number) => {
        if (!dataset) return;
        if (!user) return;
        if (dataset.user_id !== user.id) {
            alert("You are not authorized to delete images from this dataset.");
            return;
        }
        const res = await fetch(`/api/datasets/${dataset.id}/images/${imageId}`, {
            method: 'DELETE',
        });
        if (res.ok) {
            setDataset({
                ...dataset,
                images: dataset.images.filter(img => img.id !== imageId),
                image_count: dataset.image_count - 1,
            });
        } else {
            const err = await res.json();
            alert(err.error || 'Failed to delete image');
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar currentPath="/datasets" />

            <main className="flex-1 p-8">
                {loading ? (
                    <div className="text-center">Loading...</div>
                ) : error ? (
                    <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg">
                        {error}
                    </div>
                ) : dataset ? (
                    <>
                        <div>
                            <div className="mb-6">
                                <button className="text-blue-600 mb-4" onClick={() => router.push("/datasets")}>
                                    ← Back to Datasets
                                </button>
                                <div className="flex items-center gap-4 mb-4">
                                    <h1 className="text-3xl font-bold text-gray-900">{dataset.name}</h1>
                                    {dataset.status && (
                                        <span
                                            className={`inline-block px-3 py-1 text-sm font-semibold rounded-full
                                                ${dataset.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : ''}
                                                ${dataset.status === 'validated' ? 'bg-green-100 text-green-800' : ''}
                                            `}
                                        >
                                            {dataset.status.charAt(0).toUpperCase() + dataset.status.slice(1)}
                                        </span>
                                    )}
                                </div>
                                <div className="text-gray-500">{dataset.description}</div>
                            </div>

                            {/* <div className="rounded-lg bg-white p-6 shadow-sm">
                                <div className="space-y-6">
                                    <div>
                                        <Label htmlFor="dataset-name" className="text-base font-medium">
                                            Dataset Name
                                        </Label>
                                        <p className="mt-2 text-gray-800"></p>
                                    </div>

                                    <div>
                                        <Label htmlFor="description" className="text-base font-medium">
                                            Description
                                        </Label>
                                        <p className="mt-2 text-gray-800">{dataset.description}</p>
                                    </div>

                                    <div>
                                        <Label htmlFor="status" className="text-base font-medium">
                                            Status
                                        </Label>
                                        <p className="mt-2 text-gray-800 capitalize">{dataset.status}</p>
                                    </div>
                                </div>
                            </div> */}
                        </div>

                        <div className="mt-8">
                            <h2 className="text-2xl text-gray-900">Dataset Images</h2>
                            <div className="mt-4 rounded-lg bg-white shadow-sm">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Image</TableHead>
                                            <TableHead>Reference Text</TableHead>
                                            <TableHead>Human Evaluation</TableHead>
                                            {/* <TableHead>URL</TableHead> */}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {dataset.images && dataset.images.map((image) => (
                                            <TableRow key={image.id}>
                                                <TableCell>
                                                    <button
                                                        className="focus:outline-none"
                                                        onClick={(e) => {
                                                            setModalImage(image.url)
                                                            triggerRef.current = e.currentTarget
                                                        }}
                                                        title="Click to enlarge"
                                                    >
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img
                                                            src={image.url}
                                                            alt={`Image ${image.id}`}
                                                            className="h-12 w-12 object-cover rounded-full border border-gray-200 shadow-sm hover:scale-105 transition-transform"
                                                        />
                                                    </button>
                                                </TableCell>
                                                <TableCell>
                                                    <p className="whitespace-pre-wrap">{image.reference_text}</p>
                                                </TableCell>
                                                <TableCell>
                                                    <p className="whitespace-pre-wrap">{image.reference_text}</p>
                                                </TableCell>
                                                {/* Delete button, only show if user is owner */}
                                                <TableCell>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => handleDeleteImage(image.id)}
                                                    >
                                                        Delete
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                        {/* Modal for full image */}
                        {modalImage && (
                            <div
                                ref={modalRef}
                                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
                                onClick={() => setModalImage(null)}
                                role="dialog"
                                aria-modal="true"
                                aria-labelledby="modal-title"
                            >
                                <div className="bg-white rounded-lg shadow-lg max-w-3xl max-h-[90vh] flex flex-col items-center relative" onClick={e => e.stopPropagation()}>
                                    <h2 id="modal-title" className="sr-only">Enlarged image</h2>
                                    <button
                                        className="absolute top-2 right-2 text-gray-500 hover:text-gray-600 text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        onClick={() => setModalImage(null)}
                                        aria-label="Close"
                                    >
                                        ×
                                    </button>
                                    <img src={modalImage} alt="Full" className="max-h-[70vh] max-w-full rounded mb-4" />
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center text-gray-500">Dataset not found.</div>
                )}
            </main>
        </div>
    )
}
