from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

SIZES = [72, 96, 128, 144, 152, 192, 384, 512]
COLOR_BG = "#ec4899"
COLOR_FG = "#ffffff"
OUTPUT_DIR = Path(__file__).resolve().parent.parent / "public" / "icons"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Try to load a default system font; fallback to no text if unavailable
try:
    font = ImageFont.truetype("arial.ttf", size=96)
except Exception:
    font = None

for size in SIZES:
    img = Image.new("RGBA", (size, size), COLOR_BG)
    draw = ImageDraw.Draw(img)
    if font:
        scale = max(1, size // 4)
        sized_font = font.font_variant(size=scale * 2)
        text = "OP"
        bbox = draw.textbbox((0, 0), text, font=sized_font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        draw.text(
            ((size - text_width) / 2, (size - text_height) / 2),
            text,
            fill=COLOR_FG,
            font=sized_font,
        )
    else:
        # Draw a simple white circle if font missing
        margin = max(4, size // 6)
        draw.ellipse((margin, margin, size - margin, size - margin), outline=COLOR_FG, width=max(2, size // 16))
    output_path = OUTPUT_DIR / f"icon-{size}x{size}.png"
    img.save(output_path, format="PNG")
    print(f"Generated {output_path}")
