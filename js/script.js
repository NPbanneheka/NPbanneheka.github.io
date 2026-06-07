const screens = [...document.querySelectorAll('.screen')];
const targets = [...document.querySelectorAll('[data-target]')];
const tabs = [...document.querySelectorAll('#tabs a')];
const dots = [...document.querySelectorAll('#sectionDots button')];
const progress = document.getElementById('progressBar');
const burst = document.getElementById('transitionBurst');
const menuBtn = document.getElementById('menuBtn');
const nav = document.getElementById('tabs');

let current = 0;
let locked = false;
let lastWheel = 0;
let mouse = { x: innerWidth/2, y: innerHeight/2 };

function setActive(index, pulse = true){
  current = Math.max(0, Math.min(screens.length - 1, index));
  const active = screens[current];
  const id = active.id;
  const mode = active.dataset.mode || id;

  document.body.dataset.section = mode;

  screens.forEach((screen, i) => {
    screen.classList.toggle('active', i === current);
    screen.classList.toggle('transition-out', i !== current);
  });

  tabs.forEach(tab => tab.classList.toggle('active', tab.dataset.target === id));
  dots.forEach(dot => dot.classList.toggle('active', dot.dataset.target === id));

  if(progress) progress.style.width = `${((current + 1) / screens.length) * 100}%`;

  active.querySelectorAll('.reveal').forEach(item => item.classList.add('show'));

  if(pulse && burst){
    burst.style.setProperty('--x', `${mouse.x}px`);
    burst.style.setProperty('--y', `${mouse.y}px`);
    burst.classList.add('active');
    clearTimeout(burst._timer);
    burst._timer = setTimeout(() => burst.classList.remove('active'), 680);
  }
}

function goTo(index){
  if(index < 0 || index >= screens.length) return;
  locked = true;
  setActive(index, true);
  setTimeout(() => locked = false, 760);
}

targets.forEach(item => {
  item.addEventListener('click', event => {
    const id = item.dataset.target;
    const index = screens.findIndex(screen => screen.id === id);
    if(index >= 0){
      event.preventDefault();
      nav?.classList.remove('open');
      if(innerWidth <= 1000){
        screens[index].scrollIntoView({behavior:'smooth', block:'start'});
        setActive(index, false);
      } else {
        goTo(index);
      }
    }
  });
});

window.addEventListener('wheel', event => {
  if(innerWidth <= 1000) return;
  event.preventDefault();
  const now = Date.now();
  if(locked || now - lastWheel < 650) return;
  lastWheel = now;
  goTo(current + (event.deltaY > 0 ? 1 : -1));
}, {passive:false});

document.addEventListener('keydown', event => {
  if(innerWidth <= 1000) return;
  if(event.key === 'ArrowDown' || event.key === 'PageDown') goTo(current + 1);
  if(event.key === 'ArrowUp' || event.key === 'PageUp') goTo(current - 1);
});

menuBtn?.addEventListener('click', () => nav?.classList.toggle('open'));

/* Mobile active tab while natural scrolling */
const mobileObserver = new IntersectionObserver(entries => {
  if(innerWidth > 1000) return;
  entries.forEach(entry => {
    if(entry.isIntersecting){
      const index = screens.indexOf(entry.target);
      setActive(index, false);
    }
  });
}, {threshold:.42});
screens.forEach(screen => mobileObserver.observe(screen));

/* Lightbox */
const lightbox = document.getElementById('lightbox');
const lightboxImage = document.getElementById('lightboxImage');
const closeLightbox = document.getElementById('closeLightbox');

document.querySelectorAll('.zoomable').forEach(item => {
  item.addEventListener('click', () => {
    const src = item.dataset.full || item.querySelector('img')?.src;
    if(!src || !lightbox || !lightboxImage) return;
    lightboxImage.src = src;
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden','false');
  });
});
function closeBox(){
  lightbox?.classList.remove('open');
  lightbox?.setAttribute('aria-hidden','true');
}
closeLightbox?.addEventListener('click', closeBox);
lightbox?.addEventListener('click', e => { if(e.target === lightbox) closeBox(); });
document.addEventListener('keydown', e => { if(e.key === 'Escape') closeBox(); });

/* Cursor */
const cursorDot = document.getElementById('cursorDot');
const cursorRing = document.getElementById('cursorRing');
const cursorAura = document.getElementById('cursorAura');

