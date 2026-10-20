// Entry point for the After work gateway: the typed subtitle and,
// for the owner at /after-work/?edit, the layout editor (loaded only then).
import { initSubtitle } from './after-work-terminal.js';
import { initFx } from './after-work-fx.js';
import { initPlay } from './after-work-play.js';

const stickers = document.querySelector('.aw-stickers');
if (stickers) {
  initFx(stickers);
  const sub = document.querySelector('.aw-head p');
  // If the module took so long that the inline fallback already restored the static line, keep it.
  if (sub && document.documentElement.classList.contains('aw-js')) initSubtitle(sub);
  const editing = new URLSearchParams(location.search).has('edit');
  if (!editing) initPlay(stickers).catch((e) => console.error('Sticker play failed to load', e));
  if (editing) {
    import('./after-work-editor.js').then((m) => m.initEditor(stickers)).catch((e) => console.error('Layout editor failed to load', e));
  }
}
