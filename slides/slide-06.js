// Slide 6 -- Summary / Closing page
function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.primary };

  addPageBadge(pres, slide, theme, 6, theme.bg, theme.accent);

  slide.addText('Одна маленькая помощь -- видимый результат', {
    x: 0.6, y: 0.5, w: 8.8, h: 0.8, margin: 0,
    fontFace: 'Georgia', fontSize: 31, bold: true, color: theme.bg, fit: 'shrink'
  });

  slide.addText('Иногда помощь -- это всего несколько упаковок корма. Главное -- знать, где они действительно нужны.', {
    x: 0.6, y: 1.38, w: 8.6, h: 0.5, margin: 0,
    fontFace: 'Calibri', fontSize: 15, color: theme.light, italic: true
  });

  // Three takeaways
  const items = [
    { t: 'Адресность', d: 'Приют публикует потребность, посетитель отвечает на неё -- без регистрации и телефона.' },
    { t: 'Точность', d: 'База данных различает обещанное и полученное и не позволяет двойному учёту.' },
    { t: 'Перенос', d: 'Проект переносится с исходной PostgreSQL на Digital Q.DataBase. Показываю результат, когда он проверен.' }
  ];

  items.forEach(function (it, i) {
    const x = 0.6 + i * 3.03;
    slide.addShape(pres.shapes.RECTANGLE, {
      x: x, y: 2.1, w: 2.85, h: 1.52,
      fill: { color: theme.bg }
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: x, y: 2.1, w: 2.85, h: 0.05, fill: { color: theme.accent }
    });
    slide.addText(it.t, {
      x: x + 0.2, y: 2.3, w: 2.45, h: 0.32, margin: 0,
      fontFace: 'Georgia', fontSize: 15, bold: true, color: theme.primary
    });
    slide.addText(it.d, {
      x: x + 0.2, y: 2.66, w: 2.45, h: 0.85, margin: 0,
      fontFace: 'Calibri', fontSize: 11, color: theme.primary
    });
  });

  // Next steps
  slide.addText('ЧТО МОЖНО ДОБАВИТЬ ДАЛЬШЕ', {
    x: 0.6, y: 3.86, w: 5.0, h: 0.26, margin: 0,
    fontFace: 'Calibri', fontSize: 10, color: theme.light, charSpacing: 1.2, bold: true
  });
  slide.addText([
    { text: 'Проверенные реальные приюты вместо демонстрационных', options: { bullet: true, breakLine: true } },
    { text: 'Поиск помощи поблизости от пользователя', options: { bullet: true, breakLine: true } },
    { text: 'Отдельный раздел для поиска пропавших животных', options: { bullet: true } }
  ], {
    x: 0.6, y: 4.16, w: 5.2, h: 1.0, margin: 0,
    fontFace: 'Calibri', fontSize: 12, color: theme.bg, paraSpaceAfter: 5
  });

  // Right: demo reminder
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 6.1, y: 3.86, w: 3.3, h: 1.28, fill: { color: theme.accent }
  });
  slide.addText('Это демонстрационная версия', {
    x: 6.32, y: 4.02, w: 2.9, h: 0.3, margin: 0,
    fontFace: 'Georgia', fontSize: 13, bold: true, color: theme.bg
  });
  slide.addText('Приюты и передачи вымышлены. Статистики реальной помощи пока нет.', {
    x: 6.32, y: 4.34, w: 2.9, h: 0.7, margin: 0,
    fontFace: 'Calibri', fontSize: 11, color: theme.bg
  });

  return slide;
}

function addPageBadge(pres, slide, theme, n, bgColor, textColor) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 9.3, y: 5.1, w: 0.42, h: 0.3, fill: { color: bgColor }
  });
  slide.addText(String(n), {
    x: 9.3, y: 5.1, w: 0.42, h: 0.3, margin: 0, align: 'center', valign: 'middle',
    fontFace: 'Calibri', fontSize: 11, color: textColor
  });
}

module.exports = { createSlide };