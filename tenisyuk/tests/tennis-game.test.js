const test=require('node:test'),assert=require('node:assert/strict'),G=require('../js/tennis-game.js');
test('starts centered with zero rally',()=>{const s=G.create();assert.equal(s.rally,0);assert.equal(s.over,false);assert.equal(s.paddle,160)});
test('wall bounce stays inside court',()=>{let s=G.create();s.x=7;s.vx=-90;G.step(s,.02);assert.equal(s.x,7);assert(s.vx>0)});
test('opponent returns at top',()=>{let s=G.create();s.y=34;G.step(s,.02);assert.equal(s.y,34);assert(s.vy>0)});
test('paddle return increments rally once',()=>{let s=G.create();s.y=359;s.vy=180;G.step(s,.02);assert.equal(s.rally,1);assert(s.vy<0);G.step(s,.02);assert.equal(s.rally,1)});
test('miss ends rally, cannot keep moving',()=>{let s=G.create();s.x=20;s.y=410;s.vy=180;G.step(s,.02);assert(s.over);let y=s.y;G.step(s,.02);assert.equal(s.y,y)});
test('slow mode moves less',()=>{let a=G.create(),b=G.create();G.step(a,.02);G.step(b,.02,true);assert(b.y>a.y)});
test('zero delta and frame cap prevent jumps',()=>{let a=G.create(),b=G.create();G.step(a,0);assert.equal(a.y,320);G.step(a,1);G.step(b,.025);assert.equal(a.y,b.y)});
test('paddle clamp handles both edges',()=>{assert.equal(G.clamp(-50,32,288),32);assert.equal(G.clamp(500,32,288),288)});
