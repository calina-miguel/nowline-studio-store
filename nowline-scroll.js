(() => {
  if (typeof Lenis !== 'function') return;

  const scroll = new Lenis({
    autoRaf: true,
    smoothWheel: true,
    lerp: 0.12,
    anchors: true,
    stopInertiaOnNavigate: true,
    respectReducedMotion: true,
    prevent: node => node.matches?.('.cart-drawer, cart-drawer, [role="dialog"], textarea, select, [contenteditable="true"]')
  });

  window.nowlineScroll = scroll;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) scroll.stop();
    else scroll.start();
  });
})();
