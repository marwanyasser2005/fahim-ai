from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageOps, ImageDraw


ROOT = Path(r"D:\FahimAI\artifacts\hackathon-source-analysis\rendered")


def main() -> None:
    for pdf_dir in sorted(path for path in ROOT.iterdir() if path.is_dir()):
        pages = sorted(pdf_dir.glob("page-*.png"))
        if not pages:
            continue
        output_dir = pdf_dir / "contact-sheets"
        output_dir.mkdir(exist_ok=True)
        for sheet_index in range(0, len(pages), 6):
            batch = pages[sheet_index : sheet_index + 6]
            thumbnails: list[Image.Image] = []
            for page_number, path in enumerate(batch, start=sheet_index + 1):
                with Image.open(path) as source:
                    image = source.convert("RGB")
                    image.thumbnail((1_180, 760), Image.Resampling.LANCZOS)
                framed = ImageOps.expand(image, border=2, fill="#14213D")
                canvas = Image.new("RGB", (1_220, 820), "#F4F1E9")
                canvas.paste(framed, ((canvas.width - framed.width) // 2, 38))
                draw = ImageDraw.Draw(canvas)
                draw.text((20, 12), f"Page {page_number}", fill="#14213D")
                thumbnails.append(canvas)
            sheet = Image.new("RGB", (2_440, 2_460), "#E7E2D7")
            for offset, thumbnail in enumerate(thumbnails):
                x = (offset % 2) * 1_220
                y = (offset // 2) * 820
                sheet.paste(thumbnail, (x, y))
            sheet.save(output_dir / f"sheet-{sheet_index // 6 + 1:02d}.jpg", quality=90, optimize=True)


if __name__ == "__main__":
    main()
