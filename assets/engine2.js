/* =====================================================================
   HOTDOG RUN 2.0 · motor ampliado
   Se inyecta dentro del cierre del juego (offline y online) con
   tools/inject-engine.py. Sobrescribe el dibujo/cámara y ENVUELVE la física
   (no la reemplaza): reglas, preguntas, puntajes y red quedan intactos.
   · Viewport dinámico: el mundo lógico se adapta al aspecto de la pantalla
     (≥ 960 de ancho, hasta 720 de alto): se ve más mundo, no solo más píxeles.
   · Cámara con anticipación, escenarios con parallax por mundo, partículas,
     animación de personajes (solo visual: los hitboxes no cambian).
   ===================================================================== */
const E2={rm:matchMedia('(prefers-reduced-motion: reduce)'),sc:1,HY:52,shake:0,fdt:.016,t:0,q:1,ema:16,qT:0};
let PT=[];
const rnd=(a,b)=>a+Math.random()*(b-a);
const hash=(a,b)=>{let h=(Math.imul(a|0,374761393)+Math.imul((b||0)|0,668265263))|0;h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296};
const hashStr=s=>{let h=7;for(let i=0;i<s.length;i++)h=(Math.imul(h,31)+s.charCodeAt(i))|0;return Math.abs(h)};

/* ---------- Viewport dinámico ---------- */
function fit(){
  const g=$('#game'),st=$('#stage');
  if(!g||!st||!g.classList.contains('on'))return;
  const cs=getComputedStyle(g);
  const aw=g.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight);
  const ah=g.clientHeight-parseFloat(cs.paddingTop)-parseFloat(cs.paddingBottom);
  if(aw<60||ah<60)return;
  const amin=(typeof L!=='undefined'&&L&&isArena())?4/3:1.15,a=clamp(aw/ah,amin,2.4);
  let sw=aw,sh=aw/a;if(sh>ah){sh=ah;sw=ah*a}
  sw=Math.floor(sw);sh=Math.floor(sh);
  const asp=sw/sh;
  const hp=clamp(Math.round(sh/.9),540,720);
  const arenaNow=typeof L!=='undefined'&&L&&isArena();
  const nH=arenaNow?Math.max(hp,Math.ceil(960/asp)):hp,nW=Math.round(nH*asp);
  const dpr=Math.min(window.devicePixelRatio||1,2);
  const nK=Math.min(2.2,sw*dpr/nW)*E2.q;
  H=nH;W=nW;OY=H-540;K=nK;
  E2.sc=sw/W;E2.HY=Math.round(48/E2.sc);
  st.style.width=sw+'px';st.style.height=sh+'px';
  g.style.setProperty('--stageb',Math.round(st.offsetTop+sh)+'px');
  const bw=Math.round(W*K),bh=Math.round(H*K);
  if(cv.width!==bw||cv.height!==bh){cv.width=bw;cv.height=bh}
}
addEventListener('resize',fit);
if(window.visualViewport)visualViewport.addEventListener('resize',fit);
if(window.ResizeObserver)new ResizeObserver(fit).observe($('#game'));

/* ---------- Cámara ---------- */
const isArena=()=>L.type==='cuadro'||L.type==='lluvia'||L.type==='lava';
function camTarget(){
  const tx=clamp(me.x+me.w/2-W*.36+clamp(me.vx*.28,-40,150),-100,Math.max(-100,L.length-W+100));
  const ty=Math.min(0,me.y-(H*.6-OY));
  return[tx,ty];
}
function updCamera(dt){
  OX=isArena()?(W-960)/2:0;
  if(isArena())camX=0;else camX+=(camTarget()[0]-camX)*(1-Math.exp(-dt*7));
  if(L.type==='lava')camY+=(camTarget()[1]-camY)*(1-Math.exp(-dt*6));else camY=0;
}

/* ---------- Partículas y sacudida ---------- */
const emit=o=>{if(PT.length>420)PT.shift();PT.push(o)};
const FXN=n=>E2.rm.matches?Math.ceil(n/3):n;
function fxDust(x,y,n,s){for(let i=0;i<FXN(n);i++)emit({k:'d',x:x+rnd(-8,8),y:y,vx:rnd(-50,50)*(s||1),vy:-rnd(10,55),g:-20,life:.55,max:.55,r:rnd(3,7)})}
function fxSpark(x,y,n,cols){cols=cols||['#ffc533','#ffe27a','#ff8fb3','#fff'];for(let i=0;i<FXN(n);i++){const a=rnd(0,6.28),v=rnd(90,260);emit({k:'s',x:x,y:y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-80,g:420,life:.9,max:.9,r:rnd(5,10),c:cols[i%cols.length],rot:rnd(0,6.28),vr:rnd(-6,6)})}}
function fxConfetti(x,y,n){const cs=['#ff5d8f','#ffc533','#3d4fd1','#2a9a55','#c77dff','#fff'];for(let i=0;i<FXN(n);i++){emit({k:'c',x:x+rnd(-20,20),y:y,vx:rnd(-220,220),vy:-rnd(160,420),g:520,life:1.6,max:1.6,r:rnd(4,8),c:cs[i%cs.length],rot:rnd(0,6.28),vr:rnd(-9,9)})}}
function fxBad(x,y){for(let i=0;i<FXN(12);i++){const a=rnd(0,6.28),v=rnd(60,200);emit({k:'d',x:x,y:y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-40,g:300,life:.55,max:.55,r:rnd(3,6),c:'#ff5a5a'})}}
const shake=m=>{if(!E2.rm.matches)E2.shake=Math.max(E2.shake,m)};
function fxUpdate(dt){
  for(const p of PT){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=p.g*dt;if(p.vr)p.rot+=p.vr*dt;p.vx*=1-.8*dt}
  PT=PT.filter(p=>p.life>0);
  E2.shake*=Math.exp(-dt*9);
}
function drawParticles(){
  for(const p of PT){
    const a=clamp(p.life/p.max,0,1);
    ctx.globalAlpha=p.k==='t'?a*.4:a;
    if(p.k==='d'){ctx.fillStyle=p.c||'rgba(255,255,255,.75)';ctx.beginPath();ctx.arc(p.x,p.y,p.r*(1.3-a*.5),0,7);ctx.fill()}
    else if(p.k==='s'){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.fillStyle=p.c;ctx.beginPath();for(let i=0;i<8;i++){const an=i*Math.PI/4,rr_=i%2?p.r*.35:p.r;ctx.lineTo(Math.cos(an)*rr_,Math.sin(an)*rr_)}ctx.closePath();ctx.fill();ctx.restore()}
    else if(p.k==='c'){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.fillStyle=p.c;ctx.fillRect(-p.r,-p.r*.5,p.r*2,p.r);ctx.restore()}
    else if(p.k==='t'){ctx.fillStyle=p.c;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,7);ctx.fill()}
  }
  ctx.globalAlpha=1;
}

/* ---------- Escenarios por mundo (capas pre-renderizadas con parallax) ---------- */
const TW=1024,TH=460,LY=80;           /* capa: 1024×460 que cubre y=80..540 del diseño */
const mkc=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
function ridgeFn(seed,base,amp){const r=rng(seed),ph=[r()*6.28,r()*6.28,r()*6.28],f=[2,5,11];return x=>{const n=Math.sin(x/TW*6.283*f[0]+ph[0])*.5+Math.sin(x/TW*6.283*f[1]+ph[1])*.3+Math.sin(x/TW*6.283*f[2]+ph[2])*.2;return base-amp*(.5+.5*n)}}
function fillRidge(c,fn,col){c.beginPath();c.moveTo(0,540);for(let x=0;x<=TW;x+=8)c.lineTo(x,fn(x));c.lineTo(TW,540);c.closePath();c.fillStyle=col;c.fill()}
function wrapAt(x,pad,f){f(x);if(x>TW-pad)f(x-TW);if(x<pad)f(x+TW)}
function layerCv(draw){const cvs=mkc(TW,TH),c=cvs.getContext('2d');c.translate(0,-LY);draw(c);return cvs}
function treeRound(c,x,y,s,seed){const g=['#2f9e55','#3fb862','#27894a'];c.fillStyle='#7a4d30';c.fillRect(x-3*s,y-14*s,6*s,16*s);
  [[0,-30,18],[-13,-22,13],[13,-22,13],[0,-42,12]].forEach(([dx,dy,r],i)=>{const gr=c.createRadialGradient(x+dx*s-r*s*.3,y+dy*s-r*s*.3,1,x+dx*s,y+dy*s,r*s);gr.addColorStop(0,'#7bdc7d');gr.addColorStop(.6,g[i%3]);gr.addColorStop(1,'#1f7a3d');c.fillStyle=gr;c.beginPath();c.arc(x+dx*s,y+dy*s,r*s,0,7);c.fill()})}
function pine(c,x,y,s,col,hi){c.fillStyle='#4a2f3a';c.fillRect(x-2*s,y-8*s,4*s,10*s);for(let i=0;i<4;i++){const w=(26-i*5)*s,top=y-(14+i*17)*s;c.fillStyle=col;c.beginPath();c.moveTo(x-w,top+22*s);c.lineTo(x,top-6*s);c.lineTo(x+w,top+22*s);c.closePath();c.fill();if(hi){c.fillStyle=hi;c.beginPath();c.moveTo(x,top-6*s);c.lineTo(x+w,top+22*s);c.lineTo(x+w*.2,top+22*s);c.closePath();c.fill()}}}
function bush(c,x,y,s,col){c.fillStyle=col;[[0,0,11],[-10,3,8],[10,3,8]].forEach(([dx,dy,r])=>{c.beginPath();c.arc(x+dx*s,y+dy*s,r*s,0,7);c.fill()})}
function flowerDot(c,x,y,col){c.fillStyle='#2d8a4a';c.fillRect(x-.5,y,1.4,7);c.fillStyle=col;for(let i=0;i<5;i++){const a=i*1.2566;c.beginPath();c.arc(x+Math.cos(a)*2.6,y+Math.sin(a)*2.6,2,0,7);c.fill()}c.fillStyle='#ffe27a';c.beginPath();c.arc(x,y,1.7,0,7);c.fill()}
function crystal(c,x,y,s,col){const g=c.createRadialGradient(x,y-20*s,2,x,y-20*s,44*s);g.addColorStop(0,col+'88');g.addColorStop(1,col+'00');c.fillStyle=g;c.fillRect(x-50*s,y-70*s,100*s,80*s);
  [[-8,22,-4],[0,34,0],[8,18,5]].forEach(([dx,h,sk])=>{c.fillStyle=col;c.beginPath();c.moveTo(x+dx*s-6*s,y);c.lineTo(x+dx*s+sk*s,y-h*s);c.lineTo(x+dx*s+6*s,y);c.closePath();c.fill();c.fillStyle='rgba(255,255,255,.4)';c.beginPath();c.moveTo(x+dx*s,y);c.lineTo(x+dx*s+sk*s,y-h*s);c.lineTo(x+dx*s-2*s,y);c.closePath();c.fill()})}
function mushroom(c,x,y,s,col){const g=c.createRadialGradient(x,y-12*s,1,x,y-12*s,30*s);g.addColorStop(0,col+'77');g.addColorStop(1,col+'00');c.fillStyle=g;c.fillRect(x-32*s,y-44*s,64*s,50*s);c.fillStyle='#d9c8ff';c.fillRect(x-3*s,y-10*s,6*s,11*s);c.fillStyle=col;c.beginPath();c.ellipse(x,y-10*s,13*s,9*s,0,Math.PI,0);c.fill();c.fillStyle='rgba(255,255,255,.55)';[[-5,-14],[3,-16],[7,-12]].forEach(([dx,dy])=>{c.beginPath();c.arc(x+dx*s,y+dy*s,1.6*s,0,7);c.fill()})}
function buildings(c,y0,col,minH,maxH,seed,windows,sc){const r=rng(seed),meta=[];let x=0;
  while(x<TW){const w=Math.min(TW-x,56+r()*70),h=minH+r()*(maxH-minH);
    c.fillStyle=col;c.fillRect(x,y0-h,w,h+130);
    if(r()<.4){c.fillRect(x+w*.45,y0-h-26,3,26)}                                    /* antena */
    if(r()<.3){c.fillStyle=shade(col,-18);c.fillRect(x+6,y0-h-10,18,10)}              /* tanque */
    if(windows){for(let wy=y0-h+10;wy<y0-6;wy+=17)for(let wx=x+7;wx<x+w-9;wx+=15){if(r()<windows){c.fillStyle=r()<.5?'#ffe59a':'#ffd06b';c.fillRect(wx,wy,8,10)}else{c.fillStyle='rgba(20,10,40,.35)';c.fillRect(wx,wy,8,10)}}}
    if(sc&&r()<sc&&w>60){meta.push({x:x+w*.5,y:y0-h*.55,w:Math.min(w-14,44),h:14,col:['#ff4fa3','#4fe3ff','#ffd24f'][Math.floor(r()*3)],ph:r()*6})}
    x+=w+(r()<.3?6:0)}
  return meta}
