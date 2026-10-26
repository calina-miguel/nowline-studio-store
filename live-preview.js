(() => {
  let current = null;
  async function check() {
    try {
      const response = await fetch(`./version.json?t=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) return;
      const { version } = await response.json();
      if (current !== null && version !== current) location.reload();
      current = version;
    } catch { /* Keep the preview usable if the network is offline. */ }
  }
  check();
  setInterval(check, 20000);
})();
