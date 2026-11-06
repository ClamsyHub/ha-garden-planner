"""Versioned schema statements; migration execution belongs to the worker."""

from ..models import PARENTS, TABLES

APPLICATION_ID = 0x47504C4E


def initial_schema() -> list[str]:
    """Build tables only from trusted domain constants, never user table names."""
    statements = [
        "CREATE TABLE schema_migrations (version INTEGER PRIMARY KEY, "
        "applied_at TEXT NOT NULL)",
        "CREATE TABLE settings (key TEXT PRIMARY KEY, "
        "value TEXT NOT NULL CHECK(json_valid(value)))",
        "INSERT INTO settings VALUES ('notifications_enabled', 'false')",
    ]
    for table in TABLES:
        parents = [
            f"{field} TEXT REFERENCES {target}(id) ON DELETE RESTRICT"
            for field, target in PARENTS[table].items()
        ]
        columns = [
            "id TEXT PRIMARY KEY",
            "revision INTEGER NOT NULL CHECK(revision > 0)",
            "created_at TEXT NOT NULL",
            "updated_at TEXT NOT NULL",
            "data TEXT NOT NULL CHECK(json_valid(data))",
            *parents,
        ]
        statements.append(f"CREATE TABLE {table} ({', '.join(columns)})")
    return statements


def performance_indexes() -> list[str]:
    """Migration 2 adds indexes without changing records or their IDs."""
    result = [
        f"CREATE INDEX idx_{table}_{field} ON {table}({field})"
        for table in TABLES
        for field in PARENTS[table]
    ]
    result.extend(
        f"CREATE INDEX idx_{table}_date ON {table}(json_extract(data, '$.date'))"
        for table in ("cultivations", "cultivation_events", "tasks")
    )
    return result


MIGRATIONS = {1: initial_schema(), 2: performance_indexes()}
