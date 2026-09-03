/**
 * ÓRBITA — Invitaciones digitales
 * main.js
 * 
 * Módulos:
 * 1. Campo de estrellas (canvas)
 * 2. Efecto tilt 3D en tarjetas
 * 3. Filtros del catálogo
 * 4. Carrito de compras
 * 5. Contadores animados
 * 6. Scroll reveal
 * 7. Navegación (header scroll)
 * 8. Back to top
 * 9. WhatsApp redirects
 * 10. Inicialización
 */

(function () {
  'use strict';

  const WHATSAPP_NUMBER = '51967231097';

  /* ============================================================
     1. CAMPO DE ESTRELLAS (CANVAS)
     ============================================================ */
  function initStarfield() {
    const canvas = document.getElementById('stars');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w, h, stars = [];
    let mx = 0, my = 0, scrollY = 0;
    let comets = [];
    let nextComet = reduceMotion ? Infinity : 2000 + Math.random() * 2000;
    let animationId = null;
    let isVisible = true;

    document.addEventListener('visibilitychange', () => {
      isVisible = !document.hidden;
      if (isVisible && !animationId) {
        animationId = requestAnimationFrame(draw);
      } else if (!isVisible && animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    });

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      buildStars();
    }

    function buildStars() {
      stars = [];
      const isMobile = w < 768;
      const multiplier = isMobile ? 0.5 : 1;

      const layers = [
        { count: Math.floor(80 * multiplier), speed: 0.015, size: [0.5, 1.3], alpha: [0.2, 0.5] },
        { count: Math.floor(50 * multiplier), speed: 0.035, size: [0.8, 2.0], alpha: [0.3, 0.7] },
        { count: Math.floor(25 * multiplier), speed: 0.06, size: [1.2, 2.8], alpha: [0.5, 0.9] }
      ];

      layers.forEach((layer) => {
        for (let i = 0; i < layer.count; i++) {
          stars.push({
            x: Math.random() * w,
            y: Math.random() * h,
            r: layer.size[0] + Math.random() * (layer.size[1] - layer.size[0]),
            a: layer.alpha[0] + Math.random() * (layer.alpha[1] - layer.alpha[0]),
            speed: layer.speed,
            tw: Math.random() * Math.PI * 2,
            twSpeed: 0.0005 + Math.random() * 0.002
          });
        }
      });
    }

    function spawnComet() {
      comets.push({
        x: Math.random() * w * 0.6 + w * 0.1,
        y: -30,
        vx: 2.5 + Math.random() * 2,
        vy: 3.5 + Math.random() * 2,
        life: 0,
        maxLife: 50 + Math.random() * 25
      });
    }

    function draw(timestamp) {
      if (!isVisible) return;

      if (reduceMotion) {
        ctx.clearRect(0, 0, w, h);
        stars.forEach(s => {
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(2, 132, 199, ${s.a})`;
          ctx.fill();
        });
        return;
      }

      ctx.clearRect(0, 0, w, h);

      stars.forEach(s => {
        const parallaxX = mx * (1 + s.speed * 200) * 5;
        const parallaxY = my * (1 + s.speed * 200) * 5 + (scrollY * s.speed * 0.12);
        const twinkle = s.a * (0.65 + 0.35 * Math.sin(timestamp * s.twSpeed + s.tw));

        let py = (s.y + parallaxY) % (h + 30);
        if (py < -10) py += h + 30;

        let px = (s.x + parallaxX) % (w + 30);
        if (px < -10) px += w + 30;

        ctx.beginPath();
        ctx.arc(px, py, s.r, 0, Math.PI * 2);

        if (s.r > 1.8) {
          const gradient = ctx.createRadialGradient(px, py, 0, px, py, s.r * 3);
          gradient.addColorStop(0, `rgba(2, 132, 199, ${twinkle})`);
          gradient.addColorStop(1, 'rgba(2, 132, 199, 0)');
          ctx.fillStyle = gradient;
        } else {
          ctx.fillStyle = `rgba(2, 132, 199, ${twinkle})`;
        }
        ctx.fill();
      });

      if (timestamp > nextComet) {
        spawnComet();
        nextComet = timestamp + 5000 + Math.random() * 6000;
      }

      comets.forEach(c => {
        c.x += c.vx;
        c.y += c.vy;
        c.life++;
        const fade = 1 - c.life / c.maxLife;
        if (fade <= 0) return;

        const gradient = ctx.createLinearGradient(c.x, c.y, c.x - c.vx * 16, c.y - c.vy * 16);
        gradient.addColorStop(0, `rgba(56, 189, 248, ${Math.max(fade, 0)})`);
        gradient.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(c.x, c.y);
        ctx.lineTo(c.x - c.vx * 16, c.y - c.vy * 16);
        ctx.stroke();
      });

      comets = comets.filter(c => c.life < c.maxLife && c.y < h + 50);

      animationId = requestAnimationFrame(draw);
    }

    let mouseThrottle = null;
    window.addEventListener('mousemove', (e) => {
      if (mouseThrottle) return;
      mouseThrottle = setTimeout(() => {
        mx = (e.clientX / w - 0.5);
        my = (e.clientY / h - 0.5);
        mouseThrottle = null;
      }, 16);
    });

    window.addEventListener('resize', resize);
    window.addEventListener('scroll', () => {
      scrollY = window.scrollY;
    }, { passive: true });

    resize();
    animationId = requestAnimationFrame(draw);
  }

  /* ============================================================
     2. EFECTO TILT 3D EN TARJETAS
     ============================================================ */
  function initTiltCards() {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    const cards = document.querySelectorAll('.tilt-card');

    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width;
        const py = (e.clientY - rect.top) / rect.height;

        const rotateY = (px - 0.5) * 18;
        const rotateX = (0.5 - py) * 18;

        card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(20px) scale(1.02)`;

        const shadowX = (px - 0.5) * -25;
        const shadowY = (py - 0.5) * -25 + 20;
        card.style.boxShadow = `${shadowX}px ${shadowY}px 35px -10px rgba(0,0,0,0.15)`;

        card.style.setProperty('--mx', `${px * 100}%`);
        card.style.setProperty('--my', `${py * 100}%`);
        card.style.setProperty('--fx', `${px * 100}%`);
        card.style.setProperty('--fy', `${py * 100}%`);
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'rotateX(0deg) rotateY(0deg) translateZ(0) scale(1)';
        card.style.boxShadow = '';
      });
    });
  }

  /* ============================================================
     3. FILTROS DEL CATÁLOGO
     ============================================================ */
  function initCatalogFilters() {
    const pills = document.querySelectorAll('.filter-pill');
    const cards = document.querySelectorAll('#catalogGrid .product-card');
    const empty = document.getElementById('emptyState');
    let activeFilter = 'todas';

    function applyFilter(filter) {
      let visibleCount = 0;

      cards.forEach(card => {
        let match = false;

        if (filter === 'todas') {
          match = true;
        } else {
          match = card.dataset.cat === filter;
        }

        card.classList.toggle('hide', !match);
        if (match) visibleCount++;
      });

      if (empty) {
        empty.hidden = visibleCount > 0;
        if (visibleCount === 0) {
          empty.textContent = 'No hay diseños en esta categoría por el momento.';
        }
      }
    }

    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        pills.forEach(p => {
          p.classList.remove('active');
          p.setAttribute('aria-selected', 'false');
        });
        pill.classList.add('active');
        pill.setAttribute('aria-selected', 'true');
        activeFilter = pill.dataset.filter;
        applyFilter(activeFilter);
      });
    });
  }

  /* ============================================================
     4. CARRITO DE COMPRAS
     ============================================================ */
  function initCart() {
    let cart = [];

    const cartPanel = document.getElementById('cartPanel');
    const cartIcon = document.getElementById('cartIcon');
    const cartClose = document.getElementById('cartClose');
    const cartCount = document.getElementById('cartCount');
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    const totalPrice = document.getElementById('totalPrice');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const checkoutOverlay = document.getElementById('checkoutOverlay');

    function updateCartUI() {
      if (cart.length === 0) {
        cartItems.innerHTML = `
          <div class="cart-empty">
            <span class="cart-empty-icon">🛒</span>
            <p>Tu carrito está vacío.</p>
            <p class="cart-empty-hint">Explorá el catálogo y añadí tus diseños.</p>
          </div>
        `;
        cartTotal.style.display = 'none';
        checkoutBtn.disabled = true;
        cartCount.style.display = 'none';
      } else {
        cartItems.innerHTML = cart.map((item, idx) => `
          <div class="cart-item">
            <div class="cart-item-info">
              <span class="cart-item-name">${item.name}</span>
              <span class="cart-item-price">$${item.price}</span>
            </div>
            <button class="cart-item-remove" data-idx="${idx}" aria-label="Eliminar ${item.name}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        `).join('');

        const total = cart.reduce((acc, item) => acc + item.price, 0);
        totalPrice.textContent = `$${total}`;
        cartTotal.style.display = 'flex';
        checkoutBtn.disabled = false;
        cartCount.style.display = 'flex';
        cartCount.textContent = cart.length;

        cartCount.style.animation = 'none';
        cartCount.offsetHeight;
        cartCount.style.animation = 'rebote-contador 0.3s ease';
      }
    }

    function addToCart(productName, price) {
      cart.push({ name: productName, price: price });
      updateCartUI();
      cartPanel.classList.add('open');
    }

    cartIcon.addEventListener('click', (e) => {
      e.stopPropagation();
      cartPanel.classList.toggle('open');
    });

    if (cartClose) {
      cartClose.addEventListener('click', (e) => {
        e.stopPropagation();
        cartPanel.classList.remove('open');
      });
    }

    document.addEventListener('click', (e) => {
      if (!cartPanel.contains(e.target) && !cartIcon.contains(e.target)) {
        cartPanel.classList.remove('open');
      }
    });

    document.addEventListener('click', (e) => {
      const addBtn = e.target.closest('.add-btn');
      const productEl = e.target.closest('[data-product]');

      if (addBtn) {
        e.preventDefault();
        e.stopPropagation();
        const productName = addBtn.dataset.product;
        const priceMatch = productName.match(/\$(\d+)/);
        const price = priceMatch ? parseInt(priceMatch[1]) : 0;
        addToCart(productName, price);
      } else if (productEl && !productEl.classList.contains('js-wa') && !productEl.closest('.flip-outer') && !productEl.closest('.cart-widget')) {
        e.preventDefault();
        const productName = productEl.dataset.product;
        const priceMatch = productName.match(/\$(\d+)/);
        const price = priceMatch ? parseInt(priceMatch[1]) : 0;
        addToCart(productName, price);
      }
    });

    cartItems.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('.cart-item-remove');
      if (removeBtn && removeBtn.dataset.idx !== undefined) {
        const idx = parseInt(removeBtn.dataset.idx);
        cart.splice(idx, 1);
        updateCartUI();
      }
    });

    checkoutBtn.addEventListener('click', () => {
      if (cart.length === 0) return;
      const items = cart.map(i => `${i.name} ($${i.price})`).join('\n');
      const total = cart.reduce((acc, i) => acc + i.price, 0);
      const message = `Hola! Quiero pedir:\n\n${items}\n\nTotal: $${total}`;
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
      cart = [];
      updateCartUI();
      cartPanel.classList.remove('open');
      checkoutOverlay.classList.add('show');
      setTimeout(() => {
        checkoutOverlay.classList.remove('show');
      }, 5000);
      checkoutOverlay.addEventListener('click', function hideOverlay() {
        checkoutOverlay.classList.remove('show');
        checkoutOverlay.removeEventListener('click', hideOverlay);
      });
    });

    updateCartUI();
  }

  /* ============================================================
     5. CONTADORES ANIMADOS
     ============================================================ */
  function initCounters() {
    const counters = document.querySelectorAll('.stat-number[data-target]');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const counter = entry.target;
          const target = parseFloat(counter.dataset.target);
          const isDecimal = counter.dataset.decimal === 'true';
          const shouldFormat = counter.dataset.format === 'true';
          const duration = 2000;
          const start = performance.now();

          function update(currentTime) {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = target * eased;

            if (isDecimal) {
              counter.textContent = current.toFixed(1);
            } else if (shouldFormat) {
              counter.textContent = Math.floor(current).toLocaleString('es-ES');
            } else {
              counter.textContent = Math.floor(current);
            }

            if (progress < 1) {
              requestAnimationFrame(update);
            } else {
              if (isDecimal) counter.textContent = target.toFixed(1);
              else if (shouldFormat) counter.textContent = target.toLocaleString('es-ES');
              else counter.textContent = target;
            }
          }

          requestAnimationFrame(update);
          observer.unobserve(counter);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(counter => observer.observe(counter));
  }

  /* ============================================================
     6. SCROLL REVEAL
     ============================================================ */
  function initScrollReveal() {
    const items = document.querySelectorAll('.reveal');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

    items.forEach(item => observer.observe(item));
  }

  /* ============================================================
     7. NAVEGACIÓN (HEADER SCROLL)
     ============================================================ */
  function initHeaderScroll() {
    const header = document.querySelector('header');
    if (!header) return;

    window.addEventListener('scroll', () => {
      if (window.scrollY > 80) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }, { passive: true });
  }

  /* ============================================================
     8. BACK TO TOP
     ============================================================ */
  function initBackToTop() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;

    window.addEventListener('scroll', () => {
      if (window.scrollY > 600) {
        btn.classList.add('visible');
      } else {
        btn.classList.remove('visible');
      }
    }, { passive: true });

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ============================================================
     9. WHATSAPP REDIRECTS
     ============================================================ */
  function initWhatsAppLinks() {
    document.querySelectorAll('.js-wa').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const product = link.dataset.product || 'Consulta general';
        const message = `Hola! Quiero más información sobre: ${product}`;
        window.open(
          `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,
          '_blank',
          'noopener'
        );
      });
    });
  }

  /* ============================================================
     10. INICIALIZACIÓN
     ============================================================ */
  function init() {
    initStarfield();
    initTiltCards();
    initCatalogFilters();
    initCart();
    initCounters();
    initScrollReveal();
    initHeaderScroll();
    initBackToTop();
    initWhatsAppLinks();

    console.log('ÓRBITA — Sistema listo');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
