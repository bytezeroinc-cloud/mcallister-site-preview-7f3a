/* Law Office of Aaron P. McAllister — shared behaviour.
   Every handler is written to no-op when its element is absent, so the same
   file serves the homepage and the pillar pages. */
(()=>{
const S=location.search.includes('static');
if(S)document.documentElement.classList.add('static');
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;

/* intro veil */
const veil=document.getElementById('veil');
if(veil&&!S&&!RM){
  requestAnimationFrame(()=>veil.classList.add('on'));
  setTimeout(()=>veil.classList.add('off'),1050);
  setTimeout(()=>veil.remove(),1900);
}else if(veil){veil.remove()}

/* section reveal orchestration: .io containers get .in; children cascade via CSS */
const io=new IntersectionObserver(es=>es.forEach(e=>{
  if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}
}),{threshold:.16,rootMargin:'0px 0px -8% 0px'});
document.querySelectorAll('.io').forEach(el=>io.observe(el));
/* stragglers outside .io containers */
const io2=new IntersectionObserver(es=>es.forEach(e=>{
  if(e.isIntersecting){e.target.classList.add('in');io2.unobserve(e.target)}
}),{threshold:.2});
document.querySelectorAll('.r,.plate').forEach(el=>{if(!el.closest('.io'))io2.observe(el)});

/* ── one rAF loop: smoothed parallax, seal rotation, progress bar, header ── */
const hdr=document.getElementById('hdr'), bar=document.getElementById('bar');
const utilEl=document.querySelector('.util');
const audEl=document.querySelector('.audbar');
const setUtilH=()=>{
  const r=document.documentElement.style;
  r.setProperty('--util-h',(utilEl?utilEl.offsetHeight:0)+'px');
  if(hdr)r.setProperty('--hdr-h',hdr.offsetHeight+'px');
  if(audEl)r.setProperty('--aud-h',audEl.offsetHeight+'px');
};
setUtilH();addEventListener('resize',setUtilH);addEventListener('load',setUtilH);
/* a resize event alone can miss the util bar re-wrapping (font swap, snapshot
   renderers, orientation) — a stale tall value shortens both heroes, so the
   bar is observed directly */
if(window.ResizeObserver){const ro=new ResizeObserver(setUtilH);
  if(utilEl)ro.observe(utilEl);if(hdr)ro.observe(hdr);}
const paras=[...document.querySelectorAll('[data-p]')].map(el=>({el,f:parseFloat(el.dataset.p),rot:parseFloat(el.dataset.rot||0),cur:0,mid:0}));
/* Parallax is measured from the element's own centre, not from scrollY.
   Keyed to scrollY the offset grows without bound down the page — an element
   7000px down with f=-0.05 is dragged 350px upward, which is what put the
   justice figure on top of the #defend headline. Measuring from the element's
   distance to the viewport centre keeps every offset inside ±innerHeight*f and
   makes the effect identical wherever the section sits.
   The transform is cleared while measuring so the reading can't feed back. */
const measure=()=>{for(const p of paras){const t=p.el.style.transform;p.el.style.transform='none';
  const r=p.el.getBoundingClientRect();p.mid=r.top+scrollY+r.height/2;p.el.style.transform=t;}};
measure();addEventListener('resize',measure);addEventListener('load',measure);
let target=scrollY;
addEventListener('scroll',()=>{target=scrollY},{passive:true});
const lerp=(a,b,t)=>a+(b-a)*t;
function frame(){
  if(hdr)hdr.classList.toggle('stuck',target>180);
  if(bar){const max=document.documentElement.scrollHeight-innerHeight;
    bar.style.width=(max>0?(target/max)*100:0)+'%';}
  if(!S&&!RM){
    for(const p of paras){
      const want=-(p.mid-target-innerHeight/2)*p.f;
      p.cur=lerp(p.cur,want,.085);
      const r=p.rot?` rotate(${(target*p.rot).toFixed(2)}deg)`:'';
      const base=p.el.classList.contains('sealwrap')?'translate(-50%,-50%) ':'';
      p.el.style.transform=`${base}translate3d(0,${p.cur.toFixed(2)}px,0)${r}`;
    }
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/* drawer */
const burger=document.getElementById('burger');
if(burger){
  burger.addEventListener('click',()=>{
    const open=document.body.classList.toggle('menu-open');
    burger.setAttribute('aria-expanded',open);
  });
  document.querySelectorAll('.drawer a').forEach(a=>a.addEventListener('click',()=>{
    document.body.classList.remove('menu-open');burger.setAttribute('aria-expanded',false);
  }));
}
addEventListener('keydown',e=>{if(e.key==='Escape')document.body.classList.remove('menu-open')});

/* active nav link — homepage anchors only */
const links=[...document.querySelectorAll('#menu a[href^="#"]')];
const secIO=new IntersectionObserver(es=>es.forEach(e=>{
  if(e.isIntersecting){
    links.forEach(l=>l.classList.toggle('on',l.getAttribute('href')==='#'+e.target.id));
  }
}),{rootMargin:'-40% 0px -55% 0px'});
['attorney','practice','matters','defend','faq'].forEach(id=>{const el=document.getElementById(id);if(el)secIO.observe(el)});

/* count-up */
const cio=new IntersectionObserver(es=>es.forEach(e=>{
  if(!e.isIntersecting)return;cio.unobserve(e.target);
  const el=e.target,to=+el.dataset.to;
  if(S||RM){el.textContent=to;return}
  const t0=performance.now(),dur=1600;
  const tick=t=>{const k=Math.min(1,(t-t0)/dur);el.textContent=Math.round(to*(1-Math.pow(1-k,3)));if(k<1)requestAnimationFrame(tick)};
  requestAnimationFrame(tick);
}),{threshold:.7});
document.querySelectorAll('.cnt').forEach(el=>cio.observe(el));

/* testimonial carousel: arrows + drag */
const tq=document.getElementById('tq'),tqt=document.getElementById('tqt');
if(tq&&tqt&&tqt.children.length){
  let ti=0;
  const stepW=()=>{const c=tqt.children[0];return c.offsetWidth+(parseFloat(getComputedStyle(tqt).gap)||18)};
  const maxT=()=>Math.max(0,tqt.children.length-Math.max(1,Math.floor(tq.offsetWidth/stepW())));
  const paintT=()=>{ti=Math.max(0,Math.min(ti,maxT()));tqt.style.transform=`translateX(${-ti*stepW()}px)`};
  const tn=document.getElementById('tn'),tp=document.getElementById('tp');
  if(tn)tn.onclick=()=>{ti=ti>=maxT()?0:ti+1;paintT()};
  if(tp)tp.onclick=()=>{ti=ti<=0?maxT():ti-1;paintT()};
  addEventListener('resize',paintT);addEventListener('load',paintT);paintT();
  let tx0=null;
  tq.addEventListener('pointerdown',e=>tx0=e.clientX);
  addEventListener('pointerup',e=>{if(tx0===null)return;const dx=e.clientX-tx0;
    if(Math.abs(dx)>48){ti=Math.max(0,Math.min(maxT(),ti+(dx<0?1:-1)));paintT()}tx0=null});
}

/* accordions: one open per group */
document.querySelectorAll('.acc').forEach(acc=>{
  acc.querySelectorAll('details').forEach(d=>d.addEventListener('toggle',()=>{
    if(d.open)acc.querySelectorAll('details').forEach(o=>{if(o!==d)o.open=false});
  }));
});

/* chips */
const chips=[...document.querySelectorAll('#chips button')];
chips.forEach(c=>c.onclick=()=>chips.forEach(x=>x.classList.toggle('sel',x===c)));

/* ── pillar / charge pages ───────────────────────────────────────────────── */

/* audience switch: FULL PAGE · FOR A CLIENT · FOR COUNSEL.
   Sets a mode class on <body>; CSS hides the blocks that mode does not want. */
const aud=document.getElementById('aud');
if(aud){
  const modes=['full','client','counsel'];
  const set=m=>{
    modes.forEach(x=>document.body.classList.toggle('aud-'+x,x===m));
    aud.querySelectorAll('button').forEach(b=>{
      const on=b.dataset.aud===m;
      b.classList.toggle('sel',on);b.setAttribute('aria-pressed',on);
    });
    try{sessionStorage.setItem('am-aud',m)}catch(e){}
  };
  aud.querySelectorAll('button').forEach(b=>b.onclick=()=>set(b.dataset.aud));
  let start='full';
  try{const v=sessionStorage.getItem('am-aud');if(modes.includes(v))start=v}catch(e){}
  set(start);
}

/* on-page contents rail: highlight the section in view, smooth-scroll to it */
const rail=document.getElementById('onpage');
if(rail){
  const rlinks=[...rail.querySelectorAll('a[href^="#"]')];
  const targets=rlinks.map(a=>document.getElementById(a.getAttribute('href').slice(1))).filter(Boolean);
  if(targets.length){
    const rio=new IntersectionObserver(es=>{
      es.forEach(e=>{
        if(!e.isIntersecting)return;
        rlinks.forEach(l=>l.classList.toggle('on',l.getAttribute('href')==='#'+e.target.id));
      });
    },{rootMargin:'-18% 0px -70% 0px'});
    targets.forEach(t=>rio.observe(t));
  }
}

/* height probe */
const setH=()=>requestAnimationFrame(()=>{document.body.dataset.h=document.documentElement.scrollHeight});
document.addEventListener('DOMContentLoaded',setH);addEventListener('load',setH);
})();


/* ── case-file deck carousel ──
   Any .deckvp[data-deck] becomes a rail: arrows step one card, a timer steps
   every 4.6s (paused on hover, off under reduced-motion/static), and the
   counter reads position / positions. Sizing is re-read on every move so a
   resize can't strand the track. */
(()=>{
const S=location.search.includes('static');
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
document.querySelectorAll('.deckvp[data-deck]').forEach(vp=>{
  const track=vp.querySelector('.deck');if(!track)return;
  const cards=[...track.children];if(cards.length<2)return;
  const root=vp.parentElement;
  const bk=root.querySelector('.arrows .bk'),fwd=root.querySelector('.arrows .fwd'),ct=root.querySelector('.arrows .ct');
  const vis=()=>innerWidth<=640?1:innerWidth<=1040?2:3;
  const maxI=()=>Math.max(0,cards.length-vis());
  let i=0;
  const go=n=>{i=Math.max(0,Math.min(maxI(),n));
    const gap=parseFloat(getComputedStyle(track).gap)||0;
    const w=cards[0].getBoundingClientRect().width+gap;
    track.style.transform=`translateX(${(-i*w).toFixed(1)}px)`;
    if(ct)ct.textContent=String(i+1).padStart(2,'0')+' / '+String(maxI()+1).padStart(2,'0');};
  if(bk)bk.onclick=()=>go(i-1);
  if(fwd)fwd.onclick=()=>go(i>=maxI()?0:i+1);
  addEventListener('resize',()=>go(i));
  if(!S&&!RM){let t=setInterval(()=>go(i>=maxI()?0:i+1),4600);
    vp.addEventListener('mouseenter',()=>clearInterval(t));
    vp.addEventListener('mouseleave',()=>{t=setInterval(()=>go(i>=maxI()?0:i+1),4600)});}
  go(0);
});
})();


/* ── practice-areas hub: live filter ──
   Types a charge, keeps the dockets that mention it, and highlights the
   matching lines so the team can see *why* a docket matched. Plain substring
   matching on a pre-lowered data-search attribute — no index, no library. */
(()=>{
const q=document.getElementById('dkq'); if(!q)return;
const grid=document.getElementById('dkgrid');
const cards=[...grid.querySelectorAll('.dkcard')];
const none=document.getElementById('dknone');
const count=document.getElementById('dkcount');
const areas=cards.map(c=>[...c.querySelectorAll('.dkareas li')]);
const totalAreas=areas.reduce((n,a)=>n+a.length,0);
const clear=li=>{if(li.dataset.raw){li.textContent=li.dataset.raw;delete li.dataset.raw}li.classList.remove('hit')};
const run=()=>{
  const t=q.value.trim().toLowerCase();
  let shown=0, matched=0;
  cards.forEach((c,i)=>{
    areas[i].forEach(clear);
    if(!t){c.hidden=false;shown++;matched+=areas[i].length;return}
    const hit=c.dataset.search.includes(t);
    c.hidden=!hit;
    if(hit){
      shown++;
      areas[i].forEach(li=>{
        if(li.textContent.toLowerCase().includes(t)){
          li.dataset.raw=li.textContent; li.classList.add('hit'); matched++;
        }
      });
    }
  });
  none.hidden=shown>0;
  count.textContent = t
    ? `${matched} area${matched===1?'':'s'} in ${shown} docket${shown===1?'':'s'}`
    : `${totalAreas} areas \u00B7 ${cards.length} dockets`;
};
q.addEventListener('input',run);
q.addEventListener('keydown',e=>{if(e.key==='Escape'){q.value='';run();q.blur()}});
run();
})();


/* ── insights archive: live filter + category chips ──
   Same substring approach as the practice-areas hub, plus a chip row that
   narrows by docket. Chip and query compose: pick "DUI Defense", type
   "dmv", and you get the intersection. Featured card hides whenever a
   filter is active, so it never duplicates a result below it. */
(()=>{
const q=document.getElementById('arq'); if(!q)return;
const grid=document.getElementById('argrid');
const cards=[...grid.querySelectorAll('.dkcard')];
const chips=[...document.querySelectorAll('.archip')];
const none=document.getElementById('arnone');
const count=document.getElementById('arcount');
const feat=document.getElementById('arfeat');
let cat='';
const run=()=>{
  const t=q.value.trim().toLowerCase();
  const filtering=!!(t||cat);
  let shown=0;
  cards.forEach(c=>{
    const hit=(!t||c.dataset.search.includes(t))&&(!cat||c.dataset.cat===cat);
    // the lead article has a card here too so search can reach it, but while
    // nothing is filtered the featured block above is already showing it
    c.hidden=!hit || (!filtering && c.dataset.lead==='1');
    if(hit)shown++;
  });
  if(feat)feat.hidden=filtering;
  none.hidden=shown>0;
  count.textContent = filtering
    ? `${shown} article${shown===1?'':'s'}`
    : `${cards.length} articles · ${new Set(cards.map(c=>c.dataset.cat)).size} dockets`;
};
q.addEventListener('input',run);
q.addEventListener('keydown',e=>{if(e.key==='Escape'){q.value='';run();q.blur()}});
chips.forEach(ch=>ch.addEventListener('click',()=>{
  const v=ch.dataset.cat||'';
  cat = (cat===v) ? '' : v;                       // second click clears
  chips.forEach(o=>o.setAttribute('aria-pressed', String((o.dataset.cat||'')===cat)));
  run();
}));
run();
})();
