from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, and_, delete
from sqlalchemy.orm import selectinload
from typing import List, Optional, Dict, Any
import json
import csv
import os
import zipfile
import tempfile
from datetime import datetime, timedelta
import logging

from .database import (
    Image, Evaluation, WordEvaluation, PromptTemplate,
    Dataset, PromptFamily, PromptVersion, EvaluationRun, EvaluationRunPrompt, APIKey, evaluation_run_datasets, dataset_images
)
from .schemas import (
    ImageCreate, ImageUpdate, EvaluationCreate, EvaluationUpdate,
    PromptTemplateCreate,
    ImageFilter, PaginationParams,
    DatasetCreate, DatasetUpdate, PromptFamilyCreate,
    PromptVersionCreate, PromptVersionUpdate, EvaluationRunCreate,
    VersionType, ProcessingStatus, DatasetStatus, PromptStatus,
    APIKeyCreate
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
        evaluation_run_id=evaluation.evaluation_run_id,
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
                delete(WordEvaluation).where(WordEvaluation.evaluation_id == evaluation_id)
            )
            
            # Create new word evaluations
            for word_eval_data in word_evaluations_data:
                # Convert WordEvaluationCreate to dict if it's not already
                if hasattr(word_eval_data, 'dict'):
                    word_eval_dict = word_eval_data.dict()
                else:
                    word_eval_dict = word_eval_data
                
                word_eval = WordEvaluation(
                    evaluation_id=evaluation_id,
                    **word_eval_dict
                )
                db.add(word_eval)
            
            # Also store as JSON for quick access
            db_evaluation.word_evaluations_json = json.dumps([
                word_eval_data.dict() if hasattr(word_eval_data, 'dict') else word_eval_data 
                for word_eval_data in word_evaluations_data
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

async def import_csv_data_into_dataset(db: AsyncSession, csv_file_path: str, dataset_id: int, overwrite_existing: bool = False) -> Dict[str, Any]:
    """Import data from CSV file into the database"""
    imported_count = 0
    updated_count = 0
    errors = []
    dataset = await get_dataset(db, dataset_id)
    if not dataset:
        raise ValueError("Dataset not found")
    
    # Clear existing images from dataset if overwrite_existing is True
    # if overwrite_existing:
    #     dataset.images.clear()
    #     logging.info(f"[CRUD] Cleared existing images from dataset {dataset_id}")
    
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
                    # existing_image = await get_image_by_number(db, number)
                    
                    # if existing_image:
                    #     if overwrite_existing:
                    #         # Update existing image
                    #         update_data = ImageUpdate(
                    #             reference_text=reference_text,
                    #             url=url,
                    #             local_path=local_image
                    #         )
                    #         await update_image(db, existing_image.id, update_data)
                    #         updated_count += 1
                    #     else:
                    #         # Skip existing
                    #         continue
                    # else:
                    #     # Create new image
                    #     image_data = ImageCreate(
                    #         number=number,
                    #         url=url,
                    #         reference_text=reference_text,
                    #         local_path=local_image
                    #     )
                    # Create new image
                    image_data = ImageCreate(
                        number=number,
                        url=url,
                        reference_text=reference_text,
                        local_path=local_image
                    )
                    db_image = await create_image(db, image_data)
                    dataset.images.append(db_image)
                    imported_count += 1
                except Exception as e:
                    errors.append(f"Row {row_num}: {str(e)}")
                    continue
        
        # Update dataset with correct image count and commit changes
        dataset.image_count = len(dataset.images)
        dataset.status = DatasetStatus.VALIDATED
        dataset.updated_at = datetime.utcnow()
        
        # Commit all changes to the database
        await db.commit()
        await db.refresh(dataset)

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

async def get_latest_imported_images(db: AsyncSession, count: int) -> List[int]:
    """Get IDs of the most recently imported images"""
    result = await db.execute(
        select(Image.id)
        .order_by(Image.created_at.desc())
        .limit(count)
    )
    return [row[0] for row in result.fetchall()]

async def associate_image_with_dataset(db: AsyncSession, image_id: int, dataset_id: int) -> bool:
    """Associate an image with a dataset"""
    # Get the image and dataset
    image_result = await db.execute(select(Image).where(Image.id == image_id))
    dataset_result = await db.execute(select(Dataset).where(Dataset.id == dataset_id))
    
    image = image_result.scalar_one_or_none()
    dataset = dataset_result.scalar_one_or_none()
    
    if not image or not dataset:
        return False
    
    # Add image to dataset's images collection
    if image not in dataset.images:
        dataset.images.append(image)
        dataset.image_count = len(dataset.images)
        dataset.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(dataset)
    
    return True

async def is_image_in_dataset(db: AsyncSession, image_id: int, dataset_id: int) -> bool:
    """Check if an image is already associated with a dataset"""
    result = await db.execute(
        select(dataset_images).where(
            and_(
                dataset_images.c.image_id == image_id,
                dataset_images.c.dataset_id == dataset_id
            )
        )
    )
    return result.scalar_one_or_none() is not None

async def get_dataset_images(db: AsyncSession, dataset_id: int) -> List[Image]:
    """Get all images associated with a dataset"""
    result = await db.execute(
        select(Image)
        .join(dataset_images)
        .where(dataset_images.c.dataset_id == dataset_id)
        .order_by(Image.id)
    )
    return result.scalars().all()

# New Dataset CRUD operations
async def create_dataset(db: AsyncSession, dataset: DatasetCreate) -> Dataset:
    db_dataset = Dataset(**dataset.dict())
    db.add(db_dataset)
    await db.commit()
    await db.refresh(db_dataset)
    return db_dataset

async def get_dataset(db: AsyncSession, dataset_id: int) -> Optional[Dataset]:
    result = await db.execute(
        select(Dataset).options(selectinload(Dataset.images)).where(Dataset.id == dataset_id)
    )
    return result.scalar_one_or_none()

async def get_datasets(db: AsyncSession, user_id: str) -> List[Dataset]:
    result = await db.execute(
        select(Dataset)
        .where(Dataset.user_id == user_id)
        .order_by(Dataset.created_at.desc())
    )
    return result.scalars().all()

async def update_dataset(db: AsyncSession, dataset_id: int, dataset_update: DatasetUpdate) -> Optional[Dataset]:
    result = await db.execute(select(Dataset).where(Dataset.id == dataset_id))
    db_dataset = result.scalar_one_or_none()
    
    if db_dataset:
        update_data = dataset_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_dataset, field, value)
        
        db_dataset.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(db_dataset)
    
    return db_dataset

async def process_dataset_upload(db: AsyncSession, dataset_id: int, images_zip, reference_csv) -> Dataset:
    """Process uploaded ZIP of images and CSV with reference texts"""
    dataset = await get_dataset(db, dataset_id)
    if not dataset:
        raise ValueError("Dataset not found")
    
    # Create temporary directory for processing
    with tempfile.TemporaryDirectory() as temp_dir:
        # Extract ZIP file
        zip_path = os.path.join(temp_dir, "images.zip")
        with open(zip_path, "wb") as f:
            f.write(await images_zip.read())
        
        # Save CSV file
        csv_path = os.path.join(temp_dir, "reference.csv")
        with open(csv_path, "wb") as f:
            f.write(await reference_csv.read())
        
        # Extract images
        images_dir = os.path.join(temp_dir, "images")
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(images_dir)
        
        # Read CSV and validate
        image_refs = {}
        with open(csv_path, 'r', encoding='utf-8') as f:
            csv_reader = csv.DictReader(f)
            for row in csv_reader:
                filename = row.get('image_filename', '').strip()
                reference_text = row.get('reference_text', '').strip()
                if filename and reference_text:
                    image_refs[filename] = reference_text
        
        # Get list of extracted image files
        image_files = []
        for root, dirs, files in os.walk(images_dir):
            for file in files:
                if file.lower().endswith(('.png', '.jpg', '.jpeg')):
                    image_files.append(file)
        
        # Validate that all images have reference text and vice versa
        missing_refs = [img for img in image_files if img not in image_refs]
        missing_images = [ref for ref in image_refs.keys() if ref not in image_files]
        
        if missing_refs or missing_images:
            raise ValueError(f"Validation failed. Missing references: {missing_refs}, Missing images: {missing_images}")
        
        # Create Image records and associate with dataset
        created_images = []
        for filename, reference_text in image_refs.items():
            # Create a unique number for the image
            image_number = f"{dataset.name}_{filename}"
            
            # Check if image already exists
            existing = await get_image_by_number(db, image_number)
            if not existing:
                image_data = ImageCreate(
                    number=image_number,
                    url=f"/datasets/{dataset_id}/images/{filename}",
                    reference_text=reference_text,
                    local_path=os.path.join(images_dir, filename)
                )
                db_image = await create_image(db, image_data)
                created_images.append(db_image)
        
        # Associate images with dataset
        for image in created_images:
            dataset.images.append(image)
        
        # Update dataset metadata
        dataset.image_count = len(created_images)
        dataset.status = DatasetStatus.VALIDATED
        dataset.updated_at = datetime.utcnow()
        
        await db.commit()
        await db.refresh(dataset)
        
        return dataset

# Prompt Family CRUD operations
async def create_prompt_family(db: AsyncSession, family: PromptFamilyCreate) -> PromptFamily:
    db_family = PromptFamily(**family.dict())
    db.add(db_family)
    await db.commit()
    await db.refresh(db_family)
    return db_family

async def get_prompt_family(db: AsyncSession, family_id: int) -> Optional[PromptFamily]:
    result = await db.execute(
        select(PromptFamily).options(selectinload(PromptFamily.versions)).where(PromptFamily.id == family_id)
    )
    return result.scalar_one_or_none()

async def get_prompt_families(db: AsyncSession, user_id: str) -> List[PromptFamily]:
    result = await db.execute(
        select(PromptFamily)
        .where(PromptFamily.user_id == user_id)
        .order_by(PromptFamily.created_at.desc())
    )
    return result.scalars().all()

async def update_prompt_family(db: AsyncSession, family_id: int, family_update: PromptFamilyCreate) -> Optional[PromptFamily]:
    """Update an existing prompt family"""
    result = await db.execute(select(PromptFamily).where(PromptFamily.id == family_id))
    db_family = result.scalar_one_or_none()
    
    if db_family:
        # Update the fields
        update_data = family_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_family, field, value)
        
        await db.commit()
        await db.refresh(db_family)
    
    return db_family

