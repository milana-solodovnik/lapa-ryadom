#!/usr/bin/env python3
# Build the speaker script for Milana as a Word document.
#
# The deck itself only carries what the audience sees; everything the presenter
# needs to say lives here. This is the same content that used to sit on the two
# "advice" slides, rewritten against the current ten-slide structure.
#
# Usage: python scripts/build-speaker-docx.py
#
# Content lives in slides/speaker-script.json so that the text can be reviewed
# as data rather than buried in formatting code.
import json
import pathlib

from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

ROOT = pathlib.Path(__file__).resolve().parent.parent
CONFIG = ROOT / "slides" / "speaker-script.json"
OUT = ROOT / "docs" / "Лапа рядом — текст выступления.docx"

# Palette shared with the deck so the two artefacts look like one project.
DARK = RGBColor(0x28, 0x36, 0x18)
OLIVE = RGBColor(0x60, 0x6C, 0x38)
ORANGE = RGBColor(0xBC, 0x6C, 0x25)
CREAM = RGBColor(0xFE, 0xFA, 0xE0)
INK = RGBColor(0x1F, 0x1F, 0x1F)


def shade(cell, hex_color):
    el = OxmlElement("w:shd")
    el.set(qn("w:val"), "clear")
    el.set(qn("w:fill"), hex_color)
    cell._tc.get_or_add_tcPr().append(el)


def set_cell_borders(table, hex_color="606c38", size=4):
    borders = OxmlElement("w:tblBorders")
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        e = OxmlElement(f"w:{edge}")
        e.set(qn("w:val"), "single")
        e.set(qn("w:sz"), str(size))
        e.set(qn("w:color"), hex_color)
        borders.append(e)
    table._tbl.tblPr.append(borders)


def run_font(run, name, size, bold=False, italic=False, color=INK):
    run.font.name = name
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.italic = italic
    run.font.color.rgb = color
    # Cyrillic must be routed through the same face, not the default.
    rpr = run._element.get_or_add_rPr()
    rfonts = rpr.find(qn("w:rFonts"))
    if rfonts is None:
        rfonts = OxmlElement("w:rFonts")
        rpr.append(rfonts)
    for attr in ("w:ascii", "w:hAnsi", "w:cs", "w:eastAsia"):
        rfonts.set(qn(attr), name)


def add_page_number_footer(section):
    p = section.footer.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run()
    run_font(run, "Calibri", 9, color=OLIVE)
    for kind, instr in (("begin", None), ("instr", "PAGE"), ("end", None)):
        if kind == "instr":
            el = OxmlElement("w:instrText")
            el.set(qn("xml:space"), "preserve")
            el.text = instr
        else:
            el = OxmlElement("w:fldChar")
            el.set(qn("w:fldCharType"), kind)
        run._r.append(el)


def build_table(doc, block):
    headers = block.get("headers", [])
    rows = block.get("rows", [])
    table = doc.add_table(rows=0, cols=len(headers))
    table.style = "Table Grid"
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_cell_borders(table)

    # One header row, then one row per data row. Adding a row per cell would
    # stagger the header diagonally down the table.
    header = table.add_row()
    for i, text in enumerate(headers):
        cell = header.cells[i]
        cell.text = ""
        shade(cell, "283618")
        para = cell.paragraphs[0]
        para.paragraph_format.space_after = Pt(2)
        para.paragraph_format.space_before = Pt(2)
        run_font(para.add_run(text), "Calibri", 9.5, bold=True, color=CREAM)

    for r, row in enumerate(rows):
        cells = table.add_row().cells
        for i, text in enumerate(row):
            cells[i].text = ""
            if r % 2 == 1:
                shade(cells[i], "F4EFD4")
            para = cells[i].paragraphs[0]
            para.paragraph_format.space_after = Pt(2)
            para.paragraph_format.space_before = Pt(2)
            run_font(para.add_run(text), "Calibri", 9.5, color=INK)

    doc.add_paragraph().paragraph_format.space_after = Pt(4)


def build(doc):
    cfg = json.loads(CONFIG.read_text(encoding="utf-8"))

    section = doc.sections[0]
    section.page_width = Cm(21.0)
    section.page_height = Cm(29.7)
    section.top_margin = Cm(2.0)
    section.bottom_margin = Cm(2.0)
    section.left_margin = Cm(2.5)
    section.right_margin = Cm(2.0)
    add_page_number_footer(section)

    style = doc.styles["Normal"]
    style.font.name = "Calibri"
    style.font.size = Pt(11)
    style.paragraph_format.space_after = Pt(8)
    style.paragraph_format.line_spacing = 1.15

    title = doc.add_paragraph()
    title.paragraph_format.space_after = Pt(2)
    run_font(title.add_run(cfg["title"]), "Georgia", 24, bold=True, color=DARK)

    sub = doc.add_paragraph()
    sub.paragraph_format.space_after = Pt(2)
    run_font(sub.add_run(cfg["subtitle"]), "Calibri", 12, color=OLIVE)

    who = doc.add_paragraph()
    who.paragraph_format.space_after = Pt(14)
    run_font(who.add_run(cfg["author"]), "Calibri", 10.5, color=OLIVE)

    for sec in cfg["sections"]:
        head = doc.add_paragraph()
        head.paragraph_format.space_before = Pt(16)
        head.paragraph_format.space_after = Pt(6)
        head.paragraph_format.keep_with_next = True
        run_font(head.add_run(sec["heading"]), "Georgia", 15, bold=True, color=DARK)

        for block in sec.get("content", []):
            kind = block.get("type")
            if kind == "paragraph":
                p = doc.add_paragraph()
                run_font(p.add_run(block["text"]), "Calibri", 11, color=INK)
            elif kind == "list":
                for item in block.get("items", []):
                    p = doc.add_paragraph(style="List Bullet")
                    p.paragraph_format.space_after = Pt(3)
                    run_font(p.add_run(item), "Calibri", 11, color=INK)
            elif kind == "table":
                build_table(doc, block)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    doc.save(OUT)
    # The Windows console here is cp1252 and cannot print the Cyrillic filename.
    print(f"WROTE {OUT.name.encode('ascii', 'replace').decode('ascii')}")


if __name__ == "__main__":
    build(Document())