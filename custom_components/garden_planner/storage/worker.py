"""Dedicated single-thread executor keeps SQLite entirely outside the event loop."""

import asyncio
import sqlite3
from concurrent.futures import ThreadPoolExecutor
from functools import partial
from pathlib import Path
from typing import Any

from ..models import PlannerError, StorageError
from .database import Database

OPERATIONS = frozenset(
    {
        "get",
        "claim_reminder",
        "finish_reminder",
        "reminder_log",
        "list_records",
        "create",
        "update",
        "delete",
        "duplicate_plant",
        "history",
        "summary",
        "export_data",
        "preview_import",
        "import_data",
        "backup",
        "list_backups",
        "preview_restore",
        "restore",
    }
)


class PlannerWorker:
    """Serialize DB operations, including concurrent requests and shutdown."""

    def __init__(self, directory: Path) -> None:
        self._database = Database(directory)
        self._executor = ThreadPoolExecutor(
            max_workers=1, thread_name_prefix="garden-planner"
        )
        self._lock = asyncio.Lock()
        self._closed = False
        self._opened = False

    async def async_open(self) -> None:
        """Construct/open SQLite on its own thread and propagate setup failures."""
        async with self._lock:
            if self._closed:
                raise StorageError("Worker is closed.")
            if not self._opened:
                await self._execute("open")
                self._opened = True

    async def _execute(self, operation: str, *args: Any, **kwargs: Any) -> Any:
        def invoke() -> Any:
            try:
                return getattr(self._database, operation)(*args, **kwargs)
            except PlannerError:
                raise
            except (sqlite3.Error, OSError) as err:
                raise StorageError(
                    "Local storage operation failed; check storage and backups."
                ) from err

        return await asyncio.get_running_loop().run_in_executor(self._executor, invoke)

    async def async_call(self, operation: str, *args: Any, **kwargs: Any) -> Any:
        """Invoke only the explicit repository API, never an arbitrary attribute."""
        if operation not in OPERATIONS:
            raise StorageError("Unsupported storage operation.")
        async with self._lock:
            if self._closed or not self._opened:
                raise StorageError("Worker is not available.")
            # Cancelling a caller must not permit shutdown while a write is running.
            task = asyncio.create_task(self._execute(operation, *args, **kwargs))
            try:
                return await asyncio.shield(task)
            except asyncio.CancelledError:
                await task
                raise

    async def async_close(self) -> None:
        """Drain requests and close on the owning thread, even after setup failed."""
        async with self._lock:
            if self._closed:
                return
            try:
                await self._execute("close")
            finally:
                self._closed = True
                self._opened = False
                await asyncio.to_thread(partial(self._executor.shutdown, wait=True))
