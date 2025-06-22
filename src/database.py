from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey, Table, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from datetime import datetime
import json

DATABASE_URL = "sqlite+aiosqlite:///./ocr_evaluations.db"

engine = create_async_engine(DATABASE_URL, echo=True)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()

# Association tables for many-to-many relationships
evaluation_run_datasets = Table(
    'evaluation_run_datasets',
    Base.metadata,
    Column('evaluation_run_id', Integer, ForeignKey('evaluation_runs.id')),
    Column('dataset_id', Integer, ForeignKey('datasets.id'))
)

dataset_images = Table(
    'dataset_images',
    Base.metadata,
    Column('dataset_id', Integer, ForeignKey('datasets.id')),
    Column('image_id', Integer, ForeignKey('images.id'))
)

class Dataset(Base):
    __tablename__ = "datasets"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(Text)
    status = Column(String, default="draft")  # draft, validated, archived
    image_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_used = Column(DateTime, nullable=True)
    user_id = Column(String, index=True)  # Clerk user ID
    
    # Relationships
    images = relationship("Image", secondary=dataset_images, back_populates="datasets")
    evaluation_runs = relationship("EvaluationRun", secondary=evaluation_run_datasets, back_populates="datasets")

class PromptFamily(Base):
    __tablename__ = "prompt_families"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(Text)
    tags = Column(JSON)  # Store as JSON array
    production_version = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    user_id = Column(String, index=True)  # Clerk user ID
    
    # Relationships
    versions = relationship("PromptVersion", back_populates="family")

class PromptVersion(Base):
    __tablename__ = "prompt_versions"
    
    id = Column(Integer, primary_key=True, index=True)
    family_id = Column(Integer, ForeignKey("prompt_families.id"))
    version = Column(String, index=True)  # e.g., "1.2.1"
    prompt_text = Column(Text)
    changelog_message = Column(Text)
    status = Column(String, default="draft")  # draft, staging, production, archived
    author = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_evaluation_accuracy = Column(Float, nullable=True)
    user_id = Column(String, index=True)  # Clerk user ID
    
    # Relationships
    family = relationship("PromptFamily", back_populates="versions")
    evaluation_runs = relationship("EvaluationRunPrompt", back_populates="prompt_version")

class EvaluationRun(Base):
    __tablename__ = "evaluation_runs"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text)
    hypothesis = Column(Text)
    status = Column(String, default="pending")  # pending, processing, success, failed
    progress_percentage = Column(Integer, default=0)
    current_step = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    user_id = Column(String, index=True)  # Clerk user ID
    
    # Relationships
    datasets = relationship("Dataset", secondary=evaluation_run_datasets, back_populates="evaluation_runs")
    prompt_configurations = relationship("EvaluationRunPrompt", back_populates="evaluation_run")
    evaluations = relationship("Evaluation", back_populates="evaluation_run")

class EvaluationRunPrompt(Base):
    __tablename__ = "evaluation_run_prompts"
    
    id = Column(Integer, primary_key=True, index=True)
    evaluation_run_id = Column(Integer, ForeignKey("evaluation_runs.id"))
    prompt_version_id = Column(Integer, ForeignKey("prompt_versions.id"))
    label = Column(String)  # e.g., "Control (A)", "Variation (B)"
    
    # Relationships
    evaluation_run = relationship("EvaluationRun", back_populates="prompt_configurations")
    prompt_version = relationship("PromptVersion", back_populates="evaluation_runs")

class APIKey(Base):
    __tablename__ = "api_keys"
    
    id = Column(Integer, primary_key=True, index=True)
    key_name = Column(String, index=True)
    key_hash = Column(String, unique=True)  # Store hashed key
    key_preview = Column(String)  # Last 4 characters for display
    created_at = Column(DateTime, default=datetime.utcnow)
    last_used = Column(DateTime, nullable=True)
    usage_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    user_id = Column(String, index=True)  # Clerk user ID

class Image(Base):
    __tablename__ = "images"
    
    id = Column(Integer, primary_key=True, index=True)
    number = Column(String, unique=True, index=True)  # Original image number from CSV
    url = Column(String)
    local_path = Column(String)
    reference_text = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user_id = Column(String, index=True)  # Clerk user ID
    
    # Relationships
    evaluations = relationship("Evaluation", back_populates="image")
    datasets = relationship("Dataset", secondary=dataset_images, back_populates="images")

class Evaluation(Base):
    __tablename__ = "evaluations"
    
    id = Column(Integer, primary_key=True, index=True)
    image_id = Column(Integer, ForeignKey("images.id"))
    evaluation_run_id = Column(Integer, ForeignKey("evaluation_runs.id"), nullable=True)
    prompt_version = Column(String, default="v1")  # Track different prompt versions
    ocr_output = Column(Text)
    accuracy = Column(Float)
    correct_words = Column(Integer)
    total_words = Column(Integer)
    processing_status = Column(String, default="pending")  # pending, processing, success, failed
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Progress tracking fields
    progress_percentage = Column(Integer, default=0)  # 0-100
    current_step = Column(String, nullable=True)  # Current processing step
    estimated_completion = Column(DateTime, nullable=True)
    
    # Performance metrics
    latency_ms = Column(Integer, nullable=True)
    cost_estimate = Column(Float, nullable=True)
    
    # Store word evaluations as JSON
    word_evaluations_json = Column(Text)  # JSON string of word evaluations
    
    # Relationships
    image = relationship("Image", back_populates="evaluations")
    evaluation_run = relationship("EvaluationRun", back_populates="evaluations")
    word_evaluations = relationship("WordEvaluation", back_populates="evaluation")

class WordEvaluation(Base):
    __tablename__ = "word_evaluations"
    
    id = Column(Integer, primary_key=True, index=True)
    evaluation_id = Column(Integer, ForeignKey("evaluations.id"))
    reference_word = Column(String)
    transcribed_word = Column(String, nullable=True)
    match = Column(Boolean)
    reason_diff = Column(Text)
    word_position = Column(Integer)  # Position in the text
    
    # Relationships
    evaluation = relationship("Evaluation", back_populates="word_evaluations")

class PromptTemplate(Base):
    __tablename__ = "prompt_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    version = Column(String)
    prompt_text = Column(Text)
    is_active = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    description = Column(Text, nullable=True)
    user_id = Column(String, index=True)  # Clerk user ID

async def init_db():
    """Initialize the database and create all tables"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

async def get_db():
    """Dependency to get database session"""
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close() 