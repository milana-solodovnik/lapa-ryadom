// Slide 4 -- Интерфейс, шаг 1: каталог потребностей.
const { buildInterfaceSlide } = require('./lib/interface.js');

function createSlide(pres, theme) {
  return buildInterfaceSlide(pres, theme, {
    n: 4,
    subtitle: 'Каталог: что видит посетитель без регистрации',
    shot: 'screenshots/needs-catalog.png',
    shotLabel: 'D0 · КАТАЛОГ ПОТРЕБНОСТЕЙ',
    panelTitle: 'СУХОЙ КОРМ ДЛЯ ВЗРОСЛЫХ СОБАК',
    numbers: [
      ['требуется', '50'],
      ['обещано', '0'],
      ['получено', '0'],
      ['свободно', '50']
    ],
    highlight: 3,
    notes:
      'Десять потребностей трёх приютов. У каждой четыре счётчика: сколько нужно, сколько уже пообещали, сколько реально принесли и сколько осталось свободным.\n\n' +
      'Счётчики не хранятся в таблице — они пересчитываются при каждом открытии страницы.'
  });
}

module.exports = { createSlide };