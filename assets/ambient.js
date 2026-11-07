/* =====================================================================
   BERRY FX · fondo vivo (frutas en 3 capas, formas orgánicas, polvo y destellos),
   parallax sutil, logo animado. Sin dependencias. Fuente única: assets/ambient.js
   ===================================================================== */
(function(){
'use strict';
if(window.BerryFx)return;
const doc=document,root=doc.documentElement;
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
const small=()=>innerWidth<=720;
const lowPower=()=>(navigator.hardwareConcurrency||8)<=4||small();
function rng(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const R=rng(20260);
const rnd=(a,b)=>a+R()*(b-a), pick=a=>a[Math.floor(R()*a.length)];

/* ---------- Sprite: frutas y adornos dibujados a mano (color por --c) ---------- */
const SPRITE=`<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>
<symbol id="fx-berry" viewBox="0 0 40 48"><ellipse cx="20" cy="28" rx="15" ry="16" fill="var(--c,#d6275a)"/><ellipse cx="20" cy="36" rx="13" ry="8" fill="#000" opacity=".12"/><ellipse cx="14" cy="22" rx="4" ry="6" fill="#fff" opacity=".32" transform="rotate(18 14 22)"/><path d="M20 12c0-4 2-7 6-8-.4 4-2 7-6 8z" fill="#2a9a55"/><path d="M20 13c-3-1-6-4-6-7 4 .6 6 3 6 7z" fill="#35b565"/></symbol>
<symbol id="fx-straw" viewBox="0 0 40 48"><path d="M20 46C8 38 3 26 5 17c1.5-7 11-8 15-3 4-5 13.500-4 15 3 2 9-3 21-15 29z" fill="var(--c,#e8294f)"/><path d="M20 46C8 38 3 26 5 17c1.5-7 11-8 15-3 4-5 13.500-4 15 3 2 9-3 21-15 29z" fill="url(#fx-sh)" opacity=".28"/><g fill="#ffe9a8"><ellipse cx="13" cy="22" rx="1.2" ry="2"/><ellipse cx="22" cy="21" rx="1.2" ry="2"/><ellipse cx="29" cy="25" rx="1.2" ry="2"/><ellipse cx="17" cy="30" rx="1.2" ry="2"/><ellipse cx="25" cy="32" rx="1.2" ry="2"/><ellipse cx="20" cy="38" rx="1.2" ry="2"/><ellipse cx="11" cy="31" rx="1.2" ry="2"/></g><ellipse cx="12" cy="19" rx="3" ry="5" fill="#fff" opacity=".3" transform="rotate(20 12 19)"/><path d="M20 15 13 8l5 3 2-8 2 8 5-3z" fill="#2a9a55"/><path d="M20 14 16 9l4 2 4-2z" fill="#35b565"/></symbol>
<symbol id="fx-blue" viewBox="0 0 40 48"><circle cx="20" cy="27" r="16" fill="var(--c,#3d4fd1)"/><circle cx="20" cy="27" r="16" fill="url(#fx-sh)" opacity=".3"/><ellipse cx="14" cy="21" rx="4" ry="6" fill="#fff" opacity=".3" transform="rotate(18 14 21)"/><path d="m20 13 3 2.500-1 3.500h-4l-1-3.500z" fill="#10163f" opacity=".7"/><path d="M20 12c-1-5 2-8 6-9-.5 4-2 7-6 9z" fill="#2a9a55" opacity=".9"/></symbol>
<symbol id="fx-rasp" viewBox="0 0 40 48"><g fill="var(--c,#c81e5e)"><circle cx="14" cy="22" r="6"/><circle cx="26" cy="22" r="6"/><circle cx="20" cy="17" r="6"/><circle cx="12" cy="31" r="6"/><circle cx="28" cy="31" r="6"/><circle cx="20" cy="29" r="6.500"/><circle cx="20" cy="39" r="6"/></g><g fill="#fff" opacity=".3"><circle cx="12" cy="20" r="2"/><circle cx="24" cy="20" r="2"/><circle cx="18" cy="15" r="2"/><circle cx="10" cy="29" r="2"/><circle cx="18" cy="27" r="2"/></g><path d="M20 12c0-4 2-7 7-8-.5 4-3 7-7 8z" fill="#2a9a55"/><path d="M19 12c-3-1-7-3-8-7 4 .5 7 3 8 7z" fill="#35b565"/></symbol>
<symbol id="fx-leaf" viewBox="0 0 40 48"><path d="M20 3C8 13 5 28 20 45c15-17 12-32 0-42z" fill="var(--c,#2a9a55)"/><path d="M20 8v34" stroke="#fff" stroke-width="1.800" opacity=".4" stroke-linecap="round" fill="none"/><path d="M20 20l-7-5M20 28l-8-6M20 20l7-5M20 28l8-6" stroke="#fff" stroke-width="1.200" opacity=".3" stroke-linecap="round" fill="none"/></symbol>
<symbol id="fx-star" viewBox="0 0 40 40"><path d="M20 3l5 11.500 12.500 1.200-9.400 8.400 2.800 12.300L20 30l-10.900 6.400 2.800-12.300L2.500 15.700 15 14.500z" fill="var(--c,#ffc533)" stroke="#d99a00" stroke-width="1.600" stroke-linejoin="round"/><path d="M20 7l3.500 8.500" stroke="#fff" stroke-width="2" opacity=".6" stroke-linecap="round" fill="none"/></symbol>
<symbol id="fx-coin" viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" fill="var(--c,#ffc533)" stroke="#d99a00" stroke-width="2"/><circle cx="20" cy="20" r="11.500" fill="none" stroke="#d99a00" stroke-width="1.500" opacity=".7"/><path d="M20 12l2.400 5 5.400.6-4 3.700 1.100 5.300-4.900-2.700-4.900 2.700 1.100-5.300-4-3.700 5.400-.6z" fill="#fff" opacity=".85"/></symbol>
<symbol id="fx-heart" viewBox="0 0 40 40"><path d="M20 35C6 26 3 17 8 11c4-4 9-2 12 3 3-5 8-7 12-3 5 6 2 15-12 24z" fill="var(--c,#ff5d8f)"/><ellipse cx="12" cy="14" rx="3" ry="4.500" fill="#fff" opacity=".35" transform="rotate(25 12 14)"/></symbol>
<symbol id="fx-spark" viewBox="0 0 40 40"><path d="M20 1c1.500 10 3 16 6 19 3 3 8 4.500 13 5-5 .5-10 2-13 5-3 3-4.500 9-6 14-1.500-5-3-11-6-14-3-3-8-4.500-13-5 5-.5 10-2 13-5 3-3 4.500-9 6-19z" fill="var(--c,#fff)"/></symbol>
<linearGradient id="fx-sh" x1="0" y1="0" x2="1" y2="1"><stop offset=".4" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000"/></linearGradient>
</defs></svg>`;
const VB={berry:'0 0 40 48',straw:'0 0 40 48',blue:'0 0 40 48',rasp:'0 0 40 48',leaf:'0 0 40 48',star:'0 0 40 40',coin:'0 0 40 40',heart:'0 0 40 40',spark:'0 0 40 40'};
const COL={berry:['#d6275a','#3d4fd1','#7b3fa0'],straw:['#e8294f','#ff4d63'],blue:['#3d4fd1','#4a5fe8'],rasp:['#c81e5e','#e0457b'],leaf:['#2a9a55','#35b565'],star:['#ffc533'],coin:['#ffc533'],heart:['#ff5d8f'],spark:['#ffd45e']};
const svg=(t,c)=>`<svg viewBox="${VB[t]}" style="--c:${c}" aria-hidden="true"><use href="#fx-${t}"/></svg>`;

/* ---------- Formas orgánicas (Catmull-Rom cerrado → cúbicas, morph SMIL) ---------- */
function blobPath(seed,n){
  const r=rng(seed),pts=[];
  for(let i=0;i<n;i++){const a=i/n*Math.PI*2,rad=38+r()*12;pts.push([50+Math.cos(a)*rad,50+Math.sin(a)*rad])}
  let d='M'+pts[0].map(v=>v.toFixed(1)).join(' ');
  for(let i=0;i<n;i++){
    const p0=pts[(i-1+n)%n],p1=pts[i],p2=pts[(i+1)%n],p3=pts[(i+2)%n];
    const c1=[p1[0]+(p2[0]-p0[0])/6,p1[1]+(p2[1]-p0[1])/6],c2=[p2[0]-(p3[0]-p1[0])/6,p2[1]-(p3[1]-p1[1])/6];
    d+='C'+c1.map(v=>v.toFixed(1)).join(' ')+' '+c2.map(v=>v.toFixed(1)).join(' ')+' '+p2.map(v=>v.toFixed(1)).join(' ');
  }
  return d+'Z';
}
function blob(cls,fillVar,seed,dur){
  const vals=[0,1,2].map(k=>blobPath(seed+k*17,8)).concat(blobPath(seed,8)).join(';');
  const anim=reduce.matches?'':`<animate attributeName="d" dur="${dur}s" repeatCount="indefinite" calcMode="spline" keyTimes="0;.33;.66;1" keySplines=".45 0 .55 1;.45 0 .55 1;.45 0 .55 1" values="${vals}"/>`;
  return `<div class="fx-blob ${cls}"><svg viewBox="0 0 100 100"><path d="${blobPath(seed,8)}" style="fill:var(${fillVar})">${anim}</path></svg></div>`;
}

/* ---------- Construcción ---------- */
const FA=['fxFA','fxFB','fxFC'],SA=['fxSA','fxSB','fxSC'];
function item(t,s,x,y,op,extra){
  const c=pick(COL[t]);
  const e=doc.createElement('div');
  e.className='fxi'+(extra||'');
  e.style.cssText=`left:${x}%;top:${y}%;--s:${s}px;--op:${op};--r:${rnd(-25,25).toFixed(0)}deg;--fa:${pick(FA)};--sa:${pick(SA)};--d1:${rnd(8,17).toFixed(1)}s;--d2:${rnd(5,11).toFixed(1)}s;--dl1:${(-rnd(0,12)).toFixed(1)}s;--dl2:${(-rnd(0,8)).toFixed(1)}s`;
  e.innerHTML=`<div class="fxo"><div class="fxs">${svg(t,c)}</div></div>`;
  return e;
}
function build(){
  const low=lowPower(),sm=small(),sc=sm?.72:1,fx=doc.createElement('div');
  fx.className='fx';fx.setAttribute('aria-hidden','true');
  fx.innerHTML=SPRITE+'<div class="fx-glow g1"></div><div class="fx-glow g2"></div><div class="fx-glow g3"></div>'
    +blob('b1','--blob',7,26)+blob('b2','--blob2',31,32)+(low?'':blob('b3','--blob3',53,29));
  const layers=[
    {d:6,types:['blue','rasp','leaf','berry','heart','straw'],n:low?4:9,size:[20,34],op:[.3,.44],edge:false},
    {d:14,types:['straw','berry','blue','rasp','leaf','star','coin'],n:low?5:9,size:[34,52],op:[.42,.6],edge:false},
    {d:28,types:['straw','berry','star','coin','heart','rasp'],n:low?2:5,size:[58,86],op:[.7,.85],edge:true}
  ];
  layers.forEach((L,li)=>{
    const el=doc.createElement('div');el.className='fx-layer';el.style.setProperty('--d',L.d);
    for(let i=0;i<L.n;i++){
      const t=pick(L.types),slot=(i+R()*.7)/L.n;
      const x=L.edge?(i%2?(sm?rnd(93,104):rnd(86,98)):(sm?rnd(-4,7):rnd(0,7))):slot*100,y=L.edge?rnd(10,90):rnd(6,94);
      el.appendChild(item(t,rnd(L.size[0],L.size[1])*sc,x,y,(rnd(L.op[0],L.op[1])*(sm&&li===1?.7:1)).toFixed(2),''));
    }
    /* algunas frutas suben lentamente como burbujas */
    if(li>0&&!reduce.matches){for(let i=0;i<(low?1:li+1);i++){
      const e=item(pick(['straw','berry','blue','heart','star']),rnd(L.size[0],L.size[1])*sc,sm?(R()<.5?rnd(-2,8):rnd(92,102)):rnd(5,95),0,(rnd(L.op[0],L.op[1])*(sm?.7:1)).toFixed(2),' rise');
      e.style.setProperty('--rd',rnd(34,58).toFixed(0)+'s');e.style.setProperty('--rdl',(-rnd(0,40)).toFixed(0)+'s');e.style.setProperty('--dx',rnd(-60,60).toFixed(0)+'px');
      el.appendChild(e)}}
    /* destellos fijos que titilan */
    if(li===1)for(let i=0;i<(low?3:6);i++)el.appendChild(item('spark',rnd(14,26),rnd(5,95),rnd(8,92),.9,' twinkle'));
    fx.appendChild(el);
  });
  fx.insertAdjacentHTML('beforeend','<canvas class="fx-dust"></canvas>');
  doc.body.insertBefore(fx,doc.body.firstChild);
  return fx;
}

/* ---------- Polvo y destellos (canvas 2D, pausa al ocultarse) ---------- */
function dust(fx){
  const cv=fx.querySelector('.fx-dust'),c=cv.getContext('2d');
  let W=0,H=0,dpr=1,P=[],S=[],last=0,raf=0,nextS=1200;
  const dark=()=>root.dataset.theme==='dark'||(root.dataset.theme!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches);
  function size(){dpr=Math.min(devicePixelRatio||1,1.5);W=innerWidth;H=innerHeight;cv.width=W*dpr;cv.height=H*dpr;
    const n=lowPower()?14:30;P=[];for(let i=0;i<n;i++)P.push({x:Math.random()*W,y:Math.random()*H,r:Math.random()*2+.6,vy:-(6+Math.random()*16),vx:(Math.random()-.5)*8,ph:Math.random()*6.28,k:Math.floor(Math.random()*3)})}
  function frame(t){
    const dt=Math.min(.05,(t-last)/1000||0);last=t;
    if(doc.hidden||doc.body.dataset.screen==='game'){raf=requestAnimationFrame(frame);return}
    c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,W,H);
    const d=dark(),cols=d?['255,255,255','255,150,190','255,214,100']:['255,93,143','255,185,0','123,63,160'];
    for(const p of P){
      p.x+=p.vx*dt+Math.sin(p.ph+t/2200)*.12;p.y+=p.vy*dt;p.ph+=dt;
      if(p.y<-8){p.y=H+8;p.x=Math.random()*W}if(p.x<-8)p.x=W+8;if(p.x>W+8)p.x=-8;
      const a=(.35+.35*Math.sin(p.ph*1.6))*(d?.9:.7);
      c.fillStyle=`rgba(${cols[p.k]},${a.toFixed(2)})`;c.beginPath();c.arc(p.x,p.y,p.r,0,6.283);c.fill();
    }
    nextS-=dt*1000;if(nextS<=0){nextS=1400+Math.random()*2600;S.push({x:Math.random()*W,y:Math.random()*H*.9,r:7+Math.random()*9,t:0})}
    for(const s of S){s.t+=dt/.9;const k=Math.sin(Math.min(1,s.t)*Math.PI),r=s.r*k;
      c.save();c.translate(s.x,s.y);c.rotate(s.t*.8);c.fillStyle=d?'rgba(255,255,255,.95)':'rgba(255,184,0,.95)';
      c.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4,rr=i%2?r*.22:r;c.lineTo(Math.cos(a)*rr,Math.sin(a)*rr)}c.closePath();c.fill();c.restore()}
    S=S.filter(s=>s.t<1);
    raf=requestAnimationFrame(frame);
  }
  size();addEventListener('resize',size);
  if(reduce.matches){/* un solo cuadro estático */frame(0);cancelAnimationFrame(raf);return}
  raf=requestAnimationFrame(frame);
}

/* ---------- Parallax (ratón o inclinación del dispositivo) ---------- */
function parallax(){
  if(reduce.matches)return;
  let tx=0,ty=0,x=0,y=0,run=false;
  const loop=()=>{x+=(tx-x)*.07;y+=(ty-y)*.07;root.style.setProperty('--px',x.toFixed(3));root.style.setProperty('--py',y.toFixed(3));
    if(Math.abs(tx-x)>.002||Math.abs(ty-y)>.002)requestAnimationFrame(loop);else run=false};
  const kick=()=>{if(!run){run=true;requestAnimationFrame(loop)}};
  addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;tx=(e.clientX/innerWidth-.5)*2;ty=(e.clientY/innerHeight-.5)*2;kick()},{passive:true});
  if('DeviceOrientationEvent' in window&&typeof DeviceOrientationEvent.requestPermission!=='function'&&matchMedia('(pointer:coarse)').matches){
    addEventListener('deviceorientation',e=>{if(e.gamma==null)return;tx=Math.max(-1,Math.min(1,e.gamma/25));ty=Math.max(-1,Math.min(1,((e.beta||0)-45)/25));kick()},{passive:true});
  }
}

