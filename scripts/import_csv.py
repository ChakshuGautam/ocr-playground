#!/usr/bin/env python3
"""
Script to import CSV data into the SQLite database.
"""

import asyncio
import os
import sys
from pathlib import Path

# Add src to path
sys.path.append(str(Path(__file__).parent.parent))

from src.database import init_db, async_session
from src.crud import import_csv_data

async def main():
    """Import CSV data into database"""
    # Initialize database
    await init_db()
    print("Database initialized")
    
    # Check if CSV file exists
    csv_path = "images.csv"
    if not os.path.exists(csv_path):
        print(f"CSV file not found: {csv_path}")
        return
    
    # Import data
    async with async_session() as db:
        result = await import_csv_data(db, csv_path, overwrite_existing=True)
        
        print(f"Import completed:")
        print(f"  - Imported: {result['imported_count']} new images")
        print(f"  - Updated: {result['updated_count']} existing images")
        print(f"  - Errors: {len(result['errors'])}")
        
        if result['errors']:
            print("\nErrors:")
            for error in result['errors']:
                print(f"  - {error}")

if __name__ == "__main__":
    asyncio.run(main()) 