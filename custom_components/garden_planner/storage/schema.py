"""Versioned schema statements; migration execution belongs to the worker."""

from ..models import PARENTS, PLANT_MEASURE_FIELDS, TABLES

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


def plant_level_traits() -> list[str]:
    """Migration 3 removes retired master values without touching observations."""
    paths = ", ".join(f"'$.{field}'" for field in sorted(PLANT_MEASURE_FIELDS))
    present = " OR ".join(
        f"json_type(data, '$.{field}') IS NOT NULL"
        for field in sorted(PLANT_MEASURE_FIELDS)
    )
    return [
        f"UPDATE varieties SET data=json_remove(data, {paths}), "
        "revision=revision+1, updated_at=strftime('%Y-%m-%dT%H:%M:%SZ','now') "
        f"WHERE {present}",
        "UPDATE growing_windows SET data=json_remove(data, '$.variety_id'), "
        "variety_id=NULL, revision=revision+1, "
        "updated_at=strftime('%Y-%m-%dT%H:%M:%SZ','now') "
        "WHERE variety_id IS NOT NULL OR json_type(data, '$.variety_id') IS NOT NULL",
        "UPDATE settings SET value=CAST(CAST(value AS INTEGER)+1 AS TEXT) "
        "WHERE key='generation'",
    ]


MIGRATIONS = {1: initial_schema(), 2: performance_indexes(), 3: plant_level_traits()}
