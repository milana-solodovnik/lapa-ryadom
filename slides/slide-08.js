// Слайд 8 — «Спасибо за внимание» с QR-кодом на репозиторий.
//
// Милана вынесла прощание на отдельный слайд (в версии семи слайдов оно
// было внизу итогового). QR-код ведёт на github.com/milana-solodovnik/lapa-ryadom
// и сгенерирован slides/make_qr.py без внешних зависимостей.
const B = require('./lib/brand.js');

function createSlide(pres, theme) {
  const slide = pres.addSlide();
  B.dark(pres, slide);

  slide.addText('СПАСИБО ЗА ВНИМАНИЕ', {
    x: 0.6, y: 1.66, w: 8.8, h: 0.42, margin: 0, align: 'center',
    fontFace: theme.fontDisplay, fontSize: 20, bold: true, color: theme.white, charSpacing: 2
  });
  slide.addText('Солодовник М. Е.  ·  КТ МТУСИ  ·  День СУБД 2026', {
    x: 0.6, y: 2.16, w: 8.8, h: 0.3, margin: 0, align: 'center',
    fontFace: theme.fontBody, fontSize: 11, color: 'EEDCF7'
  });

  // QR: белая рамка — это встроенная «тихая зона», без неё код не читается.
  const QR = 2.0;
  slide.addImage({
    path: B.asset('qr-repo.png'),
    x: (B.SLIDE_W - QR) / 2, y: 2.66, w: QR, h: QR
  });

  slide.addText('Проект на GitHub — сканируйте', {
    x: 0.6, y: 4.80, w: 8.8, h: 0.28, margin: 0, align: 'center',
    fontFace: theme.fontBody, fontSize: 12, bold: true, color: theme.white
  });
  slide.addText('github.com/milana-solodovnik/lapa-ryadom', {
    x: 1.0, y: 5.08, w: 8.0, h: 0.26, margin: 0, align: 'center',
    fontFace: theme.fontBody, fontSize: 10.5, color: 'EEDCF7'
  });

  B.pageNo(pres, slide, 8, 'E3D4F2');
  return slide;
}

module.exports = { createSlide };