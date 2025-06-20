import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { name, description, hypothesis, dataset_ids, prompt_configurations } = body

        // Validate required fields
        if (!name || !description || !hypothesis || !dataset_ids || !prompt_configurations) {
            return NextResponse.json({ 
                error: 'Missing required fields: name, description, hypothesis, dataset_ids, prompt_configurations' 
            }, { status: 400 })
        }

        console.log("payload : ", body)
        
        const response = await fetch('http://localhost:8000/api/evaluation-runs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        })

        if (!response.ok) {
            const error = await response.json()
            return NextResponse.json({ error: error.detail || 'Failed to create evaluation run' }, { status: response.status })
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error) {
        console.error('Error creating evaluation run:', error)
        return NextResponse.json({ error: 'Failed to create evaluation run' }, { status: 500 })
    }
}

export async function GET(request: NextRequest) {
    try {
        const response = await fetch('http://localhost:8000/api/evaluation-runs', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })

        if (!response.ok) {
            const error = await response.json()
            return NextResponse.json({ error: error.detail || 'Failed to fetch evaluation runs' }, { status: response.status })
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error) {
        console.error('Error fetching evaluation runs:', error)
        return NextResponse.json({ error: 'Failed to fetch evaluation runs' }, { status: 500 })
    }
} 