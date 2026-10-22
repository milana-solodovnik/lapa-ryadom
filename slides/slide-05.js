// Slide 5 -- Интерфейс, часть 2: вход на стойку приюта и приёмка.
const { buildInterfaceSlide } = require('./lib/interface.js');

function createSlide(pres, theme) {
  return buildInterfaceSlide(pres, theme, {
    n: 5,
    subtitle: 'Приёмку ведёт только представитель приюта. Пять обещанных превращаются в три полученные',
    frames: [
      {
        step: 'D2',
        label: 'ВХОД ДЛЯ ПРИЮТОВ',
        shot: 'screenshots/login-page.png',
        tone: 'C81477',
        caption: 'Вход есть только у сотрудника приюта, и он привязан к своему приюту: чужой приют не примет чужую передачу.'
      },
      {
        step: 'D2',
        label: 'ПОСЛЕ ПРИЁМКИ',
        shot: 'screenshots/needs-catalog-d2.png',
        tone: 'C81477',
        caption: 'Сотрудник принял 3 упаковки из 5. Обещанное стало нулём, две непривезённые сразу вернулись в свободный остаток.'
      }
    ],
    counters: [
      { code: 'D1', nums: '50 / 5 / 0 / 45', tone: '6B2E8F' },
      { code: 'D2', nums: '50 / 0 / 3 / 47', tone: 'C81477' }
    ],
    note: 'Обещанная помощь не равна полученной — это и есть точность учёта.'
  });
}

module.exports = { createSlide };