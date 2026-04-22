from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "public" / "assets" / "sprites"
OUT_DIR.mkdir(parents=True, exist_ok=True)


def rect(draw: ImageDraw.ImageDraw, x: int, y: int, w: int, h: int, color: str) -> None:
    draw.rectangle((x, y, x + w - 1, y + h - 1), fill=color)


def make_room_sheet() -> None:
    tile_w = 96
    tile_h = 96
    cols = 3
    rows = 3
    img = Image.new("RGBA", (tile_w * cols, tile_h * rows), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    palettes = [
        {
            "floor_a": "#202b43",
            "floor_b": "#192238",
            "wall_a": "#2e3b5a",
            "wall_b": "#151d30",
            "desk_t": "#87603b",
            "desk_f": "#5e3f24",
            "monitor": ["#74e8ff", "#b9f9ff", "#4cc7e7"],
            "shirt": "#5f87ce",
            "acc_a": "#e6ac58",
            "acc_b": "#7bb2d4",
        },
        {
            "floor_a": "#26303f",
            "floor_b": "#1c2430",
            "wall_a": "#35435a",
            "wall_b": "#161d2a",
            "desk_t": "#6f5b42",
            "desk_f": "#4a3a2b",
            "monitor": ["#8af7d2", "#c8ffe9", "#5ec9a7"],
            "shirt": "#b873d2",
            "acc_a": "#e2a877",
            "acc_b": "#79a5cb",
        },
        {
            "floor_a": "#2a2b3f",
            "floor_b": "#212235",
            "wall_a": "#3e3b57",
            "wall_b": "#18192a",
            "desk_t": "#7f5734",
            "desk_f": "#56381f",
            "monitor": ["#8fddff", "#d2f3ff", "#66b7dc"],
            "shirt": "#7aa3b3",
            "acc_a": "#d7b557",
            "acc_b": "#8f8fd1",
        },
    ]

    for row, pal in enumerate(palettes):
        for frame in range(3):
            ox = frame * tile_w
            oy = row * tile_h

            # subtle floor only
            for floor_row in range(22):
                spread = 8 + floor_row * 2 if floor_row <= 11 else 8 + (21 - floor_row) * 2
                start = 48 - spread
                rect(draw, ox + start, oy + 50 + floor_row, spread * 2, 1, pal["floor_a"] if floor_row % 2 == 0 else pal["floor_b"])

            # desk and geometry
            rect(draw, ox + 22, oy + 48, 40, 7, pal["desk_t"])
            rect(draw, ox + 26, oy + 55, 32, 6, pal["desk_f"])
            rect(draw, ox + 28, oy + 61, 4, 10, "#3e2818")
            rect(draw, ox + 52, oy + 61, 4, 10, "#3e2818")

            # monitor setup
            rect(draw, ox + 35, oy + 35, 14, 10, "#1b2439")
            rect(draw, ox + 37, oy + 37, 10, 6, pal["monitor"][frame])
            rect(draw, ox + 39, oy + 44, 6, 2, "#4e648f")
            rect(draw, ox + 41, oy + 46, 2, 2, "#32425f")
            rect(draw, ox + 39, oy + 47, 6, 2, "#8c9ab7")
            rect(draw, ox + 33, oy + 46, 6, 3, "#d5dbe8")
            rect(draw, ox + 46, oy + 46, 8, 3, "#d5dbe8")
            rect(draw, ox + 34, oy + 47, 5, 2, "#657896")
            rect(draw, ox + 47, oy + 47, 7, 2, "#657896")

            # character: readable human silhouette with subtle typing animation
            lean = -1 if frame == 1 else (1 if frame == 2 else 0)
            head_drop = 1 if frame == 2 else 0
            forearm_y = 65 if frame == 1 else (63 if frame == 2 else 64)

            # head + hair
            rect(draw, ox + 45 + lean, oy + 53 + head_drop, 8, 8, "#f2d399")
            rect(draw, ox + 45 + lean, oy + 52 + head_drop, 8, 2, "#5a3d29")
            rect(draw, ox + 47 + lean, oy + 55 + head_drop, 1, 1, "#2c1f16")
            rect(draw, ox + 50 + lean, oy + 55 + head_drop, 1, 1, "#2c1f16")

            # neck + torso
            rect(draw, ox + 48 + lean, oy + 61, 2, 1, "#d0b08a")
            rect(draw, ox + 43 + lean, oy + 62, 12, 10, pal["shirt"])
            rect(draw, ox + 44 + lean, oy + 63, 10, 2, "#6f9add")
            rect(draw, ox + 45 + lean, oy + 66, 8, 1, "#4f6f9f")

            # shoulders
            rect(draw, ox + 42 + lean, oy + 63, 2, 3, "#4a6a9a")
            rect(draw, ox + 55 + lean, oy + 63, 2, 3, "#4a6a9a")

            # forearms typing over keyboard (minimal movement, no side swings)
            rect(draw, ox + 40 + lean, oy + forearm_y, 5, 3, "#cfdaf0")
            rect(draw, ox + 54 + lean, oy + (forearm_y + (1 if frame == 2 else 0)), 5, 3, "#cfdaf0")
            rect(draw, ox + 41 + lean, oy + forearm_y + 2, 3, 1, "#9fb2d3")
            rect(draw, ox + 55 + lean, oy + (forearm_y + (1 if frame == 2 else 0)) + 2, 3, 1, "#9fb2d3")

            # legs
            rect(draw, ox + 46 + lean, oy + 71, 2, 5, "#374a66")
            rect(draw, ox + 50 + lean, oy + 71, 2, 5, "#374a66")
            rect(draw, ox + 45 + lean, oy + 76, 3, 1, "#222f45")
            rect(draw, ox + 50 + lean, oy + 76, 3, 1, "#222f45")

    img.save(OUT_DIR / "room_sheet.png")


def make_router_sheet() -> None:
    tile = 28
    cols = 4
    rows = 2
    img = Image.new("RGBA", (tile * cols, tile * rows), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    for row in range(rows):
        for frame in range(cols):
            ox = frame * tile
            oy = row * tile
            led = "#74ff89" if row == 0 else "#ff5858"
            dim = "#4fcb62" if row == 0 else "#c23131"
            blink = led if frame % 2 == 0 else dim
            rect(draw, ox + 1, oy + 1, 26, 26, "#0a1020")
            rect(draw, ox + 3, oy + 3, 22, 22, "#212c45" if row == 0 else "#2a1f33")
            rect(draw, ox + 6, oy + 6, 16, 7, "#5a6e94" if row == 0 else "#7f5b95")
            rect(draw, ox + 7, oy + 14, 14, 4, "#2f3f5f" if row == 0 else "#5a2f45")
            rect(draw, ox + 6, oy + 20, 4, 4, blink)
            rect(draw, ox + 12, oy + 20, 4, 4, blink)
            rect(draw, ox + 18, oy + 20, 4, 4, blink)

    img.save(OUT_DIR / "router_sheet.png")


def make_signal_sheet() -> None:
    tile = 32
    cols = 2
    img = Image.new("RGBA", (tile * cols, tile), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # VPN
    ox = 0
    rect(draw, ox + 4, 4, 24, 24, "#111a28")
    rect(draw, ox + 6, 6, 20, 20, "#2dd9b3")
    rect(draw, ox + 11, 11, 10, 10, "#0f2d3a")
    rect(draw, ox + 14, 13, 4, 5, "#52e5ff")

    # Proxy
    ox = tile
    rect(draw, ox + 4, 4, 24, 24, "#111a28")
    rect(draw, ox + 6, 6, 20, 20, "#ffad5c")
    rect(draw, ox + 9, 12, 6, 8, "#ffd380")
    rect(draw, ox + 17, 12, 6, 8, "#ffd380")
    rect(draw, ox + 14, 14, 4, 4, "#111a28")

    img.save(OUT_DIR / "signal_sheet.png")


if __name__ == "__main__":
    make_room_sheet()
    make_router_sheet()
    make_signal_sheet()
