import os
import unittest
from pathlib import Path
from src.gemini_ocr import GeminiOCR

class TestGeminiOCR(unittest.TestCase):
    def setUp(self):
        """Set up test cases."""
        self.ocr = GeminiOCR()
        
        # Create a test image path
        self.test_image_path = Path(__file__).parent / "test_image.jpg"
        
        # Ensure GOOGLE_API_KEY is set
        if not os.getenv("GOOGLE_API_KEY"):
            self.skipTest("GOOGLE_API_KEY environment variable is not set")
    
    def test_init(self):
        """Test initialization of GeminiOCR."""
        ocr = GeminiOCR()
        self.assertIsNotNone(ocr)
        self.assertEqual(ocr.timeout, 60)
    
    def test_missing_api_key(self):
        """Test initialization without API key."""
        # Temporarily remove API key
        original_key = os.environ.pop("GOOGLE_API_KEY", None)
        try:
            with self.assertRaises(ValueError):
                GeminiOCR()
        finally:
            # Restore API key
            if original_key:
                os.environ["GOOGLE_API_KEY"] = original_key
    
    def test_invalid_image_path(self):
        """Test with invalid image path."""
        with self.assertRaises(FileNotFoundError):
            self.ocr.extract_text("nonexistent_image.jpg")

if __name__ == "__main__":
    unittest.main() 