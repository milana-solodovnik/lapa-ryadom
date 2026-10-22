const pptxgen = require('pptxgenjs');
const path = require('path');
const brand = require('./lib/brand.js');

const pres = new pptxgen();
pres.layout = 'LAYOUT_16x9';
pres.author = 'Milana';
pres.company = 'Lapa ryadom';
pres.title = 'Lapa ryadom - adresnaya pomoshch prijutam';
pres.subject = 'Den SUBD 2026, konkurs Digital Q.DataBase';

// Оформление собрано в slides/lib/brand.js: палитра снята пипеткой с
// референсных слайдов, фоновые градиенты рисует slides/make_assets.py.
// Здесь только порядок.
const order = [
  './slide-01.js', // титул
  './slide-02.js', // проблема
  './slide-03.js', // четыре шага
  './slide-04.js', // интерфейс: каталог и заявки
  './slide-05.js', // интерфейс: вход и приёмка
  './slide-06.js', // полиглот: PostgreSQL и Microsoft SQL
  './slide-07.js'  // итог
];

order.forEach(function (f) {
  require(f).createSlide(pres, brand.theme);
});

const out = path.join(__dirname, 'output', 'lapa-ryadom-pitch.pptx');
pres.writeFile({ fileName: out }).then(function () {
  console.log('WROTE ' + out);
});