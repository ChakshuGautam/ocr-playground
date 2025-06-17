import { NextRequest, NextResponse } from 'next/server';

const baseUrl = 'http://localhost:8000'

export async function POST(req: NextRequest) {
  const backendUrl = `${baseUrl}/api/datasets`;
  const body = await req.text();

  const response = await fetch(backendUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body,
  });

  const data = await response.text();
  return new NextResponse(data, {
    status: response.status,
    headers: { 'Content-Type': 'application/json' },
  });
} 