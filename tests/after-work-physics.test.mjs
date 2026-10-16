import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {makeWorld,overlaps,moveToward,tryStep} from '../assets/js/after-work-physics.js';
const layout=JSON.parse(readFileSync(new URL('../_data/after_work_layout.json',import.meta.url),'utf8'));
const shapes=JSON.parse(readFileSync(new URL('../assets/data/after-work-shapes.json',import.meta.url),'utf8'));
const anyOverlap=w=>{for(let i=0;i<w.bodies.length;i++)for(let j=i+1;j<w.bodies.length;j++)if(overlaps(w.bodies[i],w.bodies[j]))return [w.bodies[i].id,w.bodies[j].id];return null};
for(const bp of['desktop','mobile'])test(`${bp}: board starts with no overlaps; dragging pushes without overlap, stays on the board, links never move`,()=>{
 const w=makeWorld(layout,shapes,bp);assert.equal(anyOverlap(w),null);
 const links=w.bodies.filter(b=>!b.movable);assert.deepEqual(links.map(b=>b.id).sort(),['coffee','cooking']);
 let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
 for(let k=0;k<300;k++){const m=w.bodies.filter(b=>b.movable);const b=m[Math.floor(rnd()*m.length)];
  moveToward(w,b,b.ox+(rnd()-.5)*200,b.oy+(rnd()-.5)*200);
  assert.equal(anyOverlap(w),null,'step '+k);}
 for(const b of w.bodies){assert.ok(b.bx0+b.ox>=-10&&b.bx1+b.ox<=w.board.w+10&&b.by0+b.oy>=-10&&b.by1+b.oy<=w.board.h+10,b.id+' off board');}
 for(const l of links)assert.equal(l.ox+l.oy,0);
});
test('a blocked step changes nothing',()=>{
 const w=makeWorld(layout,shapes,'desktop');const b=w.bodies.find(x=>x.movable);const before=w.bodies.map(x=>[x.ox,x.oy]);
 assert.equal(tryStep(w,b,5000,0),false);assert.deepEqual(w.bodies.map(x=>[x.ox,x.oy]),before);
});
