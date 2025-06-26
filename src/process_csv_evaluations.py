#!/usr/bin/env python3
"""
Script to process CSV data and run OCR evaluations using Gemini OCR.
Processes each row in the CSV, calls extract_text function, and saves results.
"""

import csv
import json
import os
import tempfile
import re
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
    
    def _clean_word(self, word: str) -> str:
        """Remove dots, poorna virams, and normalize spaces."""
        return re.sub(r"[।.]", "", word).strip()
    
    def _split_words(self, text: str) -> List[str]:
        """Remove newlines, normalize spaces, and split by space."""
        words = text.replace("\n", " ").split()
        return [self._clean_word(w) for w in words if self._clean_word(w)]
    
    def _calculate_word_accuracy(self, human_text: str, ocr_text: str) -> Dict[str, Any]:
        """
        Calculate word-by-word accuracy between human evaluation text and OCR text.
        
        Args:
            human_text: Human evaluation text (ground truth)
            ocr_text: Text extracted by OCR
            
        Returns:
            Dictionary with accuracy metrics
        """
        human_words = self._split_words(human_text)
        ocr_words = self._split_words(ocr_text)
        
        # Compare word by word (up to the length of the shorter one)
        correct = sum(h == o for h, o in zip(human_words, ocr_words))
        total = len(human_words)
        accuracy = correct / total * 100 if total else 0
        
        return {
            "correct_words": correct,
            "total_words": total,
            "accuracy": accuracy,
            "human_words": human_words,
            "ocr_words": ocr_words
        }
    
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
            "individual_results": [],
            "word_comparison_stats": {
                "total_words": 0,
                "total_correct_words": 0,
                "average_accuracy": 0.0,
                "per_file_summary": []
            }
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
                            
                            # Gemini OCR metrics
                            gemini_accuracy = result["evaluation"]["metrics"]["accuracy"]
                            gemini_total_words = result["evaluation"]["metrics"]["total_words"]
                            gemini_correct_words = result["evaluation"]["metrics"]["correct_words"]
                            
                            # Word comparison metrics
                            word_comp = self._calculate_word_accuracy(
                                human_evaluation_text, 
                                result["evaluation"]["full_text"]
                            )
                            
                            overall_stats["individual_results"].append({
                                "image_number": image_number,
                                "gemini_accuracy": gemini_accuracy,
                                "gemini_total_words": gemini_total_words,
                                "gemini_correct_words": gemini_correct_words,
                                "word_comparison_accuracy": word_comp["accuracy"],
                                "word_comparison_total_words": word_comp["total_words"],
                                "word_comparison_correct_words": word_comp["correct_words"]
                            })
                            
                            # Update Gemini OCR overall statistics
                            overall_stats["total_words"] += gemini_total_words
                            overall_stats["total_correct_words"] += gemini_correct_words
                            
                            # Update word comparison overall statistics
                            overall_stats["word_comparison_stats"]["total_words"] += word_comp["total_words"]
                            overall_stats["word_comparison_stats"]["total_correct_words"] += word_comp["correct_words"]
                            
                            # Add to per-file summary for word comparison
                            overall_stats["word_comparison_stats"]["per_file_summary"].append({
                                "file": f"image_{image_number}.json",
                                "correct": word_comp["correct_words"],
                                "total": word_comp["total_words"],
                                "accuracy": word_comp["accuracy"]
                            })
                            
                        else:
                            overall_stats["failed_evaluations"] += 1
                        
                        overall_stats["total_images"] += 1
                        
                    except Exception as e:
                        logger.error(f"Error processing row {row_num}: {e}")
                        overall_stats["failed_evaluations"] += 1
                        overall_stats["total_images"] += 1
                        continue
                
                # Calculate average accuracies
                if overall_stats["successful_evaluations"] > 0:
                    # Gemini OCR average accuracy
                    overall_stats["average_accuracy"] = (
                        overall_stats["total_correct_words"] / overall_stats["total_words"]
                    ) * 100
                    
                    # Word comparison average accuracy
                    if overall_stats["word_comparison_stats"]["total_words"] > 0:
                        overall_stats["word_comparison_stats"]["average_accuracy"] = (
                            overall_stats["word_comparison_stats"]["total_correct_words"] / 
                            overall_stats["word_comparison_stats"]["total_words"]
                        ) * 100
                
                # Save overall statistics
                self._save_overall_stats(overall_stats)
                
                logger.info(f"Processing completed. Success: {overall_stats['successful_evaluations']}, "
                           f"Failed: {overall_stats['failed_evaluations']}, "
                           f"Gemini Avg Accuracy: {overall_stats['average_accuracy']:.2f}%, "
                           f"Word Comparison Avg Accuracy: {overall_stats['word_comparison_stats']['average_accuracy']:.2f}%")
                
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
                       f"Gemini Accuracy: {result['evaluation']['metrics']['accuracy']:.2f}%")
            
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
        print("\n" + "="*60)
        print("EVALUATION SUMMARY")
        print("="*60)
        print(f"Total Images Processed: {overall_stats['total_images']}")
        print(f"Successful Evaluations: {overall_stats['successful_evaluations']}")
        print(f"Failed Evaluations: {overall_stats['failed_evaluations']}")
        print()
        print("GEMINI OCR METRICS:")
        print(f"  Total Words: {overall_stats['total_words']}")
        print(f"  Total Correct Words: {overall_stats['total_correct_words']}")
        print(f"  Average Accuracy: {overall_stats['average_accuracy']:.2f}%")
        print()
        print("WORD COMPARISON METRICS:")
        print(f"  Total Words: {overall_stats['word_comparison_stats']['total_words']}")
        print(f"  Total Correct Words: {overall_stats['word_comparison_stats']['total_correct_words']}")
        print(f"  Average Accuracy: {overall_stats['word_comparison_stats']['average_accuracy']:.2f}%")
        print()
        print(f"Results saved in: {output_dir}/")
        print("="*60)
        
    except Exception as e:
        logger.error(f"Failed to process CSV: {e}")
        raise


if __name__ == "__main__":
    main() 