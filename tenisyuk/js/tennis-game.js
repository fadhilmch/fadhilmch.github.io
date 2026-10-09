/* Optional local mini-game. No recap data, network requests or admin actions. */
(function(root){
'use strict';
// Rendering and controls stay separate from editable physics/settings.
const {W,H,R,PW,PY,clamp,create,movePaddle,step}=root.TYTennisPhysics;
let dialog=null,raf=0;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
function open(opener){
 if(dialog)return;const oldOverflow=document.body.style.overflow;
 let best=0;try{const v=Number(localStorage.getItem('ty_tennis_best'));best=Number.isFinite(v)&&v>=0?Math.floor(v):0}catch(e){}
 let s=create(),running=false,last=0;
 dialog=document.createElement('dialog');dialog.className='tennis-game';
 dialog.innerHTML='<div class="game-head"><h2><svg class="game-ball-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="10" fill="#c8e64b" stroke="#688518"/><path d="M5 4.9C13 9 13 15 5 19.1M19 4.9C11 9 11 15 19 19.1" fill="none" stroke="#f7ffe0" stroke-width="1.5" stroke-linecap="round"/></svg> Mini tennis</h2><button class="btn sm" data-game-close aria-label="Close mini tennis">✕</button></div><div class="game-score"><span>Rally <b data-rally>0</b></span><span>Best <b data-best>0</b></span></div><canvas width="320" height="400" tabindex="0" aria-label="Mini tennis court. Drag left or right, or use arrow keys to move your racket. Press Space to serve or pause."></canvas><p class="note" data-game-status aria-live="polite">Drag left or right to move your racket. Arrow keys work too.</p><p class="note game-aim">Aim: hit off-center for an angle; swipe the racket to add direction.</p><div class="game-actions"><button class="btn primary" data-game-start>Serve</button><button class="btn" data-game-pause disabled>Pause</button></div>';
 document.body.appendChild(dialog);dialog.showModal();document.body.style.overflow='hidden';
 const canvas=dialog.querySelector('canvas'),c=canvas.getContext('2d'),score=dialog.querySelector('[data-rally]'),bestEl=dialog.querySelector('[data-best]'),start=dialog.querySelector('[data-game-start]'),pause=dialog.querySelector('[data-game-pause]'),status=dialog.querySelector('[data-game-status]');bestEl.textContent=best;
 const dpr=Math.max(1,Math.min(3,window.devicePixelRatio||1));const scale=dpr*Math.max(1,canvas.getBoundingClientRect().width/W);canvas.width=Math.round(W*scale);canvas.height=Math.round(H*scale);c.setTransform(scale,0,0,scale,0,0);
 function draw(){const court=c.createLinearGradient(0,0,W,H);court.addColorStop(0,'#286e4d');court.addColorStop(1,'#194d38');c.fillStyle=court;c.fillRect(0,0,W,H);
 // Quiet court texture and a real net; keep the ball and paddles easy to see.
 c.fillStyle='rgba(255,255,255,.025)';for(let y=0;y<H;y+=16)c.fillRect(0,y,W,1);
 c.fillStyle='rgba(255,255,255,.045)';c.font='700 15px Inter, sans-serif';c.textAlign='center';c.fillText('TENNIS YUK',W/2,70);
 c.strokeStyle='#afc9ad';c.lineWidth=1.5;c.strokeRect(22,16,276,368);c.strokeRect(48,16,224,368);c.strokeRect(48,106,224,188);c.beginPath();c.moveTo(160,106);c.lineTo(160,294);c.stroke();c.save();c.fillStyle='rgba(0,0,0,.10)';c.fillRect(22,200,276,10);c.strokeStyle='rgba(220,232,213,.45)';c.lineWidth=.6;c.beginPath();for(let x=22;x<=298;x+=8){c.moveTo(x,195);c.lineTo(x,204)}for(let y=195;y<=204;y+=3){c.moveTo(22,y);c.lineTo(298,y)}c.stroke();c.strokeStyle='#dce8d5';c.lineWidth=2;c.beginPath();c.moveTo(22,194);c.lineTo(298,194);c.stroke();c.fillStyle='#e2eedb';c.fillRect(19,191,4,16);c.fillRect(297,191,4,16);c.restore();
  function racket(x,y){c.save();c.shadowColor='rgba(0,0,0,.28)';c.shadowBlur=4;c.shadowOffsetY=2;c.fillStyle='#c8e64b';c.beginPath();c.roundRect(x-PW/2,y-5,PW,10,5);c.fill();c.restore();c.fillStyle='rgba(255,255,255,.4)';c.fillRect(x-PW/2+6,y-3,PW-12,1);}
  racket(s.ai,24);racket(s.paddle,PY);c.save();c.shadowColor='rgba(0,0,0,.3)';c.shadowBlur=5;c.shadowOffsetY=2;const ball=c.createRadialGradient(s.x-2,s.y-3,1,s.x,s.y,R);ball.addColorStop(0,'#eefb91');ball.addColorStop(1,'#bddc32');c.fillStyle=ball;c.beginPath();c.arc(s.x,s.y,R,0,Math.PI*2);c.fill();c.restore();c.strokeStyle='#fffce0';c.lineWidth=1;c.save();c.translate(s.x,s.y);c.rotate(s.spin||0);c.beginPath();c.arc(-7,0,8,-1,1);c.stroke();c.beginPath();c.arc(7,0,8,Math.PI-1,Math.PI+1);c.stroke();c.restore();
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
