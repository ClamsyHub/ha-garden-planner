"""Register one local custom panel and immutable static assets, not user data."""

import hashlib
from pathlib import Path

from homeassistant.components import frontend, panel_custom
from homeassistant.components.http import StaticPathConfig
from homeassistant.core import HomeAssistant

PANEL_PATH = "garden-planner"
ASSET_PATH = "/garden_planner_static"
REGISTERED = "garden_planner_http_registered"


async def async_register_frontend(hass: HomeAssistant) -> None:
    """Static routes live for the HTTP server lifetime; panel follows the entry."""
    directory = Path(__file__).parent / "www"
    if not hass.data.get(REGISTERED):
        await hass.http.async_register_static_paths(
            [StaticPathConfig(ASSET_PATH, str(directory), cache_headers=True)]
        )
        hass.data[REGISTERED] = True
    digest = await hass.async_add_executor_job(
        lambda: hashlib.sha256(
            (directory / "garden-planner.js").read_bytes()
        ).hexdigest()[:16]
    )
    await panel_custom.async_register_panel(
        hass,
        frontend_url_path=PANEL_PATH,
        webcomponent_name="garden-planner-panel",
        sidebar_title="Garden Planner",
        sidebar_icon="mdi:sprout",
        module_url=f"{ASSET_PATH}/garden-planner.js?v={digest}",
        require_admin=False,
    )


def async_remove_frontend(hass: HomeAssistant) -> None:
    """Only remove our panel; routes contain code and licenses, never private files."""
    frontend.async_remove_panel(hass, PANEL_PATH, warn_if_unknown=False)
