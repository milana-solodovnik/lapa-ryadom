// Slide 1 -- Cover page (asymmetric left text / right dark panel)
function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  // Right dark panel
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 6.1, y: 0, w: 3.9, h: 5.625,
    fill: { color: theme.primary }
  });

  // Decorative paw-like dots on the light side
  slide.addShape(pres.shapes.OVAL, { x: 5.55, y: 0.62, w: 0.16, h: 0.16, fill: { color: theme.accent } });
  slide.addShape(pres.shapes.OVAL, { x: 5.78, y: 0.78, w: 0.12, h: 0.12, fill: { color: theme.secondary } });
  slide.addShape(pres.shapes.OVAL, { x: 5.46, y: 0.84, w: 0.1, h: 0.1, fill: { color: theme.light } });

  // Eyebrow
  slide.addText('КОНКУРС ПРОЕКТОВ DIGITAL Q.DATABASE 2026', {
    x: 0.7, y: 0.95, w: 4.6, h: 0.28, margin: 0,
    fontFace: 'Calibri', fontSize: 10.5, color: theme.accent,
    charSpacing: 1.6, bold: false
  });

  // Main title
  slide.addText('Лапа рядом', {
    x: 0.66, y: 1.3, w: 5.0, h: 1.0, margin: 0,
    fontFace: 'Georgia', fontSize: 54, bold: true, color: theme.primary, fit: 'shrink'
  });

  // Subtitle
  slide.addText('Адресная помощь приютам для животных', {
    x: 0.7, y: 2.38, w: 5.0, h: 0.4, margin: 0,
    fontFace: 'Calibri', fontSize: 20, color: theme.secondary
  });

  // Divider
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.7, y: 3.05, w: 1.1, h: 0.035, fill: { color: theme.accent }
  });

  // Presenter
  slide.addText('Милана Солодовник', {
    x: 0.7, y: 3.20, w: 5.0, h: 0.38, margin: 0,
    fontFace: 'Georgia', fontSize: 18, bold: true, color: theme.primary
  });

  slide.addText('Московский технический университет связи и информатики (МТУСИ)', {
    x: 0.7, y: 3.62, w: 5.0, h: 0.26, margin: 0,
    fontFace: 'Calibri', fontSize: 11, color: theme.primary
  });

  slide.addText('Колледж Телекоммуникаций', {
    x: 0.7, y: 3.90, w: 5.0, h: 0.24, margin: 0,
    fontFace: 'Calibri', fontSize: 9.5, color: theme.secondary
  });

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.7, y: 4.34, w: 1.1, h: 0.03, fill: { color: theme.accent }
  });

  slide.addText('День СУБД 2026  --  27 октября, Москва, Кибердом', {
    x: 0.7, y: 4.48, w: 5.0, h: 0.28, margin: 0,
    fontFace: 'Calibri', fontSize: 11, color: theme.secondary
  });

  slide.addText('Демонстрационный проект. Приюты и передачи вымышлены.', {
    x: 0.7, y: 4.80, w: 5.0, h: 0.28, margin: 0,
    fontFace: 'Calibri', fontSize: 9.5, color: theme.secondary
  });

  // ---- Panel content ----
  slide.addText('УЧЁТ ПОМОЩИ', {
    x: 6.55, y: 0.85, w: 3.0, h: 0.26, margin: 0,
    fontFace: 'Calibri', fontSize: 10.5, color: theme.light, charSpacing: 1.6
  });

  slide.addText('Итог после передачи', {
    x: 6.55, y: 1.18, w: 3.0, h: 0.34, margin: 0,
    fontFace: 'Georgia', fontSize: 14, bold: true, color: theme.bg
  });

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 6.55, y: 1.62, w: 3.0, h: 0.02, fill: { color: theme.secondary }
  });

  // The D2 state shown here is the same run as the interface slides: five
  // promised, three handed over, the two uncollected packs released back.
  const rows = [
    { label: 'требуется', value: '50', vColor: theme.bg, vSize: 26 },
    { label: 'обещано', value: '0', vColor: theme.light, vSize: 22 },
    { label: 'получено', value: '3', vColor: theme.light, vSize: 22 },
    { label: 'свободно', value: '47', vColor: theme.accent, vSize: 30 }
  ];
  rows.forEach(function (r, i) {
    const y = 1.78 + i * 0.6;
    slide.addText(r.label, {
      x: 6.55, y: y + 0.08, w: 1.6, h: 0.3, margin: 0,
      fontFace: 'Calibri', fontSize: 12, color: theme.bg
    });
    slide.addText(r.value, {
      x: 8.05, y: y, w: 1.5, h: 0.45, margin: 0, align: 'right',
      fontFace: 'Georgia', fontSize: r.vSize, bold: true, color: r.vColor
    });
  });

  slide.addText('упаковок сухого корма для собак', {
    x: 6.55, y: 4.28, w: 3.0, h: 0.3, margin: 0,
    fontFace: 'Calibri', fontSize: 11, color: theme.secondary
  });

  slide.addText('Обещали 5, привезли 3. Две непривезённые упаковки вернулись в свободный остаток.', {
    x: 6.55, y: 4.62, w: 3.0, h: 0.6, margin: 0,
    fontFace: 'Calibri', fontSize: 11, color: theme.bg, italic: true
  });

  return slide;
}

module.exports = { createSlide };