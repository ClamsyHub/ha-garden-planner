"""Native weather forecasts, units, exposure flags and unavailable data."""

import unittest
from datetime import UTC, datetime, timedelta
from types import SimpleNamespace
from typing import Any, cast
from unittest.mock import AsyncMock

from custom_components.garden_planner.options import validate_options
from custom_components.garden_planner.weather_hints import (
    WeatherHints,
    exposed_cultures,
    forecast_minimum,
)


class ForecastTests(unittest.TestCase):
    def test_units_time_bounds_and_invalid_values(self) -> None:
        now = datetime(2026, 11, 18, 12, tzinfo=UTC)
        rows = [
            {"datetime": (now + timedelta(hours=4)).isoformat(), "temperature": 30},
            {"datetime": (now - timedelta(hours=4)).isoformat(), "temperature": -100},
            {"datetime": "invalid", "temperature": -999},
        ]
        result = forecast_minimum(rows, "°F", now, 24)
        assert result is not None
        self.assertEqual(result[0], -1.11)
        self.assertIsNone(forecast_minimum(rows, "unknown", now, 24))
        self.assertIsNone(forecast_minimum(rows, "°F", now, 1))

    def test_only_explicitly_exposed_sensitive_active_cultures(self) -> None:
        def culture(id: str, **values: Any) -> dict[str, Any]:
            return {
                "id": id,
                "data": {
                    "date": "2026-01-01",
                    "outdoors": True,
                    "frost_sensitive": True,
                    "snapshot": {"plant": {"name": id}},
                    **values,
                },
            }

        cultures = [
            culture("yes"),
            culture("inside", outdoors=False),
            culture("hardy", frost_sensitive=False),
            culture("future", date="2027-01-01"),
            culture("planned", initial_status="planned"),
            culture("done"),
        ]
        events = [
            {
                "id": "event",
                "created_at": "now",
                "data": {
                    "cultivation_id": "done",
                    "date": "2026-02-01",
                    "status": "completed",
                },
            }
        ]
        self.assertEqual(
            [r["id"] for r in exposed_cultures(cultures, events, "2026-11-18")], ["yes"]
        )


class WeatherReaderTests(unittest.IsolatedAsyncioTestCase):
    async def test_disabled_weather_never_calls_a_provider(self) -> None:
        hass = SimpleNamespace(services=SimpleNamespace(async_call=AsyncMock()))
        reader = WeatherHints(cast(Any, hass), cast(Any, None))
        self.assertEqual(
            (await reader.async_read(validate_options({})))["status"], "disabled"
        )
        hass.services.async_call.assert_not_called()

    async def test_forecast_service_cache_and_unavailable_state(self) -> None:
        future = (datetime.now(UTC) + timedelta(hours=4)).isoformat()
        action = AsyncMock(
            return_value={
                "weather.test": {"forecast": [{"datetime": future, "temperature": -2}]}
            }
        )
        state = SimpleNamespace(
            state="cloudy", attributes={"temperature_unit": "°C"}, name="Test weather"
        )
        hass = SimpleNamespace(
            states=SimpleNamespace(get=lambda _: state),
            services=SimpleNamespace(async_call=action),
        )
        worker = SimpleNamespace(async_call=AsyncMock(return_value=[]))
        reader = WeatherHints(cast(Any, hass), cast(Any, worker))
        settings = validate_options({"weather_entity": "weather.test"})
        result = await reader.async_read(settings)
        self.assertEqual(result["minimum_c"], -2)
        await reader.async_read(settings)
        self.assertEqual(action.await_count, 1)
        action.assert_awaited_once_with(
            "weather",
            "get_forecasts",
            {"entity_id": "weather.test", "type": "hourly"},
            blocking=True,
            return_response=True,
        )
        state.state = "unavailable"
        reader.cached_at = None
        self.assertEqual((await reader.async_read(settings))["status"], "unavailable")
