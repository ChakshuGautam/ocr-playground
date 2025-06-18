import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, context: { params: { dataset_id: string } }) {
  const dataset_id = context.params.dataset_id;
  if (!dataset_id) {
    return NextResponse.json({ error: 'Missing dataset_id' }, { status: 400 });
  }
  const backendUrl = `http://localhost:8000/api/datasets/${dataset_id}`;
  try {
    const res = await fetch(backendUrl);
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch dataset' }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 