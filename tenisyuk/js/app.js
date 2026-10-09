const CFG=window.TY||{};const DEMO=!CFG.url;const $=s=>document.querySelector(s);
const H=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const{fEn,fId,kr,charge,court,gap,MONTHS}=TYMoney;
const S={code:localStorage.getItem('ty_code')||sessionStorage.getItem('ty_code')||'',toast:null,admin:sessionStorage.getItem('ty_admin')||'',doc:null,cfg:null,version:null,saving:false,tab:'history',open:{},err:'',asking:false,addOpen:false,lang:'id',venueAdd:false,theme:localStorage.getItem('ty_theme')||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light')};
document.documentElement.dataset.theme=S.theme;
const demoDoc=()=>JSON.parse(localStorage.getItem('ty_demo')||'null')||{sessions:[
{id:'s11',date:'11 Sep',billed:900,real:900,venue:'',players:['Fadel','Aldo','HS Putra','Sabrina','Alif Harfian','Dedy','Qiang','Naufal'],paid:['Fadel','Aldo','HS Putra','Sabrina','Alif Harfian']},
{id:'s18',date:'18 Sep',billed:900,real:724,venue:'',players:['Fadel','Aldo','HS Putra','Sabrina','Alif Harfian','Dartagnan','Suci','Assevitto'],paid:['Fadel','Aldo','HS Putra','Sabrina','Alif Harfian','Dartagnan','Suci','Assevitto']},
{id:'s25',date:'25 Sep',billed:595,real:455,venue:'',players:['Fadel','HS Putra','Alif Harfian','Suci','Assevitto','Dartagnan','Aldo'],paid:['Fadel','Aldo']}],tx:[],venues:[]};
const demoCfg={payer:'Fadel',swish:'072-160 66 41',kasOpening:125,membershipTarget:700};
async function rpc(fn,args){const r=await fetch(CFG.url+'/rest/v1/rpc/'+fn,{method:'POST',headers:Object.assign({apikey:CFG.anonKey,'Content-Type':'application/json'},CFG.anonKey.startsWith('eyJ')?{Authorization:'Bearer '+CFG.anonKey}:{}),body:JSON.stringify(args)});if(!r.ok)throw new Error('network');return r.json()}
async function load(code){
 if(DEMO){if(code!=='demo')return{error:'wrong_code'};const d=demoDoc();return{...d,cfg:demoCfg,version:String(d.version||'0')}}
 return rpc('get_recap',{p_code:code})}
// ---- helpers ----
const PAYER=()=>S.cfg.payer;
const unpaidO=s=>TYMoney.unpaidOthers(s,PAYER());
const todayLabel=()=>{const p=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Stockholm',day:'numeric',month:'numeric'}).formatToParts(new Date());return Number(p.find(x=>x.type==='day').value)+' '+MONTHS[Number(p.find(x=>x.type==='month').value)-1]};
const VENUES=[['Sundbyberg',['Sundbybergs Rackethall']],['Solna',['Solna Tenniscenter','Bergshamra IP (Solna Tenniscenter outdoor)']],['Sollentuna',['Edsbergs Tennishall','Sollentuna Rackethall']],['Stockholm',['Stockholms Tennishall','Kungl. Tennishallen','Salkhallen (SALK)','Eriksdals tennisbanor (Hellas TK)','Hellasgårdens tennisbanor (Hellas TK)','Tennisstadion','Frescati Sports Center','Fredhällsparkens tennisplan']]];
const venueSel=(id,val)=>{const known=VENUES.flatMap(g=>g[1]);const extra=[...new Set([...(S.doc.venues||[]),...(val&&!known.includes(val)?[val]:[])])].filter(v=>!known.includes(v));
 return`<select id="${id}" data-venue><option value="">No venue</option>${VENUES.map(g=>`<optgroup label="${g[0]}">${g[1].map(v=>`<option${v===val?' selected':''}>${H(v)}</option>`).join('')}</optgroup>`).join('')}${extra.length?`<optgroup label="Added by you">${extra.map(v=>`<option${v===val?' selected':''}>${H(v)}</option>`).join('')}</optgroup>`:''}<option value="__add__">＋ Add new venue…</option></select>`};
// Ball marks the collected boundary only on paid/owed bars. It is decorative.
const bar=(parts,h=12,ball=false)=>{const total=parts.reduce((a,p)=>a+p.v,0),t=total||1;
 const marker=ball&&total>0?`<span class="tennis-ball" aria-hidden="true" style="--paid:${parts[0].v/t*100}%"></span>`:'';
 return`<div class="sbar${marker?' tennis-progress':''}" style="height:${h}px"><div class="bar-track">${parts.filter(p=>p.v>0).map(p=>`<i style="width:${p.v/t*100}%;background:${p.c}"></i>`).join('')}</div>${marker}</div>`};
const legend=i=>`<div class="legend">${i.map(x=>`<span><b style="background:${x[0]}"></b>${x[1]}</span>`).join('')}</div>`;
function status(s){const u=unpaidO(s),o=TYMoney.othersCount(s,PAYER());return u.length?`<span class="pill warn">${o-u.length}/${o} paid</span>`:'<span class="pill ok">All paid</span>'}
const totals=()=>TYMoney.totals(S.doc,S.cfg);
// ---- views ----
function view(){const root=$('#app');if(!S.doc){root.innerHTML=gate();bindGate();return}
 const T=totals(),admin=!!S.admin,ss=S.doc.sessions;
 const tabs=[['history','Sessions'],['stats','Stats'],['owed','Owed'],['cash','Cash'],['share','Share']];
 const adm=admin?`<div class="adminbar on">🔓<span class="hide-s"> Admin mode</span> <button class="btn sm" id="adm">Lock</button></div>`:S.asking?`<div class="adminbar"><input id="adm_code" type="password" placeholder="Admin code" aria-label="Admin code" autofocus><button class="btn primary sm" id="adm_go">Unlock</button><small class="${S.badAdmin?'badc':''}">${S.badAdmin?'Wrong code':''}</small></div>`:`<div class="adminbar"><button class="btn sm" id="adm">🔒 Admin</button></div>`;
 root.innerHTML=`<header class="sitebar"><div class="brand"><img class="wm wm-l" src="${TY_WM.light}" alt="tennis yuk"><img class="wm wm-d" src="${TY_WM.dark}" alt=""></div>
 <nav class="tabs">${tabs.map(([k,l])=>`<button data-tab="${k}" class="${S.tab===k?'on':''}">${l}</button>`).join('')}</nav>
 <div class="tools"><button class="tennis-game-launch" data-tennis-game aria-label="Play mini tennis" title="Play mini tennis">🎾</button>${adm}<button class="btn sm" id="th">${S.theme==='dark'?'☀️':'🌙'}<span class="hide-s"> ${S.theme==='dark'?'Light':'Dark'}</span></button></div></header>
 <div class="summary"><div><small>Sessions</small><b>${ss.length}</b></div><div><small>Still owed</small><b class="warnc">${kr(T.outstanding)}</b></div><div><small>Kas</small><b>${kr(T.kasReal)}</b></div><small class="upd">Updated ${todayLabel()}${DEMO?' · demo data':''}</small></div>
 ${S.err?`<div class="err">${H(S.err)}</div>`:''}
 ${S.saving?'<p role="status">Saving…</p>':''}<section${S.saving?' inert aria-busy="true"':''}>${S.tab==='history'?history(T,admin):S.tab==='stats'?stats(T):S.tab==='owed'?owed(T):S.tab==='cash'?cash(T,admin):share(T)}</section>
 <footer class="foot"><button class="linkbtn" id="forget">Forget this device</button></footer>${toastBar()}${sheet(T)}`;bind()}
function gate(){return`<div class="gate"><div class="gatebox"><div class="brand"><img class="wm wm-l" src="${TY_WM.light}" alt="tennis yuk"><img class="wm wm-d" src="${TY_WM.dark}" alt=""></div><p>Enter the viewer code from the group chat.</p><input id="code" type="password" placeholder="Viewer code" aria-label="Viewer code" autofocus><button class="btn primary" id="go">Open</button><small class="${S.err?'badc':''}" id="gerr">${S.err?H(S.err):(DEMO?'Demo mode: code demo (admin: admin)':'')}</small></div></div>`}
function card(s,admin){const o=!!S.open[s.id],u=unpaidO(s),others=TYMoney.othersCount(s,PAYER()),P=PAYER(),ch=charge(s);
 const pn=others-u.length;
 return`<article class="card"><button class="card-head" data-open="${s.id}" aria-expanded="${o}"><span class="cal">📅</span><span class="ch-main"><b>${H(s.date)}</b><small>${s.venue?'📍 '+H(s.venue)+' · ':''}${s.players.length} players · ${fEn(ch)} kr each</small></span>${status(s)}<span class="chev">${o?'▴':'▾'}</span></button>
 ${bar([{v:pn,c:'var(--ok)'},{v:u.length,c:'var(--warn)'}],6)}
 ${o?`<div class="card-body"><dl class="kv">
 <div><dt>Venue</dt><dd>${admin?`<div class="venue" style="min-width:190px">${venueSel('v_'+s.id,s.venue||'')}</div>`:(s.venue?H(s.venue):'<span class="muted">not set</span>')}</dd></div>
 <div><dt>Date</dt><dd>${admin?`<input class="dateinp" type="date" data-date="${s.id}" value="${TYMoney.labelToIso(s.date,new Date().getFullYear())}" aria-label="Session date">`:H(s.date)}</dd></div><div><dt>Billed</dt><dd>${kr(s.billed)}</dd></div><div><dt>Real booking (${H(P)} fronted)</dt><dd>${kr(s.real)}${admin?` <button class="btn sm" data-fronted="${s.id}">Edit fronted</button>`:''}</dd></div>
 <div><dt>Per person</dt><dd>${fEn(court(s))} + 5 kas = ${kr(ch)}</dd></div><div><dt>To membership</dt><dd>${kr(gap(s))}</dd></div><div><dt>Still owed</dt><dd>${kr(u.length*ch)}</dd></div></dl>
 <div class="chips">${s.players.map(p=>{const pd=s.paid.includes(p),can=admin&&p!==P;return`<button class="chip ${pd?'paid':'open'} ${can?'adm':''}" ${can?`data-tog="${s.id}|${H(p)}"`:'disabled'}>${pd?'✅':'⏳'} ${H(p)}${pd?'':' '+fEn(ch)}</button>`}).join('')}</div>
 ${admin?`<div class="actions"><button class="btn" data-allpaid="${s.id}">Mark all paid</button><button class="btn danger" data-del="${s.id}">Delete session</button></div>`:'<p class="note">Tap a name to toggle paid. Admin mode only.</p>'}</div>`:''}</article>`}
function addForm(){if(!S.addOpen)return`<button class="btn primary wide" id="add_open" style="margin-top:16px">＋ Add session</button>`;
 const names=[...new Set(S.doc.sessions.flatMap(s=>s.players))];
 return`<div class="form"><h3>New session</h3><label>Date<input id="f_date" type="date" value="${todayIsoNow()}"></label>
 <div class="lbl">Venue</div><div class="venue">${venueSel('f_venue','')}</div>
 <div class="two"><label>Billed total (kr)<input id="f_billed" inputmode="decimal" placeholder="595"></label><label>Real booking (kr)<input id="f_real" inputmode="decimal" placeholder="455"></label></div>
 <div class="lbl">Players</div><div class="chips" id="f_chips">${names.map(n=>`<button class="chip open adm" data-pick="${H(n)}"><span class="mk">+</span> ${H(n)}</button>`).join('')}</div>
 <label>New players (separate with commas)<input id="f_new" placeholder="Name, Name"></label>
 <div class="actions"><button class="btn primary" id="f_add">Save session</button><button class="btn" id="f_cancel">Cancel</button></div></div>`}
function history(T,admin){return`${admin?addForm():''}<div class="list">${[...S.doc.sessions].reverse().map(s=>card(s,admin)).join('')}</div>${S.doc.sessions.length?'':'<p class="note">No sessions yet.</p>'}`}
function stats(T){const ss=S.doc.sessions,n=ss.length||1,P=PAYER();
 const court$=ss.reduce((a,s)=>a+s.real*TYMoney.othersCount(s,PAYER())/s.players.length,0),mem$=ss.reduce((a,s)=>a+gap(s)*TYMoney.othersCount(s,PAYER())/s.players.length,0),kas$=ss.reduce((a,s)=>a+5*TYMoney.othersCount(s,PAYER()),0);
 return`<div class="tiles four" style="margin-top:16px"><div class="tile"><small>Sessions</small><b>${ss.length}</b></div><div class="tile"><small>Avg players</small><b>${fEn(ss.reduce((a,s)=>a+s.players.length,0)/n)}</b></div><div class="tile"><small>Real court cost</small><b>${kr(T.realCost)}</b></div><div class="tile"><small>Still owed</small><b class="warnc">${kr(T.outstanding)}</b></div></div>
 <h2>Where the money goes</h2><p class="note">Everything charged to the other players, split by purpose.</p>${bar([{v:court$,c:'var(--court)'},{v:mem$,c:'var(--mem)'},{v:kas$,c:'var(--kas)'}],18)}${legend([['var(--court)','Court'],['var(--mem)','Membership'],['var(--kas)','Kas']])}
 <h2>Paid vs still owed per session</h2><div class="rows">${ss.map(s=>{const u=unpaidO(s).length,c=charge(s);return`<div class="srow"><span>${H(s.date)}</span>${bar([{v:(TYMoney.othersCount(s,P)-u)*c,c:'var(--ok)'},{v:u*c,c:'var(--warn)'}],14,true)}<b>${kr((TYMoney.othersCount(s,P)-u)*c)} / ${kr(TYMoney.othersCount(s,P)*c)}</b></div>`}).join('')}</div>${legend([['var(--ok)','Collected'],['var(--warn)','Still owed']])}
 <h2>Cost per person per session</h2><div class="rows">${ss.map(s=>`<div class="srow"><span>${H(s.date)}</span>${bar([{v:court(s),c:'var(--court)'},{v:5,c:'var(--kas)'}],14)}<b>${kr(charge(s))}</b></div>`).join('')}</div>
 <h2>Attendance</h2><div class="rows">${T.attendance.map(a=>`<div class="srow"><span>${H(a.name)}</span>${bar([{v:a.count,c:'var(--teal)'},{v:ss.length-a.count,c:'transparent'}],12)}<b>${a.count}/${ss.length}</b></div>`).join('')}</div>
 <details class="more"><summary>Who played, who paid</summary><div class="scroll"><table class="grid"><thead><tr><th></th>${ss.map(s=>`<th>${H(s.date)}</th>`).join('')}<th>Owes</th></tr></thead><tbody>${T.names.map(nm=>{const o=T.owes.find(x=>x.name===nm);return`<tr><td>${H(nm)}</td>${ss.map(s=>`<td>${!s.players.includes(nm)?'<i class="dot none"></i>':s.paid.includes(nm)?'<i class="dot ok"></i>':'<i class="dot warn"></i>'}</td>`).join('')}<td class="${o?'due':''}">${o?fEn(o.amount):'0'}</td></tr>`}).join('')}</tbody></table></div></details>${legend([['var(--ok)','Paid'],['var(--warn)','Still owed'],['var(--mute)','Did not play']])}`}
function balanceChart(rows){const E=TYMoney.ledgerByDate(rows),n=E.length;if(n<2)return'';
 const bal=E.map(e=>e.balance),mn=Math.min(0,...bal),mx=Math.max(0,...bal),last=bal[n-1];
 const W=320,Hh=120,L=8,R=44,T0=14,B=22,span=(mx-mn)||1,x=i=>L+(W-L-R)*i/(n-1),y=v=>T0+(Hh-T0-B)*(1-(v-mn)/span);
 const pts=E.map((e,i)=>[x(i),y(e.balance)]),line=pts.map((q,i)=>(i?'L':'M')+q[0].toFixed(1)+' '+q[1].toFixed(1)).join(' '),lp=pts[n-1];
 const ticks=E.map((e,i)=>(i===0||i===n-1||n<=6)?`<text x="${x(i).toFixed(1)}" y="${Hh-6}" text-anchor="${i===0?'start':i===n-1?'end':'middle'}" class="ct">${H(e.label)}</text>`:'').join('');
 return`<svg class="chart" viewBox="0 0 ${W} ${Hh}" role="img" aria-label="Balance over time, now ${kr(last)}"><line x1="${L}" x2="${W-R}" y1="${y(0)}" y2="${y(0)}" class="cz"/><path d="${line} L${lp[0].toFixed(1)} ${y(0)} L${pts[0][0].toFixed(1)} ${y(0)} Z" class="ca"/><path d="${line}" class="cl"/>${pts.map(q=>`<circle cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="3" class="cd"/>`).join('')}<text x="${W-R+6}" y="${(lp[1]+4).toFixed(1)}" class="cv">${fEn(last)}</text>${ticks}</svg>`}
function flowBars(rows){const E=TYMoney.ledgerByDate(rows),n=E.length;if(!n)return'';
 const W=320,Hh=180,L=6,R=6,T0=18,B=34,pos=Math.max(0,...E.map(e=>e.in)),neg=Math.max(0,...E.map(e=>e.out)),span=(pos+neg)||1,y0=T0+(Hh-T0-B)*pos/span,k=(Hh-T0-B)/span,slot=(W-L-R)/n,bw=Math.min(28,slot*.62);
 const cols=E.map((e,i)=>{const cx=L+slot*(i+.5),hi=e.in>0?Math.max(2,e.in*k):0,ho=e.out>0?Math.max(2,e.out*k):0;
  return(hi?`<rect x="${(cx-bw/2).toFixed(1)}" y="${(y0-hi).toFixed(1)}" width="${bw.toFixed(1)}" height="${hi.toFixed(1)}" rx="3" class="bi"/><text x="${cx.toFixed(1)}" y="${(y0-hi-4).toFixed(1)}" text-anchor="middle" class="cv2">+${fEn(e.in)}</text>`:'')+(ho?`<rect x="${(cx-bw/2).toFixed(1)}" y="${y0.toFixed(1)}" width="${bw.toFixed(1)}" height="${ho.toFixed(1)}" rx="3" class="bo"/><text x="${cx.toFixed(1)}" y="${(y0+ho+11).toFixed(1)}" text-anchor="middle" class="cv2">−${fEn(e.out)}</text>`:'')+`<text x="${cx.toFixed(1)}" y="${Hh-6}" text-anchor="middle" class="ct">${H(e.label)}</text>`}).join('');
 return`<svg class="chart" viewBox="0 0 ${W} ${Hh}" role="img" aria-label="Money in and out per date"><line x1="${L}" x2="${W-R}" y1="${y0.toFixed(1)}" y2="${y0.toFixed(1)}" class="cz"/>${cols}</svg>${legend([['var(--ok)','Money in'],['var(--red)','Money out']])}`}
function kasGraphs(rows){const D=TYMoney.ledgerSeries(rows);
 return`<h3 class="gh">Kas balance over time</h3>${balanceChart(rows)}<dl class="kv two"><div><dt>Money in</dt><dd>${kr(D.moneyIn)}</dd></div><div><dt>Money out</dt><dd>${kr(D.moneyOut)}</dd></div></dl><h3 class="gh">Money in and out</h3>${flowBars(rows)}`}
function membershipCard(T){const P=TYMoney.membershipProgress(T.membership,S.cfg.membershipTarget);
 return`<div class="hero"><small>🎟️ Membership</small><b>${kr(P.have)} / ${kr(P.target)}</b><div class="sbar" style="height:12px" role="progressbar" aria-valuemin="0" aria-valuemax="${P.target}" aria-valuenow="${P.have}"><div class="bar-track"><i style="width:${P.pct}%;background:var(--mem)"></i></div></div><small>${P.reached?'Target reached 🎉':kr(P.remaining)+' to go'} · ${fEn(P.pct)}%</small></div>`}
function ledger(acct,T,admin){const R=TYMoney.ledgerRows(S.doc,S.cfg,acct),run=R.length?R[R.length-1].run:0; return`${acct==='kas'?'<h3 class="gh">Ledger</h3>':'<h2>🧾 Membership ledger</h2>'}<div class="lrows">${R.map(r=>`<div class="lrow ${admin&&r.manual?'x':''}"><span class="ld">${H(r.d||'-')}</span><span>${H(r.n)}</span><b class="${r.v<0?'neg':'pos'}">${r.v<0?'−':'+'}${kr(Math.abs(r.v))}</b><em>${kr(r.run)}</em>${admin&&r.manual?`<button data-deltx="${r.id}" aria-label="Delete entry">✕</button>`:''}</div>`).join('')}</div>
 <p class="note">${acct==='kas'?'':'Balance: <b>'+kr(run)+'</b>. '}Session rows are automatic. Manual entries come from admin.</p>
 ${admin&&acct==='kas'?(S.txOpen?`<div class="form"><div class="seg"><button data-kind="out" class="${S.txKind!=='in'?'on':''}">Money out</button><button data-kind="in" class="${S.txKind==='in'?'on':''}">Money in</button></div><div class="two"><label>Amount (kr)<input id="x_amt" inputmode="decimal" placeholder="50"></label><label>Date<input id="x_date" type="date" value="${todayIsoNow()}"></label></div><label>Note<input id="x_note" placeholder="e.g. new balls"></label><div class="actions"><button class="btn primary" id="x_add">Add entry</button><button class="btn" id="x_cancel">Cancel</button></div></div>`:`<button class="btn wide" id="x_open">＋ Add transaction</button>`):''}`}
function owed(T){const P=PAYER();
 return`<div class="hero"><small>💵 Still owed to ${H(P)}</small><b>${kr(T.outstanding)}</b>${bar([{v:T.collected,c:'var(--ok)'},{v:T.outstanding,c:'var(--warn)'}],10,true)}<small>${kr(T.collected)} collected of ${kr(T.charged)} charged to others</small></div>
 <h2>Still owed per person</h2>
 <div class="plist">${T.owes.map(o=>`<button class="prow" data-who="${H(o.name)}"><span class="pn">${H(o.name)}<small>${o.dates.join(' + ')}</small></span><b>${kr(o.amount)}</b><i class="chev" aria-hidden="true">›</i></button>`).join('')}</div>${T.owes.length?'<p class="note">Tap a name to pay with Swish.</p>':'<p class="note">Everyone is settled 🎉</p>'}`}
function cash(T,admin){const P=PAYER();
 return`<h2>🏦 Cash</h2><div class="tiles three"><div class="tile"><small>Real</small><b>${kr(T.kasReal)}</b></div><div class="tile"><small>Pending</small><b class="warnc">${kr(T.kasPending)}</b></div><div class="tile"><small>Total later</small><b>${kr(T.kasReal+T.kasPending)}</b></div></div>
 <p class="note">Real = ${S.cfg.kasOpening} opening + ${T.kasPersons} payments × 5${T.kasManual?(T.kasManual>0?' + ':' − ')+fEn(Math.abs(T.kasManual))+' manual':''}. Pending = ${T.kasPending/5} unpaid × 5.</p>
 ${kasGraphs(TYMoney.ledgerRows(S.doc,S.cfg,'kas'))}${ledger('kas',T,admin)}${membershipCard(T)}${ledger('membership',T,admin)}
 <h2>${H(P)}'s cash flow</h2><dl class="kv"><div><dt>Fronted for court</dt><dd>${kr(T.realCost)}</dd></div><div><dt>Received from others</dt><dd>${kr(T.collected)}</dd></div><div><dt>Still out of pocket</dt><dd>${kr(T.realCost-T.collected)}</dd></div></dl>`}
const recapText=(T,lang)=>TYMoney.recapText(S.doc,S.cfg,T,lang,{today:todayLabel(),siteUrl:CFG.siteUrl});
function share(T){const t=recapText(T,S.lang);return`<p class="note" style="margin-top:16px">Builds the recap in your fixed format from the current data. The text includes the page link; members enter the viewer code from the group chat.</p>
 <div class="seg"><button data-lang="id" class="${S.lang==='id'?'on':''}">Bahasa (your format)</button><button data-lang="en" class="${S.lang==='en'?'on':''}">English</button></div>
 <textarea id="sh" class="recap" readonly rows="22">${H(t)}</textarea>
 <div class="actions"><a class="btn primary" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(t)}">Share to WhatsApp</a><button class="btn" id="cp">Copy text</button></div><p class="note" id="cpm">WhatsApp opens with the text ready. You pick the group and press send.</p>`}
async function save(){if(DEMO){S.version=String(BigInt(S.version||'0')+1n);S.doc.version=S.version;localStorage.setItem('ty_demo',JSON.stringify(S.doc));return'ok'}
 return TYSync.save(S,rpc,load);}
let toastTimer=null,alertTimer=null;
function showAlert(msg){let el=document.getElementById('alertbar');if(!el){el=document.createElement('div');el.id='alertbar';el.className='alertbar';el.setAttribute('role','alert');el.onclick=()=>el.remove();document.body.appendChild(el)}else{el.style.animation='none';void el.offsetWidth;el.style.animation=''}el.textContent=msg;clearTimeout(alertTimer);alertTimer=setTimeout(()=>el.remove(),4000)}
// Apply a change, save it, and put the old doc back if it could not be saved.
async function change(next,msg){if(S.saving)return false;S.saving=true;S.toast=null;view();let r,prev;try{({result:r,prev}=await TYEdits.commitChange(S,next,save))}finally{S.saving=false}
 if(r==='ok'&&msg){S.toast={msg,prev};clearTimeout(toastTimer);toastTimer=setTimeout(()=>{S.toast=null;view()},6000)}else S.toast=null;
 view();return r==='ok'}
const todayIsoNow=()=>TYMoney.todayIso(new Date());
const copyText=async(t,btn)=>{try{await navigator.clipboard.writeText(t);if(btn){btn.textContent='Copied';setTimeout(()=>{btn.textContent='Copy number'},1500)}}catch(e){if(btn)btn.textContent=t}};
function sheet(T){const o=S.sheet&&T.owes.find(x=>x.name===S.sheet);if(!o)return'';
 const P=S.cfg.payer,msg='Tennis '+o.name,items=TYMoney.owedBreakdown(S.doc,S.cfg,o.name),link=TYMoney.swishLink(S.cfg.swish,o.amount,msg);
 return`<div class="scrim" id="sheet_bg"><div class="sheet" role="dialog" aria-modal="true" aria-label="${H(o.name)} owes ${kr(o.amount)}"><div class="grab"></div>
 <h3>${H(o.name)}</h3><b class="big">${kr(o.amount)}</b><small>to ${H(P)}</small>
 <ul class="sess">${items.map(i=>`<li><span>${H(i.date)}</span><b>${kr(i.amount)}</b></li>`).join('')}</ul>
 <a class="btn primary wide" href="${H(link)}">Pay with Swish</a>
 <div class="swishrow"><span>📲 ${H(S.cfg.swish)}</span><button class="btn sm" id="cp_swish" data-swish="${H(S.cfg.swish)}">Copy number</button></div>
 <small>Message in Swish: <b>${H(msg)}</b>. Needs the Swish app on the phone.</small>
 <button class="btn wide" id="sheet_x">Close</button></div></div>`}
function toastBar(){return S.toast?`<div class="toast" role="status"><span>${H(S.toast.msg)}</span><button class="linkbtn" id="undo">Undo</button></div>`:''}
async function checkAdmin(c){if(DEMO)return c==='admin';const r=await rpc('check_admin',{p_code:c});return !!r.ok}
function bindGate(){const go=async()=>{const c=$('#code').value;try{const r=await load(c);if(r.error){S.err=r.error==='locked'?'Too many tries. Wait 15 minutes.':'Wrong code.';return view()}S.code=c;localStorage.setItem('ty_code',c);S.doc=r;S.cfg=r.cfg;S.version=r.version;S.err='';view()}catch(e){S.err='No connection.';view()}};$('#go').onclick=go;$('#code').onkeydown=e=>{if(e.key==='Enter')go()}}
function bind(){document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{S.tab=b.dataset.tab;view()});
 $('#th').onclick=()=>{S.theme=S.theme==='dark'?'light':'dark';localStorage.setItem('ty_theme',S.theme);document.documentElement.dataset.theme=S.theme;view()};
 const adm=$('#adm');if(adm)adm.onclick=()=>{if(S.admin){S.admin='';sessionStorage.removeItem('ty_admin')}else{S.asking=true;S.badAdmin=false}view()};
 const ac=$('#adm_code');if(ac){const go=async()=>{const c=ac.value;if(await checkAdmin(c)){S.admin=c;sessionStorage.setItem('ty_admin',c);S.asking=false;S.badAdmin=false;S.err=''}else S.badAdmin=true;view()};$('#adm_go').onclick=go;ac.onkeydown=e=>{if(e.key==='Enter')go()};ac.focus()}
 document.querySelectorAll('[data-open]').forEach(e=>e.onclick=()=>{S.open[e.dataset.open]=!S.open[e.dataset.open];view()});
 document.querySelectorAll('[data-tog]').forEach(e=>e.onclick=()=>{const[id,p]=e.dataset.tog.split('|');const s=S.doc.sessions.find(x=>x.id===id);const was=s.paid.includes(p);change(TYEdits.toggle(S.doc,id,p,PAYER()),p+(was?' marked unpaid':' marked paid'))});
 document.querySelectorAll('[data-fronted]').forEach(e=>e.onclick=()=>{const id=e.dataset.fronted,s=S.doc.sessions.find(x=>x.id===id);const input=prompt('Fronted price for '+s.date+' (kr)',String(s.real));if(input===null)return;const amount=TYMoney.parseAmount(input);if(!(amount>=0)||input.trim()===''){showAlert('Enter a fronted amount of 0 or above.');return}if(amount===s.real)return;const text=s.date+': fronted '+kr(s.real)+' to '+kr(amount)+'\nMembership part '+kr(gap(s))+' to '+kr(s.billed-amount)+'\nPlayers still pay '+kr(charge(s))+' each. Billed stays '+kr(s.billed)+'.';if(!confirm(text))return;change(TYEdits.setReal(S.doc,id,amount),'Fronted price changed')});
 document.querySelectorAll('[data-allpaid]').forEach(e=>e.onclick=()=>change(TYEdits.markAllPaid(S.doc,e.dataset.allpaid),'Everyone marked paid'));
 document.querySelectorAll('[data-del]').forEach(e=>e.onclick=()=>{if(!confirm('Delete this session? It is kept in the audit log.'))return;change(TYEdits.removeSession(S.doc,e.dataset.del),'Session deleted')});
 document.querySelectorAll('[data-deltx]').forEach(e=>e.onclick=()=>{if(!confirm('Remove this entry?'))return;change(TYEdits.removeTx(S.doc,e.dataset.deltx),'Entry removed')});
 document.querySelectorAll('select[data-venue]').forEach(sel=>sel.onchange=async()=>{let v=sel.value;let doc=S.doc;if(v==='__add__'){v=(prompt('Venue name')||'').trim();if(!v){view();return}doc=JSON.parse(JSON.stringify(doc));doc.venues=[...new Set([...(doc.venues||[]),v])]}
  if(sel.id.startsWith('v_')){change(TYEdits.setVenue(doc,sel.id.slice(2),v),v?'Venue set':'Venue cleared')}else{S.fVenue=v;if(sel.value==='__add__'){S.doc=doc;view();$('#f_venue').value=v}}});
 const ao=$('#add_open');if(ao)ao.onclick=()=>{S.addOpen=true;view()};const fc=$('#f_cancel');if(fc)fc.onclick=()=>{S.addOpen=false;view()};
 document.querySelectorAll('[data-pick]').forEach(e=>e.onclick=()=>{const on=e.classList.toggle('paid');e.classList.toggle('open',!on);e.querySelector('.mk').textContent=on?'✓':'+'});
 const fa=$('#f_add');if(fa)fa.onclick=async()=>{const pl=[...document.querySelectorAll('[data-pick].paid')].map(e=>e.dataset.pick).concat($('#f_new').value.split(',').map(x=>x.trim()).filter(Boolean));const b=+$('#f_billed').value,r=$('#f_real').value===''?b:+$('#f_real').value;
  const label=TYMoney.dateToLabel($('#f_date').value);if(!label||!(b>0)||!(r>=0)||new Set(pl).size<2||[...new Set(pl)].filter(x=>x!==PAYER()).length<1){S.err='Need a date, a billed total and at least 2 players.';return view()}
  if(TYMoney.hasDate(S.doc,label)&&!confirm('There is already a session on '+label+'. Add another one?'))return;const vv=$('#f_venue').value;S.err='';S.addOpen=false;change(TYEdits.addSession(S.doc,{id:'s'+Date.now().toString(36),date:label,billed:b,real:r,players:[...new Set(pl)],paid:pl.includes(PAYER())?[PAYER()]:[],venue:(vv&&vv!=='__add__')?vv:undefined}),'Session added '+label)};
 document.querySelectorAll('[data-kind]').forEach(e=>e.onclick=()=>{S.txKind=e.dataset.kind;document.querySelectorAll('[data-kind]').forEach(b=>b.classList.toggle('on',b===e))});
 const xo=$('#x_open');if(xo)xo.onclick=()=>{S.txOpen=true;view()};const xc=$('#x_cancel');if(xc)xc.onclick=()=>{S.txOpen=false;view()};
 const xa=$('#x_add');if(xa)xa.onclick=()=>{const a=TYMoney.parseAmount($('#x_amt').value);if(!(a>0)){const i=$('#x_amt');i.classList.add('bad');i.setAttribute('aria-invalid','true');showAlert('Enter an amount above 0 (e.g. 12,50)');i.focus();return}S.err='';S.txOpen=false;change(TYEdits.addTx(S.doc,{id:'x'+Date.now().toString(36),date:TYMoney.dateToLabel($('#x_date').value)||todayLabel(),account:'kas',kind:S.txKind==='in'?'in':'out',amount:a,note:$('#x_note').value}),'Entry added')};
 document.querySelectorAll('[data-lang]').forEach(e=>e.onclick=()=>{S.lang=e.dataset.lang;view()});
 const cp=$('#cp');if(cp)cp.onclick=async()=>{try{await navigator.clipboard.writeText($('#sh').value);$('#cpm').textContent='Copied'}catch(e){$('#sh').select();$('#cpm').textContent='Select the text and copy it'}}
 document.querySelectorAll('[data-date]').forEach(e=>e.onchange=()=>{const l=TYMoney.dateToLabel(e.value);if(l)change(TYEdits.setDate(S.doc,e.dataset.date,l),'Date changed to '+l)});
 const us=$('#undo');if(us)us.onclick=()=>{const p=S.toast.prev;S.toast=null;clearTimeout(toastTimer);change(p,null)};
 document.querySelectorAll('[data-who]').forEach(e=>e.onclick=()=>{S.sheet=e.dataset.who;view()});const sx=$('#sheet_x');if(sx)sx.onclick=()=>{S.sheet=null;view()};const sb=$('#sheet_bg');if(sb)sb.onclick=ev=>{if(ev.target===sb){S.sheet=null;view()}};const cs=$('#cp_swish');if(cs)cs.onclick=()=>copyText(cs.dataset.swish,cs);
 const fg=$('#forget');if(fg)fg.onclick=()=>{localStorage.removeItem('ty_code');['ty_code','ty_admin'].forEach(k=>sessionStorage.removeItem(k));S.code='';S.admin='';S.doc=null;S.cfg=null;S.err='';view()};
}
(async()=>{if(S.code){try{const r=await load(S.code);if(!r.error){S.doc=r;S.cfg=r.cfg;S.version=r.version}}catch(e){}}view()})();
