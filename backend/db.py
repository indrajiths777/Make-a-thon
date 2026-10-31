import sqlite3
from contextlib import contextmanager
from typing import Generator, Any, Dict, List, Optional
from backend.config import DATABASE_PATH, SCHEMA_PATH

def dict_from_row(row: sqlite3.Row) -> Dict[str, Any]:
    return {k: row[k] for k in row.keys()}

def dicts_from_rows(rows: List[sqlite3.Row]) -> List[Dict[str, Any]]:
    return [dict_from_row(r) for r in rows]

def get_db_connection() -> sqlite3.Connection:
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DATABASE_PATH), timeout=30.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute("PRAGMA journal_mode = WAL;")
    return conn

@contextmanager
def get_db() -> Generator[sqlite3.Connection, None, None]:
    conn = get_db_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_db() -> None:
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    with get_db() as conn:
        with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
            sql_script = f.read()
        conn.executescript(sql_script)

def execute_query(query: str, params: tuple = ()) -> List[Dict[str, Any]]:
    with get_db() as conn:
        cursor = conn.execute(query, params)
        rows = cursor.fetchall()
        return dicts_from_rows(rows)

def execute_one(query: str, params: tuple = ()) -> Optional[Dict[str, Any]]:
    with get_db() as conn:
        cursor = conn.execute(query, params)
        row = cursor.fetchone()
        return dict_from_row(row) if row else None

def execute_insert(query: str, params: tuple = ()) -> int:
    with get_db() as conn:
        cursor = conn.execute(query, params)
        return cursor.lastrowid

def execute_update(query: str, params: tuple = ()) -> int:
    with get_db() as conn:
        cursor = conn.execute(query, params)
        return cursor.rowcount
