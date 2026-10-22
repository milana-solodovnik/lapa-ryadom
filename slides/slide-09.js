// Slide 9 -- Appendix: timing variants 5 / 7 / 10 minutes
function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  addPageBadge(pres, slide, theme, 9);

  slide.addText('ПРИЛОЖЕНИЕ -- тайминг выступления', {
    x: 0.6, y: 0.3, w: 6.0, h: 0.26, margin: 0,
    fontFace: 'Calibri', fontSize: 10, color: theme.accent, charSpacing: 1.2, bold: true
  });

  slide.addText('Сколько успеем сказать', {
    x: 0.6, y: 0.6, w: 8.8, h: 0.55, margin: 0,
    fontFace: 'Georgia', fontSize: 26, bold: true, color: theme.primary
  });

  slide.addText('Точный лимит нужно согласовать с организаторами. Запас времени лучше брать сокращением вступления, а не демонстрации.', {
    x: 0.6, y: 1.16, w: 8.8, h: 0.28, margin: 0,
    fontFace: 'Calibri', fontSize: 12, color: theme.secondary
  });

  // ---- 7 minutes: the baseline ----
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.6, y: 1.6, w: 4.28, h: 2.44, fill: { color: theme.light },
    shadow: { type: 'outer', color: '000000', blur: 6, offset: 2, angle: 135, opacity: 0.1 }
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.6, y: 1.6, w: 4.28, h: 0.06, fill: { color: theme.secondary }
  });
  slide.addText('7 минут -- базовый вариант', {
    x: 0.84, y: 1.76, w: 3.8, h: 0.3, margin: 0,
    fontFace: 'Georgia', fontSize: 13.5, bold: true, color: theme.primary
  });

  const base = [
    ['00:00', 'Вступление и бытовая ситуация', '0:40'],
    ['00:40', 'Проблема и идея', '0:55'],
    ['01:35', 'От заявки до приёмки (кадры D0 → D2)', '3:10'],
    ['04:45', 'Учёт, транзакции, база данных', '1:25'],
    ['06:10', 'Итог и следующие шаги', '0:50']
  ];
  base.forEach(function (r, i) {
    const y = 2.16 + i * 0.34;
    slide.addText(r[0], {
      x: 0.84, y: y, w: 0.62, h: 0.28, margin: 0,
      fontFace: 'Consolas', fontSize: 10, color: theme.primary
    });
    slide.addText(r[1], {
      x: 1.5, y: y, w: 2.6, h: 0.28, margin: 0,
      fontFace: 'Calibri', fontSize: 10.5, color: theme.primary
    });
    slide.addText(r[2], {
      x: 4.14, y: y, w: 0.6, h: 0.28, margin: 0, align: 'right',
      fontFace: 'Calibri', fontSize: 10.5, color: theme.accent, bold: true
    });
  });

  // ---- 5 minutes ----
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 5.12, y: 1.6, w: 4.28, h: 1.16, fill: { color: theme.light },
    shadow: { type: 'outer', color: '000000', blur: 6, offset: 2, angle: 135, opacity: 0.1 }
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 5.12, y: 1.6, w: 4.28, h: 0.06, fill: { color: theme.accent }
  });
  slide.addText('5 минут -- сокращённый', {
    x: 5.36, y: 1.74, w: 3.8, h: 0.28, margin: 0,
    fontFace: 'Georgia', fontSize: 13.5, bold: true, color: theme.primary
  });
  slide.addText([
    { text: 'Слайды 1--3 сводим в одно вступление', options: { bullet: true, breakLine: true } },
    { text: 'Не создаём приют и потребность на сцоне', options: { bullet: true, breakLine: true } },
    { text: 'Один пример, одна проверенная фраза о базе', options: { bullet: true } }
  ], {
    x: 5.36, y: 2.04, w: 3.8, h: 0.66, margin: 0,
    fontFace: 'Calibri', fontSize: 10.5, color: theme.primary, paraSpaceAfter: 2
  });

  // ---- 10 minutes ----
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 5.12, y: 2.88, w: 4.28, h: 1.16, fill: { color: theme.light },
    shadow: { type: 'outer', color: '000000', blur: 6, offset: 2, angle: 135, opacity: 0.1 }
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 5.12, y: 2.88, w: 4.28, h: 0.06, fill: { color: theme.accent }
  });
  slide.addText('10 минут -- расширенный', {
    x: 5.36, y: 3.02, w: 3.8, h: 0.28, margin: 0,
    fontFace: 'Georgia', fontSize: 13.5, bold: true, color: theme.primary
  });
  slide.addText([
    { text: 'Базовый сценарий 7 минут', options: { bullet: true, breakLine: true } },
    { text: 'Конкурентный запрос на последний остаток (+0:50)', options: { bullet: true, breakLine: true } },
    { text: 'Показ переноса и сверки (+1:10) и вывод о развитии (+0:40)', options: { bullet: true } }
  ], {
    x: 5.36, y: 3.32, w: 3.8, h: 0.66, margin: 0,
    fontFace: 'Calibri', fontSize: 10.5, color: theme.primary, paraSpaceAfter: 2
  });

  // ---- Bottom reminder ----
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.6, y: 4.24, w: 8.8, h: 0.82, fill: { color: theme.primary }
  });
  slide.addText([
    { text: 'Короткая формула для ведущего: ', options: { bold: true } },
    { text: '"Я покажу, как пять обещанных упаковок превращаются в три реально полученные -- и почему система не путает эти значения".', options: {} }
  ], {
    x: 0.86, y: 4.3, w: 8.28, h: 0.7, margin: 0, valign: 'middle',
    fontFace: 'Calibri', fontSize: 13, color: theme.bg
  });

  slide.addText('Расширение добавляем только проверенными фактами, а не перечислением возможностей, которых ещё нет.', {
    x: 0.6, y: 5.14, w: 8.6, h: 0.28, margin: 0,
    fontFace: 'Calibri', fontSize: 9.5, color: theme.secondary, italic: true
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