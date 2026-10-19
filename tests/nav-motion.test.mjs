import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const script=readFileSync(new URL('../assets/js/nav-motion.js',import.meta.url),'utf8');
function run({reduced=false,stored=null,type='navigate',storageFails=false,selectedIndex=1}={}){
 const animations=[],events={},storage=new Map(stored?[['fm-nav-arrival-main',JSON.stringify(stored)]]:[]);
 const el=(left=0)=>({offsetLeft:left,offsetTop:3,offsetWidth:80,offsetHeight:32,style:{},getBoundingClientRect(){return {left,top:3,width:80,height:32}},setAttribute(){},appendChild(){},animate(frames,options){animations.push({frames,options});},getAnimations(){return []}});
 const links=[0,1,2,3].map((i)=>({...el(i*80+3),href:'https://example.test/'+i+'/',querySelector(){return el();}}));
 const nav={clientLeft:1,clientTop:1,getBoundingClientRect(){return {left:0,top:0,width:340,height:40}},classList:{contains(){return false}},dataset:{},querySelectorAll(){return links},querySelector(){return links[selectedIndex]},prepend(){},addEventListener(k,f){events[k]=f}};
 const document={querySelector(){return nav},createElement(){return el()},referrer:'https://example.test/0/'};
 const sessionStorage={getItem(k){if(storageFails)throw Error();return storage.get(k)||null},removeItem(k){if(storageFails)throw Error();storage.delete(k)},setItem(k,v){if(storageFails)throw Error();storage.set(k,v)}};
 vm.runInNewContext(script,{document,sessionStorage,matchMedia:()=>({matches:reduced,addEventListener(){}}),performance:{getEntriesByType:()=>[{type}]},window:{addEventListener(){}},location:{pathname:'/1/',origin:'https://example.test'},URL,Date});
 return {animations,events,storage,links,nav};
}
const arrival=()=>({from:0,to:'/1/',at:Date.now()});
test('matching real document arrival animates 300ms marker/puddle plus 380ms icon',()=>{
 const r=run({stored:arrival()});assert.deepEqual(r.animations.map(a=>a.options.duration),[300,300,380]);assert.equal(r.storage.size,0);assert.equal(r.nav.dataset.motion,'ready');
});
test('reload, history, reduced motion, stale, mismatched and absent arrivals stay instant',()=>{
 for(const settings of [{type:'reload'},{type:'back_forward'},{reduced:true},{stored:{...arrival(),at:0}},{stored:{...arrival(),to:'/wrong/'}},{stored:null}]){
  const r=run({stored:arrival(),...settings});assert.equal(r.animations.length,0);
 }
});
test('normal links record source without preventing navigation; modifier links do not',()=>{
 const r=run();let prevented=false;const event={target:{closest:()=>r.links[2]},button:0,preventDefault(){prevented=true}};
 r.events.click(event);assert.equal(JSON.parse(r.storage.get('fm-nav-arrival-main')).from,1);assert.equal(prevented,false);
 r.storage.clear();r.events.click({...event,ctrlKey:true});assert.equal(r.storage.size,0);
});
test('storage failure cannot break native links or initial selected state',()=>{assert.doesNotThrow(()=>run({storageFails:true}));});