# Prompt Version CRUD operations
async def get_prompt_versions(db: AsyncSession, family_id: int, user_id: str) -> List[PromptVersion]:
    result = await db.execute(
        select(PromptVersion)
        .where(
            and_(
                PromptVersion.family_id == family_id,
                PromptVersion.user_id == user_id
            )
        )
        .order_by(PromptVersion.created_at.desc())
    )
    return result.scalars().all()

async def get_prompt_version(db: AsyncSession, version_id: int) -> Optional[PromptVersion]:
    """Get a specific prompt version by ID"""
    result = await db.execute(
        select(PromptVersion).where(PromptVersion.id == version_id)
    )
    return result.scalar_one_or_none()

async def generate_next_version(db: AsyncSession, family_id: int, version_type: VersionType) -> str:
    """Generate the next semantic version number"""
    # Get latest version for this family
    result = await db.execute(
        select(PromptVersion.version)
        .where(PromptVersion.family_id == family_id)
        .order_by(PromptVersion.created_at.desc())
        .limit(1)
    )
    latest_version = result.scalar_one_or_none()
    
    if not latest_version:
        return "1.0.0"
    
    # Parse version (assume format: major.minor.patch)
    try:
        major, minor, patch = map(int, latest_version.split('.'))
    except ValueError:
        return "1.0.0"
    
    # Increment based on type
    if version_type == VersionType.MAJOR:
        major += 1
        minor = 0
        patch = 0
    elif version_type == VersionType.MINOR:
        minor += 1
        patch = 0
    elif version_type == VersionType.PATCH:
        patch += 1
    
    return f"{major}.{minor}.{patch}"

