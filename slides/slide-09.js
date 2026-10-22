// Slide 9 -- Доказательство переноса на Digital Q.DataBase.
function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  addPageBadge(pres, slide, theme, 9);

  slide.addText('Перенос выполнен на настоящей Digital Q.DataBase', {
    x: 0.6, y: 0.24, w: 9.0, h: 0.46, margin: 0,
    fontFace: 'Georgia', fontSize: 23, bold: true, color: theme.primary, fit: 'shrink'
  });
  slide.addText(
    'Схема применена без единой правки, данные перенесены одной транзакцией, расхождений не найдено.',
    {
      x: 0.6, y: 0.70, w: 9.0, h: 0.4, margin: 0,
      fontFace: 'Calibri', fontSize: 11.5, color: theme.secondary
    }
  );

  const tiles = [
    { big: '15/15', cap: 'проб совместимости\nна целевой базе' },
    { big: '25/25', cap: 'проверок сверки\nпосле переноса' },
    { big: '60/60', cap: 'тестов приложения,\nпрогнанных на QDB' },
    { big: '0', cap: 'правок в DDL\nпри переносе схемы' }
  ];
  const TW = 2.26;
  const GAP = 0.07;
  tiles.forEach(function (t, i) {
    const x = 0.62 + i * (TW + GAP);
    slide.addShape(pres.shapes.RECTANGLE, {
      x: x, y: 1.22, w: TW, h: 0.94, fill: { color: theme.light }
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: x, y: 1.22, w: 0.09, h: 0.94, fill: { color: theme.accent }
    });
    slide.addText(t.big, {
      x: x + 0.2, y: 1.26, w: TW - 0.3, h: 0.46, margin: 0,
      fontFace: 'Georgia', fontSize: 24, bold: true, color: theme.primary
    });
    slide.addText(t.cap, {
      x: x + 0.2, y: 1.70, w: TW - 0.3, h: 0.42, margin: 0,
      fontFace: 'Calibri', fontSize: 9, color: theme.primary
    });
  });

  const PANEL_W = 3.94;
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.62, y: 2.36, w: PANEL_W, h: 0.26, fill: { color: theme.secondary }
  });
  slide.addText('ПРИЛОЖЕНИЕ НА ЦЕЛЕВОЙ БАЗЕ — КАТАЛОГ ПОСЛЕ ПРИЁМКИ', {
    x: 0.68, y: 2.36, w: PANEL_W - 0.12, h: 0.26, margin: 0, valign: 'middle',
    fontFace: 'Calibri', fontSize: 7.5, bold: true, color: theme.bg, charSpacing: 0.5
  });

  const IMG_W = 3.5;
  const IMG_H = IMG_W / (1280 / 900);
  slide.addImage({
    path: 'screenshots/needs-catalog-d2.png',
    x: 0.62 + (PANEL_W - IMG_W) / 2, y: 2.64, w: IMG_W, h: IMG_H
  });
  slide.addText([
    { text: 'Сухой корм: 50 / 0 / 3 / 47 — те же счётчики, что и до переноса.', options: { breakLine: true } },
    { text: 'Перенесено одной транзакцией: 3 приюта, 4 аккаунта, 10 потребностей, 4 предложения, 1 доставка.', options: {} }
  ], {
    x: 0.62, y: 5.08, w: PANEL_W, h: 0.44, margin: 0,
    fontFace: 'Calibri', fontSize: 7.5, color: theme.secondary, italic: true
  });

  const RX = 4.74;
  const RW = 4.64;

  slide.addShape(pres.shapes.RECTANGLE, {
    x: RX, y: 2.36, w: RW, h: 1.24,
    fill: { color: theme.bg }, line: { color: theme.secondary, width: 1 }
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x: RX, y: 2.36, w: 0.06, h: 1.24, fill: { color: theme.accent }
  });
  slide.addText('КАК МЫ УБЕДИЛИСЬ, ЧТО ЭТО Q.DATABASE', {
    x: RX + 0.2, y: 2.42, w: RW - 0.3, h: 0.24, margin: 0,
    fontFace: 'Calibri', fontSize: 8.5, bold: true, color: theme.accent, charSpacing: 0.6
  });
  slide.addText([
    { text: 'На запрос версии Q.DataBase отвечает как «PostgreSQL 18.2» и не называет себя.',
      options: { breakLine: true, bullet: true } },
    { text: 'Поэтому идентификация сделана по каталогу: 4 процедуры qdb_*, 15 объектов dgrid_*, 20 настроек qdb_*, подключённые pg_cron и pg_stat_statements. В обычном PostgreSQL этого нет.',
      options: { bullet: true } }
  ], {
    x: RX + 0.2, y: 2.66, w: RW - 0.34, h: 0.88, margin: 0,
    fontFace: 'Calibri', fontSize: 9, color: theme.primary, paraSpaceAfter: 2
  });

  slide.addShape(pres.shapes.RECTANGLE, {
    x: RX, y: 3.70, w: RW, h: 1.24,
    fill: { color: theme.bg }, line: { color: theme.secondary, width: 1 }
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x: RX, y: 3.70, w: 0.06, h: 1.24, fill: { color: theme.primary }
  });
  slide.addText('ДВА ОТЛИЧИЯ, КОТОРЫЕ ПРИШЛОСЬ УЧЕСТЬ', {
    x: RX + 0.2, y: 3.76, w: RW - 0.3, h: 0.24, margin: 0,
    fontFace: 'Calibri', fontSize: 8.5, bold: true, color: theme.primary, charSpacing: 0.6
  });
  slide.addText([
    { text: 'Метка времени: QDB хранит миллисекунды, PostgreSQL — микросекунды. Сверка идёт по округлению до миллисекунд, иначе получается ложное расхождение.',
      options: { breakLine: true, bullet: true } },
    { text: 'Сообщение о нарушении уникальности приходит по-русски, поэтому дубликат определяется по коду ошибки, а не по тексту.',
      options: { bullet: true } }
  ], {
    x: RX + 0.2, y: 4.00, w: RW - 0.34, h: 0.88, margin: 0,
    fontFace: 'Calibri', fontSize: 9, color: theme.primary, paraSpaceAfter: 2
  });

  return slide;
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