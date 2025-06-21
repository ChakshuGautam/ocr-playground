import json
import os
from pathlib import Path
from typing import Dict, List, Optional, Union

import PIL.Image
from dotenv import load_dotenv
from google import genai
from google.genai import types
from google.genai.errors import APIError
from io import BytesIO
from pydantic import BaseModel, Field
import logging

# Load environment variables
load_dotenv()

class WordEvaluation(BaseModel):
    """Model for word-level evaluation results."""
    reference_word: str
    transcribed_word: Optional[str] = None
    match: bool
    reason_diff: str

class GeminiOCR:
    """A class to handle OCR operations using Google's Gemini API."""
    
    def __init__(self, timeout: int = 60):
        """
        Initialize the Gemini OCR client.
        
        Args:
            timeout: Timeout in seconds for API calls
        """
        self.timeout = timeout
        
        # Check for API key
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            error_msg = "GOOGLE_API_KEY environment variable is not set"
            logging.error(error_msg)
            raise ValueError(error_msg)
        
        logging.info("Initializing Gemini client with API key...")
        self.client = genai.Client(
            api_key=api_key,
            http_options={"timeout": timeout * 1000}
        )
        logging.info("Gemini client initialized successfully")
    
    def _process_image(self, image: Union[PIL.Image.Image, str, Path]) -> types.Part:
        """
        Process an image into a format suitable for the Gemini API.
        
        Args:
            image: Can be a PIL Image, file path (str or Path)
            
        Returns:
            Processed image part for Gemini API
        """
        if isinstance(image, PIL.Image.Image):
            # Handle PIL Image - convert to bytes
            image_bytes = BytesIO()
            image.save(image_bytes, format="WEBP")
            return types.Part.from_bytes(
                data=image_bytes.getvalue(),
                mime_type="image/webp"
            )
        elif isinstance(image, (str, Path)):
            # Handle file path
            file_path = str(image)
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"File not found: {file_path}")
            
            # Upload file to Gemini
            return self.client.files.upload(file=file_path)
        else:
            raise ValueError(
                f"Unsupported image type: {type(image)}. "
                "Supported types: PIL.Image.Image, str, Path"
            )
    
    def extract_text(
        self,
        image: Union[PIL.Image.Image, str, Path],
        reference_text: Optional[str] = None,
    ) -> Dict:
        """
        Extract text from an image using Gemini API and evaluate against reference text if provided.
        
        Args:
            image: The image to process (PIL Image or file path)
            reference_text: Optional reference text to compare against
            
        Returns:
            Dict containing the extracted text and evaluation results
        """
        # Process the image
        media_part = self._process_image(image)
        
        # Use the exact prompt provided
        prompt = """
You are an AI assistant specialized in Optical Character Recognition (OCR) and text comparison for handwritten Hindi. You will be provided with an image containing handwritten Hindi text and a corresponding reference Hindi text that the handwriting is supposed to match.

Your task is to:
1.  **Transcribe:** Accurately transcribe the Hindi words from the provided image. Focus exclusively on Hindi script and words. Ignore any non-Hindi elements.
2.  **Tokenize:** Internally, split both the reference text and your transcribed text into individual words. Word boundaries are typically defined by spaces.
3.  **Compare and Evaluate:** Perform a word-by-word comparison of your transcribed text against the reference text. Your output should be a detailed evaluation for each word based on the sequence in the reference text.

**Input Provided to You:**
*   An image containing the handwritten Hindi text.
*   A string containing the reference Hindi text (this is the ground truth the student was asked to write).

**Output Format (Mandatory):**
You must produce a JSON list of objects. Each object in the list represents the evaluation of a single word from the reference text, in the order they appear. Each object must contain the following keys:

*   `reference_word` (string): The word from the reference text.
*   `transcribed_word` (string/null): The corresponding word or segment transcribed from the image.
    *   If a directly corresponding word is found, provide it.
    *   If the word seems to be part of a merged segment in the transcription (e.g., reference "मत कर" transcribed as "मतकर"), this field might show the merged segment for both reference words involved.
    *   If the word from the reference is entirely missing in the transcription, use `null` or an empty string for this field.
    *   If a word in the image is completely illegible, you can represent it as `"[illegible]"`.
*   `match` (boolean): `true` if the `transcribed_word` (or the relevant part of it) is an exact character-by-character match with the `reference_word` (including all matras and conjunct characters). `false` otherwise.
*   `reason_diff` (string):
    *   If `match` is `true`, this field can be an empty string or a brief confirmation like "Exact match."
    *   If `match` is `false`, provide a concise explanation of the mismatch. Examples include:
        *   "Spelling error: Transcribed '[transcribed]' vs reference '[reference]' (e.g., incorrect matra, different character)."
        *   "Missing matra: e.g., 'ा' missing in '[transcribed]'."
        *   "Extra character: e.g., additional 'र्' in '[transcribed]'."
        *   "Word missing: Reference word '[reference]' not found in transcription at this position."
        *   "Segmentation error: Reference '[reference]' appears merged in transcription (e.g., as part of '[merged_transcribed_segment]')."
        *   "Segmentation error: Reference '[reference]' appears split in transcription."
        *   "Illegible word in transcription."

**Detailed Instructions for Comparison and Evaluation:**
*   **Sequential Evaluation:** Iterate through the words of the reference text in order. For each `reference_word`, identify its corresponding counterpart(s) or absence in your transcribed text.
*   **Accuracy:** The comparison must be exact. Differences in matras (vowel signs), anusvara, visarga, chandrabindu, and base characters constitute a mismatch.
*   **Word Segmentation:**
    *   If the student merges words that are separate in the reference (e.g., reference "मत कर", transcribed "मतकर"), then for `reference_word: "मत"`, the `transcribed_word` could be "मतकर", `match: false`, and `reason_diff` should explain the merge. Similarly for `reference_word: "कर"`.
    *   If the student splits a word that is single in the reference, adapt the `reason_diff` accordingly.
*   **Missing/Extra Words:**
    *   If a reference word is missing from the transcription, indicate this clearly.
    *   If the transcription contains extra words not present in the reference text, these should ideally be noted after all reference words have been evaluated, perhaps as additional entries with `reference_word: null` or by detailing them in the `reason_diff` of a nearby word if they disrupt the alignment significantly. For simplicity, prioritize evaluating against the reference words first.

**Example (Conceptual):**
If Reference Text is: `हर पल`
And Transcribed Text from image is: `हर पल`
Output:
```json
[
  {
    "reference_word": "हर",
    "transcribed_word": "हर",
    "match": true,
    "reason_diff": "Exact match."
  },
  {
    "reference_word": "पल",
    "transcribed_word": "पल",
    "match": true,
    "reason_diff": "Exact match."
  }
]
```

If Reference Text is: लड़ाई
And Transcribed Text from image is: लड़ई
Output:
```json
[
  {
    "reference_word": "लड़ाई",
    "transcribed_word": "लड़ई",
    "match": false,
    "reason_diff": "Spelling error: Transcribed 'लड़ई' is missing the 'ा' (aa) matra found in 'लड़ाई'."
  }
]
```

If Reference Text is: उस तट पर
And Transcribed Text from image is: उस पर (student missed "तट")
Output:
```json
[
  {
    "reference_word": "उस",
    "transcribed_word": "उस",
    "match": true,
    "reason_diff": "Exact match."
  },
  {
    "reference_word": "तट",
    "transcribed_word": null,
    "match": false,
    "reason_diff": "Word missing: Reference word 'तट' not found in transcription at this position."
  },
  {
    "reference_word": "पर",
    "transcribed_word": "पर",
    "match": true,
    "reason_diff": "Exact match."
  }
]
```

Begin by transcribing the provided image, then proceed to the word-by-word evaluation against the reference text, structuring your final output strictly in the JSON format specified.
"""
        
        if reference_text:
            prompt = f"Reference Text: {reference_text}\n\n{prompt}"
        
        try:
            # Prepare configuration
            config = {
                "temperature": 0,
                "response_mime_type": "application/json",
            }
            
            # Make the API call
            response = self.client.models.generate_content(
                model="gemini-2.0-flash-exp",
                contents=[media_part, prompt],
                config=config,
            )
            
            # Extract and parse the response
            output = response.candidates[0].content.parts[0].text
            evaluations = json.loads(output)
            
            # Validate evaluations against our schema
            word_evaluations = [WordEvaluation(**eval_data) for eval_data in evaluations]
            
            # Construct the full text from transcribed words
            transcribed_words = []
            for eval in word_evaluations:
                if eval.transcribed_word and eval.transcribed_word != "[illegible]":
                    transcribed_words.append(eval.transcribed_word)
            
            full_text = " ".join(transcribed_words)
            
            # Calculate accuracy metrics
            total_words = len(word_evaluations)
            correct_words = sum(1 for eval in word_evaluations if eval.match)
            accuracy = (correct_words / total_words) * 100 if total_words > 0 else 0
            
            return {
                "full_text": full_text,
                "evaluations": [eval.dict() for eval in word_evaluations],
                "accuracy": accuracy,
                "correct_words": correct_words,
                "total_words": total_words
            }
            
        except APIError as e:
            print(f"Error calling Gemini API: {e}")
            return {"error": str(e)}
        except Exception as e:
            print(f"Unexpected error: {e}")
            return {"error": str(e)}

def main():
    """Example usage of the GeminiOCR class."""
    # Example usage
    ocr = GeminiOCR()
    
    # Example image path (replace with your image path)
    image_path = "path/to/your/image.jpg"
    reference_text = "हर पल लड़ाई मत कर"
    
    try:
        result = ocr.extract_text(image_path, reference_text)
        print("Extracted Text and Evaluation:")
        print(json.dumps(result, indent=2))
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main() 