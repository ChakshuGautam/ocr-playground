import pandas as pd
import json
import os
from pathlib import Path

def update_csv_with_evaluation_results():
    """
    Update the CSV file with OCR text and metrics from evaluation results
    """
    # Read the original CSV
    csv_path = "csv_data.csv"
    df = pd.read_csv(csv_path)
    
    # Initialize new columns
    df['OCR_Text'] = ''
    df['Total_Words'] = 0
    df['Correct_Words'] = 0
    df['Wrong_Words'] = 0
    df['Accuracy_Percentage'] = 0.0
    
    # Path to evaluation results
    results_dir = Path("evaluation_results")
    
    # --- Load result.json and build lookup for per_file_summary ---
    result_json_path = results_dir / "result.json"
    per_file_lookup = {}
    if result_json_path.exists():
        with open(result_json_path, "r", encoding="utf-8") as f:
            result_data = json.load(f)
            per_file_summary = result_data.get("word_comparison_stats", {}).get("per_file_summary", [])
            per_file_lookup = {entry["file"]: entry for entry in per_file_summary}
    else:
        print("result.json not found in evaluation_results directory.")
    
    # Process each row
    for index, row in df.iterrows():
        image_number = str(row['#'])
        json_file = results_dir / f"image_{image_number}.json"
        image_filename = f"image_{image_number}.json"
        
        # Extract OCR text from the individual image JSON
        if json_file.exists():
            try:
                with open(json_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                # Extract OCR text
                ocr_text = ""
                if 'evaluation' in data:
                    evaluation = data['evaluation']
                    ocr_text = evaluation.get('full_text', '')
                df.at[index, 'OCR_Text'] = ocr_text
            except Exception as e:
                print(f"Error processing image {image_number}: {e}")
        else:
            print(f"JSON file not found for image {image_number}")
        
        # Extract word comparison stats from result.json
        matched = per_file_lookup.get(image_filename)
        if matched:
            total = matched.get('total', 0)
            correct = matched.get('correct', 0)
            accuracy = matched.get('accuracy', 0.0)
            wrong = total - correct
            df.at[index, 'Total_Words'] = total
            df.at[index, 'Correct_Words'] = correct
            df.at[index, 'Wrong_Words'] = wrong
            df.at[index, 'Accuracy_Percentage'] = accuracy
            print(f"Processed image {image_number}: {accuracy:.1f}% accuracy (from result.json)")
        else:
            print(f"No matching per_file_summary for {image_filename}")
    
    # Save the updated CSV
    output_path = "csv_data_with_results.csv"
    df.to_csv(output_path, index=False, encoding='utf-8')
    print(f"\nUpdated CSV saved as: {output_path}")
    
    # Display summary statistics
    print("\n=== SUMMARY STATISTICS ===")
    print(f"Total images processed: {len(df)}")
    print(f"Average accuracy: {df['Accuracy_Percentage'].mean():.2f}%")
    print(f"Highest accuracy: {df['Accuracy_Percentage'].max():.2f}%")
    print(f"Lowest accuracy: {df['Accuracy_Percentage'].min():.2f}%")
    
    # Show accuracy distribution
    print("\n=== ACCURACY DISTRIBUTION ===")
    accuracy_ranges = [
        (0, 25, "0-25%"),
        (25, 50, "25-50%"),
        (50, 75, "50-75%"),
        (75, 90, "75-90%"),
        (90, 101, "90-100%")
    ]
    
    for min_acc, max_acc, label in accuracy_ranges:
        count = len(df[(df['Accuracy_Percentage'] >= min_acc) & (df['Accuracy_Percentage'] < max_acc)])
        print(f"{label}: {count} images")
    
    return df

if __name__ == "__main__":
    df = update_csv_with_evaluation_results()