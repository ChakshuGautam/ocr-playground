from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, and_, or_
from sqlalchemy.orm import selectinload
from typing import List, Optional, Dict, Any
import json
import csv
import os
from datetime import datetime

from .database import Image, Evaluation, WordEvaluation, PromptTemplate
from .schemas import (
    ImageCreate, ImageUpdate, EvaluationCreate, EvaluationUpdate,
    PromptTemplateCreate, PromptTemplateUpdate, WordEvaluationCreate,
    ImageFilter, PaginationParams
)

# Image CRUD operations
async def create_image(db: AsyncSession, image: ImageCreate) -> Image:
    db_image = Image(**image.dict())
    db.add(db_image)
    await db.commit()
    await db.refresh(db_image)
    return db_image

async def get_image(db: AsyncSession, image_id: int) -> Optional[Image]:
    result = await db.execute(
        select(Image).options(selectinload(Image.evaluations)).where(Image.id == image_id)
    )
    return result.scalar_one_or_none()

async def get_image_by_number(db: AsyncSession, number: str) -> Optional[Image]:
    result = await db.execute(select(Image).where(Image.number == number))
    return result.scalar_one_or_none()

async def get_images(
    db: AsyncSession, 
    filters: ImageFilter = None, 
    pagination: PaginationParams = None
) -> tuple[List[Image], int]:
    query = select(Image).options(selectinload(Image.evaluations))
    
    # Apply filters
    if filters:
        conditions = []
        if filters.has_evaluations is not None:
            if filters.has_evaluations:
                query = query.join(Evaluation)
            else:
                query = query.outerjoin(Evaluation).where(Evaluation.id.is_(None))
        
        if filters.processing_status:
            query = query.join(Evaluation).where(Evaluation.processing_status == filters.processing_status)
        
        if filters.prompt_version:
            query = query.join(Evaluation).where(Evaluation.prompt_version == filters.prompt_version)
        
        if filters.accuracy_min is not None:
            query = query.join(Evaluation).where(Evaluation.accuracy >= filters.accuracy_min)
        
        if filters.accuracy_max is not None:
            query = query.join(Evaluation).where(Evaluation.accuracy <= filters.accuracy_max)
        
        if filters.created_after:
            query = query.where(Image.created_at >= filters.created_after)
        
        if filters.created_before:
            query = query.where(Image.created_at <= filters.created_before)
    
    # Get total count - simplified approach
    # Clone the query for counting but remove options and order
    count_query = select(func.count(Image.id))
    # Apply same basic filters if they exist
    if filters and filters.has_evaluations is not None:
        if filters.has_evaluations:
            count_query = count_query.join(Evaluation)
        else:
            count_query = count_query.outerjoin(Evaluation).where(Evaluation.id.is_(None))
    
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination
    if pagination:
        query = query.offset(pagination.skip).limit(pagination.limit)
    
    result = await db.execute(query)
    return result.scalars().all(), total

async def update_image(db: AsyncSession, image_id: int, image_update: ImageUpdate) -> Optional[Image]:
    result = await db.execute(select(Image).where(Image.id == image_id))
    db_image = result.scalar_one_or_none()
    
    if db_image:
        update_data = image_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_image, field, value)
        
        db_image.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(db_image)
    
    return db_image

async def delete_image(db: AsyncSession, image_id: int) -> bool:
    result = await db.execute(select(Image).where(Image.id == image_id))
    db_image = result.scalar_one_or_none()
    
    if db_image:
        await db.delete(db_image)
        await db.commit()
        return True
    return False

async def get_all_images_with_evaluations(db: AsyncSession) -> List[Image]:
    """Get all images with their evaluations for CSV export"""
    result = await db.execute(
        select(Image).options(selectinload(Image.evaluations)).order_by(Image.id)
    )
    return result.scalars().all()

# Evaluation CRUD operations
async def create_evaluation(db: AsyncSession, evaluation: EvaluationCreate) -> Evaluation:
    # Check if evaluation already exists for this image and prompt version
    existing = await db.execute(
        select(Evaluation).where(
            and_(
                Evaluation.image_id == evaluation.image_id,
                Evaluation.prompt_version == evaluation.prompt_version
            )
        )
    )
    existing_eval = existing.scalar_one_or_none()
    
    if existing_eval and not evaluation.force_reprocess:
        return existing_eval
    
    db_evaluation = Evaluation(
        image_id=evaluation.image_id,
        prompt_version=evaluation.prompt_version,
        processing_status="pending"
    )
    db.add(db_evaluation)
    await db.commit()
    await db.refresh(db_evaluation)
    return db_evaluation

