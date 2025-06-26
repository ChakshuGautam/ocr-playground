import React from "react"
import { Sidebar } from "@/components/sidebar"
export default function DocsPage() {
    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar currentPath="/docs" />
            <main className="flex-1 p-8">

                <div className="max-w-2xl mx-auto py-16 px-4">
                    <h1 className="text-3xl font-bold mb-6">API Documentation</h1>
                    <h2 className="text-xl font-semibold mb-4">Example: Using cURL</h2>
                    <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto mb-4">
                        <code>{`curl -X POST https://structura.com/ocr \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/image.jpg"
  }'`}
                        </code>
                    </pre>
                    <p className="text-gray-700">Replace <code>YOUR_API_KEY</code> and <code>image_url</code> with your actual API key and image URL.</p>
                </div>
            </main >
        </div>
    )
}