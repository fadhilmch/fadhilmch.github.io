const test=require('node:test'),assert=require('node:assert/strict'),G=require('../js/tennis-physics.js');
test('starts centered with zero rally',()=>{const s=G.create();assert.equal(s.rally,0);assert.equal(s.over,false);assert.equal(s.paddle,160)});
test('wall bounce stays inside court',()=>{let s=G.create();s.x=7;s.vx=-90;G.step(s,.02);assert.equal(s.x,7);assert(s.vx>0)});
test('opponent returns at top',()=>{let s=G.create();s.y=34;G.step(s,.02);assert.equal(s.y,34);assert(s.vy>0)});
test('paddle return increments rally once',()=>{let s=G.create();s.y=359;s.vy=180;G.step(s,.02);assert.equal(s.rally,1);assert(s.vy<0);G.step(s,.02);assert.equal(s.rally,1)});
test('miss ends rally, cannot keep moving',()=>{let s=G.create();s.x=20;s.y=410;s.vy=180;G.step(s,.02);assert(s.over);let y=s.y;G.step(s,.02);assert.equal(s.y,y)});
test('slow mode moves less',()=>{let a=G.create(),b=G.create();G.step(a,.02);G.step(b,.02,true);assert(b.y>a.y)});
test('zero delta and frame cap prevent jumps',()=>{let a=G.create(),b=G.create();G.step(a,0);assert.equal(a.y,320);G.step(a,1);G.step(b,.025);assert.equal(a.y,b.y)});
test('paddle clamp handles both edges',()=>{assert.equal(G.clamp(-50,32,288),32);assert.equal(G.clamp(500,32,288),288)});

test('left and right edges aim the return',()=>{for(const sign of [-1,1]){let s=G.create();s.x=s.paddle+sign*20;s.vx=0;s.y=359;s.vy=180;G.step(s,.02);assert.equal(Math.sign(s.vx),sign)}});
test('racket motion adds direction to center hit',()=>{let s=G.create();G.movePaddle(s,180,.02);s.x=180;s.vx=0;s.y=359;s.vy=180;G.step(s,.02);assert(s.vx>0);assert(s.vx<=170)});
test('movement influence fades when racket is still',()=>{let s=G.create();G.movePaddle(s,180,.02);const old=s.paddleV;G.step(s,.025);assert(s.paddleV<old)});

test('opponent policy is swappable and cannot mutate state',()=>{const s=G.create();const x=s.x;G.step(s,.02,false,(obs)=>{obs.x=999;return 32});assert.equal(s.x,x+s.vx*.02);assert(s.ai<160)});

test('spin follows direction and stops for reduced motion',()=>{let a=G.create(),b=G.create(),c=G.create();b.vx=-72;G.step(a,.02);G.step(b,.02);G.step(c,.02,true);assert(a.spin>0);assert(b.spin<0);assert.equal(c.spin,0)});