async def create_prompt_version(db: AsyncSession, version_data: PromptVersionCreate) -> PromptVersion:
    """Create a new prompt version"""
    # Convert Pydantic model to dict and exclude version_type
    version_dict = version_data.dict(exclude={'version_type'})
    
    # Create the version instance with only the fields that exist in the model
    db_version = PromptVersion(**version_dict)
    db.add(db_version)
    await db.commit()
    await db.refresh(db_version)
    return db_version

async def update_prompt_version(db: AsyncSession, version_id: int, version_update: PromptVersionUpdate) -> Optional[PromptVersion]:
    """Update an existing prompt version"""
    # Get the existing version
    result = await db.execute(select(PromptVersion).where(PromptVersion.id == version_id))
    db_version = result.scalar_one_or_none()
    
    if db_version:
        # Update only the fields that are provided
        update_data = version_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_version, field, value)
        
        await db.commit()
        await db.refresh(db_version)
    
    return db_version

async def promote_prompt_version(db: AsyncSession, version_id: int) -> bool:
    """Promote a prompt version to production"""
    result = await db.execute(select(PromptVersion).where(PromptVersion.id == version_id))
    db_version = result.scalar_one_or_none()
    
    if not db_version:
        return False
    
    # Set all other versions in this family to archived/staging
    await db.execute(
        select(PromptVersion).where(
            and_(
                PromptVersion.family_id == db_version.family_id,
                PromptVersion.status == PromptStatus.PRODUCTION
            )
        )
    )
    
    # Update existing production versions to archived
    existing_production = await db.execute(
        select(PromptVersion).where(
            and_(
                PromptVersion.family_id == db_version.family_id,
                PromptVersion.status == PromptStatus.PRODUCTION
            )
        )
    )
    
    for prod_version in existing_production.scalars():
        prod_version.status = PromptStatus.ARCHIVED
    
    # Promote this version
    db_version.status = PromptStatus.PRODUCTION
    
    # Update family's production version reference
    family_result = await db.execute(select(PromptFamily).where(PromptFamily.id == db_version.family_id))
    family = family_result.scalar_one_or_none()
    if family:
        family.production_version = db_version.version
    
    await db.commit()
    return True

