// Слайд 2 — проблема: две стороны и разрыв между ними.
const B = require('./lib/brand.js');

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  B.light(pres, slide);
  B.pageNo(pres, slide, 2);

  B.heading(pres, slide, 'Помощь есть. Но не всегда попадает туда, где нужна',
    'Приют знает, сколько нужно. Человек знает, сколько может. Связи между ними нет.');

  const TOP = 1.22;
  const CH = 2.34;
  const CW = 3.62;

  const cards = [
    {
      x: 0.6, rule: theme.violet, kicker: 'ПРИЮТ',
      headline: 'Нужны 50 упаковок корма',
      items: [
        'Публикация в соцсетях устаревает',
        'Привезли часть — непонятно, сколько ещё нужно',
        'Объявления теряются среди других'
      ]
    },
    {
      x: 5.78, rule: theme.pink, kicker: 'ЧЕЛОВЕК',
      headline: 'Есть 5 упаковок',
      items: [
        'Не знает, кому именно это нужно',
        'Не хочет заводить аккаунт и оставлять телефон',
        'Готов помочь, но не знает, куда привезти'
      ]
    }
  ];

  cards.forEach(function (c) {
    B.card(pres, slide, { x: c.x, y: TOP, w: CW, h: CH });
    slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: c.x, y: TOP, w: CW, h: 0.055, rectRadius: 0.027,
      fill: { color: c.rule }
    });
    B.eyebrow(pres, slide, c.kicker, { x: c.x + 0.24, y: TOP + 0.2, w: CW - 0.5 });
    slide.addText(c.headline, {
      x: c.x + 0.24, y: TOP + 0.48, w: CW - 0.5, h: 0.5, margin: 0, valign: 'top',
      fontFace: theme.fontDisplay, fontSize: 16, bold: true, color: theme.ink
    });
    B.bullets(pres, slide, c.items, {
      x: c.x + 0.24, y: TOP + 1.06, w: CW - 0.5, h: 1.1,
      size: 11, gap: 6
    });
  });

  // ---- Разрыв в середине ----
  slide.addShape(pres.shapes.LINE, {
    x: 4.32, y: 2.39, w: 0.5, h: 0,
    line: { color: theme.accent, width: 1.75, dashType: 'dash' }
  });
  slide.addShape(pres.shapes.LINE, {
    x: 5.18, y: 2.39, w: 0.5, h: 0,
    line: { color: theme.accent, width: 1.75, dashType: 'dash' }
  });
  slide.addShape(pres.shapes.OVAL, {
    x: 4.78, y: 2.17, w: 0.44, h: 0.44, fill: { color: theme.accent }
  });
  slide.addText('!', {
    x: 4.78, y: 2.18, w: 0.44, h: 0.42, margin: 0, align: 'center', valign: 'middle',
    fontFace: theme.fontDisplay, fontSize: 17, bold: true, color: theme.white
  });
  slide.addText('разрыв', {
    x: 4.48, y: 2.66, w: 1.04, h: 0.24, margin: 0, align: 'center',
    fontFace: theme.fontBody, fontSize: 10, color: theme.accent
  });

  // ---- Вывод на фирменной градиентной полосе ----
  B.gradStrip(pres, slide, 0.6, 3.82, 8.2, 0.91);
  slide.addText([
    { text: 'Проблема не в нехватке вещей, ', options: { bold: true } },
    { text: 'а в отсутствии адресного учёта: люди готовы помогать, но не знают, кому именно что нужно сейчас.', options: {} }
  ], {
    x: 0.9, y: 3.82, w: 7.6, h: 0.91, margin: 0, valign: 'middle',
    fontFace: theme.fontBody, fontSize: 12, color: theme.white
  });

  return slide;
}

module.exports = { createSlide };