// Общий стиль презентации: палитра, шрифты и повторяющиеся элементы.
//
// Оформление снято с референсных слайдов и приведено к одной системе:
//   фон           белый с мягким сиреневым свечением в правом верхнем углу
//                 и холодным перваншем в левом нижнем (assets/bg-light.png)
//   акцент        маджента #9C259B — маркеры, бейджи, тонкие линейки
//   панель        градиент #3A1A99 -> #C81477 (assets/*.png, рисует make_assets.py)
//   заголовки     PT Sans Narrow Bold, чёрные
//   текст         PT Sans
//   номер слайда  светло-фиолетовый, внизу справа, без рамки
//
// Градиенты приходят картинками: pptxgenjs не умеет градиентные заливки фигур.

const path = require('path');

// pptxgenjs LAYOUT_16x9 -- это 10 x 5.625 дюйма, а не 13.333 x 7.5.
const SLIDE_W = 10;
const SLIDE_H = 5.625;
const M = 0.6;          // боковое поле
const ASSETS = path.join(__dirname, '..', 'assets');

const theme = {
  ink: '17161C',         // заголовки
  body: '3A3A44',        // основной текст
  muted: '6E6E7A',       // подписи, пояснения
  faint: 'A39DC3',       // номер страницы
  line: 'E5DEF1',        // волосяная рамка карточки
  lilac: 'F2EAFB',       // подложка «мягкой» карточки
  accent: '9C259B',      // маджента: маркеры, бейджи, линейки
  violet: '6B2E8F',      // подзаголовки
  pink: 'C81477',        // крупные числа, правый край градиента
  gradA: '3A1A99',       // левый край градиента
  white: 'FFFFFF',

  fontDisplay: 'PT Sans Narrow',
  fontBody: 'PT Sans',
  fontMono: 'Consolas'
};

function asset(name) {
  return path.join(ASSETS, name);
}

// Светлый слайд: белый фон с сиреневым градиентом.
function light(pres, slide) {
  slide.background = { color: theme.white };
  slide.addImage({ path: asset('bg-light.png'), x: 0, y: 0, w: SLIDE_W, h: SLIDE_H });
}

// Тёмный слайд: во всю площадь фиолетово-маджентовая панель.
function dark(pres, slide) {
  slide.background = { color: theme.gradA };
  slide.addImage({ path: asset('bg-dark.png'), x: 0, y: 0, w: SLIDE_W, h: SLIDE_H });
}

// Номер слайда. На референсах это просто светло-фиолетовая цифра в углу.
function pageNo(pres, slide, n, color) {
  slide.addText(String(n), {
    x: SLIDE_W - 0.85, y: SLIDE_H - 0.52, w: 0.5, h: 0.32, margin: 0,
    align: 'right', valign: 'middle',
    fontFace: theme.fontBody, fontSize: 12, color: color || theme.faint
  });
}

// Заголовок слайда + необязательный подзаголовок под ним.
function heading(pres, slide, title, subtitle) {
  slide.addText(title, {
    x: M, y: 0.28, w: SLIDE_W - 2 * M, h: 0.52, margin: 0,
    fontFace: theme.fontDisplay, fontSize: 28, bold: true, color: theme.ink, fit: 'shrink'
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: M, y: 0.82, w: SLIDE_W - 2 * M - 0.2, h: 0.3, margin: 0,
      fontFace: theme.fontBody, fontSize: 12.5, color: theme.violet
    });
  }
}

// Короткая надпись «надзаголовком» — разрядка, акцентный цвет.
function eyebrow(pres, slide, text, box) {
  slide.addText(text, {
    x: box.x, y: box.y, w: box.w, h: box.h || 0.26, margin: 0,
    fontFace: theme.fontBody, fontSize: box.size || 10.5, color: box.color || theme.accent,
    charSpacing: box.spacing === undefined ? 1.4 : box.spacing
  });
}

// Градиентная полоса-подложка. Пропорции картинки 9:1, поэтому высоту
// задаём от ширины, иначе скруглённые углы растянутся.
function gradStrip(pres, slide, x, y, w, h) {
  slide.addImage({ path: asset('grad-strip.png'), x: x, y: y, w: w, h: h });
}

// Список с круглыми маджента-маркерами, как на референсных слайдах.
//
// Маркер — отдельный ран, а не bullet: pptxgenjs принимает bullet.color, но в
// XML его не пишет, и точка наследует цвет текста. Глифом цвет управляется.
function bullets(pres, slide, items, box) {
  const size = box.size || 12;
  const color = box.color || theme.body;
  const runs = [];
  items.forEach(function (t, i) {
    runs.push({
      text: '●  ',
      options: { color: theme.accent, fontSize: size * 0.78, breakLine: false }
    });
    runs.push({
      text: t,
      options: { color: color, fontSize: size, breakLine: i < items.length - 1 }
    });
  });
  slide.addText(runs, {
    x: box.x, y: box.y, w: box.w, h: box.h, margin: 0,
    fontFace: box.font || theme.fontBody,
    color: color,
    paraSpaceAfter: box.gap === undefined ? 7 : box.gap,
    valign: 'top'
  });
}

// Белая карточка с волосяной сиреневой рамкой и мягкой тенью.
function card(pres, slide, box) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: box.x, y: box.y, w: box.w, h: box.h,
    rectRadius: 0.06,
    fill: { color: box.fill || theme.white },
    line: { color: box.line || theme.line, width: 1 },
    shadow: box.shadow === false ? undefined : {
      type: 'outer', color: '6B2E8F', blur: 7, offset: 1, angle: 90, opacity: 0.10
    }
  });
}

// Маджента-пилюля с белым текстом — фирменный бейдж («T-SQL», «D0», «D1»).
function pill(pres, slide, text, box, fillColor) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: box.x, y: box.y, w: box.w, h: box.h,
    rectRadius: box.h / 2,
    fill: { color: fillColor || theme.accent }
  });
  slide.addText(text, {
    x: box.x, y: box.y, w: box.w, h: box.h, margin: 0,
    align: 'center', valign: 'middle',
    fontFace: theme.fontBody, fontSize: box.size || 9.5, bold: true,
    color: theme.white, charSpacing: box.spacing === undefined ? 0.6 : box.spacing
  });
}

module.exports = {
  SLIDE_W, SLIDE_H, M, theme, asset,
  light, dark, pageNo, heading, eyebrow, gradStrip, bullets, card, pill
};