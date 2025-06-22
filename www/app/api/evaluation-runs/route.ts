import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

const BACKEND_URL = 'http://localhost:8000/api/evaluation-runs';

// Create a new evaluation run
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const payload = { ...body, user_id: userId };
    
    const res = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const error = await res.json();
      return NextResponse.json({ error: error.detail || 'Failed to create run' }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// Get all evaluation runs for the authenticated user
export async function GET(req: NextRequest) {
    try {
      const { userId } = await auth();
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
  
      const res = await fetch(`${BACKEND_URL}?user_id=${userId}`);
  
      if (!res.ok) {
        const error = await res.json();
        return NextResponse.json({ error: error.detail || 'Failed to fetch runs' }, { status: res.status });
      }
  
      const data = await res.json();
      return NextResponse.json(data);
    } catch (error) {
      return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
} 