# Evaluation Run CRUD operations
async def create_evaluation_run(db: AsyncSession, run: EvaluationRunCreate) -> EvaluationRun:
    logging.info("[CRUD] Entered create_evaluation_run")
    try:
        db_run = EvaluationRun(
            name=run.name,
            description=run.description,
            hypothesis=run.hypothesis,
            user_id=run.user_id
        )
        db.add(db_run)
        # await db.flush()  # Get the ID
        # await db.refresh(db_run)
        logging.info(f"[CRUD] Created EvaluationRun object with id: {db_run.id}")
        
        # Append datasets BEFORE flush/refresh
        for dataset_id in run.dataset_ids:
            logging.info(f"[CRUD] Adding dataset_id: {dataset_id} to run {db_run.id}")
            dataset = await get_dataset(db, dataset_id)
            logging.info("[Crud]!!Dataset Found")
            if dataset:
                await db.execute(
                    evaluation_run_datasets.insert().values(
                        evaluation_run_id=db_run.id,
                        dataset_id=dataset_id
                    )
                )
                # await db_run.datasets.append(dataset)
            else:
                logging.warning(f"[CRUD] Dataset {dataset_id} not found when adding to run {db_run.id}")
        await db.flush()  # Get the ID
        await db.refresh(db_run)
        
        logging.info(f"[CRUD] Datasets Added to run {db_run.id}")
        # Add prompt configurations
        for config in run.prompt_configurations:
            logging.info(f"[CRUD] Adding prompt config: family_id={config.family_id}, version={config.version}, label={config.label}")
            # Find the prompt version
            version_result = await db.execute(
                select(PromptVersion).where(
                    and_(
                        PromptVersion.family_id == config.family_id,
                        PromptVersion.version == config.version
                    )
                )
            )
            version = version_result.scalar_one_or_none()
            
            if version:
                run_prompt = EvaluationRunPrompt(
                    evaluation_run_id=db_run.id,
                    prompt_version_id=version.id,
                    label=config.label
                )
                db.add(run_prompt)
                logging.info(f"[CRUD] Added EvaluationRunPrompt for version_id={version.id} to run {db_run.id}")
            else:
                logging.warning(f"[CRUD] PromptVersion not found for family_id={config.family_id}, version={config.version}")
        
        await db.commit()
        await db.refresh(db_run)
        logging.info(f"[CRUD] Committed and refreshed EvaluationRun with id: {db_run.id}")
        # Eagerly load datasets relationship
        result = await db.execute(
            select(EvaluationRun).options(selectinload(EvaluationRun.datasets)).where(EvaluationRun.id == db_run.id)
        )
        db_run_loaded = result.scalar_one()
        return db_run_loaded
    except Exception as e:
        logging.exception(f"[CRUD] Exception in create_evaluation_run: {str(e)}")
        raise

