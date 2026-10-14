const test=require('node:test'),assert=require('node:assert/strict');
const SY=require('../js/sync'),E=require('../js/edits'),M=require('../js/money');
const fresh=()=>({version:'8',sessions:[],tx:[],venues:[],cfg:{payer:'Fadel'}});
const state=()=>({version:'7',doc:{sessions:[]},admin:'test-only',code:'test-only'});
test('save sends loaded version, not an old undo document version',async()=>{
 const s=state();s.doc.version='2';let args;
 assert.equal(await SY.save(s,async(fn,a)=>{assert.equal(fn,'admin_save_v2');args=a;return{ok:true,version:'8'}},async()=>fresh()),'ok');
 assert.equal(args.p_expected_version,'7');assert.equal(s.version,'8');
});
test('conflict discards local edit and loads authoritative snapshot',async()=>{
 const s=state();assert.equal(await SY.save(s,async()=>({error:'conflict'}),async()=>fresh()),'server');
 assert.equal(s.version,'8');assert.deepEqual(s.doc.sessions,[]);assert.match(s.err,/Review/);
});
test('no version never falls back to old admin_save',async()=>{
 const s=state();s.version=undefined;
 assert.equal(await SY.save(s,()=>{throw Error('must not call')},()=>{}),'offline');
 assert.match(s.err,/update/);
});
test('response lost after commit reloads instead of claiming nothing changed',async()=>{
 const s=state();assert.equal(await SY.save(s,async()=>{throw Error('lost')},async()=>fresh()),'server');
 assert.equal(s.version,'8');assert.match(s.err,/unknown/);
});
test('reload failure disables next save and does not keep a valid stale version',async()=>{
 const s=state();await SY.save(s,async()=>({error:'conflict'}),async()=>{throw Error('offline')});
 assert.equal(s.version,null);assert.match(s.err,/Refresh/);
});
test('fronted edit changes only real and preserves player charges',()=>{
 const doc={sessions:[{id:'s',date:'25 Sep',billed:595,real:455,players:['Fadel','Budi'],paid:['Fadel']}],tx:[],venues:[]};
 const next=E.setReal(doc,'s',475);assert.equal(doc.sessions[0].real,455);assert.equal(next.sessions[0].real,475);
 assert.equal(M.charge(next.sessions[0]),M.charge(doc.sessions[0]));assert.equal(M.gap(next.sessions[0]),120);
 const expected=JSON.parse(JSON.stringify(doc));expected.sessions[0].real=475;assert.deepEqual(next,expected);
 for(const x of [-1,NaN,Infinity,'475'])assert.throws(()=>E.setReal(doc,'s',x));
 assert.equal(E.setReal(doc,'s',0).sessions[0].real,0);
});
