// "After work" sticker layout in the site editor. The field shows the visual layout editor
// (the same one as /after-work/?edit) in a frame and hands its JSON back to the CMS, so Save
// goes through the usual review pull request. The file is kept byte for byte as the editor writes it.
import { checkLayout, describe } from '../assets/js/after-work-layout.js';

export const LAYOUT_COLLECTION = 'after-work-layout';

export function registerLayoutFormat(CMS) {
  CMS.registerCustomFormat('layout-raw', 'json', {
    fromFile: (source) => ({ layout: source }),
    toFile: (data) => (String(data.layout || '').endsWith('\n') ? String(data.layout) : `${data.layout}\n`),
  });
}

// Throws (which blocks Save) when the layout is not valid JSON or has spacing problems.
export function validateLayout(text, shapes) {
  let layout;
  try { layout = JSON.parse(text); } catch { throw new Error('The sticker layout is not valid JSON.'); }
  const problems = ['desktop', 'mobile'].flatMap((bp) => checkLayout(layout, shapes, bp).map((p) => `${bp}: ${describe(p)}`));
  if (problems.length) throw new Error(`Fix the sticker spacing first. ${problems.slice(0, 3).join('; ')}${problems.length > 3 ? ` (+${problems.length - 3} more)` : ''}`);
}

export function registerLayoutField(CMS) {
  const { createElement: h, useEffect, useRef, useState } = CMS.React;
  function LayoutControl({ value, onChange }) {
    const frame = useRef(null);
    const latest = useRef(typeof value === 'string' ? value : '');
    const [height, setHeight] = useState(900);
    const [problems, setProblems] = useState(0);
    latest.current = typeof value === 'string' ? value : '';
    useEffect(() => {
      const onMessage = (e) => {
        if (e.origin !== location.origin || e.source !== frame.current?.contentWindow || !e.data) return;
        const { awEmbed } = e.data;
        if (awEmbed === 'ready') {
          let layout = null;
          try { layout = JSON.parse(latest.current); } catch { layout = null; }
          e.source.postMessage({ awEmbed: 'init', layout }, location.origin);
        } else if (awEmbed === 'change') {
          setProblems(e.data.problems);
          if (typeof e.data.text === 'string' && e.data.text !== latest.current) onChange(e.data.text);
        } else if (awEmbed === 'height' && Number.isFinite(e.data.height)) setHeight(Math.max(600, e.data.height + 8));
      };
      addEventListener('message', onMessage);
      return () => removeEventListener('message', onMessage);
    }, [onChange]);
    return h('div', {},
      h('p', { style: { margin: '0 0 8px', font: '13px system-ui, sans-serif' } },
        problems ? `${problems} spacing problem${problems === 1 ? '' : 's'}: Save is blocked until they are fixed.` : 'Spacing is clear on both layouts. Save opens a review pull request.'),
      h('iframe', { ref: frame, title: 'Sticker layout editor', src: new URL('../after-work/?edit&embed', location.href).href, style: { width: '100%', height, border: '1px solid #8884', borderRadius: 8 } }));
  }
  CMS.registerFieldType('aw-layout', LayoutControl);
}
