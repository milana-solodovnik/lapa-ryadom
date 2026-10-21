// Slide 4 -- Content / Image Showcase: live demo, with real captured screens.
// Screenshots are produced by scripts/capture-screenshots.ps1 against the
// running dev stack (API 4000, web 5173) using headless Chrome at 1280x900.
function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  addPageBadge(pres, slide, theme, 4);

  slide.addText('Живая демонстрация', {
    x: 0.6, y: 0.3, w: 6.0, h: 0.52, margin: 0,
    fontFace: 'Georgia', fontSize: 28, bold: true, color: theme.primary
  });
  slide.addText('Публичная часть: без регистрации, счётчики пересчитываются автоматически', {
    x: 0.6, y: 0.84, w: 6.6, h: 0.26, margin: 0,
    fontFace: 'Calibri', fontSize: 12.5, color: theme.secondary
  });

  // Real capture, 1280x900 -> aspect 1.4222
  const IMG_W = 3.86;
  const IMG_H = IMG_W / (1280 / 900);
  const HEAD_H = 0.3;
  const FRAME_W = 4.0;

  addShot(pres, slide, theme, 0.62, 1.28, FRAME_W, 'ОКНО A -- КАТАЛОГ ПОТРЕБНОСТЕЙ',
    'screenshots/needs-catalog.png',
    'Фильтры по городу, категории и приоритету; поиск; пагинация. Каждая карточка показывает требуется, обещано, получено и свободно.');

  addShot(pres, slide, theme, 5.38, 1.28, FRAME_W, 'КАРТОЧКА ПОТРЕБНОСТИ',
    'screenshots/need-detail.png',
    'Адрес и часы приёма. Посетитель называет посильное количество и получает одноразовый код -- без аккаунта и телефона.');

  // Captions under the frames
  [0.62, 5.38].forEach(function (x) {
    slide.addText('', {
      x: x, y: 1.28 + HEAD_H + IMG_H + 0.04, w: FRAME_W, h: 0.001, margin: 0
    });
  });

  // Control points strip
  const stripY = 1.28 + HEAD_H + IMG_H + 0.12;
  slide.addText('КОНТРОЛЬНЫЕ ТОЧКИ НА ЭКРАНЕ', {
    x: 0.62, y: stripY, w: 5.0, h: 0.24, margin: 0,
    fontFace: 'Calibri', fontSize: 9.5, color: theme.primary, charSpacing: 1.2, bold: true
  });

  const pts = [
    { code: 'D0', nums: '20 / 0 / 0 / 20' },
    { code: 'D1', nums: '20 / 5 / 0 / 15' },
    { code: 'D2', nums: '20 / 0 / 3 / 17' }
  ];
  pts.forEach(function (p, i) {
    const x = 0.62 + i * 2.46;
    slide.addShape(pres.shapes.RECTANGLE, {
      x: x, y: stripY + 0.28, w: 2.26, h: 0.58, fill: { color: theme.light }
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: x, y: stripY + 0.28, w: 0.44, h: 0.58, fill: { color: theme.primary }
    });
    slide.addText(p.code, {
      x: x, y: stripY + 0.28, w: 0.44, h: 0.58, margin: 0, align: 'center', valign: 'middle',
      fontFace: 'Georgia', fontSize: 13, bold: true, color: theme.bg
    });
    slide.addText('требуется / обещано / получено / свободно', {
      x: x + 0.52, y: stripY + 0.33, w: 1.7, h: 0.18, margin: 0,
      fontFace: 'Calibri', fontSize: 7, color: theme.secondary
    });
    slide.addText(p.nums, {
      x: x + 0.52, y: stripY + 0.51, w: 1.7, h: 0.3, margin: 0,
      fontFace: 'Georgia', fontSize: 13.5, bold: true, color: theme.primary
    });
  });

  slide.addText('После D2 обновить публичную страницу -- это и есть доказательство, что данные сохранились.', {
    x: 8.0, y: stripY + 0.28, w: 1.4, h: 0.58, margin: 0,
    fontFace: 'Calibri', fontSize: 8, color: theme.secondary
  });

  return slide;
}

function addShot(pres, slide, theme, x, y, frameW, headerLabel, imagePath, caption) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x: x, y: y, w: frameW, h: 0.3, fill: { color: theme.secondary }
  });
  slide.addText(headerLabel, {
    x: x + 0.12, y: y, w: frameW - 0.24, h: 0.3, margin: 0, valign: 'middle',
    fontFace: 'Calibri', fontSize: 9, bold: true, color: theme.bg, charSpacing: 0.6
  });

  const imgW = frameW - 0.14;
  const imgH = imgW / (1280 / 900);
  slide.addImage({
    path: imagePath,
    x: x + 0.07, y: y + 0.32, w: imgW, h: imgH
  });

  slide.addText(caption, {
    x: x + 0.02, y: y + 0.36 + imgH, w: frameW - 0.04, h: 0.42, margin: 0,
    fontFace: 'Calibri', fontSize: 8, color: theme.secondary
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