function island(w,seed,theme){const r=rng(seed),h=Math.round(w*.62),cv_=mkc(w+20,h+30),c=cv_.getContext('2d');
  const gx=10;c.fillStyle=lgradC(c,0,18,0,h,'#9a8aa0','#4c3f66');c.beginPath();c.moveTo(gx,24);c.quadraticCurveTo(gx+w*.5,h*1.18,gx+w,24);c.closePath();c.fill();
  c.fillStyle='rgba(255,255,255,.14)';c.beginPath();c.moveTo(gx+w*.2,26);c.quadraticCurveTo(gx+w*.35,h*.7,gx+w*.5,h*.92);c.lineTo(gx+w*.45,26);c.fill();
  c.fillStyle=lgradC(c,0,6,0,30,'#7be07b','#3aa857');c.beginPath();c.ellipse(gx+w/2,24,w/2,13,0,0,7);c.fill();
  c.fillStyle='rgba(255,255,255,.3)';c.beginPath();c.ellipse(gx+w/2,19,w*.42,6,0,0,7);c.fill();
  if(w>90){treeRound(c,gx+w*.3,22,.55,seed);flowerDot(c,gx+w*.62,18,'#ff8fb3');flowerDot(c,gx+w*.72,19,'#fff');}
  c.strokeStyle='#4aa65a';c.lineWidth=2;for(let i=0;i<4;i++){const vx=gx+w*(.25+i*.17);c.beginPath();c.moveTo(vx,h*.7);c.quadraticCurveTo(vx+4,h*.85,vx-2,h+10+r()*8);c.stroke()}
  return cv_}
function lgradC(c,x0,y0,x1,y1,a,b){const g=c.createLinearGradient(x0,y0,x1,y1);g.addColorStop(0,a);g.addColorStop(1,b);return g}