if(cursorDot && cursorRing && cursorAura && matchMedia('(pointer:fine)').matches){
  let rx = mouse.x, ry = mouse.y, ax = mouse.x, ay = mouse.y;
  window.addEventListener('mousemove', e => {
    mouse.x = e.clientX; mouse.y = e.clientY;
    cursorDot.style.transform = `translate(${mouse.x}px,${mouse.y}px) translate(-50%,-50%)`;
  });

  function cursorLoop(){
    rx += (mouse.x - rx) * .18; ry += (mouse.y - ry) * .18;
    ax += (mouse.x - ax) * .055; ay += (mouse.y - ay) * .055;
    cursorRing.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
    cursorAura.style.transform = `translate(${ax}px,${ay}px) translate(-50%,-50%)`;
    requestAnimationFrame(cursorLoop);
  }
  cursorLoop();

  document.querySelectorAll('a,button,.zoomable,.project-card,.mission-card,.service-grid article,.visual-story figure,.contact-photo,.launch-visual,.identity-panel').forEach(item => {
    item.addEventListener('mouseenter', () => document.body.classList.add('cursor-active'));
    item.addEventListener('mouseleave', () => document.body.classList.remove('cursor-active'));
  });
}

/* Magnetic buttons */
document.querySelectorAll('.magnetic').forEach(item => {
  item.addEventListener('mousemove', e => {
    if(!matchMedia('(pointer:fine)').matches) return;
    const rect = item.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    item.style.transform = `translate(${x*.08}px,${y*.10}px)`;
  });
  item.addEventListener('mouseleave', () => item.style.transform = '');
});

/* Neural AI canvas */
const canvas = document.getElementById('neuralCanvas');
const ctx = canvas?.getContext('2d');
let particles = [];

function resizeCanvas(){
  if(!canvas || !ctx) return;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.floor(innerWidth * dpr);
  canvas.height = Math.floor(innerHeight * dpr);
  canvas.style.width = innerWidth + 'px';
  canvas.style.height = innerHeight + 'px';
  ctx.setTransform(dpr,0,0,dpr,0,0);

  const count = Math.max(55, Math.min(120, Math.floor(innerWidth * innerHeight / 17000)));
  particles = Array.from({length:count}, () => ({
    x:Math.random()*innerWidth,
    y:Math.random()*innerHeight,
    vx:(Math.random()-.5)*.34,
    vy:(Math.random()-.5)*.34,
    r:Math.random()*1.8+.8,
    phase:Math.random()*Math.PI*2,
    pulse:Math.random()
  }));
}

function drawNeural(){
  if(!canvas || !ctx) return;
  ctx.clearRect(0,0,innerWidth,innerHeight);

  const section = document.body.dataset.section || 'home';
  const color = section === 'projects' ? '123,60,255' : section === 'skills' ? '107,228,255' : section === 'lab' ? '49,247,163' : '24,139,255';

  particles.forEach((p, i) => {
    p.x += p.vx + (mouse.x - innerWidth/2) * .00018;
    p.y += p.vy + (mouse.y - innerHeight/2) * .00018;
    p.phase += .018;

    if(p.x < -50) p.x = innerWidth + 50;
    if(p.x > innerWidth + 50) p.x = -50;
    if(p.y < -50) p.y = innerHeight + 50;
    if(p.y > innerHeight + 50) p.y = -50;

    for(let j=i+1; j<particles.length; j++){
      const q = particles[j];
      const dx = p.x-q.x, dy = p.y-q.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if(dist < 145){
        const alpha = (1 - dist/145) * .25;
        ctx.strokeStyle = `rgba(${color},${alpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p.x,p.y);
        ctx.lineTo(q.x,q.y);
        ctx.stroke();

        if((i+j+Math.floor(performance.now()/260)) % 67 === 0){
          const t = (Math.sin(performance.now()/180) + 1) / 2;
          const sx = p.x + (q.x-p.x)*t;
          const sy = p.y + (q.y-p.y)*t;
          ctx.fillStyle = `rgba(210,250,255,.85)`;
          ctx.beginPath();
          ctx.arc(sx, sy, 2.2, 0, Math.PI*2);
          ctx.fill();
        }
      }
    }

    const glow = .42 + Math.sin(p.phase)*.22;
    ctx.fillStyle = `rgba(190,246,255,${glow})`;
    ctx.beginPath();
    ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
    ctx.fill();
  });

  requestAnimationFrame(drawNeural);
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();
drawNeural();

setActive(0, false);
