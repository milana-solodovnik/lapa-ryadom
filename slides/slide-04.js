// Slide 4 -- Content / Image Showcase: live demo, with real captured screens.
// Screenshots are produced by scripts/capture-screenshots.ps1 and
// scripts/capture-screenshots-deliveries.ps1 against the running dev stack
// (API 4000, web 5173) using headless Chrome at 1280x900.
//
// Narrative:
//   • 4 frames in a row tell the D1 → D2 story arc with the running app.
//   • The D0/D1/D2 control strip is intentionally kept here as the literal
//     statement of truth; the screenshot tiles just before it are the
//     observations.
//
// Captured filenames and what they show:
//   - needs-catalog.png        D0 reference: full availability, no offers
//   - needs-catalog-d1.png     D1: 5+12+8 units promised across three needs
//   - shelter-receive-empty.png D2 entry: form rep types the donor's code
//   - needs-catalog-d2.png     D2 state: first offer now `received`
function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  addPageBadge(pres, slide, theme, 4);

  slide.addText('Живая демонстрация', {
    x: 0.6, y: 0.26, w: 6.0, h: 0.5, margin: 0,
    fontFace: 'Georgia', fontSize: 26, bold: true, color: theme.primary
  });
  slide.addText(
    'Четыре кадра одного и того же приложения. Слева направо: исходное состояние D0, каталог после трёх заявок D1, вход на стойку приюта D2, и каталог после приёмки D2.',
    {
      x: 0.6, y: 0.78, w: 9.0, h: 0.5, margin: 0,
      fontFace: 'Calibri', fontSize: 12, color: theme.secondary
    },
  );

  // 4 frames in a row. Image aspect 1280/900 = 1.4222.
  // Frame width 2.26", image width 2.10", image height 1.48".
  const FRAME_W = 2.26;
  const IMG_W = 2.10;
  const IMG_H = IMG_W / (1280 / 900);
  const HEAD_H = 0.26;
  const COL_GAP = 0.07;
  const x0 = 0.62;

  const frames = [
    {
      step: 'D0',
      label: 'КАРТОЧКИ ВНУТРЕННЕЙ ПАНЕЛИ',
      path: 'screenshots/needs-catalog.png',
      caption:
        'Стартовое состояние: 10 потребностей, обнулено reserved и received.',
    },
    {
      step: 'D1',
      label: 'КАТАЛОГ ПОСЛЕ 3 ЗАЯВОК',
      path: 'screenshots/needs-catalog-d1.png',
      caption:
        'Двое дарителей сделали выбор. Счётчик «обещано» вырос, «получено» нет.',
    },
    {
      step: 'D2',
      label: 'СТОЙКА ПРИЮТА — ВХОД ПО ЛОГИНУ',
      path: 'screenshots/login-page.png',
      caption:
        'Стойка приюта: только представитель приюта заходит (логин + пароль). Дарители делают заявки без регистрации.',
    },
    {
      step: 'D2',
      label: 'КАТАЛОГ ПОСЛЕ ПРИЁМКИ',
      path: 'screenshots/needs-catalog-d2.png',
      caption:
        'Первая заявка перешла из «обещано» в «получено». Балансы пересчитаны.',
    },
  ];

  frames.forEach(function (f, i) {
    const x = x0 + i * (FRAME_W + COL_GAP);
    const y = 1.34;
    addShot(pres, slide, theme, x, y, FRAME_W, HEAD_H, IMG_W, IMG_H, f);
  });

  // D0/D1/D2 strip at the bottom — the math, without which the screenshots
  // would be pretty but unprovable.
  const stripY = 4.18;
  slide.addText('КОНТРОЛЬНЫЕ ТОЧКИ ДЛЯ ПЕРВОЙ ПОТРЕБНОСТИ «СУХОЙ КОРМ ДЛЯ ВЗРОСЛЫХ СОБАК»', {
    x: 0.62, y: stripY, w: 8.0, h: 0.24, margin: 0,
    fontFace: 'Calibri', fontSize: 9.5, color: theme.primary, charSpacing: 1.1, bold: true
  });

  slide.addText('требуется / обещано / получено / свободно', {
    x: 0.62, y: stripY + 0.28, w: 4.0, h: 0.18, margin: 0,
    fontFace: 'Calibri', fontSize: 8, color: theme.secondary, italic: true
  });

  const pts = [
    { code: 'D0', nums: '50 / 0 / 0 / 50' },
    { code: 'D1', nums: '50 / 5 / 0 / 45' },
    { code: 'D2', nums: '50 / 0 / 5 / 45' }
  ];
  pts.forEach(function (p, i) {
    const x = 0.62 + i * 2.46;
    slide.addShape(pres.shapes.RECTANGLE, {
      x: x, y: stripY + 0.50, w: 2.26, h: 0.42, fill: { color: theme.light }
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: x, y: stripY + 0.50, w: 0.44, h: 0.42, fill: { color: theme.primary }
    });
    slide.addText(p.code, {
      x: x, y: stripY + 0.50, w: 0.44, h: 0.42, margin: 0, align: 'center', valign: 'middle',
      fontFace: 'Georgia', fontSize: 14, bold: true, color: theme.bg
    });
    slide.addText(p.nums, {
      x: x + 0.52, y: stripY + 0.55, w: 1.7, h: 0.32, margin: 0, valign: 'middle',
      fontFace: 'Georgia', fontSize: 13.5, bold: true, color: theme.primary
    });
  });

  // Side note: a one-line proof sentence.
  slide.addText(
    'Числа в полосе получены из `need_balances` — таблица не хранит счётчики, она их каждый раз считает.',
    {
      x: 8.0, y: stripY + 0.50, w: 1.86, h: 0.6, margin: 0, valign: 'middle',
      fontFace: 'Calibri', fontSize: 8.5, color: theme.secondary, italic: true,
    },
  );

  return slide;
}

function addShot(pres, slide, theme, x, y, frameW, headH, imgW, imgH, f) {
  // Header bar (color: secondary) with step on the left and label on the right.
  slide.addShape(pres.shapes.RECTANGLE, {
    x: x, y: y, w: frameW, h: headH, fill: { color: theme.secondary }
  });
  slide.addText(f.step, {
    x: x, y: y, w: 0.6, h: headH, margin: 0, align: 'center', valign: 'middle',
    fontFace: 'Georgia', fontSize: 9.5, bold: true, color: theme.bg
  });
  slide.addText(f.label, {
    x: x + 0.6, y: y, w: frameW - 0.62, h: headH, margin: 0, valign: 'middle',
    fontFace: 'Calibri', fontSize: 7.5, bold: true, color: theme.bg, charSpacing: 0.5
  });

  // Image, centred in the frame's body.
  const imgX = x + (frameW - imgW) / 2;
  const imgY = y + headH + 0.02;
  slide.addImage({
    path: f.path,
    x: imgX, y: imgY, w: imgW, h: imgH
  });

  slide.addText(f.caption, {
    x: x + 0.02, y: imgY + imgH + 0.04, w: frameW - 0.04, h: 0.6, margin: 0,
    fontFace: 'Calibri', fontSize: 7.5, color: theme.secondary
  });
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