const SCENES={};
function buildScene(key){
  const S={key,k:[],extra:{},sky:null,sun:'#fff3b0',cloud:'rgba(255,255,255,.92)',cloudShade:'rgba(160,190,230,.35)',night:false};
  if(key==='t0'){      /* MUNDO VERDE */
    S.sky=['#6fc1f5','#b9e4fb','#fdf1d2'];
    S.k.push({k:.06,cv:layerCv(c=>{const f=ridgeFn(11,330,140);fillRidge(c,f,'#b4d8e3');c.save();c.globalCompositeOperation='source-atop';c.fillStyle=lgradC(c,0,190,0,285,'rgba(255,255,255,.95)','rgba(255,255,255,0)');c.fillRect(0,170,TW,130);c.restore();c.fillStyle=lgradC(c,0,330,0,540,'rgba(253,241,210,0)','rgba(253,241,210,.85)');c.fillRect(0,330,TW,210)})});
    S.k.push({k:.16,cv:layerCv(c=>{const f=ridgeFn(21,372,80);fillRidge(c,f,'#9fd8a8');const r=rng(5);for(let i=0;i<22;i++){const x=r()*TW;wrapAt(x,30,xx=>treeRound(c,xx,f(((xx%TW)+TW)%TW)+4,.38,i))}})});
    S.k.push({k:.32,cv:layerCv(c=>{const f=ridgeFn(31,412,58);fillRidge(c,f,'#78c98c');const r=rng(9);for(let i=0;i<9;i++){const x=r()*TW;wrapAt(x,50,xx=>treeRound(c,xx,f(((xx%TW)+TW)%TW)+5,.78,i))}for(let i=0;i<10;i++){const x=r()*TW;bush(c,x,f(x)+6,.9,'#4cb36a')}for(let i=0;i<46;i++){const x=r()*TW;flowerDot(c,x,f(x)+8+r()*14,['#ff8fb3','#fff','#ffd45e','#c9a0ff'][i%4])}})});
    S.extra.windmill=true;S.extra.birds=true;
  }else if(key==='t1'){/* ATARDECER */
    S.sky=['#5a3b8f','#ff8a6e','#ffd9a2'];S.sun='#fff0c0';S.cloud='rgba(255,214,200,.9)';S.cloudShade='rgba(200,110,130,.35)';
    S.k.push({k:.06,cv:layerCv(c=>{fillRidge(c,ridgeFn(41,330,130),'#8a62a8')})});
    S.k.push({k:.16,cv:layerCv(c=>{const f=ridgeFn(51,372,78);fillRidge(c,f,'#c4698d')})});
    S.k.push({k:.32,cv:layerCv(c=>{const f=ridgeFn(61,414,56);fillRidge(c,f,'#6a3d78');const r=rng(7);for(let i=0;i<14;i++){const x=r()*TW;wrapAt(x,40,xx=>pine(c,xx,f(((xx%TW)+TW)%TW)+6,.7+r()*.5,'#3b2557','#5a3b78'))}})});
    S.extra.birds=true;
  }else if(key==='city'){/* CIUDAD */
    S.sky=['#5d4290','#ff8f74','#ffd9a2'];S.sun='#fff0c0';S.cloud='rgba(255,208,190,.85)';S.cloudShade='rgba(190,100,130,.3)';
    S.k.push({k:.07,cv:layerCv(c=>{buildings(c,430,'#9a76b4',90,200,3,0,0);c.fillStyle=lgradC(c,0,250,0,540,'rgba(255,200,160,0)','rgba(255,200,160,.5)');c.fillRect(0,250,TW,290)})});
    S.signs=[];
    S.k.push({k:.2,cv:layerCv(c=>{S.signs[0]=buildings(c,450,'#6c4d94',110,250,8,.32,.25)})});
    S.k.push({k:.38,cv:layerCv(c=>{S.signs[1]=buildings(c,470,'#46346e',120,300,13,.55,.35)})});
    S.extra.blimp=true;
  }else if(key==='t2'){/* MUNDO CIELO */
    S.sky=['#3fa9fb','#8fd3ff','#eaf8ff'];S.cloud='rgba(255,255,255,.95)';S.cloudShade='rgba(150,190,235,.4)';
    S.k.push({k:.05,cv:layerCv(c=>{const r=rng(17);for(let i=0;i<26;i++){const x=r()*TW,y=420+r()*90,rr_=40+r()*55;wrapAt(x,rr_,xx=>{const g=c.createRadialGradient(xx,y,2,xx,y,rr_);g.addColorStop(0,'rgba(255,255,255,.85)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.beginPath();c.arc(xx,y,rr_,0,7);c.fill()})}c.fillStyle='rgba(234,248,255,.9)';c.fillRect(0,500,TW,40)})});
    S.islands=[];const r=rng(23);for(let i=0;i<6;i++){S.islands.push({img:island(90+Math.floor(r()*90),30+i,2),x:(i+r()*.7)*(TW/6),y:60+r()*150,k:i%2?.2:.32,ph:r()*6,bob:5+r()*5})}
    S.extra.balloon=true;S.extra.rays=true;
  }else{                /* MUNDO NOCTURNO */
    S.sky=['#0f0a33','#38237a','#9c64cf'];S.night=true;S.sun='#fff6d6';S.cloud='rgba(190,170,255,.2)';S.cloudShade='rgba(0,0,0,0)';
    S.k.push({k:.06,bc:'#2d2166',cv:layerCv(c=>{const f=ridgeFn(71,330,140);fillRidge(c,f,'#2d2166');c.strokeStyle='rgba(255,170,230,.35)';c.lineWidth=2;c.beginPath();for(let x=0;x<=TW;x+=8){x?c.lineTo(x,f(x)):c.moveTo(x,f(x))}c.stroke()})});
    S.k.push({k:.16,bc:'#241a55',cv:layerCv(c=>{const f=ridgeFn(81,374,80);fillRidge(c,f,'#241a55');c.strokeStyle='rgba(180,140,255,.3)';c.lineWidth=2;c.beginPath();for(let x=0;x<=TW;x+=8){x?c.lineTo(x,f(x)):c.moveTo(x,f(x))}c.stroke()})});
    S.k.push({k:.32,bc:'#1a1342',cv:layerCv(c=>{const f=ridgeFn(91,416,56);fillRidge(c,f,'#1a1342');const r=rng(4);for(let i=0;i<8;i++){const x=r()*TW;wrapAt(x,60,xx=>crystal(c,xx,f(((xx%TW)+TW)%TW)+6,.8+r()*.7,['#ff5d8f','#6ee7ff','#b88bff'][i%3]))}for(let i=0;i<7;i++){const x=r()*TW;wrapAt(x,40,xx=>mushroom(c,xx,f(((xx%TW)+TW)%TW)+6,.8+r()*.6,['#ff7ac8','#7affd0','#ffd24f'][i%3]))}})});
    S.stars=[];const r=rng(2);for(let i=0;i<70;i++)S.stars.push({x:r(),y:r(),s:r()<.15?3:2,ph:r()*6});
    S.extra.fireflies=true;S.extra.aurora=true;
  }
  return S;
}
const sceneKey=()=>L.type==='autos'?'city':'t'+L.theme;
const sceneNow=()=>SCENES[sceneKey()]||(SCENES[sceneKey()]=buildScene(sceneKey()));
const ffl=Array.from({length:26},(_,i)=>({x:Math.random(),y:.35+Math.random()*.6,ph:Math.random()*6,sp:.3+Math.random()*.6}));
function cloud2(x,y,s,S){const c=ctx;c.fillStyle=S.cloudShade;[[0,6,52,16],[34,3,34,14],[-34,4,32,12]].forEach(e=>{c.beginPath();c.ellipse(x+e[0]*s,y+e[1]*s+3,e[2]*s,e[3]*s,0,0,7);c.fill()});
  c.fillStyle=S.cloud;[[0,0,50,20],[32*1,-10,34,20],[-30,-4,30,16],[10,-18,24,16]].forEach(e=>{c.beginPath();c.ellipse(x+e[0]*s,y+e[1]*s,e[2]*s,e[3]*s,0,0,7);c.fill()})}
function drawBackground(th,t){
  const S=sceneNow(),hz=430+OY;
  const g=ctx.createLinearGradient(0,0,0,hz+40);g.addColorStop(0,S.sky[0]);g.addColorStop(.55,S.sky[1]);g.addColorStop(1,S.sky[2]);ctx.fillStyle=g;ctx.fillRect(-4,-4,W+8,H+8);
  const sx=W*.8,sy=90+OY*.32;
  if(S.night){
    S.stars.forEach(s=>{ctx.globalAlpha=.4+.55*Math.sin(t*.0016+s.ph);ctx.fillStyle='#fff';ctx.fillRect(s.x*W,s.y*(hz*.62),s.s,s.s)});ctx.globalAlpha=1;
    const hg=ctx.createRadialGradient(sx,sy,10,sx,sy,200);hg.addColorStop(0,'rgba(255,246,214,.45)');hg.addColorStop(1,'rgba(255,246,214,0)');ctx.fillStyle=hg;ctx.fillRect(sx-210,sy-210,420,420);
    ctx.fillStyle=S.sun;ctx.beginPath();ctx.arc(sx,sy,38,0,7);ctx.fill();ctx.fillStyle='#ddd0ff';[[-9,-5,7],[10,12,5],[6,-14,4]].forEach(([dx,dy,r])=>{ctx.beginPath();ctx.arc(sx+dx,sy+dy,r,0,7);ctx.fill()});
    if(S.extra.aurora&&!E2.rm.matches){for(let k=0;k<2;k++){const top=hz*(.2+k*.08),gA=ctx.createLinearGradient(0,top-30,0,top+150);const col=k?'255,143,224':'110,255,200';gA.addColorStop(0,'rgba('+col+',0)');gA.addColorStop(.3,'rgba('+col+',.2)');gA.addColorStop(1,'rgba('+col+',0)');ctx.fillStyle=gA;ctx.beginPath();for(let x=0;x<=W;x+=24){const y=top+Math.sin(x*.006+t*.0006+k*2)*28;x?ctx.lineTo(x,y):ctx.moveTo(x,y)}for(let x=W;x>=0;x-=24){ctx.lineTo(x,top+150+Math.sin(x*.004-t*.0005+k)*20)}ctx.closePath();ctx.fill()}}
  }else{
    const hg=ctx.createRadialGradient(sx,sy,10,sx,sy,220);hg.addColorStop(0,'rgba(255,240,180,.75)');hg.addColorStop(1,'rgba(255,240,180,0)');ctx.fillStyle=hg;ctx.fillRect(sx-230,sy-230,460,460);
    ctx.fillStyle=S.sun;ctx.beginPath();ctx.arc(sx,sy+(S.key==='t1'||S.key==='city'?hz*.28:0),46,0,7);ctx.fill();
    if(S.extra.rays&&!E2.rm.matches){ctx.save();ctx.translate(sx,sy);ctx.globalAlpha=.07+.03*Math.sin(t*.0008);ctx.fillStyle='#fff';for(let i=0;i<6;i++){ctx.rotate(1.0472+Math.sin(t*.0002)*.02);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-40,H*1.2);ctx.lineTo(60,H*1.2);ctx.closePath();ctx.fill()}ctx.restore();ctx.globalAlpha=1}
  }
  /* nubes (capa lenta) */
  clouds.forEach(c=>{const x=((c.x-camX*.2)%3000+3000)%3000-250;if(x<-120||x>W+120)return;cloud2(x,c.y*.8+20+OY*.25,c.s*.95,S)});
  /* islas flotantes */
  if(S.islands)S.islands.forEach(is=>{const per=TW*1.4;let x=((is.x-camX*is.k)%per+per)%per-120;for(;x<W+120;x+=per){ctx.drawImage(is.img,x,is.y+OY*.5+Math.sin(t*.0009+is.ph)*is.bob+(-camY*.05))}});
  if(S.extra.windmill)drawWindmill(E2.rm.matches?0:t,hz);
  if(!E2.rm.matches){if(S.extra.balloon)drawBalloon(t,hz);if(S.extra.blimp)drawBlimp(t,hz);if(S.extra.birds)drawBirds(t,hz)}
  /* capas con parallax */
  S.k.forEach(L_=>{const off=-(((camX*L_.k)%TW)+TW)%TW,dy=OY+LY-camY*.2*L_.k;for(let x=off;x<W;x+=TW)ctx.drawImage(L_.cv,Math.round(x),Math.round(dy));if(L_.bc){const bt=dy+TH;if(bt<H){ctx.fillStyle=L_.bc;ctx.fillRect(0,Math.round(bt)-1,W,H-bt+2)}}});
  if(S.signs){S.signs.forEach((arr,li)=>{const L_=S.k[li+1];if(!L_)return;const off=-(((camX*L_.k)%TW)+TW)%TW,dy=OY-camY*.2*L_.k;for(let x=off;x<W;x+=TW)arr.forEach(s=>{const a=.45+.45*Math.sin(t*.004+s.ph);ctx.globalAlpha=a;ctx.fillStyle=s.col;const gx=x+s.x-s.w/2,gy=s.y+dy;ctx.fillRect(gx,gy,s.w,s.h);ctx.globalAlpha=a*.35;ctx.fillRect(gx-4,gy-4,s.w+8,s.h+8);ctx.globalAlpha=1})})}
  if(S.extra.fireflies&&!E2.rm.matches){ctx.fillStyle='#e8ff9a';ffl.forEach(f=>{const x=((f.x*W+Math.sin(t*.0004*f.sp+f.ph)*40-camX*.15)%W+W)%W,y=hz*.35+(f.y-.35)*(hz*.7)+Math.cos(t*.0005*f.sp+f.ph)*18,a=.35+.5*Math.sin(t*.003+f.ph);ctx.globalAlpha=a*.3;ctx.beginPath();ctx.arc(x,y,7,0,7);ctx.fill();ctx.globalAlpha=a;ctx.beginPath();ctx.arc(x,y,1.8,0,7);ctx.fill()});ctx.globalAlpha=1}
}
function drawWindmill(t,hz){const per=1500,off=-(((camX*.2)%per)+per)%per;for(let x=off+260;x<W+80;x+=per){const y=hz-72;ctx.fillStyle='#e9d9c4';ctx.beginPath();ctx.moveTo(x-12,y+72);ctx.lineTo(x-7,y);ctx.lineTo(x+7,y);ctx.lineTo(x+12,y+72);ctx.closePath();ctx.fill();ctx.fillStyle='#c0504d';ctx.beginPath();ctx.moveTo(x-10,y);ctx.lineTo(x,y-14);ctx.lineTo(x+10,y);ctx.closePath();ctx.fill();ctx.save();ctx.translate(x,y+2);ctx.rotate(t*.0012);ctx.fillStyle='#fff7ea';for(let i=0;i<4;i++){ctx.rotate(Math.PI/2);ctx.fillRect(0,-3,34,6)}ctx.fillStyle='#7a5a4a';ctx.beginPath();ctx.arc(0,0,4,0,7);ctx.fill();ctx.restore()}}
function drawBirds(t,hz){for(let i=0;i<4;i++){const x=((t*.03*(1+i*.15)+i*340-camX*.1)%(W+200)+W+200)%(W+200)-100,y=70+i*38+OY*.3+Math.sin(t*.002+i)*8,f=Math.sin(t*.012+i*2)*5;ctx.strokeStyle='rgba(40,25,70,.55)';ctx.lineWidth=2;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x-9,y+f);ctx.quadraticCurveTo(x-4,y-3,x,y);ctx.quadraticCurveTo(x+4,y-3,x+9,y+f);ctx.stroke()}}
function drawBalloon(t,hz){const x=((t*.012-camX*.1)%(W+240)+W+240)%(W+240)-120,y=120+OY*.4+Math.sin(t*.0012)*10;ctx.fillStyle='#ff5d8f';ctx.beginPath();ctx.ellipse(x,y,18,22,0,0,7);ctx.fill();ctx.fillStyle='#ffc533';ctx.beginPath();ctx.ellipse(x,y,6,22,0,0,7);ctx.fill();ctx.strokeStyle='#7a4d30';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x-9,y+19);ctx.lineTo(x-5,y+34);ctx.moveTo(x+9,y+19);ctx.lineTo(x+5,y+34);ctx.stroke();ctx.fillStyle='#8a5a3a';ctx.fillRect(x-6,y+34,12,8)}
function drawBlimp(t,hz){const x=((t*.014-camX*.08)%(W+300)+W+300)%(W+300)-150,y=90+OY*.3;ctx.fillStyle='#e9e2f2';ctx.beginPath();ctx.ellipse(x,y,46,16,0,0,7);ctx.fill();ctx.fillStyle='#ff5d8f';ctx.fillRect(x-20,y-3,40,6);ctx.fillStyle='#7a5a9a';ctx.fillRect(x-8,y+14,16,6);ctx.beginPath();ctx.moveTo(x-42,y);ctx.lineTo(x-58,y-12);ctx.lineTo(x-54,y+10);ctx.fill()}

/* ---------- Plataformas por mundo ---------- */
const STY={
  t0:{top:'#4fc266',hi:'#94e582',d1:'#a8704a',d2:'#7a4a2f',rock:'#8f5b3b'},
  t1:{top:'#9fcb4f',hi:'#cdea7a',d1:'#b86a48',d2:'#8a4730',rock:'#9a5a3c'},
  t2:{top:'#eaf6ff',hi:'#ffffff',d1:'#cfe3f7',d2:'#8fb0d8',rock:'#a9c4e6'},
  t3:{top:'#ff5d8f',hi:'#ffb3d1',d1:'#4b3a7d',d2:'#241a55',rock:'#5a478f'}
};
function drawPlat(p,th,t,vx0,vx1,vy0,vy1){
  const key='t'+L.theme,S_=STY[key]||STY.t0;
  const pil=p.y<-1000;
  const top=Math.max(p.y,vy0-30),bot=Math.min(p.y+p.h,vy1+80);
  if(bot<=top)return;
  const x=p.x,w=p.w;
  if(pil){const g=ctx.createLinearGradient(x,0,x+w,0);g.addColorStop(0,shade(S_.d1,-10));g.addColorStop(.5,S_.d1);g.addColorStop(1,shade(S_.d2,-15));ctx.fillStyle=g;ctx.fillRect(x,top,w,bot-top);
    ctx.fillStyle='rgba(255,255,255,.07)';for(let yy=Math.floor(top/60)*60;yy<bot;yy+=60)ctx.fillRect(x,yy,w,3);return}
  /* cuerpo */
  const bg=ctx.createLinearGradient(0,p.y,0,p.y+Math.min(p.h,300));bg.addColorStop(0,shade(S_.d1,14));bg.addColorStop(1,shade(S_.d2,-14));
  ctx.fillStyle=bg;rr(ctx,x,p.y,w,bot-p.y,10);ctx.fill();
  if(p.h>60){
    ctx.save();ctx.beginPath();rr(ctx,x,p.y,w,bot-p.y,10);ctx.clip();
    ctx.fillStyle='rgba(0,0,0,.1)';for(let yy=p.y+46;yy<bot;yy+=54)ctx.fillRect(x,yy,w,3);          /* estratos */
    ctx.fillStyle=S_.rock;const x0=Math.max(x,vx0-30),x1=Math.min(x+w,vx1+30);
    for(let gx=Math.floor(x0/38)*38;gx<x1;gx+=38){const hh=hash(gx,p.y);if(hh>.55){const yy=p.y+26+hash(gx+7,p.y)*(Math.min(bot-p.y,260)-40);ctx.beginPath();ctx.ellipse(gx+10,yy,5+hh*5,3+hh*3,0,0,7);ctx.fill()}}
    ctx.restore();
  }
  /* sombra interior bajo el borde */
  ctx.fillStyle='rgba(0,0,0,.16)';rr(ctx,x,p.y+6,w,10,6);ctx.fill();
  /* borde superior */
  const th_=p.h>60?16:10;
  if(key==='t2'){ctx.fillStyle='#cfe3f7';rr(ctx,x-3,p.y-2,w+6,th_,8);ctx.fill();ctx.fillStyle='#fff';for(let bx=x;bx<x+w;bx+=26){const r_=7+hash(bx,p.y)*5;ctx.beginPath();ctx.arc(bx+10,p.y-1,r_,Math.PI,0);ctx.fill()}ctx.fillStyle='rgba(120,160,215,.35)';ctx.fillRect(x,p.y+th_-6,w,3)}
  else{
    ctx.fillStyle=shade(S_.top,-45);rr(ctx,x-3,p.y+(p.h>60?6:2),w+6,p.h>60?14:10,7);ctx.fill();
    ctx.fillStyle=lgrad(ctx,0,p.y-4,0,p.y+12,S_.hi,S_.top);rr(ctx,x-3,p.y-4,w+6,th_,8);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.25)';rr(ctx,x,p.y-3,w,3,2);ctx.fill();
    if(key==='t3'){ctx.globalAlpha=.22;ctx.strokeStyle='#ff5d8f';ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(x,p.y-1);ctx.lineTo(x+w,p.y-1);ctx.stroke();ctx.globalAlpha=.5;ctx.lineWidth=3;ctx.strokeStyle='#ffb3d1';ctx.stroke();ctx.globalAlpha=1}
    /* hierba que se mece */
    ctx.fillStyle=key==='t3'?'rgba(255,170,205,.85)':shade(S_.top,-12);ctx.beginPath();
    const xs=Math.max(x+4,vx0-10),xe=Math.min(x+w-4,vx1+10);
    for(let gx=Math.ceil(xs/15)*15;gx<xe;gx+=15){const sw=Math.sin(t*.003+gx*.05)*2.4,hh=key==='t3'?2.5+hash(gx,p.y)*2.5:5+hash(gx,p.y)*5;ctx.moveTo(gx-3,p.y-3);ctx.quadraticCurveTo(gx+sw*.5,p.y-3-hh*.6,gx+sw,p.y-3-hh);ctx.lineTo(gx+3,p.y-3)}
    ctx.fill();
    if(key==='t0'||key==='t1'){for(let gx=Math.ceil(xs/74)*74;gx<xe;gx+=74){if(hash(gx,p.y+3)>.45){const sw=Math.sin(t*.003+gx*.04)*2,fy=p.y-4;ctx.strokeStyle='#2d8a4a';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(gx,fy);ctx.lineTo(gx+sw,fy-11);ctx.stroke();ctx.fillStyle=['#ff8fb3','#fff','#ffd45e','#c9a0ff'][Math.floor(hash(gx,p.y)*4)];for(let i=0;i<5;i++){const a=i*1.2566;ctx.beginPath();ctx.arc(gx+sw+Math.cos(a)*3.2,fy-11+Math.sin(a)*3.2,2.4,0,7);ctx.fill()}ctx.fillStyle='#ffe27a';ctx.beginPath();ctx.arc(gx+sw,fy-11,2,0,7);ctx.fill()}}}
  }
}
function drawMover(p,t){const g=ctx.createLinearGradient(0,p.y,0,p.y+p.h);g.addColorStop(0,'#ffe27a');g.addColorStop(1,'#d99a00');ctx.fillStyle='rgba(0,0,0,.22)';rr(ctx,p.x,p.y+5,p.w,p.h,8);ctx.fill();ctx.fillStyle=g;rr(ctx,p.x,p.y,p.w,p.h,8);ctx.fill();ctx.fillStyle='#3b1d4a';for(let sx=p.x+6;sx<p.x+p.w-10;sx+=24){ctx.save();ctx.beginPath();ctx.moveTo(sx,p.y+p.h-4);ctx.lineTo(sx+10,p.y+4);ctx.lineTo(sx+16,p.y+4);ctx.lineTo(sx+6,p.y+p.h-4);ctx.fill();ctx.restore()}ctx.fillStyle='rgba(255,255,255,.5)';ctx.fillRect(p.x+4,p.y+2,p.w-8,2)}
function drawRoad(p,t,vx0,vx1,vy1){
  const bot=vy1+80;ctx.fillStyle=lgrad(ctx,0,p.y,0,p.y+120,'#585468','#34303f');ctx.fillRect(p.x,p.y,p.w,bot-p.y);
  ctx.fillStyle='#b9b4c6';ctx.fillRect(p.x,p.y,p.w,10);ctx.fillStyle='#8f8aa3';ctx.fillRect(p.x,p.y+10,p.w,5);
  ctx.fillStyle='#ffd24f';for(let sx=Math.max(Math.floor(vx0/70)*70,p.x);sx<Math.min(vx1+80,p.x+p.w);sx+=70)ctx.fillRect(sx,p.y+46,38,6);
  ctx.fillStyle='rgba(255,255,255,.08)';ctx.fillRect(p.x,p.y+86,p.w,2);
  /* farolas con halo */
  for(let lx=Math.floor((vx0-60)/420)*420;lx<vx1+60;lx+=420){if(lx<p.x||lx>p.x+p.w)continue;
    ctx.fillStyle='#2a2438';ctx.fillRect(lx-3,p.y-120,6,120);ctx.fillRect(lx-3,p.y-122,34,5);ctx.fillStyle='#ffe9a8';rr(ctx,lx+22,p.y-118,16,8,3);ctx.fill();
    const g=ctx.createRadialGradient(lx+30,p.y-112,2,lx+30,p.y-92,120);g.addColorStop(0,'rgba(255,233,168,.55)');g.addColorStop(1,'rgba(255,233,168,0)');ctx.fillStyle=g;ctx.fillRect(lx-100,p.y-200,260,250)}
}
function drawCar(c){
  const x=c.x,y=c.y;
  ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.ellipse(x+c.w/2,y+c.h,c.w*.5,5,0,0,7);ctx.fill();
  ctx.fillStyle=lgrad(ctx,0,y,0,y+30,shade(c.col,45),shade(c.col,-40),c.col);rr(ctx,x,y+10,c.w,20,8);ctx.fill();rr(ctx,x+c.w*.22,y,c.w*.52,18,8);ctx.fill();ctx.fillStyle='rgba(255,255,255,.3)';rr(ctx,x+6,y+12,c.w-12,3,2);ctx.fill();
  ctx.fillStyle='#bfe9ff';rr(ctx,x+c.w*.27,y+3,c.w*.18,12,3);ctx.fill();rr(ctx,x+c.w*.5,y+3,c.w*.18,12,3);ctx.fill();
  [x+c.w*.22,x+c.w*.76].forEach(wx=>{ctx.fillStyle='#222';ctx.beginPath();ctx.arc(wx,y+c.h-8,8,0,7);ctx.fill();ctx.fillStyle='#bbb';ctx.beginPath();ctx.arc(wx,y+c.h-8,3,0,7);ctx.fill()});
  const g=ctx.createRadialGradient(x-6,y+20,1,x-60,y+22,70);g.addColorStop(0,'rgba(255,246,160,.55)');g.addColorStop(1,'rgba(255,246,160,0)');ctx.fillStyle=g;ctx.fillRect(x-130,y-30,140,100);
  ctx.fillStyle='#fff6a0';rr(ctx,x-2,y+14,6,8,2);ctx.fill();ctx.fillStyle='#ff3b3b';ctx.fillRect(x+c.w-3,y+15,4,6);
}
function drawGate(g){
  const x0=camX-OX-60,x1=x0+W+120;
  ctx.fillStyle='#b52560';ctx.fillRect(x0,g.y,x1-x0,18);ctx.fillStyle=lgrad(ctx,0,g.y,0,g.y+12,'#ff7aa8','#e63a7a');ctx.fillRect(x0,g.y,x1-x0,12);
  ctx.fillStyle='rgba(255,255,255,.22)';for(let x=Math.floor(x0/60)*60+10;x<x1;x+=60)ctx.fillRect(x,g.y,30,6);
  ctx.fillStyle='#ffd23f';rr(ctx,480-60,g.y-34,120,34,10);ctx.fill();
  ctx.fillStyle='#3b1d4a';ctx.font='700 15px '+FONT;ctx.textAlign='center';ctx.fillText('¡PREGUNTA!',480,g.y-12);
}
function drawRoller(t){
  const r=300,cx=L.roller.x+60-r,cy=300;
  ctx.save();ctx.translate(cx,cy);
  ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.ellipse(0,r+8,r*.8,16,0,0,7);ctx.fill();
  ctx.save();ctx.rotate(t*.004);
  for(let i=0;i<16;i++){const a=i*Math.PI/8;ctx.fillStyle=i%2?'#ff3d7a':'#e0245e';ctx.beginPath();ctx.moveTo(Math.cos(a-.12)*r,Math.sin(a-.12)*r);ctx.lineTo(Math.cos(a)*(r+38),Math.sin(a)*(r+38));ctx.lineTo(Math.cos(a+.12)*r,Math.sin(a+.12)*r);ctx.fill()}
  const g=ctx.createRadialGradient(-80,-90,30,0,0,r);g.addColorStop(0,'#7a3a63');g.addColorStop(.6,'#4a1f42');g.addColorStop(1,'#2a1030');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,r,0,7);ctx.fill();
  ctx.strokeStyle='#7a3a63';ctx.lineWidth=10;ctx.beginPath();ctx.arc(0,0,r-40,0,7);ctx.stroke();
  ctx.restore();
  /* cara que mira hacia los jugadores */
  const fx=r*.46;ctx.fillStyle='#fff6d6';[[fx,-70],[fx+66,-52]].forEach(([x,y],i)=>{ctx.beginPath();ctx.ellipse(x,y,26,i?22:26,.2,0,7);ctx.fill();ctx.fillStyle='#d6275a';ctx.beginPath();ctx.arc(x+8,y+3,11,0,7);ctx.fill();ctx.fillStyle='#fff6d6'});
  ctx.strokeStyle='#1a0a22';ctx.lineWidth=11;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(fx-24,-112);ctx.lineTo(fx+30,-84);ctx.moveTo(fx+98,-96);ctx.lineTo(fx+46,-80);ctx.stroke();
  ctx.fillStyle='#1a0a22';ctx.beginPath();ctx.moveTo(fx-6,34);ctx.quadraticCurveTo(fx+44,12,fx+100,30);ctx.lineTo(fx+96,70);ctx.quadraticCurveTo(fx+44,52,fx-2,72);ctx.closePath();ctx.fill();
  ctx.fillStyle='#fff';for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(fx+4+i*19,32+(i%2?2:0));ctx.lineTo(fx+14+i*19,32+(i%2?2:0));ctx.lineTo(fx+9+i*19,50);ctx.fill()}
  ctx.restore();
}
function drawLava(t){
  const ly=L.lavaY,fz=L.freeze>0,x0=camX-OX-60,x1=x0+W+120,yb=camY-OY+H+120;
  const g=ctx.createLinearGradient(0,ly,0,ly+260);g.addColorStop(0,fz?'#b6e6ff':'#ff7a1f');g.addColorStop(1,fz?'#6fb8e8':'#d92b0f');
  ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(x0,yb);for(let x=x0;x<=x1;x+=20)ctx.lineTo(x,ly+Math.sin(x*.03+t*.004)*6);ctx.lineTo(x1,yb);ctx.fill();
  ctx.fillStyle=fz?'rgba(255,255,255,.45)':'rgba(255,210,63,.6)';
  ctx.beginPath();ctx.moveTo(x0,yb);for(let x=x0;x<=x1;x+=20)ctx.lineTo(x,ly+22+Math.sin(x*.05-t*.003)*5);ctx.lineTo(x1,yb);ctx.fill();
  const gl=ctx.createLinearGradient(0,ly-160,0,ly);gl.addColorStop(0,'rgba(255,90,30,0)');gl.addColorStop(1,fz?'rgba(150,220,255,.3)':'rgba(255,90,30,.38)');ctx.fillStyle=gl;ctx.fillRect(x0,ly-160,x1-x0,160);
  if(!fz&&!E2.rm.matches&&Math.random()<.35)emit({k:'d',x:rnd(x0,x1),y:ly,vx:rnd(-20,20),vy:-rnd(60,160),g:-10,life:1.1,max:1.1,r:rnd(2,4),c:'#ffb347'});
}

/* ---------- Personajes: dibujo con volumen + animación ---------- */
/* Dibujo del personaje HOT DOG (se inserta en assets/engine2.js).
   Origen en los pies; ~52 de alto sin accesorio. Opciones de avatar:
   av.color = color de la salchicha · av.bun = 0 pan normal, 1 tostado, 2 sin pan · av.hat = accesorio · av.eyes = ojos. */
function drawBean(c,cx,by,av,o){
  o=o||{};const f=o.face||1,ph=o.phase||0,mv=o.moving,air=o.air,s=o.scale||1,T=o.t||0;
  const bun=av.bun||0,h=av.hat||0;
  c.save();c.translate(cx,by);if(o.lean)c.rotate(o.lean);c.scale(s*(o.sx||1),s*(o.sy||1));if(o.alpha!=null)c.globalAlpha=o.alpha;
  const bob=mv&&!air?-Math.abs(Math.sin(ph))*2.2:0;
  const sw=mv&&!air?Math.sin(ph)*7:0,lift=air?-5:0;
  const sg=c.createRadialGradient(0,1,1,0,1,20);sg.addColorStop(0,'rgba(20,8,30,.38)');sg.addColorStop(1,'rgba(20,8,30,0)');
  c.fillStyle=sg;c.beginPath();c.ellipse(0,1,21,5.5,0,0,7);c.fill();
  c.translate(0,bob);
  const tone=bun===1?['#dca25c','#a8642a','#6a3510']:['#ffe4b0','#f2b266','#b8692a'];
  const sc=bun===1?shade(av.color,-32):av.color;
  const sxw=bun===2?15:13;
  /* zapatos y manos */
  bal(c,-8+sw,-4+lift,9,5.2,'#2c2a3e');bal(c,8-sw,-4+lift,9,5.2,'#2c2a3e');
  const ar=o.cheer?-12-Math.abs(Math.sin(T*.016))*5:(mv?Math.sin(ph+Math.PI)*6:0),arl=o.cheer?-12-Math.abs(Math.cos(T*.016))*5:(mv?-Math.sin(ph+Math.PI)*6:0);
  const gl='#f6f3fa',ax=bun===2?20:22;
  bal(c,-ax-(o.cheer?2:0),-26+(o.cheer?ar:ar*.4)-(air?8:0),6,6,gl);bal(c,ax+(o.cheer?2:0),-26+(o.cheer?arl:-arl*.4)-(air?8:0),6,6,gl);
  /* pan de atrás */
  if(bun!==2){c.fillStyle=lgrad(c,0,-48,0,-6,tone[0],tone[2],tone[1]);rr(c,-18,-47,36,41,18);c.fill()}
  /* salchicha */
  const bg=c.createRadialGradient(-5,-42,2,2,-28,38);bg.addColorStop(0,shade(sc,72));bg.addColorStop(.45,sc);bg.addColorStop(1,shade(sc,-62));
  c.fillStyle=bg;rr(c,-sxw,-53,sxw*2,50,sxw);c.fill();
  c.save();rr(c,-sxw,-53,sxw*2,50,sxw);c.clip();
  if(bun===1){c.strokeStyle='rgba(50,18,8,.5)';c.lineWidth=2.4;c.lineCap='round';[[-14,-45,-4,-50],[0,-44,13,-50],[-14,-9,-4,-5],[1,-9,13,-5]].forEach(l=>{c.beginPath();c.moveTo(l[0],l[1]);c.lineTo(l[2],l[3]);c.stroke()})}
  c.fillStyle='rgba(255,255,255,.4)';c.beginPath();c.ellipse(-6,-40,3.2,11,.1,0,7);c.fill();
  const rim=c.createLinearGradient(sxw,-40,sxw-5,-10);rim.addColorStop(0,'rgba(255,255,255,.2)');rim.addColorStop(1,'rgba(255,255,255,0)');
  c.strokeStyle=rim;c.lineWidth=3;c.beginPath();c.moveTo(sxw-1,-42);c.quadraticCurveTo(sxw,-20,sxw-5,-6);c.stroke();
  c.restore();
  /* mostaza y kétchup */
  c.lineJoin='round';c.lineCap='round';
  const zig=(y,col,w)=>{c.strokeStyle=col;c.lineWidth=w;c.beginPath();c.moveTo(-sxw+2,y);for(let i=0;i<5;i++)c.lineTo(-sxw+2+(i+1)*(sxw*2-4)/5,y+(i%2?0:5));c.stroke()};
  zig(-49,'#d9a200',4.6);zig(-49.8,'#ffd62e',3.2);zig(-17,'#a81e14',4.2);zig(-17.8,'#e8352a',2.8);
  /* pan de adelante */
  if(bun!==2){
    c.fillStyle=lgrad(c,0,-44,0,-6,tone[0],tone[2],tone[1]);
    [-1,1].forEach(sd=>{c.beginPath();c.moveTo(sd*18,-38);c.quadraticCurveTo(sd*21,-24,sd*17,-12);c.quadraticCurveTo(sd*15,-7,sd*9,-7);c.quadraticCurveTo(sd*14,-24,sd*12.5,-40);c.quadraticCurveTo(sd*15,-44,sd*18,-38);c.fill()});
    if(bun===1){c.strokeStyle='rgba(50,18,8,.5)';c.lineWidth=1.8;[-1,1].forEach(sd=>{[[-34,-26],[-24,-16]].forEach(l=>{c.beginPath();c.moveTo(sd*15.5,l[0]);c.lineTo(sd*18.5,l[1]);c.stroke()})})}
    c.strokeStyle='rgba(255,255,255,.45)';c.lineWidth=2;c.beginPath();c.moveTo(-16.5,-36);c.quadraticCurveTo(-18.5,-26,-15.5,-16);c.stroke();
  }
  if(o.boost){c.fillStyle='rgba(255,236,150,.22)';c.beginPath();c.ellipse(0,-28,24,32,0,0,7);c.fill()}
  /* cara */
  const ex=f*2,E=av.eyes,closed=!!o.blink&&!o.stun;
  const eye=(x,y,r,pr,pdx,pdy)=>{if(closed){c.strokeStyle='#1d1626';c.lineWidth=2.4;c.lineCap='round';c.beginPath();c.moveTo(x-r*.8,y+1);c.quadraticCurveTo(x,y+r*.5,x+r*.8,y+1);c.stroke();return}const g=c.createRadialGradient(x-r*.3,y-r*.3,r*.1,x,y,r);g.addColorStop(0,'#fff');g.addColorStop(1,'#dfe3f0');c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,7);c.fill();c.fillStyle='#1d1626';c.beginPath();c.arc(x+pdx,y+pdy,pr,0,7);c.fill();c.fillStyle='#fff';c.beginPath();c.arc(x+pdx-pr*.35,y+pdy-pr*.4,pr*.38,0,7);c.fill()};
  const xEye=(x,y)=>{c.strokeStyle='#1d1626';c.lineWidth=2.4;c.lineCap='round';c.beginPath();c.moveTo(x-3.5,y-3.5);c.lineTo(x+3.5,y+3.5);c.moveTo(x+3.5,y-3.5);c.lineTo(x-3.5,y+3.5);c.stroke()};
  if(o.stun){xEye(-6+ex,-32);xEye(6+ex,-32)}
  else if(E===0){eye(-6+ex,-32,4.5,2.3,f,0);eye(6+ex,-32,4.5,2.3,f,0)}
  else if(E===1){eye(-6+ex,-31,6,3,f*1.4,.8);eye(6+ex,-31,6,3,f*1.4,.8)}
  else if(E===2){c.strokeStyle='#1d1626';c.lineWidth=2.6;c.lineCap='round';c.beginPath();c.arc(-6+ex,-30,4,Math.PI*1.1,Math.PI*1.9);c.stroke();c.beginPath();c.arc(6+ex,-30,4,Math.PI*1.1,Math.PI*1.9);c.stroke()}
  else if(E===3){c.strokeStyle='#1d1626';c.lineWidth=2.6;c.lineCap='round';c.beginPath();c.moveTo(-10+ex,-31);c.lineTo(-2+ex,-31);c.moveTo(2+ex,-31);c.lineTo(10+ex,-31);c.stroke()}
  else if(E===4){c.fillStyle='#e0245e';heart(c,-6+ex,-32,3.4);heart(c,6+ex,-32,3.4);c.fillStyle='rgba(255,255,255,.7)';c.beginPath();c.arc(-7.2+ex,-33.6,1,0,7);c.arc(4.8+ex,-33.6,1,0,7);c.fill()}
  else if(E===5){eye(6+ex,-32,4.8,2.4,f,0);c.strokeStyle='#1d1626';c.lineWidth=2.6;c.lineCap='round';c.beginPath();c.moveTo(-10+ex,-30);c.quadraticCurveTo(-6+ex,-35,-2+ex,-30);c.stroke()}
  else{c.fillStyle='#ffc533';star5(c,-6+ex,-32,5.2);star5(c,6+ex,-32,5.2);c.fillStyle='rgba(255,255,255,.7)';c.beginPath();c.arc(-7.5+ex,-33.5,1,0,7);c.arc(4.5+ex,-33.5,1,0,7);c.fill()}
  c.strokeStyle='#1d1626';c.lineWidth=2;c.lineCap='round';c.beginPath();
  if(o.stun){c.arc(ex,-19,3,0,7);c.stroke()}
  else if(o.cheer){c.fillStyle='#3a1630';c.beginPath();c.arc(ex,-25,5,0,Math.PI);c.closePath();c.fill();c.fillStyle='#ff7a9a';c.beginPath();c.arc(ex,-22.3,2.4,Math.PI,0,true);c.fill()}
  else if(o.boost){c.arc(ex,-25,5,.1*Math.PI,.9*Math.PI);c.stroke()}
  else{c.arc(ex,-24,4,.15*Math.PI,.85*Math.PI);c.stroke()}
  c.fillStyle='rgba(255,93,143,.38)';c.beginPath();c.ellipse(-10.5+ex*.5,-26,2.4,1.6,0,0,7);c.ellipse(10.5+ex*.5,-26,2.4,1.6,0,0,7);c.fill();
  /* accesorios (los de arriba tienen resorte) */
  const topAcc=[1,2,3,6,9,10,11,12].includes(h);
  if(topAcc){const dy=clamp(-(o.vy||0)*.012,-4,5)+(o.cheer?Math.sin(T*.02)*2:0),rot=clamp(-(o.vx||0)*.0007,-.14,.14);c.save();c.translate(0,-52+dy);c.rotate(rot);c.translate(0,52-8)}
  if(h===1){ /* gorra */
    c.fillStyle=lgrad(c,0,-58,0,-43,'#ff6a5a','#b3201a');c.beginPath();c.arc(0,-43,13.5,Math.PI,0);c.fill();
    c.fillStyle='#8f1812';rr(c,f>0?1:-21,-46,20,5,2.5);c.fill();bal(c,0,-56.5,2.2,2.2,'#ffdd88');
  }else if(h===2){ /* sombrero de copa */
    c.fillStyle='#14141e';c.beginPath();c.ellipse(0,-43,18,4.4,0,0,7);c.fill();
    c.fillStyle=lgrad(c,-10,0,10,0,'#4a4a5c','#14141e','#2a2a38');rr(c,-10,-68,20,26,2.5);c.fill();
    c.fillStyle='#d6275a';c.fillRect(-10,-50,20,5);c.fillStyle='rgba(255,255,255,.2)';rr(c,-7,-66,3,16,1.5);c.fill();
  }else if(h===3){ /* sombrero vaquero */
    c.fillStyle='#7a4a1e';c.beginPath();c.ellipse(0,-43,23,5.5,0,0,7);c.fill();
    c.fillStyle='#8f5a26';[-1,1].forEach(sd=>{c.beginPath();c.moveTo(sd*23,-43);c.quadraticCurveTo(sd*27,-52,sd*17,-47);c.lineTo(sd*14,-44);c.fill()});
    c.fillStyle=lgrad(c,0,-60,0,-42,'#c58a4a','#8f5a26');c.beginPath();c.moveTo(-12,-43);c.quadraticCurveTo(-13,-60,-5,-57);c.quadraticCurveTo(0,-52,5,-57);c.quadraticCurveTo(13,-60,12,-43);c.closePath();c.fill();
    c.fillStyle='#4a2a10';c.fillRect(-12,-49,24,4);c.fillStyle='#ffc533';c.fillRect(-2.2,-49,4.4,4);
  }else if(h===4){ /* bigote */
    c.fillStyle=lgrad(c,0,-29,0,-23,'#5a3418','#24130a');[-1,1].forEach(sd=>{c.beginPath();c.ellipse(ex+sd*5,-26.6,6,2.9,sd*-.35,0,7);c.fill()});c.beginPath();c.ellipse(ex,-27.6,2.6,2,0,0,7);c.fill();
  }else if(h===5){ /* lentes de sol */
    c.fillStyle='rgba(20,20,30,.95)';rr(c,-13+ex,-37,12,9,3);c.fill();rr(c,1+ex,-37,12,9,3);c.fill();c.fillRect(-2+ex,-34,4,2);
    c.fillStyle='rgba(255,255,255,.38)';c.fillRect(-11+ex,-35.5,4,2);c.fillRect(3+ex,-35.5,4,2);
    c.strokeStyle='rgba(20,20,30,.9)';c.lineWidth=1.6;c.beginPath();c.moveTo(-13+ex,-34);c.lineTo(-15,-33);c.moveTo(13+ex,-34);c.lineTo(15,-33);c.stroke();
  }else if(h===6){ /* gorro de lana */
    c.fillStyle=lgrad(c,0,-58,0,-42,'#5b86f0','#2748b8');c.beginPath();c.arc(0,-42,14,Math.PI,0);c.fill();
    c.fillStyle=lgrad(c,0,-46,0,-39,'#8fabff','#3d5fd0');rr(c,-15,-46,30,7,3.5);c.fill();
    c.strokeStyle='rgba(255,255,255,.25)';c.lineWidth=1.2;for(let i=-11;i<=11;i+=5.5){c.beginPath();c.moveTo(i,-45);c.lineTo(i,-40);c.stroke()}
    bal(c,Math.sin(T*.012)*2,-58,5,5,'#ffffff');
  }else if(h===7){ /* SPIDERMAN */
    const mk=()=>{c.beginPath();rr(c,-13.4,-53.4,26.8,35,13.4)};
    mk();c.fillStyle=lgrad(c,-13,0,13,0,'#ee2a36','#9c101b','#d61f2c');c.fill();
    c.save();mk();c.clip();c.strokeStyle='rgba(20,5,10,.7)';c.lineWidth=.9;
    for(let i=0;i<8;i++){const a=i*Math.PI/4+.2;c.beginPath();c.moveTo(0,-36);c.lineTo(Math.cos(a)*30,-36+Math.sin(a)*30);c.stroke()}
    [7,13,20].forEach(r=>{c.beginPath();c.arc(0,-36,r,0,Math.PI*2);c.stroke()});
    c.fillStyle='rgba(255,255,255,.25)';c.beginPath();c.ellipse(-6,-46,3,6,.2,0,7);c.fill();c.restore();
    [-1,1].forEach(sd=>{c.save();c.translate(sd*6.4+ex*.5,-33);c.rotate(sd*.42);c.fillStyle='#fff';c.beginPath();c.ellipse(0,0,5.6,3.6,0,0,7);c.fill();c.strokeStyle='#141414';c.lineWidth=1.6;c.stroke();c.restore()});
  }else if(h===8){ /* BATMAN */
    c.fillStyle='#16161f';[-1,1].forEach(sd=>{c.beginPath();c.moveTo(sd*3,-52);c.lineTo(sd*6,-69);c.lineTo(sd*12.5,-51);c.closePath();c.fill()});
    c.fillStyle=lgrad(c,-13,0,13,0,'#2c2c3c','#0c0c14','#1a1a26');c.beginPath();c.moveTo(-13,-30);c.lineTo(-13,-40);c.quadraticCurveTo(-13,-53.4,0,-53.4);c.quadraticCurveTo(13,-53.4,13,-40);c.lineTo(13,-30);c.quadraticCurveTo(7,-25,0,-27.5);c.quadraticCurveTo(-7,-25,-13,-30);c.closePath();c.fill();
    c.fillStyle='rgba(255,255,255,.14)';c.beginPath();c.ellipse(-6,-46,2.6,5,.2,0,7);c.fill();
    [-1,1].forEach(sd=>{c.save();c.translate(sd*6+ex*.5,-33);c.rotate(sd*.32);c.fillStyle='#fff';c.beginPath();c.ellipse(0,0,4.6,2.1,0,0,7);c.fill();c.restore()});
  }else if(h===9){ /* rockero */
    c.fillStyle='#1d1530';
    [-1,1].forEach(sd=>{c.beginPath();c.moveTo(sd*11,-50);c.quadraticCurveTo(sd*19,-40,sd*17,-22);c.lineTo(sd*13,-22);c.quadraticCurveTo(sd*13,-38,sd*10,-46);c.closePath();c.fill()});
    for(let i=-3;i<=3;i++){c.beginPath();c.moveTo(i*3.6-3,-45);c.lineTo(i*3.6+i*.6,-59+Math.abs(i)*2.2);c.lineTo(i*3.6+3,-45);c.fill()}
    c.beginPath();c.arc(0,-44,12.5,Math.PI,0);c.fill();
    c.fillStyle='#e0245e';rr(c,-13.5,-47,27,5.5,2.5);c.fill();c.fillStyle='rgba(255,255,255,.75)';[-9,-3,3,9].forEach(x=>{c.beginPath();c.arc(x,-44.2,.9,0,7);c.fill()});
    c.fillStyle='#e0245e';c.beginPath();c.moveTo(12,-44);c.lineTo(20,-48);c.lineTo(19,-41);c.closePath();c.fill();
  }else if(h===10){ /* corona */
    c.fillStyle=lgrad(c,-13,-58,13,-43,'#ffe27a','#d99a00');c.beginPath();c.moveTo(-12,-43);c.lineTo(-13,-56);c.lineTo(-6,-49);c.lineTo(0,-58);c.lineTo(6,-49);c.lineTo(13,-56);c.lineTo(12,-43);c.closePath();c.fill();bal(c,0,-47,2.6,2.6,'#e63a7a');
  }else if(h===11){ /* completo chileno: palta, tomate en cubos y mayo */
    c.fillStyle=lgrad(c,0,-66,0,-45,'#b4e36a','#4c9a2a');c.beginPath();c.moveTo(-14,-45);c.quadraticCurveTo(-15,-62,-3,-62);c.quadraticCurveTo(2,-67,9,-60);c.quadraticCurveTo(16,-56,14,-45);c.closePath();c.fill();
    [[-8,-54,5.4],[1,-60,5],[8,-52,5.2],[-1,-50,4.6]].forEach(a=>{c.fillStyle='#e8352a';rr(c,a[0]-a[2]/2,a[1]-a[2]/2,a[2],a[2],1.4);c.fill();c.fillStyle='rgba(255,255,255,.45)';c.fillRect(a[0]-a[2]/2+.8,a[1]-a[2]/2+.8,a[2]*.4,1.2)});
    c.strokeStyle='#fff8e6';c.lineWidth=2.4;c.lineCap='round';c.beginPath();c.moveTo(-12,-47);c.quadraticCurveTo(-7,-53,-3,-47);c.quadraticCurveTo(1,-42,5,-47);c.quadraticCurveTo(9,-52,12,-47);c.stroke();
  }else if(h===12){ /* gorro de chef */
    [[-8,-56,7],[0,-61,8],[8,-56,7]].forEach(a=>{const g=c.createRadialGradient(a[0]-2,a[1]-2,1,a[0],a[1],a[2]);g.addColorStop(0,'#fff');g.addColorStop(1,'#d9d4e8');c.fillStyle=g;c.beginPath();c.arc(a[0],a[1],a[2],0,7);c.fill()});
    c.fillStyle='#fff';rr(c,-12,-52,24,10,2);c.fill();c.fillStyle='rgba(0,0,0,.08)';c.fillRect(-12,-45,24,3);
  }
  if(topAcc)c.restore();
  c.restore();
}

/* estado de animación por jugador (solo visual; no toca hitboxes) */
const animOf=p=>p.an||(p.an={sq:0,v:0,t:Math.random()*6,blink:1+Math.random()*3,bl:0,dust:0,cheer:0,lastHit:0,lc:p.correct||0,lw:p.wrong||0,fin:!!p.fin,out:!!p.out,trail:0});
function animStep(p,dt,wasOg,vy0){
  const a=animOf(p);
  a.v+=(-210*a.sq-15*a.v)*dt;a.sq+=a.v*dt;a.sq=clamp(a.sq,-.35,.3);
  if(!wasOg&&p.og&&vy0>260){const im=Math.min(1,vy0/950);a.sq=-.26*im;a.v=0;fxDust(p.x+p.w/2,p.y+p.h,Math.round(4+im*5),1+im);if(p===me&&im>.7)shake(2.5);if(im>.55)voice(p,'land')}
  if(wasOg&&!p.og&&p.vy<-300){a.sq=.2;a.v=0;fxDust(p.x+p.w/2,p.y+p.h,4,.8);voice(p,'jump')}
  if(!wasOg&&!p.og&&p.jumps===2&&a.lj!==2){fxDust(p.x+p.w/2,p.y+p.h,5,.8);voice(p,'jump2')}
  a.lj=p.jumps;
  a.dust-=dt;if(p.og&&Math.abs(p.vx)>170&&a.dust<=0){a.dust=.075;fxDust(p.x+p.w/2-Math.sign(p.vx)*8,p.y+p.h,1,.5)}
  a.trail-=dt;if(p===me&&Math.abs(p.vx)>262&&a.trail<=0&&p.boost>0){a.trail=.045;emit({k:'t',x:p.x+p.w/2-Math.sign(p.vx)*12,y:p.y+p.h*.55,vx:0,vy:0,g:0,life:.35,max:.35,r:9,c:'rgba(255,226,122,.9)'})}
  a.blink-=dt;if(a.blink<=0){a.bl=.13;a.blink=2.2+Math.random()*3.5}if(a.bl>0)a.bl-=dt;
  if(a.cheer>0)a.cheer-=dt;
  if(p.correct>a.lc){a.cheer=1.1;a.lc=p.correct;voice(p,'yay');if(p===me)sfxTone(1175,.2,'sine',.16,.08);fxSpark(p.x+p.w/2,p.y+8,p===me?14:6);if(p===me){fxConfetti(p.x+p.w/2,p.y,10)}}
  else if(p.correct<a.lc){a.lc=p.correct}
  if(p.wrong>a.lw){a.lw=p.wrong;a.lastHit=.6;voice(p,'oops');fxBad(p.x+p.w/2,p.y+p.h*.5);if(p===me)shake(5)}
  if(p.hit>a.lastHit+.5){a.lastHit=p.hit;a.sq=-.2;voice(p,'hit');fxBad(p.x+p.w/2,p.y+p.h*.5);if(p===me)shake(7)}
  if(a.lastHit>0)a.lastHit-=dt;
  if(p.fin&&!a.fin){a.fin=true;a.cheer=2.8;voice(p,'win');fxConfetti(p.x+p.w/2,p.y,26);fxSpark(p.x+p.w/2,p.y,16)}
  if(p.out&&!a.out){a.out=true;fxBad(p.x+p.w/2,p.y+p.h*.5);voice(p,'fall')}
}
const _step=step;
step=function(p,dt){const wasOg=p.og,vy0=p.vy;_step(p,dt);animStep(p,dt,wasOg,vy0)};

/* ---------- Etiquetas de jugadores sin solaparse ---------- */
const lblW={};
function drawLabels(items,t){
  ctx.font='700 12px '+FONT;
  items.forEach(it=>{const k=it.p.name;it.w=lblW[k]||(lblW[k]=ctx.measureText(k).width+26)});
  items.sort((a,b)=>(a.p===me?1:0)-(b.p===me?1:0)||a.x-b.x);          /* el jugador local se coloca último y conserva su sitio ideal */
  const placed=[];
  items.forEach(it=>{
    let y=it.y,tries=0;const w=it.w,x=it.x-w/2;
    const hit=yy=>placed.some(r=>x<r.x+r.w+3&&x+w>r.x-3&&yy-14<r.y+4&&yy+4>r.y-14);
    if(it.p!==me){while(hit(y)&&tries<8){y-=20;tries++}}
    placed.push({x,w,y});it.dy=y;
  });
  items.forEach(it=>{
    const me_=it.p===me,y=it.dy,w=it.w,x=it.x-w/2;
    if(me_){const by=Math.sin(t*.008)*2;ctx.fillStyle='#ffc533';ctx.beginPath();ctx.moveTo(it.x-6,y-24+by);ctx.lineTo(it.x+6,y-24+by);ctx.lineTo(it.x,y-15+by);ctx.closePath();ctx.fill()}
    ctx.fillStyle=me_?'rgba(255,197,51,.96)':'rgba(26,12,40,.62)';rr(ctx,x,y-14,w,18,9);ctx.fill();
    ctx.fillStyle=it.p.av.color;ctx.beginPath();ctx.arc(x+10,y-5,4,0,7);ctx.fill();ctx.strokeStyle=me_?'rgba(42,21,53,.5)':'rgba(255,255,255,.7)';ctx.lineWidth=1;ctx.stroke();
    ctx.fillStyle=me_?'#2a1535':'#fff';ctx.textAlign='left';ctx.fillText(it.p.name,x+19,y-1);
  });
  ctx.textAlign='center';
}
function drawPlayers(){
  const t=E2.t,x0=camX-OX-120,x1=camX-OX+W+120;
  const vis=roster.filter(p=>!p.out&&p.x>x0&&p.x<x1);
  const order=vis.filter(p=>p!==me);if(vis.includes(me))order.push(me);
  const near=new Set();
  if(roster.length>10){order.filter(p=>p!==me).sort((a,b)=>Math.abs(a.x-me.x)-Math.abs(b.x-me.x)).slice(0,6).forEach(p=>near.add(p))}
  const labels=[];
  order.forEach(p=>{
    const a=animOf(p),off=p===me?0:(hashStr(p.name)%7-3)*3;
    let sx=1,sy=1;
    if(!p.og){const st=clamp(-p.vy/2600,-.08,.14);sy=1+st;sx=1-st*.6}
    if(a.sq>0){sy*=1+a.sq;sx*=1-a.sq*.5}else{sy*=1+a.sq;sx*=1-a.sq*.6}
    if(p.og&&Math.abs(p.vx)<30)sy*=1+.022*Math.sin(t*.0042+a.t);
    const cx=p.x+p.w/2+off,fin=p.fin&&p.og;
    if(p.boost>0){const g=ctx.createRadialGradient(cx,p.y+p.h*.5,4,cx,p.y+p.h*.5,40);g.addColorStop(0,'rgba(255,226,122,.5)');g.addColorStop(1,'rgba(255,226,122,0)');ctx.fillStyle=g;ctx.fillRect(cx-44,p.y-10,88,p.h+30)}
    let jy=0;if(a.cheer>0&&p.og)jy=-Math.abs(Math.sin(t*.016))*7;
    drawBean(ctx,cx,p.y+p.h+jy,p.av,{face:p.face,phase:p.phase,moving:Math.abs(p.vx)>20,air:!p.og,alpha:p===me?1:.9,stun:p.stun>0,sx:sx,sy:sy,lean:p.og?clamp(p.vx/270*.1,-.12,.12):clamp(p.vx/270*.06,-.08,.08),t:t,blink:a.bl>0,cheer:a.cheer>0||fin,boost:p.boost>0,vy:p.vy,vx:p.vx});
    if(p.stun>0){for(let i=0;i<3;i++){const an=t*.008+i*2.094;ctx.fillStyle='#ffd45e';star5(ctx,cx+Math.cos(an)*14,p.y-6+Math.sin(an)*4,3.4)}}
    if(p===me||roster.length<=10||near.has(p))labels.push({p:p,x:cx,y:p.y-(p.av.hat?20:8)});
  });
  drawLabels(labels,t);
}

/* ---------- HUD de cristal ---------- */
function glass(x,y,w,h,r,a){ctx.fillStyle='rgba(26,12,40,'+(a||.5)+')';rr(ctx,x,y,w,h,r);ctx.fill();ctx.strokeStyle='rgba(255,255,255,.2)';ctx.lineWidth=1;ctx.stroke()}
function gpill(x,y,w,txt,col){glass(x,y,w,30,15);ctx.fillStyle=col||'#fff';ctx.font='700 16px '+FONT;ctx.textAlign='center';ctx.fillText(txt,x+w/2,y+21)}
function drawScreen(txt,clock,hot){
  const Wd=E2.hw||W,bw=Math.min(Wd-60,820),x=(Wd-bw)/2,y=(E2.hy||E2.HY)+40;
  board(x,y,bw,140,24);
  let fs=30,lines;for(const f of [30,26,22,19,16]){fs=f;ctx.font='700 '+f+'px '+FONT;lines=wrap(ctx,txt,bw-130);if(lines.length*(f+7)<=108)break}
  ctx.fillStyle='#2a1535';ctx.textAlign='center';const y0=y+70-(lines.length*(fs+7))/2+fs-4;lines.forEach((ln,i)=>ctx.fillText(ln,x+bw/2-14,y0+i*(fs+7)));
  ctx.fillStyle=hot?'#d6275a':'#ffc533';ctx.beginPath();ctx.arc(x+bw-44,y+36,24,0,7);ctx.fill();ctx.fillStyle=hot?'#fff':'#2a1535';ctx.font='800 26px '+FONT;ctx.fillText(clock,x+bw-44,y+45);
}
function drawBanner(txt,subtxt){
  const Wd=E2.hw||W,bw=Math.min(Wd-60,760),x=(Wd-bw)/2,y=(E2.hy||E2.HY)+40;
  board(x,y,bw,92,22);
  let fs=26,lines;for(const f of [26,22,19,16]){fs=f;ctx.font='700 '+f+'px '+FONT;lines=wrap(ctx,txt,bw-70);if(lines.length*(f+6)<=58)break}
  ctx.fillStyle='#2a1535';ctx.textAlign='center';const y0=y+34-(lines.length*(fs+6))/2+fs-3;lines.forEach((ln,i)=>ctx.fillText(ln,Wd/2,y0+i*(fs+6)));
  ctx.fillStyle='#65507a';ctx.font='600 14px '+FONT;ctx.fillText(subtxt,Wd/2,y+80);
}
function drawHUD(t){
  const hs=Math.max(1,Math.min(2.2,15/(16*E2.sc))),Wd=W/hs,HY=Math.round(48/(E2.sc*hs));
  E2.hw=Wd;E2.hy=HY;
  ctx.save();ctx.scale(hs,hs);
  gpill(14,HY,100,(ranking().indexOf(me)+1)+'° / '+roster.length);
  if(L.type==='cuadro'||L.type==='lluvia'){gpill(Wd/2-80,HY,160,'Ronda '+Math.min(L.round+1,L.rounds)+' / '+L.rounds)}
  else{
    const x0=134,x1=Wd-14-84-20;
    glass(x0,HY+9,x1-x0,12,6,.45);
    const tot=progTotal();
    roster.filter(p=>p!==me).concat([me]).forEach(p=>{if(p.out)return;const k=clamp(prog(p)/tot,0,1);ctx.fillStyle=p.av.color;ctx.strokeStyle=p===me?'#fff':'rgba(255,255,255,.65)';ctx.lineWidth=p===me?3:1.5;ctx.beginPath();ctx.arc(x0+6+k*(x1-x0-12),HY+15,p===me?9:5.5,0,7);ctx.fill();ctx.stroke()});
    if(L.roller){const k=clamp(L.roller.x/tot,0,1);ctx.fillStyle='#e63a7a';ctx.beginPath();ctx.arc(x0+6+k*(x1-x0-12),HY+15,6.5,0,7);ctx.fill()}
    gpill(Wd-14-84,HY,84,raceT.toFixed(1)+'s');
  }
  if(L.type==='lava'&&L.freeze>0)gpill(Wd/2-100,HY+38,200,'Lava congelada '+Math.ceil(L.freeze)+'s','#bfe9ff');
  if((L.type==='persecucion'||L.type==='cuadro')&&me.out&&state==='race')gpill(Wd/2-170,HY+38,340,'Estás eliminado · mira el final');
  if(L.type==='puente'){const st=L.stages.find(s=>s.x+130>me.x);if(st&&me.x>st.x-800)drawBanner(st.q,'A = vidrio de arriba  ·  B = vidrio de abajo')}
  if(L.type==='puertas'){const st=L.stages.find(s=>s.x+30>me.x);if(st&&me.x>st.x-900)drawBanner(st.q,'Cruza la puerta correcta')}
  if(L.type==='cuadro'&&L.q)drawScreen(L.q.q,L.phase==='think'?String(Math.max(0,Math.ceil(L.pt))):'0',L.phase==='think'&&L.pt<=3);
  if(L.type==='lluvia'&&L.q)drawScreen(L.q.q,L.phase==='rain'?String(Math.max(0,Math.ceil(L.pt))):'0',L.phase==='rain'&&L.pt<=3);
  ctx.restore();
}
function drawFinish(fx,fy,t){
  ctx.fillStyle='#fff';ctx.fillRect(fx-4,fy,8,190);ctx.fillStyle='#d9d2e6';ctx.fillRect(fx-4,fy,3,190);
  for(let i=0;i<6;i++)for(let j=0;j<2;j++){const wv=Math.sin(t*.006+i*.7)*(i*1.1);ctx.fillStyle=(i+j)%2?'#111':'#fff';ctx.fillRect(fx+4+i*14,fy+j*14+wv,14,14)}
  ctx.fillStyle='#e63a7a';rr(ctx,fx-34,fy-34,76,24,8);ctx.fill();ctx.fillStyle='#fff';ctx.font='800 17px '+FONT;ctx.textAlign='center';ctx.fillText('META',fx+4,fy-17);
  bal(ctx,fx,fy-2,6,6,'#ffc533');
}
function drawCheckpoints(t){
  if(L.type==='lava'||L.finishX>=1e8)return;
  [.25,.5,.75].forEach(f=>{const cx=L.finishX*f;const pl=L.plats.find(q=>!q.door&&!q.glass&&q.x<=cx&&cx<=q.x+q.w&&q.h>=60);if(!pl)return;
    const on=me.x>cx,y=pl.y;ctx.fillStyle='#d9d2e6';ctx.fillRect(cx-2,y-70,4,70);
    ctx.fillStyle=on?'#52d08a':'#b9b0cc';ctx.beginPath();ctx.moveTo(cx+2,y-70);for(let i=0;i<=24;i+=4)ctx.lineTo(cx+2+i,y-70+Math.sin(t*.006+i*.3)*2.5+i*.1);ctx.lineTo(cx+26,y-48);for(let i=24;i>=0;i-=4)ctx.lineTo(cx+2+i,y-48+Math.sin(t*.006+i*.3)*2.5+i*.1);ctx.closePath();ctx.fill();
    if(on){ctx.fillStyle='rgba(82,208,138,.18)';ctx.beginPath();ctx.arc(cx,y-40,34,0,7);ctx.fill()}})
}

/* ---------- Dibujo principal ---------- */
draw=function(t){
  E2.t=t;ctx.setTransform(K,0,0,K,0,0);
  const th=THEMES[L.theme];
  updCamera(E2.fdt);
  let sx=0,sy=0;if(E2.shake>.05){sx=(Math.random()-.5)*E2.shake;sy=(Math.random()-.5)*E2.shake}
  ctx.save();ctx.translate(sx,sy);
  drawBackground(th,t);
  const tA=E2.rm.matches?0:t;
  ctx.save();ctx.translate(OX-camX,OY-camY);
  const vx0=camX-OX,vx1=vx0+W,vy0=camY-OY,vy1=vy0+H;
  L.plats.forEach(p=>{
    if(p.x+p.w<vx0-40||p.x>vx1+40)return;
    if(p.door||p.tile)return;
    if(p.glass){drawGlass(p,t);return}
    if(p.mv){drawMover(p,t);return}
    if(p.road){drawRoad(p,t,vx0,vx1,vy1);return}
    drawPlat(p,th,tA,vx0,vx1,vy0,vy1);
  });
  drawCheckpoints(t);
  L.stages.forEach(s=>{if(L.type==='puertas'&&s.x>vx0-300&&s.x<vx1+300)drawDoors(s)});
  L.springs.forEach(s=>{ctx.fillStyle='rgba(0,0,0,.2)';rr(ctx,s.x,s.y-6,s.w,8,4);ctx.fill();ctx.fillStyle=lgrad(ctx,0,s.y-12,0,s.y,'#ffe27a','#d99a00');rr(ctx,s.x,s.y-12,s.w,12,5);ctx.fill();ctx.strokeStyle='#c9a21c';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(s.x+6,s.y-12);ctx.lineTo(s.x+14,s.y-2);ctx.lineTo(s.x+22,s.y-12);ctx.lineTo(s.x+30,s.y-2);ctx.stroke()});
  L.saws.forEach(s=>drawSaw(s,t));
  if(L.finishX<1e8)drawFinish(L.finishX,L.finY-190,t);
  if(L.type==='lava'){const tp=L.lp[L.lp.length-1];drawFinish(tp.x+tp.w/2,tp.y-90,t)}
  L.walls.forEach(w=>{if(!me.broken.has(w.qi))drawWall(w)});
  L.gates.forEach(g=>{if(!me.broken.has(g.qi))drawGate(g)});
  L.cars.forEach(drawCar);
  if(L.type==='cuadro'){
    L.tiles.forEach(tl=>{if(!tl.alive)return;let ox=0;if(L.phase==='shake'&&!tl.ok)ox=Math.sin(t*.06)*4;drawTile(tl,ox,430,0,(L.phase!=='think'&&tl.ok))});
    L.fallen.forEach(f=>{ctx.save();ctx.translate(f.x+f.w/2,f.y);ctx.rotate(f.rot);ctx.translate(-(f.x+f.w/2),-f.y);drawTile({x:f.x,w:f.w,i:f.i,text:f.text},0,f.y,.55,false);ctx.restore()});
    if(L.phase==='think'&&L.pt<=3&&L.pt>0&&state==='race'){ctx.fillStyle='rgba(255,255,255,.32)';ctx.font='700 170px '+FONT;ctx.textAlign='center';ctx.fillText(Math.ceil(L.pt),480,330)}
  }
  drawPlayers();
  if(L.type==='lluvia')drawLluvia(t);
  if(L.roller)drawRoller(t);
  if(L.type==='lava')drawLava(t);
  shards.forEach(s=>{ctx.globalAlpha=clamp(s.life,0,1);ctx.fillStyle=s.c;ctx.fillRect(s.x,s.y,s.s,s.s)});ctx.globalAlpha=1;
  drawParticles();
  ctx.restore();
  if(L.type==='lava'&&!L.freeze){const d=clamp(1-(L.lavaY-(me.y+me.h))/320,0,1);if(d>0){const g=ctx.createLinearGradient(0,H*.5,0,H);g.addColorStop(0,'rgba(255,80,20,0)');g.addColorStop(1,'rgba(255,80,20,'+(d*.4).toFixed(2)+')');ctx.fillStyle=g;ctx.fillRect(0,H*.5,W,H*.5)}}
  drawHUD(t);
  ctx.restore();
  if(state==='count'){
    const info=TYPES[L.type];
    ctx.fillStyle='rgba(32,14,44,.52)';ctx.fillRect(0,0,W,H);ctx.textAlign='center';
    ctx.fillStyle='#fff';ctx.font='800 '+(W<1000?44:54)+'px '+FONT;ctx.fillText(info.n,W/2,H*.2);
    ctx.fillStyle='#ffd45e';ctx.font='600 '+(W<1000?21:24)+'px '+FONT;ctx.fillText(info.tip,W/2,H*.2+42);
    const n=Math.ceil(cd),fr=n-cd,k=Math.max(0,1-fr/.4),sc=1+.3*k*k;ctx.save();ctx.translate(W/2,H*.55);ctx.scale(sc,sc);ctx.fillStyle='#fff';ctx.font='800 150px '+FONT;ctx.lineWidth=14;ctx.lineJoin='round';ctx.strokeStyle='#d6275a';const txt=n>3?'3':n>0?String(n):'¡YA!';ctx.strokeText(txt,0,50);ctx.fillText(txt,0,50);ctx.restore();
  }
};


/* ---------- Voces de personaje (síntesis WebAudio, sin archivos de audio) ---------- */
const SFX={ctx:null,master:null,on:true,lastO:0};
try{SFX.on=localStorage.getItem('br_sfx')!=='0'}catch(e){}
function sfxCtx(){
  if(!SFX.on)return null;
  if(!SFX.ctx){const A=window.AudioContext||window.webkitAudioContext;if(!A)return null;
    SFX.ctx=new A();const comp=SFX.ctx.createDynamicsCompressor(),m=SFX.ctx.createGain();m.gain.value=.9;m.connect(comp);comp.connect(SFX.ctx.destination);SFX.master=m}
  if(SFX.ctx.state==='suspended')SFX.ctx.resume();
  return SFX.ctx;
}
const VOW={o:[500,880],a:[800,1250],e:[400,2200],u:[320,800],w:[450,1100]};
/* cada personaje tiene su propia voz: tono según color/ojos, timbre según accesorio */
function voiceOf(av){const ci=Math.max(0,COLORS.indexOf(av.color));return{f:190+ci*22+(av.eyes%3)*10,t:['triangle','sawtooth','triangle','sawtooth','sine','triangle'][(av.hat||0)%6]}}
function vnote(c,t0,dur,f0,f1,vw,vol,type,vib){
  const o=c.createOscillator(),g=c.createGain(),b1=c.createBiquadFilter(),b2=c.createBiquadFilter(),g1=c.createGain(),g2=c.createGain();
  o.type=type;o.frequency.setValueAtTime(f0,t0);o.frequency.exponentialRampToValueAtTime(Math.max(60,f1),t0+dur);
  if(vib){const lf=c.createOscillator(),lg=c.createGain();lf.frequency.value=vib;lg.gain.value=f0*.05;lf.connect(lg);lg.connect(o.frequency);lf.start(t0);lf.stop(t0+dur+.05)}
  b1.type='bandpass';b1.frequency.value=vw[0];b1.Q.value=3.5;b2.type='bandpass';b2.frequency.value=vw[1];b2.Q.value=4.5;g1.gain.value=3.2;g2.gain.value=2.2;
  o.connect(b1);o.connect(b2);b1.connect(g1);b2.connect(g2);g1.connect(g);g2.connect(g);
  g.gain.setValueAtTime(0,t0);g.gain.linearRampToValueAtTime(vol,t0+.014);g.gain.exponentialRampToValueAtTime(.0001,t0+dur);
  g.connect(SFX.master);o.start(t0);o.stop(t0+dur+.06);
}
function voice(p,kind){
  const c=sfxCtx();if(!c)return;
  const mine=p===me;
  if(!mine){
    if(Math.abs(p.x-me.x)>W*.6)return;                 /* solo se oyen los que están cerca */
    const n=performance.now();if(n-SFX.lastO<150)return;SFX.lastO=n;
  }
  const v=voiceOf(p.av),t=c.currentTime+.004,V=mine?.5:.14;
  switch(kind){
    case 'jump':vnote(c,t,.16,v.f,v.f*1.75,VOW.o,V,v.t,0);break;
    case 'jump2':vnote(c,t,.15,v.f*1.4,v.f*2.2,VOW.e,V,v.t,0);break;
    case 'land':vnote(c,t,.09,v.f*.72,v.f*.45,VOW.u,V*.9,v.t,0);break;
    case 'hit':vnote(c,t,.34,v.f*1.5,v.f*.55,VOW.a,V*1.1,v.t,22);break;
    case 'yay':vnote(c,t,.12,v.f*1.2,v.f*1.5,VOW.a,V,v.t,0);vnote(c,t+.13,.22,v.f*1.7,v.f*1.95,VOW.e,V,v.t,8);break;
    case 'oops':vnote(c,t,.12,v.f*1.1,v.f,VOW.u,V,v.t,0);vnote(c,t+.15,.22,v.f*.92,v.f*.6,VOW.o,V,v.t,0);break;
    case 'fall':vnote(c,t,.75,v.f*1.8,v.f*.35,VOW.w,V*1.1,v.t,14);break;
    case 'win':[1,1.25,1.5,2].forEach((m,i)=>vnote(c,t+i*.11,.17,v.f*m*1.1,v.f*m*1.22,i%2?VOW.e:VOW.a,V,v.t,6));break;
  }
}
function sfxTone(f,d,type,vol,delay,to){const c=sfxCtx();if(!c)return;const t=c.currentTime+(delay||0),o=c.createOscillator(),g=c.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f,t);if(to)o.frequency.exponentialRampToValueAtTime(to,t+d);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g).connect(SFX.master);o.start(t);o.stop(t+d+.05)}
function paintSfx(){const b=$('#gSnd');if(!b)return;b.setAttribute('aria-pressed',SFX.on);b.setAttribute('aria-label','Sonido de personajes: '+(SFX.on?'activado':'desactivado'))}
(()=>{const b=$('#gSnd');if(!b)return;paintSfx();b.onclick=()=>{SFX.on=!SFX.on;try{localStorage.setItem('br_sfx',SFX.on?'1':'0')}catch(e){}paintSfx();if(SFX.on&&me)voice(me,'yay')};
  /* los navegadores exigen un gesto para activar el audio: lo preparamos con la primera pulsación */
  ['pointerdown','keydown'].forEach(ev=>addEventListener(ev,()=>{if(SFX.on&&$('#game').classList.contains('on'))sfxCtx()},{passive:true}))})();

