// Piano Jump: play the right note on a real piano to jump the egg across the staff.
// Data: songs.json · Look: style.css · Shared: ../shared/{music,audio,pwa,midi}.js
import SONGS from "./songs.json";
import { toMidi, stepOf, isSharp as sharpOf, noteName } from "../shared/music.js";
import { unlockAudio as audio, tone as playTone } from "../shared/audio.js";
import { registerServiceWorker, setupInstallButton, keepAwake, releaseWake } from "../shared/pwa.js";
import { connectMidi, connectBluetoothMidi, keyboardNotes } from "../shared/midi.js";
import { parseLibraryText, loadStored, saveStored, clearStored } from "./library.js";

// ================= Music helpers =================
const label=m=>noteName(m,opts.names);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function fingerFor(midi,explicit){
  const right=midi>=60,st=stepOf(midi);
  const f=explicit||(right?st+1:-2-st);   // RH: C4=1..G4=5 · LH: C3=5..G3=1
  return {hand:right?"R":"L",finger:clamp(f,1,5)};
}

// ================= Settings =================
const opts={tempo:.75,names:"letters",clock:"on",oct:"exact",sfx:"on",song:"humpty"};
try{Object.assign(opts,JSON.parse(localStorage.getItem("pianojump")||"{}"));}catch(e){}
const saveOpts=()=>{try{localStorage.setItem("pianojump",JSON.stringify(opts));}catch(e){}};
const $=id=>document.getElementById(id);
const sel={oTempo:"tempo",oNames:"names",oClock:"clock",oOct:"oct",oSfx:"sfx"};
for(const [id,k] of Object.entries(sel)){$(id).value=String(opts[k]);if($(id).selectedIndex<0)$(id).selectedIndex=1;
  $(id).onchange=e=>{opts[k]=k==="tempo"?+e.target.value:e.target.value;saveOpts();};}
let ALL=[...SONGS,...loadStored()];   // built-in songs + library imported on this device
const esc=t=>String(t).replace(/[&<>"']/g,c=>"&#"+c.charCodeAt(0)+";");   // library text is untrusted
function renderSongs(){
  if(!ALL.some(s=>s.id===opts.song))opts.song=ALL[0].id;
  $("songList").innerHTML=ALL.map(s=>`<div><input type="radio" name="song" id="s_${s.id}" value="${s.id}" ${s.id===opts.song?"checked":""}><label for="s_${s.id}">${esc(s.title)}<small>${esc(s.info)}</small></label></div>`).join("");
  document.querySelectorAll('input[name=song]').forEach(r=>r.onchange=()=>{opts.song=r.value;saveOpts();});
}
renderSongs();

// ================= Keep the screen on, install as app =================
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&state!=="menu")keepAwake();});
setupInstallButton($("btnInstall"));
registerServiceWorker();

// ================= Sound effects =================
const tone=(...a)=>{if(opts.sfx==="on")playTone(...a);};
const sfx={
  star(){tone(1319,.12,"sine",.08);tone(1568,.18,"sine",.08,.07);},
  clock(){[880,1109,1319,1760].forEach((f,i)=>tone(f,.12,"square",.04,i*.06));},
  fall(){tone(500,.7,"sawtooth",.05,0,90);},
  win(){[523,659,784,1047,784,1047].forEach((f,i)=>tone(f,.22,"triangle",.1,i*.12));}
};

// ================= Canvas & geometry =================
const cv=$("cv"),ctx=cv.getContext("2d");
let W=0,H=0,S=10,CY=0,dpr=1,BAND=0;
function resize(){
  const w=$("stage").clientWidth,full=matchMedia("(display-mode: fullscreen), (display-mode: standalone)").matches;
  const avail=innerHeight-(full?0:24);
  const h=Math.round(w<innerHeight?Math.max(460,avail*.8):Math.max(330,Math.min(avail,w*.66)));
  dpr=Math.min(2,devicePixelRatio||1);cv.width=w*dpr;cv.height=h*dpr;cv.style.height=h+"px";W=w;H=h;
  S=H/46;CY=H*.43;BAND=CY+S*14.5;
  if(song)layout();
}
const yOf=step=>CY-step*S;

