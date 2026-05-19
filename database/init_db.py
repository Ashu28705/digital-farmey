import sqlite3
import os

# Set file paths
DB_FILE = 'agriadvisor.db'
SCHEMA_FILE = 'schema.sql'
SEED_FILE = 'seed_data.sql'

def init_db():
    print(f"Initializing database: {DB_FILE}...")
    
    # Connect to SQLite (this creates the file if it doesn't exist)
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    # Read and execute schema
    print("Executing schema.sql...")
    with open(SCHEMA_FILE, 'r', encoding='utf-8') as f:
        schema_script = f.read()
    cursor.executescript(schema_script)

    # Read and execute seed data
    print("Executing seed_data.sql...")
    with open(SEED_FILE, 'r', encoding='utf-8') as f:
        seed_script = f.read()
    cursor.executescript(seed_script)

    # Commit and close
    conn.commit()
    conn.close()
    
    print("Database initialized successfully!")

if __name__ == '__main__':
    # Delete existing db if it exists to start fresh
    if os.path.exists(DB_FILE):
        os.remove(DB_FILE)
    
    init_db()
