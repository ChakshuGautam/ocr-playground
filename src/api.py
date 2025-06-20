from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Query, BackgroundTasks, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
import asyncio
import os
import json
import shutil
import tempfile
from pathlib import Path
from datetime import datetime
import logging

from .database import get_db, init_db, EvaluationRun, async_session
from .schemas import (
    Image, ImageCreate, ImageUpdate, ImageWithEvaluations,
    Evaluation, EvaluationCreate, EvaluationUpdate, EvaluationWithDetails,
    PromptTemplate, PromptTemplateCreate, PromptTemplateUpdate,
    CSVImportRequest, CSVImportResponse,
    EvaluationStats, AccuracyDistribution,
    BatchProcessRequest, BatchProcessResponse,
    ImageFilter, PaginationParams, PaginatedResponse,
    PaginatedImagesResponse, PaginatedEvaluationsResponse,
    EvaluationProgress, EvaluationHistory, PromptVersionStats,
    Dataset, DatasetCreate, DatasetUpdate, DatasetWithImages,
    PromptFamily, PromptFamilyCreate, PromptFamilyWithVersions,
    PromptVersion, PromptVersionCreate, PromptVersionUpdate,
    EvaluationRun, EvaluationRunCreate, EvaluationRunUpdate, EvaluationRunWithDetails,
    ComparisonResults, LiveProgressUpdate, PerformanceTrend,
    APIKey, APIKeyCreate, APIUsageStats,
    ProcessingStatus, DatasetStatus, PromptStatus
)
from . import crud
from .orchestrator import OcrOrchestrator

app = FastAPI(
    title="OCR Evaluation API",
    description="API for managing OCR evaluations and handwritten text analysis",
    version="1.0.0",
    openapi_url="/api/openapi.json",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React/Vite dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize OCR orchestrator lazily
ocr_orchestrator = None

def get_ocr_orchestrator():
    """Get OCR orchestrator instance, creating it if needed"""
    global ocr_orchestrator
    if ocr_orchestrator is None:
        ocr_orchestrator = OcrOrchestrator()
    return ocr_orchestrator

# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    await init_db()
    print("Database initialized")

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "OCR Evaluation API is running"}

# OpenAPI spec endpoints
@app.get("/api/openapi.yaml")
async def get_openapi_yaml():
    """Get OpenAPI specification in YAML format"""
    import yaml
    from fastapi.openapi.utils import get_openapi
    
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    
    from fastapi.responses import Response
    yaml_content = yaml.dump(openapi_schema, default_flow_style=False)
    return Response(content=yaml_content, media_type="application/x-yaml")

# Image endpoints
@app.get("/api/images", response_model=PaginatedImagesResponse)
async def get_images(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    has_evaluations: Optional[bool] = Query(None),
    processing_status: Optional[str] = Query(None),
    prompt_version: Optional[str] = Query(None),
    accuracy_min: Optional[float] = Query(None, ge=0, le=100),
    accuracy_max: Optional[float] = Query(None, ge=0, le=100),
    db: AsyncSession = Depends(get_db)
):
    """Get paginated list of images with optional filters"""
    filters = ImageFilter(
        has_evaluations=has_evaluations,
        processing_status=processing_status,
        prompt_version=prompt_version,
        accuracy_min=accuracy_min,
        accuracy_max=accuracy_max
    )
    pagination = PaginationParams(skip=skip, limit=limit)
    
    images, total = await crud.get_images(db, filters, pagination)
    
    return PaginatedImagesResponse(
        items=images,
        total=total,
        skip=skip,
        limit=limit,
        has_more=skip + limit < total
    )

@app.get("/api/images/{image_id}", response_model=ImageWithEvaluations)
async def get_image(image_id: int, db: AsyncSession = Depends(get_db)):
    """Get a specific image with its evaluations"""
    image = await crud.get_image(db, image_id)
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    return image

@app.post("/api/images", response_model=Image)
async def create_image(image: ImageCreate, db: AsyncSession = Depends(get_db)):
    """Create a new image"""
    # Check if image with this number already exists
    existing = await crud.get_image_by_number(db, image.number)
    if existing:
        raise HTTPException(status_code=400, detail="Image with this number already exists")
    
    return await crud.create_image(db, image)

@app.put("/api/images/{image_id}", response_model=Image)
async def update_image(
    image_id: int, 
    image_update: ImageUpdate, 
    db: AsyncSession = Depends(get_db)
):
    """Update an existing image"""
    image = await crud.update_image(db, image_id, image_update)
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    return image

