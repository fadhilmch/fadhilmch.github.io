(function () {
  'use strict';
  const R = StrollerRoutes, $ = id => document.getElementById(id);
  const selected = {from:null,to:null};
  let busy = false;
  const formatter = new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Stockholm',hour:'2-digit',minute:'2-digit'});
  function time(value) { return value && !isNaN(Date.parse(value)) ? formatter.format(new Date(value)) : 'Time unavailable'; }
  function el(tag,text,className) { const n=document.createElement(tag); if(text!==undefined)n.textContent=text; if(className)n.className=className; return n; }
  async function get(url) {
    const controller = new AbortController();
    const timer = setTimeout(()=>controller.abort(),20000);
    try { const res=await fetch(url,{signal:controller.signal}); if(!res.ok)throw Error('SL could not answer. Please try again.'); return await res.json(); }
    catch(e) { if(e.name==='AbortError')throw Error('SL took too long to answer. Please try again.'); throw e; }
    finally { clearTimeout(timer); }
  }
  for (const key of ['from','to']) $(key).addEventListener('input',()=>{
    selected[key]=null; $(key+'-selected').textContent=''; $(key+'-choices').replaceChildren(); $('results').replaceChildren(); $('status').textContent='';
  });
  async function resolve(key) {
    if (selected[key]) return true;
    const query=$(key).value.trim();
    if(query.length<2)throw Error('Enter at least two letters for '+key+'.');
    const data=await get(R.lookupURL(query));
    const locations=(data.locations||[]).filter(l=>l.id&&l.name&&['stop','poi','street','address','singlehouse'].includes(l.type));
    const choices=$(key+'-choices'); choices.replaceChildren();
    if(!locations.length)throw Error('No place found for '+key+'. Try a fuller address or a nearby stop.');
    for(const l of locations.slice(0,8)) {
      const b=el('button',l.name+' ('+l.type+')'); b.type='button';
      b.addEventListener('click',()=>{selected[key]=l;$(key).value=l.name;choices.replaceChildren();$(key+'-selected').textContent='Selected '+l.type;$('status').textContent='Press Find bus routes to continue.';});
      choices.append(b);
    }
    $('status').textContent='Choose your '+key+' from the matches above, then press Find bus routes.';
    return false;
  }
  function render(j) {
    const card=el('article');
    const first=j.legs[0],last=j.legs.at(-1);
    const start=first.origin?.departureTimeEstimated||first.origin?.departureTimePlanned;
    let end=last.destination?.arrivalTimeEstimated||last.destination?.arrivalTimePlanned;
    const after=(last.footPathInfo||[]).filter(p=>p.position==='AFTER').reduce((s,p)=>s+(p.duration||0),0);
    if(end&&after)end=new Date(Date.parse(end)+after*1000).toISOString();
    card.append(el('div',time(start)+' - '+time(end),'summary'));
    const buses=j.legs.filter(l=>R.kind(l)==='bus');
    const seconds=j.tripRtDuration||j.tripDuration;
    card.append(el('div',(seconds?Math.round(seconds/60)+' min · ':'')+Math.max(0,buses.length-1)+(buses.length===2?' transfer':' transfers'),'small'));
    const list=el('ol',undefined,'legs');
    for(const leg of j.legs) {
      const item=el('li');
      if(R.kind(leg)==='bus') {
        item.append(el('span','Bus '+R.line(leg),'badge'));
        if(leg.transportation.destination?.name)item.append(el('div','Towards '+leg.transportation.destination.name,'small'));
        item.append(el('div',time(leg.origin.departureTimeEstimated||leg.origin.departureTimePlanned)+' · '+leg.origin.name,'stop'));
        item.append(el('div','Get off at '+leg.destination.name,'stop'));
        const platform=leg.origin.properties?.stoppingPointPlanned;
        if(platform)item.append(el('div','Stop position '+platform,'small'));
        item.append(el('div','Check the reader when boarding.','warn'));
      } else {
        item.append(el('span','Walk'+(leg.duration?' · '+Math.ceil(leg.duration/60)+' min':''),'badge'));
        item.append(el('div',leg.origin.name+' → '+leg.destination.name,'stop'));
      }
      // SL sometimes embeds transfer footpaths in a bus leg rather than a separate walking leg.
      for(const path of leg.footPathInfo||[]) {
        const elems=path.footPathElem||[];
        if(elems.length) {
          item.append(el('div','Walk'+(path.duration?' · '+Math.ceil(path.duration/60)+' min':''),'small'));
          item.append(el('div',(elems[0].origin?.name||leg.destination.name)+' → '+(elems.at(-1).destination?.name||''),'stop'));
        }
      }
      list.append(item);
    }
    card.append(list);return card;
  }
  $('form').addEventListener('submit',async e=>{
    e.preventDefault();if(busy)return;busy=true;for(const id of ['search','from','to','preference'])$(id).disabled=true;$('results').replaceChildren();$('status').textContent='Looking up your places…';
    try {
      if(!await resolve('from'))return;
      if(!await resolve('to'))return;
      if(selected.from.id===selected.to.id)throw Error('Choose two different places.');
      $('status').textContent='Checking bus routes…';
      const result=await R.search(selected.from.id,selected.to.id,$('preference').value,get,i=>{
        $('status').textContent=i===0?'Checking bus routes…':i===3?'Trying departures in 30 minutes…':'Trying another route preference…';
      });
      const journeys=result.journeys;
      if(!journeys.length){$('status').textContent='No matching journey in these SL suggestions. Try another preference or a nearby stop. This does not mean no bus route exists.';return;}
      $('status').textContent=journeys.length+' bus '+(journeys.length===1?'journey':'journeys')+' · '+(result.later?'departures in 30 minutes · ':'')+'checked just now';
      journeys.forEach(j=>$('results').append(render(j)));
      $('results').scrollIntoView({behavior:'smooth',block:'start'});
    } catch(e) {$('status').textContent=e.message==='Failed to fetch'?'Could not reach SL. Check your connection and try again.':e.message;}
    finally {busy=false;for(const id of ['search','from','to','preference'])$(id).disabled=false;}
  });
})();
