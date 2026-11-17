"""Bounded raster previews; no external URLs, SVG, metadata or new dependencies."""

import base64
import binascii
import struct
import zlib

MAX_IMAGE_BYTES = 80 * 1024
MAX_IMAGE_EDGE = 512
PREFIX = "data:image/png;base64,"
SIGNATURE = b"\x89PNG\r\n\x1a\n"


def validate_image(value: object) -> str:
    """Validate a small noninterlaced RGB/RGBA PNG and strip ancillary metadata.

    PNG layout: https://www.w3.org/TR/png/ . Only bounded canvas previews are
    accepted. Decompression is capped by dimensions before allocating pixels.
    """
    if not isinstance(value, str) or not value.startswith(PREFIX):
        raise ValueError("Expected a PNG preview.")
    if len(value) > len(PREFIX) + ((MAX_IMAGE_BYTES + 2) // 3) * 4:
        raise ValueError("Image preview exceeds 80 KiB.")
    try:
        raw = base64.b64decode(value[len(PREFIX) :], validate=True)
    except (ValueError, binascii.Error) as err:
        raise ValueError("Invalid image encoding.") from err
    if len(raw) > MAX_IMAGE_BYTES or not raw.startswith(SIGNATURE):
        raise ValueError("Invalid PNG preview.")
    offset = 8
    header = b""
    pixels = bytearray()
    ended = False
    data_ended = False
    while offset < len(raw):
        if offset + 12 > len(raw):
            raise ValueError("Truncated PNG.")
        size = int.from_bytes(raw[offset : offset + 4])
        kind = raw[offset + 4 : offset + 8]
        stop = offset + 12 + size
        if stop > len(raw):
            raise ValueError("Truncated PNG chunk.")
        content = raw[offset + 8 : stop - 4]
        if zlib.crc32(kind + content) != int.from_bytes(raw[stop - 4 : stop]):
            raise ValueError("Invalid PNG checksum.")
        if offset == 8 and kind != b"IHDR":
            raise ValueError("Missing PNG header.")
        if kind == b"IHDR":
            if header or size != 13:
                raise ValueError("Invalid PNG header.")
            header = content
        elif kind == b"IDAT":
            if data_ended:
                raise ValueError("Noncontiguous image data.")
            pixels.extend(content)
        elif kind == b"IEND":
            if size or stop != len(raw):
                raise ValueError("Invalid PNG ending.")
            ended = True
        else:
            if kind in {b"acTL", b"fcTL", b"fdAT"} or not kind[0] & 32:
                raise ValueError("Unsupported PNG chunk.")
            if pixels:
                data_ended = True
        offset = stop
    if not header or not pixels or not ended:
        raise ValueError("Incomplete PNG.")
    width, height, depth, color, compression, filtering, interlace = struct.unpack(
        ">IIBBBBB", header
    )
    if not (1 <= width <= MAX_IMAGE_EDGE and 1 <= height <= MAX_IMAGE_EDGE):
        raise ValueError("Image dimensions exceed preview limits.")
    if depth != 8 or color not in {2, 6} or any((compression, filtering, interlace)):
        raise ValueError("Expected an 8-bit RGB/RGBA canvas preview.")
    stride = width * (3 if color == 2 else 4) + 1
    expected = height * stride
    try:
        decoder = zlib.decompressobj()
        decoded = decoder.decompress(bytes(pixels), expected + 1)
    except zlib.error as err:
        raise ValueError("Invalid PNG pixels.") from err
    if (
        len(decoded) != expected
        or not decoder.eof
        or decoder.unused_data
        or decoder.unconsumed_tail
        or any(decoded[i] > 4 for i in range(0, expected, stride))
    ):
        raise ValueError("Invalid PNG pixel layout.")

    def chunk(kind: bytes, content: bytes) -> bytes:
        return (
            len(content).to_bytes(4)
            + kind
            + content
            + zlib.crc32(kind + content).to_bytes(4)
        )

    clean = (
        SIGNATURE
        + chunk(b"IHDR", header)
        + chunk(b"IDAT", bytes(pixels))
        + chunk(b"IEND", b"")
    )
    return PREFIX + base64.b64encode(clean).decode("ascii")
