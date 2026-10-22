// Slide 6 -- Полиглот: одна база, два языка.
function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  addPageBadge(pres, slide, theme, 6);

  slide.addText('Полиглот: база говорит на двух языках', {
    x: 0.62, y: 0.24, w: 8.8, h: 0.46, margin: 0,
    fontFace: 'Georgia', fontSize: 25, bold: true, color: theme.primary, fit: 'shrink'
  });
  slide.addText('Проект перенесён на Digital Q.DataBase — и эта же база отвечает по протоколу Microsoft SQL.', {
    x: 0.62, y: 0.70, w: 8.9, h: 0.32, margin: 0,
    fontFace: 'Calibri', fontSize: 12.5, color: theme.secondary
  });

  function panel(x, header, headerColor, bullets, proof) {
    slide.addShape(pres.shapes.RECTANGLE, {
      x: x, y: 1.26, w: 4.28, h: 0.32, fill: { color: headerColor }
    });
    slide.addText(header, {
      x: x + 0.14, y: 1.26, w: 4.0, h: 0.32, margin: 0, valign: 'middle',
      fontFace: 'Calibri', fontSize: 9, bold: true, color: theme.bg, charSpacing: 0.7
    });

    slide.addShape(pres.shapes.RECTANGLE, {
      x: x, y: 1.58, w: 4.28, h: 2.62,
      fill: { color: theme.bg }, line: { color: theme.secondary, width: 1 }
    });
    slide.addText(bullets.map(function (b, j) {
      return { text: b, options: { bullet: { indent: 12 }, breakLine: j < bullets.length - 1 } };
    }), {
      x: x + 0.2, y: 1.74, w: 3.9, h: 1.9, margin: 0,
      fontFace: 'Calibri', fontSize: 11.5, color: theme.primary, paraSpaceAfter: 7
    });

    slide.addShape(pres.shapes.RECTANGLE, {
      x: x + 0.2, y: 3.62, w: 3.88, h: 0.44, fill: { color: theme.light }
    });
    slide.addText(proof, {
      x: x + 0.32, y: 3.62, w: 3.64, h: 0.44, margin: 0, valign: 'middle',
      fontFace: 'Georgia', fontSize: 12.5, bold: true, color: theme.primary
    });
  }

  panel(
    0.62,
    'POSTGRESQL  →  DIGITAL Q.DATABASE',
    theme.primary,
    [
      'Схема перенеслась без единой правки',
      'Данные перенесены одной транзакцией',
      'Ключи, связи и бизнес-ключи сохранены',
      'Все тесты приложения идут на целевой базе'
    ],
    '25 проверок — без расхождений'
  );

  panel(
    5.12,
    'MICROSOFT SQL  →  DIGITAL Q.DATABASE',
    theme.accent,
    [
      'Та же база отвечает по протоколу Microsoft SQL',
      'Понимает T-SQL: создание таблиц, вставка, выборка',
      'Автоинкремент и ограничения работают',
      'Русские названия сохраняются без искажений'
    ],
    '9 проверок из 9 пройдено'
  );

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.62, y: 4.42, w: 8.78, h: 0.74, fill: { color: theme.primary }
  });
  slide.addText([
    { text: 'Одна база — два языка. ', options: { bold: true } },
    { text: 'Приложение, которое вы видели, работает на Digital Q.DataBase.', options: {} }
  ], {
    x: 0.86, y: 4.42, w: 8.3, h: 0.74, margin: 0, valign: 'middle',
    fontFace: 'Calibri', fontSize: 13.5, color: theme.bg
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

module.exports = { createSlide };