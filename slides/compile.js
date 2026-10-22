const pptxgen = require('pptxgenjs');
const path = require('path');

const pres = new pptxgen();
pres.layout = 'LAYOUT_16x9';
pres.author = 'Milana';
pres.company = 'Lapa ryadom';
pres.title = 'Lapa ryadom - adresnaya pomoshch prijutam';
pres.subject = 'Den SUBD 2026, konkurs Digital Q.DataBase';

// Palette: "Nature & Outdoors" (design-system #3), light mode.
// primary   283618  dark green   -> body text and dark panels
// secondary 606c38  olive        -> muted text, dividers, frames
// accent    bc6c25  burnt orange -> highlights, numbers, warnings
// light     dda15e  warm tan     -> card backgrounds
// bg        fefae0  cream        -> slide background
const theme = {
  primary: '283618',
  secondary: '606c38',
  accent: 'bc6c25',
  light: 'dda15e',
  bg: 'FEFae0'
};

const order = [
  './slide-01.js', // титул
  './slide-02.js', // проблема
  './slide-03.js', // четыре шага
  './slide-04.js', // интерфейс: каталог
  './slide-05.js', // интерфейс: заявки
  './slide-06.js', // интерфейс: вход приюта
  './slide-07.js', // интерфейс: приёмка
  './slide-08.js', // что делает база данных
  './slide-09.js', // доказательство переноса
  './slide-10.js'  // итог
];

order.forEach(function (f) {
  require(f).createSlide(pres, theme);
});

const out = path.join(__dirname, 'output', 'lapa-ryadom-pitch.pptx');
pres.writeFile({ fileName: out }).then(function () {
  console.log('WROTE ' + out);
});