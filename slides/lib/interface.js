// Shared builder for the two "Интерфейс" slides.
//
// The first version put four 1280x900 screenshots side by side and each tile
// came out around 2.1 inches wide — unreadable from the back of the room.
// Splitting to one screenshot per slide fixed legibility but pushed the deck to
// ten slides. Two per slide is the compromise that keeps both: 4.05 inches per
// frame, on a seven-slide deck.
//
// Screenshots are captured by scripts/capture-qdb-screenshots.ps1 from the
// running app with the API pointed at Digital Q.DataBase 18.2.
const IMG_ASPECT = 1280 / 900;

function buildInterfaceSlide(pres, theme, cfg) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  addPageBadge(pres, slide, theme, cfg.n);

  slide.addText('Интерфейс', {
    x: 0.8, y: 0.24, w: 4.0, h: 0.44, margin: 0,
    fontFace: 'Georgia', fontSize: 25, bold: true, color: theme.primary
  });
  slide.addText(cfg.subtitle, {
    x: 0.8, y: 0.68, w: 8.6, h: 0.34, margin: 0,
    fontFace: 'Calibri', fontSize: 12.5, color: theme.secondary
  });

  const FRAME_W = 4.05;
  const GAP = 0.25;
  const HEAD_H = 0.26;
  const IMG_H = FRAME_W / IMG_ASPECT;
  const x0 = 0.8;
  const y = 1.16;

  cfg.frames.forEach(function (f, i) {
    const x = x0 + i * (FRAME_W + GAP);

    slide.addShape(pres.shapes.RECTANGLE, {
      x: x, y: y, w: FRAME_W, h: HEAD_H, fill: { color: theme.secondary }
    });
    slide.addText(f.step, {
      x: x, y: y, w: 0.58, h: HEAD_H, margin: 0, align: 'center', valign: 'middle',
      fontFace: 'Georgia', fontSize: 10, bold: true, color: theme.bg
    });
    slide.addText(f.label, {
      x: x + 0.6, y: y, w: FRAME_W - 0.64, h: HEAD_H, margin: 0, valign: 'middle',
      fontFace: 'Calibri', fontSize: 8, bold: true, color: theme.bg, charSpacing: 0.6
    });

    slide.addShape(pres.shapes.RECTANGLE, {
      x: x, y: y + HEAD_H + 0.02, w: FRAME_W, h: IMG_H + 0.02,
      line: { color: theme.secondary, width: 1 }
    });
    slide.addImage({ path: f.shot, x: x, y: y + HEAD_H + 0.02, w: FRAME_W, h: IMG_H });

    slide.addText(f.caption, {
      x: x, y: y + HEAD_H + 0.06 + IMG_H, w: FRAME_W, h: 0.4, margin: 0,
      fontFace: 'Calibri', fontSize: 8.5, color: theme.secondary
    });
  });

  // The counters, which are what the screenshots are there to prove.
  const stripY = 4.72;
  cfg.counters.forEach(function (c, i) {
    const x = x0 + i * ((FRAME_W + GAP) / cfg.counters.length);
    const w = (FRAME_W + GAP) / cfg.counters.length - 0.14;
    slide.addShape(pres.shapes.RECTANGLE, {
      x: x, y: stripY, w: w, h: 0.44, fill: { color: theme.light }
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: x, y: stripY, w: 0.42, h: 0.44, fill: { color: theme.primary }
    });
    slide.addText(c.code, {
      x: x, y: stripY, w: 0.42, h: 0.44, margin: 0, align: 'center', valign: 'middle',
      fontFace: 'Georgia', fontSize: 13, bold: true, color: theme.bg
    });
    slide.addText(c.nums, {
      x: x + 0.5, y: stripY, w: w - 0.56, h: 0.44, margin: 0, valign: 'middle',
      fontFace: 'Georgia', fontSize: 13, bold: true, color: theme.primary
    });
  });

  slide.addText(cfg.note, {
    x: 0.8, y: 5.20, w: 8.3, h: 0.26, margin: 0,
    fontFace: 'Calibri', fontSize: 8.5, color: theme.secondary, italic: true
  });

  return slide;
}

function addPageBadge(pres, slide, theme, n) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 9.3, y: 5.18, w: 0.42, h: 0.3, fill: { color: theme.primary }
  });
  slide.addText(String(n), {
    x: 9.3, y: 5.18, w: 0.42, h: 0.3, margin: 0, align: 'center', valign: 'middle',
    fontFace: 'Calibri', fontSize: 11, color: theme.bg
  });
}

module.exports = { buildInterfaceSlide };