// ================= Game state =================
let song,plats=[],startPlat,idx=0,state="menu",stars=0,timeLeft=0,clockRunning=false,tPrev=null,retried=false;
let ch={x:0,y:0,squash:0},jump=null,vy=0,camX=0,ghost=null,floats=[],confetti=[],failInfo=null,lastNoteT=0,failTimer=0;
const beatSec=()=>60/(song.bpm*opts.tempo);
const headX=p=>p.x+S*1.8;
const landX=p=>p.x+Math.max(p.w*.62,S*4.4);
const stemUp=step=>step>=0?step<6:step<-6;   // stems down from the middle line up, per staff

function layout(){
  const gap=S*4;let x=S*24;
  startPlat={x:S*16,w:x-gap-S*16,step:plats[0].step};startPlat.top=yOf(startPlat.step)+S*1.05;
  let beats=0;
  for(const p of plats){p.x=x;p.w=S*5.4+p.dur*S*4.4;p.top=yOf(p.step)+S*1.05;p.bar=beats>0&&Math.abs(beats%song.bar)<1e-6;beats+=p.dur;x+=p.w+gap;}
  layout.gap=gap;layout.end=x;
  if(!jump&&state!=="falling")placeOn(idx>0?plats[idx-1]:startPlat);
}
function placeOn(at){ch.x=at===startPlat?at.x+at.w*.6:landX(at);ch.y=at.top;}
function loadSong(){
  song=ALL.find(s=>s.id===opts.song)||ALL[0];
  plats=song.notes.map(([n,d,l,f],i)=>{const m=toMidi(n);return{midi:m,dur:d,lyric:l||"",step:stepOf(m),star:false,
    clock:i>=2&&(i%5===3),got:false,...fingerFor(m,f)};});
  idx=0;stars=0;tPrev=null;retried=false;jump=null;ghost=null;floats=[];confetti=[];
  timeLeft=plats.reduce((a,p)=>a+p.dur,0)*beatSec()*2.4+15;clockRunning=false;
  layout();camX=0;updateHud();
}
function updateHud(){
  $("hStars").textContent=`${stars} / ${plats.length}`;
  const on=opts.clock==="on";$("hTimeChip").hidden=!on;
  if(on){$("hTime").textContent=Math.max(0,Math.ceil(timeLeft));$("hTimeChip").classList.toggle("low",timeLeft<8);}
}
function float(text,x,y,color="#1c2a4a",size=2.4){floats.push({text,x,y,t:0,color,size});}

