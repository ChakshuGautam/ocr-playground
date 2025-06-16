from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from datetime import datetime
import json

DATABASE_URL = "sqlite+aiosqlite:///./ocr_evaluations.db"

engine = create_async_engine(DATABASE_URL, echo=True)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()

class Image(Base):
    __tablename__ = "images"
    
    id = Column(Integer, primary_key=True, index=True)
    number = Column(String, unique=True, index=True)  # Original image number from CSV
    url = Column(String)
    local_path = Column(String)
    reference_text = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    evaluations = relationship("Evaluation", back_populates="image")

class Evaluation(Base):
    __tablename__ = "evaluations"
    
    id = Column(Integer, primary_key=True, index=True)
    image_id = Column(Integer, ForeignKey("images.id"))
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
    
    # Store word evaluations as JSON
    word_evaluations_json = Column(Text)  # JSON string of word evaluations
    
    # Relationships
    image = relationship("Image", back_populates="evaluations")
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