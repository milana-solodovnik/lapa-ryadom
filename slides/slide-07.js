// Slide 7 -- Appendix: migration evidence frame.
// Show ONLY after QDB-02 ... QDB-05 are done and artefacts are saved.
function createSlide(pres, theme) {
  const slide = pres.addSlide();
  slide.background = { color: theme.bg };

  addPageBadge(pres, slide, theme, 7);

  slide.addText('ПРИЛОЖЕНИЕ -- не показывать в базовом варианте', {
    x: 0.6, y: 0.3, w: 6.0, h: 0.26, margin: 0,
    fontFace: 'Calibri', fontSize: 10, color: theme.accent, charSpacing: 1.2, bold: true
  });

  slide.addText('Доказательство переноса на Digital Q.DataBase', {
    x: 0.6, y: 0.6, w: 8.8, h: 0.55, margin: 0,
    fontFace: 'Georgia', fontSize: 26, bold: true, color: theme.primary, fit: 'shrink'
  });

  // Honesty banner
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.6, y: 1.24, w: 8.8, h: 0.56, fill: { color: theme.accent }
  });
  slide.addText('Показывать этот слайд только после выполнения QDB-02 ... QDB-05. До этого заявлять миграцию нельзя.', {
    x: 0.82, y: 1.24, w: 8.36, h: 0.56, margin: 0, valign: 'middle',
    fontFace: 'Calibri', fontSize: 12.5, color: theme.bg
  });

  const blocks = [
    {
      n: '1', t: 'Источник',
      l: ['Название и версия исходной СУБД', 'Перечень таблиц и представлений', 'Контрольное число строк из журнала'],
      ph: 'PostgreSQL 17.10 / 6 таблиц + 1 вью'
    },
    {
      n: '2', t: 'Перенос',
      l: ['Выполненная команда или журнал', 'Дата и результат', 'Без учётных данных и секретов'],
      ph: 'команда + дата + OK'
    },
    {
      n: '3', t: 'Цель',
      l: ['Подтверждённое подключение', 'Те же записи и сохранённые связи', 'Сведения о сборке из администрирования'],
      ph: 'Digital Q.DataBase, сборка ...'
    },
    {
      n: '4', t: 'После переноса',
      l: ['Сценарий резервирования', 'Сценарий подтверждения', 'Счётчики D0 -> D1 -> D2 совпали'],
      ph: 'D0/D1/D2 на целевой базе'
    }
  ];

  blocks.forEach(function (b, i) {
    const x = 0.6 + (i % 2) * 4.52;
    const y = 2.02 + Math.floor(i / 2) * 1.52;

    slide.addShape(pres.shapes.RECTANGLE, {
      x: x, y: y, w: 4.28, h: 1.34,
      fill: { color: theme.bg },
      line: { color: theme.secondary, width: 1, dashType: 'dash' }
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x: x, y: y, w: 0.4, h: 1.34, fill: { color: theme.primary }
    });
    slide.addText(b.n, {
      x: x, y: y, w: 0.4, h: 1.34, margin: 0, align: 'center', valign: 'middle',
      fontFace: 'Georgia', fontSize: 18, bold: true, color: theme.bg
    });

    slide.addText(b.t, {
      x: x + 0.56, y: y + 0.1, w: 2.1, h: 0.28, margin: 0,
      fontFace: 'Georgia', fontSize: 13.5, bold: true, color: theme.primary
    });
    slide.addText(b.ph, {
      x: x + 2.5, y: y + 0.12, w: 1.68, h: 0.3, margin: 0, align: 'right',
      fontFace: 'Calibri', fontSize: 9.5, color: theme.accent, italic: true
    });

    slide.addText(b.l.map(function (s, j) {
      return { text: s, options: { bullet: true, breakLine: j < b.l.length - 1 } };
    }), {
      x: x + 0.56, y: y + 0.42, w: 3.6, h: 0.82, margin: 0,
      fontFace: 'Calibri', fontSize: 10.5, color: theme.primary, paraSpaceAfter: 2
    });
  });

  slide.addText('Запрещено называть неподтверждённые цифры. SELECT version() сам по себе недостаточен как доказательство.', {
    x: 0.6, y: 5.06, w: 8.4, h: 0.3, margin: 0,
    fontFace: 'Calibri', fontSize: 10, color: theme.secondary, italic: true
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