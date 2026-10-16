import { validatePostSource } from './validation.mjs';
import './source-field.js';
import { registerPostFormat } from './post-format.mjs';
import { LAYOUT_COLLECTION, registerLayoutField, registerLayoutFormat, validateLayout } from './layout-field.js';

// Defer runs before DOMContentLoaded, so CMS is available when this fires.
let layoutShapes = null;
fetch(new URL('../assets/data/after-work-shapes.json', location.href)).then((r) => r.json()).then((j) => { layoutShapes = j; }).catch(() => {});

function registerChecks() {
  if (!window.CMS) return;
  registerPostFormat(window.CMS);
  registerLayoutFormat(window.CMS);
  registerLayoutField(window.CMS);
  window.CMS.registerEventListener({
    name: 'preSave',
    handler: ({ entry }) => {
      if (entry.get('collection') === 'posts') {
        validatePostSource(entry.getIn(['data', 'body']));
      }
      if (entry.get('collection') === LAYOUT_COLLECTION) {
        // Synchronous so a failure reliably blocks Save; the outline masks are loaded up front.
        if (!layoutShapes) throw new Error('The sticker outlines are still loading. Try Save again in a moment.');
        validateLayout(entry.getIn(['data', 'layout']), layoutShapes);
      }
    },
  });
  window.CMS.init();
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', registerChecks, { once: true });
} else {
  registerChecks();
}
