"""QA extraction for the Lapa ryadom pitch deck.

Dumps per-slide text, shape inventory, table contents and a canvas-bounds check.
Usage: python qa_dump.py <path-to.pptx>
"""
import sys
import io
from pptx import Presentation
from pptx.util import Emu

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

SLIDE_W_IN = 10.0
SLIDE_H_IN = 5.625
EMU_PER_IN = 914400


def inches(v):
    if v is None:
        return None
    return round(v / EMU_PER_IN, 3)


def main(path):
    prs = Presentation(path)
    print(f"FILE: {path}")
    print(f"SLIDE COUNT: {len(prs.slides)}")
    print(f"SLIDE SIZE: {inches(prs.slide_width)} x {inches(prs.slide_height)} in")
    print()

    overflow = []
    missing_badge = []

    for i, slide in enumerate(prs.slides, start=1):
        print(f"===== SLIDE {i} =====")
        texts = []
        for shape in slide.shapes:
            x, y = inches(shape.left), inches(shape.top)
            w, h = inches(shape.width), inches(shape.height)
            if None not in (x, y, w, h):
                if x + w > SLIDE_W_IN + 0.02 or y + h > SLIDE_H_IN + 0.02:
                    overflow.append(
                        f"  slide {i}: '{shape.shape_type}' "
                        f"x={x} y={y} w={w} h={h} -> right={round(x + w, 3)} bottom={round(y + h, 3)}"
                    )
                if x < -0.02 or y < -0.02:
                    overflow.append(f"  slide {i}: negative origin x={x} y={y}")

            if shape.has_text_frame:
                t = shape.text_frame.text.strip()
                if t:
                    texts.append(t)
            if shape.has_table:
                for row in shape.table.rows:
                    cells = [c.text.strip() for c in row.cells]
                    texts.append(" | ".join(cells))

        for t in texts:
            print("  " + t.replace("\n", " / "))

        if i > 1:
            badge_ok = any(
                t.strip() == str(i) for t in texts
            )
            if not badge_ok:
                missing_badge.append(i)
        print()

    print("===== CHECKS =====")
    if overflow:
        print("CANVAS BOUNDS: FAIL")
        for o in overflow:
            print(o)
    else:
        print("CANVAS BOUNDS: PASS (all shapes within 10.0 x 5.625)")

    if missing_badge:
        print(f"PAGE BADGE: FAIL (missing on slides {missing_badge})")
    else:
        print("PAGE BADGE: PASS (present on all non-cover slides)")

    import re
    blob = "\n".join(
        s.text_frame.text for sl in prs.slides for s in sl.shapes if s.has_text_frame
    )
    placeholders = re.findall(
        r"(?i)\b(lorem|ipsum|placeholder|xxxx|TODO|FIXME)\b", blob
    )
    if placeholders:
        print(f"PLACEHOLDER TEXT: FAIL -> {set(placeholders)}")
    else:
        print("PLACEHOLDER TEXT: PASS (no lorem/ipsum/xxxx/TODO)")

    # The counters must be the ones the real Digital Q.DataBase run produced:
    # target 50, five promised, three received, 47 left free. If someone
    # reinstates the old invented 20/17 pair this check fails, which is the
    # point.
    # The author is listed as "Солодовник М. Е." — Milana's own choice on the
    # title slide, so the check looks for the surname and the college.
    required = ["50", "5", "3", "47", "Digital Q.DataBase", "Лапа рядом",
                "Солодовник", "КТ МТУСИ", "GitHub"]
    missing = [k for k in required if k not in blob]
    if missing:
        print(f"KEY FACTS: FAIL -> missing {missing}")
    else:
        print("KEY FACTS: PASS (all required facts present)")


if __name__ == "__main__":
    main(sys.argv[1])