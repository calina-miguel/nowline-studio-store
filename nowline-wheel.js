/* Ease discrete mouse-wheel steps without changing touchpad or nested scrolling. */
(() => {
  let target = null;
  let frameId = 0;

  function cancel() {
    if (frameId) cancelAnimationFrame(frameId);
    frameId = 0;
    target = null;
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

  function animate() {
    const distance = target - scrollY;
    if (Math.abs(distance) < 0.7) {
      scrollTo(0, target);
      cancel();
      return;
    }
    const next = scrollY + distance * 0.14;
    if (Math.abs(next - scrollY) < 1) {
      scrollTo(0, target);
      cancel();
      return;
    }
    scrollTo(0, next);
    frameId = requestAnimationFrame(animate);
  }

  addEventListener('wheel', event => {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY) || hasNestedScroller(event.target)) return;
    const discrete = event.deltaMode !== 0 || (Math.abs(event.deltaY) >= 50 && Number.isInteger(event.deltaY) && event.deltaY % 10 === 0);
    if (!discrete) return;

    const maxScroll = Math.max(0, document.documentElement.scrollHeight - innerHeight);
    if (maxScroll === 0) return;
    const delta = event.deltaMode === 1 ? event.deltaY * 18 : event.deltaMode === 2 ? event.deltaY * innerHeight : event.deltaY;
    if ((scrollY <= 0 && delta < 0) || (scrollY >= maxScroll && delta > 0)) return;
    event.preventDefault();
    document.documentElement.classList.add('nowline-wheel-active');
    target = Math.max(0, Math.min(maxScroll, (target ?? scrollY) + Math.max(-320, Math.min(320, delta))));
    if (!frameId) frameId = requestAnimationFrame(animate);
  }, { passive: false });

  addEventListener('pointerdown', cancel, { passive: true });
  addEventListener('keydown', event => {
    if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) cancel();
  });
})();
