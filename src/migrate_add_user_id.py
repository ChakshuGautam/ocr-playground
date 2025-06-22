import asyncio
import sqlite3
from sqlalchemy import text
from database import engine

async def migrate_add_user_id():
    """Add user_id columns to existing tables"""
    
    async with engine.begin() as conn:
        # List of tables that need user_id column
        tables = [
            'datasets',
            'prompt_families', 
            'prompt_versions',
            'evaluation_runs',
            'api_keys',
            'images',
            'prompt_templates'
        ]
        
        for table in tables:
            try:
                # Check if user_id column already exists
                result = await conn.execute(text(f"PRAGMA table_info({table})"))
                columns = result.fetchall()
                column_names = [col[1] for col in columns]
                
                if 'user_id' not in column_names:
                    print(f"Adding user_id column to {table}...")
                    await conn.execute(text(f"ALTER TABLE {table} ADD COLUMN user_id TEXT"))
                    await conn.execute(text(f"CREATE INDEX IF NOT EXISTS idx_{table}_user_id ON {table}(user_id)"))
                    print(f"✓ Added user_id column to {table}")
                else:
                    print(f"✓ user_id column already exists in {table}")
                    
            except Exception as e:
                print(f"Error adding user_id to {table}: {e}")
        
        print("\nMigration completed!")

if __name__ == "__main__":
    asyncio.run(migrate_add_user_id())