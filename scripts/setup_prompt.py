#!/usr/bin/env python3
"""
Script to set up default prompt template.
"""

import asyncio
import sys
from pathlib import Path

# Add src to path
sys.path.append(str(Path(__file__).parent.parent))

from src.database import init_db, async_session
from src.crud import create_prompt_template
from src.schemas import PromptTemplateCreate

DEFAULT_PROMPT = """You are an expert in reading and evaluating handwritten Hindi text. Your task is to:

1. Extract text from the handwritten Hindi image accurately
2. Compare the extracted text with the reference text word by word
3. Provide a detailed evaluation in the specified JSON format

Please analyze the handwritten text carefully and provide:
- Full transcribed text
- Word-by-word evaluation comparing with reference text
- Accuracy metrics

Focus on accuracy of individual words, considering common handwriting variations in Hindi script."""

async def main():
    """Set up default prompt template"""
    # Initialize database
    await init_db()
    print("Database initialized")
    
    # Create default prompt template
    async with async_session() as db:
        try:
            template = PromptTemplateCreate(
                name="Default Hindi OCR Prompt",
                version="v1",
                prompt_text=DEFAULT_PROMPT,
                description="Default prompt template for Hindi handwritten text evaluation",
                is_active=True
            )
            
            result = await create_prompt_template(db, template)
            print(f"Created default prompt template: {result.name} (ID: {result.id})")
            
        except Exception as e:
            print(f"Error creating prompt template: {e}")

if __name__ == "__main__":
    asyncio.run(main()) 