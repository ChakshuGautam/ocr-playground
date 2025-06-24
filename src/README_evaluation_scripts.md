# CSV Evaluation Scripts

This directory contains scripts to process CSV data and run OCR evaluations using the Gemini OCR system.

## Files

- `process_csv_evaluations.py` - Main script for processing CSV data and running evaluations
- `run_evaluation_example.py` - Example script showing how to use the processor
- `README_evaluation_scripts.md` - This documentation file

## Prerequisites

1. **Google API Key**: Set your `GOOGLE_API_KEY` environment variable
   ```bash
   export GOOGLE_API_KEY="your_api_key_here"
   ```

2. **Dependencies**: Make sure you have all required packages installed
   ```bash
   pip install google-genai pillow python-dotenv requests
   ```

3. **CSV File**: Place your CSV file (e.g., `dummy_csv_data.csv`) in the same directory

## CSV Format

The CSV file should have the following columns:
- `#` - Image number/ID
- `Link` - URL of the image
- `Text` - Reference text (original text to be written)
- `Human Evaluation Text` - Ground truth text (what was actually written)

Example:
```csv
#,Link,Text,Human Evaluation Text
1,https://example.com/image1.jpg,"हर पल","हर पल"
2,https://example.com/image2.jpg,"लड़ाई","लड़ई"
```

## Usage

### Option 1: Using the Example Script

```bash
cd src
python run_evaluation_example.py
```

### Option 2: Using the Main Script Directly

```python
from process_csv_evaluations import CSVEvaluationProcessor

# Create processor
processor = CSVEvaluationProcessor("dummy_csv_data.csv", "evaluation_results")

# Run evaluation
stats = processor.process_csv()
print(f"Average accuracy: {stats['average_accuracy']:.2f}%")
```

## How It Works

1. **Image Download**: The script downloads each image from the URL in the CSV
2. **OCR Processing**: Uses Gemini OCR to extract and evaluate text from the downloaded image
3. **Result Generation**: Creates detailed evaluation results for each image
4. **Statistics**: Compiles overall statistics across all processed images

## Output

The scripts will create:

1. **Individual JSON files**: One for each image (e.g., `image_1.json`, `image_2.json`)
2. **Overall statistics**: `result.json` with summary statistics

### Individual JSON Format

Each image JSON file contains:
```json
{
  "image_info": {
    "number": "1",
    "url": "https://example.com/image1.jpg",
    "reference_text": "हर पल",
    "human_evaluation_text": "हर पल",
    "timestamp": "20250617_084457"
  },
  "evaluation": {
    "full_text": "हर पल",
    "word_evaluations": [
      {
        "reference_word": "हर",
        "transcribed_word": "हर",
        "match": true,
        "reason_diff": "Exact match."
      },
      {
        "reference_word": "पल",
        "transcribed_word": "पल",
        "match": true,
        "reason_diff": "Exact match."
      }
    ],
    "metrics": {
      "total_words": 2,
      "correct_words": 2,
      "accuracy": 100.0
    }
  }
}
```

### Overall Statistics Format

The `result.json` file contains:
```json
{
  "total_images": 5,
  "successful_evaluations": 5,
  "failed_evaluations": 0,
  "total_words": 25,
  "total_correct_words": 20,
  "average_accuracy": 80.0,
  "processing_timestamp": "20250617_084457",
  "individual_results": [
    {
      "image_number": "1",
      "accuracy": 100.0,
      "total_words": 2,
      "correct_words": 2
    }
  ]
}
```

## Error Handling

The scripts include comprehensive error handling:
- Missing CSV files
- Invalid image URLs
- Network connection issues
- Image download failures
- API errors
- Missing required data

All errors are logged and the script continues processing other images.

## Customization

You can customize the script by modifying:
- Output directory name
- CSV file path
- Logging level
- Error handling behavior
- Download timeout settings

## Troubleshooting

1. **API Key Error**: Make sure `GOOGLE_API_KEY` is set correctly
2. **CSV Not Found**: Check the file path and ensure the CSV exists
3. **Network Errors**: Check your internet connection for image URLs
4. **Download Timeouts**: Increase timeout in `_download_image` method if needed
5. **Memory Issues**: For large CSV files, consider processing in batches
6. **Image Format Issues**: Ensure images are in supported formats (JPEG, PNG, etc.)

## Example Output

```
Starting CSV evaluation processing...
CSV file: dummy_csv_data.csv
Output directory: evaluation_results
--------------------------------------------------
2024-01-17 10:30:15 - INFO - Gemini OCR initialized successfully
2024-01-17 10:30:15 - INFO - Processing row 1: Image 1
2024-01-17 10:30:16 - INFO - Downloading image 1 from URL...
2024-01-17 10:30:17 - INFO - Running OCR evaluation for image 1...
2024-01-17 10:30:20 - INFO - Image 1 processed successfully. Accuracy: 100.00%
...

============================================================
EVALUATION SUMMARY
============================================================
Total Images Processed: 5
Successful Evaluations: 5
Failed Evaluations: 0
Total Words: 25
Total Correct Words: 20
Average Accuracy: 80.00%
Processing Timestamp: 20250617_103015
Results saved in: evaluation_results/

Individual Results:
----------------------------------------
Image 1: Accuracy: 100.00% (2/2 words correct)
Image 2: Accuracy: 50.00% (1/2 words correct)
...

============================================================
Processing completed successfully! 