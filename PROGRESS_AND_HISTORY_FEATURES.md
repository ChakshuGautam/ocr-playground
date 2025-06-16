# Progress Tracking & History Features

## Overview

The OCR Evaluation API now includes comprehensive progress tracking, real-time status monitoring, and detailed evaluation history management based on prompt versions.

## 🔄 Progress Tracking

### Database Schema Enhancements

- **`progress_percentage`**: 0-100% completion status
- **`current_step`**: Human-readable current processing step
- **`estimated_completion`**: Predicted completion time
- **`updated_at`**: Last update timestamp

### Progress Tracking in Processing

When evaluations are created, the background processing now includes detailed progress updates:

1. **Initialization** (10%) - "Initializing OCR processing"
2. **Image Download** (30%) - "Downloading image"
3. **OCR Analysis** (60%) - "Running OCR analysis"
4. **Result Analysis** (90%) - "Analyzing results"
5. **Completion** (100%) - "Completed" or "Failed"

## 📊 API Endpoints

### Progress & Status Monitoring

```bash
# Get active/processing evaluations
GET /api/evaluations/active
# Returns: List[EvaluationProgress]

# Get specific evaluation progress
GET /api/evaluations/{evaluation_id}/progress
# Returns: EvaluationProgress

# Example Response:
{
  "evaluation_id": 1,
  "processing_status": "processing",
  "progress_percentage": 60,
  "current_step": "Running OCR analysis",
  "estimated_completion": "2025-06-16T14:15:30",
  "created_at": "2025-06-16T14:10:00",
  "updated_at": "2025-06-16T14:12:30"
}
```

### Evaluation History & Prompt Management

```bash
# Get evaluation history by prompt version
GET /api/evaluations/history?prompt_version=v1
# Returns: List[EvaluationHistory]

# Get prompt version statistics
GET /api/prompt-versions/stats
# Returns: List[PromptVersionStats]

# Example History Response:
{
  "prompt_version": "v1",
  "evaluations": [...],
  "total_count": 45,
  "avg_accuracy": 87.5,
  "prompt_template": {
    "name": "Default Hindi OCR Prompt",
    "version": "v1",
    "prompt_text": "...",
    "is_active": true
  }
}
```

## 📄 OpenAPI Documentation

### Available Formats

- **Interactive Swagger UI**: `http://localhost:8000/api/docs`
- **ReDoc Documentation**: `http://localhost:8000/api/redoc`
- **OpenAPI JSON**: `http://localhost:8000/api/openapi.json`
- **OpenAPI YAML**: `http://localhost:8000/api/openapi.yaml`

### Features

- Complete API schema documentation
- Interactive testing interface
- Request/response examples
- Authentication details
- Model schemas with validation rules

## 🔍 Prompt Version Management

### Prompt History Storage

The system now tracks:

- **All prompt templates** with versioning
- **Evaluation results** linked to specific prompt versions
- **Performance metrics** per prompt version
- **Usage statistics** and trends

### Prompt Template Features

```bash
# Create new prompt template
POST /api/prompt-templates
{
  "name": "Enhanced Hindi OCR v2",
  "version": "v2",
  "prompt_text": "Enhanced prompt...",
  "description": "Improved accuracy for handwritten text",
  "is_active": true
}

# Get active prompt template
GET /api/prompt-templates/active

# List all prompt templates
GET /api/prompt-templates
```

## 🎯 Frontend Integration Examples

### Real-time Progress Monitoring

```javascript
// Poll for active evaluations
const checkActiveEvaluations = async () => {
  const response = await fetch("/api/evaluations/active");
  const activeEvals = await response.json();

  activeEvals.forEach((eval) => {
    updateProgressBar(eval.evaluation_id, eval.progress_percentage);
    updateStatusText(eval.evaluation_id, eval.current_step);
  });
};

// Check every 2 seconds
setInterval(checkActiveEvaluations, 2000);
```

### Evaluation History Dashboard

```javascript
// Load history for comparison
const loadEvaluationHistory = async () => {
  const response = await fetch("/api/evaluations/history");
  const history = await response.json();

  history.forEach((versionData) => {
    renderVersionCard({
      version: versionData.prompt_version,
      totalEvals: versionData.total_count,
      avgAccuracy: versionData.avg_accuracy,
      recentEvals: versionData.evaluations.slice(0, 10),
    });
  });
};
```

### Prompt Performance Comparison

```javascript
// Compare prompt versions
const comparePromptVersions = async () => {
  const response = await fetch("/api/prompt-versions/stats");
  const stats = await response.json();

  const chartData = stats.map((stat) => ({
    version: stat.version,
    accuracy: stat.avg_accuracy,
    total: stat.total_evaluations,
    success_rate: (stat.successful_evaluations / stat.total_evaluations) * 100,
  }));

  renderComparisonChart(chartData);
};
```

## 📱 Frontend Components Needed

### 1. Progress Monitoring Component

- Real-time progress bars
- Status indicators
- Estimated completion times
- Error state handling

### 2. History Dashboard

- Version comparison tables
- Accuracy trend charts
- Filter by date ranges
- Export capabilities

### 3. Prompt Management Interface

- Create/edit prompt templates
- A/B testing setup
- Performance analytics
- Version activation controls

## 🚀 Usage Examples

### Create Evaluation with Progress Tracking

```bash
# Start evaluation
curl -X POST http://localhost:8000/api/evaluations \
  -H "Content-Type: application/json" \
  -d '{"image_id": 1, "prompt_version": "v2"}'

# Monitor progress
curl http://localhost:8000/api/evaluations/1/progress

# Check all active evaluations
curl http://localhost:8000/api/evaluations/active
```

### Analyze Prompt Performance

```bash
# Get version statistics
curl http://localhost:8000/api/prompt-versions/stats

# Get detailed history for specific version
curl "http://localhost:8000/api/evaluations/history?prompt_version=v2"

# Compare all versions
curl http://localhost:8000/api/evaluations/history
```

## 🔧 Benefits for Frontend Development

1. **Real-time Updates**: Users can see evaluation progress without page refreshes
2. **Historical Analysis**: Compare different prompt versions to optimize accuracy
3. **Performance Tracking**: Monitor system performance and identify bottlenecks
4. **A/B Testing**: Easy comparison between different prompt approaches
5. **User Experience**: Clear feedback on processing status and estimated completion times

## 🛠️ Technical Implementation

### WebSocket Support (Future Enhancement)

For even more real-time updates, consider adding WebSocket endpoints:

- Live progress streaming
- Instant status notifications
- Real-time collaboration features

### Caching Strategy

- Cache prompt version statistics
- Use Redis for real-time progress data
- Implement efficient database queries with proper indexing

This comprehensive progress tracking and history system provides the foundation for a sophisticated evaluation management interface with excellent user experience and powerful analytics capabilities.
