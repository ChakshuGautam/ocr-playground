# OCR Evaluation API

A FastAPI-based backend for managing OCR evaluations of handwritten Hindi text using Google Gemini AI.

## Features

- **SQLite Database**: Stores images, evaluations, word-level analysis, and prompt templates
- **Async Processing**: Background processing of OCR evaluations
- **REST API**: Complete CRUD operations for all entities
- **CSV Import**: Import image data from CSV files
- **Statistics**: Track accuracy and performance metrics
- **Prompt Management**: Create and manage different prompt templates

## Setup

### 1. Install Dependencies

```bash
pip install fastapi uvicorn sqlalchemy aiosqlite pydantic python-multipart aiohttp
```

### 2. Initialize Database and Import Data

```bash
# Import CSV data into database
python scripts/import_csv.py

# Set up default prompt template
python scripts/setup_prompt.py
```

### 3. Start the API Server

```bash
python main.py
```

The API will be available at `http://localhost:8000`

## API Endpoints

### Health Check

- `GET /health` - Health check endpoint

### Images

- `GET /api/images` - List images with pagination and filters
- `GET /api/images/{image_id}` - Get specific image with evaluations
- `POST /api/images` - Create new image
- `PUT /api/images/{image_id}` - Update image
- `DELETE /api/images/{image_id}` - Delete image

### Evaluations

- `GET /api/evaluations` - List evaluations with pagination
- `GET /api/evaluations/{evaluation_id}` - Get specific evaluation with details
- `POST /api/evaluations` - Create new evaluation (triggers background processing)
- `POST /api/evaluations/batch` - Batch create evaluations

### Prompt Templates

- `GET /api/prompt-templates` - List all prompt templates
- `GET /api/prompt-templates/active` - Get active prompt template
- `POST /api/prompt-templates` - Create new prompt template

### Statistics

- `GET /api/stats/evaluations` - Get evaluation statistics
- `GET /api/stats/accuracy-distribution` - Get accuracy distribution

### CSV Import

- `POST /api/import/csv` - Upload and import CSV file
- `POST /api/import/csv/file-path` - Import from local file path

## API Documentation

Visit `http://localhost:8000/docs` for interactive API documentation (Swagger UI).

## Database Schema

### Images

- ID, number, URL, local_path, reference_text
- Timestamps for creation and updates
- One-to-many relationship with evaluations

### Evaluations

- ID, image_id, prompt_version, OCR output, accuracy metrics
- Processing status (pending, processing, success, failed)
- Error messages for failed processing
- JSON storage for word evaluations

### Word Evaluations

- Individual word comparisons
- Match status, position, and diff reasons

### Prompt Templates

- Template management with versioning
- Active template selection

## Usage Examples

### Create an Evaluation

```bash
curl -X POST http://localhost:8000/api/evaluations \
  -H "Content-Type: application/json" \
  -d '{"image_id": 1, "prompt_version": "v1"}'
```

### Get Images with Filters

```bash
curl "http://localhost:8000/api/images?has_evaluations=true&limit=5"
```

### Import CSV Data

```bash
curl -X POST http://localhost:8000/api/import/csv/file-path \
  -H "Content-Type: application/json" \
  -d '{"file_path": "images.csv", "overwrite_existing": true}'
```

## Configuration

### Environment Variables

- Set `GEMINI_API_KEY` for OCR processing functionality
- Configure other Gemini API settings in `src/gemini_ocr.py`

### Database

- SQLite database file: `ocr_evaluations.db`
- Automatically created on first startup

## Error Handling

- All endpoints include proper error handling with HTTP status codes
- Background processing errors are captured and stored in evaluation records
- Retry logic for transient failures during OCR processing

## CORS

The API includes CORS middleware configured for local development:

- Allowed origins: `http://localhost:3000`, `http://localhost:5173`
- Supports all methods and headers

## Development

### Running Tests

Create evaluation tests and run background processing tests.

### Adding New Endpoints

Follow the existing patterns in `src/api.py` for consistent API design.

### Database Migrations

Currently using SQLAlchemy's `create_all()` for schema creation. For production, implement proper migrations
