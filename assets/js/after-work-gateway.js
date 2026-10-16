// Entry point for the After work gateway: the typed subtitle and,
// for the owner at /after-work/?edit, the layout editor (loaded only then).
import { initSubtitle } from './after-work-terminal.js';
import { initFx } from './after-work-fx.js';

const stickers = document.querySelector('.aw-stickers');
if (stickers) {
  initFx(stickers);
  const sub = document.querySelector('.aw-head p');
  if (sub) initSubtitle(sub);
  if (new URLSearchParams(location.search).has('edit')) {
    import('./after-work-editor.js').then((m) => m.initEditor(stickers)).catch((e) => console.error('Layout editor failed to load', e));
  }
}
