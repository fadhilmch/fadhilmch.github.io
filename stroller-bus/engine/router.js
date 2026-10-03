/* Round-based timetable search. One round = one additional bus.
   Keep labels per arriving trip so trip-specific transfers cannot be lost by earliest-only pruning. */
(function(root){'use strict';
function search(data,q){
 const labels=()=>Array.from({length:data.stops.length},()=>new Map());
 let previous=labels(),best=null;
 const ruleWalks=Array.from({length:data.stops.length},()=>[]);for(const r of data.rules||[])if(r.from!==r.to&&r.type!==3)ruleWalks[r.from].push(r);
 function metre(a,b){const rad=Math.PI/180,x=(a.lat-b.lat)*rad,y=(a.lon-b.lon)*rad,z=Math.sin(x/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(y/2)**2;return 6371000*2*Math.atan2(Math.sqrt(z),Math.sqrt(1-z))}
 const put=(ls,stop,l)=>{const key=l.trip?.id||'access';const old=ls[stop].get(key);if(!old||l.time<old.time){ls[stop].set(key,l);return true}return false};
 for(const a of q.access||[])put(previous,a.stop,{time:q.departure+a.seconds,path:a.seconds?[{kind:'walk',to:a.stop,seconds:a.seconds}]:[],trip:null,lastStop:null,lastArrival:null});
 const walks=Array.from({length:data.stops.length},()=>[]);for(const w of data.walks||[])walks[w.from].push(w);
 function closure(ls){const queue=[];ls.forEach((m,s)=>m.forEach(l=>queue.push({stop:s,label:l})));let head=0;
  while(head<queue.length){const x=queue[head++];if(x.label.time>=Math.min(best?.arrival||Infinity,q.departure+14400))continue;const conditioned=[];if(x.label.trip&&x.label.lastStop===x.stop)for(const r of ruleWalks[x.stop]){if(r.fromTrip&&r.fromTrip!==x.label.trip.baseId)continue;if(r.fromRoute&&r.fromRoute!==x.label.trip.route)continue;const distance=metre(data.stops[r.from],data.stops[r.to]);if(Number.isFinite(distance))conditioned.push({from:r.from,to:r.to,seconds:Math.max(30,Math.ceil(distance*1.35/0.9),r.seconds||0)})}for(const w of [...walks[x.stop],...conditioned]){if(w.seconds<0)throw Error('Negative walking time');const l={...x.label,time:x.label.time+w.seconds,path:[...x.label.path,{kind:'walk',from:x.stop,to:w.to,seconds:w.seconds}]};if(put(ls,w.to,l))queue.push({stop:w.to,label:l});}}return ls}
 previous=closure(previous);
 const rulesByPair=new Map();for(const r of data.rules||[]){const k=r.from+':'+r.to;if(!rulesByPair.has(k))rulesByPair.set(k,[]);rulesByPair.get(k).push(r)}
 function ready(l,trip,stop){if(!l.trip)return l.time;let seconds=data.stops[stop].minTransfer||120;let score=-1,rule=null;
  for(const r of rulesByPair.get(l.lastStop+':'+stop)||[]){if(r.fromTrip&&r.fromTrip!==l.trip.baseId)continue;if(r.toTrip&&r.toTrip!==trip.baseId)continue;if(r.fromRoute&&r.fromRoute!==l.trip.route)continue;if(r.toRoute&&r.toRoute!==trip.route)continue;const s=(r.fromTrip?2:0)+(r.toTrip?2:0)+(r.fromRoute?1:0)+(r.toRoute?1:0);if(s>score){score=s;rule=r}}
  if(rule){if(rule.type===3)return Infinity;seconds=rule.type===1?0:rule.seconds||120}
  return Math.max(l.time,l.lastArrival+seconds);
 }
 for(let round=1;round<=(q.maxBoardings||5);round++){
  const next=labels();let changed=false;
  for(const trip of data.trips){if(trip.calls.at(-1).arrival<q.departure||trip.calls[0].departure>Math.min(best?.arrival||Infinity,q.departure+14400))continue;let board=null;
   for(const call of trip.calls){if(call.arrival>=Math.min(best?.arrival||Infinity,q.departure+14400))break;
    if(board&&call.dropoff!==false){const l={time:call.arrival,path:[...board.label.path,{kind:'bus',line:trip.line,trip:trip.id,from:board.stop,to:call.stop,departure:board.departure,arrival:call.arrival}],trip,lastStop:call.stop,lastArrival:call.arrival};if(put(next,call.stop,l))changed=true;}
    if(!board&&call.pickup!==false){let candidate=null;for(const l of previous[call.stop].values()){if(ready(l,trip,call.stop)<=call.departure&&(!candidate||l.time<candidate.time))candidate=l}if(candidate)board={label:candidate,stop:call.stop,departure:call.departure};}
   }
  }
  if(!changed)break;previous=closure(next);
  for(const e of q.egress||[])for(const l of previous[e.stop].values()){const arrival=l.time+e.seconds;if(!best||arrival<best.arrival)best={arrival,boardings:round,path:[...l.path,...(e.seconds?[{kind:'walk',from:e.stop,seconds:e.seconds}]:[])]}}
 }
 return best;
}
function busRoute(r){const t=Number(r.route_type);return(t===3||(t>=700&&t<=716))&&![r.route_short_name,r.route_long_name].some(n=>/^[1-6]$/.test(String(n||'').trim().replace(/^0+(?=\d)/,'')))}
const api={search,busRoute};if(typeof module!=='undefined')module.exports=api;else root.BusNetwork=api;
})(globalThis);
