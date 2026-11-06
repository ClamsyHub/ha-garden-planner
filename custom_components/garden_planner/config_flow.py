"""UI-only setup and options for a local shared garden."""

from typing import Any

import voluptuous as vol
from homeassistant import config_entries
from homeassistant.config_entries import ConfigFlowResult
from homeassistant.core import callback
from homeassistant.helpers import selector

from .const import DOMAIN, NAME
from .models import ValidationError
from .options import validate_options
from .runtime import validate_host_options


class GardenPlannerConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Only one shared garden per HA installation."""

    VERSION = 1

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        await self.async_set_unique_id(DOMAIN)
        self._abort_if_unique_id_configured()
        if user_input is not None:
            return self.async_create_entry(title=NAME, data={})
        return self.async_show_form(step_id="user", data_schema=vol.Schema({}))

    @staticmethod
    @callback
    def async_get_options_flow(
        config_entry: config_entries.ConfigEntry,
    ) -> config_entries.OptionsFlow:
        return GardenOptionsFlow()


class GardenOptionsFlow(config_entries.OptionsFlow):
    """Use installed HA notification services and active users, never credentials."""

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        errors: dict[str, str] = {}
        settings = validate_options(dict(self.config_entry.options))
        if user_input is not None:
            try:
                settings = validate_options(user_input)
                await validate_host_options(self.hass, settings)
            except ValidationError:
                errors["base"] = "invalid_settings"
            else:
                return self.async_create_entry(title="", data=settings)
        users = await self.hass.auth.async_get_users()
        channels = [
            "",
            *sorted(
                f"notify.{s}"
                for s in self.hass.services.async_services().get("notify", {})
            ),
        ]
        schema = vol.Schema(
            {
                vol.Optional(
                    "writers", default=settings["writers"]
                ): selector.SelectSelector(
                    selector.SelectSelectorConfig(
                        options=[
                            selector.SelectOptionDict(value=u.id, label=u.name or u.id)
                            for u in users
                            if u.is_active and not u.system_generated
                        ],
                        multiple=True,
                    )
                ),
                vol.Required(
                    "reminders_enabled", default=settings["reminders_enabled"]
                ): bool,
                vol.Required("lead_days", default=settings["lead_days"]): vol.All(
                    vol.Coerce(int), vol.Range(min=0, max=30)
                ),
                vol.Required(
                    "reminder_hour", default=settings["reminder_hour"]
                ): vol.All(vol.Coerce(int), vol.Range(min=0, max=23)),
                vol.Optional(
                    "notify_service", default=settings["notify_service"]
                ): selector.SelectSelector(
                    selector.SelectSelectorConfig(options=channels)
                ),
                vol.Optional("notify_entity", default=settings["notify_entity"]): str,
                vol.Required("language", default=settings["language"]): vol.In(
                    ["de", "en"]
                ),
            }
        )
        return self.async_show_form(step_id="init", data_schema=schema, errors=errors)
