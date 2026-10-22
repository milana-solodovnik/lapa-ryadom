// Слайд 7 — итог. Тёмный, в фирменном градиенте.
const B = require('./lib/brand.js');

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  B.dark(pres, slide);
  B.pageNo(pres, slide, 7, 'E3D4F2');

  slide.addText('Одна маленькая помощь — видимый результат', {
    x: 0.6, y: 0.52, w: 8.8, h: 0.62, margin: 0,
    fontFace: theme.fontDisplay, fontSize: 28, bold: true, color: theme.white, fit: 'shrink'
  });
  slide.addText('Иногда помощь — это всего несколько упаковок корма. Главное — знать, где они действительно нужны.', {
    x: 0.6, y: 1.2, w: 8.2, h: 0.4, margin: 0,
    fontFace: theme.fontBody, fontSize: 13, color: 'EEDCF7'
  });

  const items = [
    { t: 'Адресность', d: 'Приют публикует потребность, посетитель отвечает на неё — без регистрации и телефона.' },
    { t: 'Точность', d: 'База различает обещанное и полученное: пять обещанных упаковок и три полученные — это разные числа.' },
    { t: 'Перенос', d: 'Проект работает на Digital Q.DataBase. Та же база понимает и PostgreSQL, и Microsoft SQL.' }
  ];

  items.forEach(function (it, i) {
    const x = 0.6 + i * 3.03;
    const w = 2.85;
    B.card(pres, slide, { x: x, y: 1.98, w: w, h: 2.0, fill: theme.white });
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: x, y: 1.98, w: w, h: 0.05, rectRadius: 0.025,
      fill: { color: i === 2 ? theme.pink : theme.accent }
    });
    slide.addText(it.t, {
      x: x + 0.22, y: 2.2, w: w - 0.44, h: 0.34, margin: 0, valign: 'top',
      fontFace: theme.fontDisplay, fontSize: 15, bold: true, color: theme.ink
    });
    slide.addText(it.d, {
      x: x + 0.22, y: 2.58, w: w - 0.44, h: 1.26, margin: 0, valign: 'top',
      fontFace: theme.fontBody, fontSize: 10.5, color: theme.body
    });
  });

  slide.addText('СПАСИБО ЗА ВНИМАНИЕ', {
    x: 0.6, y: 4.26, w: 8.8, h: 0.36, margin: 0, align: 'center',
    fontFace: theme.fontDisplay, fontSize: 18, bold: true, color: theme.white, charSpacing: 2
  });
  slide.addText('Милана Солодовник  ·  МТУСИ, Колледж Телекоммуникаций  ·  День СУБД 2026', {
    x: 0.6, y: 4.66, w: 8.8, h: 0.28, margin: 0, align: 'center',
    fontFace: theme.fontBody, fontSize: 10.5, color: 'EEDCF7'
  });

  return slide;
}

module.exports = { createSlide };