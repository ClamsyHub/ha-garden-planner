"""Bounded metric polygons and planting geometry, independent of Home Assistant."""

import math
from datetime import date
from typing import Any

Point = tuple[float, float]


def numeric(value: Any, low: float, high: float, *, integer: bool = False) -> float:
    if (
        isinstance(value, bool)
        or not isinstance(value, (int, float))
        or not math.isfinite(value)
        or not low <= value <= high
        or (integer and type(value) is not int)
    ):
        raise ValueError("Invalid bed dimension, position or plant count.")
    return float(value)


def cross(a: Point, b: Point, c: Point) -> float:
    return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])


def on_segment(a: Point, b: Point, p: Point) -> bool:
    return (
        abs(cross(a, b, p)) < 1e-7
        and min(a[0], b[0]) - 1e-7 <= p[0] <= max(a[0], b[0]) + 1e-7
        and min(a[1], b[1]) - 1e-7 <= p[1] <= max(a[1], b[1]) + 1e-7
    )


def intersects(a: Point, b: Point, c: Point, d: Point) -> bool:
    return (
        cross(a, b, c) * cross(a, b, d) < 0 and cross(c, d, a) * cross(c, d, b) < 0
    ) or any(
        (
            on_segment(a, b, c),
            on_segment(a, b, d),
            on_segment(c, d, a),
            on_segment(c, d, b),
        )
    )


def edges(polygon: list[Point]) -> list[tuple[Point, Point]]:
    return list(zip(polygon, polygon[1:] + polygon[:1], strict=True))


def inside(point: Point, polygon: list[Point]) -> bool:
    x, y = point
    result = False
    for a, b in edges(polygon):
        if on_segment(a, b, point):
            return True
        if (a[1] > y) != (b[1] > y) and x < (b[0] - a[0]) * (y - a[1]) / (
            b[1] - a[1]
        ) + a[0]:
            result = not result
    return result


def polygon(raw: Any, width: float, height: float) -> list[Point]:
    if not isinstance(raw, list) or not 3 <= len(raw) <= 256:
        raise ValueError("Draw a closed bed with 3 to 256 corners.")
    points = []
    for point in raw:
        if not isinstance(point, list) or len(point) != 2:
            raise ValueError("Expected metric coordinate pairs.")
        points.append((numeric(point[0], 0, width), numeric(point[1], 0, height)))
    if (
        len(set(points)) != len(points)
        or abs(sum(a[0] * b[1] - b[0] * a[1] for a, b in edges(points))) < 1
    ):
        raise ValueError("Bed polygon must have a nonzero area and distinct corners.")
    lines = edges(points)
    for i, (a, b) in enumerate(lines):
        for j, (c, d) in enumerate(lines):
            if j <= i or j == i + 1 or (i == 0 and j == len(lines) - 1):
                continue
            if intersects(a, b, c, d):
                raise ValueError("Bed boundaries must not intersect themselves.")
    return points


def validate_plan_data(table: str, data: dict[str, Any]) -> None:
    if table == "bed_layouts":
        width = numeric(data.get("width_cm"), 20, 10000)
        height = numeric(data.get("height_cm"), 20, 10000)
        outer = polygon(data.get("outline"), width, height)
        holes = data.setdefault("holes", [])
        if (
            not isinstance(holes, list)
            or len(holes) > 8
            or sum(len(h) if isinstance(h, list) else 1000 for h in holes) > 256
        ):
            raise ValueError("At most eight bounded cut-outs are supported.")
        previous: list[list[Point]] = []
        for raw in holes:
            hole = polygon(raw, width, height)
            if not all(inside(p, outer) for p in hole) or any(
                intersects(a, b, c, d) for a, b in edges(hole) for c, d in edges(outer)
            ):
                raise ValueError("Cut-outs must lie strictly inside the bed.")
            for other in previous:
                if (
                    inside(hole[0], other)
                    or inside(other[0], hole)
                    or any(
                        intersects(a, b, c, d)
                        for a, b in edges(hole)
                        for c, d in edges(other)
                    )
                ):
                    raise ValueError("Cut-outs may not overlap or touch.")
            previous.append(hole)
        numeric(data.setdefault("rotation_years", 3), 1, 10, integer=True)
        numeric(data.setdefault("neighbor_distance_cm", 100), 10, 1000)
    else:
        numeric(data.get("x_cm"), 0, 10000)
        numeric(data.get("y_cm"), 0, 10000)
        count = numeric(data.get("plant_count"), 1, 200, integer=True)
        numeric(data.get("columns"), 1, min(200, count), integer=True)
        numeric(data.get("spacing_cm"), 1, 1000)
        numeric(data.get("row_spacing_cm"), 1, 1000)
        if data.get("state") not in {"planned", "planted", "completed"}:
            raise ValueError("Choose planned, planted or completed.")
        for field in ("start_date", "end_date"):
            raw = data.get(field)
            if not isinstance(raw, str) or date.fromisoformat(raw).isoformat() != raw:
                raise ValueError("Expected an ISO occupancy date.")
        if data["end_date"] < data["start_date"]:
            raise ValueError("Occupancy end must not precede its start.")
        family = data.get("family_snapshot", "")
        if not isinstance(family, str) or len(family) > 200:
            raise ValueError("Invalid historical plant family.")


def centers(data: dict[str, Any]) -> list[Point]:
    return [
        (
            data["x_cm"] + i % data["columns"] * data["spacing_cm"],
            data["y_cm"] + i // data["columns"] * data["row_spacing_cm"],
        )
        for i in range(data["plant_count"])
    ]


def validate_placement(layout: dict[str, Any], data: dict[str, Any]) -> None:
    outer = [(float(p[0]), float(p[1])) for p in layout["outline"]]
    holes = [[(float(p[0]), float(p[1])) for p in h] for h in layout.get("holes", [])]
    if any(
        not inside(p, outer) or any(inside(p, hole) for hole in holes)
        for p in centers(data)
    ):
        raise ValueError(
            "All plant centers must lie within the usable bed, outside cut-outs."
        )
