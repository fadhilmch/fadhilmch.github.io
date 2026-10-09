/* Optional local mini-game. No recap data, network requests or admin actions. */
(function(root){
'use strict';
const W=320,H=400,R=7,PW=64,PY=366;
const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
function create(){return{x:160,y:320,vx:72,vy:-165,paddle:160,paddleV:0,ai:160,rally:0,over:false};}
function movePaddle(s,x,dt){const next=clamp(x,PW/2,W-PW/2);s.paddleV=clamp((next-s.paddle)/Math.max(.016,dt||.016),-600,600);s.paddle=next;return s;}
function step(s,dt,slow=false){
 if(s.over)return s;dt=clamp(dt,0,.025)*(slow?.65:1);
 s.ai+=clamp(s.x-s.ai,-180*dt,180*dt);s.x+=s.vx*dt;s.y+=s.vy*dt;
 if(s.x<R){s.x=R;s.vx=Math.abs(s.vx)}if(s.x>W-R){s.x=W-R;s.vx=-Math.abs(s.vx)}
 // Friendly opponent always returns the ball; the challenge is your next return.
 if(s.vy<0&&s.y<=34){s.y=34;s.vy=Math.abs(s.vy);s.ai=s.x;}
 if(s.vy>0&&s.y+R>=PY&&s.y-R<=PY+10&&Math.abs(s.x-s.paddle)<=PW/2+R){
  s.y=PY-R;s.rally++;s.vx=clamp((s.x-s.paddle)*5+s.paddleV*.16,-170,170);s.vy=-Math.min(260,165+s.rally*6);
 }
 if(s.y>H+R)s.over=true;s.paddleV*=Math.exp(-12*dt);return s;
}
const api={W,H,R,PW,PY,clamp,create,movePaddle,step};
if(typeof module==='object'&&module.exports){module.exports=api;return;}
root.TYTennisGame=api;
let dialog=null,raf=0;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
function open(opener){
 if(dialog)return;const oldOverflow=document.body.style.overflow;
 let best=0;try{const v=Number(localStorage.getItem('ty_tennis_best'));best=Number.isFinite(v)&&v>=0?Math.floor(v):0}catch(e){}
 let s=create(),running=false,last=0;
 dialog=document.createElement('dialog');dialog.className='tennis-game';
 dialog.innerHTML='<div class="game-head"><h2><svg class="game-ball-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="10" fill="#c8e64b" stroke="#688518"/><path d="M5 4.9C13 9 13 15 5 19.1M19 4.9C11 9 11 15 19 19.1" fill="none" stroke="#f7ffe0" stroke-width="1.5" stroke-linecap="round"/></svg> Mini tennis</h2><button class="btn sm" data-game-close aria-label="Close mini tennis">✕</button></div><div class="game-score"><span>Rally <b data-rally>0</b></span><span>Best <b data-best>0</b></span></div><canvas width="320" height="400" tabindex="0" aria-label="Mini tennis court. Drag left or right, or use arrow keys to move your racket. Press Space to serve or pause."></canvas><p class="note" data-game-status aria-live="polite">Drag left or right to move your racket. Arrow keys work too.</p><p class="note game-aim">Aim: hit off-center for an angle; swipe the racket to add direction.</p><div class="game-actions"><button class="btn primary" data-game-start>Serve</button><button class="btn" data-game-pause disabled>Pause</button></div><p class="note game-hint">No payments, just a rally. Best score stays on this device.</p>';
 document.body.appendChild(dialog);dialog.showModal();document.body.style.overflow='hidden';
 const canvas=dialog.querySelector('canvas'),c=canvas.getContext('2d'),score=dialog.querySelector('[data-rally]'),bestEl=dialog.querySelector('[data-best]'),start=dialog.querySelector('[data-game-start]'),pause=dialog.querySelector('[data-game-pause]'),status=dialog.querySelector('[data-game-status]');bestEl.textContent=best;
 function draw(){c.fillStyle='#246346';c.fillRect(0,0,W,H);c.strokeStyle='#afc9ad';c.lineWidth=1.5;c.strokeRect(22,16,276,368);c.strokeRect(48,16,224,368);c.strokeRect(48,106,224,188);c.beginPath();c.moveTo(160,106);c.lineTo(160,294);c.stroke();c.strokeStyle='#dce8d5';c.setLineDash([3,4]);c.beginPath();c.moveTo(22,200);c.lineTo(298,200);c.stroke();c.setLineDash([]);
  function racket(x,y){c.fillStyle='#c8e64b';c.beginPath();c.roundRect(x-PW/2,y-5,PW,10,5);c.fill();}
  racket(s.ai,24);racket(s.paddle,PY);c.fillStyle='#d3ed50';c.beginPath();c.arc(s.x,s.y,R,0,Math.PI*2);c.fill();c.strokeStyle='#fffce0';c.lineWidth=1;c.beginPath();c.arc(s.x-7,s.y,8,-1,1);c.stroke();
 }
 function saveBest(){if(s.rally>best){best=s.rally;bestEl.textContent=best;try{localStorage.setItem('ty_tennis_best',String(best))}catch(e){}}}
 function stop(message){start.disabled=false;running=false;cancelAnimationFrame(raf);raf=0;pause.disabled=true;start.textContent=s.over?'Play again':'Resume';status.textContent=message;}
 function frame(t){if(!running)return;step(s,last?(t-last)/1000:0,reduced.matches);last=t;score.textContent=s.rally;saveBest();draw();if(s.over){stop('Rally over. Play again?');return}raf=requestAnimationFrame(frame);}
 function serve(){if(running)return;if(s.over)s=create();running=true;last=0;start.textContent='Playing';start.disabled=true;pause.disabled=false;status.textContent=reduced.matches?'Slower play is on. Drag to return the ball.':'Keep the ball in play. Drag to return it.';canvas.focus();raf=requestAnimationFrame(frame);}
 start.onclick=serve;pause.onclick=()=>stop('Paused. Resume when ready.');
 let lastMove=0;
 function move(ev){const b=canvas.getBoundingClientRect(),now=performance.now();movePaddle(s,(ev.clientX-b.left)*W/b.width,(now-lastMove)/1000);lastMove=now;if(!running)draw();}
 canvas.onpointerdown=ev=>{canvas.setPointerCapture(ev.pointerId);lastMove=performance.now()-16;move(ev);canvas.focus()};canvas.onpointermove=ev=>{if(canvas.hasPointerCapture(ev.pointerId))move(ev)};
 canvas.onkeydown=ev=>{if(ev.key==='ArrowLeft'||ev.key==='ArrowRight'){ev.preventDefault();movePaddle(s,s.paddle+(ev.key==='ArrowLeft'?-18:18),.06);if(!running)draw()}else if(ev.code==='Space'){ev.preventDefault();running?stop('Paused. Resume when ready.'):serve()}};
 function visibility(){if(document.hidden&&running)stop('Paused while away. Resume when ready.')}
 document.addEventListener('visibilitychange',visibility);
 function close(){cancelAnimationFrame(raf);running=false;document.removeEventListener('visibilitychange',visibility);dialog.close();dialog.remove();dialog=null;document.body.style.overflow=oldOverflow;if(opener.isConnected)opener.focus()}
 dialog.querySelector('[data-game-close]').onclick=close;dialog.oncancel=ev=>{ev.preventDefault();close()};dialog.onclick=ev=>{if(ev.target===dialog){const b=dialog.getBoundingClientRect();if(ev.clientX<b.left||ev.clientX>b.right||ev.clientY<b.top||ev.clientY>b.bottom)close()}};draw();start.focus();
}
document.addEventListener('click',ev=>{const b=ev.target.closest('[data-tennis-game]');if(b)open(b)});
})(typeof window!=='undefined'?window:globalThis);
