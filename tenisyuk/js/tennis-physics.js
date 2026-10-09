/* Editable game algorithm, no DOM or network. Browser global + Node exports. */
(function(root){
'use strict';
// Edit these values to tune feel. Speeds use logical court pixels per second.
const SETTINGS={width:320,height:400,ballRadius:7,paddleWidth:64,paddleY:366,
 startSpeed:165,speedPerReturn:6,maxSpeed:260,serveSideSpeed:72,
 aimStrength:5,swipeInfluence:.16,maxSideSpeed:170,maxSwipeSpeed:600,
 swipeDecay:12,opponentSpeed:180,opponentReturnY:34,
 courtLeft:48,courtRight:272,difficulty:'normal',gamesToSet:6,tieBreakTo:7,
 spinPerPixel:.018,maxFrameSeconds:.025,slowMotionFactor:.65};
const {width:W,height:H,ballRadius:R,paddleWidth:PW,paddleY:PY}=SETTINGS;
const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
function create(){return{x:160,y:320,vx:SETTINGS.serveSideSpeed,vy:-SETTINGS.startSpeed,paddle:160,paddleV:0,ai:160,rally:0,spin:0,over:false,points:[0,0],games:[0,0],tiebreak:false,setWinner:null,server:0,tieFirst:0,lastHitter:0,event:''};}
function scoreLabels(s){if(s.tiebreak)return s.points.map(String);const [a,b]=s.points;
 if(a>=3&&b>=3){if(a===b)return ['Deuce','Deuce'];return a>b?['AD','40']:['40','AD'];}
 return s.points.map(n=>['0','15','30','40'][Math.min(n,3)]);}
function awardPoint(s,winner,reason){if(s.setWinner!==null)return s;s.over=true;s.event=reason;s.points[winner]++;
 const p=s.points,g=s.games,loser=1-winner;
 const win=s.tiebreak?p[winner]>=SETTINGS.tieBreakTo&&p[winner]-p[loser]>=2:p[winner]>=4&&p[winner]-p[loser]>=2;
 if(win){g[winner]++;p[0]=p[1]=0;s.server=1-s.server;
  if(s.tiebreak||g[winner]>=SETTINGS.gamesToSet&&g[winner]-g[loser]>=2){s.setWinner=winner;s.event+=' · '+(winner===0?'You win the set':'Computer wins the set');}
  else if(g[0]===SETTINGS.gamesToSet&&g[1]===SETTINGS.gamesToSet){s.tiebreak=true;s.tieFirst=s.server;}
 }
 return s;}
function nextPoint(s){if(s.setWinner!==null)return create();const keep={points:[...s.points],games:[...s.games],tiebreak:s.tiebreak,server:s.server,tieFirst:s.tieFirst};
 if(s.tiebreak){const n=s.points[0]+s.points[1];keep.server=n===0?s.tieFirst:(Math.floor((n-1)/2)%2===0?1-s.tieFirst:s.tieFirst);}
 Object.assign(s,create(),keep);s.lastHitter=s.server;
 s.y=s.server===0?320:80;s.vy=s.server===0?-SETTINGS.startSpeed:SETTINGS.startSpeed;s.vx=s.server===0?SETTINGS.serveSideSpeed:-SETTINGS.serveSideSpeed;return s;}
function movePaddle(s,x,dt){const next=clamp(x,PW/2,W-PW/2);s.paddleV=clamp((next-s.paddle)/Math.max(.016,dt||.016),-SETTINGS.maxSwipeSpeed,SETTINGS.maxSwipeSpeed);s.paddle=next;return s;}
// Swap this policy later (e.g. an RL agent). Input is a state snapshot + dt.
// Return a target x for the opponent paddle; physics owns applying limits.
const DIFFICULTY={easy:{speed:95,aimError:25},normal:{speed:140,aimError:12},hard:{speed:210,aimError:3}};
function followBallPolicy(state,dt){const d=DIFFICULTY[SETTINGS.difficulty]||DIFFICULTY.normal;return state.x+Math.sin(state.y*.04+state.rally)*d.aimError;}
function step(s,dt,slow=false,policy=followBallPolicy){
 if(s.over)return s;dt=clamp(dt,0,SETTINGS.maxFrameSeconds)*(slow?SETTINGS.slowMotionFactor:1);
 const action=policy({...s,points:[...s.points],games:[...s.games]},dt);const target=Number.isFinite(action)?clamp(action,PW/2,W-PW/2):s.ai;
 if(!slow)s.spin=(s.spin+Math.hypot(s.vx,s.vy)*SETTINGS.spinPerPixel*dt*(s.vx<0?-1:1))%(Math.PI*2);
 s.ai+=clamp(target-s.ai,-(DIFFICULTY[SETTINGS.difficulty]||DIFFICULTY.normal).speed*dt,(DIFFICULTY[SETTINGS.difficulty]||DIFFICULTY.normal).speed*dt);s.x+=s.vx*dt;s.y+=s.vy*dt;
 // Arcade out rule: crossing a singles sideline loses the point for the last hitter.
 // This is a 2D mini-game, not a bounce/serve-fault simulator.
 if(s.x+R<SETTINGS.courtLeft||s.x-R>SETTINGS.courtRight)return awardPoint(s,1-s.lastHitter,'OUT · '+(s.lastHitter===0?'your shot':'computer shot'));
 if(s.vy<0&&s.y<=SETTINGS.opponentReturnY){
  if(Math.abs(s.x-s.ai)<=PW/2+R){s.y=SETTINGS.opponentReturnY;s.vy=Math.abs(s.vy);s.vx=clamp((s.x-s.ai)*SETTINGS.aimStrength,-SETTINGS.maxSideSpeed,SETTINGS.maxSideSpeed);s.lastHitter=1;}
  else return awardPoint(s,0,'Computer missed');
 }
 if(s.vy>0&&s.y+R>=PY&&s.y-R<=PY+10&&Math.abs(s.x-s.paddle)<=PW/2+R){
  s.y=PY-R;s.rally++;s.lastHitter=0;s.vx=clamp((s.x-s.paddle)*SETTINGS.aimStrength+s.paddleV*SETTINGS.swipeInfluence,-SETTINGS.maxSideSpeed,SETTINGS.maxSideSpeed);s.vy=-Math.min(SETTINGS.maxSpeed,SETTINGS.startSpeed+s.rally*SETTINGS.speedPerReturn);
 }
 if(s.y>H+R)return awardPoint(s,1,'You missed');s.paddleV*=Math.exp(-SETTINGS.swipeDecay*dt);return s;
}
const api={SETTINGS,W,H,R,PW,PY,clamp,create,movePaddle,followBallPolicy,scoreLabels,awardPoint,nextPoint,DIFFICULTY,step};
if(typeof module==='object'&&module.exports)module.exports=api;else root.TYTennisPhysics=api;
})(typeof window!=='undefined'?window:globalThis);
