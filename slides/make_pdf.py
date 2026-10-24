#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Собирает презентацию и выкладывает рядом PDF для проекции.

PDF нужен на площадке, где не открывается PowerPoint, и для отправки
организаторам. Сборка презентации и экспорт — одной командой.

Запуск:  python slides/make_pdf.py
Результат: slides/output/lapa-ryadom-pitch.pdf
"""
import os
import subprocess
import sys

from render_qa import ROOT, SLIDES, PPTX, force_utf8, soffice


def main():
    force_utf8()

    print("[1/2] сборка презентации")
    p = subprocess.run(["node", "compile.js"], cwd=SLIDES, capture_output=True, text=True,
                       encoding="utf-8", errors="replace")
    sys.stdout.write(p.stdout or "")
    if p.returncode != 0:
        sys.stderr.write(p.stderr or "")
        raise SystemExit("сборка не удалась")

    out_dir = os.path.dirname(PPTX)
    print("[2/2] экспорт в PDF")
    r = subprocess.run([soffice(), "--headless", "--convert-to", "pdf",
                        "--outdir", out_dir, PPTX], capture_output=True, text=True)

    pdf = os.path.join(out_dir, os.path.basename(PPTX).replace(".pptx", ".pdf"))
    if not os.path.exists(pdf):
        sys.stderr.write(r.stderr or "")
        raise SystemExit("PDF не получился")
    print("готово:", os.path.relpath(pdf, ROOT))


if __name__ == "__main__":
    main()
