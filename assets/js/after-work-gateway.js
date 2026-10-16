// Entry point for the After work gateway: the title entrance, the typed subtitle, the tennis ball bounce and,
// for the owner at /after-work/?edit, the layout editor (loaded only then).
import { initSubtitle } from './after-work-terminal.js';
import { initBounce } from './after-work-bounce.js';
import { initTitle } from './after-work-title.js';

const stickers = document.querySelector('.aw-stickers');
if (stickers) {
  const ball = stickers.querySelector('[data-aw-action="bounce"]');
  if (ball) initBounce(ball);
  const title = document.querySelector('.aw-head h1');
  if (title) initTitle(title);
  const sub = document.querySelector('.aw-head p');
  if (sub) initSubtitle(sub);
  if (new URLSearchParams(location.search).has('edit')) {
    import('./after-work-editor.js').then((m) => m.initEditor(stickers)).catch((e) => console.error('Layout editor failed to load', e));
  }
}
