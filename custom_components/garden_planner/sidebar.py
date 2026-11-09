"""Synchronize only our entry in Home Assistant's native sidebar preferences.

Visibility is cosmetic; PlannerService continues to authorize every operation.
No frontend command is replaced and no other sidebar preference is discarded.
"""

import asyncio
from typing import Any

from homeassistant.components import frontend
from homeassistant.components.frontend.storage import async_user_store
from homeassistant.core import HomeAssistant

from .frontend import PANEL_PATH

MARKER = "garden_planner_sidebar"
LOCK = "garden_planner_sidebar_lock"


async def async_sync_sidebar(
    hass: HomeAssistant, readers: frozenset[str] | None
) -> None:
    """Hide revoked users' link; restore links we hid when access is granted."""
    lock: asyncio.Lock = hass.data.setdefault(LOCK, asyncio.Lock())
    async with lock:
        for user in await hass.auth.async_get_users():
            if not user.is_active or user.system_generated:
                continue
            allowed = user.is_admin or readers is None or user.id in readers
            store = await async_user_store(hass, user.id)
            sidebar: Any = store.data.get("sidebar", {})
            if not isinstance(sidebar, dict):
                continue
            hidden = sidebar.get("hiddenPanels", [])
            if not isinstance(hidden, list):
                continue
            owned = store.data.get(MARKER) == {"hidden_by_integration": True}
            if not allowed and PANEL_PATH not in hidden:
                # Persist ownership first so a failed/restarted update can recover.
                if not owned:
                    await store.async_set_item(MARKER, {"hidden_by_integration": True})
                await store.async_set_item(
                    "sidebar", {**sidebar, "hiddenPanels": [*hidden, PANEL_PATH]}
                )
            elif allowed and owned:
                if PANEL_PATH in hidden:
                    await store.async_set_item(
                        "sidebar",
                        {
                            **sidebar,
                            "hiddenPanels": [p for p in hidden if p != PANEL_PATH],
                        },
                    )
                await store.async_set_item(MARKER, {})

        panels = hass.data.get(frontend.DATA_PANELS, {})
        panel = panels.get(PANEL_PATH)
        admin_only = readers == frozenset()
        if panel is not None and panel.require_admin != admin_only:
            frontend.async_register_built_in_panel(
                hass,
                component_name=panel.component_name,
                sidebar_title=panel.sidebar_title,
                sidebar_icon=panel.sidebar_icon,
                sidebar_default_visible=panel.sidebar_default_visible,
                frontend_url_path=PANEL_PATH,
                config=panel.config,
                require_admin=admin_only,
                config_panel_domain=panel.config_panel_domain,
                show_in_sidebar=panel.show_in_sidebar,
                update=True,
            )
