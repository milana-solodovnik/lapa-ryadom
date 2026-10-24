#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Собирает презентацию и раскладывает её по картинкам для визуальной проверки.

Один запуск вместо трёх команд с кавычками PowerShell, которые каждый раз
приходится подбирать заново.

Запуск:  python slides/render_qa.py [dpi]
Результат: slides/qa-render/c-01.png … c-08.png
"""
import os
import shutil
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SLIDES = os.path.join(ROOT, "slides")
OUT = os.path.join(SLIDES, "output")
QA = os.path.join(SLIDES, "qa-render")
PPTX = os.path.join(OUT, "lapa-ryadom-pitch.pptx")

SOFFICE = r"C:\Program Files\LibreOffice\program\soffice.exe"


def soffice():
    for candidate in (SOFFICE,
                      r"C:\Program Files (x86)\LibreOffice\program\soffice.exe"):
        if os.path.exists(candidate):
            return candidate
    found = shutil.which("soffice")
    if found:
        return found
    raise SystemExit("LibreOffice не найден: нужен soffice.exe для рендера в PDF")


def main():
    dpi = int(sys.argv[1]) if len(sys.argv) > 1 else 140

    print("[1/3] сборка презентации")
    p = subprocess.run(["node", "compile.js"], cwd=SLIDES, capture_output=True, text=True,
                       encoding="utf-8", errors="replace")
    sys.stdout.write(p.stdout or "")
    if p.returncode != 0:
        sys.stderr.write(p.stderr or "")
        raise SystemExit("сборка не удалась")
    if not os.path.exists(PPTX):
        raise SystemExit("нет файла " + PPTX)

    os.makedirs(QA, exist_ok=True)
    print("[2/3] рендер в PDF")
    subprocess.run([soffice(), "--headless", "--convert-to", "pdf",
                    "--outdir", QA, PPTX], capture_output=True, text=True)

    pdf = os.path.join(QA, os.path.basename(PPTX).replace(".pptx", ".pdf"))
    if not os.path.exists(pdf):
        raise SystemExit("PDF не получился")

    print("[3/3] раскладка по картинкам, %d dpi" % dpi)
    import fitz
    doc = fitz.open(pdf)
    for i in range(doc.page_count):
        out = os.path.join(QA, "c-%02d.png" % (i + 1))
        doc[i].get_pixmap(dpi=dpi).save(out)
        print("   ", os.path.relpath(out, ROOT))
    print("готово: %d слайдов" % doc.page_count)


if __name__ == "__main__":
    main()
