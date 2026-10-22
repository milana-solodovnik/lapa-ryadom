// Slide 6 -- Интерфейс, шаг 3: вход на стойку приюта.
const { buildInterfaceSlide } = require('./lib/interface.js');

function createSlide(pres, theme) {
  return buildInterfaceSlide(pres, theme, {
    n: 6,
    subtitle: 'Приёмку ведёт только представитель приюта',
    shot: 'screenshots/login-page.png',
    shotLabel: 'D2 · ВХОД ДЛЯ ПРИЮТОВ',
    panelTitle: 'КТО ЗДЕСЬ ВХОДИТ',
    numbers: null,
    notes:
      'Посетитель работает без аккаунта и без телефона. Вход есть только у сотрудника приюта, и он привязан к своему приюту.\n\n' +
      'Пароль хранится в виде хеша Argon2id, сессия — отдельная токеном в cookie.\n\n' +
      'Чужой приют не сможет принять передачу: представитель «Добрых лап» не примет код приюта «Северный».'
  });
}

module.exports = { createSlide };