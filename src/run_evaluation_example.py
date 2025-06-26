#!/usr/bin/env python3
"""
Example script to run OCR evaluations on the dummy CSV data.
This script demonstrates how to use the CSVEvaluationProcessor.
"""

import os
import sys
from pathlib import Path

# Add the src directory to the Python path
sys.path.append(str(Path(__file__).parent))

from process_csv_evaluations import CSVEvaluationProcessor

def main():
    """Run evaluation on dummy CSV data."""
    
    # Configuration
    # Make sure the CSV file is in the correct location
    csv_file_path = "csv_data.csv"
    
    # Check if CSV file exists
    if not os.path.exists(csv_file_path):
        print(f"Error: CSV file '{csv_file_path}' not found!")
        print("Please make sure the dummy_csv_data.csv file is in the same directory as this script.")
        return
    
    # Output directory for results
    output_dir = "evaluation_results"
    
    try:
        print("Starting CSV evaluation processing...")
        print(f"CSV file: {csv_file_path}")
        print(f"Output directory: {output_dir}")
        print("-" * 50)
        
        # Create processor and run evaluation
        processor = CSVEvaluationProcessor(csv_file_path, output_dir)
        overall_stats = processor.process_csv()
        
        # Print detailed summary
        print("\n" + "="*60)
        print("EVALUATION SUMMARY")
        print("="*60)
        print(f"Total Images Processed: {overall_stats['total_images']}")
        print(f"Successful Evaluations: {overall_stats['successful_evaluations']}")
        print(f"Failed Evaluations: {overall_stats['failed_evaluations']}")
        print(f"Total Words: {overall_stats['total_words']}")
        print(f"Total Correct Words: {overall_stats['total_correct_words']}")
        print(f"Average Accuracy: {overall_stats['average_accuracy']:.2f}%")
        print(f"Processing Timestamp: {overall_stats['processing_timestamp']}")
        print(f"Results saved in: {output_dir}/")
        
        # Print individual results
        if overall_stats['individual_results']:
            print("\nIndividual Results:")
            print("-" * 40)
            for result in overall_stats['individual_results']:
                print(f"Image {result['image_number']}: "
                      f"Accuracy: {result['accuracy']:.2f}% "
                      f"({result['correct_words']}/{result['total_words']} words correct)")
        
        print("="*60)
        print("Processing completed successfully!")
        
    except Exception as e:
        print(f"Error: {e}")
        print("Make sure you have:")
        print("1. Set up your GOOGLE_API_KEY environment variable")
        print("2. Installed all required dependencies")
        print("3. The dummy_csv_data.csv file is in the correct location")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main()) 