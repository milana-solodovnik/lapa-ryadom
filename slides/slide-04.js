// Slide 4 -- Content / Image Showcase: live demo, with screenshot placeholders.
// The two frames must be replaced by real captures after DEV-06.
function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  addPageBadge(pres, slide, theme, 4);

  slide.addText('Живая демонстрация', {
    x: 0.6, y: 0.36, w: 6.0, h: 0.55, margin: 0,
    fontFace: 'Georgia', fontSize: 30, bold: true, color: theme.primary
  });
  slide.addText('Сценарий D0 -> D1 -> D2 на одном экране', {
    x: 0.6, y: 0.94, w: 6.0, h: 0.28, margin: 0,
    fontFace: 'Calibri', fontSize: 13, color: theme.secondary
  });

  // Warning tag: neutral on-slide wording, production detail moved to speaker notes.
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 6.72, y: 0.42, w: 2.68, h: 0.62, fill: { color: theme.secondary }
  });
  slide.addText('Показ идёт в двух окнах браузера', {
    x: 6.84, y: 0.46, w: 2.44, h: 0.54, margin: 0, valign: 'middle',
    fontFace: 'Calibri', fontSize: 10.5, color: theme.bg
  });

  // ---- Frame A: public window ----
  addFrame(pres, slide, theme, 0.6, 1.32, 4.28, 2.72, 'ОКНО A -- ПУБЛИЧНОЕ');
  slide.addText([
    { text: '1.  Каталог: город, категория, поиск', options: { breakLine: true } },
    { text: '2.  Карточка потребности и счётчики', options: { breakLine: true } },
    { text: '3.  Кнопка "Предложить помощь"', options: { breakLine: true } },
    { text: '4.  Ввод количества 5, получение кода', options: { breakLine: true } },
    { text: '5.  Итог: обещано 5, получено 0, свободно 15', options: { bold: true } }
  ], {
    x: 0.78, y: 2.62, w: 3.92, h: 1.32, margin: 0,
    fontFace: 'Calibri', fontSize: 11, color: theme.primary, paraSpaceAfter: 3
  });

  // ---- Frame B: shelter cabinet ----
  addFrame(pres, slide, theme, 5.12, 1.32, 4.28, 2.72, 'ОКНО B -- КАБИНЕТ ПРИЮТА');
  slide.addText([
    { text: '1.  Вход представителя приюта', options: { breakLine: true } },
    { text: '2.  Свои потребности, включая закрытые', options: { breakLine: true } },
    { text: '3.  Экран подтверждения по коду', options: { breakLine: true } },
    { text: '4.  Фактически получено 3, подтвердить', options: { breakLine: true } },
    { text: '5.  Итог: обещано 0, получено 3, свободно 17', options: { bold: true } }
  ], {
    x: 5.3, y: 2.62, w: 3.92, h: 1.32, margin: 0,
    fontFace: 'Calibri', fontSize: 11, color: theme.primary, paraSpaceAfter: 3
  });

  // ---- Control points strip ----
  slide.addText('КОНТРОЛЬНЫЕ ТОЧКИ НА ЭКРАНЕ', {
    x: 0.6, y: 4.2, w: 4.0, h: 0.26, margin: 0,
    fontFace: 'Calibri', fontSize: 10, color: theme.primary, charSpacing: 1.2, bold: true
  });

  const pts = [
    { code: 'D0', nums: '20 / 0 / 0 / 20' },
    { code: 'D1', nums: '20 / 5 / 0 / 15' },
    { code: 'D2', nums: '20 / 0 / 3 / 17' }
  ];
  pts.forEach(function (p, i) {
    const x = 0.6 + i * 2.5;
    slide.addShape(pres.shapes.RECTANGLE, {
      x: x, y: 4.5, w: 2.28, h: 0.6, fill: { color: theme.light }
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: x, y: 4.5, w: 0.44, h: 0.6, fill: { color: theme.primary }
    });
    slide.addText(p.code, {
      x: x, y: 4.5, w: 0.44, h: 0.6, margin: 0, align: 'center', valign: 'middle',
      fontFace: 'Georgia', fontSize: 13, bold: true, color: theme.bg
    });
    slide.addText('требуется / обещано / получено / свободно', {
      x: x + 0.54, y: 4.56, w: 1.68, h: 0.2, margin: 0,
      fontFace: 'Calibri', fontSize: 7.5, color: theme.secondary
    });
    slide.addText(p.nums, {
      x: x + 0.54, y: 4.75, w: 1.68, h: 0.3, margin: 0,
      fontFace: 'Georgia', fontSize: 14, bold: true, color: theme.primary
    });
  });

  slide.addText('После D2 обновить публичную страницу -- это доказывает, что данные сохранились.', {
    x: 8.12, y: 4.5, w: 1.28, h: 0.6, margin: 0,
    fontFace: 'Calibri', fontSize: 8.5, color: theme.secondary
  });

  // Production instructions live in speaker notes, NOT on the audience-facing slide.
  slide.addNotes([
    'ЗАГОТОВКА СЛАЙДА. Перед выступлением заменить оба пунктирных кадра реальными',
    'скриншотами работающего приложения (задача DEV-06). На сцене показывается живое',
    'приложение, а не этот слайд -- см. docs/07_DEMO_AND_PITCH.md раздел 2, слайд 4.',
    '',
    'Требования к кадрам: ширина 1280 px, масштаб браузера 110-125%, отключены',
    'уведомления, нет личных вкладок и отладочных панелей, пароли на экране не видны.',
    '',
    'Окно A (публичное): каталог -> карточка потребности -> предложить помощь -> код.',
    'Окно B (кабинет приюта): заранее авторизованный представитель "Добрые лапы" ->',
    'экран подтверждения по коду.',
    '',
    'Исходное состояние перед показом: требуется 20 / обещано 0 / получено 0 / свободно 20.',
    'Сброс демоданных делать ДО выхода на сцену, не на сцене.'
  ].join('\n'));

  return slide;
}

function addFrame(pres, slide, theme, x, y, w, h, label) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x: x, y: y, w: w, h: h,
    fill: { color: theme.bg },
    line: { color: theme.secondary, width: 1.25, dashType: 'dash' }
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x: x, y: y, w: w, h: 0.32, fill: { color: theme.secondary }
  });
  slide.addText(label, {
    x: x + 0.12, y: y, w: w - 0.24, h: 0.32, margin: 0, valign: 'middle',
    fontFace: 'Calibri', fontSize: 10, bold: true, color: theme.bg, charSpacing: 0.8
  });
  slide.addText('Кадр приложения', {
    x: x, y: y + 0.85, w: w, h: 0.4, margin: 0, align: 'center',
    fontFace: 'Georgia', fontSize: 14, bold: true, color: theme.secondary
  });
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