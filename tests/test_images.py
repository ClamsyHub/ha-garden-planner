"""Raster validation, bounded decompression and lossless data exchange."""

import base64
import struct
import tempfile
import unittest
import zlib
from pathlib import Path

from custom_components.garden_planner.exchange import export_csv, import_csv
from custom_components.garden_planner.images import PREFIX, SIGNATURE, validate_image
from custom_components.garden_planner.models import ValidationError
from custom_components.garden_planner.storage.database import Database


def chunk(kind: bytes, data: bytes) -> bytes:
    return len(data).to_bytes(4) + kind + data + zlib.crc32(kind + data).to_bytes(4)


def png(
    width: int = 2, height: int = 1, pixels: bytes | None = None, metadata: bool = False
) -> str:
    raw = (
        SIGNATURE
        + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0))
        + (chunk(b"tEXt", b"Comment\x00private metadata") if metadata else b"")
        + chunk(
            b"IDAT",
            zlib.compress(
                pixels if pixels is not None else b"\x00" + b"\x40\x80\x20\xff" * width
            ),
        )
        + chunk(b"IEND", b"")
    )
    return PREFIX + base64.b64encode(raw).decode()


class ImageTests(unittest.TestCase):
    def test_preview_strips_metadata_and_is_idempotent(self) -> None:
        clean = validate_image(png(metadata=True))
        self.assertEqual(clean, png())
        self.assertEqual(validate_image(clean), clean)
        self.assertNotIn(b"private", base64.b64decode(clean[len(PREFIX) :]))

    def test_invalid_formats_chunks_dimensions_and_pixel_bombs(self) -> None:
        cases = [
            "https://example.invalid/image.png",
            "data:image/svg+xml,<svg/>",
            PREFIX + "!",
            png(513),
            png(pixels=b"\x05" + b"\x00" * 8),
            png(pixels=b"\x00" * 1000000),
            png(pixels=b"\x00"),
            PREFIX + "A" * 200000,
            png()[:-4],
            PREFIX + base64.b64encode(SIGNATURE + chunk(b"IEND", b"")).decode(),
        ]
        for value in cases:
            with self.subTest(value=value[:50]), self.assertRaises(ValueError):
                validate_image(value)
        raw = bytearray(base64.b64decode(png()[len(PREFIX) :]))
        raw[30] ^= 1
        with self.assertRaises(ValueError):
            validate_image(PREFIX + base64.b64encode(raw).decode())

    def test_plant_and_variety_images_survive_restart_exchange_and_removal(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory() as directory:
            db = Database(Path(directory))
            db.open()
            try:
                plant = db.create(
                    "plants", {"name": "Photo plant", "image_data": png(metadata=True)}
                )
                variety = db.create(
                    "varieties",
                    {
                        "name": "Photo variety",
                        "plant_id": plant["id"],
                        "image_data": png(),
                    },
                )
                culture = db.create(
                    "cultivations",
                    {
                        "plant_id": plant["id"],
                        "variety_id": variety["id"],
                        "date": "2026-11-17",
                        "method": "indoors",
                    },
                )
                self.assertNotIn("image_data", culture["data"]["snapshot"]["plant"])
                self.assertNotIn("image_data", culture["data"]["snapshot"]["variety"])
                data = db.export_data()
                self.assertEqual(import_csv(export_csv(data))["tables"], data["tables"])
                backup = db.backup()
                self.assertTrue(backup)
                db.close()
                db.open()
                self.assertEqual(
                    db.get("varieties", variety["id"])["data"]["image_data"], png()
                )
                changed = db.update(
                    "plants", plant["id"], {"image_data": None}, plant["revision"]
                )
                self.assertIsNone(changed["data"]["image_data"])
                with self.assertRaises(ValidationError):
                    db.update(
                        "plants",
                        plant["id"],
                        {"image_data": "data:image/svg+xml,<svg/>"},
                        changed["revision"],
                    )
                plan = db.preview_restore(backup)
                db.restore(backup, plan["token"])
                self.assertEqual(
                    db.get("plants", plant["id"])["data"]["image_data"], png()
                )
            finally:
                db.close()
