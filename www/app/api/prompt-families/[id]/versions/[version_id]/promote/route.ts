import { NextRequest, NextResponse } from 'next/server';


export async function POST(_req: NextRequest, { params }: { params: { id: string, version_id: string } }) {
  try {
    const res = await fetch(`${process.env.BACKEND_URL}/api/prompt-families/${params.id}/versions/${params.version_id}/promote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data.detail || 'Failed to promote version' }, { status: res.status });
    }
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 