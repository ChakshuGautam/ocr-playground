import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = 'http://localhost:8000/api/prompt-versions';

export async function POST(req: NextRequest, { params }: { params: { version_id: string } }) {
  try {
    console.log('Promoting version:', params.version_id);
    
    const res = await fetch(`${BACKEND_URL}/${params.version_id}/promote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!res.ok) {
      const err = await res.json();
      console.error('Backend error:', err);
      return NextResponse.json({ error: err.detail || 'Failed to promote prompt version' }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error promoting version:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 