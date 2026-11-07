"""Authorized backend application API, independent of Home Assistant transport."""

import asyncio
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from typing import Any

from .exchange import export_csv, import_csv
from .models import PlannerError, ValidationError
from .storage.worker import PlannerWorker

READ_OPERATIONS = frozenset({"get", "list", "history", "summary"})
WRITE_OPERATIONS = frozenset(
    {
        "create",
        "update",
        "delete",
        "duplicate_plant",
        "import",
        "restore",
        "set_settings",
    }
)
ADMIN_OPERATIONS = frozenset(
    {
        "export",
        "preview_import",
        "import",
        "backup",
        "backups",
        "preview_restore",
        "get_settings",
        "set_settings",
        "reminder_log",
        "restore",
    }
)


class AuthorizationError(PlannerError):
    """The actor cannot access the shared garden or perform this operation."""

    code = "unauthorized"


@dataclass(frozen=True)
class Actor:
    """Identity obtained from the authenticated HA connection, never request data."""

    user_id: str
    is_admin: bool = False
    is_active: bool = True


PARAMETERS: dict[str, tuple[set[str], set[str]]] = {
    "capabilities": (set(), set()),
    "get_settings": (set(), set()),
    "set_settings": ({"settings", "confirm"}, set()),
    "reminder_log": (set(), set()),
    "get": ({"table", "id"}, set()),
    "list": ({"table"}, {"filters"}),
    "create": ({"table", "data"}, set()),
    "update": ({"table", "id", "data", "revision"}, set()),
    "delete": ({"table", "id", "revision", "confirm"}, set()),
    "duplicate_plant": ({"id", "name"}, set()),
    "history": ({"plant_id"}, set()),
    "summary": (set(), set()),
    "export": (set(), {"format"}),
    "preview_import": ({"payload"}, {"mode", "format"}),
    "import": ({"payload", "token"}, {"mode", "format", "confirm"}),
    "backup": (set(), set()),
    "backups": (set(), set()),
    "preview_restore": ({"name"}, set()),
    "restore": ({"name", "token", "confirm"}, set()),
}


class PlannerService:
    """Single authorization boundary used by future UI and HA commands."""

    def __init__(
        self,
        worker: PlannerWorker,
        writers: frozenset[str] = frozenset(),
        readers: frozenset[str] | None = None,
    ) -> None:
        self.worker = worker
        self.writers = writers
        self.readers = readers
        self.host_handler: (
            Callable[[str, dict[str, Any], Actor], Awaitable[Any]] | None
        ) = None

    async def async_execute(
        self, operation: str, params: dict[str, Any], actor: Actor
    ) -> Any:
        """Authorize, validate the command shape and dispatch a bounded operation."""
        if not actor.user_id or not actor.is_active:
            raise AuthorizationError("An active authenticated user is required.")
        if (
            not actor.is_admin
            and self.readers is not None
            and actor.user_id not in self.readers
        ):
            raise AuthorizationError(
                "Garden viewing has not been granted to this user."
            )
        if not isinstance(operation, str) or operation not in PARAMETERS:
            raise ValidationError("Unknown Garden Planner operation.")
        if operation in ADMIN_OPERATIONS and not actor.is_admin:
            raise AuthorizationError("This operation requires an administrator.")
        if (
            operation in WRITE_OPERATIONS
            and not actor.is_admin
            and actor.user_id not in self.writers
        ):
            raise AuthorizationError(
                "Garden editing has not been granted to this user."
            )
        required, optional = PARAMETERS[operation]
        if (
            not isinstance(params, dict)
            or required - set(params)
            or set(params) - required - optional
        ):
            raise ValidationError("Unknown or missing operation parameters.")
        for field in ("table", "id", "plant_id", "name", "token", "mode", "format"):
            if field in params and not isinstance(params[field], str):
                raise ValidationError(f"{field} must be text.")
        if operation == "capabilities":
            flags = (
                await self.host_handler(operation, params, actor)
                if self.host_handler
                else {}
            )
            return {
                "can_edit": actor.is_admin or actor.user_id in self.writers,
                "can_manage": actor.is_admin,
                **flags,
            }
        if operation == "reminder_log":
            return await self.worker.async_call("reminder_log")
        if operation in {"get_settings", "set_settings"}:
            if self.host_handler is None:
                raise ValidationError(
                    "Home Assistant settings are not available in this host."
                )
            return await self.host_handler(operation, params, actor)
        call = self.worker.async_call
        match operation:
            case "get":
                return await call("get", params["table"], params["id"])
            case "list":
                if "filters" in params and not isinstance(params["filters"], dict):
                    raise ValidationError("Filters must be an object.")
                return await call(
                    "list_records", params["table"], params.get("filters")
                )
            case "create":
                return await call("create", params["table"], params["data"])
            case "update":
                return await call(
                    "update",
                    params["table"],
                    params["id"],
                    params["data"],
                    params["revision"],
                )
            case "delete":
                return await call(
                    "delete",
                    params["table"],
                    params["id"],
                    params["revision"],
                    confirm=params["confirm"],
                )
            case "duplicate_plant":
                return await call("duplicate_plant", params["id"], params["name"])
            case "history":
                return await call("history", params["plant_id"])
            case "summary":
                return await call("summary")
            case "export":
                if params.get("format", "json") not in {"json", "csv"}:
                    raise ValidationError("Export format must be json or csv.")
                payload = await call("export_data")
                return (
                    await asyncio.to_thread(export_csv, payload)
                    if params.get("format") == "csv"
                    else payload
                )
            case "preview_import" | "import":
                if params.get("format", "json") not in {"json", "csv"}:
                    raise ValidationError("Import format must be json or csv.")
                payload = (
                    await asyncio.to_thread(import_csv, params["payload"])
                    if params.get("format") == "csv"
                    else params["payload"]
                )
                mode = params.get("mode", "merge")
                if operation == "preview_import":
                    return await call("preview_import", payload, mode)
                if mode == "replace" and params.get("confirm") is not True:
                    raise ValidationError(
                        "Replace import requires explicit confirmation."
                    )
                return await call("import_data", payload, params["token"], mode)
            case "backup":
                return await call("backup")
            case "backups":
                return await call("list_backups")
            case "preview_restore":
                return await call("preview_restore", params["name"])
            case "restore":
                if params["confirm"] is not True:
                    raise ValidationError("Restore requires explicit confirmation.")
                return await call("restore", params["name"], params["token"])
        raise ValidationError("Operation is not implemented.")
