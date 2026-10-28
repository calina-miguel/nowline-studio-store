(() => {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let target = null;
  let position = 0;
  let frameId = 0;
  let lastTime = 0;

  function cancel() {
    if (frameId) cancelAnimationFrame(frameId);
    frameId = 0;
    target = null;
    lastTime = 0;
    document.documentElement.classList.remove('nowline-wheel-active');
  }

  function maxScroll() {
    return Math.max(0, document.documentElement.scrollHeight - innerHeight);
  }

  function animate(time) {
    target = Math.max(0, Math.min(maxScroll(), target));
    const elapsed = lastTime ? Math.min(34, Math.max(0, time - lastTime)) : 16.7;
    lastTime = time;
    const easing = 1 - Math.exp(-elapsed / 125);
    position += (target - position) * easing;

    if (Math.abs(target - position) < 0.5) {
      window.scrollTo(0, target);
      cancel();
      return;
    }

    window.scrollTo(0, position);
    frameId = requestAnimationFrame(animate);
  }

  function moveTo(next) {
    if (reducedMotion.matches) {
      cancel();
      window.scrollTo(0, next);
      return;
    }
    if (target === null) position = scrollY;
    target = Math.max(0, Math.min(maxScroll(), next));
    document.documentElement.classList.add('nowline-wheel-active');
    if (!frameId) frameId = requestAnimationFrame(animate);
  }

  function hasNestedScroller(start) {
    for (let element = start instanceof Element ? start : null; element && element !== document.body; element = element.parentElement) {
      if (element.matches('select, textarea, [contenteditable="true"], .cart-drawer, [role="dialog"]')) return true;
      const style = getComputedStyle(element);
      if (/(auto|scroll)/.test(style.overflowY) && element.scrollHeight > element.clientHeight + 2) return true;
    }
    return false;
  }

  addEventListener('wheel', event => {
    if (reducedMotion.matches || event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY) || hasNestedScroller(event.target)) return;
    const delta = event.deltaMode === 1 ? event.deltaY * 18 : event.deltaMode === 2 ? event.deltaY * innerHeight : event.deltaY;
    const limit = maxScroll();
    const currentTarget = target ?? scrollY;
    if (!limit || (currentTarget <= 0 && delta < 0) || (currentTarget >= limit && delta > 0)) return;
    event.preventDefault();
    moveTo((target ?? scrollY) + Math.max(-320, Math.min(320, delta)));
  }, { passive: false });

  addEventListener('pointerdown', cancel, { passive: true });
  addEventListener('blur', cancel);
  addEventListener('resize', cancel);
  reducedMotion.addEventListener('change', cancel);
  addEventListener('keydown', event => {
    if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) cancel();
  });

  window.nowlineScroll = {
    scrollTo(selector) {
      const element = typeof selector === 'string' ? document.querySelector(selector) : selector;
      if (!element) return;
      moveTo(element.getBoundingClientRect().top + scrollY);
    }
  };

  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const hash = link.getAttribute('href');
    const element = hash && document.querySelector(hash);
    if (!element) return;
    event.preventDefault();
    history.pushState(null, '', hash);
    window.nowlineScroll.scrollTo(element);
  });
})();