async def get_evaluation_runs(db: AsyncSession, user_id: str) -> List[EvaluationRun]:
    result = await db.execute(
        select(EvaluationRun)
        .where(EvaluationRun.user_id == user_id)
        .options(
            selectinload(EvaluationRun.datasets),
            selectinload(EvaluationRun.prompt_configurations)
        )
        .order_by(EvaluationRun.created_at.desc())
    )
    runs = result.scalars().all()
    
    # Add dataset_ids to each run for Pydantic schema compatibility
    for run in runs:
        run.dataset_ids = [dataset.id for dataset in run.datasets]
    
    return runs

async def get_evaluation_run(db: AsyncSession, run_id: int) -> Optional[EvaluationRun]:
    result = await db.execute(
        select(EvaluationRun)
        .options(
            selectinload(EvaluationRun.datasets).selectinload(Dataset.images),
            selectinload(EvaluationRun.prompt_configurations).selectinload(EvaluationRunPrompt.prompt_version),
            selectinload(EvaluationRun.evaluations).selectinload(Evaluation.word_evaluations),
            selectinload(EvaluationRun.evaluations).selectinload(Evaluation.image)
        )
        .where(EvaluationRun.id == run_id)
    )
    run = result.scalar_one_or_none()
    
    if run:
        # Add dataset_ids to the run for Pydantic schema compatibility
        run.dataset_ids = [dataset.id for dataset in run.datasets]
        
        # Format prompt_configurations to match the schema
        for prompt_config in run.prompt_configurations:
            # Add family_id and version fields that the schema expects
            if prompt_config.prompt_version:
                prompt_config.family_id = prompt_config.prompt_version.family_id
                prompt_config.version = prompt_config.prompt_version.version
            else:
                prompt_config.family_id = None
                prompt_config.version = None
    
    return run

async def get_evaluation_comparison(db: AsyncSession, run_id: int) -> Optional[Dict[str, Any]]:
    """Generate comparison results for an evaluation run"""
    run = await get_evaluation_run(db, run_id)
    if not run or run.status != ProcessingStatus.SUCCESS:
        return None
    
    # Group evaluations by prompt version
    evaluations_by_version = {}
    for evaluation in run.evaluations:
        if evaluation.prompt_version not in evaluations_by_version:
            evaluations_by_version[evaluation.prompt_version] = []
        evaluations_by_version[evaluation.prompt_version].append(evaluation)
    
    # Calculate summary metrics for each prompt version
    summary_metrics = []
    for prompt_version, evaluations in evaluations_by_version.items():
        if not evaluations:
            continue
            
        # Find the prompt configuration for this version
        prompt_config = None
        for config in run.prompt_configurations:
            if config.version == prompt_version:
                prompt_config = config
                break
        
        # Calculate metrics
        total_accuracy = sum(eval.accuracy or 0 for eval in evaluations)
        avg_accuracy = total_accuracy / len(evaluations) if evaluations else 0
        
        total_correct_words = sum(eval.correct_words or 0 for eval in evaluations)
        total_words = sum(eval.total_words or 0 for eval in evaluations)
        character_error_rate = 1 - (total_correct_words / total_words) if total_words > 0 else 0
        
        # Calculate average latency (placeholder - would need to be stored)
        avg_latency_ms = 0
        
        # Estimate cost (placeholder - would need actual cost tracking)
        estimated_cost_per_1k = 0.01  # Placeholder
        
        # Error breakdown (placeholder - would need detailed error analysis)
        error_breakdown = {
            "character_errors": 0,
            "word_boundary_errors": 0,
            "spacing_errors": 0
        }
        
        summary_metrics.append({
            "prompt_version": prompt_version,
            "label": prompt_config.label if prompt_config else f"Version {prompt_version}",
            "overall_accuracy": round(avg_accuracy, 2),
            "character_error_rate": round(character_error_rate, 4),
            "avg_latency_ms": avg_latency_ms,
            "estimated_cost_per_1k": estimated_cost_per_1k,
            "error_breakdown": error_breakdown
        })
    
    # Generate word-level comparisons
    word_comparisons = []
    
    # Group evaluations by image_id to compare same images across versions
    evaluations_by_image = {}
    for evaluation in run.evaluations:
        if evaluation.image_id not in evaluations_by_image:
            evaluations_by_image[evaluation.image_id] = {}
        evaluations_by_image[evaluation.image_id][evaluation.prompt_version] = evaluation
    
    # Compare evaluations for the same image across different versions
    for image_id, version_evaluations in evaluations_by_image.items():
        if len(version_evaluations) < 2:
            continue  # Need at least 2 versions to compare
            
        # Get the image info
        image = None
        for dataset in run.datasets:
            for img in dataset.images:
                if img.id == image_id:
                    image = img
                    break
            if image:
                break
        
        # Compare word-level results (simplified - would need actual word-level data)
        # For now, create a basic comparison based on overall accuracy
        versions = list(version_evaluations.keys())
        if len(versions) >= 2:
            eval1 = version_evaluations[versions[0]]
            eval2 = version_evaluations[versions[1]]
            
            # Determine which performed better
            if eval1.accuracy > eval2.accuracy:
                winner = versions[0]
                status = "improved"
            elif eval2.accuracy > eval1.accuracy:
                winner = versions[1]
                status = "improved"
            else:
                winner = "tie"
                status = "match"
            
            word_comparisons.append({
                "image_filename": f"image_{image.number}" if image else f"image_{image_id}",
                "word_index": 0,  # Placeholder
                "reference_word": "overall_performance",
                "control_output": f"{eval1.accuracy}% accuracy",
                "variation_output": f"{eval2.accuracy}% accuracy",
                "status": status,
                "error_type": None
            })
    
    # Determine overall winner
    if summary_metrics:
        best_metric = max(summary_metrics, key=lambda x: x["overall_accuracy"])
        winner = best_metric["label"]
        confidence_level = 0.95 if len(summary_metrics) > 1 else 0.5
    else:
        winner = None
        confidence_level = None
    
    return {
        "evaluation_run_id": run_id,
        "summary_metrics": summary_metrics,
        "word_comparisons": word_comparisons,
        "winner": winner,
        "confidence_level": confidence_level
    }