@app.delete("/api/images/{image_id}")
async def delete_image(image_id: int, db: AsyncSession = Depends(get_db)):
    """Delete an image and all its evaluations"""
    success = await crud.delete_image(db, image_id)
    if not success:
        raise HTTPException(status_code=404, detail="Image not found")
    return {"message": "Image deleted successfully"}

@app.post("/api/images/import-csv", response_model=CSVImportResponse)
async def import_images_csv(
    file: UploadFile = File(...),
    overwrite_existing: bool = Query(False),
    db: AsyncSession = Depends(get_db)
):
    """Import images from CSV file"""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    # Create a temporary file with proper extension
    with tempfile.NamedTemporaryFile(delete=False, suffix='.csv') as temp_file:
        # Save uploaded file temporarily
        shutil.copyfileobj(file.file, temp_file)
        temp_path = temp_file.name
    
    try:
        # Import data
        result = await crud.import_csv_data(db, temp_path, overwrite_existing)
        return CSVImportResponse(**result)
    finally:
        # Clean up temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.post("/api/images/{dataset_id}/import-csv", response_model=CSVImportResponse)
async def import_images_csv_to_dataset(
    dataset_id: int,
    file: UploadFile = File(...),
    overwrite_existing: bool = Query(False),
    db: AsyncSession = Depends(get_db)
):
    """Import images from CSV file and associate them with a dataset"""
    logging.info(f"Hit /api/images/{dataset_id}/import-csv with dataset_id={dataset_id}")
    # First check if dataset exists
    dataset = await crud.get_dataset(db, dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    # Create a temporary file with proper extension
    with tempfile.NamedTemporaryFile(delete=False, suffix='.csv') as temp_file:
        # Save uploaded file temporarily
        shutil.copyfileobj(file.file, temp_file)
        temp_path = temp_file.name
    
    try:
        # Import data
        result = await crud.import_csv_data_into_dataset(db, temp_path, dataset_id, overwrite_existing)
        return CSVImportResponse(**result)
    finally:
        # Clean up temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.get("/api/images/export-csv")
async def export_images_csv(db: AsyncSession = Depends(get_db)):
    """Export images to CSV format"""
    import pandas as pd
    from io import StringIO
    from fastapi.responses import StreamingResponse
    
    # Get all images with their latest evaluations
    images = await crud.get_all_images_with_evaluations(db)
    
    # Convert to CSV format
    csv_data = []
    for image in images:
        latest_eval = image.evaluations[0] if image.evaluations else None
        
        row = {
            '#': image.id,
            'Link': image.file_path,
            'Text': image.expected_text,
            'Correctness': '',  # This would need to be populated based on your needs
            'OCR Output (Gemini - Flash)': latest_eval.ocr_output if latest_eval else '',
            'OCR Output with Text Priming (Gemini - Flash)': ''  # Additional field if needed
        }
        csv_data.append(row)
    
    # Create DataFrame and convert to CSV
    df = pd.DataFrame(csv_data)
    
    # Create StringIO buffer
    buffer = StringIO()
    df.to_csv(buffer, index=False)
    buffer.seek(0)
    
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=images_export.csv"}
    )

