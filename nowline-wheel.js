/* Ease discrete mouse-wheel steps without changing touchpad or nested scrolling. */
(() => {
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

  function hasNestedScroller(start) {
    for (let element = start instanceof Element ? start : null; element && element !== document.body; element = element.parentElement) {
      if (element.matches('select, textarea, [contenteditable="true"], .cart-drawer, cart-drawer, [role="dialog"]')) return true;
      const style = getComputedStyle(element);
      if (/(auto|scroll)/.test(style.overflowY) && element.scrollHeight > element.clientHeight + 2) return true;
    }
    return false;
  }

  function animate(time) {
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - innerHeight);
    target = Math.min(target, maxScroll);
    const elapsed = lastTime ? Math.max(0, time - lastTime) : 16.7;
    lastTime = time;
    const easing = 1 - Math.exp(-elapsed / 125);
    position += (target - position) * easing;
    if (Math.abs(target - position) < 0.5) {
      scrollTo(0, target);
      cancel();
      return;
    }
    scrollTo(0, position);
    frameId = requestAnimationFrame(animate);
  }

  addEventListener('wheel', event => {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY) || hasNestedScroller(event.target)) return;
    const discrete = event.deltaMode !== 0 || (Math.abs(event.deltaY) >= 50 && Number.isInteger(event.deltaY));
    if (!discrete) return;

    const maxScroll = Math.max(0, document.documentElement.scrollHeight - innerHeight);
    if (maxScroll === 0) return;
    const delta = event.deltaMode === 1 ? event.deltaY * 18 : event.deltaMode === 2 ? event.deltaY * innerHeight : event.deltaY;
    if ((scrollY <= 0 && delta < 0) || (scrollY >= maxScroll && delta > 0)) return;
    event.preventDefault();
    document.documentElement.classList.add('nowline-wheel-active');
    if (target === null) position = scrollY;
    target = Math.max(0, Math.min(maxScroll, (target ?? scrollY) + Math.max(-320, Math.min(320, delta))));
    if (!frameId) frameId = requestAnimationFrame(animate);
  }, { passive: false });

  addEventListener('pointerdown', cancel, { passive: true });
  addEventListener('keydown', event => {
    if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) cancel();
  });
})();
