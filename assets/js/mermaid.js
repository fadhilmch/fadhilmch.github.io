// Mermaid diagrams in posts. Loaded only on posts that contain a ```mermaid block.
// kramdown/Rouge renders the block as div.language-mermaid; we swap it for a diagram
// themed from the site tokens, and redraw it when the theme toggle flips.
import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';

var blocks = Array.prototype.map.call(
  document.querySelectorAll('.prose div.language-mermaid, .prose pre > code.language-mermaid'),
  function (el) {
    var host = el.tagName === 'CODE' ? el.parentElement : el;
    var fig = document.createElement('figure');
    fig.className = 'mermaid-fig';
    var pre = document.createElement('pre');
    pre.className = 'mermaid';
    fig.appendChild(pre);
    host.replaceWith(fig);
    return { pre: pre, source: el.textContent.trim() };
  }
);

// Tokens can be oklch(); Mermaid's colour maths needs rgb, so resolve each through a canvas pixel.
var ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
function token(name) {
  ctx.clearRect(0, 0, 1, 1);
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#888';
  ctx.fillRect(0, 0, 1, 1);
  var d = ctx.getImageData(0, 0, 1, 1).data;
  return 'rgb(' + d[0] + ', ' + d[1] + ', ' + d[2] + ')';
}

function render() {
  var dark = document.documentElement.getAttribute('data-theme') === 'dark';
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: 'base',
    fontFamily: "'Geist Mono', monospace",
    themeVariables: {
      darkMode: dark,
      fontSize: '13px',
      background: token('--bg'),
      primaryColor: token('--panel'),
      primaryBorderColor: token('--line'),
      primaryTextColor: token('--fg'),
      secondaryColor: token('--panel'),
      tertiaryColor: token('--bg'),
      lineColor: token('--muted'),
      textColor: token('--fg'),
      noteBkgColor: token('--panel'),
      noteBorderColor: token('--line'),
      noteTextColor: token('--fg'),
      clusterBkg: token('--bg'),
      clusterBorder: token('--line'),
      edgeLabelBackground: token('--bg'),
      actorBkg: token('--panel'),
      actorBorder: token('--line'),
      actorTextColor: token('--fg'),
      signalColor: token('--muted'),
      signalTextColor: token('--fg')
    }
  });
  blocks.forEach(function (b) {
    b.pre.removeAttribute('data-processed');
    b.pre.textContent = b.source;
  });
  return mermaid.run({ nodes: blocks.map(function (b) { return b.pre; }) });
}

if (blocks.length) {
  render();
  window.addEventListener('fm-theme-change', render);
}