/* ---------- Bucle y envoltorios ---------- */
loop=function(ts){
  const dt=Math.min(.033,(ts-lastT)/1000||0);lastT=ts;E2.fdt=dt;
  /* resolución adaptativa: si los fps caen, baja la resolución interna (y la recupera si sobra potencia) */
  E2.ema+=(dt*1000-E2.ema)*.05;E2.qT+=dt;
  if(E2.qT>2.5){E2.qT=0;if(state==='race'||state==='count'){if(E2.ema>23&&E2.q>.62){E2.q=Math.max(.62,E2.q-.14);fit()}else if(E2.ema<14.8&&E2.q<1){E2.q=Math.min(1,E2.q+.07);fit()}}}
  const online=typeof netTick==='function';
  const reps=(!online&&L&&me&&me.out&&state==='race'&&(L.type==='cuadro'||L.type==='persecucion'))?4:1;
  for(let i=0;i<reps;i++)update(dt);
  if(online)netTick(dt);
  fxUpdate(dt);
  if(state==='count'){const n=Math.ceil(cd);if(n!==E2.lc&&n>=1&&n<=3){E2.lc=n;sfxTone(520,.14,'sine',.2)}}else if(E2.ps==='count'&&state==='race'){sfxTone(784,.12,'triangle',.22);sfxTone(1175,.22,'triangle',.2,.1)}
  E2.ps=state;
  if(L)draw(ts);
  raf=requestAnimationFrame(loop);
};
const _startLevel=startLevel;
startLevel=function(){
  _startLevel();PT.length=0;E2.shake=0;roster.forEach(p=>{p.an=null});
  fit();const tg=camTarget();camX=isArena()?0:tg[0];camY=L.type==='lava'?tg[1]:0;
};
const _dropWrong=dropWrong;
dropWrong=function(){const c0=me.correct;_dropWrong();if(me.correct>c0){fxSpark(me.x+me.w/2,me.y,16)}else if(!me.out){shake(3)}};
const _breakWall=breakWall;
breakWall=function(w){_breakWall(w);shake(5);fxDust(w.x,(w.y||430)-20,10,2)};
const _answer=answer;
answer=function(i){if(!qs||qs.done)return _answer(i);const c0=me.correct;_answer(i);if(me.correct>c0)fxSpark(me.x+me.w/2,me.y,20);else{fxBad(me.x+me.w/2,me.y+20);shake(6);sfxTone(160,.28,'sawtooth',.14,0,90)}};
/* marcador animado */
let scoreShown=0,scoreRaf=0;
updScore=function(){
  const e=$('#gScore'),target=me.total+me.correct*L.unit;
  if(scoreShown===target&&e.textContent===target+' pts')return;
  cancelAnimationFrame(scoreRaf);const from=scoreShown,t0=performance.now();
  e.classList.remove('pop');void e.offsetWidth;if(target!==from)e.classList.add('pop');
  const dur=E2.rm.matches?0:Math.min(700,260+Math.abs(target-from)*2);
  const tick=n=>{const k=dur?Math.min(1,(n-t0)/dur):1,v=Math.round(from+(target-from)*(1-Math.pow(1-k,3)));e.textContent=v+' pts';scoreShown=v;if(k<1)scoreRaf=requestAnimationFrame(tick);else scoreShown=target};
  tick(t0);
};

