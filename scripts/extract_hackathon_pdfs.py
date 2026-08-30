from __future__ import annotations

import json
from pathlib import Path

from pypdf import PdfReader


ROOT = Path(r"D:\FahimAI\artifacts\hackathon-source-analysis")
SOURCES = [
    Path(r"C:\Users\Marwan Yasser\Downloads\Aug24_Student_Reference.pdf"),
    Path(r"C:\Users\Marwan Yasser\Downloads\personas_template.pdf"),
    ROOT / "session1" / "Education_Landscape_Day1.pdf",
    ROOT / "session1" / "GenAI Hackathon FAQ.pdf",
]


def main() -> None:
    text_dir = ROOT / "extracted-text"
    text_dir.mkdir(parents=True, exist_ok=True)
    manifest: list[dict[str, object]] = []
    for source in SOURCES:
        reader = PdfReader(str(source))
        pages: list[str] = []
        for index, page in enumerate(reader.pages, start=1):
            text = (page.extract_text() or "").strip()
            pages.append(f"\n\n===== PAGE {index} =====\n\n{text}")
        destination = text_dir / f"{source.stem}.txt"
        destination.write_text("".join(pages).strip() + "\n", encoding="utf-8")
        manifest.append(
            {
                "source": str(source),
                "pages": len(reader.pages),
                "text_file": str(destination),
                "characters": sum(len(page) for page in pages),
                "metadata": {str(key): str(value) for key, value in (reader.metadata or {}).items()},
            }
        )
    manifest_path = ROOT / "pdf-manifest.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(manifest, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
