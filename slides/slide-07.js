// Slide 7 -- Итог.
function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.primary };

  addPageBadge(pres, slide, theme, 7, theme.bg, theme.accent);

  slide.addText('Одна маленькая помощь — видимый результат', {
    x: 0.6, y: 0.62, w: 9.0, h: 0.72, margin: 0,
    fontFace: 'Georgia', fontSize: 27, bold: true, color: theme.bg, fit: 'shrink'
  });

  slide.addText('Иногда помощь — это всего несколько упаковок корма. Главное — знать, где они действительно нужны.', {
    x: 0.6, y: 1.42, w: 8.6, h: 0.5, margin: 0,
    fontFace: 'Calibri', fontSize: 14, color: theme.light, italic: true
  });

  const items = [
    { t: 'Адресность', d: 'Приют публикует потребность, посетитель отвечает на неё — без регистрации и телефона.' },
    { t: 'Точность', d: 'База различает обещанное и полученное: пять обещанных упаковок и три полученные — это разные числа.' },
    { t: 'Перенос', d: 'Проект работает на Digital Q.DataBase. Та же база понимает и PostgreSQL, и Microsoft SQL.' }
  ];

  items.forEach(function (it, i) {
    const x = 0.6 + i * 3.03;
    slide.addShape(pres.shapes.RECTANGLE, {
      x: x, y: 2.3, w: 2.85, h: 1.72, fill: { color: theme.bg }
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: x, y: 2.3, w: 2.85, h: 0.05, fill: { color: theme.accent }
    });
    slide.addText(it.t, {
      x: x + 0.2, y: 2.54, w: 2.45, h: 0.32, margin: 0,
      fontFace: 'Georgia', fontSize: 15, bold: true, color: theme.primary
    });
    slide.addText(it.d, {
      x: x + 0.2, y: 2.94, w: 2.45, h: 1.0, margin: 0,
      fontFace: 'Calibri', fontSize: 11, color: theme.primary
    });
  });

  slide.addText('СПАСИБО ЗА ВНИМАНИЕ', {
    x: 0.6, y: 4.46, w: 8.8, h: 0.4, margin: 0, align: 'center',
    fontFace: 'Georgia', fontSize: 19, bold: true, color: theme.bg, charSpacing: 1.6
  });

  return slide;
}

function addPageBadge(pres, slide, theme, n, bgColor, textColor) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 9.3, y: 5.18, w: 0.42, h: 0.3, fill: { color: bgColor }
  });
  slide.addText(String(n), {
    x: 9.3, y: 5.18, w: 0.42, h: 0.3, margin: 0, align: 'center', valign: 'middle',
    fontFace: 'Calibri', fontSize: 11, color: textColor
  });
}

module.exports = { createSlide };