/* ---------- Resultados: contadores animados, corona y confeti ---------- */
const CROWN='<svg class="ic crown" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8l4 4 5-7 5 7 4-4-2 11H5z"/></svg>';
function decorateResults(){
  const box=$('#rBox');if(!box)return;
  const rows=[...box.querySelectorAll('.rrow')];
  rows.forEach((r,i)=>{
    const el=r.querySelector('.pts');if(!el||el.dataset.done)return;el.dataset.done='1';
    const m=el.textContent.match(/^(\+?)(-?\d+)$/);if(!m)return;
    const to=+m[2],pre=m[1],t0=performance.now()+i*70+250,dur=E2.rm.matches?0:900;
    const tick=n=>{const k=dur?clamp((n-t0)/dur,0,1):1,v=Math.round(to*(1-Math.pow(1-k,3)));el.textContent=pre+v;if(k<1)requestAnimationFrame(tick)};
    el.textContent=pre+'0';requestAnimationFrame(tick);
  });
  if(rows[0]){rows[0].classList.add('first');const nm=rows[0].children[2];if(nm&&!nm.querySelector('.crown'))nm.insertAdjacentHTML('afterbegin',CROWN)}
  const fin=!!box.querySelector('.trophy'),won=rows[0]&&rows[0].classList.contains('me');
  if((fin||rows.length&&won)&&!E2.rm.matches&&!box.querySelector('.confetti')){
    let h='<div class="confetti" aria-hidden="true">';const cs=['#ff5d8f','#ffc533','#3d4fd1','#2a9a55','#c77dff','#fff'];
    for(let i=0;i<(won?42:22);i++)h+='<i style="left:'+(Math.random()*100).toFixed(1)+'%;background:'+cs[i%6]+';animation-delay:'+(Math.random()*.9).toFixed(2)+'s;animation-duration:'+(1.6+Math.random()*1.4).toFixed(2)+'s;--r:'+Math.floor(Math.random()*360)+'deg"></i>';
    box.insertAdjacentHTML('afterbegin',h+'</div>');
  }
}
{const f=showResults;showResults=function(){f.apply(this,arguments);decorateResults()}}
{const f=showFinal;showFinal=function(){f.apply(this,arguments);decorateResults()}}
if(typeof showResultsNet==='function'){const f=showResultsNet;showResultsNet=function(){f.apply(this,arguments);decorateResults()}}
if(typeof showFinalNet==='function'){const f=showFinalNet;showFinalNet=function(){f.apply(this,arguments);decorateResults()}}
