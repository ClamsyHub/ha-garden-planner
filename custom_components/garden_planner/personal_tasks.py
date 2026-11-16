"""Per-user task ledger in atomic, private integration-owned HA storage."""

import asyncio
import hashlib
from datetime import UTC, date, datetime
from typing import Any

from homeassistant.components.frontend.storage import async_user_store
from homeassistant.core import CoreState, HomeAssistant
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.storage import Store

from .models import (
    PlannerError,
    StorageError,
    identifier,
    iso_date,
    positive_revision,
    timestamp,
)
from .reminder_preferences import STORE_KEY, availability, selections
from .storage import PlannerWorker
from .task_planning import LABELS, PREFIX, complete, reconcile, visible


class PersonalTasks:
    """One lock serializes generation, completion and durable saves."""

    def __init__(self, hass: HomeAssistant, worker: PlannerWorker) -> None:
        self.hass, self.worker = hass, worker
        self.lock = asyncio.Lock()
        self.stores: dict[str, Store[dict[str, Any]]] = {}
        self.records: dict[str, dict[str, Any]] = {}

    async def _load(self, user_id: str) -> dict[str, Any]:
        if user_id not in self.stores:
            key = (
                "garden_planner.personal_tasks."
                + hashlib.sha256(user_id.encode()).hexdigest()
            )
            store = Store[dict[str, Any]](
                self.hass,
                1,
                key,
                private=True,
                atomic_writes=True,
                serialize_in_event_loop=False,
            )
            try:
                loaded = await store.async_load()
            except (OSError, HomeAssistantError) as error:
                raise StorageError("Personal tasks could not be loaded.") from error
            if loaded is not None and not isinstance(loaded, dict):
                raise StorageError("Invalid personal task storage.")
            records = loaded.get("records") if loaded is not None else {}
            if not isinstance(records, dict):
                raise StorageError(
                    "Invalid personal task storage; restore a Home Assistant backup."
                )
            try:
                for task_id, record in records.items():
                    if (
                        not isinstance(task_id, str)
                        or not task_id.startswith(PREFIX)
                        or not isinstance(record, dict)
                        or record.get("id") != task_id
                        or not isinstance(record.get("data"), dict)
                    ):
                        raise StorageError("Invalid personal task record.")
                    identifier(task_id)
                    positive_revision(record.get("revision"))
                    timestamp(record.get("created_at"))
                    timestamp(record.get("updated_at"))
                    item = record["data"]
                    iso_date(item.get("date"))
                    identifier(item.get("source_window_id"))
                    identifier(item.get("plant_id"))
                    if (
                        not isinstance(item.get("activity"), str)
                        or item.get("activity") not in LABELS
                        or type(item.get("completed")) is not bool
                        or item.get("personal_generated") is not True
                        or type(record.get("cancelled")) is not bool
                        or not isinstance(item.get("title"), str)
                    ):
                        raise StorageError("Invalid personal task fields.")
            except PlannerError as error:
                raise StorageError(
                    "Invalid personal task history; restore a Home Assistant backup."
                ) from error
            self.stores[user_id], self.records[user_id] = store, records
        return self.records[user_id]

    async def _save(self, user_id: str, records: dict[str, Any]) -> None:
        try:
            store = self.stores[user_id]
            payload = {"records": records}
            await store.async_save(payload)
            # HA Store logs some disk-write failures instead of raising them.
            # Confirm normal writes through a fresh, read-only Store before ack.
            # During HA shutdown its documented final-write queue owns the flush.
            if self.hass.state is not CoreState.stopping:
                verifier = Store[dict[str, Any]](
                    self.hass, 1, store.key, private=True, read_only=True
                )
                if await verifier.async_load() != payload:
                    raise StorageError("Personal task write could not be confirmed.")
        except (OSError, HomeAssistantError) as error:
            raise StorageError("Personal tasks could not be saved.") from error

    async def async_tasks(
        self,
        user_id: str,
        today: date,
        language: str,
        plants: list[dict[str, Any]] | None = None,
        windows: list[dict[str, Any]] | None = None,
    ) -> list[dict[str, Any]]:
        async with self.lock:
            existing = await self._load(user_id)
            if plants is None:
                plants = await self.worker.async_call("list_records", "plants")
            if windows is None:
                windows = await self.worker.async_call(
                    "list_records", "growing_windows"
                )
            preferences = await async_user_store(self.hass, user_id)
            cells = selections(
                availability(plants, windows), preferences.data.get(STORE_KEY, {})
            )
            records = reconcile(
                existing,
                plants,
                windows,
                cells,
                user_id,
                today,
                language,
                datetime.now(UTC).isoformat(),
            )
            if records != existing:
                await self._save(user_id, records)
                self.records[user_id] = records
            return visible(records)

    async def async_complete(
        self, user_id: str, task_id: str, revision: int, completed: bool
    ) -> dict[str, Any]:
        async with self.lock:
            existing = await self._load(user_id)
            records = complete(
                existing, task_id, revision, completed, datetime.now(UTC).isoformat()
            )
            await self._save(user_id, records)
            self.records[user_id] = records
            return next(r for r in visible(records) if r["id"] == task_id)
