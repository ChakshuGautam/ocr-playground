import { NextRequest, NextResponse } from 'next/server';

const baseUrl = 'http://localhost:8000'

// create a new dataset
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const response = await fetch('http://localhost:8000/api/datasets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json({ error: error.detail }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create dataset' }, { status: 500 });
  }
}

// Get all datasets
export async function GET() {
  try {
    const response = await fetch('http://localhost:8000/api/datasets');
    
    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json({ error: error.detail }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch datasets' }, { status: 500 });
  }
} 