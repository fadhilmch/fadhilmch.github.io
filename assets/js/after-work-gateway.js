// Entry point for the After work gateway: the laptop easter egg, visitor Play mode and,
// for the owner at /after-work/?edit, the layout editor (loaded only then).
import { initTerminal, initSubtitle } from './after-work-terminal.js';
import { initPlay } from './after-work-play.js';

const stickers = document.querySelector('.aw-stickers');
if (stickers) {
  const laptop = stickers.querySelector('[data-aw-action="terminal"]');
  if (laptop) initTerminal(stickers, laptop);
  const sub = document.querySelector('.aw-head p');
  if (sub) initSubtitle(sub);
  const play = document.querySelector('[data-aw-play]'), reset = document.querySelector('[data-aw-reset]');
  if (play && reset) initPlay(stickers, play, reset);
  if (new URLSearchParams(location.search).has('edit')) {
    import('./after-work-editor.js').then((m) => m.initEditor(stickers)).catch((e) => console.error('Layout editor failed to load', e));
  }
}
