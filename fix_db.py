import sqlite3

conn = sqlite3.connect('todo_app.db')
try:
    conn.execute("ALTER TABLE todos ADD COLUMN priority VARCHAR(20) DEFAULT 'Normal' NOT NULL")
    conn.commit()
    print("Added 'priority' column successfully!")
except Exception as e:
    print(f"Column may already exist: {e}")

# Verify
cursor = conn.execute("PRAGMA table_info(todos)")
for row in cursor:
    print(row)

conn.close()
