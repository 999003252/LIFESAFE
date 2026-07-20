"""Optional helper to provision the DynamoDB table used by routers/entries.py.

The API now runs the same check automatically at startup. To run it manually:

    python create_table.py
"""
from database import ensure_journal_entries_table


def main():
    """Ensure the journal entries table is ready."""
    table = ensure_journal_entries_table()
    print(f"Table '{table.name}' is ready.")


if __name__ == "__main__":
    main()