// ================= Note handling =================
function matches(m,target){return opts.oct==="any"?m%12===target%12:m===target;}
function pitchDiff(m,target){if(opts.oct!=="any")return m-target;let d=((m-target)%12+12)%12;return d>6?d-12:d;}
function onNote(m){
  const now=performance.now()/1000;
  if(now-lastNoteT<.08)return;lastNoteT=now;
  if(state==="fail"){const t=plats[idx];if(t&&matches(m,t.midi))retryNote();else return;}
  if(state!=="play")return;
  if(jump)finishJump();
  if(state!=="play")return;
  const t=plats[idx];if(!t)return;
  if(matches(m,t.midi)){
    let rating="free";
    if(tPrev!==null){
      const exp=tPrev+plats[idx-1].dur*beatSec(),err=now-exp,tol=Math.max(.18,.38*beatSec());
      rating=Math.abs(err)<=tol?"good":(err<0?"early":"late");
    }
    if(rating==="good"||(rating==="free"&&!retried)){t.star=true;stars++;sfx.star();float("★",landX(t),t.top-S*6,"#ffbf1f",3.4);}
    else if(rating==="early")float("🐇",landX(t),t.top-S*6);
    else if(rating==="late")float("🐢",landX(t),t.top-S*6);
    if(t.clock&&!t.got&&rating==="good"&&opts.clock==="on"){t.got=true;timeLeft+=6;sfx.clock();float("+6",landX(t),t.top-S*9.5,"#ff6b3d",3);}
    if(opts.clock==="on")clockRunning=true;
    tPrev=now;retried=false;idx++;
    startJump(landX(t),t.top,()=>{if(idx>=plats.length)win();});
  }else{
    const short=pitchDiff(m,t.midi)<0;
    failInfo={played:m,want:t.midi,short};
    ghost={midi:m,x:headX(t)+S*3.4,t:now};
    const lx=short?t.x-layout.gap*.5:t.x+t.w+layout.gap*.5;
    startJump(lx,t.top,()=>{state="falling";vy=0;sfx.fall();showFail();},true);
  }
  updateHud();
}
function startJump(x1,y1,done,wrong){
  const dx=Math.abs(x1-ch.x),rise=Math.max(0,ch.y-y1);
  jump={x0:ch.x,y0:ch.y,x1,y1,t:0,d:Math.min(.5,.28+dx/(S*90)),peak:S*2.6+rise*.9+dx*.08,done,wrong};
}
function finishJump(){const j=jump;jump=null;ch.x=j.x1;ch.y=j.y1;if(!j.wrong)ch.squash=1;j.done();}
// After a mistake: show big letters, then put the egg back on the same stone automatically.
function showFail(){
  const f=failInfo;
  $("bigFail").innerHTML=f.time
    ?`<span>⏱</span>`
    :`<span class="bad">${label(f.played)}</span><span class="arrow">${f.short?"⬆":"⬇"}</span><span class="good">${label(f.want)}</span>`;
  $("ovFail").hidden=false;
  clearTimeout(failTimer);failTimer=setTimeout(()=>{if(state==="fail"||state==="falling")retryNote();},2600);
}
function retryNote(){
  clearTimeout(failTimer);$("ovFail").hidden=true;
  jump=null;placeOn(idx>0?plats[idx-1]:startPlat);ch.squash=1;
  ghost=null;state="play";tPrev=null;retried=true;if(opts.clock==="on")timeLeft=Math.max(timeLeft,15);updateHud();
}
function restart(){clearTimeout(failTimer);$("ovFail").hidden=true;$("ovWin").hidden=true;loadSong();state="play";keepAwake();}
function win(){
  state="win";clockRunning=false;sfx.win();
  for(let i=0;i<110;i++)confetti.push({x:camX+Math.random()*W,y:-20-Math.random()*H*.5,vx:(Math.random()-.5)*60,vy:60+Math.random()*120,c:["#ff6b3d","#ffbf1f","#5cbf4a","#4aa3ff","#c86bff"][i%5],r:Math.random()*6});
  setTimeout(()=>{$("winStars").textContent=`★ ${stars} / ${plats.length}`;$("ovWin").hidden=false;},1300);
}

// ================= Update & draw =================
let last=performance.now();
function frame(nowMs){
  const dt=Math.min(.05,(nowMs-last)/1000);last=nowMs;const now=nowMs/1000;
  if(jump){jump.t+=dt;const u=Math.min(1,jump.t/jump.d);
    ch.x=jump.x0+(jump.x1-jump.x0)*u;ch.y=jump.y0+(jump.y1-jump.y0)*u-jump.peak*4*u*(1-u);if(u>=1)finishJump();}
  if(state==="falling"){vy+=S*160*dt;ch.y+=vy*dt;if(ch.y>H+S*6)state="fail";}
  if(state==="play"&&clockRunning&&opts.clock==="on"){const before=Math.ceil(timeLeft);timeLeft-=dt;
    if(timeLeft<=0){timeLeft=0;if(jump)finishJump();if(state==="play"){state="fail";failInfo={time:true};sfx.fall();showFail();}}
    if(Math.ceil(timeLeft)!==before)updateHud();}
  ch.squash=Math.max(0,ch.squash-dt*5);
  const target=Math.max(0,ch.x-W*.33);camX+=(target-camX)*Math.min(1,dt*5);
  floats=floats.filter(f=>(f.t+=dt)<1.3);
  for(const c of confetti){c.vy+=30*dt;c.x+=c.vx*dt;c.y+=c.vy*dt;c.r+=dt*6;}
  draw(now);requestAnimationFrame(frame);
}

const STAFF=[10,8,6,4,2,-2,-4,-6,-8,-10];
const LINE="#141414";
function staffLines(x0,x1){ctx.strokeStyle=LINE;ctx.lineWidth=Math.max(1.3,S*.14);
  for(const st of STAFF){const y=Math.round(yOf(st))+.5;ctx.beginPath();ctx.moveTo(x0,y);ctx.lineTo(x1,y);ctx.stroke();}}
