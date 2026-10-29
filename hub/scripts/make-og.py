#!/usr/bin/env python3
"""Render the 1200x630 social card without any third-party dependencies."""

import binascii
import struct
import zlib
from pathlib import Path

W, H = 1200, 630

INK = (10, 13, 18)
INK_2 = (18, 23, 34)
PAPER = (246, 243, 235)
BRAND = (255, 197, 61)
BLUE = (47, 107, 255)
MAROON = (159, 18, 57)

FONT = {
    "A": ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
    "B": ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
    "C": ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
    "D": ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
    "E": ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
    "G": ["01110", "10001", "10000", "10111", "10001", "10001", "01111"],
    "H": ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
    "I": ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
    "L": ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
    "N": ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
    "O": ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
    "P": ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
    "R": ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
    "S": ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
    "T": ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
    "U": ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
    "V": ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
    "W": ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
    "Y": ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
    " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
    ".": ["00000", "00000", "00000", "00000", "00000", "00110", "00110"],
    "-": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
}


def make_canvas() -> bytearray:
    return bytearray(INK * (W * H))


def put(pixels: bytearray, x: int, y: int, color: tuple[int, int, int]) -> None:
    if 0 <= x < W and 0 <= y < H:
        index = (y * W + x) * 3
        pixels[index : index + 3] = bytes(color)


def fill_rect(pixels, x0, y0, x1, y1, color) -> None:
    for y in range(max(0, y0), min(H, y1)):
        for x in range(max(0, x0), min(W, x1)):
            put(pixels, x, y, color)


def stroke_rect(pixels, x0, y0, x1, y1, color, weight=2) -> None:
    fill_rect(pixels, x0, y0, x1, y0 + weight, color)
    fill_rect(pixels, x0, y1 - weight, x1, y1, color)
    fill_rect(pixels, x0, y0, x0 + weight, y1, color)
    fill_rect(pixels, x1 - weight, y0, x1, y1, color)


def rounded_rect(pixels, x0, y0, x1, y1, radius, color) -> None:
    for y in range(y0, y1):
        for x in range(x0, x1):
            dx = min(x - x0, x1 - 1 - x)
            dy = min(y - y0, y1 - 1 - y)
            if dx < radius and dy < radius:
                if (radius - dx) ** 2 + (radius - dy) ** 2 > radius**2:
                    continue
            put(pixels, x, y, color)


def circle_outline(pixels, cx, cy, radius, weight, color) -> None:
    inner = (radius - weight) ** 2
    outer = radius**2
    for y in range(cy - radius, cy + radius + 1):
        for x in range(cx - radius, cx + radius + 1):
            distance = (x - cx) ** 2 + (y - cy) ** 2
            if inner <= distance <= outer:
                put(pixels, x, y, color)


def fill_circle(pixels, cx, cy, radius, color) -> None:
    for y in range(cy - radius, cy + radius + 1):
        for x in range(cx - radius, cx + radius + 1):
            if (x - cx) ** 2 + (y - cy) ** 2 <= radius**2:
                put(pixels, x, y, color)


def text_width(text: str, scale: int, spacing: int) -> int:
    return len(text) * (5 * scale + spacing * scale) - spacing * scale


def draw_text(pixels, text, x, y, scale, color, spacing=1) -> None:
    cursor = x
    for character in text.upper():
        glyph = FONT.get(character, FONT[" "])
        for row_index, row in enumerate(glyph):
            for column_index, cell in enumerate(row):
                if cell == "1":
                    fill_rect(
                        pixels,
                        cursor + column_index * scale,
                        y + row_index * scale,
                        cursor + (column_index + 1) * scale,
                        y + (row_index + 1) * scale,
                        color,
                    )
        cursor += (5 + spacing) * scale


def build():
    pixels = make_canvas()

    for x in range(0, W, 48):
        fill_rect(pixels, x, 0, x + 1, H, INK_2)
    for y in range(0, H, 48):
        fill_rect(pixels, 0, y, W, y + 1, INK_2)

    rounded_rect(pixels, 72, 168, 842, 392, 22, BRAND)
    draw_text(pixels, "NEVATAL", 116, 226, 16, BLUE, spacing=1)
    fill_rect(pixels, 792, 330, 816, 354, MAROON)

    draw_text(pixels, "AI PRODUCTS THAT EARN THEIR PLACE", 80, 452, 3, PAPER, spacing=1)
    draw_text(pixels, "NEVATAL.ID - INDEPENDENT AI STUDIO", 80, 528, 2, BRAND, spacing=1)

    cx, cy = 1002, 306
    circle_outline(pixels, cx, cy, 150, 3, (35, 43, 58))
    circle_outline(pixels, cx, cy, 112, 4, BRAND)
    circle_outline(pixels, cx, cy, 66, 4, BLUE)
    fill_circle(pixels, cx, cy, 10, BRAND)
    for angle_x, angle_y, color in [(0, -112, BRAND), (112, 0, MAROON), (0, 112, BLUE), (-112, 0, BRAND)]:
        fill_circle(pixels, cx + angle_x, cy + angle_y, 8, color)

    fill_rect(pixels, 0, 0, W, 6, BRAND)

    raw = b"".join(b"\x00" + bytes(pixels[y * W * 3 : (y + 1) * W * 3]) for y in range(H))

    def chunk(tag: bytes, data: bytes) -> bytes:
        checksum = binascii.crc32(tag + data) & 0xFFFFFFFF
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", checksum)

    png = (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", W, H, 8, 2, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(raw, 9))
        + chunk(b"IEND", b"")
    )

    target = Path(__file__).resolve().parent.parent / "public" / "og-image.png"
    target.write_bytes(png)
    print(f"wrote {target} ({len(png)} bytes)")


if __name__ == "__main__":
    build()
