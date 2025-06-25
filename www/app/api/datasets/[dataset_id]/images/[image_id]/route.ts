import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function DELETE(
  req: NextRequest,
  context: { params: { dataset_id: string; image_id: string } }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const params = await context.params;
  const { dataset_id, image_id } = params;

  // Fetch dataset and image to check user_id
  const [datasetRes, imageRes] = await Promise.all([
    fetch(`${process.env.BACKEND_URL}/api/datasets/${dataset_id}`),
    fetch(`${process.env.BACKEND_URL}/api/images/${image_id}`)
  ]);

  if (!datasetRes.ok) {
    return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
  }
  if (!imageRes.ok) {
    return NextResponse.json({ error: 'Image not found' }, { status: 404 });
  }

  const dataset = await datasetRes.json();
  const image = await imageRes.json();

  if (dataset.user_id !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Call backend to delete
  const backendRes = await fetch(
    `${process.env.BACKEND_URL}/api/datasets/${dataset_id}/images/${image_id}`,
    { method: 'DELETE' }
  );

  if (!backendRes.ok) {
    const err = await backendRes.json();
    return NextResponse.json({ error: err.detail || 'Failed to delete image' }, { status: backendRes.status });
  }

  return NextResponse.json({ success: true });
} 