(() => {
  const config = window.ATELIER_CONFIG || {};
  const key = 'atelier-cart-v1';
  const $ = selector => document.querySelector(selector);
  const money = amount => new Intl.NumberFormat('en-US', {style:'currency', currency:config.currency || 'USD'}).format(amount);
  const safe = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  let products = [];
  let cart = readCart();
  let activeLocale = new URLSearchParams(location.search).get('locale') || localStorage.getItem('atelier-locale') || 'en';

  function readCart() { try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; } }
  function saveCart() { localStorage.setItem(key, JSON.stringify(cart)); renderCart(); }
  function art(product) { return `<div class="product-art shape-${safe(product.shape || '')}" style="--art-color:${safe(product.color || '#b6a48c')};--art-bg:${safe(product.background || '#e9e7df')}">${product.image ? `<img src="${safe(product.image)}" alt="${safe(product.title)}" loading="lazy">` : ''}${product.tag ? `<span class="product-tag">${safe(product.tag)}</span>` : ''}</div>`; }
  function renderProducts() {
    const query = $('#search').value.trim().toLowerCase();
    const category = $('#category').value;
    let shown = products.filter(p => (category === 'all' || p.category === category) && (`${p.title} ${p.category}`).toLowerCase().includes(query));
    const sort = $('#sort').value;
    if (sort === 'price-asc') shown.sort((a,b) => a.price-b.price);
    if (sort === 'price-desc') shown.sort((a,b) => b.price-a.price);
    if (sort === 'name') shown.sort((a,b) => a.title.localeCompare(b.title));
    $('#result-count').textContent = `${shown.length} ${shown.length === 1 ? 'piece' : 'pieces'}`;
    $('#products').innerHTML = shown.length ? shown.map(p => `<article class="product-card">${art(p)}<div class="product-info"><div><h3>${safe(p.title)}</h3><p>${safe(p.category)}</p></div><span>${money(p.price)}</span></div>${p.variants?.length > 1 ? `<label class="variant-label">Option <select class="variant-select" data-product="${safe(p.id)}">${p.variants.map(v => `<option value="${safe(v.id)}" ${v.available ? '' : 'disabled'}>${safe(v.title)} - ${money(v.price)}${v.available ? '' : ' (Unavailable)'}</option>`).join('')}</select></label>` : ''}<button class="add-button" data-add="${safe(p.id)}" ${p.variants?.length && !p.variants.some(v => v.available) ? 'disabled' : ''}>${p.variants?.length && !p.variants.some(v => v.available) ? 'Unavailable' : 'Add to bag'}</button></article>`).join('') : '<p class="empty-results">No pieces found. Try another search.</p>';
  }
  function renderCart() {
    const count = cart.reduce((sum,item) => sum + item.quantity, 0);
    $('#cart-count').textContent = `(${count})`;
    $('#drawer-count').textContent = `(${count})`;
    $('#cart-subtotal').textContent = money(cart.reduce((sum,item) => sum + item.price*item.quantity, 0));
    $('#cart-items').innerHTML = cart.length ? cart.map(item => `<div class="cart-row">${art(item)}<div><h3>${safe(item.title)}</h3>${item.variantTitle ? `<p class="variant-detail">Size ${safe(item.variantTitle)}</p>` : ''}<p>${money(item.price)}</p><div class="quantity"><button data-decrease="${safe(item.id)}" aria-label="Decrease ${safe(item.title)} quantity">-</button><span>${item.quantity}</span><button data-increase="${safe(item.id)}" aria-label="Increase ${safe(item.title)} quantity">+</button><button class="remove" data-remove="${safe(item.id)}">Remove</button></div></div></div>`).join('') : '<p class="cart-empty">Your bag is empty.<br>Find something you love.</p>';
    $('#checkout').disabled = !cart.length;
  }
  function openCart() { $('#cart-drawer').classList.add('open'); $('#cart-drawer').setAttribute('aria-hidden','false'); $('#scrim').hidden = false; $('#cart-close').focus(); }
  function closeCart() { $('#cart-drawer').classList.remove('open'); $('#cart-drawer').setAttribute('aria-hidden','true'); $('#scrim').hidden = true; $('#cart-toggle').focus(); }
  function modify(id, action) {
    const item = cart.find(p => p.id === id);
    if (action === 'remove') cart = cart.filter(p => p.id !== id);
    if (action === 'increase' && item) item.quantity++;
    if (action === 'decrease' && item) { item.quantity--; if (item.quantity <= 0) cart = cart.filter(p => p.id !== id); }
    saveCart();
  }
  async function shopifyGraphql(query, variables) {
    const res = await fetch(`https://${config.shopDomain}/api/${config.apiVersion || '2025-10'}/graphql.json`, {method:'POST',headers:{'Content-Type':'application/json','X-Shopify-Storefront-Access-Token':config.storefrontToken},body:JSON.stringify({query,variables})});
    if (!res.ok) throw new Error('The store could not be reached. Please try again.');
    const data = await res.json();
    if (data.errors?.length) throw new Error(data.errors[0].message);
    return data.data;
  }
  async function loadProducts() {
    if (!config.shopDomain || !config.storefrontToken) {
      const response = await fetch('./catalog.json');
      if (!response.ok) throw new Error('Collection unavailable');
      return response.json();
    }
    const result = [];
    let cursor = null;
    let hasNextPage = true;
    const query = 'query Products($after: String) { products(first: 30, after: $after) { pageInfo { hasNextPage endCursor } nodes { id handle title productType availableForSale featuredImage { url } variants(first: 20) { nodes { id title availableForSale price { amount currencyCode } } } } } }';
    while (hasNextPage && result.length < 1200) {
      const data = await shopifyGraphql(query,{after:cursor});
      for (const p of data.products.nodes) {
        const variants = p.variants.nodes.map(v => ({id:v.id,title:v.title,price:Number(v.price.amount),available:v.availableForSale}));
        const first = variants.find(v => v.available) || variants[0];
        if (first) result.push({id:p.id,title:p.title,category:p.productType || 'Collection',price:first.price,image:p.featuredImage?.url || '',variants});
      }
      hasNextPage = data.products.pageInfo.hasNextPage;
      cursor = data.products.pageInfo.endCursor;
    }
    return result;
  }
  async function checkout() {
    const feedback = $('#checkout-feedback');
    feedback.textContent = '';
    if (!config.shopDomain || !config.storefrontToken) { feedback.textContent = 'Checkout is temporarily unavailable. Please contact us for assistance.'; return; }
    const lines = cart.map(item => ({merchandiseId:item.merchandiseId,quantity:item.quantity}));
    if (lines.some(line => !line.merchandiseId)) { feedback.textContent = 'A product is temporarily unavailable. Please contact us for assistance.'; return; }
    const button = $('#checkout'); button.disabled = true; button.textContent = 'Preparing checkout...';
    try {
      const data = await shopifyGraphql('mutation CartCreate($input: CartInput!) { cartCreate(input: $input) { cart { checkoutUrl } userErrors { message } } }', {input:{lines}});
      const result = data.cartCreate;
      if (result.userErrors?.length) throw new Error(result.userErrors[0].message);
      const url = new URL(result.cart.checkoutUrl);
      if (url.protocol !== 'https:') throw new Error('Checkout address could not be verified.');
      location.assign(url.href);
    } catch (error) { feedback.textContent = error.message || 'Checkout is unavailable. Please try again.'; button.disabled = false; button.textContent = 'Checkout →'; }
  }
  function localeLinks() {
    document.querySelectorAll('a[href^="./"]').forEach(link => { const url = new URL(link.getAttribute('href'),location.href); url.searchParams.set('locale',activeLocale); link.href = url.href; });
  }
  async function init() {
    try { products = await loadProducts(); } catch { $('#products').innerHTML = '<p class="empty-results">The collection is unavailable right now.</p>'; return; }
    cart = cart.map(item => { const current = products.find(p => p.id === item.productId || p.id === item.id || p.variants?.some(v => v.id === item.id)); const variant = current?.variants?.find(v => v.id === item.id); return current ? {...current,id:variant?.id || current.id,productId:current.id,price:variant?.price || current.price,variantTitle:variant?.title || '',merchandiseId:variant?.id || current.merchandiseId,quantity:item.quantity} : null; }).filter(Boolean);
    saveCart();
    [...new Set(products.map(p => p.category))].sort().forEach(category => { const option = document.createElement('option'); option.value = category; option.textContent = category; $('#category').append(option); });
    renderProducts(); renderCart(); localeLinks(); $('#year').textContent = new Date().getFullYear();
    $('#search').addEventListener('input',renderProducts); $('#category').addEventListener('change',renderProducts); $('#sort').addEventListener('change',renderProducts);
    $('#products').addEventListener('click',event => { const id = event.target.dataset.add; if (!id) return; const product = products.find(p => p.id === id); if (!product) return; const selected = event.target.closest('.product-card').querySelector('.variant-select')?.value; const variant = product.variants?.find(v => v.id === selected) || product.variants?.find(v => v.available); const itemId = variant?.id || product.id; const item = cart.find(p => p.id === itemId); if (item) item.quantity++; else cart.push({...product,id:itemId,productId:product.id,price:variant?.price || product.price,variantTitle:variant?.title === 'Default Title' ? '' : variant?.title || '',merchandiseId:variant?.id || product.merchandiseId,quantity:1}); saveCart(); openCart(); });
    $('#cart-items').addEventListener('click',event => { for (const action of ['increase','decrease','remove']) if (event.target.dataset[action]) modify(event.target.dataset[action],action); });
    $('#cart-toggle').addEventListener('click',openCart); $('#cart-close').addEventListener('click',closeCart); $('#scrim').addEventListener('click',closeCart); document.addEventListener('keydown',event => { if (event.key === 'Escape' && $('#cart-drawer').classList.contains('open')) closeCart(); });
    window.addEventListener('storage',event => { if (event.key === key) { cart = readCart(); renderCart(); } });
    $('#checkout').addEventListener('click',checkout);
    $('#search-toggle').addEventListener('click',() => { $('#shop').scrollIntoView(); $('#search').focus(); });
    $('#menu-toggle').addEventListener('click',() => { const open = $('#main-nav').classList.toggle('open'); $('#menu-toggle').setAttribute('aria-expanded',String(open)); });
    $('#main-nav').addEventListener('click',() => { $('#main-nav').classList.remove('open'); $('#menu-toggle').setAttribute('aria-expanded','false'); });
  }
  init();
})();
