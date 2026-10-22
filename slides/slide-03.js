// Слайд 3 — четыре шага от потребности к результату.
const B = require('./lib/brand.js');

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  B.light(pres, slide);
  B.pageNo(pres, slide, 3);

  B.heading(pres, slide, 'От потребности — к результату',
    'Четыре шага. Регистрация посетителю не нужна.');

  const steps = [
    { n: '1', title: 'Приют публикует потребность', body: 'Категория, количество, приоритет, адрес и часы приёма.' },
    { n: '2', title: 'Посетитель предлагает помощь', body: 'Выбирает приют в каталоге и называет посильное количество.' },
    { n: '3', title: 'Система выдаёт код', body: 'Одноразовый секретный код предложения. Без телефона и аккаунта.' },
    { n: '4', title: 'Приют подтверждает факт', body: 'Вводит код и указывает, сколько реально принято.' }
  ];

  const BOX_W = 2.02;
  const GAP = 0.24;
  const TOP = 1.30;

  steps.forEach(function (s, i) {
    const x = B.M + i * (BOX_W + GAP);

    // Номер шага — маджента-круг, как маркеры на референсных слайдах.
    slide.addShape(pres.shapes.OVAL, {
      x: x, y: TOP, w: 0.42, h: 0.42, fill: { color: theme.accent }
    });
    slide.addText(s.n, {
      x: x, y: TOP, w: 0.42, h: 0.42, margin: 0, align: 'center', valign: 'middle',
      fontFace: theme.fontDisplay, fontSize: 16, bold: true, color: theme.white
    });

    if (i < steps.length - 1) {
      slide.addShape(pres.shapes.LINE, {
        x: x + BOX_W + 0.03, y: TOP + 0.21, w: GAP - 0.06, h: 0,
        line: { color: theme.line, width: 1.5, dashType: 'dash' }
      });
    }

    B.card(pres, slide, { x: x, y: TOP + 0.58, w: BOX_W, h: 1.88 });
    slide.addText(s.title, {
      x: x + 0.16, y: TOP + 0.74, w: BOX_W - 0.32, h: 0.66, margin: 0, valign: 'top',
      fontFace: theme.fontDisplay, fontSize: 13, bold: true, color: theme.ink
    });
    slide.addText(s.body, {
      x: x + 0.16, y: TOP + 1.44, w: BOX_W - 0.32, h: 0.92, margin: 0, valign: 'top',
      fontFace: theme.fontBody, fontSize: 10, color: theme.muted
    });
  });

  // Итог после передачи. Те же числа, что на слайдах интерфейса (состояние D2):
  // после частичной приёмки обещанное обнуляется, а непривезённое возвращается
  // в свободный остаток. Иначе цифры противоречили бы слайдам 4 и 5.
  B.gradStrip(pres, slide, 0.6, 4.02, 8.2, 0.91);
  slide.addText('ИТОГ ПОСЛЕ ПЕРЕДАЧИ', {
    x: 0.9, y: 4.02, w: 2.3, h: 0.91, margin: 0, valign: 'middle',
    fontFace: theme.fontBody, fontSize: 10, color: 'EEDCF7', charSpacing: 1.4
  });
  slide.addText([
    { text: '50', options: { bold: true, fontSize: 17 } },
    { text: ' требуется     ', options: { fontSize: 11 } },
    { text: '0', options: { bold: true, fontSize: 17 } },
    { text: ' обещано     ', options: { fontSize: 11 } },
    { text: '3', options: { bold: true, fontSize: 17 } },
    { text: ' получено     ', options: { fontSize: 11 } },
    { text: '47', options: { bold: true, fontSize: 17 } },
    { text: ' свободно', options: { fontSize: 11 } }
  ], {
    x: 3.1, y: 4.02, w: 5.5, h: 0.91, margin: 0, valign: 'middle', align: 'right',
    fontFace: theme.fontDisplay, color: theme.white
  });

  return slide;
}

module.exports = { createSlide };