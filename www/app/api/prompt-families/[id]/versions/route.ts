import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

const BACKEND_URL = 'http://localhost:8000/api/prompt-families';

export async function GET(req: NextRequest, context: { params: { id: string } }) {
  const { id } = context.params;
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const res = await fetch(`${BACKEND_URL}/${id}/versions?user_id=${userId}`);
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
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    
    const requestData = {
      ...body,
      family_id: Number(id),
      user_id: userId,
      prompt_text: body.prompt_text?.trim() || "",
      changelog_message: body.changelog_message?.trim() || "",
      version_type: (body.version_type || "patch").toLowerCase(),
      status: (body.status || "draft").toLowerCase()
    };
    
    console.log('Sending to backend:', requestData);
    
    const res = await fetch(`${BACKEND_URL}/${id}/versions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData),
    });
    
    if (!res.ok) {
      const err = await res.json();
      console.error('Backend error:', err);
      return NextResponse.json({ error: err.detail || 'Failed to create prompt version' }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating version:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}