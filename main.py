#!/usr/bin/env python3
"""
Main entry point for the OCR Evaluation API.
"""

import uvicorn
from src.api import app

if __name__ == "__main__":
    uvicorn.run(
        "src.api:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    ) 