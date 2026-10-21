// Slide 2 -- Content / Comparison: the problem, two actors with a gap between them
function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  addPageBadge(pres, slide, theme, 2);

  slide.addText('Помощь есть. Но не всегда попадает туда, где нужна', {
    x: 0.6, y: 0.42, w: 8.8, h: 0.6, margin: 0,
    fontFace: 'Georgia', fontSize: 27, bold: true, color: theme.primary, fit: 'shrink'
  });

  // ---- Left card: shelter ----
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.6, y: 1.28, w: 3.65, h: 2.72,
    fill: { color: theme.light },
    shadow: { type: 'outer', color: '000000', blur: 8, offset: 2, angle: 135, opacity: 0.1 }
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.6, y: 1.28, w: 3.65, h: 0.06, fill: { color: theme.secondary }
  });

  slide.addText('ПРИЮТ', {
    x: 0.85, y: 1.52, w: 3.1, h: 0.28, margin: 0,
    fontFace: 'Calibri', fontSize: 11, color: theme.primary, charSpacing: 1.4, bold: true
  });
  slide.addText('Нужны 20 упаковок корма', {
    x: 0.85, y: 1.84, w: 3.1, h: 0.62, margin: 0,
    fontFace: 'Georgia', fontSize: 16, bold: true, color: theme.primary
  });
  slide.addText([
    { text: 'Публикация в соцсетях устаревает', options: { breakLine: true } },
    { text: 'Привезли часть -- непонятно, сколько ещё нужно', options: { breakLine: true } },
    { text: 'Объявления теряются среди других', options: {} }
  ], {
    x: 0.85, y: 2.52, w: 3.1, h: 1.3, margin: 0,
    fontFace: 'Calibri', fontSize: 12, color: theme.primary, paraSpaceAfter: 6
  });

  // ---- Right card: person ----
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 5.75, y: 1.28, w: 3.65, h: 2.72,
    fill: { color: theme.light },
    shadow: { type: 'outer', color: '000000', blur: 8, offset: 2, angle: 135, opacity: 0.1 }
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 5.75, y: 1.28, w: 3.65, h: 0.06, fill: { color: theme.accent }
  });

  slide.addText('ЧЕЛОВЕК', {
    x: 6.0, y: 1.52, w: 3.1, h: 0.28, margin: 0,
    fontFace: 'Calibri', fontSize: 11, color: theme.primary, charSpacing: 1.4, bold: true
  });
  slide.addText('Есть 5 упаковок', {
    x: 6.0, y: 1.84, w: 3.1, h: 0.62, margin: 0,
    fontFace: 'Georgia', fontSize: 16, bold: true, color: theme.primary
  });
  slide.addText([
    { text: 'Не знает, кому именно это нужно', options: { breakLine: true } },
    { text: 'Не хочет заводить аккаунт и оставлять телефон', options: { breakLine: true } },
    { text: 'Готов помочь, но не знает, куда привезти', options: {} }
  ], {
    x: 6.0, y: 2.52, w: 3.1, h: 1.3, margin: 0,
    fontFace: 'Calibri', fontSize: 12, color: theme.primary, paraSpaceAfter: 6
  });

  // ---- The gap in the middle ----
  slide.addShape(pres.shapes.LINE, {
    x: 4.32, y: 2.64, w: 0.62, h: 0,
    line: { color: theme.accent, width: 2, dashType: 'dash' }
  });
  slide.addShape(pres.shapes.LINE, {
    x: 5.06, y: 2.64, w: 0.62, h: 0,
    line: { color: theme.accent, width: 2, dashType: 'dash' }
  });
  slide.addShape(pres.shapes.OVAL, {
    x: 4.82, y: 2.42, w: 0.44, h: 0.44, fill: { color: theme.accent }
  });
  slide.addText('!', {
    x: 4.82, y: 2.44, w: 0.44, h: 0.4, margin: 0, align: 'center', valign: 'middle',
    fontFace: 'Georgia', fontSize: 18, bold: true, color: theme.bg
  });
  slide.addText('разрыв', {
    x: 4.52, y: 2.95, w: 1.06, h: 0.26, margin: 0, align: 'center',
    fontFace: 'Calibri', fontSize: 10.5, color: theme.accent
  });

  // ---- Takeaway ----
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.6, y: 4.28, w: 8.8, h: 0.82, fill: { color: theme.primary }
  });
  slide.addText('Люди готовы помогать, но не знают, кому именно что нужно сейчас. Проблема не в нехватке вещей, а в отсутствии адресного учёта.', {
    x: 0.9, y: 4.36, w: 8.2, h: 0.66, margin: 0, valign: 'middle',
    fontFace: 'Calibri', fontSize: 14, color: theme.bg
  });

  return slide;
}

function addPageBadge(pres, slide, theme, n) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 9.3, y: 5.1, w: 0.42, h: 0.3, fill: { color: theme.primary }
  });
  slide.addText(String(n), {
    x: 9.3, y: 5.1, w: 0.42, h: 0.3, margin: 0, align: 'center', valign: 'middle',
    fontFace: 'Calibri', fontSize: 11, color: theme.bg
  });
}

module.exports = { createSlide };