async def get_evaluation(db: AsyncSession, evaluation_id: int) -> Optional[Evaluation]:
    result = await db.execute(
        select(Evaluation)
        .options(
            selectinload(Evaluation.image),
            selectinload(Evaluation.word_evaluations)
        )
        .where(Evaluation.id == evaluation_id)
    )
    return result.scalar_one_or_none()

async def get_evaluations(
    db: AsyncSession, 
    image_id: Optional[int] = None,
    prompt_version: Optional[str] = None,
    pagination: PaginationParams = None
) -> tuple[List[Evaluation], int]:
    query = select(Evaluation).options(
        selectinload(Evaluation.image),
        selectinload(Evaluation.word_evaluations)
    )
    
    if image_id:
        query = query.where(Evaluation.image_id == image_id)
    
    if prompt_version:
        query = query.where(Evaluation.prompt_version == prompt_version)
    
    # Get total count - simplified approach
    count_query = select(func.count(Evaluation.id))
    if image_id:
        count_query = count_query.where(Evaluation.image_id == image_id)
    if prompt_version:
        count_query = count_query.where(Evaluation.prompt_version == prompt_version)
    
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination
    if pagination:
        query = query.offset(pagination.skip).limit(pagination.limit)
    
    result = await db.execute(query)
    return result.scalars().all(), total

async def update_evaluation(
    db: AsyncSession, 
    evaluation_id: int, 
    evaluation_update: EvaluationUpdate
) -> Optional[Evaluation]:
    result = await db.execute(select(Evaluation).where(Evaluation.id == evaluation_id))
    db_evaluation = result.scalar_one_or_none()
    
    if db_evaluation:
        update_data = evaluation_update.dict(exclude_unset=True)
        
        # Handle word evaluations separately
        word_evaluations_data = update_data.pop('word_evaluations', None)
        
        # Update main evaluation fields
        for field, value in update_data.items():
            setattr(db_evaluation, field, value)
        
        # Handle word evaluations
        if word_evaluations_data is not None:
            # Delete existing word evaluations
            await db.execute(
                select(WordEvaluation).where(WordEvaluation.evaluation_id == evaluation_id)
            )
            
            # Create new word evaluations
            for word_eval_data in word_evaluations_data:
                word_eval = WordEvaluation(
                    evaluation_id=evaluation_id,
                    **word_eval_data.dict()
                )
                db.add(word_eval)
            
            # Also store as JSON for quick access
            db_evaluation.word_evaluations_json = json.dumps([
                word_eval.dict() for word_eval in word_evaluations_data
            ])
        
        await db.commit()
        await db.refresh(db_evaluation)
    
    return db_evaluation

# Prompt Template CRUD operations
async def create_prompt_template(db: AsyncSession, template: PromptTemplateCreate) -> PromptTemplate:
    # If this template is set as active, deactivate others
    if template.is_active:
        await db.execute(
            select(PromptTemplate).where(PromptTemplate.is_active == True)
        )
        # Update all to inactive
        existing_active = await db.execute(select(PromptTemplate).where(PromptTemplate.is_active == True))
        for active_template in existing_active.scalars():
            active_template.is_active = False
    
    db_template = PromptTemplate(**template.dict())
    db.add(db_template)
    await db.commit()
    await db.refresh(db_template)
    return db_template

async def get_prompt_template(db: AsyncSession, template_id: int) -> Optional[PromptTemplate]:
    result = await db.execute(select(PromptTemplate).where(PromptTemplate.id == template_id))
    return result.scalar_one_or_none()

async def get_active_prompt_template(db: AsyncSession) -> Optional[PromptTemplate]:
    result = await db.execute(select(PromptTemplate).where(PromptTemplate.is_active == True))
    return result.scalar_one_or_none()

async def get_prompt_templates(db: AsyncSession) -> List[PromptTemplate]:
    result = await db.execute(select(PromptTemplate).order_by(PromptTemplate.created_at.desc()))
    return result.scalars().all()

