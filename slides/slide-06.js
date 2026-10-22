// Слайд 6 — полиглот: одна база, два языка.
//
// Слева карточка с настоящим T-SQL из scripts/qdb-mssql-check.ps1 — не
// псевдокод: этот запрос выполняется при проверке и возвращает available = 45.
// Справа то, что тем же прогоном подтверждено.
const B = require('./lib/brand.js');

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  B.light(pres, slide);
  B.pageNo(pres, slide, 6);

  B.heading(pres, slide, 'Полиглот: база говорит на двух языках',
    'Проект перенесён на Digital Q.DataBase без правок — и эта же база отвечает по протоколу Microsoft SQL.');

  // ---- Карточка с T-SQL ----
  const CX = 0.6, CY = 1.18, CW = 4.34, CH = 2.94;
  B.card(pres, slide, { x: CX, y: CY, w: CW, h: CH });

  B.pill(pres, slide, 'T-SQL', { x: CX + 0.24, y: CY + 0.2, w: 0.86, h: 0.26, size: 9 });

  const K = theme.violet;     // ключевые слова
  const C = theme.body;       // обычный код
  const M = theme.pink;        // комментарии
  const lines = [
    [{ t: '-- тот же счётчик, только на T-SQL', c: M, i: 1 }],
    [{ t: 'SELECT', c: K, b: 1 }, { t: ' TOP 1', c: C }],
    [{ t: "       ISNULL(n.title,'?') ", c: C }, { t: 'AS need,', c: K, b: 1 }],
    [{ t: '       n.target_qty, n.promised, n.received,', c: C }],
    [{ t: '       n.target_qty', c: C }],
    [{ t: '         - ISNULL(n.promised,0)', c: C }],
    [{ t: '         - ISNULL(n.received,0) ', c: C }, { t: 'AS available', c: K, b: 1 }],
    [{ t: '  FROM dbo.needs ', c: K, b: 1 }, { t: 'AS n', c: C }],
    [{ t: ' WHERE n.need_id = 1;', c: K, b: 1 }]
  ];

  const runs = [];
  lines.forEach(function (parts, i) {
    parts.forEach(function (p, j) {
      runs.push({
        text: p.t,
        options: {
          color: p.c, bold: !!p.b, italic: !!p.i,
          breakLine: (j === parts.length - 1) && (i < lines.length - 1)
        }
      });
    });
  });

  slide.addText(runs, {
    x: CX + 0.24, y: CY + 0.56, w: CW - 0.48, h: 1.92, margin: 0,
    fontFace: theme.fontMono, fontSize: 8.5, color: C, lineSpacingMultiple: 1.18
  });

  // Что вернул сам сервер.
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: CX + 0.24, y: CY + 2.5, w: CW - 0.48, h: 0.32, rectRadius: 0.05,
    fill: { color: theme.lilac }
  });
  slide.addText([
    { text: 'available = ', options: { color: theme.body } },
    { text: '45', options: { color: theme.accent, bold: true } },
    { text: '   50 − 5 − 0, посчитала сама база', options: { color: theme.muted } }
  ], {
    x: CX + 0.38, y: CY + 2.5, w: CW - 0.76, h: 0.32, margin: 0, valign: 'middle',
    fontFace: theme.fontMono, fontSize: 8.5
  });

  // ---- Что подтверждено тем же прогоном ----
  const RX = 5.24, RW = 4.16;
  B.eyebrow(pres, slide, 'ПОДТВЕРЖДЕНО ПРОВЕРКАМИ', { x: RX, y: 1.2, w: RW });

  B.bullets(pres, slide, [
    'Схема со PostgreSQL перенеслась без единой правки',
    'Та же база отвечает по протоколу Microsoft SQL',
    'Понимает T-SQL: CREATE TABLE, IDENTITY, CONSTRAINT, ISNULL, TOP',
    'Ограничения не просто принимаются, а работают: дубль в первичном ключе база отвергает',
    'Русские названия возвращаются без искажений'
  ], { x: RX, y: 1.5, w: RW, h: 2.0, size: 10.5, gap: 7 });

  B.card(pres, slide, { x: RX, y: 3.52, w: RW, h: 0.6, shadow: false, fill: theme.lilac, line: theme.line });
  slide.addText([
    { text: '25 из 25', options: { bold: true, color: theme.accent, fontSize: 13 } },
    { text: '  проверок переноса\n', options: { color: theme.body, fontSize: 10 } },
    { text: '9 из 9', options: { bold: true, color: theme.accent, fontSize: 13 } },
    { text: '  проверок T-SQL', options: { color: theme.body, fontSize: 10 } }
  ], {
    x: RX + 0.22, y: 3.52, w: RW - 0.44, h: 0.6, margin: 0, valign: 'middle',
    fontFace: theme.fontBody
  });

  // ---- Вывод на фирменной полосе ----
  B.gradStrip(pres, slide, 0.6, 4.32, 8.2, 0.91);
  slide.addText([
    { text: 'Одна база — два языка. ', options: { bold: true } },
    { text: 'Приложение, которое вы видели, работает на Digital Q.DataBase.', options: {} }
  ], {
    x: 0.9, y: 4.32, w: 7.6, h: 0.91, margin: 0, valign: 'middle',
    fontFace: theme.fontBody, fontSize: 12, color: theme.white
  });

  return slide;
}

module.exports = { createSlide };