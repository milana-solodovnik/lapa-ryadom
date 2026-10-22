// Slide 4 -- Интерфейс, часть 1: каталог и заявки посетителей.
const { buildInterfaceSlide } = require('./lib/interface.js');

function createSlide(pres, theme) {
  return buildInterfaceSlide(pres, theme, {
    n: 4,
    subtitle: 'Каталог и заявки. Приложение работает на Digital Q.DataBase 18.2',
    frames: [
      {
        step: 'D0',
        label: 'КАТАЛОГ — ЧТО ВИДИТ ПОСЕТИТЕЛЬ',
        shot: 'screenshots/needs-catalog.png',
        caption: 'Десять потребностей трёх приютов. У каждой четыре счётчика: сколько нужно, сколько пообещали, сколько принесли, сколько осталось.'
      },
      {
        step: 'D1',
        label: 'ПОСЛЕ ТРЁХ ЗАЯВОК',
        shot: 'screenshots/needs-catalog-d1.png',
        caption: 'Три посетителя выбрали разные потребности. Каждый получил одноразовый код — он показывается один раз, в базе хранится только его хеш.'
      }
    ],
    counters: [
      { code: 'D0', nums: '50 / 0 / 0 / 50' },
      { code: 'D1', nums: '50 / 5 / 0 / 45' }
    ],
    note: 'Счётчики «требуется / обещано / получено / свободно» для «Сухого корма для взрослых собак».'
  });
}

module.exports = { createSlide };