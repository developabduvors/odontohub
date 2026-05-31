#!/usr/bin/env python3
"""
Database migration script to add language column to users table.
This script is idempotent and can be run multiple times safely.
"""

import os
import sys
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.exc import SQLAlchemyError
from dotenv import load_dotenv

# Load environment variables from the root .env file
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_path = os.path.join(root_dir, '.env')
load_dotenv(env_path)

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings

def get_database_url():
    """Get the database URL from settings."""
    database_url = settings.DATABASE_URL
    if not database_url:
        raise ValueError("DATABASE_URL not found in settings")
    
    # Convert postgres:// to postgresql:// for SQLAlchemy compatibility
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)
    
    return database_url

def check_column_exists(engine, table_name: str, column_name: str) -> bool:
    """Check if a column exists in the specified table."""
    try:
        inspector = inspect(engine)
        columns = inspector.get_columns(table_name)
        return any(col['name'] == column_name for col in columns)
    except Exception as e:
        print(f"Error checking column existence: {e}")
        return False

def add_language_column():
    """Add language column to users table if it doesn't exist."""
    try:
        # Get database connection
        database_url = get_database_url()
        engine = create_engine(
            database_url,
            pool_pre_ping=True,
            pool_recycle=300
        )
        
        print("Connecting to database...")
        
        # Check if language column already exists
        if check_column_exists(engine, 'users', 'language'):
            print("✅ Language column already exists in users table. No migration needed.")
            return True
        
        print("Adding language column to users table...")
        
        # Add the language column with default value
        with engine.connect() as connection:
            # Start a transaction
            trans = connection.begin()
            try:
                # Add the column with default value
                connection.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN language TEXT DEFAULT 'uz'
                """))
                
                # Update any existing NULL values to 'uz' (shouldn't be any due to DEFAULT, but just in case)
                result = connection.execute(text("""
                    UPDATE users 
                    SET language = 'uz' 
                    WHERE language IS NULL
                """))
                
                # Commit the transaction
                trans.commit()
                
                print(f"✅ Successfully added language column to users table.")
                if result.rowcount > 0:
                    print(f"   Updated {result.rowcount} existing users with default language 'uz'.")
                
                return True
                
            except Exception as e:
                # Rollback on error
                trans.rollback()
                raise e
                
    except SQLAlchemyError as e:
        print(f"❌ Database error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def verify_migration():
    """Verify that the migration was successful."""
    try:
        database_url = get_database_url()
        engine = create_engine(database_url, pool_pre_ping=True, pool_recycle=300)
        
        # Check if column exists and has correct properties
        inspector = inspect(engine)
        columns = inspector.get_columns('users')
        
        language_column = None
        for col in columns:
            if col['name'] == 'language':
                language_column = col
                break
        
        if not language_column:
            print("❌ Verification failed: language column not found")
            return False
        
        print("✅ Migration verification successful:")
        print(f"   Column name: {language_column['name']}")
        print(f"   Column type: {language_column['type']}")
        print(f"   Nullable: {language_column['nullable']}")
        print(f"   Default: {language_column.get('default', 'None')}")
        
        # Test a simple query to ensure the column works
        with engine.connect() as connection:
            result = connection.execute(text("SELECT COUNT(*) as count FROM users WHERE language = 'uz'"))
            count = result.fetchone()[0]
            print(f"   Users with 'uz' language: {count}")
        
        return True
        
    except Exception as e:
        print(f"❌ Verification error: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Starting language column migration...")
    print("=" * 50)
    
    # Run the migration
    success = add_language_column()
    
    if success:
        print("\n🔍 Verifying migration...")
        verify_migration()
        print("\n✅ Migration completed successfully!")
    else:
        print("\n❌ Migration failed!")
        sys.exit(1)