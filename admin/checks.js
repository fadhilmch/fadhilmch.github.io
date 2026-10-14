import { validatePostSource } from './validation.mjs';
import './source-field.js';

// Defer runs before DOMContentLoaded, so CMS is available when this fires.
function registerChecks() {
  if (!window.CMS) return;
  window.CMS.registerEventListener({
    name: 'preSave',
    handler: ({ entry }) => {
      if (entry.get('collection') === 'posts') {
        validatePostSource(entry.getIn(['data', 'body']));
      }
    },
  });
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', registerChecks, { once: true });
} else {
  registerChecks();
}
