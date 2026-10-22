// Shared builder for the four "Интерфейс" slides.
//
// The original demo slide squeezed four 1280x900 screenshots into a 10-inch
// canvas; each tile came out around 2.1 inches wide and the numbers in the
// cards were unreadable from the back of the room. One screenshot per slide at
// full height fixes that.
//
// Screenshots are captured by scripts/capture-qdb-screenshots.ps1 from the
// running app with the API pointed at Digital Q.DataBase 18.2.
const IMG_ASPECT = 1280 / 900;

function buildInterfaceSlide(pres, theme, cfg) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  addPageBadge(pres, slide, theme, cfg.n);

  slide.addText('Интерфейс', {
    x: 0.62, y: 0.24, w: 4.0, h: 0.46, margin: 0,
    fontFace: 'Georgia', fontSize: 26, bold: true, color: theme.primary
  });
  slide.addText(cfg.subtitle, {
    x: 0.62, y: 0.70, w: 8.8, h: 0.34, margin: 0,
    fontFace: 'Calibri', fontSize: 13, color: theme.secondary
  });

  // Screenshot, given most of the canvas.
  const IMG_W = 5.6;
  const IMG_H = IMG_W / IMG_ASPECT;
  const shotY = 1.22;

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.62, y: shotY - 0.26, w: IMG_W, h: 0.26, fill: { color: theme.secondary }
  });
  slide.addText(cfg.shotLabel, {
    x: 0.70, y: shotY - 0.26, w: IMG_W - 0.16, h: 0.26, margin: 0, valign: 'middle',
    fontFace: 'Calibri', fontSize: 8, bold: true, color: theme.bg, charSpacing: 0.8
  });

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.62, y: shotY, w: IMG_W, h: IMG_H + 0.02,
    line: { color: theme.secondary, width: 1 }
  });
  slide.addImage({ path: cfg.shot, x: 0.62, y: shotY, w: IMG_W, h: IMG_H });

  // Right column: the four counters, then the reading of them. The shelter
  // login screen shows no need counters, so the panel is optional.
  const RX = 6.5;
  const RW = 2.9;

  slide.addText(cfg.panelTitle, {
    x: RX, y: shotY - 0.26, w: RW, h: 0.26, margin: 0, valign: 'middle',
    fontFace: 'Calibri', fontSize: 8, bold: true, color: theme.bg, charSpacing: 0.5,
    fill: { color: theme.primary }
  });

  if (cfg.numbers) {
    cfg.numbers.forEach(function (row, i) {
      const y = shotY + i * 0.42;
      const hot = i === cfg.highlight;
      slide.addShape(pres.shapes.RECTANGLE, {
        x: RX, y: y, w: RW, h: 0.38,
        fill: { color: hot ? theme.light : theme.bg },
        line: { color: hot ? theme.light : theme.secondary, width: 1 }
      });
      slide.addText(row[0], {
        x: RX + 0.14, y: y, w: 1.5, h: 0.38, margin: 0, valign: 'middle',
        fontFace: 'Calibri', fontSize: 11.5, color: theme.primary
      });
      slide.addText(row[1], {
        x: RX + 1.6, y: y, w: RW - 1.74, h: 0.38, margin: 0, align: 'right', valign: 'middle',
        fontFace: 'Georgia', fontSize: hot ? 17 : 15, bold: true, color: theme.primary
      });
    });
  }

  const notesY = cfg.numbers ? shotY + cfg.numbers.length * 0.42 + 0.14 : shotY;
  slide.addText(cfg.notes, {
    x: RX, y: notesY, w: RW, h: 2.2, margin: 0,
    fontFace: 'Calibri', fontSize: 11, color: theme.primary
  });

  slide.addText('Кадр снят с работающего приложения на Digital Q.DataBase 18.2.', {
    x: 0.62, y: shotY + IMG_H + 0.10, w: IMG_W, h: 0.24, margin: 0,
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