# Gemini OCR

A Python project that uses Google's Gemini API to extract text from images.

## Setup

1. Clone this repository
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Copy `.env.example` to `.env` and add your Google API key:
   ```bash
   cp .env.example .env
   ```
4. Edit `.env` and add your Google API key:
   ```
   GOOGLE_API_KEY=your_api_key_here
   ```

## Usage

```python
from src.gemini_ocr import GeminiOCR

# Initialize the OCR client
ocr = GeminiOCR()

# Extract text from an image
result = ocr.extract_text("path/to/your/image.jpg")
print(result)
```

## Features

- Extract text from images using Google's Gemini API
- Support for various image formats
- Structured output using Pydantic models
- Error handling and retries
- Configurable timeout and other parameters

## Requirements

- Python 3.8+
- Google API key with access to Gemini API
- See `requirements.txt` for Python package dependencies
