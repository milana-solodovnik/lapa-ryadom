// Общий конструктор для двух слайдов «Интерфейс».
//
// Первая версия клала четыре снимка 1280x900 в ряд, и каждый кадр выходил
// около 2.1 дюйма — с заднего ряда не прочитать. Разбивка по одному снимку
// на слайд решила читаемость, но раздвинула деку до десяти слайдов. Два кадра
// на слайд — компромисс, который сохраняет оба условия: 4.05 дюйма на кадр
// при семи слайдах.
//
// Снимки делает scripts/capture-qdb-screenshots.ps1 с работающего приложения,
// у которого API смотрит в Digital Q.DataBase 18.2.
const B = require('./brand.js');

const IMG_ASPECT = 1280 / 900;

function buildInterfaceSlide(pres, theme, cfg) {
  const slide = pres.addSlide();
  B.light(pres, slide);
  B.pageNo(pres, slide, cfg.n);

  slide.addText('Интерфейс', {
    x: 0.8, y: 0.16, w: 3.6, h: 0.42, margin: 0,
    fontFace: theme.fontDisplay, fontSize: 26, bold: true, color: theme.ink
  });
  slide.addText(cfg.subtitle, {
    x: 0.8, y: 0.58, w: 8.4, h: 0.3, margin: 0,
    fontFace: theme.fontBody, fontSize: 12, color: theme.violet
  });

  const FRAME_W = 4.05;
  const GAP = 0.25;
  const HEAD_H = 0.3;
  const IMG_H = FRAME_W / IMG_ASPECT;
  const x0 = 0.8;
  const y = 0.98;

  cfg.frames.forEach(function (f, i) {
    const x = x0 + i * (FRAME_W + GAP);

    // Шапка кадра: белый фон, маджента-пилюля с меткой состояния,
    // подпись с разрядкой — как на референсных слайдах.
    slide.addShape(pres.shapes.RECTANGLE, {
      x: x, y: y, w: FRAME_W, h: HEAD_H,
      fill: { color: theme.white },
      line: { color: theme.line, width: 1 }
    });
    B.pill(pres, slide, f.step, { x: x + 0.07, y: y + 0.05, w: 0.5, h: HEAD_H - 0.1 }, f.tone);
    slide.addText(f.label, {
      x: x + 0.66, y: y, w: FRAME_W - 0.72, h: HEAD_H, margin: 0, valign: 'middle',
      fontFace: theme.fontBody, fontSize: 8, bold: true, color: theme.ink, charSpacing: 0.5
    });

    slide.addShape(pres.shapes.RECTANGLE, {
      x: x, y: y + HEAD_H + 0.02, w: FRAME_W, h: IMG_H + 0.02,
      fill: { color: theme.white },
      line: { color: theme.line, width: 1 }
    });
    slide.addImage({ path: f.shot, x: x, y: y + HEAD_H + 0.02, w: FRAME_W, h: IMG_H });

    slide.addText(f.caption, {
      x: x, y: y + HEAD_H + 0.06 + IMG_H, w: FRAME_W, h: 0.34, margin: 0,
      fontFace: theme.fontBody, fontSize: 8, color: theme.muted
    });
  });

  // Счётчики — ради чего, собственно, снимки и нужны.
  const stripY = 4.60;
  const cellW = (FRAME_W + GAP) / cfg.counters.length;
  cfg.counters.forEach(function (c, i) {
    const x = x0 + i * cellW;
    const w = cellW - 0.16;
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: x, y: stripY, w: w, h: 0.42, rectRadius: 0.06,
      fill: { color: theme.white },
      line: { color: theme.line, width: 1 }
    });
    B.pill(pres, slide, c.code, { x: x + 0.07, y: stripY + 0.06, w: 0.42, h: 0.3, size: 9 }, c.tone);
    slide.addText(c.nums, {
      x: x + 0.56, y: stripY, w: w - 0.62, h: 0.42, margin: 0, valign: 'middle',
      fontFace: theme.fontDisplay, fontSize: 12.5, bold: true, color: theme.ink
    });
  });

  slide.addText(cfg.note, {
    x: 0.8, y: 5.08, w: 8.0, h: 0.24, margin: 0,
    fontFace: theme.fontBody, fontSize: 8.5, color: theme.muted, italic: true
  });

  return slide;
}

module.exports = { buildInterfaceSlide };