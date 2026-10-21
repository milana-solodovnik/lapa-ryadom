// Slide 5 -- Content / Data: five entities plus the counter table
function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  addPageBadge(pres, slide, theme, 5);

  slide.addText('Что делает база данных', {
    x: 0.6, y: 0.36, w: 8.8, h: 0.55, margin: 0,
    fontFace: 'Georgia', fontSize: 30, bold: true, color: theme.primary
  });
  slide.addText('Пять связанных сущностей. Итоговые количества вычисляются, а не хранятся.', {
    x: 0.6, y: 0.94, w: 8.8, h: 0.28, margin: 0,
    fontFace: 'Calibri', fontSize: 13, color: theme.secondary
  });

  // ---- Left: entity chain ----
  slide.addText('СУЩНОСТИ И СВЯЗИ', {
    x: 0.6, y: 1.34, w: 4.3, h: 0.26, margin: 0,
    fontFace: 'Calibri', fontSize: 10, color: theme.primary, charSpacing: 1.2, bold: true
  });

  const entities = [
    { ru: 'Приюты', en: 'shelters', desc: 'кто помогает и где принимают' },
    { ru: 'Сотрудники', en: 'accounts', desc: 'представитель привязан к своему приюту' },
    { ru: 'Потребности', en: 'needs', desc: 'что нужно, сколько, с каким приоритетом' },
    { ru: 'Предложения', en: 'offers', desc: 'что пообещали, срок резерва 7 суток' },
    { ru: 'Передачи', en: 'deliveries', desc: 'что реально приняли, одна запись на предложение' }
  ];

  entities.forEach(function (e, i) {
    const y = 1.66 + i * 0.63;
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.6, y: y, w: 0.36, h: 0.36, fill: { color: theme.primary }
    });
    slide.addText(String(i + 1), {
      x: 0.6, y: y, w: 0.36, h: 0.36, margin: 0, align: 'center', valign: 'middle',
      fontFace: 'Georgia', fontSize: 12, bold: true, color: theme.bg
    });
    slide.addText([
      { text: e.ru + '  ', options: { bold: true, fontSize: 13 } },
      { text: e.en, options: { fontSize: 10, color: theme.accent } }
    ], {
      x: 1.08, y: y - 0.02, w: 3.85, h: 0.26, margin: 0,
      fontFace: 'Georgia', color: theme.primary
    });
    slide.addText(e.desc, {
      x: 1.08, y: y + 0.22, w: 3.85, h: 0.24, margin: 0,
      fontFace: 'Calibri', fontSize: 10.5, color: theme.secondary
    });
    if (i < entities.length - 1) {
      slide.addShape(pres.shapes.LINE, {
        x: 0.78, y: y + 0.38, w: 0, h: 0.23,
        line: { color: theme.secondary, width: 1.25, dashType: 'dash' }
      });
    }
  });

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.6, y: 4.86, w: 4.3, h: 0.42, fill: { color: theme.light }
  });
  slide.addText('Свободно = требуется -- обещано -- получено', {
    x: 0.74, y: 4.86, w: 4.05, h: 0.42, margin: 0, valign: 'middle',
    fontFace: 'Calibri', fontSize: 11.5, color: theme.primary
  });

  // ---- Right: counter table ----
  slide.addText('СЧЁТЧИКИ НА ЭКРАНЕ', {
    x: 5.2, y: 1.34, w: 4.2, h: 0.26, margin: 0,
    fontFace: 'Calibri', fontSize: 10, color: theme.primary, charSpacing: 1.2, bold: true
  });

  const head = function (t) {
    return { text: t, options: { fill: { color: '283618' }, color: 'FEFae0', bold: true, fontSize: 9, align: 'center', valign: 'middle' } };
  };
  const cell = function (t, opts) {
    const o = { fontSize: 12, align: 'center', valign: 'middle', color: '283618' };
    if (opts) { Object.keys(opts).forEach(function (k) { o[k] = opts[k]; }); }
    return { text: t, options: o };
  };
  const labelCell = function (t, opts) {
    const o = { fontSize: 11, align: 'left', valign: 'middle', color: '283618', bold: true };
    if (opts) { Object.keys(opts).forEach(function (k) { o[k] = opts[k]; }); }
    return { text: t, options: o };
  };

  const rows = [
    [head('Шаг'), head('Требуется'), head('Обещано'), head('Получено'), head('Свободно')],
    [labelCell('D0 начало'), cell('20'), cell('0'), cell('0'), cell('20', { bold: true })],
    [labelCell('D1 обещали 5'), cell('20'), cell('5', { bold: true, color: 'bc6c25' }), cell('0'), cell('15', { bold: true })],
    [labelCell('D2 приняли 3'), cell('20'), cell('0'), cell('3', { bold: true, color: 'bc6c25' }), cell('17', { bold: true, color: 'bc6c25' })]
  ];

  // colW widened for the 4 numeric columns so the 9pt headers do not break mid-word.
  slide.addTable(rows, {
    x: 5.2, y: 1.66, w: 4.2, colW: [1.16, 0.76, 0.76, 0.76, 0.76],
    rowH: 0.4,
    border: { pt: 0.75, color: '606c38' },
    fill: { color: 'FEFae0' },
    fontFace: 'Calibri',
    margin: 2
  });

  slide.addText('Почему обещано становится 0 при D2', {
    x: 5.2, y: 3.42, w: 4.2, h: 0.26, margin: 0,
    fontFace: 'Georgia', fontSize: 12.5, bold: true, color: theme.primary
  });
  slide.addText([
    { text: 'Частичное подтверждение переводит предложение в статус "получено".', options: { breakLine: true } },
    { text: 'Непривезённые 2 упаковки сразу освобождаются для других.', options: { breakLine: true } },
    { text: 'Одно предложение -- максимум одна передача. Повторное подтверждение запрещено.', options: {} }
  ], {
    x: 5.2, y: 3.72, w: 4.2, h: 0.95, margin: 0,
    fontFace: 'Calibri', fontSize: 11, color: theme.primary, paraSpaceAfter: 4
  });

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 5.2, y: 4.76, w: 4.2, h: 0.52, fill: { color: theme.primary }
  });
  slide.addText('Обещанная помощь не равна полученной. Это и есть точность учёта.', {
    x: 5.36, y: 4.76, w: 3.88, h: 0.52, margin: 0, valign: 'middle',
    fontFace: 'Calibri', fontSize: 11.5, color: theme.bg
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