import csv
import os
import requests
import json
from datetime import datetime
import shutil
import logging
from typing import Dict, List, Optional, Tuple
from pathlib import Path
import asyncio
import aiohttp
from src.gemini_ocr import GeminiOCR

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('ocr_processing.log'),
        logging.StreamHandler()
    ]
)

class OcrOrchestrator:
    """Async orchestrator for OCR evaluations."""
    
    def __init__(self):
        """Initialize the OCR orchestrator."""
        # Set up directories relative to the workspace root
        workspace_root = Path(os.getcwd())
        self.images_dir = workspace_root / "images"
        self.evaluations_dir = workspace_root / "evaluations"
        
        # Create necessary directories
        for directory in [self.images_dir, self.evaluations_dir]:
            directory.mkdir(parents=True, exist_ok=True)
        
        # Initialize OCR
        try:
            logging.info("Initializing GeminiOCR...")
            self.ocr = GeminiOCR()
            logging.info("GeminiOCR initialized successfully")
        except Exception as e:
            logging.error(f"Failed to initialize GeminiOCR: {str(e)}")
            raise
        
        logging.info("Initialized OcrOrchestrator")
    
    async def download_image_async(self, url: str, image_id: str) -> Optional[str]:
        """Download image asynchronously"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url) as response:
                    response.raise_for_status()
                    
                    # Create unique filename
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    filename = f"image_{image_id}_{timestamp}.jpg"
                    filepath = self.images_dir / filename
                    
                    # Write file
                    with open(filepath, 'wb') as f:
                        async for chunk in response.content.iter_chunked(8192):
                            f.write(chunk)
                    
                    logging.info(f"Downloaded image {image_id} to {filepath}")
                    return str(filepath)
                    
        except Exception as e:
            logging.error(f"Failed to download image {image_id}: {str(e)}")
            return None
    
    async def process_single_evaluation(self, image_url: str, reference_text: str, image_number: str) -> Dict:
        """Process a single image evaluation asynchronously"""
        try:
            logging.info(f"Processing evaluation for image {image_number}")
            
            # Download image
            local_image_path = await self.download_image_async(image_url, image_number)
            if not local_image_path:
                return {
                    'success': False,
                    'error': 'Failed to download image'
                }
            
            # Run OCR in thread pool since it's sync
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                None, 
                self.ocr.extract_text, 
                local_image_path, 
                reference_text
            )
            
            if not result:
                return {
                    'success': False,
                    'error': 'OCR returned no result'
                }
            
            # Return evaluation data
            return {
                'success': True,
                'evaluation': {
                    'full_text': result.get('full_text', ''),
                    'word_evaluations': result.get('evaluations', []),
                    'accuracy': result.get('accuracy', 0),
                    'correct_words': result.get('correct_words', 0),
                    'total_words': result.get('total_words', 0)
                },
                'local_image_path': local_image_path
            }
            
        except Exception as e:
            logging.error(f"Error processing evaluation for image {image_number}: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }

# Maintain backward compatibility with existing ImageProcessor
class ImageProcessor:
    """Orchestrator for processing images from a CSV file using Gemini OCR."""
    
    def __init__(self, csv_path: str, max_retries: int = 3):
        """
        Initialize the image processor.
        
        Args:
            csv_path: Path to the CSV file containing image URLs
            max_retries: Maximum number of retries for failed processing
        """
        self.csv_path = csv_path
        self.max_retries = max_retries
        
        # Set up directories relative to the workspace root
        workspace_root = Path(os.getcwd())
        self.images_dir = workspace_root / "images"
        self.evaluations_dir = workspace_root / "evaluations"
        self.failed_dir = workspace_root / "failed"
        
        # Create necessary directories
        for directory in [self.images_dir, self.evaluations_dir, self.failed_dir]:
            directory.mkdir(parents=True, exist_ok=True)
        
        # Initialize OCR
        self.ocr = GeminiOCR()
        
        # Track processing statistics
        self.stats = {
            'total': 0,
            'successful': 0,
            'failed': 0,
            'retries': 0
        }
        
        # Track failed entries for retry
        self.failed_entries: List[Dict] = []
        
        logging.info(f"Initialized ImageProcessor with CSV: {csv_path}")
        logging.info(f"Images directory: {self.images_dir}")
        logging.info(f"Evaluations directory: {self.evaluations_dir}")
        logging.info(f"Max retries: {self.max_retries}")
    
    def download_image(self, url: str, image_id: str) -> Optional[str]:
        """Download image and save with unique name"""
        try:
            response = requests.get(url, stream=True)
            response.raise_for_status()
            
            # Create unique filename using image ID and timestamp
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"image_{image_id}_{timestamp}.jpg"
            filepath = self.images_dir / filename
            
            with open(filepath, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            logging.info(f"Successfully downloaded image {image_id} to {filepath}")
            return str(filepath)
            
        except Exception as e:
            logging.error(f"Failed to download image {image_id}: {str(e)}")
            return None
    
    def save_evaluation_json(self, image_number: str, image_url: str, reference_text: str, 
                           transcribed_text: str, evaluations: List[Dict], local_image_path: str) -> str:
        """Save evaluation results to JSON file"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"evaluation_{image_number}_{timestamp}.json"
        filepath = self.evaluations_dir / filename
        
        # Calculate accuracy metrics
        total_words = len(evaluations)
        correct_words = sum(1 for eval in evaluations if eval['match'])
        accuracy = (correct_words / total_words) * 100 if total_words > 0 else 0
        
        data = {
            "image_info": {
                "number": image_number,
                "url": image_url,
                "reference_text": reference_text,
                "timestamp": timestamp,
                "local_image_path": str(Path(local_image_path).relative_to(self.images_dir))
            },
            "evaluation": {
                "full_text": transcribed_text,
                "word_evaluations": evaluations,
                "metrics": {
                    "total_words": total_words,
                    "correct_words": correct_words,
                    "accuracy": accuracy
                }
            }
        }
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        logging.info(f"Saved evaluation for image {image_number} to {filepath}")
        return filename
    
    def process_single_image(self, row: Dict, retry_count: int = 0) -> Tuple[bool, Dict]:
        """Process a single image with retry logic"""
        image_number = row['#']
        image_url = row['Link']
        reference_text = row['Text']
        
        logging.info(f"Processing image {image_number} (attempt {retry_count + 1}/{self.max_retries})")
        
        try:
            # Download image
            local_image_path = self.download_image(image_url, image_number)
            if not local_image_path:
                raise Exception("Failed to download image")
            
            # Process image
            result = self.ocr.extract_text(local_image_path, reference_text)
            if not result:
                raise Exception("OCR returned no result")
            
            # Save evaluation
            evaluation_file = self.save_evaluation_json(
                image_number, image_url, reference_text,
                result['full_text'], result['evaluations'],
                local_image_path
            )
            
            # Update row with results
            row['OCR Output (Gemini - Flash)'] = result['full_text']
            row['Word Evaluations'] = json.dumps(result['evaluations'], ensure_ascii=False)
            row['Accuracy'] = f"{result['accuracy']:.2f}%"
            row['Correct Words'] = result['correct_words']
            row['Total Words'] = result['total_words']
            row['Evaluation JSON'] = evaluation_file
            row['Local Image'] = str(Path(local_image_path).relative_to(self.images_dir))
            
            logging.info(f"Successfully processed image {image_number}")
            return True, row
            
        except Exception as e:
            logging.error(f"Error processing image {image_number}: {str(e)}")
            
            if retry_count < self.max_retries - 1:
                logging.info(f"Retrying image {image_number} (attempt {retry_count + 2})")
                return self.process_single_image(row, retry_count + 1)
            else:
                # Move failed image to failed directory if it exists
                if 'local_image_path' in locals() and os.path.exists(local_image_path):
                    failed_path = self.failed_dir / Path(local_image_path).name
                    shutil.move(local_image_path, failed_path)
                    row['Local Image'] = str(failed_path.relative_to(self.images_dir))
                
                row['Processing Status'] = f"Failed after {self.max_retries} attempts: {str(e)}"
                return False, row
    
    def process_csv(self):
        """Process all images in CSV with retry logic"""
        logging.info("Starting CSV processing")
        
        # Read CSV
        with open(self.csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            rows = list(reader)
        
        self.stats['total'] = len(rows)
        logging.info(f"Found {self.stats['total']} images to process")
        
        # Process each row
        processed_rows = []
        for row in rows:
            success, processed_row = self.process_single_image(row)
            processed_rows.append(processed_row)
            
            if success:
                self.stats['successful'] += 1
            else:
                self.stats['failed'] += 1
                self.failed_entries.append(processed_row)
        
        # Save updated CSV
        output_csv = f"{os.path.splitext(self.csv_path)[0]}_updated.csv"
        with open(output_csv, 'w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=processed_rows[0].keys())
            writer.writeheader()
            writer.writerows(processed_rows)
        
        # Save failed entries for retry
        if self.failed_entries:
            failed_csv = f"{os.path.splitext(self.csv_path)[0]}_failed.csv"
            with open(failed_csv, 'w', encoding='utf-8', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=self.failed_entries[0].keys())
                writer.writeheader()
                writer.writerows(self.failed_entries)
        
        # Log summary
        logging.info("\nProcessing Summary:")
        logging.info(f"Total images: {self.stats['total']}")
        logging.info(f"Successfully processed: {self.stats['successful']}")
        logging.info(f"Failed: {self.stats['failed']}")
        logging.info(f"Total retries: {self.stats['retries']}")
        
        if self.failed_entries:
            logging.info(f"\nFailed entries saved to: {failed_csv}")
            logging.info("Failed entries can be retried by running the script again with the failed CSV")
        
        logging.info(f"\nUpdated CSV saved to: {output_csv}")
        logging.info(f"Evaluations saved to: {self.evaluations_dir}")
        logging.info(f"Images saved to: {self.images_dir}")
        if self.failed_entries:
            logging.info(f"Failed images saved to: {self.failed_dir}")

def main():
    import sys
    if len(sys.argv) != 2:
        print("Usage: python -m src.orchestrator <csv_file>")
        sys.exit(1)
    
    csv_path = sys.argv[1]
    processor = ImageProcessor(csv_path)
    processor.process_csv()

if __name__ == "__main__":
    main() 