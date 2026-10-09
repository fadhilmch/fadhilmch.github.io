/* Editable game algorithm, no DOM or network. Browser global + Node exports. */
(function(root){
'use strict';
// Edit these values to tune feel. Speeds use logical court pixels per second.
const SETTINGS={width:320,height:400,ballRadius:7,paddleWidth:64,paddleY:366,
 startSpeed:165,speedPerReturn:6,maxSpeed:260,serveSideSpeed:72,
 aimStrength:5,swipeInfluence:.16,maxSideSpeed:170,maxSwipeSpeed:600,
 swipeDecay:12,opponentSpeed:180,opponentReturnY:34,
 maxFrameSeconds:.025,slowMotionFactor:.65};
const {width:W,height:H,ballRadius:R,paddleWidth:PW,paddleY:PY}=SETTINGS;
const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
function create(){return{x:160,y:320,vx:SETTINGS.serveSideSpeed,vy:-SETTINGS.startSpeed,paddle:160,paddleV:0,ai:160,rally:0,over:false};}
function movePaddle(s,x,dt){const next=clamp(x,PW/2,W-PW/2);s.paddleV=clamp((next-s.paddle)/Math.max(.016,dt||.016),-SETTINGS.maxSwipeSpeed,SETTINGS.maxSwipeSpeed);s.paddle=next;return s;}
// Swap this policy later (e.g. an RL agent). Input is a state snapshot + dt.
// Return a target x for the opponent paddle; physics owns applying limits.
function followBallPolicy(state,dt){return state.x;}
function step(s,dt,slow=false,policy=followBallPolicy){
 if(s.over)return s;dt=clamp(dt,0,SETTINGS.maxFrameSeconds)*(slow?SETTINGS.slowMotionFactor:1);
 const action=policy({...s},dt);const target=Number.isFinite(action)?clamp(action,PW/2,W-PW/2):s.ai;
 s.ai+=clamp(target-s.ai,-SETTINGS.opponentSpeed*dt,SETTINGS.opponentSpeed*dt);s.x+=s.vx*dt;s.y+=s.vy*dt;
 if(s.x<R){s.x=R;s.vx=Math.abs(s.vx)}if(s.x>W-R){s.x=W-R;s.vx=-Math.abs(s.vx)}
 // Rally mode: opponent always returns, even if its drawing is still catching up.
 // To make a beatable opponent later, replace this return with a paddle-hit check.
 if(s.vy<0&&s.y<=SETTINGS.opponentReturnY){s.y=SETTINGS.opponentReturnY;s.vy=Math.abs(s.vy);s.ai=s.x;}
 if(s.vy>0&&s.y+R>=PY&&s.y-R<=PY+10&&Math.abs(s.x-s.paddle)<=PW/2+R){
  s.y=PY-R;s.rally++;s.vx=clamp((s.x-s.paddle)*SETTINGS.aimStrength+s.paddleV*SETTINGS.swipeInfluence,-SETTINGS.maxSideSpeed,SETTINGS.maxSideSpeed);s.vy=-Math.min(SETTINGS.maxSpeed,SETTINGS.startSpeed+s.rally*SETTINGS.speedPerReturn);
 }
 if(s.y>H+R)s.over=true;s.paddleV*=Math.exp(-SETTINGS.swipeDecay*dt);return s;
}
const api={SETTINGS,W,H,R,PW,PY,clamp,create,movePaddle,followBallPolicy,step};
if(typeof module==='object'&&module.exports)module.exports=api;else root.TYTennisPhysics=api;
})(typeof window!=='undefined'?window:globalThis);
