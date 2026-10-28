(() => {
  document.documentElement.classList.add('motion-ready');
  const hero = document.querySelector('.hero');
  const intro = document.querySelector('.intro');
  const editorial = document.querySelector('.editorial');
  const shop = document.querySelector('.shop-section');
  const footer = document.querySelector('footer');
  const progress = document.querySelector('.scroll-progress');
  const products = document.querySelector('#products');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
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
    const viewport = innerHeight || 1;
    const total = Math.max(1, document.documentElement.scrollHeight - viewport);
    progress.style.transform = `scaleX(${Math.min(1, scrollY / total)})`;
    document.querySelector('.site-header').classList.toggle('is-scrolled', scrollY > 45);

    if (reducedMotion.matches) {
      [hero, intro, editorial, shop, footer].forEach(section => {
        section.style.removeProperty('--hero-shift');
        section.style.removeProperty('--hero-copy-shift');
        section.style.removeProperty('--intro-shift');
        section.style.removeProperty('--editorial-shift');
        section.style.removeProperty('--shop-shift');
        section.style.removeProperty('--footer-shift');
      });
      return;
    }

    const heroRect = hero.getBoundingClientRect();
    if (heroRect.bottom > 0 && heroRect.top < viewport) {
      hero.style.setProperty('--hero-shift', `${(-heroRect.top * 0.19).toFixed(2)}px`);
      hero.style.setProperty('--hero-copy-shift', `${(-heroRect.top * 0.07).toFixed(2)}px`);
    }
    const introRect = intro.getBoundingClientRect();
    if (introRect.bottom > 0 && introRect.top < viewport) {
      intro.style.setProperty('--intro-shift', `${((viewport - introRect.top) * 0.12).toFixed(2)}px`);
    }
    const editorialRect = editorial.getBoundingClientRect();
    if (editorialRect.bottom > 0 && editorialRect.top < viewport) {
      editorial.style.setProperty('--editorial-shift', `${((viewport - editorialRect.top) * -0.12).toFixed(2)}px`);
    }
    const shopRect = shop.getBoundingClientRect();
    if (shopRect.bottom > 0 && shopRect.top < viewport) {
      shop.style.setProperty('--shop-shift', `${((viewport - shopRect.top) * -0.045).toFixed(2)}px`);
    }
    const footerRect = footer.getBoundingClientRect();
    if (footerRect.bottom > 0 && footerRect.top < viewport) {
      footer.style.setProperty('--footer-shift', `${((viewport - footerRect.top) * -0.1).toFixed(2)}px`);
    }
  }
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(update);
  }
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  reducedMotion.addEventListener('change', schedule);
  schedule();
})();