# API Key CRUD operations
async def create_api_key(db: AsyncSession, key_data: APIKeyCreate) -> APIKey:
    import secrets
    import hashlib
    
    # Generate a secure API key
    key = secrets.token_urlsafe(32)
    key_hash = hashlib.sha256(key.encode()).hexdigest()
    
    db_key = APIKey(
        key_name=key_data.key_name,
        key_hash=key_hash,
        key_preview=key[-4:]  # Last 4 characters for display
    )
    
    db.add(db_key)
    await db.commit()
    await db.refresh(db_key)
    
    # Return the key with the actual key value (only time we show it)
    db_key.actual_key = key
    return db_key

async def get_api_keys(db: AsyncSession) -> List[APIKey]:
    result = await db.execute(select(APIKey).where(APIKey.is_active == True).order_by(APIKey.created_at.desc()))
    return result.scalars().all()

async def revoke_api_key(db: AsyncSession, key_id: int) -> bool:
    result = await db.execute(select(APIKey).where(APIKey.id == key_id))
    db_key = result.scalar_one_or_none()
    
    if db_key:
        db_key.is_active = False
        await db.commit()
        return True
    return False

async def get_api_key_usage(db: AsyncSession, key_id: int) -> Optional[Dict[str, Any]]:
    """Get usage statistics for an API key"""
    # This would be implemented with actual usage tracking
    # For now, return placeholder data
    return {
        "api_key_id": key_id,
        "total_calls": 0,
        "calls_today": 0,
        "calls_this_month": 0,
        "error_rate": 0.0,
        "avg_response_time_ms": 0
    }

# Historical Analysis functions
async def get_performance_trends(
    db: AsyncSession, 
    prompt_family_id: Optional[int] = None,
    dataset_id: Optional[int] = None,
    days_back: int = 30
) -> List[Dict[str, Any]]:
    """Get performance trends over time"""
    since_date = datetime.utcnow() - timedelta(days=days_back)
    
    # This would be implemented to analyze historical performance
    # For now, return placeholder data
    return []

async def get_regression_alerts(db: AsyncSession) -> List[Dict[str, Any]]:
    """Get active regression alerts"""
    # This would check for performance regressions
    # For now, return empty list
    return []

async def get_evaluation_run_progress(db: AsyncSession, run_id: int) -> Optional[Dict[str, Any]]:
    """Get real-time progress for an evaluation run"""
    result = await db.execute(select(EvaluationRun).where(EvaluationRun.id == run_id))
    run = result.scalar_one_or_none()
    
    if not run:
        return None
    
    return {
        "evaluation_run_id": run_id,
        "overall_progress": run.progress_percentage,
        "prompt_progress": {},  # Would track progress per prompt
        "current_image": run.current_step,
        "log_entries": []
    } 