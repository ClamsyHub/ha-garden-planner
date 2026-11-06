"""Shared entity snapshot; source-of-truth records remain in SQLite."""

import logging
from datetime import timedelta
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed

from .models import PlannerError
from .service import PlannerService


class GardenCoordinator(DataUpdateCoordinator[dict[str, Any]]):
    """One refresh for aggregate sensors and the task/event calendar."""

    def __init__(
        self, hass: HomeAssistant, service: PlannerService, entry: ConfigEntry
    ) -> None:
        super().__init__(
            hass,
            logging.getLogger(__name__),
            name="Garden Planner",
            config_entry=entry,
            update_interval=timedelta(minutes=15),
        )
        self.service = service

    async def _async_update_data(self) -> dict[str, Any]:
        try:
            data = {"summary": await self.service.worker.async_call("summary")}
            for table in (
                "tasks",
                "cultivation_events",
                "cultivations",
                "plants",
                "locations",
            ):
                data[table] = await self.service.worker.async_call(
                    "list_records", table
                )
            return data
        except PlannerError as err:
            raise UpdateFailed(str(err)) from err
