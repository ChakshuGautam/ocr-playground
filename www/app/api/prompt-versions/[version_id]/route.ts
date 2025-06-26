import { NextRequest, NextResponse } from 'next/server';

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
    
    const res = await fetch(`${process.env.BACKEND_URL}/api/prompt-versions/${params.version_id}`, {
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

export async function PATCH(req: NextRequest, { params }: { params: { version_id: string } }) {
  try {
    const body = await req.json();
    // Expecting { issues: [...] }
    if (!Array.isArray(body.issues)) {
      return NextResponse.json({ error: 'Invalid issues format' }, { status: 400 });
    }
    const res = await fetch(`${process.env.BACKEND_URL}/api/prompt-versions/${params.version_id}/issues`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body.issues),
    });
    if (!res.ok) {
      const err = await res.json();
      console.error('Backend error:', err);
      return NextResponse.json({ error: err.detail || 'Failed to update issues' }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating issues:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 