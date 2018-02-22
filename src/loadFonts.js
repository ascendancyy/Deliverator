import FontFaceObserver from 'fontfaceobserver/fontfaceobserver.standalone';
import Storage from 'src/Storage';
import { inlineStyles } from 'src/utils';

async function loadFonts() {
  inlineStyles('https://fonts.googleapis.com/css?family=Cabin:400,500,700');

  const fontsLoaded = Storage.get('deliverator:fonts-loaded', 'session') || false;
  if (fontsLoaded) {
    document.body.classList.add('main-font-loaded');
    document.body.classList.add('other-fonts-loaded');
    return;
  }

  const timeout = 5000;
  const fonts = [
    new FontFaceObserver('Cabin', { weight: 500 }),
    new FontFaceObserver('Cabin', { weight: 700 }),
  ];

  const main = new FontFaceObserver('Cabin', { weight: 400 });
  await main.load(null, timeout);
  document.body.classList.add('main-font-loaded');

  await Promise.all(fonts.map(font => font.load(null, timeout)));
  document.body.classList.add('other-fonts-loaded');

  Storage.set('deliverator:fonts-loaded', true, 'session');
}

export { loadFonts as default };