function draw(now){
  ctx.setTransform(dpr,0,0,dpr,0,0);
  const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,"#9ad6ff");g.addColorStop(1,"#e4f5ff");ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  ctx.fillStyle="rgba(255,255,255,.8)";
  for(let i=0;i<5;i++){const cx=((i*W*.41-camX*.2)%(W*1.6)+W*1.6)%(W*1.6)-W*.3;cloud(cx,H*.06+(i%2)*S*2.5,S*(1.6+i%3*.6));}
  // manuscript paper band
  const pt=yOf(13.5),pb=yOf(-13.5);
  ctx.fillStyle="rgba(28,42,74,.12)";ctx.fillRect(0,pt+S*.5,W,pb-pt);
  ctx.fillStyle="#fffffb";ctx.fillRect(0,pt,W,pb-pt);
  staffLines(0,W);
  ctx.save();ctx.translate(-camX,0);
  // bar lines + final double bar
  ctx.strokeStyle=LINE;ctx.lineWidth=Math.max(1.3,S*.16);
  for(const p of plats)if(p.bar){const bx=p.x-layout.gap*.5;ctx.beginPath();ctx.moveTo(bx,yOf(10));ctx.lineTo(bx,yOf(-10));ctx.stroke();}
  const ex=layout.end-layout.gap*.5;
  ctx.beginPath();ctx.moveTo(ex-S*.9,yOf(10));ctx.lineTo(ex-S*.9,yOf(-10));ctx.stroke();
  ctx.lineWidth=S*.6;ctx.beginPath();ctx.moveTo(ex+S*.2,yOf(10));ctx.lineTo(ex+S*.2,yOf(-10));ctx.stroke();
  // time signature
  ctx.fillStyle=LINE;ctx.font=`900 ${S*4.6}px Georgia,"Times New Roman",serif`;ctx.textAlign="center";ctx.textBaseline="middle";
  for(const st of [8,4,-4,-8])ctx.fillText(st===8||st===-4?song.bar:4,S*12.6,yOf(st)+S*.3);
  // platforms (stones) under every note
  stone(startPlat,false,false);
  plats.forEach((p,i)=>stone(p,i<idx,i===idx));
  // goal flag
  const lp=plats[plats.length-1],fx=lp.x+lp.w-S*1.2;
  ctx.strokeStyle="#1c2a4a";ctx.lineWidth=S*.35;ctx.beginPath();ctx.moveTo(fx,lp.top);ctx.lineTo(fx,lp.top-S*9);ctx.stroke();
  ctx.fillStyle="#ff6b3d";ctx.beginPath();const wv=Math.sin(now*6)*S*.6;ctx.moveTo(fx,lp.top-S*9);ctx.quadraticCurveTo(fx+S*2.5,lp.top-S*8.5+wv,fx+S*5,lp.top-S*7.6);ctx.lineTo(fx,lp.top-S*6.2);ctx.fill();
  // notes + labels + lyrics
  plats.forEach((p,i)=>noteBits(p,i<idx,i===idx));
  // ghost (wrong) note
  if(ghost&&now-ghost.t<3){ctx.globalAlpha=Math.max(0,1-(now-ghost.t)/3);noteHead(ghost.x,stepOf(ghost.midi),1,"#e8434f",sharpOf(ghost.midi));ctx.globalAlpha=1;}
  // flying clock
  const t=plats[idx];
  if(state==="play"&&t&&t.clock&&!t.got&&tPrev!==null&&opts.clock==="on"){
    const exp=tPrev+plats[idx-1].dur*beatSec(),bx=landX(t)-(now-exp)*S*14,by=Math.min(t.top,yOf(t.step)-S*7)-S*4+Math.sin(now*4)*S*.6;bird(bx,by,now);}
  // timing ring
  if(state==="play"&&t&&tPrev!==null&&!jump){
    const exp=plats[idx-1].dur*beatSec(),u=(now-tPrev)/exp,tol=Math.max(.18,.38*beatSec())/exp;
    const cx=ch.x,cy=ch.y-S*7.4,r=S*1.3,inWin=Math.abs(u-1)<=tol;
    ctx.lineWidth=S*.5;ctx.strokeStyle="rgba(28,42,74,.18)";ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle=inWin?"#ffbf1f":u>1?"rgba(28,42,74,.3)":"#4aa3ff";
    ctx.beginPath();ctx.arc(cx,cy,inWin?r*1.25:r,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.min(1,u));ctx.stroke();
    if(inWin){ctx.fillStyle="#ffbf1f";ctx.font=`800 ${S*1.8}px "Baloo 2",sans-serif`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("★",cx,cy+S*.1);}
  }
  egg(ch.x,ch.y,now);
  for(const f of floats){ctx.globalAlpha=1-f.t/1.3;ctx.fillStyle=f.color;ctx.font=`800 ${S*f.size}px "Baloo 2",sans-serif`;ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.fillText(f.text,f.x,f.y-f.t*S*4);}ctx.globalAlpha=1;
  ctx.restore();
  // fixed clef panel: brace, system line, clefs
  const pw=S*10;
  const pg=ctx.createLinearGradient(0,0,pw+S*2,0);pg.addColorStop(0,"#fffffb");pg.addColorStop(.82,"rgba(255,255,251,.97)");pg.addColorStop(1,"rgba(255,255,251,0)");
  ctx.fillStyle=pg;ctx.fillRect(0,pt,pw+S*2,pb-pt);staffLines(0,pw+S*2);
  ctx.strokeStyle=LINE;ctx.lineWidth=Math.max(1.5,S*.22);ctx.beginPath();ctx.moveTo(S*2.4,yOf(10));ctx.lineTo(S*2.4,yOf(-10));ctx.stroke();
  brace(S*1.5,yOf(10),yOf(-10));
  ctx.fillStyle=LINE;ctx.textAlign="left";ctx.textBaseline="alphabetic";
  ctx.font=`${S*8}px "Noto Music",serif`;ctx.fillText("\u{1D11E}",S*3.4,yOf(4));ctx.fillText("\u{1D122}",S*3.4,yOf(-6));
  // hand + keyboard guide
  handBand(now);
  for(const c of confetti){ctx.save();ctx.translate(c.x-camX,c.y);ctx.rotate(c.r);ctx.fillStyle=c.c;ctx.fillRect(-4,-2,8,4);ctx.restore();}
}
function brace(x,y0,y1){const m=(y0+y1)/2,w=S*1.1;ctx.fillStyle=LINE;ctx.beginPath();
  ctx.moveTo(x+w,y0);ctx.bezierCurveTo(x-w*.2,y0+(m-y0)*.15,x+w*.8,m-(m-y0)*.35,x-w*.4,m);
  ctx.bezierCurveTo(x+w*.8,m+(y1-m)*.35,x-w*.2,y1-(y1-m)*.15,x+w,y1);
  ctx.bezierCurveTo(x+w*.2,y1-(y1-m)*.15,x+w*1.4,m+(y1-m)*.35,x-w*.1,m);
  ctx.bezierCurveTo(x+w*1.4,m-(m-y0)*.35,x+w*.2,y0+(m-y0)*.15,x+w,y0);ctx.fill();}
