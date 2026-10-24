// Слайд 1 — титульный.
//
// Слева светлая часть с сиреневым градиентом, справа фирменная панель.
// Числа справа — реальное состояние после передачи из тех же прогонов,
// что и на слайдах интерфейса (D2): 50 / 0 / 3 / 47.
const B = require('./lib/brand.js');

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  B.light(pres, slide);

  // ---- Правая панель ----
  const PANEL_X = 5.6;
  const PANEL_W = B.SLIDE_W - PANEL_X;
  slide.addImage({
    path: B.asset('panel-purple.png'),
    x: PANEL_X, y: 0, w: PANEL_W, h: B.SLIDE_H
  });

  const PX = PANEL_X + 0.42;      // внутреннее поле панели
  const PW = PANEL_W - 0.84;

  B.eyebrow(pres, slide, 'УЧЁТ ПОМОЩИ', { x: PX, y: 0.78, w: PW, color: 'E3D4F2' });
  slide.addText('Итог после передачи', {
    x: PX, y: 1.04, w: PW, h: 0.32, margin: 0,
    fontFace: theme.fontDisplay, fontSize: 15, bold: true, color: theme.white
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x: PX, y: 1.44, w: PW, h: 0.012,
    fill: { color: theme.white, transparency: 65 }
  });

  const rows = [
    { label: 'требуется', value: '50', color: theme.white, size: 24 },
    { label: 'обещано', value: '0', color: 'E8D9F4', size: 20 },
    { label: 'получено', value: '3', color: 'E8D9F4', size: 20 },
    { label: 'свободно', value: '47', color: 'FFC7E2', size: 30 }
  ];
  rows.forEach(function (r, i) {
    const y = 1.60 + i * 0.56;
    slide.addText(r.label, {
      x: PX, y: y + 0.08, w: 1.6, h: 0.28, margin: 0,
      fontFace: theme.fontBody, fontSize: 11.5, color: theme.white
    });
    slide.addText(r.value, {
      x: PX + 1.5, y: y, w: PW - 1.5, h: 0.44, margin: 0, align: 'right',
      fontFace: theme.fontDisplay, fontSize: r.size, bold: true, color: r.color
    });
  });

  slide.addText('упаковок сухого корма для собак', {
    x: PX, y: 3.98, w: PW, h: 0.26, margin: 0,
    fontFace: theme.fontBody, fontSize: 10.5, color: theme.white
  });
  slide.addText('Обещали 5, привезли 3. Две непривезённые упаковки вернулись в свободный остаток.', {
    x: PX, y: 4.26, w: PW, h: 0.7, margin: 0,
    fontFace: theme.fontBody, fontSize: 10.5, color: theme.white, italic: true
  });

  // ---- Левая часть ----
  // Левое поле 0.6" — единая сетка со слайдами 2, 3, 6, 7 (brand.M).
  B.eyebrow(pres, slide, 'КОНКУРС DIGITAL Q.DATABASE 2026', { x: 0.6, y: 0.86, w: 4.6 });

  slide.addText('Лапа рядом', {
    x: 0.6, y: 1.16, w: 4.6, h: 0.86, margin: 0,
    fontFace: theme.fontDisplay, fontSize: 50, bold: true, color: theme.ink, fit: 'shrink'
  });
  slide.addText('Адресная помощь приютам для животных', {
    x: 0.6, y: 2.18, w: 4.6, h: 0.34, margin: 0,
    fontFace: theme.fontBody, fontSize: 15.5, color: theme.body
  });

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.6, y: 2.78, w: 1.05, h: 0.035, fill: { color: theme.accent }
  });

  slide.addText('Солодовник М. Е.', {
    x: 0.6, y: 2.96, w: 4.6, h: 0.34, margin: 0,
    fontFace: theme.fontDisplay, fontSize: 17, bold: true, color: theme.ink
  });
  slide.addText('Колледж телекоммуникаций Московского технического университета связи и информатики (КТ МТУСИ)', {
    x: 0.6, y: 3.42, w: 4.6, h: 0.5, margin: 0, valign: 'top',
    fontFace: theme.fontBody, fontSize: 10.5, color: theme.body
  });

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.6, y: 4.18, w: 1.05, h: 0.02, fill: { color: theme.line }
  });
  slide.addText('День СУБД 2026  —  27 октября, Москва, Кибердом', {
    x: 0.6, y: 4.32, w: 4.6, h: 0.26, margin: 0,
    fontFace: theme.fontBody, fontSize: 10.5, color: theme.muted
  });

  // Три круга лапки в акцентных цветах — мотив сохраняется, палитра новая.
  slide.addShape(pres.shapes.OVAL, { x: 4.68, y: 1.14, w: 0.15, h: 0.15, fill: { color: theme.accent } });
  slide.addShape(pres.shapes.OVAL, { x: 4.89, y: 1.29, w: 0.11, h: 0.11, fill: { color: theme.pink } });
  slide.addShape(pres.shapes.OVAL, { x: 4.60, y: 1.35, w: 0.09, h: 0.09, fill: { color: theme.violet } });

  B.pageNo(pres, slide, 1, 'E3D4F2');
  return slide;
}

module.exports = { createSlide };