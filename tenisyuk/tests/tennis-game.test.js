const test=require('node:test'),assert=require('node:assert/strict'),G=require('../js/tennis-physics.js');
function point(s,w){G.awardPoint(s,w,'test');if(s.setWinner===null)G.nextPoint(s);return s;}
test('0 15 30 40 game scoring',()=>{let s=G.create();point(s,0);assert.equal(G.scoreLabels(s)[0],'15');point(s,0);assert.equal(G.scoreLabels(s)[0],'30');point(s,0);assert.equal(G.scoreLabels(s)[0],'40');point(s,0);assert.deepEqual(s.games,[1,0]);assert.deepEqual(s.points,[0,0]);assert.equal(s.server,1)});
test('deuce advantage back to deuce then game',()=>{let s=G.create();s.points=[3,3];assert.deepEqual(G.scoreLabels(s),['Deuce','Deuce']);point(s,0);assert.deepEqual(G.scoreLabels(s),['AD','40']);point(s,1);assert.deepEqual(G.scoreLabels(s),['Deuce','Deuce']);point(s,0);point(s,0);assert.deepEqual(s.games,[1,0])});
test('set needs six games and two-game margin',()=>{let s=G.create();s.games=[5,4];s.points=[3,0];point(s,0);assert.equal(s.setWinner,0);s=G.create();s.games=[5,5];s.points=[3,0];point(s,0);assert.equal(s.setWinner,null);s.points=[3,0];point(s,0);assert.equal(s.setWinner,0)});
test('six-all starts tie break, seven with margin two',()=>{let s=G.create();s.games=[6,5];s.points=[0,3];point(s,1);assert(s.tiebreak);s.points=[6,6];point(s,0);assert.equal(s.setWinner,null);point(s,0);assert.equal(s.setWinner,0);assert.deepEqual(s.games,[7,6])});
test('out awards point against last hitter, no wall bounce',()=>{let s=G.create();s.x=20;s.vx=-100;s.lastHitter=0;G.step(s,.02);assert(s.over);assert.deepEqual(s.points,[0,1]);assert(s.event.includes('OUT'))});
test('line overlap remains in',()=>{let s=G.create();s.x=G.SETTINGS.courtLeft-3;s.vx=0;G.step(s,.02);assert(!s.over)});
test('computer can miss',()=>{let s=G.create();s.x=60;s.ai=220;s.y=34;s.vy=-165;G.step(s,.02,false,()=>220);assert(s.over);assert.deepEqual(s.points,[1,0])});
test('player miss gives computer point',()=>{let s=G.create();s.y=410;s.x=160;s.vy=165;G.step(s,.02);assert(s.over);assert.deepEqual(s.points,[0,1])});
test('paddle hit aims and spin respects reduce motion',()=>{let s=G.create();s.x=180;s.y=359;s.vx=0;s.vy=165;G.step(s,.02);assert(s.vx>0);assert(s.vy<0);let a=G.create();G.step(a,.02,true);assert.equal(a.spin,0)});
test('policy snapshot isolated',()=>{let s=G.create();G.step(s,.02,false,o=>{o.points[0]=99;return 160});assert.equal(s.points[0],0)});

test('tie-break service order starts with either server then 2 each',()=>{for(const first of [0,1]){let s=G.create();s.tiebreak=true;s.tieFirst=first;s.server=first;for(let n=0;n<9;n++){s.points=[n,0];G.nextPoint(s);assert.equal(s.server,n===0?first:(Math.floor((n-1)/2)%2===0?1-first:first));}}});