# Statistics and analytics
async def get_evaluation_stats(db: AsyncSession) -> Dict[str, Any]:
    # Total images
    total_images_result = await db.execute(select(func.count(Image.id)))
    total_images = total_images_result.scalar()
    
    # Total evaluations
    total_evaluations_result = await db.execute(select(func.count(Evaluation.id)))
    total_evaluations = total_evaluations_result.scalar()
    
    # Status counts
    pending_result = await db.execute(
        select(func.count(Evaluation.id)).where(Evaluation.processing_status == "pending")
    )
    pending = pending_result.scalar()
    
    success_result = await db.execute(
        select(func.count(Evaluation.id)).where(Evaluation.processing_status == "success")
    )
    successful = success_result.scalar()
    
    failed_result = await db.execute(
        select(func.count(Evaluation.id)).where(Evaluation.processing_status == "failed")
    )
    failed = failed_result.scalar()
    
    # Average accuracy
    avg_accuracy_result = await db.execute(
        select(func.avg(Evaluation.accuracy)).where(
            and_(
                Evaluation.processing_status == "success",
                Evaluation.accuracy.isnot(None)
            )
        )
    )
    avg_accuracy = avg_accuracy_result.scalar()
    
    # Accuracy by prompt version
    accuracy_by_version_result = await db.execute(
        select(
            Evaluation.prompt_version,
            func.avg(Evaluation.accuracy)
        ).where(
            and_(
                Evaluation.processing_status == "success",
                Evaluation.accuracy.isnot(None)
            )
        ).group_by(Evaluation.prompt_version)
    )
    
    accuracy_by_version = {
        version: accuracy for version, accuracy in accuracy_by_version_result.fetchall()
    }
    
    return {
        "total_images": total_images,
        "total_evaluations": total_evaluations,
        "pending_evaluations": pending,
        "successful_evaluations": successful,
        "failed_evaluations": failed,
        "average_accuracy": float(avg_accuracy) if avg_accuracy else None,
        "accuracy_by_prompt_version": accuracy_by_version
    }

async def get_accuracy_distribution(db: AsyncSession) -> Dict[str, int]:
    # Get all successful evaluations with accuracy
    successful_evals = await db.execute(
        select(Evaluation.accuracy).where(
            and_(
                Evaluation.processing_status == "success",
                Evaluation.accuracy.isnot(None)
            )
        )
    )
    
    accuracies = [acc for acc, in successful_evals.fetchall()]
    
    high = len([acc for acc in accuracies if acc >= 90])
    medium = len([acc for acc in accuracies if 70 <= acc < 90])
    low = len([acc for acc in accuracies if acc < 70])
    
    return {
        "high_accuracy": high,
        "medium_accuracy": medium,
        "low_accuracy": low,
        "total_processed": len(accuracies)
    }

# CSV Import functionality
async def import_csv_data(db: AsyncSession, csv_file_path: str, overwrite_existing: bool = False) -> Dict[str, Any]:
    """Import data from CSV file into the database"""
    imported_count = 0
    updated_count = 0
    errors = []
    
    try:
        with open(csv_file_path, 'r', encoding='utf-8') as file:
            csv_reader = csv.DictReader(file)
            
            for row_num, row in enumerate(csv_reader, start=2):  # Start at 2 for header
                try:
                    # Extract required fields
                    number = row.get('#', '').strip()
                    url = row.get('Link', '').strip()
                    reference_text = row.get('Text', '').strip()
                    local_image = row.get('Local Image', '').strip()
                    
                    if not number or not reference_text:
                        errors.append(f"Row {row_num}: Missing required fields (# or Text)")
                        continue
                    
                    # Check if image already exists
                    existing_image = await get_image_by_number(db, number)
                    
                    if existing_image:
                        if overwrite_existing:
                            # Update existing image
                            update_data = ImageUpdate(
                                reference_text=reference_text,
                                url=url,
                                local_path=local_image
                            )
                            await update_image(db, existing_image.id, update_data)
                            updated_count += 1
                        else:
                            # Skip existing
                            continue
                    else:
                        # Create new image
                        image_data = ImageCreate(
                            number=number,
                            url=url,
                            reference_text=reference_text,
                            local_path=local_image
                        )
                        await create_image(db, image_data)
                        imported_count += 1
                    
                except Exception as e:
                    errors.append(f"Row {row_num}: {str(e)}")
                    continue
        
        return {
            "imported_count": imported_count,
            "updated_count": updated_count,
            "errors": errors,
            "message": f"Import completed. {imported_count} new images, {updated_count} updated."
        }
    
    except FileNotFoundError:
        return {
            "imported_count": 0,
            "updated_count": 0,
            "errors": [f"CSV file not found: {csv_file_path}"],
            "message": "Import failed - file not found"
        }
    except Exception as e:
        return {
            "imported_count": 0,
            "updated_count": 0,
            "errors": [f"Import error: {str(e)}"],
            "message": "Import failed"
        } 