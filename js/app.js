/* =============================================
   BARASTI COFFEE STORE — app.js
   ============================================= */

// ── Config ─────────────────────────────────
const IMAGE_SCALE    = 0.85;
const WHATSAPP_NUMBER = '96500000000'; // ← replace with real number
const TOTAL_FRAMES   = 192;

// ── Elements ───────────────────────────────
const canvas     = document.getElementById('canvas');
const ctx        = canvas.getContext('2d');
const canvasWrap = document.getElementById('canvas-wrap');
const heroDriver = document.getElementById('hero-scroll-driver');
const heroSection = document.querySelector('.hero-standalone');
const loader     = document.getElementById('loader');
const loaderBar  = document.getElementById('loader-bar');
const loaderPct  = document.getElementById('loader-percent');
const header     = document.querySelector('.site-header');

// ── Frames ─────────────────────────────────
const frames = new Array(TOTAL_FRAMES);
let currentFrameIdx = 0;
let rafPending = false;

// ═══════════════════════════════════════════
//  CANVAS
// ═══════════════════════════════════════════
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width  = window.innerWidth  * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width  = window.innerWidth  + 'px';
  canvas.style.height = window.innerHeight + 'px';
  ctx.scale(dpr, dpr);
  drawFrame(currentFrameIdx);
}
window.addEventListener('resize', resizeCanvas);

function drawFrame(idx) {
  const img = frames[idx];
  if (!img || !img.complete || !img.naturalWidth) return;
  const cw = window.innerWidth, ch = window.innerHeight;
  const iw = img.naturalWidth,  ih = img.naturalHeight;
  const scale = Math.max(cw / iw, ch / ih) * IMAGE_SCALE;
  const dw = iw * scale, dh = ih * scale;
  const dx = (cw - dw) / 2, dy = (ch - dh) / 2;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, cw, ch);
  ctx.drawImage(img, dx, dy, dw, dh);
}

function showFrame(progress) {
  const idx = Math.min(TOTAL_FRAMES - 1, Math.max(0, Math.round(progress * (TOTAL_FRAMES - 1))));
  currentFrameIdx = idx;
  if (!rafPending) {
    rafPending = true;
    requestAnimationFrame(() => { rafPending = false; drawFrame(idx); });
  }
}

// ═══════════════════════════════════════════
//  LOADER — preloads all frames
// ═══════════════════════════════════════════
function initLoader() {
  return new Promise((resolve) => {
    let loaded = 0;

    function onLoad() {
      loaded++;
      const pct = Math.round((loaded / TOTAL_FRAMES) * 100);
      loaderBar.style.width = pct + '%';
      loaderPct.textContent = pct + '%';

      if (loaded === 1) drawFrame(0); // show first frame ASAP

      if (loaded === TOTAL_FRAMES) {
        loaderBar.style.width = '100%';
        loaderPct.textContent = '100%';
        setTimeout(() => { hideLoader(); resolve(); }, 350);
      }
    }

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      img.onload  = onLoad;
      img.onerror = onLoad; // count errors too so loader always completes
      img.src = `frames/frame-${String(i + 1).padStart(3, '0')}.jpg`;
      frames[i] = img;
    }
  });
}

function hideLoader() {
  gsap.to(loader, {
    opacity: 0, duration: 0.8, ease: 'power2.inOut',
    onComplete: () => { loader.style.display = 'none'; }
  });
}

