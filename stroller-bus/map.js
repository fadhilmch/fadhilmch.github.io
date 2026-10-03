/* Geographic route overview from public GTFS coordinates. No tile requests. */
(function(root){
'use strict';
function legs(result,data,from,to){return result.path.map(p=>{
 if(p.kind==='walk')return{kind:'walk',points:[p.from===undefined?[from.coord[0],from.coord[1]]:[data.stops[p.from].lat,data.stops[p.from].lon],p.to===undefined?[to.coord[0],to.coord[1]]:[data.stops[p.to].lat,data.stops[p.to].lon]]};
 const trip=data.trips.find(t=>t.id===p.trip);let calls=[];
 if(trip){let active=false;for(const c of trip.calls){if(!active&&c.stop===p.from&&c.departure===p.departure)active=true;if(active)calls.push(c);if(active&&c.stop===p.to&&c.arrival===p.arrival)break}}
 return{kind:'bus',line:p.line,points:calls.length?calls.map(c=>[data.stops[c.stop].lat,data.stops[c.stop].lon]):[p.from,p.to].map(i=>[data.stops[i].lat,data.stops[i].lon])};
})}
function draw(container,result,data,from,to){
 const routes=legs(result,data,from,to);const points=routes.flatMap(l=>l.points);if(!points.length)return;
 const width=350,height=280,pad=32,lat=points.reduce((s,p)=>s+p[0],0)/points.length;
 const xy=p=>[p[1]*Math.cos(lat*Math.PI/180),-p[0]];const coords=points.map(xy),xs=coords.map(p=>p[0]),ys=coords.map(p=>p[1]);const xmin=Math.min(...xs),xmax=Math.max(...xs),ymin=Math.min(...ys),ymax=Math.max(...ys),scale=Math.min((width-pad*2)/Math.max(xmax-xmin,.001),(height-pad*2)/Math.max(ymax-ymin,.001));
 const project=p=>{const c=xy(p);return[width/2+(c[0]-(xmin+xmax)/2)*scale,height/2+(c[1]-(ymin+ymax)/2)*scale]};
 const NS='http://www.w3.org/2000/svg';const node=(tag,attrs)=>{const n=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,v);return n};
 const svg=node('svg',{viewBox:`0 0 ${width} ${height}`,role:'img','aria-label':'Geographic route overview. Blue bus legs, dashed walking estimates.'});
 svg.append(node('rect',{width,height,fill:'#eef3f8'}));
 for(const l of routes){svg.append(node('polyline',{points:l.points.map(p=>project(p).join(',')).join(' '),fill:'none',stroke:l.kind==='bus'?'#006aa7':'#766112','stroke-width':l.kind==='bus'?5:3,'stroke-dasharray':l.kind==='bus'?'':'7 6','stroke-linejoin':'round','stroke-linecap':'round'}));}
 const locations=[{p:points[0],label:'From'},...result.path.filter(p=>p.kind==='bus').map(p=>({p:[data.stops[p.from].lat,data.stops[p.from].lon],label:p.line})),{p:points.at(-1),label:'To'}];
 const labelPositions=[];for(const l of locations){const [x,y]=project(l.p);let ly=y-9;while(labelPositions.some(pos=>Math.abs(pos[0]-x)<38&&Math.abs(pos[1]-ly)<15))ly-=16;ly=Math.max(14,ly);labelPositions.push([x,ly]);svg.append(node('circle',{cx:x,cy:y,r:6,fill:'#fecc00',stroke:'#003e6d','stroke-width':2}));const text=node('text',{x:Math.min(width-36,x+9),y:ly,fill:'#003e6d','font-family':'system-ui,sans-serif','font-size':12,'font-weight':700,'paint-order':'stroke',stroke:'#eef3f8','stroke-width':3});text.textContent=l.label;svg.append(text)}
 const north=node('text',{x:width-26,y:23,fill:'#003e6d','font-size':12});north.textContent='N ↑';svg.append(north);
 container.replaceChildren(svg);return routes;
}
async function street(container,result,data,from,to){
 if(!root.L){await Promise.all([new Promise((resolve,reject)=>{const css=document.createElement('link');css.rel='stylesheet';css.href='vendor/leaflet.css';css.onload=resolve;css.onerror=()=>reject(Error('Could not load map styles.'));document.head.append(css)}),new Promise((resolve,reject)=>{const js=document.createElement('script');js.src='vendor/leaflet.js';js.onload=resolve;js.onerror=()=>reject(Error('Could not load the map library.'));document.head.append(js)})])}
 container.replaceChildren();container.style.height='320px';
 const map=L.map(container,{scrollWheelZoom:false,attributionControl:true});
 const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',referrerPolicy:'strict-origin-when-cross-origin'}).addTo(map);
 const routes=legs(result,data,from,to),points=routes.flatMap(r=>r.points);
 for(const r of routes)L.polyline(r.points,{color:r.kind==='bus'?'#006aa7':'#766112',weight:r.kind==='bus'?5:3,dashArray:r.kind==='bus'?null:'7 6'}).addTo(map);
 const locations=[{p:points[0],name:from.name},{p:points.at(-1),name:to.name},...result.path.filter(p=>p.kind==='bus').flatMap(p=>[{p:[data.stops[p.from].lat,data.stops[p.from].lon],name:'Bus '+p.line+': '+data.stops[p.from].name},{p:[data.stops[p.to].lat,data.stops[p.to].lon],name:'Get off: '+data.stops[p.to].name}])];
 for(const l of locations){const text=document.createElement('span');text.textContent=l.name;L.circleMarker(l.p,{radius:6,color:'#003e6d',weight:2,fillColor:'#fecc00',fillOpacity:1}).addTo(map).bindPopup(text)}
 map.fitBounds(points,{padding:[24,24],maxZoom:15});
 let failures=0;tiles.on('tileerror',()=>{failures++;if(failures===1){const note=document.createElement('p');note.className='small';note.textContent='Street tiles could not load. Route lines remain; use the route list for stop names.';container.after(note)}});
 return map;
}
const api={legs,draw,street};if(typeof module!=='undefined')module.exports=api;else root.RouteMap=api;
})(globalThis);
