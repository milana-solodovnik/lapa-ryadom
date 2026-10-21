// Slide 3 -- Content / Timeline-Process: four steps from need to result
function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  addPageBadge(pres, slide, theme, 3);

  slide.addText('От потребности -- к результату', {
    x: 0.6, y: 0.42, w: 8.8, h: 0.6, margin: 0,
    fontFace: 'Georgia', fontSize: 30, bold: true, color: theme.primary
  });
  slide.addText('Четыре шага. Регистрация посетителю не нужна.', {
    x: 0.6, y: 1.02, w: 8.8, h: 0.3, margin: 0,
    fontFace: 'Calibri', fontSize: 14, color: theme.secondary
  });

  const steps = [
    { n: '1', title: 'Приют публикует потребность', body: 'Категория, количество, приоритет, адрес и часы приёма.' },
    { n: '2', title: 'Посетитель предлагает помощь', body: 'Выбирает приют в каталоге и называет посильное количество.' },
    { n: '3', title: 'Система выдаёт код', body: 'Одноразовый секретный код предложения. Без телефона и аккаунта.' },
    { n: '4', title: 'Приют подтверждает факт', body: 'Вводит код и указывает, сколько реально принято.' }
  ];

  const boxW = 2.02;
  const gap = 0.24;
  const startX = 0.6;

  steps.forEach(function (s, i) {
    const x = startX + i * (boxW + gap);
    const top = 1.62;

    // number badge
    slide.addShape(pres.shapes.OVAL, {
      x: x, y: top, w: 0.46, h: 0.46, fill: { color: theme.accent }
    });
    slide.addText(s.n, {
      x: x, y: top, w: 0.46, h: 0.46, margin: 0, align: 'center', valign: 'middle',
      fontFace: 'Georgia', fontSize: 17, bold: true, color: theme.bg
    });

    // connector
    if (i < steps.length - 1) {
      slide.addShape(pres.shapes.LINE, {
        x: x + boxW + 0.03, y: top + 0.23, w: gap - 0.06, h: 0,
        line: { color: theme.secondary, width: 1.5, dashType: 'dash' }
      });
    }

    // card
    slide.addShape(pres.shapes.RECTANGLE, {
      x: x, y: top + 0.62, w: boxW, h: 2.08,
      fill: { color: theme.light },
      shadow: { type: 'outer', color: '000000', blur: 6, offset: 2, angle: 135, opacity: 0.1 }
    });
    slide.addText(s.title, {
      x: x + 0.16, y: top + 0.78, w: boxW - 0.32, h: 0.72, margin: 0,
      fontFace: 'Georgia', fontSize: 13.5, bold: true, color: theme.primary
    });
    slide.addText(s.body, {
      x: x + 0.16, y: top + 1.52, w: boxW - 0.32, h: 1.05, margin: 0,
      fontFace: 'Calibri', fontSize: 11, color: theme.primary
    });
  });

  // Result strip. Authoritative D2 state per docs/07_DEMO_AND_PITCH.md section 7.2.
  // Promised MUST be 0 after a partial handover, otherwise the deck contradicts
  // the formula shown on slide 5 and the core "promised != received" idea.
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.6, y: 4.5, w: 8.8, h: 0.62, fill: { color: theme.primary }
  });
  slide.addText([
    { text: 'Итог после передачи:   ', options: { bold: true } },
    { text: '20 требуется   |   0 обещано   |   3 получено   |   17 свободно', options: {} }
  ], {
    x: 0.9, y: 4.5, w: 8.2, h: 0.62, margin: 0, valign: 'middle',
    fontFace: 'Calibri', fontSize: 14, color: theme.bg
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