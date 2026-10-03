const CFG=window.TY||{};const DEMO=!CFG.url;const $=s=>document.querySelector(s);
const H=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const{fEn,fId,kr,charge,court,gap,MONTHS}=TYMoney;
const S={code:sessionStorage.getItem('ty_code')||'',admin:sessionStorage.getItem('ty_admin')||'',doc:null,cfg:null,tab:'history',open:{},err:'',asking:false,addOpen:false,lang:'id',venueAdd:false,theme:localStorage.getItem('ty_theme')||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light')};
document.documentElement.dataset.theme=S.theme;
const demoDoc=()=>JSON.parse(localStorage.getItem('ty_demo')||'null')||{sessions:[
{id:'s11',date:'11 Sep',billed:900,real:900,venue:'',players:['Fadel','Aldo','HS Putra','Sabrina','Alif Harfian','Dedy','Qiang','Naufal'],paid:['Fadel','Aldo','HS Putra','Sabrina','Alif Harfian']},
{id:'s18',date:'18 Sep',billed:900,real:724,venue:'',players:['Fadel','Aldo','HS Putra','Sabrina','Alif Harfian','Dartagnan','Suci','Assevitto'],paid:['Fadel','Aldo','HS Putra','Sabrina','Alif Harfian','Dartagnan','Suci','Assevitto']},
{id:'s25',date:'25 Sep',billed:595,real:455,venue:'',players:['Fadel','HS Putra','Alif Harfian','Suci','Assevitto','Dartagnan','Aldo'],paid:['Fadel','Aldo']}],tx:[],venues:[]};
const demoCfg={payer:'Fadel',swish:'072-160 66 41',kasOpening:125,membershipTarget:700};
async function rpc(fn,args){const r=await fetch(CFG.url+'/rest/v1/rpc/'+fn,{method:'POST',headers:Object.assign({apikey:CFG.anonKey,'Content-Type':'application/json'},CFG.anonKey.startsWith('eyJ')?{Authorization:'Bearer '+CFG.anonKey}:{}),body:JSON.stringify(args)});if(!r.ok)throw new Error('network');return r.json()}
async function load(code){
 if(DEMO){if(code!=='demo')return{error:'wrong_code'};const d=demoDoc();return{...d,cfg:demoCfg}}
 return rpc('get_recap',{p_code:code})}
// ---- helpers ----
const PAYER=()=>S.cfg.payer;
const unpaidO=s=>TYMoney.unpaidOthers(s,PAYER());
const todayLabel=()=>{const p=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Stockholm',day:'numeric',month:'numeric'}).formatToParts(new Date());return Number(p.find(x=>x.type==='day').value)+' '+MONTHS[Number(p.find(x=>x.type==='month').value)-1]};
const VENUES=[['Sundbyberg',['Sundbybergs Rackethall']],['Solna',['Solna Tenniscenter','Bergshamra IP (Solna Tenniscenter outdoor)']],['Sollentuna',['Edsbergs Tennishall','Sollentuna Rackethall']],['Stockholm',['Stockholms Tennishall','Kungl. Tennishallen','Salkhallen (SALK)','Eriksdals tennisbanor (Hellas TK)','Hellasgårdens tennisbanor (Hellas TK)','Tennisstadion','Frescati Sports Center','Fredhällsparkens tennisplan']]];
const venueSel=(id,val)=>{const known=VENUES.flatMap(g=>g[1]);const extra=[...new Set([...(S.doc.venues||[]),...(val&&!known.includes(val)?[val]:[])])].filter(v=>!known.includes(v));
 return`<select id="${id}" data-venue><option value="">No venue</option>${VENUES.map(g=>`<optgroup label="${g[0]}">${g[1].map(v=>`<option${v===val?' selected':''}>${H(v)}</option>`).join('')}</optgroup>`).join('')}${extra.length?`<optgroup label="Added by you">${extra.map(v=>`<option${v===val?' selected':''}>${H(v)}</option>`).join('')}</optgroup>`:''}<option value="__add__">＋ Add new venue…</option></select>`};
const bar=(parts,h=12)=>{const t=parts.reduce((a,p)=>a+p.v,0)||1;return`<div class="sbar" style="height:${h}px">${parts.filter(p=>p.v>0).map(p=>`<i style="width:${p.v/t*100}%;background:${p.c}"></i>`).join('')}</div>`};
const legend=i=>`<div class="legend">${i.map(x=>`<span><b style="background:${x[0]}"></b>${x[1]}</span>`).join('')}</div>`;
function status(s){const u=unpaidO(s),o=s.players.length-1;return u.length?`<span class="pill warn">${o-u.length}/${o} paid</span>`:'<span class="pill ok">All paid</span>'}
const totals=()=>TYMoney.totals(S.doc,S.cfg);
// ---- views ----
function view(){const root=$('#app');if(!S.doc){root.innerHTML=gate();bindGate();return}
 const T=totals(),admin=!!S.admin,ss=S.doc.sessions;
 const tabs=[['history','Sessions'],['stats','Stats'],['cash','Cash'],['share','Share']];
 const adm=admin?`<div class="adminbar on">🔓<span class="hide-s"> Admin mode</span> <button class="btn sm" id="adm">Lock</button></div>`:S.asking?`<div class="adminbar"><input id="adm_code" type="password" placeholder="Admin code" aria-label="Admin code" autofocus><button class="btn primary sm" id="adm_go">Unlock</button><small class="${S.badAdmin?'badc':''}">${S.badAdmin?'Wrong code':''}</small></div>`:`<div class="adminbar"><button class="btn sm" id="adm">🔒 Admin</button></div>`;
 root.innerHTML=`<header class="sitebar"><div class="brand"><img class="wm wm-l" src="${TY_WM.light}" alt="tennis yuk"><img class="wm wm-d" src="${TY_WM.dark}" alt=""></div>
 <nav class="tabs">${tabs.map(([k,l])=>`<button data-tab="${k}" class="${S.tab===k?'on':''}">${l}</button>`).join('')}</nav>
 <div class="tools">${adm}<button class="btn sm" id="th">${S.theme==='dark'?'☀️':'🌙'}<span class="hide-s"> ${S.theme==='dark'?'Light':'Dark'}</span></button></div></header>
 <div class="summary"><div><small>Sessions</small><b>${ss.length}</b></div><div><small>Open</small><b class="warnc">${kr(T.outstanding)}</b></div><div><small>Kas</small><b>${kr(T.kasReal)}</b></div><small class="upd">Updated ${todayLabel()}${DEMO?' · demo data':''}</small></div>
 ${S.err?`<div class="err">${H(S.err)}</div>`:''}
 <section>${S.tab==='history'?history(T,admin):S.tab==='stats'?stats(T):S.tab==='cash'?cash(T,admin):share(T)}</section>`;bind()}
function gate(){return`<div class="gate"><div class="gatebox"><div class="brand"><img class="wm wm-l" src="${TY_WM.light}" alt="tennis yuk"><img class="wm wm-d" src="${TY_WM.dark}" alt=""></div><p>Enter the viewer code from the group chat.</p><input id="code" type="password" placeholder="Viewer code" aria-label="Viewer code" autofocus><button class="btn primary" id="go">Open</button><small class="${S.err?'badc':''}" id="gerr">${S.err?H(S.err):(DEMO?'Demo mode: code demo (admin: admin)':'')}</small></div></div>`}
function card(s,admin){const o=!!S.open[s.id],u=unpaidO(s),others=s.players.length-1,P=PAYER(),ch=charge(s);
 const pn=others-u.length;
 return`<article class="card"><button class="card-head" data-open="${s.id}" aria-expanded="${o}"><span class="cal">📅</span><span class="ch-main"><b>${H(s.date)}</b><small>${s.venue?'📍 '+H(s.venue)+' · ':''}${s.players.length} players · ${fEn(ch)} kr each</small></span>${status(s)}<span class="chev">${o?'▴':'▾'}</span></button>
 ${bar([{v:pn,c:'var(--ok)'},{v:u.length,c:'var(--warn)'}],6)}
 ${o?`<div class="card-body"><dl class="kv">
 <div><dt>Venue</dt><dd>${admin?`<div class="venue" style="min-width:190px">${venueSel('v_'+s.id,s.venue||'')}</div>`:(s.venue?H(s.venue):'<span class="muted">not set</span>')}</dd></div>
 <div><dt>Billed</dt><dd>${kr(s.billed)}</dd></div><div><dt>Real booking (${H(P)} fronted)</dt><dd>${kr(s.real)}</dd></div>
 <div><dt>Per person</dt><dd>${fEn(court(s))} + 5 kas = ${kr(ch)}</dd></div><div><dt>To membership</dt><dd>${kr(gap(s))}</dd></div><div><dt>Open amount</dt><dd>${kr(u.length*ch)}</dd></div></dl>
 <div class="chips">${s.players.map(p=>{const pd=s.paid.includes(p),can=admin&&p!==P;return`<button class="chip ${pd?'paid':'open'} ${can?'adm':''}" ${can?`data-tog="${s.id}|${H(p)}"`:'disabled'}>${pd?'✅':'⏳'} ${H(p)}${pd?'':' '+fEn(ch)}</button>`}).join('')}</div>
 ${admin?`<div class="actions"><button class="btn" data-allpaid="${s.id}">Mark all paid</button><button class="btn danger" data-del="${s.id}">Delete session</button></div>`:'<p class="note">Tap a name to toggle paid. Admin mode only.</p>'}</div>`:''}</article>`}
function addForm(){if(!S.addOpen)return`<button class="btn primary wide" id="add_open" style="margin-top:16px">＋ Add session</button>`;
 const names=[...new Set(S.doc.sessions.flatMap(s=>s.players))];
 return`<div class="form"><h3>New session</h3><label>Date<input id="f_date" placeholder="2 Oct"></label>
 <div class="lbl">Venue</div><div class="venue">${venueSel('f_venue','')}</div>
 <div class="two"><label>Billed total (kr)<input id="f_billed" inputmode="decimal" placeholder="595"></label><label>Real booking (kr)<input id="f_real" inputmode="decimal" placeholder="455"></label></div>
 <div class="lbl">Players</div><div class="chips" id="f_chips">${names.map(n=>`<button class="chip ${n===PAYER()?'paid':'open'} adm" data-pick="${H(n)}">${n===PAYER()?'✓':'+'} ${H(n)}</button>`).join('')}</div>
 <div class="two"><label>New names (comma separated)<input id="f_new" placeholder="Name"></label><span></span></div>
 <div class="actions"><button class="btn primary" id="f_add">Save session</button><button class="btn" id="f_cancel">Cancel</button></div></div>`}
function history(T,admin){return`${admin?addForm():''}<div class="list">${[...S.doc.sessions].reverse().map(s=>card(s,admin)).join('')}</div>${S.doc.sessions.length?'':'<p class="note">No sessions yet.</p>'}`}
function stats(T){const ss=S.doc.sessions,n=ss.length||1,P=PAYER();
 const court$=ss.reduce((a,s)=>a+s.real*(s.players.length-1)/s.players.length,0),mem$=ss.reduce((a,s)=>a+gap(s)*(s.players.length-1)/s.players.length,0),kas$=ss.reduce((a,s)=>a+5*(s.players.length-1),0);
 return`<div class="tiles four" style="margin-top:16px"><div class="tile"><small>Sessions</small><b>${ss.length}</b></div><div class="tile"><small>Avg players</small><b>${fEn(ss.reduce((a,s)=>a+s.players.length,0)/n)}</b></div><div class="tile"><small>Real court cost</small><b>${kr(T.realCost)}</b></div><div class="tile"><small>Still open</small><b class="warnc">${kr(T.outstanding)}</b></div></div>
 <h2>Where the money goes</h2><p class="note">Everything charged to the other players, split by purpose.</p>${bar([{v:court$,c:'var(--court)'},{v:mem$,c:'var(--mem)'},{v:kas$,c:'var(--kas)'}],18)}${legend([['var(--court)','Court'],['var(--mem)','Membership'],['var(--kas)','Kas']])}
 <h2>Paid vs open per session</h2><div class="rows">${ss.map(s=>{const u=unpaidO(s).length,c=charge(s);return`<div class="srow"><span>${H(s.date)}</span>${bar([{v:(s.players.length-1-u)*c,c:'var(--ok)'},{v:u*c,c:'var(--warn)'}],14)}<b>${kr((s.players.length-1-u)*c)} / ${kr((s.players.length-1)*c)}</b></div>`}).join('')}</div>${legend([['var(--ok)','Collected'],['var(--warn)','Open']])}
 <h2>Cost per person per session</h2><div class="rows">${ss.map(s=>`<div class="srow"><span>${H(s.date)}</span>${bar([{v:court(s),c:'var(--court)'},{v:5,c:'var(--kas)'}],14)}<b>${kr(charge(s))}</b></div>`).join('')}</div>
 <h2>Attendance</h2><div class="rows">${T.attendance.map(a=>`<div class="srow"><span>${H(a.name)}</span>${bar([{v:a.count,c:a.count===ss.length?'var(--teal)':'var(--mute)'},{v:ss.length-a.count,c:'transparent'}],12)}<b>${a.count}/${ss.length}</b></div>`).join('')}</div>
 <h2>Who played, who paid</h2><div class="scroll"><table class="grid"><thead><tr><th></th>${ss.map(s=>`<th>${H(s.date)}</th>`).join('')}<th>Owes</th></tr></thead><tbody>${T.names.map(nm=>{const o=T.owes.find(x=>x.name===nm);return`<tr><td>${H(nm)}</td>${ss.map(s=>`<td>${!s.players.includes(nm)?'<i class="dot none"></i>':s.paid.includes(nm)?'<i class="dot ok"></i>':'<i class="dot warn"></i>'}</td>`).join('')}<td class="${o?'due':''}">${o?fEn(o.amount):'0'}</td></tr>`}).join('')}</tbody></table></div>${legend([['var(--ok)','Paid'],['var(--warn)','Open'],['var(--mute)','Did not play']])}`}
function ledger(acct,T,admin){const d=S.doc,rows=[];
 if(acct==='kas')rows.push({d:'',n:'Opening balance',v:S.cfg.kasOpening});
 d.sessions.forEach(s=>{if(acct==='kas'){const k=s.paid.filter(p=>s.players.includes(p)).length;if(k)rows.push({d:s.date,n:k+(k===1?' player':' players')+' paid × 5',v:k*5})}else if(gap(s)>0)rows.push({d:s.date,n:'Gap '+fEn(s.billed)+' − '+fEn(s.real),v:gap(s)})});
 d.tx.filter(t=>t.account===acct).forEach(t=>rows.push({id:t.id,d:t.date,n:t.note||(t.kind==='in'?'Money in':'Money out'),v:(t.kind==='in'?1:-1)*t.amount,manual:1}));
 let run=0;const R=rows.map(r=>{run+=r.v;return{...r,run}});
 return`<h2>🧾 ${acct==='kas'?'Kas':'Membership'} ledger</h2><div class="lrows">${R.map(r=>`<div class="lrow ${admin&&r.manual?'x':''}"><span class="ld">${H(r.d||'-')}</span><span>${H(r.n)}</span><b class="${r.v<0?'neg':'pos'}">${r.v<0?'−':'+'}${kr(Math.abs(r.v))}</b><em>${kr(r.run)}</em>${admin&&r.manual?`<button data-deltx="${r.id}" aria-label="Delete entry">✕</button>`:''}</div>`).join('')}</div>
 <p class="note">Balance: <b>${kr(run)}</b>. Session rows are automatic. Manual entries come from admin.</p>
 ${admin&&acct==='kas'?(S.txOpen?`<div class="form"><div class="seg"><button data-kind="out" class="${S.txKind!=='in'?'on':''}">Money out</button><button data-kind="in" class="${S.txKind==='in'?'on':''}">Money in</button></div><div class="two"><label>Amount (kr)<input id="x_amt" inputmode="decimal" placeholder="50"></label><label>Date<input id="x_date" placeholder="${todayLabel()}"></label></div><label>Note<input id="x_note" placeholder="e.g. new balls"></label><div class="actions"><button class="btn primary" id="x_add">Add entry</button><button class="btn" id="x_cancel">Cancel</button></div></div>`:`<button class="btn wide" id="x_open">＋ Add transaction</button>`):''}`}
function cash(T,admin){const P=PAYER();
 return`<div class="hero"><small>💵 Still to come in to ${H(P)}</small><b>${kr(T.outstanding)}</b>${bar([{v:T.collected,c:'var(--ok)'},{v:T.outstanding,c:'var(--warn)'}],10)}<small>${kr(T.collected)} collected of ${kr(T.charged)} charged to others</small></div>
 <div class="rows">${T.owes.map(o=>`<div class="srow"><span>${H(o.name)}<small>${o.dates.join(' + ')}</small></span>${bar([{v:o.amount,c:'var(--warn)'},{v:Math.max(0,250-o.amount),c:'transparent'}],10)}<b>${kr(o.amount)}</b></div>`).join('')}</div>${T.owes.length?'':'<p class="note">Everyone is settled 🎉</p>'}
 <h2>🏦 Ball cash (kas)</h2><div class="tiles three"><div class="tile"><small>Real</small><b>${kr(T.kasReal)}</b></div><div class="tile"><small>Pending</small><b class="warnc">${kr(T.kasPending)}</b></div><div class="tile"><small>Total later</small><b>${kr(T.kasReal+T.kasPending)}</b></div></div>
 <p class="note">Real = ${S.cfg.kasOpening} opening + ${T.kasPersons} payments × 5${T.kasManual?(T.kasManual>0?' + ':' − ')+fEn(Math.abs(T.kasManual))+' manual':''}. Pending = ${T.kasPending/5} unpaid × 5.</p>
 ${ledger('kas',T,admin)}${ledger('membership',T,admin)}
 <h2>${H(P)}'s cash flow</h2><dl class="kv"><div><dt>Fronted for court</dt><dd>${kr(T.realCost)}</dd></div><div><dt>Received from others</dt><dd>${kr(T.collected)}</dd></div><div><dt>Still out of pocket</dt><dd>${kr(T.realCost-T.collected)}</dd></div></dl>
 <p class="note">📲 Swish to ${H(P)}: <b>${H(S.cfg.swish)}</b></p>`}
const recapText=(T,lang)=>TYMoney.recapText(S.doc,S.cfg,T,lang,{today:todayLabel(),siteUrl:CFG.siteUrl});
function share(T){const t=recapText(T,S.lang);return`<p class="note" style="margin-top:16px">Builds the recap in your fixed format from the current data. The text includes the page link; members enter the viewer code from the group chat.</p>
 <div class="seg"><button data-lang="id" class="${S.lang==='id'?'on':''}">Bahasa (your format)</button><button data-lang="en" class="${S.lang==='en'?'on':''}">English</button></div>
 <textarea id="sh" class="recap" readonly rows="22">${H(t)}</textarea>
 <div class="actions"><a class="btn primary" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(t)}">Share to WhatsApp</a><button class="btn" id="cp">Copy text</button></div><p class="note" id="cpm">WhatsApp opens with the text ready. You pick the group and press send.</p>`}
async function save(){if(DEMO){localStorage.setItem('ty_demo',JSON.stringify(S.doc));return true}
 try{const r=await rpc('admin_save',{p_code:S.admin,p_doc:S.doc});if(r.error){S.err=r.error==='too_many_removals'?'Only one removal per save.':'Not saved: '+r.error;S.doc=(await load(S.code));S.cfg=S.doc.cfg;return false}S.err='';return true}catch(e){S.err='Not saved (no connection).';return false}}
async function checkAdmin(c){if(DEMO)return c==='admin';const r=await rpc('check_admin',{p_code:c});return !!r.ok}
function bindGate(){const go=async()=>{const c=$('#code').value;try{const r=await load(c);if(r.error){S.err=r.error==='locked'?'Too many tries. Wait 15 minutes.':'Wrong code.';return view()}S.code=c;sessionStorage.setItem('ty_code',c);S.doc=r;S.cfg=r.cfg;S.err='';view()}catch(e){S.err='No connection.';view()}};$('#go').onclick=go;$('#code').onkeydown=e=>{if(e.key==='Enter')go()}}
function bind(){document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{S.tab=b.dataset.tab;view()});
 $('#th').onclick=()=>{S.theme=S.theme==='dark'?'light':'dark';localStorage.setItem('ty_theme',S.theme);document.documentElement.dataset.theme=S.theme;view()};
 const adm=$('#adm');if(adm)adm.onclick=()=>{if(S.admin){S.admin='';sessionStorage.removeItem('ty_admin')}else{S.asking=true;S.badAdmin=false}view()};
 const ac=$('#adm_code');if(ac){const go=async()=>{const c=ac.value;if(await checkAdmin(c)){S.admin=c;sessionStorage.setItem('ty_admin',c);S.asking=false;S.badAdmin=false;S.err=''}else S.badAdmin=true;view()};$('#adm_go').onclick=go;ac.onkeydown=e=>{if(e.key==='Enter')go()};ac.focus()}
 document.querySelectorAll('[data-open]').forEach(e=>e.onclick=()=>{S.open[e.dataset.open]=!S.open[e.dataset.open];view()});
 document.querySelectorAll('[data-tog]').forEach(e=>e.onclick=async()=>{const[id,p]=e.dataset.tog.split('|');const s=S.doc.sessions.find(x=>x.id===id);s.paid=s.paid.includes(p)?s.paid.filter(x=>x!==p):[...s.paid,p];await save();view()});
 document.querySelectorAll('[data-allpaid]').forEach(e=>e.onclick=async()=>{const s=S.doc.sessions.find(x=>x.id===e.dataset.allpaid);s.paid=[...s.players];await save();view()});
 document.querySelectorAll('[data-del]').forEach(e=>e.onclick=async()=>{if(!confirm('Delete this session? It is kept in the audit log.'))return;S.doc.sessions=S.doc.sessions.filter(x=>x.id!==e.dataset.del);await save();view()});
 document.querySelectorAll('[data-deltx]').forEach(e=>e.onclick=async()=>{if(!confirm('Remove this entry?'))return;S.doc.tx=S.doc.tx.filter(x=>x.id!==e.dataset.deltx);await save();view()});
 document.querySelectorAll('select[data-venue]').forEach(sel=>sel.onchange=async()=>{let v=sel.value;if(v==='__add__'){v=(prompt('Venue name')||'').trim();if(!v){view();return}S.doc.venues=[...new Set([...(S.doc.venues||[]),v])]}
  if(sel.id.startsWith('v_')){const s=S.doc.sessions.find(x=>x.id===sel.id.slice(2));s.venue=v||undefined;await save();view()}else{S.fVenue=v;if(sel.value==='__add__'){view();$('#f_venue').value=v}}});
 const ao=$('#add_open');if(ao)ao.onclick=()=>{S.addOpen=true;view()};const fc=$('#f_cancel');if(fc)fc.onclick=()=>{S.addOpen=false;view()};
 document.querySelectorAll('[data-pick]').forEach(e=>e.onclick=()=>{if(e.dataset.pick===PAYER())return;const on=e.classList.toggle('paid');e.classList.toggle('open',!on);e.firstChild.textContent=(on?'✓':'+')+' '});
 const fa=$('#f_add');if(fa)fa.onclick=async()=>{const pl=[...document.querySelectorAll('[data-pick].paid')].map(e=>e.dataset.pick).concat($('#f_new').value.split(',').map(x=>x.trim()).filter(Boolean));const b=+$('#f_billed').value,r=$('#f_real').value===''?b:+$('#f_real').value;
  if(!$('#f_date').value||!(b>0)||new Set(pl).size<2){S.err='Need a date, a billed total and at least 2 players.';return view()}
  const vv=$('#f_venue').value;S.doc.sessions.push({id:'s'+Date.now().toString(36),date:$('#f_date').value.trim(),billed:b,real:r,players:[...new Set(pl)],paid:[PAYER()],venue:(vv&&vv!=='__add__')?vv:undefined});S.err='';S.addOpen=false;await save();view()};
 document.querySelectorAll('[data-kind]').forEach(e=>e.onclick=()=>{S.txKind=e.dataset.kind;view()});
 const xo=$('#x_open');if(xo)xo.onclick=()=>{S.txOpen=true;view()};const xc=$('#x_cancel');if(xc)xc.onclick=()=>{S.txOpen=false;view()};
 const xa=$('#x_add');if(xa)xa.onclick=async()=>{const a=+$('#x_amt').value;if(!(a>0)){S.err='Need an amount.';return view()}S.doc.tx.push({id:'x'+Date.now().toString(36),date:$('#x_date').value.trim()||todayLabel(),account:'kas',kind:S.txKind==='in'?'in':'out',amount:a,note:$('#x_note').value});S.err='';S.txOpen=false;await save();view()};
 document.querySelectorAll('[data-lang]').forEach(e=>e.onclick=()=>{S.lang=e.dataset.lang;view()});
 const cp=$('#cp');if(cp)cp.onclick=async()=>{try{await navigator.clipboard.writeText($('#sh').value);$('#cpm').textContent='Copied'}catch(e){$('#sh').select();$('#cpm').textContent='Select the text and copy it'}}}
(async()=>{if(S.code){try{const r=await load(S.code);if(!r.error){S.doc=r;S.cfg=r.cfg}}catch(e){}}view()})();
