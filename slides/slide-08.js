// Slide 8 -- Appendix: emergency short script and technical-failure lines
function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  addPageBadge(pres, slide, theme, 8);

  slide.addText('ПРИЛОЖЕНИЕ -- аварийные сценарии', {
    x: 0.6, y: 0.3, w: 6.0, h: 0.26, margin: 0,
    fontFace: 'Calibri', fontSize: 10, color: theme.accent, charSpacing: 1.2, bold: true
  });

  slide.addText('Если времени мало или техника подвела', {
    x: 0.6, y: 0.6, w: 8.8, h: 0.55, margin: 0,
    fontFace: 'Georgia', fontSize: 26, bold: true, color: theme.primary, fit: 'shrink'
  });

  // ---- Left: 2-3 minute script ----
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.6, y: 1.3, w: 4.5, h: 3.72,
    fill: { color: theme.light },
    shadow: { type: 'outer', color: '000000', blur: 6, offset: 2, angle: 135, opacity: 0.1 }
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.6, y: 1.3, w: 4.5, h: 0.06, fill: { color: theme.accent }
  });
  slide.addText('Текст на 2--3 минуты', {
    x: 0.84, y: 1.5, w: 4.0, h: 0.3, margin: 0,
    fontFace: 'Georgia', fontSize: 14, bold: true, color: theme.primary
  });
  slide.addText([
    { text: '"Я сделала сервис, который помогает приютам получать именно ту вещевую помощь, которая нужна сейчас."', options: { breakLine: true } },
    { text: '' },
    { text: '[Показать готовую потребность, предложение 5 упаковок, подтверждение 3, результат: свободно 17.]', options: { breakLine: true, italic: true, color: 'bc6c25' } },
    { text: '' },
    { text: '"Самое важное здесь -- не интерфейс, а точность учёта. База данных различает обещанную и полученную помощь и защищает данные от двойного учёта."', options: { breakLine: true } },
    { text: '' },
    { text: '[Только после проверки: проект перенесён с PostgreSQL на Digital Q.DataBase и продолжает работать.]', options: { breakLine: true, italic: true, color: 'bc6c25' } },
    { text: '' },
    { text: '"Мне хотелось показать, что технологии могут делать даже небольшую помощь более адресной и понятной. Спасибо!"', options: {} }
  ], {
    x: 0.84, y: 1.88, w: 4.02, h: 2.95, margin: 0,
    fontFace: 'Calibri', fontSize: 11, color: theme.primary, paraSpaceAfter: 3
  });

  // ---- Right: failure table ----
  slide.addText('ЕСЛИ ЧТО-ТО ПОШЛО НЕ ТАК', {
    x: 5.4, y: 1.3, w: 4.0, h: 0.26, margin: 0,
    fontFace: 'Calibri', fontSize: 10, color: theme.primary, charSpacing: 1.2, bold: true
  });

  const head = function (t) {
    return { text: t, options: { fill: { color: '283618' }, color: 'FEFae0', bold: true, fontSize: 10.5, valign: 'middle' } };
  };

  const cases = [
    ['Нет интернета или сервер не отвечает', 'Показать заранее записанное видео реальной работы'],
    ['Истёк вход представителя приюта', 'Войти заранее подготовленным способом, пароль на сцене не показывать'],
    ['Потерян код предложения', 'Не угадывать. Перейти к видеозаписи'],
    ['Демо изменило исходные данные', 'Не делать reset на сцене, перейти к объяснению учёта'],
    ['Целевая СУБД недоступна', 'Не утверждать, что демо идёт на Digital Q.DataBase'],
    ['Ведущий просит закончить', 'Фраза: система знает разницу между обещанной и полученной помощью']
  ];

  const rows = [[head('Ситуация'), head('Что делать')]];
  cases.forEach(function (c) {
    rows.push([
      { text: c[0], options: { fontSize: 10, valign: 'middle', color: '283618', fill: { color: 'FEFae0' } } },
      { text: c[1], options: { fontSize: 10, valign: 'middle', color: '283618', fill: { color: 'FEFae0' } } }
    ]);
  });

  slide.addTable(rows, {
    x: 5.4, y: 1.62, w: 4.0, colW: [1.75, 2.25],
    rowH: 0.44,
    border: { pt: 0.75, color: '606c38' },
    fontFace: 'Calibri',
    margin: 4
  });

  slide.addText('Резервное видео: 2--3 минуты, подпись "Демонстрационные данные" видна на записи.', {
    x: 5.4, y: 4.9, w: 4.0, h: 0.3, margin: 0,
    fontFace: 'Calibri', fontSize: 10, color: theme.secondary, italic: true
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