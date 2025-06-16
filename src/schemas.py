from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# Base schemas
class WordEvaluationBase(BaseModel):
    reference_word: str
    transcribed_word: Optional[str] = None
    match: bool
    reason_diff: str
    word_position: int

class WordEvaluationCreate(WordEvaluationBase):
    pass

class WordEvaluation(WordEvaluationBase):
    id: int
    evaluation_id: int
    
    class Config:
        from_attributes = True

# Image schemas
class ImageBase(BaseModel):
    number: str
    url: str
    local_path: Optional[str] = None
    reference_text: str

class ImageCreate(ImageBase):
    pass

class ImageUpdate(BaseModel):
    reference_text: Optional[str] = None
    url: Optional[str] = None
    local_path: Optional[str] = None

class Image(ImageBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class ImageWithEvaluations(Image):
    evaluations: List['Evaluation'] = []

# Evaluation schemas
class EvaluationBase(BaseModel):
    prompt_version: str = "v1"
    ocr_output: Optional[str] = None
    accuracy: Optional[float] = None
    correct_words: Optional[int] = None
    total_words: Optional[int] = None
    processing_status: str = "pending"
    error_message: Optional[str] = None
    progress_percentage: Optional[int] = 0
    current_step: Optional[str] = None
    estimated_completion: Optional[datetime] = None

class EvaluationCreate(BaseModel):
    image_id: int
    prompt_version: str = "v1"
    force_reprocess: bool = False  # Force reprocessing even if already processed

class EvaluationUpdate(BaseModel):
    ocr_output: Optional[str] = None
    accuracy: Optional[float] = None
    correct_words: Optional[int] = None
    total_words: Optional[int] = None
    processing_status: Optional[str] = None
    error_message: Optional[str] = None
    word_evaluations: Optional[List[WordEvaluationCreate]] = None

class Evaluation(EvaluationBase):
    id: int
    image_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class EvaluationWithDetails(Evaluation):
    image: Image
    word_evaluations: List[WordEvaluation] = []

# Prompt Template schemas
class PromptTemplateBase(BaseModel):
    name: str
    version: str
    prompt_text: str
    description: Optional[str] = None
    is_active: bool = False

class PromptTemplateCreate(PromptTemplateBase):
    pass

class PromptTemplateUpdate(BaseModel):
    prompt_text: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class PromptTemplate(PromptTemplateBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# CSV Import schemas
class CSVImportRequest(BaseModel):
    file_path: Optional[str] = None  # If file is already uploaded
    overwrite_existing: bool = False

class CSVImportResponse(BaseModel):
    imported_count: int
    updated_count: int
    errors: List[str] = []
    message: str

# Statistics schemas
class EvaluationStats(BaseModel):
    total_images: int
    total_evaluations: int
    pending_evaluations: int
    successful_evaluations: int
    failed_evaluations: int
    average_accuracy: Optional[float] = None
    accuracy_by_prompt_version: Dict[str, float] = {}

class AccuracyDistribution(BaseModel):
    high_accuracy: int  # >= 90%
    medium_accuracy: int  # 70-89%
    low_accuracy: int  # < 70%
    total_processed: int

# Batch processing schemas
class BatchProcessRequest(BaseModel):
    image_ids: List[int]
    prompt_version: str = "v1"
    force_reprocess: bool = False

class BatchProcessResponse(BaseModel):
    queued_count: int
    message: str
    job_id: Optional[str] = None  # For future job tracking

# Search and filter schemas
class ImageFilter(BaseModel):
    has_evaluations: Optional[bool] = None
    processing_status: Optional[str] = None
    prompt_version: Optional[str] = None
    accuracy_min: Optional[float] = None
    accuracy_max: Optional[float] = None
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None

class PaginationParams(BaseModel):
    skip: int = Field(0, ge=0)
    limit: int = Field(100, ge=1, le=1000)

class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    skip: int
    limit: int
    has_more: bool
    
    class Config:
        from_attributes = True

class PaginatedImagesResponse(BaseModel):
    items: List[Image]
    total: int
    skip: int
    limit: int
    has_more: bool

class PaginatedEvaluationsResponse(BaseModel):
    items: List[Evaluation]
    total: int
    skip: int
    limit: int
    has_more: bool

# Progress and Status schemas
class EvaluationProgress(BaseModel):
    evaluation_id: int
    processing_status: str
    progress_percentage: int
    current_step: Optional[str] = None
    estimated_completion: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

class EvaluationHistory(BaseModel):
    prompt_version: str
    evaluations: List[Evaluation]
    total_count: int
    avg_accuracy: Optional[float] = None
    prompt_template: Optional[PromptTemplate] = None

class PromptVersionStats(BaseModel):
    version: str
    total_evaluations: int
    successful_evaluations: int
    avg_accuracy: Optional[float] = None
    created_at: datetime
    latest_evaluation: Optional[datetime] = None 