function cloud(x,y,r){ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.arc(x+r,y-r*.4,r*1.2,0,7);ctx.arc(x+r*2.1,y,r*.9,0,7);ctx.fill();}
function stone(p,done,next){
  const top=p.top,h=S*1.7;
  ctx.fillStyle=done?"rgba(155,128,100,.55)":"#9b8064";roundRect(p.x,top,p.w,h,S*.7);ctx.fill();
  ctx.fillStyle=next?"#ffcf3a":done?"rgba(92,191,74,.55)":"#5cbf4a";roundRect(p.x-S*.2,top-S*.2,p.w+S*.4,S*.9,S*.45);ctx.fill();
  if(p.star){ctx.fillStyle="#ffbf1f";ctx.font=`800 ${S*1.7}px "Baloo 2",sans-serif`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("★",p.x+p.w-S*1.4,top+S*.95);}
}
function noteBits(p,done,next){
  const hx=headX(p),y=yOf(p.step),up=stemUp(p.step);
  noteHead(hx,p.step,p.dur,done?"rgba(20,20,20,.35)":LINE,false);
  const showL=!done&&(opts.names==="letters"||opts.names==="solfege"||(opts.names==="next"&&next));
  if(showL){const ly=up?y-S*9.2:y-S*3.4,txt=label(p.midi);
    ctx.font=`800 ${S*(next?2.4:1.8)}px "Baloo 2",sans-serif`;const tw=ctx.measureText(txt).width+S*1.4,bh=S*(next?2.9:2.4);
    ctx.fillStyle=next?"#ff6b3d":"rgba(230,240,255,.95)";roundRect(hx-tw/2,ly-bh/2,tw,bh,bh/2);ctx.fill();
    ctx.fillStyle=next?"#fff":"#1c2a4a";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(txt,hx,ly+S*.15);}
  if(p.lyric){ctx.fillStyle=done?"rgba(28,42,74,.35)":"#1c2a4a";ctx.font=`700 ${S*1.6}px "Baloo 2",sans-serif`;ctx.textAlign="left";ctx.textBaseline="top";ctx.fillText(p.lyric,p.x+S*.4,p.top+S*2.1);}
}
function noteHead(x,step,dur,color,sharp){
  const y=yOf(step),up=stemUp(step);ctx.strokeStyle=color;ctx.fillStyle=color;
  // ledger lines (middle C, and beyond each staff)
  const led=[];if(step>=-1&&step<=1)led.push(0);
  for(let s=12;s<=step;s+=2)led.push(s);for(let s=-12;s>=step;s-=2)led.push(s);
  ctx.lineWidth=Math.max(1.3,S*.16);for(const s of led){ctx.beginPath();ctx.moveTo(x-S*2.1,yOf(s));ctx.lineTo(x+S*2.1,yOf(s));ctx.stroke();}
  // head: open for half/whole, filled otherwise
  ctx.save();ctx.translate(x,y);ctx.rotate(-.35);ctx.beginPath();ctx.ellipse(0,0,S*1.32,S*.94,0,0,7);ctx.fill();
  ctx.restore();
  if(dur>=2){ctx.save();ctx.translate(x,y);ctx.rotate(-.35);ctx.fillStyle="#fffffb";ctx.beginPath();ctx.ellipse(0,0,S*.95,S*.42,0,0,7);ctx.fill();ctx.restore();}
  // stem
  if(dur<4){const sx=up?x+S*1.2:x-S*1.2,sy=up?y-S*7:y+S*7;ctx.lineWidth=Math.max(1.3,S*.2);
    ctx.beginPath();ctx.moveTo(sx,y+(up?-S*.25:S*.25));ctx.lineTo(sx,sy);ctx.stroke();
    if(dur===.5){ctx.lineWidth=S*.45;ctx.beginPath();const d=up?1:-1;ctx.moveTo(sx,sy);ctx.bezierCurveTo(sx+S*.4,sy+d*S*2,sx+S*2.6,sy+d*S*2.6,sx+S*1.8,sy+d*S*5);ctx.stroke();}}
  // dot
  if(dur===3||dur===1.5){ctx.beginPath();ctx.arc(x+S*2.4,y-(step%2===0?S*.95:0),S*.42,0,7);ctx.fill();}
  if(sharp){ctx.font=`${S*4}px "Noto Music",serif`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("♯",x-S*3,y);}
}
// ---- Bottom guide: left hand · keyboard · right hand, highlighting the finger and key to play
function handBand(now){
  const top=BAND,bh=H-top-S*.6;if(bh<S*4)return;
  ctx.fillStyle="rgba(255,255,255,.55)";roundRect(S*.6,top,W-S*1.2,bh,S*1.2);ctx.fill();
  const t=(state==="play"||state==="fail"||state==="falling")?plats[idx]:null;
  const KW=15,lo=48;                                     // white keys C3..C5
  const handW=Math.min(bh*1.15,W*.2),kw=Math.min((W-handW*2-S*6)/KW,bh*.42),kh=Math.min(bh*.82,kw*4.2);
  const kx=(W-kw*KW)/2,ky=top+(bh-kh)/2;
  const whites=[];for(let m=lo;m<=72;m++)if(!sharpOf(m))whites.push(m);
  const pulse=.5+.5*Math.sin(now*6);
  whites.forEach((m,i)=>{const hit=t&&m===t.midi;
    ctx.fillStyle=hit?`rgb(255,${Math.round(107+60*pulse)},61)`:"#fff";ctx.strokeStyle="#1c2a4a";ctx.lineWidth=Math.max(1,S*.12);
    roundRect(kx+i*kw,ky,kw,kh,S*.35);ctx.fill();ctx.stroke();
    if(m===60){ctx.fillStyle="#1c2a4a";ctx.beginPath();ctx.arc(kx+i*kw+kw/2,ky+kh-kw*.32,kw*.12,0,7);ctx.fill();}  // middle C dot
    if(hit){ctx.fillStyle="#fff";ctx.font=`800 ${kw*.7}px "Baloo 2",sans-serif`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(t.finger,kx+i*kw+kw/2,ky+kh*.72);}
  });
  whites.forEach((m,i)=>{if(i<whites.length-1&&sharpOf(m+1)){ctx.fillStyle="#1c2a4a";roundRect(kx+(i+1)*kw-kw*.3,ky,kw*.6,kh*.6,S*.25);ctx.fill();}});
  const hy=top+bh*.5;
  hand(kx-S*1.5-handW*.5,hy,handW,false,t&&t.hand==="L"?t.finger:0,!t||t.hand!=="L",now);
  hand(kx+kw*KW+S*1.5+handW*.5,hy,handW,true,t&&t.hand==="R"?t.finger:0,!t||t.hand!=="R",now);
}
function hand(cx,cy,sz,right,active,dim,now){
  ctx.save();ctx.translate(cx,cy);ctx.globalAlpha=dim?.35:1;
  const s=sz,dir=right?1:-1,fw=s*.13;
  // fingers: [x offset, base y, length, angle] thumb..pinky; right hand has the thumb on the left
  const F=[[-.25,.12,.24,-.75],[-.16,-.04,.33,-.08],[-.03,-.07,.37,0],[.1,-.05,.33,.08],[.22,.0,.25,.18]];
  ctx.lineCap="round";
  F.forEach(([fx,by,len,ang],i)=>{const n=i+1,x0=fx*s*dir,y0=by*s,a=ang*dir;
    const lift=n===active?Math.sin(now*8)*s*.03-s*.04:0;
    const x1=x0+Math.sin(a)*len*s,y1=y0-Math.cos(a)*len*s+lift;
    ctx.strokeStyle="#1c2a4a";ctx.lineWidth=fw+s*.035;ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke();
    ctx.strokeStyle=n===active?"#ff6b3d":"#ffd9b8";ctx.lineWidth=fw;ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke();
    const r=n===active?s*.085:s*.062;ctx.fillStyle=n===active?"#fff":"rgba(255,255,255,.85)";ctx.strokeStyle=n===active?"#ff6b3d":"#1c2a4a";ctx.lineWidth=s*.018;
    ctx.beginPath();ctx.arc(x1,y1-s*.02,r,0,7);ctx.fill();ctx.stroke();
    ctx.fillStyle=n===active?"#ff6b3d":"#1c2a4a";ctx.font=`800 ${r*1.5}px "Baloo 2",sans-serif`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(n,x1,y1-s*.01);
  });
  // palm
  ctx.fillStyle="#ffd9b8";ctx.strokeStyle="#1c2a4a";ctx.lineWidth=s*.035;
  roundRect(-s*.26,-s*.06,s*.52,s*.38,s*.14);ctx.fill();ctx.stroke();
  ctx.fillStyle="#1c2a4a";ctx.font=`800 ${s*.17}px "Baloo 2",sans-serif`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(right?"R":"L",0,s*.15);
  ctx.restore();
}
function egg(x,y,now){
  const sq=ch.squash,falling=state==="falling"||state==="fail",w=S*2.5*(1+sq*.25),h=S*3.4*(1-sq*.2);
  ctx.save();ctx.translate(x,y);if(falling)ctx.rotate(Math.sin(now*12)*.4);
  ctx.strokeStyle="#1c2a4a";ctx.lineWidth=S*.35;ctx.lineCap="round";
  const st=jump?.6:Math.sin(now*3)*.1;
  ctx.beginPath();ctx.moveTo(-w*.3,-S*.9);ctx.lineTo(-w*.35-st*S,0);ctx.moveTo(w*.3,-S*.9);ctx.lineTo(w*.35+st*S,0);ctx.stroke();
  ctx.fillStyle="#fffdf6";ctx.lineWidth=S*.28;
  ctx.beginPath();ctx.ellipse(0,-S*.8-h/2,w/2,h/2,0,0,7);ctx.fill();ctx.stroke();
  ctx.save();ctx.beginPath();ctx.ellipse(0,-S*.8-h/2,w/2,h/2,0,0,7);ctx.clip();ctx.fillStyle="#4aa3ff";ctx.fillRect(-w,-S*.8-h*.42,w*2,S*.7);ctx.restore();
  const fy=-S*.8-h*.68;ctx.fillStyle="#1c2a4a";
  ctx.beginPath();ctx.arc(-w*.17,fy,S*.28,0,7);ctx.arc(w*.17,fy,S*.28,0,7);ctx.fill();
  ctx.beginPath();ctx.lineWidth=S*.22;if(falling)ctx.arc(0,fy+S*.9,S*.35,0,7);else ctx.arc(0,fy+S*.35,S*.5,.2,Math.PI-.2);ctx.stroke();
  ctx.restore();
}
function bird(x,y,now){
  const f=Math.sin(now*14)*S*.9;ctx.fillStyle="#c86bff";ctx.strokeStyle="#1c2a4a";ctx.lineWidth=S*.2;
  ctx.beginPath();ctx.moveTo(x-S*.4,y);ctx.lineTo(x-S*2.4,y-f);ctx.lineTo(x-S*1.2,y+S*.5);ctx.fill();
  ctx.beginPath();ctx.moveTo(x+S*.4,y);ctx.lineTo(x+S*2.4,y-f);ctx.lineTo(x+S*1.2,y+S*.5);ctx.fill();
  ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(x,y+S*.4,S*1.3,0,7);ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.moveTo(x,y+S*.4);ctx.lineTo(x,y-S*.4);ctx.moveTo(x,y+S*.4);ctx.lineTo(x+S*.6,y+S*.6);ctx.stroke();
}
function roundRect(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}

