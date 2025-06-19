import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = 'http://localhost:8000/api/prompt-versions';

export async function PUT(req: NextRequest, { params }: { params: { version_id: string } }) {
  try {
    const body = await req.json();
    
    // Ensure all fields are properly formatted
    const requestData = {
      prompt_text: body.prompt_text?.trim(),
      changelog_message: body.changelog_message?.trim(),
      status: body.status?.toLowerCase()
    };
    
    console.log('Updating version with data:', requestData);
    
    const res = await fetch(`${BACKEND_URL}/${params.version_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData),
    });
    
    if (!res.ok) {
      const err = await res.json();
      console.error('Backend error:', err);
      return NextResponse.json({ error: err.detail || 'Failed to update prompt version' }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating version:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 