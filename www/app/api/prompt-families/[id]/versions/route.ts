import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = 'http://localhost:8000/api/prompt-families';

export async function GET(_req: NextRequest, context: { params: { id: string } }) {
  const { id } = context.params;
  try {
    const res = await fetch(`${BACKEND_URL}/${id}/versions`);
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch prompt versions' }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, context: { params: { id: string } }) {
  const { id } = context.params;
  try {
    const body = await req.json();
    
    // Ensure all fields are lowercase and properly formatted, with safe defaults
    const requestData = {
      family_id: Number(id),
      prompt_text: body.prompt_text?.trim() || "",
      changelog_message: body.changelog_message?.trim() || "",
      version_type: (body.version_type || "patch").toLowerCase(),  // fallback to patch if not provided
      status: (body.status || "draft").toLowerCase()               // fallback to draft if not provided
    };
    
    console.log('Sending to backend:', requestData);
    
    const res = await fetch(`${BACKEND_URL}/${id}/versions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData),
    });
    
    if (!res.ok) {
      const err = await res.json();
      console.error('Backend error:', err);  // Log the error for debugging
      return NextResponse.json({ error: err.detail || 'Failed to create prompt version' }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating version:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}