// ================= Input: Web MIDI, Web Bluetooth, keyboard =================
function onStatus(s){
  if(s.ok){$("hDot").className="dot on";$("hInput").textContent=s.name;
    $("connText").innerHTML=`<span class="dot on"></span><b>${s.name}</b> connected`;return;}
  if(s.disconnected){$("hDot").className="dot";$("hInput").textContent="Piano disconnected";}
  $("connText").innerHTML=`<span class="dot"></span>${s.message}`;
}
$("btnMidi").onclick=()=>{audio();connectMidi(onNote,onStatus);};
$("btnBle").onclick=()=>{audio();connectBluetoothMidi(onNote,onStatus);};
keyboardNotes(n=>{audio();onNote(n);});

// ================= Song library (import a file; encrypted ones need the password) =================
const libMsg=(t,bad)=>{$("libMsg").textContent=t;$("libMsg").style.color=bad?"var(--bad)":"var(--muted)";};
$("btnLibLoad").onclick=async()=>{
  const f=$("libFile").files[0],pasted=$("libText").value.trim();   // pasted text wins over a chosen file
  if(!f&&!pasted)return libMsg("Paste the library text or choose a file first.",true);
  try{
    if(!pasted&&f.size>2e6)throw new Error("File too big (max 2 MB)");
    const songs=await parseLibraryText(pasted||await f.text(),$("libPass").value);
    saveStored(songs);ALL=[...SONGS,...loadStored()];$("libPass").value="";$("libText").value="";renderSongs();
    libMsg(`Loaded ${songs.length} song${songs.length>1?"s":""}.`);
  }catch(e){libMsg(e.message,true);}
};
$("btnLibClear").onclick=()=>{clearStored();ALL=[...SONGS];renderSongs();libMsg("Library removed.");};
if(ALL.length>SONGS.length)libMsg(`${ALL.length-SONGS.length} library song${ALL.length-SONGS.length>1?"s":""} on this device.`);

// ================= Buttons =================
$("btnStart").onclick=()=>{audio();$("ovMenu").hidden=true;restart();};
$("btnMenu").onclick=()=>{state="menu";clearTimeout(failTimer);$("ovFail").hidden=true;$("ovWin").hidden=true;$("ovMenu").hidden=false;releaseWake();};
$("btnRestartHud").onclick=()=>{if(state!=="menu"){audio();restart();}};
$("btnAgain").onclick=restart;$("btnSongs").onclick=()=>{$("ovWin").hidden=true;state="menu";$("ovMenu").hidden=false;};

addEventListener("resize",resize);
loadSong();resize();requestAnimationFrame(frame);
document.fonts?.ready.then(()=>{});
window.__pj={onNote,get state(){return state},get idx(){return idx}};
