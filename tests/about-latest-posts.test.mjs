import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../assets/css/workflow.css',import.meta.url),'utf8');
const desktop=css.slice(css.indexOf('@media (min-width: 1100px)'));
test('Latest posts card matches the About panel height on desktop only',()=>{
 assert.match(desktop,/\.wf-below \{[^}]*align-items: stretch/);
 assert.match(desktop,/\.wf-aside \.wf-card \{[^}]*flex: 1/);
 assert.match(desktop,/\.wf-aside \.wf-more \{[^}]*margin-top: auto/);
 const base=css.slice(0,css.indexOf('@media (min-width: 1100px)'));
 assert.doesNotMatch(base,/align-items: stretch/);
 assert.match(base,/\.wf-below \{ display: flex; flex-direction: column/);
});
