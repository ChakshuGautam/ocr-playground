# A/B Testing Demo Guide

This guide shows how to use the integrated A/B testing system to compare different OCR prompt versions.

## Prerequisites

1. **Backend API running**: `http://localhost:8000`
2. **Frontend running**: `http://localhost:3000`
3. **At least one dataset** with images uploaded
4. **At least one prompt family** created

## Step-by-Step Demo

### 1. Create a Dataset (if you don't have one)

First, create a dataset with some handwritten images:

```bash
# Create dataset
curl -X POST "http://localhost:8000/api/datasets" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Handwritten Notes Demo",
    "description": "Sample handwritten notes for A/B testing",
    "status": "draft"
  }'
```

### 2. Upload Images to Dataset

Create a ZIP file with images and a CSV reference file:

**`reference_data.csv`:**
```csv
image_number,expected_text
note_001,"The quick brown fox jumps over the lazy dog"
note_002,"Hello world, this is a test message"
note_003,"Meeting notes: Discuss project timeline"
```

Upload via the UI or API:
```bash
curl -X POST "http://localhost:8000/api/datasets/1/upload" \
  -F "images_zip=@handwritten_notes.zip" \
  -F "reference_csv=@reference_data.csv"
```

### 3. Create a Prompt Family

```bash
curl -X POST "http://localhost:8000/api/prompt-families" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "OCR Handwriting Recognition",
    "description": "Prompts for handwritten text recognition",
    "tags": ["ocr", "handwriting", "text-recognition"]
  }'
```

### 4. Use the Frontend UI

1. **Navigate to**: `http://localhost:3000/create-test`

2. **Fill in the form**:
   - **Test Name**: `Handwriting OCR - Context vs Baseline`
   - **Description**: `Comparing baseline OCR prompt against context-aware prompt for handwritten text recognition`
   - **Hypothesis**: `Adding context awareness and pattern recognition instructions will improve OCR accuracy by 15% on handwritten text because the model will use surrounding words to disambiguate unclear characters.`
   - **Dataset**: Select your dataset from the dropdown
   - **Prompt Family**: Select your prompt family from the dropdown
x
4. **Version B (Variation)**:
   - **Label**: `Variation (Context-Aware)`
   - **Prompt**: `Transcribe the handwritten text in this image. Pay special attention to context clues and common handwriting patterns. If uncertain about a character, provide the most likely interpretation based on surrounding text.`

5. **Click "Create A/B Test"**

### 5. What Happens Behind the Scenes

The frontend will:

1. **Create Prompt Version A** via `/api/prompt-families/{id}/versions`
2. **Create Prompt Version B** via `/api/prompt-families/{id}/versions`
3. **Create Evaluation Run** via `/api/evaluation-runs` with both versions
4. **Start Background Processing** of all images with both prompts

### 6. Monitor Progress

**Check evaluation run status:**
```bash
curl "http://localhost:8000/api/evaluation-runs/1"
```

**Response during processing:**
```json
{
  "id": 1,
  "name": "Handwriting OCR - Context vs Baseline",
  "status": "processing",
  "progress_percentage": 45,
  "current_step": "Processing image note_002 with Variation (Context-Aware)",
  "created_at": "2024-01-15T10:50:00Z"
}
```

### 7. View Results

**Get comparison results:**
```bash
curl "http://localhost:8000/api/evaluation-runs/1/comparison"
```

**Example response:**
```json
{
  "evaluation_run_id": 1,
  "summary_metrics": [
    {
      "prompt_label": "Control (Baseline)",
      "avg_accuracy": 78.5,
      "total_evaluations": 3,
      "successful_evaluations": 3
    },
    {
      "prompt_label": "Variation (Context-Aware)",
      "avg_accuracy": 89.2,
      "total_evaluations": 3,
      "successful_evaluations": 3
    }
  ],
  "winner": "Variation (Context-Aware)",
  "confidence_level": 0.95,
  "statistical_significance": true
}
```

## API Endpoints Used

### Frontend → Backend Flow

1. **GET /api/datasets** → `http://localhost:8000/api/datasets`
2. **GET /api/prompt-families** → `http://localhost:8000/api/prompt-families`
3. **POST /api/prompt-families/{id}/versions** → `http://localhost:8000/api/prompt-families/{id}/versions`
4. **POST /api/evaluation-runs** → `http://localhost:8000/api/evaluation-runs`

### Key Features

- **Automatic Prompt Version Creation**: The UI creates prompt versions automatically
- **Real-time Progress Tracking**: Monitor processing status and progress
- **Statistical Analysis**: Get confidence levels and significance testing
- **Winner Determination**: Automatically identify the best performing prompt
- **Detailed Metrics**: Word-level accuracy and comparison data

## Example Use Cases

### 1. Medical Notes OCR
- **Hypothesis**: Adding medical terminology context will improve drug name recognition by 20%
- **Control**: Basic OCR prompt
- **Variation**: Medical context-aware prompt

### 2. Form Processing
- **Hypothesis**: Including field-specific instructions will improve form field accuracy by 25%
- **Control**: Generic OCR prompt
- **Variation**: Form field-aware prompt

### 3. Handwriting Style Adaptation
- **Hypothesis**: Adding handwriting style instructions will improve cursive text recognition by 30%
- **Control**: Standard handwriting prompt
- **Variation**: Cursive-aware prompt

## Troubleshooting

### Common Issues

1. **"No datasets found"**: Create a dataset first and upload images
2. **"No prompt families found"**: Create a prompt family first
3. **"Failed to create prompt version"**: Check that the prompt family ID is valid
4. **"Evaluation run failed"**: Check that the dataset has validated images

### Debug Steps

1. Check backend logs: `tail -f backend.log`
2. Check frontend console for errors
3. Verify API endpoints are accessible
4. Ensure database is properly initialized

## Next Steps

After running an A/B test:

1. **Analyze Results**: Review accuracy metrics and statistical significance
2. **Promote Winner**: Use the winning prompt version in production
3. **Iterate**: Create new variations based on insights
4. **Scale**: Run tests on larger datasets for more confidence

This integrated system provides a complete workflow for systematic prompt optimization through A/B testing. 