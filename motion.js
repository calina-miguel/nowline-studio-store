(() => {
  let enabled = localStorage.getItem('nowline-motion') !== 'off';
  document.documentElement.classList.toggle('motion-ready', enabled);
  document.documentElement.classList.toggle('motion-enabled', enabled);
  document.documentElement.classList.toggle('motion-off', !enabled);
  const toggle = document.querySelector('#motion-toggle');
  toggle.setAttribute('aria-pressed', String(enabled));
  toggle.textContent = enabled ? 'Motion on' : 'Motion off';
  const hero = document.querySelector('.hero');
  const intro = document.querySelector('.intro');
  const editorial = document.querySelector('.editorial');
  const shop = document.querySelector('.shop-section');
  const footer = document.querySelector('footer');
  const progress = document.querySelector('.scroll-progress');
  const products = document.querySelector('#products');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px 32px 0px' });

  function observe(root = document) {
    root.querySelectorAll('.reveal:not(.is-visible), .product-card:not(.is-visible)').forEach((element, index) => {
      if (element.classList.contains('product-card')) element.style.setProperty('--stagger', `${Math.min(index % 4, 3) * 75}ms`);
      observer.observe(element);
    });
  }
  observe();
  if (products) new MutationObserver(() => observe(products)).observe(products, { childList: true });

  let scheduled = false;
  function update() {
    scheduled = false;
    if (!enabled) return;
    const viewport = innerHeight || 1;
    const total = Math.max(1, document.documentElement.scrollHeight - viewport);
    progress.style.transform = `scaleX(${Math.min(1, scrollY / total)})`;
    document.querySelector('.site-header').classList.toggle('is-scrolled', scrollY > 45);

    const heroRect = hero.getBoundingClientRect();
    if (heroRect.bottom > 0 && heroRect.top < viewport) {
      hero.style.setProperty('--hero-shift', `${Math.round(-heroRect.top * 0.19)}px`);
      hero.style.setProperty('--hero-copy-shift', `${Math.round(-heroRect.top * 0.07)}px`);
    }
    const introRect = intro.getBoundingClientRect();
    if (introRect.bottom > 0 && introRect.top < viewport) {
      intro.style.setProperty('--intro-shift', `${Math.round((viewport - introRect.top) * 0.12)}px`);
    }
    const editorialRect = editorial.getBoundingClientRect();
    if (editorialRect.bottom > 0 && editorialRect.top < viewport) {
      editorial.style.setProperty('--editorial-shift', `${Math.round((viewport - editorialRect.top) * -0.12)}px`);
    }
    const shopRect = shop.getBoundingClientRect();
    if (shopRect.bottom > 0 && shopRect.top < viewport) {
      shop.style.setProperty('--shop-shift', `${Math.round((viewport - shopRect.top) * -0.045)}px`);
    }
    const footerRect = footer.getBoundingClientRect();
    if (footerRect.bottom > 0 && footerRect.top < viewport) {
      footer.style.setProperty('--footer-shift', `${Math.round((viewport - footerRect.top) * -0.1)}px`);
    }
  }
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(update);
  }
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  toggle.addEventListener('click', () => {
    enabled = !enabled;
    localStorage.setItem('nowline-motion', enabled ? 'on' : 'off');
    document.documentElement.classList.toggle('motion-ready', enabled);
    document.documentElement.classList.toggle('motion-enabled', enabled);
    document.documentElement.classList.toggle('motion-off', !enabled);
    toggle.setAttribute('aria-pressed', String(enabled));
    toggle.textContent = enabled ? 'Motion on' : 'Motion off';
    schedule();
  });
  schedule();
})();
