import { NextResponse } from 'next/server';

export async function POST(request: Request,  context: { params: { dataset_id: string } }) {
  const params = await context.params;
  const dataset_id = params.dataset_id;
  if (!dataset_id) {
    return NextResponse.json({ error: 'Missing dataset_id' }, { status: 400 });
  }
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const overwriteExisting = formData.get('overwrite_existing') === 'true';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Forward the request to the backend API
    const backendFormData = new FormData();
    backendFormData.append('file', file);
    backendFormData.append('overwrite_existing', overwriteExisting.toString());

    const response = await fetch(`http://localhost:8000/api/images/${dataset_id}/import-csv`, {
      method: 'POST',
      body: backendFormData,
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json({ error: error.detail }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('CSV import error:', error);
    return NextResponse.json(
      { error: 'Failed to import CSV file' },
      { status: 500 }
    );
  }
} 