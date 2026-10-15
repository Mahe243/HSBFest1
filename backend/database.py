import os
import sqlite3
from pathlib import Path

# Resolve path to fest.db: use /tmp on Vercel serverless environment because
# the deployment directory is read-only.
BASE_DIR = Path(__file__).resolve().parent.parent
if os.environ.get("VERCEL"):
    DB_PATH = Path("/tmp/fest.db")
else:
    DB_PATH = BASE_DIR / "fest.db"

def get_db_connection() -> sqlite3.Connection:
    """Returns a SQLite connection with Row factory enabled for column access by name."""
    if os.environ.get("VERCEL") and not DB_PATH.exists():
        init_db()
        try:
            import sys
            if str(Path(__file__).resolve().parent) not in sys.path:
                sys.path.insert(0, str(Path(__file__).resolve().parent))
            from seed_data import seed_events
            seed_events()
        except Exception as e:
            print(f"Auto-seed error on Vercel: {e}")
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    # Enable foreign keys
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_db():
    """Initializes the database schema with events and registrations tables."""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        event_date TEXT NOT NULL,
        event_time TEXT NOT NULL,
        venue TEXT NOT NULL,
        capacity INTEGER NOT NULL,
        fee INTEGER NOT NULL DEFAULT 0,
        icon TEXT
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS registrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id INTEGER NOT NULL REFERENCES events(id),
        student_name TEXT NOT NULL,
        roll_number TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        registered_at TEXT NOT NULL,
        UNIQUE(event_id, email)
    );
    """)

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print(f"Database initialized at {DB_PATH}")
