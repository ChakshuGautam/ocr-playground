#!/usr/bin/env python3
"""
Script to process CSV data and run OCR evaluations using Gemini OCR.
Processes each row in the CSV, calls extract_text function, and saves results.
"""

import csv
import json
import os
import tempfile
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any
import logging
import requests
from PIL import Image
from io import BytesIO

from gemini_ocr import GeminiOCR

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class CSVEvaluationProcessor:
    """Process CSV data and run OCR evaluations."""
    
    def __init__(self, csv_file_path: str, output_dir: str = "evaluation_results"):
        """
        Initialize the processor.
        
        Args:
            csv_file_path: Path to the CSV file containing image data
            output_dir: Directory to save evaluation results
        """
        self.csv_file_path = csv_file_path
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        # Initialize Gemini OCR
        try:
            self.ocr = GeminiOCR()
            logger.info("Gemini OCR initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Gemini OCR: {e}")
            raise
    
    def _download_image(self, image_url: str) -> Image.Image:
        """
        Download image from URL and return as PIL Image.
        
        Args:
            image_url: URL of the image to download
            
        Returns:
            PIL Image object
            
        Raises:
            Exception: If download fails
        """
        try:
            logger.debug(f"Downloading image from: {image_url}")
            response = requests.get(image_url, timeout=30)
            response.raise_for_status()
            
            # Convert to PIL Image
            image = Image.open(BytesIO(response.content))
            logger.debug(f"Successfully downloaded image: {image.size} {image.mode}")
            return image
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to download image from {image_url}: {e}")
            raise Exception(f"Download failed: {e}")
        except Exception as e:
            logger.error(f"Error processing downloaded image from {image_url}: {e}")
            raise Exception(f"Image processing failed: {e}")
    
    def process_csv(self) -> Dict[str, Any]:
        """
        Process the CSV file row by row and run evaluations.
        
        Returns:
            Dictionary containing overall statistics
        """
        overall_stats = {
            "total_images": 0,
            "successful_evaluations": 0,
            "failed_evaluations": 0,
            "total_words": 0,
            "total_correct_words": 0,
            "average_accuracy": 0.0,
            "processing_timestamp": datetime.now().strftime("%Y%m%d_%H%M%S"),
            "individual_results": []
        }
        
        try:
            with open(self.csv_file_path, 'r', encoding='utf-8') as file:
                csv_reader = csv.DictReader(file)
                
                for row_num, row in enumerate(csv_reader, start=1):
                    logger.info(f"Processing row {row_num}: Image {row.get('#', 'Unknown')}")
                    
                    try:
                        # Extract data from CSV row
                        image_number = row.get('#', str(row_num))
                        image_url = row.get('Link', '').strip()
                        reference_text = row.get('Text', '').strip()
                        human_evaluation_text = row.get('Human Evaluation Text', '').strip()
                        
                        if not image_url or not human_evaluation_text:
                            logger.warning(f"Row {row_num}: Missing required data (URL or Human Evaluation Text)")
                            overall_stats["failed_evaluations"] += 1
                            continue
                        
                        # Run OCR evaluation
                        result = self._process_single_image(
                            image_number, image_url, reference_text, human_evaluation_text
                        )
                        
                        if result:
                            overall_stats["successful_evaluations"] += 1
                            overall_stats["individual_results"].append({
                                "image_number": image_number,
                                "accuracy": result["evaluation"]["metrics"]["accuracy"],
                                "total_words": result["evaluation"]["metrics"]["total_words"],
                                "correct_words": result["evaluation"]["metrics"]["correct_words"]
                            })
                            
                            # Update overall statistics
                            overall_stats["total_words"] += result["evaluation"]["metrics"]["total_words"]
                            overall_stats["total_correct_words"] += result["evaluation"]["metrics"]["correct_words"]
                        else:
                            overall_stats["failed_evaluations"] += 1
                        
                        overall_stats["total_images"] += 1
                        
                    except Exception as e:
                        logger.error(f"Error processing row {row_num}: {e}")
                        overall_stats["failed_evaluations"] += 1
                        overall_stats["total_images"] += 1
                        continue
                
                # Calculate average accuracy
                if overall_stats["successful_evaluations"] > 0:
                    overall_stats["average_accuracy"] = (
                        overall_stats["total_correct_words"] / overall_stats["total_words"]
                    ) * 100
                
                # Save overall statistics
                self._save_overall_stats(overall_stats)
                
                logger.info(f"Processing completed. Success: {overall_stats['successful_evaluations']}, "
                           f"Failed: {overall_stats['failed_evaluations']}, "
                           f"Avg Accuracy: {overall_stats['average_accuracy']:.2f}%")
                
                return overall_stats
                
        except FileNotFoundError:
            logger.error(f"CSV file not found: {self.csv_file_path}")
            raise
        except Exception as e:
            logger.error(f"Error reading CSV file: {e}")
            raise
    
    def _process_single_image(
        self, 
        image_number: str, 
        image_url: str, 
        reference_text: str, 
        human_evaluation_text: str
    ) -> Dict[str, Any]:
        """
        Process a single image and save the result.
        
        Args:
            image_number: Image number/ID
            image_url: URL of the image
            reference_text: Reference text from CSV
            human_evaluation_text: Human evaluation text (ground truth)
            
        Returns:
            Dictionary containing the evaluation result or None if failed
        """
        try:
            # Download the image from URL
            logger.info(f"Downloading image {image_number} from URL...")
            pil_image = self._download_image(image_url)
            
            # Run OCR evaluation using the human evaluation text as reference
            logger.info(f"Running OCR evaluation for image {image_number}...")
            ocr_result = self.ocr.extract_text(pil_image, human_evaluation_text)
            
            if "error" in ocr_result:
                logger.error(f"OCR failed for image {image_number}: {ocr_result['error']}")
                return None
            
            # Create the result structure
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            
            result = {
                "image_info": {
                    "number": image_number,
                    "url": image_url,
                    "reference_text": reference_text,
                    "human_evaluation_text": human_evaluation_text,
                    "timestamp": timestamp,
                },
                "evaluation": {
                    "full_text": ocr_result.get("full_text", ""),
                    "word_evaluations": ocr_result.get("evaluations", []),
                    "metrics": {
                        "total_words": ocr_result.get("total_words", 0),
                        "correct_words": ocr_result.get("correct_words", 0),
                        "accuracy": ocr_result.get("accuracy", 0.0)
                    }
                }
            }
            
            # Save individual result to JSON file
            self._save_individual_result(image_number, result)
            
            logger.info(f"Image {image_number} processed successfully. "
                       f"Accuracy: {result['evaluation']['metrics']['accuracy']:.2f}%")
            
            return result
            
        except Exception as e:
            logger.error(f"Error processing image {image_number}: {e}")
            return None
    
    def _save_individual_result(self, image_number: str, result: Dict[str, Any]):
        """Save individual evaluation result to JSON file."""
        filename = f"image_{image_number}.json"
        filepath = self.output_dir / filename
        
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(result, f, indent=2, ensure_ascii=False)
            logger.debug(f"Saved result to {filepath}")
        except Exception as e:
            logger.error(f"Error saving result for image {image_number}: {e}")
    
    def _save_overall_stats(self, stats: Dict[str, Any]):
        """Save overall statistics to result.json."""
        filepath = self.output_dir / "result.json"
        
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(stats, f, indent=2, ensure_ascii=False)
            logger.info(f"Saved overall statistics to {filepath}")
        except Exception as e:
            logger.error(f"Error saving overall statistics: {e}")


def main():
    """Main function to run the CSV evaluation processor."""
    # Configuration
    csv_file_path = "dummy_csv_data.csv"  # Update this path as needed
    output_dir = "evaluation_results"
    
    try:
        # Create processor and run evaluation
        processor = CSVEvaluationProcessor(csv_file_path, output_dir)
        overall_stats = processor.process_csv()
        
        # Print summary
        print("\n" + "="*50)
        print("EVALUATION SUMMARY")
        print("="*50)
        print(f"Total Images Processed: {overall_stats['total_images']}")
        print(f"Successful Evaluations: {overall_stats['successful_evaluations']}")
        print(f"Failed Evaluations: {overall_stats['failed_evaluations']}")
        print(f"Total Words: {overall_stats['total_words']}")
        print(f"Total Correct Words: {overall_stats['total_correct_words']}")
        print(f"Average Accuracy: {overall_stats['average_accuracy']:.2f}%")
        print(f"Results saved in: {output_dir}/")
        print("="*50)
        
    except Exception as e:
        logger.error(f"Failed to process CSV: {e}")
        raise


if __name__ == "__main__":
    main() 