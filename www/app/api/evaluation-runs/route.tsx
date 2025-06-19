import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { name, description, hypothesis, dataset_ids, prompt_family_id, prompt_version_a, prompt_version_b } = body

        // Needs improvement :
        const prompt_configurations = [
            {
                label: "prompt-a",
                family_id: prompt_family_id,
                version: prompt_version_a
            },
            {
                label: "prompt-b",
                family_id: prompt_family_id,
                version: prompt_version_b
            }
        ]
        // Prepare the payload for the backend API
        const payload = {
            name,
            description,
            hypothesis,
            dataset_ids,
            prompt_configurations
        }
        console.log("payload : ", payload)
        const response = await fetch('http://localhost:8000/api/evaluation-runs', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        })

        if (!response.ok) {
            const error = await response.json()
            return NextResponse.json({ error: error.detail || 'Failed to create evaluation run' }, { status: response.status })
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create evaluation run' }, { status: 500 })
    }
} 