# Evaluation endpoints
@app.get("/api/evaluations", response_model=PaginatedEvaluationsResponse)
async def get_evaluations(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    image_id: Optional[int] = Query(None),
    prompt_version: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """Get paginated list of evaluations"""
    pagination = PaginationParams(skip=skip, limit=limit)
    evaluations, total = await crud.get_evaluations(db, image_id, prompt_version, pagination)
    
    return PaginatedEvaluationsResponse(
        items=evaluations,
        total=total,
        skip=skip,
        limit=limit,
        has_more=skip + limit < total
    )

# Specific routes must come before parameterized routes
@app.get("/api/evaluations/active", response_model=List[EvaluationProgress])
async def get_active_evaluations(db: AsyncSession = Depends(get_db)):
    """Get all currently processing evaluations"""
    from sqlalchemy import or_
    from sqlalchemy.future import select
    
    result = await db.execute(
        select(crud.Evaluation).where(
            or_(
                crud.Evaluation.processing_status == "pending",
                crud.Evaluation.processing_status == "processing"
            )
        )
    )
    
    active_evaluations = result.scalars().all()
    
    return [
        EvaluationProgress(
            evaluation_id=eval.id,
            processing_status=eval.processing_status,
            progress_percentage=eval.progress_percentage or 0,
            current_step=eval.current_step,
            estimated_completion=eval.estimated_completion,
            created_at=eval.created_at,
            updated_at=eval.updated_at
        )
        for eval in active_evaluations
    ]

@app.get("/api/evaluations/history", response_model=List[EvaluationHistory])
async def get_evaluation_history(
    prompt_version: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """Get evaluation history grouped by prompt version"""
    from sqlalchemy import func
    from sqlalchemy.future import select
    
    # Get all prompt versions with their evaluations
    if prompt_version:
        # Filter by specific prompt version
        versions_query = select(crud.Evaluation.prompt_version).where(
            crud.Evaluation.prompt_version == prompt_version
        ).distinct()
    else:
        # Get all versions
        versions_query = select(crud.Evaluation.prompt_version).distinct()
    
    versions_result = await db.execute(versions_query)
    versions = [v[0] for v in versions_result.fetchall()]
    
    history = []
    for version in versions:
        # Get evaluations for this version
        evaluations, _ = await crud.get_evaluations(
            db, 
            prompt_version=version,
            pagination=crud.PaginationParams(skip=0, limit=1000)
        )
        
        # Calculate average accuracy
        successful_evals = [e for e in evaluations if e.processing_status == "success" and e.accuracy]
        avg_accuracy = None
        if successful_evals:
            avg_accuracy = sum(e.accuracy for e in successful_evals) / len(successful_evals)
        
        # Get prompt template if it exists
        prompt_template = None
        templates = await crud.get_prompt_templates(db)
        for template in templates:
            if template.version == version:
                prompt_template = template
                break
        
        history.append(EvaluationHistory(
            prompt_version=version,
            evaluations=evaluations[:50],  # Limit to recent 50
            total_count=len(evaluations),
            avg_accuracy=avg_accuracy,
            prompt_template=prompt_template
        ))
    
    return history

@app.get("/api/evaluations/{evaluation_id}", response_model=EvaluationWithDetails)
async def get_evaluation(evaluation_id: int, db: AsyncSession = Depends(get_db)):
    """Get a specific evaluation with full details"""
    evaluation = await crud.get_evaluation(db, evaluation_id)
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found")
    return evaluation

@app.post("/api/evaluations", response_model=Evaluation)
async def create_evaluation(
    evaluation: EvaluationCreate, 
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """Create a new evaluation and queue it for processing"""
    # Verify image exists
    image = await crud.get_image(db, evaluation.image_id)
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    # Create evaluation record
    db_evaluation = await crud.create_evaluation(db, evaluation)
    
    # Queue background processing
    background_tasks.add_task(process_evaluation_background, db_evaluation.id)
    
    return db_evaluation

@app.post("/api/evaluations/batch", response_model=BatchProcessResponse)
async def batch_process_evaluations(
    request: BatchProcessRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """Create and process multiple evaluations"""
    queued_count = 0
    
    for image_id in request.image_ids:
        # Verify image exists
        image = await crud.get_image(db, image_id)
        if not image:
            continue
        
        # Create evaluation
        evaluation_create = EvaluationCreate(
            image_id=image_id,
            prompt_version=request.prompt_version,
            force_reprocess=request.force_reprocess
        )
        
        try:
            db_evaluation = await crud.create_evaluation(db, evaluation_create)
            background_tasks.add_task(process_evaluation_background, db_evaluation.id)
            queued_count += 1
        except Exception:
            continue
    
    return BatchProcessResponse(
        queued_count=queued_count,
        message=f"Queued {queued_count} evaluations for processing"
    )

# Progress and Status endpoints

@app.get("/api/evaluations/{evaluation_id}/progress", response_model=EvaluationProgress)
async def get_evaluation_progress(evaluation_id: int, db: AsyncSession = Depends(get_db)):
    """Get real-time progress of an evaluation"""
    evaluation = await crud.get_evaluation(db, evaluation_id)
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found")
    
    return EvaluationProgress(
        evaluation_id=evaluation.id,
        processing_status=evaluation.processing_status,
        progress_percentage=evaluation.progress_percentage or 0,
        current_step=evaluation.current_step,
        estimated_completion=evaluation.estimated_completion,
        created_at=evaluation.created_at,
        updated_at=evaluation.updated_at
    )

# History and Prompt Version endpoints

@app.get("/api/prompt-versions/stats", response_model=List[PromptVersionStats])
async def get_prompt_version_stats(db: AsyncSession = Depends(get_db)):
    """Get statistics for each prompt version"""
    from sqlalchemy import func
    from sqlalchemy.future import select
    
    # Get stats by prompt version
    stats_query = select(
        crud.Evaluation.prompt_version,
        func.count(crud.Evaluation.id).label('total'),
        func.count(crud.Evaluation.id).filter(crud.Evaluation.processing_status == 'success').label('successful'),
        func.avg(crud.Evaluation.accuracy).filter(crud.Evaluation.processing_status == 'success').label('avg_accuracy'),
        func.min(crud.Evaluation.created_at).label('created_at'),
        func.max(crud.Evaluation.created_at).label('latest_evaluation')
    ).group_by(crud.Evaluation.prompt_version)
    
    stats_result = await db.execute(stats_query)
    stats_data = stats_result.fetchall()
    
    return [
        PromptVersionStats(
            version=row.prompt_version,
            total_evaluations=row.total,
            successful_evaluations=row.successful or 0,
            avg_accuracy=float(row.avg_accuracy) if row.avg_accuracy else None,
            created_at=row.created_at,
            latest_evaluation=row.latest_evaluation
        )
        for row in stats_data
    ]

# Prompt Template endpoints
@app.get("/api/prompt-templates", response_model=List[PromptTemplate])
async def get_prompt_templates(db: AsyncSession = Depends(get_db)):
    """Get all prompt templates"""
    return await crud.get_prompt_templates(db)

@app.get("/api/prompt-templates/active", response_model=PromptTemplate)
async def get_active_prompt_template(db: AsyncSession = Depends(get_db)):
    """Get the currently active prompt template"""
    template = await crud.get_active_prompt_template(db)
    if not template:
        raise HTTPException(status_code=404, detail="No active prompt template found")
    return template

@app.post("/api/prompt-templates", response_model=PromptTemplate)
async def create_prompt_template(
    template: PromptTemplateCreate, 
    db: AsyncSession = Depends(get_db)
):
    """Create a new prompt template"""
    return await crud.create_prompt_template(db, template)

@app.put("/api/prompt-templates/{template_id}", response_model=PromptTemplate)
async def update_prompt_template(
    template_id: int,
    template_update: PromptTemplateUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a prompt template"""
    # Implementation would be similar to image update
    # For now, just return error
    raise HTTPException(status_code=501, detail="Not implemented yet")

# CSV Import endpoints
@app.post("/api/import/csv", response_model=CSVImportResponse)
async def import_csv_file(
    file: UploadFile = File(...),
    overwrite_existing: bool = Query(False),
    db: AsyncSession = Depends(get_db)
):
    """Import images from CSV file"""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    # Create a temporary file with proper extension
    with tempfile.NamedTemporaryFile(delete=False, suffix='.csv') as temp_file:
        # Save uploaded file temporarily
        shutil.copyfileobj(file.file, temp_file)
        temp_path = temp_file.name
    
    try:
        # Import data
        result = await crud.import_csv_data(db, temp_path, overwrite_existing)
        return CSVImportResponse(**result)
    finally:
        # Clean up temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.post("/api/import/csv/file-path", response_model=CSVImportResponse)
async def import_csv_from_path(
    request: CSVImportRequest,
    db: AsyncSession = Depends(get_db)
):
    """Import images from CSV file path"""
    if not request.file_path:
        # Default to the existing CSV file
        request.file_path = "images.csv"
    
    if not os.path.exists(request.file_path):
        raise HTTPException(status_code=404, detail="CSV file not found")
    
    result = await crud.import_csv_data(db, request.file_path, request.overwrite_existing)
    return CSVImportResponse(**result)

# Statistics endpoints
@app.get("/api/stats/evaluations", response_model=EvaluationStats)
async def get_evaluation_statistics(db: AsyncSession = Depends(get_db)):
    """Get evaluation statistics"""
    stats = await crud.get_evaluation_stats(db)
    return EvaluationStats(**stats)

@app.get("/api/stats/accuracy-distribution", response_model=AccuracyDistribution)
async def get_accuracy_distribution(db: AsyncSession = Depends(get_db)):
    """Get accuracy distribution"""
    distribution = await crud.get_accuracy_distribution(db)
    return AccuracyDistribution(**distribution)

# File serving for images
@app.get("/api/images/{image_id}/file")
async def get_image_file(image_id: int, db: AsyncSession = Depends(get_db)):
    """Serve the actual image file"""
    image = await crud.get_image(db, image_id)
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    if not image.local_path or not os.path.exists(image.local_path):
        raise HTTPException(status_code=404, detail="Image file not found")
    
    from fastapi.responses import FileResponse
    return FileResponse(image.local_path)

# Background task functions
async def process_evaluation_background(evaluation_id: int):
    """Background task to process an evaluation"""
    from .database import async_session
    
    async with async_session() as db:
        try:
            evaluation = await crud.get_evaluation(db, evaluation_id)
            if not evaluation:
                return
            
            # Update status to processing with progress
            await crud.update_evaluation(
                db, 
                evaluation_id, 
                crud.EvaluationUpdate(
                    processing_status="processing",
                    progress_percentage=10,
                    current_step="Initializing OCR processing"
                )
            )
            
            # Update progress: downloading image
            await crud.update_evaluation(
                db, 
                evaluation_id, 
                crud.EvaluationUpdate(
                    progress_percentage=30,
                    current_step="Downloading image"
                )
            )
            
            # Process the evaluation using OCR orchestrator
            orchestrator = get_ocr_orchestrator()
            
            # Update progress: running OCR
            await crud.update_evaluation(
                db, 
                evaluation_id, 
                crud.EvaluationUpdate(
                    progress_percentage=60,
                    current_step="Running OCR analysis"
                )
            )
            
            result = await orchestrator.process_single_evaluation(
                evaluation.image.url,
                evaluation.image.reference_text,
                evaluation.image.number
            )
            
            # Update progress: analyzing results
            await crud.update_evaluation(
                db, 
                evaluation_id, 
                crud.EvaluationUpdate(
                    progress_percentage=90,
                    current_step="Analyzing results"
                )
            )
            
            if result.get('success'):
                # Update evaluation with results
                word_evaluations = []
                evaluation_data = result.get('evaluation', {})
                
                for word_eval in evaluation_data.get('word_evaluations', []):
                    word_evaluations.append(crud.WordEvaluationCreate(
                        reference_word=word_eval.get('reference_word', ''),
                        transcribed_word=word_eval.get('transcribed_word'),
                        match=word_eval.get('match', False),
                        reason_diff=word_eval.get('reason_diff', ''),
                        word_position=word_eval.get('word_position', 0)
                    ))
                
                update_data = crud.EvaluationUpdate(
                    ocr_output=evaluation_data.get('full_text', ''),
                    accuracy=evaluation_data.get('accuracy', 0),
                    correct_words=evaluation_data.get('correct_words', 0),
                    total_words=evaluation_data.get('total_words', 0),
                    processing_status="success",
                    progress_percentage=100,
                    current_step="Completed",
                    word_evaluations=word_evaluations
                )
                
                await crud.update_evaluation(db, evaluation_id, update_data)
            else:
                # Update with error
                await crud.update_evaluation(
                    db,
                    evaluation_id,
                    crud.EvaluationUpdate(
                        processing_status="failed",
                        progress_percentage=0,
                        current_step="Failed",
                        error_message=result.get('error', 'Unknown error')
                    )
                )
        
        except Exception as e:
            # Update with error
            await crud.update_evaluation(
                db,
                evaluation_id,
                crud.EvaluationUpdate(
                    processing_status="failed",
                    progress_percentage=0,
                    current_step="Failed",
                    error_message=str(e)
                )
            )

async def process_evaluation_run_background(run_id: int):
    """Background task to process an evaluation run (A/B test)"""
    from .database import async_session
    from sqlalchemy import update
    
    async with async_session() as db:
        try:
            # Get the evaluation run
            evaluation_run = await crud.get_evaluation_run(db, run_id)
            if not evaluation_run:
                return
            
            # Update run status to processing
            await db.execute(
                update(EvaluationRun)
                .where(EvaluationRun.id == run_id)
                .values(
                    status="processing",
                    progress_percentage=0,
                    current_step="Initializing evaluation run"
                )
            )
            await db.commit()
            
            # Get all images from all datasets in this run
            all_images = []
            for dataset in evaluation_run.datasets:
                # Access images through the relationship
                all_images.extend(dataset.images)
            
            total_images = len(all_images)
            if total_images == 0:
                # No images to process
                await db.execute(
                    update(EvaluationRun)
                    .where(EvaluationRun.id == run_id)
                    .values(
                        status="failed",
                        current_step="No images found in datasets"
                    )
                )
                await db.commit()
                return
            
            # Get prompt configurations for this run
            prompt_configs = evaluation_run.prompt_configurations
            if not prompt_configs:
                await db.execute(
                    update(EvaluationRun)
                    .where(EvaluationRun.id == run_id)
                    .values(
                        status="failed",
                        current_step="No prompt configurations found"
                    )
                )
                await db.commit()
                return
            
            # Process each image with each prompt configuration
            processed_count = 0
            orchestrator = get_ocr_orchestrator()
            
            for image in all_images:
                for prompt_config in prompt_configs:
                    try:
                        # Create evaluation for this image and prompt
                        evaluation_create = crud.EvaluationCreate(
                            image_id=image.id,
                            evaluation_run_id=run_id,
                            prompt_version=prompt_config.prompt_version.version,
                            force_reprocess=True
                        )
                        
                        # Create the evaluation record
                        db_evaluation = await crud.create_evaluation(db, evaluation_create)
                        
                        # Update progress
                        processed_count += 1
                        progress_percentage = int((processed_count / (total_images * len(prompt_configs))) * 100)
                        
                        await db.execute(
                            update(EvaluationRun)
                            .where(EvaluationRun.id == run_id)
                            .values(
                                progress_percentage=progress_percentage,
                                current_step=f"Processing image {image.number} with {prompt_config.label}"
                            )
                        )
                        await db.commit()
                        
                        # Process the evaluation
                        result = await orchestrator.process_single_evaluation(
                            image.url,
                            image.reference_text,
                            image.number
                        )
                        
                        if result.get('success'):
                            # Update evaluation with results
                            word_evaluations = []
                            evaluation_data = result.get('evaluation', {})
                            
                            for word_eval in evaluation_data.get('word_evaluations', []):
                                word_evaluations.append(crud.WordEvaluationCreate(
                                    reference_word=word_eval.get('reference_word', ''),
                                    transcribed_word=word_eval.get('transcribed_word'),
                                    match=word_eval.get('match', False),
                                    reason_diff=word_eval.get('reason_diff', ''),
                                    word_position=word_eval.get('word_position', 0)
                                ))
                            
                            update_data = crud.EvaluationUpdate(
                                ocr_output=evaluation_data.get('full_text', ''),
                                accuracy=evaluation_data.get('accuracy', 0),
                                correct_words=evaluation_data.get('correct_words', 0),
                                total_words=evaluation_data.get('total_words', 0),
                                processing_status="success",
                                progress_percentage=100,
                                current_step="Completed",
                                word_evaluations=word_evaluations
                            )
                            
                            await crud.update_evaluation(db, db_evaluation.id, update_data)
                        else:
                            # Update with error
                            await crud.update_evaluation(
                                db,
                                db_evaluation.id,
                                crud.EvaluationUpdate(
                                    processing_status="failed",
                                    progress_percentage=0,
                                    current_step="Failed",
                                    error_message=result.get('error', 'Unknown error')
                                )
                            )
                    
                    except Exception as e:
                        # Log error but continue with other evaluations
                        print(f"Error processing image {image.id} with prompt {prompt_config.label}: {str(e)}")
                        continue
            
            # Mark run as completed
            await db.execute(
                update(EvaluationRun)
                .where(EvaluationRun.id == run_id)
                .values(
                    status="success",
                    progress_percentage=100,
                    current_step="Evaluation run completed",
                    completed_at=datetime.utcnow()
                )
            )
            await db.commit()
            
        except Exception as e:
            # Update run with error
            await db.execute(
                update(EvaluationRun)
                .where(EvaluationRun.id == run_id)
                .values(
                    status="failed",
                    current_step=f"Failed: {str(e)}"
                )
            )
            await db.commit()

# Dataset endpoints
@app.get("/api/datasets", response_model=List[Dataset])
async def get_datasets(db: AsyncSession = Depends(get_db)):
    """Get all evaluation datasets"""
    return await crud.get_datasets(db)

@app.get("/api/datasets/{dataset_id}", response_model=DatasetWithImages)
async def get_dataset(dataset_id: int, db: AsyncSession = Depends(get_db)):
    """Get a specific dataset with its images"""
    dataset = await crud.get_dataset(db, dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return dataset

@app.post("/api/datasets", response_model=Dataset)
async def create_dataset(dataset: DatasetCreate, db: AsyncSession = Depends(get_db)):
    """Create a new dataset"""
    return await crud.create_dataset(db, dataset)

@app.put("/api/datasets/{dataset_id}", response_model=Dataset)
async def update_dataset(
    dataset_id: int,
    dataset_update: DatasetUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a dataset"""
    dataset = await crud.update_dataset(db, dataset_id, dataset_update)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return dataset

@app.post("/api/datasets/{dataset_id}/upload", response_model=Dataset)
async def upload_dataset_files(
    dataset_id: int,
    images_zip: UploadFile = File(...),
    reference_csv: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """Upload images and reference CSV for a dataset"""
    dataset = await crud.get_dataset(db, dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    # Validate files
    if not images_zip.filename.endswith('.zip'):
        raise HTTPException(status_code=400, detail="Images file must be a ZIP archive")
    if not reference_csv.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Reference file must be CSV")
    
    # Process the uploaded files
    result = await crud.process_dataset_upload(db, dataset_id, images_zip, reference_csv)
    return result

# Prompt Family endpoints
@app.get("/api/prompt-families", response_model=List[PromptFamily])
async def get_prompt_families(db: AsyncSession = Depends(get_db)):
    """Get all prompt families"""
    return await crud.get_prompt_families(db)

@app.get("/api/prompt-families/{family_id}", response_model=PromptFamilyWithVersions)
async def get_prompt_family(family_id: int, db: AsyncSession = Depends(get_db)):
    """Get a specific prompt family with its versions"""
    family = await crud.get_prompt_family(db, family_id)
    if not family:
        raise HTTPException(status_code=404, detail="Prompt family not found")
    return family

@app.put("/api/prompt-families/{family_id}", response_model=PromptFamily)
async def update_prompt_family(
    family_id: int,
    family_update: PromptFamilyCreate,
    db: AsyncSession = Depends(get_db)
):
    """Update a prompt family"""
    # First check if the family exists
    existing_family = await crud.get_prompt_family(db, family_id)
    if not existing_family:
        raise HTTPException(status_code=404, detail="Prompt family not found")
    
    # Update the family
    updated_family = await crud.update_prompt_family(db, family_id, family_update)
    return updated_family

@app.post("/api/prompt-families", response_model=PromptFamily)
async def create_prompt_family(family: PromptFamilyCreate, db: AsyncSession = Depends(get_db)):
    """Create a new prompt family"""
    return await crud.create_prompt_family(db, family)

# Prompt Version endpoints
@app.get("/api/prompt-families/{family_id}/versions", response_model=List[PromptVersion])
async def get_prompt_versions(family_id: int, db: AsyncSession = Depends(get_db)):
    """Get all versions for a prompt family"""
    return await crud.get_prompt_versions(db, family_id)

@app.post("/api/prompt-families/{family_id}/versions", response_model=PromptVersion)
async def create_prompt_version(
    family_id: int,
    version: PromptVersionCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new version of a prompt"""
    # Validate family exists
    family = await crud.get_prompt_family(db, family_id)
    if not family:
        raise HTTPException(status_code=404, detail="Prompt family not found")
    
    # Generate version number based on type
    next_version = await crud.generate_next_version(db, family_id, version.version_type)
    
    # Set the generated version number
    version.version = next_version
    
    # Create the version
    return await crud.create_prompt_version(db, version)

@app.put("/api/prompt-versions/{version_id}", response_model=PromptVersion)
async def update_prompt_version(
    version_id: int,
    version_update: PromptVersionUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a prompt version"""
    # First check if the version exists
    existing_version = await crud.get_prompt_version(db, version_id)
    if not existing_version:
        raise HTTPException(status_code=404, detail="Prompt version not found")
    
    # Update the version
    updated_version = await crud.update_prompt_version(db, version_id, version_update)
    if not updated_version:
        raise HTTPException(status_code=500, detail="Failed to update prompt version")
    
    return updated_version

@app.post("/api/prompt-versions/{version_id}/promote")
async def promote_prompt_version(version_id: int, db: AsyncSession = Depends(get_db)):
    """Promote a prompt version to production"""
    result = await crud.promote_prompt_version(db, version_id)
    if not result:
        raise HTTPException(status_code=404, detail="Prompt version not found")
    return {"message": "Prompt version promoted to production"}

# Evaluation Run endpoints
@app.get("/api/evaluation-runs", response_model=List[EvaluationRun])
async def get_evaluation_runs(db: AsyncSession = Depends(get_db)):
    """Get all evaluation runs"""
    return await crud.get_evaluation_runs(db)

@app.get("/api/evaluation-runs/{run_id}", response_model=EvaluationRunWithDetails)
async def get_evaluation_run(run_id: int, db: AsyncSession = Depends(get_db)):
    """Get a specific evaluation run with full details"""
    run = await crud.get_evaluation_run(db, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Evaluation run not found")
    return run

@app.post("/api/evaluation-runs", response_model=EvaluationRun)
async def create_evaluation_run(
    run: EvaluationRunCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """Create and start a new evaluation run (A/B test)"""
    logging.info("[API] Entered create_evaluation_run endpoint")
    try:
        # Validate datasets exist
        for dataset_id in run.dataset_ids:
            logging.info(f"[API] Validating dataset_id: {dataset_id}")
            dataset = await crud.get_dataset(db, dataset_id)
            if not dataset:
                logging.error(f"[API] Dataset {dataset_id} not found")
                raise HTTPException(status_code=404, detail=f"Dataset {dataset_id} not found")
            if dataset.status != DatasetStatus.VALIDATED:
                logging.error(f"[API] Dataset {dataset.name} is not validated (status: {dataset.status})")
                raise HTTPException(status_code=400, detail=f"Dataset {dataset.name} is not validated")
        
        # Create the evaluation run
        logging.info("[API] Creating evaluation run in DB")
        db_run = await crud.create_evaluation_run(db, run)
        logging.info(f"[API] Evaluation run created with id: {db_run.id}")
        
        # Queue background processing
        logging.info(f"[API] Adding background task for run id: {db_run.id}")
        background_tasks.add_task(process_evaluation_run_background, db_run.id)
        
        logging.info(f"[API] Returning evaluation run with id: {db_run.id}")
        # return db_run
        return EvaluationRun(
            id = db_run.id,
            name = db_run.name,
            description = db_run.description,
            hypothesis = db_run.hypothesis,
            status = db_run.status,
            progress_percentage = db_run.progress_percentage,
            current_step = db_run.current_step,
            created_at = db_run.created_at,
            updated_at = db_run.updated_at,
            completed_at = db_run.completed_at,
            dataset_ids=[d.id for d in db_run.datasets]
        )
    except Exception as e:
        logging.exception(f"[API] Exception in create_evaluation_run: {str(e)}")
        raise

@app.get("/api/evaluation-runs/{run_id}/comparison", response_model=ComparisonResults)
async def get_evaluation_comparison(run_id: int, db: AsyncSession = Depends(get_db)):
    """Get detailed comparison results for an evaluation run"""
    comparison = await crud.get_evaluation_comparison(db, run_id)
    if not comparison:
        raise HTTPException(status_code=404, detail="Evaluation run not found or not completed")
    return comparison

# Real-time WebSocket endpoint for live progress
@app.websocket("/ws/evaluation-runs/{run_id}/progress")
async def websocket_evaluation_progress(websocket: WebSocket, run_id: int):
    """WebSocket endpoint for real-time evaluation progress"""
    await websocket.accept()
    
    try:
        while True:
            # Get current progress using database module directly
            from .database import async_session
            async with async_session() as db:
                progress = await crud.get_evaluation_run_progress(db, run_id)
                if progress:
                    await websocket.send_json(progress)
                
                # If completed, send final update and close
                if progress and progress.get('status') in ['success', 'failed']:
                    break
            
            # Wait before next update
            await asyncio.sleep(2)
            
    except WebSocketDisconnect:
        pass

# Historical Analysis endpoints
@app.get("/api/analysis/performance-trends", response_model=List[PerformanceTrend])
async def get_performance_trends(
    prompt_family_id: Optional[int] = Query(None),
    dataset_id: Optional[int] = Query(None),
    days_back: int = Query(30),
    db: AsyncSession = Depends(get_db)
):
    """Get performance trends over time"""
    return await crud.get_performance_trends(db, prompt_family_id, dataset_id, days_back)

@app.get("/api/analysis/regression-alerts")
async def get_regression_alerts(db: AsyncSession = Depends(get_db)):
    """Get active regression alerts"""
    return await crud.get_regression_alerts(db)

# API Key Management endpoints
@app.get("/api/api-keys", response_model=List[APIKey])
async def get_api_keys(db: AsyncSession = Depends(get_db)):
    """Get all API keys for the current user"""
    return await crud.get_api_keys(db)

@app.post("/api/api-keys", response_model=APIKey)
async def create_api_key(key_data: APIKeyCreate, db: AsyncSession = Depends(get_db)):
    """Create a new API key"""
    return await crud.create_api_key(db, key_data)

@app.delete("/api/api-keys/{key_id}")
async def revoke_api_key(key_id: int, db: AsyncSession = Depends(get_db)):
    """Revoke an API key"""
    success = await crud.revoke_api_key(db, key_id)
    if not success:
        raise HTTPException(status_code=404, detail="API key not found")
    return {"message": "API key revoked"}

@app.get("/api/api-keys/{key_id}/usage", response_model=APIUsageStats)
async def get_api_key_usage(key_id: int, db: AsyncSession = Depends(get_db)):
    """Get usage statistics for an API key"""
    stats = await crud.get_api_key_usage(db, key_id)
    if not stats:
        raise HTTPException(status_code=404, detail="API key not found")
    return stats

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True) 