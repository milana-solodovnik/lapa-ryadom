// Slide 5 -- Интерфейс, шаг 2: заявки посетителей.
const { buildInterfaceSlide } = require('./lib/interface.js');

function createSlide(pres, theme) {
  return buildInterfaceSlide(pres, theme, {
    n: 5,
    subtitle: 'После трёх заявок: обещанное выросло, полученное ещё нет',
    shot: 'screenshots/needs-catalog-d1.png',
    shotLabel: 'D1 · ПОСЛЕ ТРЁХ ЗАЯВОК',
    panelTitle: 'СУХОЙ КОРМ ДЛЯ ВЗРОСЛЫХ СОБАК',
    numbers: [
      ['требуется', '50'],
      ['обещано', '5'],
      ['получено', '0'],
      ['свободно', '45']
    ],
    highlight: 1,
    notes:
      'Три посетителя выбрали разные потребности и назвали посильные количества. Каждый получил одноразовый код.\n\n' +
      'Код показывается один раз и в базе не хранится — только его хеш. Даже если база утечёт, восстановить коды из неё нельзя.'
  });
}

module.exports = { createSlide };