// ═══════════════════════════════════════════
//  LENIS
// ═══════════════════════════════════════════
function initLenis() {
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

// ═══════════════════════════════════════════
//  STICKY HEADER
// ═══════════════════════════════════════════
function initStickyHeader() {
  ScrollTrigger.create({
    start: '80px top',
    onEnter:      () => header.classList.add('scrolled'),
    onLeaveBack:  () => header.classList.remove('scrolled'),
  });
}

// ═══════════════════════════════════════════
//  HERO ENTRANCE
// ═══════════════════════════════════════════
function initHeroEntrance() {
  const words   = document.querySelectorAll('.hero-heading .word');
  const label   = document.querySelector('.hero-standalone .section-label');
  const tagline = document.querySelector('.hero-tagline');
  const cta     = document.querySelector('.hero-cta-btn');
  const scroller = document.querySelector('.hero-scroll-indicator');

  gsap.set([label, words, tagline, cta, scroller], { opacity: 0, y: 28 });
  gsap.to(label,   { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', delay: 0.4 });
  gsap.to(words,   { opacity: 1, y: 0, duration: 0.95, ease: 'power3.out', stagger: 0.08, delay: 0.55 });
  gsap.to([tagline, cta], { opacity: 1, y: 0, duration: 0.75, ease: 'power3.out', stagger: 0.1, delay: 0.95 });
  gsap.to(scroller, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', delay: 1.25 });
}

// ═══════════════════════════════════════════
//  HERO VIDEO — circle-wipe + scroll-seek
// ═══════════════════════════════════════════
function initHeroVideo() {
  ScrollTrigger.create({
    trigger: heroDriver,
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    onUpdate: (self) => {
      const p = self.progress;

      // Hero text fades out in the first 15%
      heroSection.style.opacity = String(Math.max(0, 1 - p * 6.6));
      heroSection.style.pointerEvents = p > 0.15 ? 'none' : 'auto';

      // Canvas circle-wipe: 0 → 80% of viewport
      const wipe = Math.min(1, Math.max(0, (p - 0.02) / 0.10));
      canvasWrap.style.clipPath = `circle(${wipe * 80}% at 50% 50%)`;

      // Show the correct frame based on scroll progress
      showFrame(p);
    },
    onLeave: () => {
      gsap.to(canvasWrap, { opacity: 0, duration: 0.5, ease: 'power2.inOut' });
    },
    onEnterBack: () => {
      gsap.to(canvasWrap, { opacity: 1, duration: 0.4, ease: 'power2.out' });
    }
  });
}

// ═══════════════════════════════════════════
//  SECTION REVEAL ANIMATIONS
// ═══════════════════════════════════════════
function initRevealSections() {
  document.querySelectorAll('.reveal-section').forEach((el) => {
    gsap.to(el, {
      opacity: 1, y: 0, duration: 0.85, ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 80%',
        toggleActions: 'play none none none'
      }
    });
  });
}

// ═══════════════════════════════════════════
//  PRODUCT CARD STAGGER ENTRANCE
// ═══════════════════════════════════════════
function initCardAnimations() {
  const cards = document.querySelectorAll('.product-card');

  const rows = [];
  cards.forEach((card, i) => {
    const row = Math.floor(i / 3);
    if (!rows[row]) rows[row] = [];
    rows[row].push(card);
  });

  rows.forEach((row) => {
    gsap.to(row, {
      opacity: 1, y: 0,
      duration: 0.75, ease: 'power3.out',
      stagger: 0.12,
      scrollTrigger: {
        trigger: row[0],
        start: 'top 85%',
        toggleActions: 'play none none none'
      }
    });
  });
}

// ═══════════════════════════════════════════
//  CART SYSTEM
// ═══════════════════════════════════════════
const cartSidebar  = document.getElementById('cart-sidebar');
const cartBackdrop = document.getElementById('cart-backdrop');
const cartItemsEl  = document.getElementById('cart-items');
const cartTotalEl  = document.getElementById('cart-total');
const cartCountEl  = document.getElementById('cart-count');
const cartToggle   = document.getElementById('cart-toggle');
const cartClose    = document.getElementById('cart-close');
const cartWhatsApp = document.getElementById('cart-whatsapp');

let cart = [];

function openCart() {
  cartSidebar.classList.add('open');
  cartBackdrop.classList.add('visible');
  document.body.style.overflow = 'hidden';
}
function closeCart() {
  cartSidebar.classList.remove('open');
  cartBackdrop.classList.remove('visible');
  document.body.style.overflow = '';
}

cartToggle.addEventListener('click', openCart);
cartClose.addEventListener('click', closeCart);
cartBackdrop.addEventListener('click', closeCart);

function renderCart() {
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  cartTotalEl.textContent = total.toFixed(3) + ' KD';

  const totalQty = cart.reduce((sum, i) => sum + i.qty, 0);
  cartCountEl.textContent = totalQty;
  cartCountEl.classList.toggle('visible', totalQty > 0);

  if (cart.length === 0) {
    cartItemsEl.innerHTML = '<p class="cart-empty">Your cart is empty.</p>';
    return;
  }

  cartItemsEl.innerHTML = cart.map((item, idx) => `
    <div class="cart-item">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">${(item.price * item.qty).toFixed(3)} KD</div>
      </div>
      <div class="cart-qty">
        <button class="qty-btn" data-action="dec" data-idx="${idx}" aria-label="Decrease quantity">−</button>
        <span class="qty-value">${item.qty}</span>
        <button class="qty-btn" data-action="inc" data-idx="${idx}" aria-label="Increase quantity">+</button>
      </div>
      <button class="remove-item" data-idx="${idx}" aria-label="Remove item">×</button>
    </div>
  `).join('');
}

cartItemsEl.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  const rem = e.target.closest('.remove-item');

  if (btn) {
    const idx = parseInt(btn.dataset.idx);
    if (btn.dataset.action === 'inc') cart[idx].qty++;
    else { cart[idx].qty--; if (cart[idx].qty <= 0) cart.splice(idx, 1); }
    renderCart();
  }
  if (rem) {
    const idx = parseInt(rem.dataset.idx);
    cart.splice(idx, 1);
    renderCart();
  }
});

document.querySelectorAll('.product-card').forEach((card) => {
  const btn   = card.querySelector('.add-btn');
  const name  = card.dataset.name;
  const price = parseFloat(card.dataset.price);

  btn.addEventListener('click', () => {
    const existing = cart.find(i => i.name === name);
    if (existing) {
      existing.qty++;
    } else {
      cart.push({ name, price, qty: 1 });
    }
    renderCart();

    btn.classList.add('added');
    btn.textContent = '✓ Added';
    setTimeout(() => {
      btn.classList.remove('added');
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 5v14M5 12h14"/></svg> Add to Order`;
    }, 1200);

    gsap.fromTo(cartToggle, { scale: 1 }, { scale: 1.3, duration: 0.15, yoyo: true, repeat: 1, ease: 'power2.out' });

    if (cart.length === 1 && cart[0].qty === 1) {
      setTimeout(() => openCart(), 400);
    }
  });
});

cartWhatsApp.addEventListener('click', () => {
  if (cart.length === 0) return;
  const lines = cart.map(i => `• ${i.qty}x ${i.name} (${(i.price * i.qty).toFixed(3)} KD)`).join('\n');
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0).toFixed(3);
  const msg = encodeURIComponent(
    `Hi Barasti! I'd like to place an order:\n\n${lines}\n\nTotal: ${total} KD\n\nPlease confirm availability. Thank you!`
  );
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank');
});

// ═══════════════════════════════════════════
//  MAIN INIT
// ═══════════════════════════════════════════
async function init() {
  gsap.registerPlugin(ScrollTrigger);
  resizeCanvas();
  initLenis();
  initHeroEntrance();
  initStickyHeader();

  await initLoader();

  initHeroVideo();
  initRevealSections();
  initCardAnimations();
}

init();