/* ---------- Logo: letras que caen con rebote, brillo y salto al pasar el cursor ---------- */
function logo(h){
  if(!h||h.dataset.split)return;h.dataset.split='1';
  h.setAttribute('aria-label',h.textContent.replace(/\s+/g,' ').trim());
  let i=0;const out=doc.createDocumentFragment();
  h.childNodes.forEach(n=>{
    const el=n.nodeType===1,wrap=el?doc.createElement('span'):doc.createDocumentFragment();
    if(el)wrap.className=n.className;
    [...n.textContent].forEach(ch=>{
      const s=doc.createElement('span');s.setAttribute('aria-hidden','true');
      if(ch===' '||ch===' '){s.className='sp';s.innerHTML='&nbsp;'}
      else{s.className='ch';s.dataset.c=ch;s.textContent=ch;s.style.setProperty('--i',i++)}
      wrap.appendChild(s);
    });
    out.appendChild(wrap);
  });
  h.textContent='';h.appendChild(out);h.classList.add('logo');h.classList.remove('rise');h.style.removeProperty('--i');
  h.style.animation='none';
  setTimeout(()=>{h.style.animation='';h.classList.add('settled')},reduce.matches?0:140+i*62+900);
}

function init(){
  const fx=build();dust(fx);parallax();
  doc.addEventListener('visibilitychange',()=>root.classList.toggle('fx-paused',doc.hidden));
  reduce.addEventListener&&reduce.addEventListener('change',()=>location.reload());
}
window.BerryFx={logo,item,svg};
if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',init);else init();
})();
