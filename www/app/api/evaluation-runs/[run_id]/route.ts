import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest, { params }: { params: { run_id: string } }) {
    const { run_id } = params;

    if (!run_id) {
        return NextResponse.json({ error: 'Run ID is required' }, { status: 400 });
    }

    try {
        const response = await fetch(`${process.env.BACKEND_URL}/api/evaluation-runs/${run_id}`);
        
        if (!response.ok) {
            const error = await response.json();
            return NextResponse.json({ error: error.detail || 'Failed to fetch evaluation run' }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error(`Error fetching evaluation run ${run_id}:`, error);
        return NextResponse.json({ error: 'Failed to fetch evaluation run' }, { status: 500 });
    }
} 