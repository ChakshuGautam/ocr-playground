import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const datasetId = formData.get('dataset_id');
    const imagesZip = formData.get('images_zip') as File;
    const referenceCsv = formData.get('reference_csv') as File;

    if (!datasetId || !imagesZip || !referenceCsv) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const uploadFormData = new FormData();
    uploadFormData.append('images_zip', imagesZip);
    uploadFormData.append('reference_csv', referenceCsv);

    const response = await fetch(`http://localhost:8000/api/datasets/${datasetId}/upload`, {
      method: 'POST',
      body: uploadFormData,
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json({ error: error.detail }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to upload dataset files' },
      { status: 500 }
    );
  }
} 