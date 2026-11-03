import { products, productById, money, selectProducts } from './catalog.js';
import { STORAGE_KEY, normalizeState, addToBag, bagCount, bagTotal, escapeHtml as esc } from './state.js';
import { icon } from './icons.js';

const app = document.querySelector('#app');
const drawer = document.querySelector('#drawer');
let state;
try { state = normalizeState(JSON.parse(localStorage.getItem(STORAGE_KEY))); } catch { state = normalizeState(null); }
let selectedSize = '';
let drawerMode = '';
let toastTimer;
let period = 'Month';
let systemStatus = { health: 'Not checked', ready: 'Not checked' };
const img = name => `/assets/${name}`;
const shopLink = (category = 'All') => `#/shop?category=${encodeURIComponent(category)}`;
const route = () => new URL((location.hash.slice(1) || '/').replace(/^([^/])/, '/$1'), 'http://local');
function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { toast('Your browser could not save these preview selections.'); }
}
function toast(message) {
  const node = document.querySelector('#toast');
  node.textContent = message; node.classList.add('visible');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => node.classList.remove('visible'), 4200);
}
function header() {
  const path = route().pathname;
  return `<div class="announcement"><span>THE EVERYDAY EDIT <span class="announcement-separator">/</span> A fresh perspective on getting dressed.</span><span class="preview-label">Collection preview</span></div>
    <header class="site-header"><div class="nav-wrap">
      <button class="icon-button mobile-menu" data-dialog="menu" aria-label="Open menu">${icon('menu')}</button>
      <a class="wordmark" href="#/" aria-label="Velvet Vogue home">VELVET VOGUE<span>EVERYDAY, ELEVATED.</span></a>
      <nav class="main-nav" aria-label="Main navigation"><a class="${path === '/shop' ? 'active' : ''}" href="${shopLink()}">New arrivals</a><a href="${shopLink('Women')}">Women</a><a href="${shopLink('Men')}">Men</a><a href="${shopLink('Accessories')}">Accessories</a><a href="#/edit">The Edit</a></nav>
      <div class="nav-actions"><button class="icon-button" data-dialog="search" aria-label="Search collection">${icon('search')}</button><button class="icon-button account-button" data-dialog="account" aria-label="My account">${icon('user')}</button><a class="icon-button" href="#/saved" aria-label="Saved pieces">${icon('heart')}<span class="nav-count saved-count">${state.saved.length || ''}</span></a><button class="icon-button" data-dialog="bag" aria-label="Open shopping bag">${icon('bag')}<span class="nav-count bag-count">${bagCount(state) || ''}</span></button></div>
    </div></header>`;
}
function footer() {
  return `<footer class="footer"><div class="footer-main"><div class="footer-brand"><a class="wordmark" href="#/">VELVET VOGUE</a><p>A considered wardrobe.<br>A little more you.</p><span class="micro">THE EVERYDAY EDIT — 2026</span></div><div><h3>Explore</h3><a href="${shopLink('Women')}">Womenswear</a><a href="${shopLink('Men')}">Menswear</a><a href="${shopLink('Accessories')}">Accessories</a><a href="#/edit">Our perspective</a></div><div><h3>Here to help</h3><button data-dialog="size">Size guide</button><button data-dialog="policies">Delivery & returns</button><button data-dialog="contact">Contact us</button><a href="#/admin">Dashboard preview</a></div><div class="footer-newsletter"><h3>A little inspiration, in your inbox.</h3><p>New collections. Fresh perspectives. Coming soon.</p><form id="newsletter-form"><label class="sr-only" for="newsletter-email">Email address</label><input id="newsletter-email" type="email" placeholder="Your email address" required autocomplete="email"><button aria-label="Request newsletter signup">${icon('arrow')}</button></form><span class="micro">Signups open when the store launches.</span><p id="newsletter-status" role="status"></p></div></div><div class="footer-bottom"><span>© 2026 Velvet Vogue</span><span>Design preview · Purchases are not enabled</span><button data-dialog="privacy">Privacy</button><span>Sri Lanka / LKR</span></div></footer>`;
}
function productCard(product) {
  const saved = state.saved.includes(product.id);
  return `<article class="product-card"><div class="product-image-wrap"><a href="#/product/${product.id}" class="product-image-link" aria-label="View ${product.name}"><img src="${img(product.image)}" alt="${product.color} ${product.kind.toLowerCase()} editorial look" loading="lazy" width="600" height="800"></a>${product.label ? `<span class="product-label">${product.label}</span>` : ''}<button class="save-button saved-btn ${saved ? 'is-saved' : ''}" data-save="${product.id}" aria-label="Save ${product.name}" aria-pressed="${saved}">${icon('heart')}</button><a class="quick-view" href="#/product/${product.id}">Discover this piece ${icon('plus')}</a></div><div class="product-caption"><div><h3><a href="#/product/${product.id}">${product.name}</a></h3><p>${product.color} <span>·</span> ${product.kind}</p></div><span class="product-price">${money(product.price)}</span></div><div class="swatch-row"><span style="--swatch:${product.swatch}" class="swatch-small" title="${product.color}"></span><span class="micro">Preview piece</span></div></article>`;
}
function home() {
  return `<main id="main" tabindex="-1"><section class="hero" aria-labelledby="hero-title"><img class="hero-image" src="${img('campaign.png')}" alt="Two models in relaxed ivory and stone tailoring in a sunlit courtyard" fetchpriority="high" width="1536" height="1024"><div class="hero-shade"></div><div class="hero-content"><p class="eyebrow"><span class="tiny-line"></span> THE NEW PERSPECTIVE</p><h1 id="hero-title">The everyday,<br><em>elevated.</em></h1><p class="hero-copy">Considered pieces. Effortless confidence.<br>A wardrobe that moves with you.</p><a class="button button-dark" href="${shopLink()}">Explore the collection ${icon('arrow')}</a></div><div class="hero-bottom"><span>THE MODERN ESSENTIALS</span><span>VOL. 01 <span class="tiny-line"></span> 2026</span></div><a href="#/edit" class="hero-note">A study in<br><em>less, but better.</em>${icon('diagonal')}</a></section>
    <div class="brand-note"><span>Less effort. <em>More you.</em></span><p>Refined silhouettes. Easy layers. Your next everyday favourites.</p><span class="note-mark">VV</span></div>
    <section class="section arrivals" aria-labelledby="arrivals-title"><div class="section-heading"><div><p class="eyebrow">FRESH INTO THE WARDROBE</p><h2 id="arrivals-title">New & <em>noteworthy.</em></h2></div><a class="text-link" href="${shopLink()}">View the collection ${icon('arrow')}</a></div><div class="product-grid">${products.map(productCard).join('')}</div><p class="collection-disclaimer">An editorial collection preview. Prices and pieces are illustrative.</p></section>
    <section class="section collections" aria-labelledby="collections-title"><div class="section-heading"><div><p class="eyebrow">YOUR STYLE. YOUR WAY.</p><h2 id="collections-title">Find your <em>everyday.</em></h2></div><span class="section-note">Good style starts with feeling like yourself.</span></div><div class="category-grid"><a class="category-card" href="${shopLink('Women')}"><img src="${img('blazer-alt.jpg')}" alt="Relaxed womenswear in warm neutral tones" loading="lazy"><div><span class="micro">01 / WOMENSWEAR</span><h3>Soft power.</h3><span class="category-cta">Explore women ${icon('arrow')}</span></div></a><a class="category-card" href="${shopLink('Men')}"><img src="${img('men.jpg')}" alt="Contemporary menswear with a relaxed silhouette" loading="lazy"><div><span class="micro">02 / MENSWEAR</span><h3>Quiet confidence.</h3><span class="category-cta">Explore men ${icon('arrow')}</span></div></a><a class="category-card accessories-category" href="${shopLink('Accessories')}"><img src="${img('bag.jpg')}" alt="Black structured bag on a white chair" loading="lazy"><div><span class="micro">03 / THE FINISHING TOUCH</span><h3>All in the details.</h3><span class="category-cta">Explore accessories ${icon('arrow')}</span></div></a></div></section>
    <section class="editorial"><div class="editorial-image"><img src="${img('knit.png')}" alt="Textural knitwear in a soft, natural palette" loading="lazy"></div><div class="editorial-copy"><p class="eyebrow">THE VELVET VOGUE PERSPECTIVE</p><h2>Fewer rules.<br><em>More feeling.</em></h2><p>We’re drawn to the pieces you reach for without thinking. The perfect layer. A softer silhouette. Something familiar, seen in a new light.</p><p>Because getting dressed should feel like you.</p><a class="text-link" href="#/edit">Read The Edit ${icon('arrow')}</a><span class="editorial-number">01 — A CONSIDERED WARDROBE</span></div></section>
    <section class="values-strip"><div>${icon('layers')}<span>Thoughtful combinations<small>More ways to wear your favourites</small></span></div><div>${icon('leaf')}<span>An enduring perspective<small>Style beyond the moment</small></span></div><div>${icon('globe')}<span>Made personal<small>Your wardrobe, your point of view</small></span></div></section>
  </main>`;
}
function shop(savedOnly = false) {
  const params = route().searchParams;
  const category = params.get('category') || 'All';
  const query = params.get('q') || '';
  const sort = params.get('sort') || 'featured';
  const list = selectProducts({ category, query, sort, saved: savedOnly ? state.saved : null });
  return `<main id="main" tabindex="-1" class="shop-page section"><div class="breadcrumb"><a href="#/">Home</a><span>/</span>${savedOnly ? 'Saved pieces' : 'The collection'}</div><div class="shop-heading"><p class="eyebrow">${savedOnly ? 'A LITTLE COLLECTION OF YOU' : 'THE EVERYDAY EDIT / VOL. 01'}</p><h1>${savedOnly ? 'Your favourites.' : 'Considered. <em>Collected.</em>'}</h1><p>${savedOnly ? 'The pieces you’re keeping an eye on, saved on this device.' : 'Easy layers, modern silhouettes, and something that feels like you.'}</p></div><div class="shop-toolbar"><div class="filter-tabs" aria-label="Filter collection">${['All', 'Women', 'Men', 'Accessories'].map(c => `<a class="${category === c ? 'selected' : ''}" href="#/${savedOnly ? 'saved' : 'shop'}?${new URLSearchParams({ category: c, q: query, sort })}">${c === 'All' ? 'All pieces' : c}</a>`).join('')}</div><label class="sort-label">Sort by <select id="sort-products" aria-label="Sort products"><option value="featured" ${sort === 'featured' ? 'selected' : ''}>Featured</option><option value="price-low" ${sort === 'price-low' ? 'selected' : ''}>Price: low to high</option><option value="price-high" ${sort === 'price-high' ? 'selected' : ''}>Price: high to low</option></select></label></div><div class="results-bar"><span>${list.length} ${list.length === 1 ? 'piece' : 'pieces'} ${query ? `for “${esc(query)}”` : ''}</span><button class="text-link" data-dialog="search">Search the collection ${icon('search')}</button></div>${list.length ? `<div class="product-grid">${list.map(productCard).join('')}</div>` : `<div class="empty-state">${icon(savedOnly ? 'heart' : 'search')}<h2>${savedOnly ? 'Make room for favourites.' : 'Nothing here just yet.'}</h2><p>${savedOnly ? 'Tap a heart on any piece to keep it here.' : 'Try another category or a different search.'}</p><a class="button button-dark" href="${shopLink()}">Explore all pieces ${icon('arrow')}</a></div>`}<p class="collection-disclaimer">Collection preview · Illustrative products and prices · No stock or orders are represented.</p></main>`;
}
function productPage(id) {
  const p = productById(id);
  if (!p) return notFound();
  selectedSize = p.sizes.length === 1 ? p.sizes[0] : '';
  return `<main id="main" tabindex="-1" class="product-page section"><div class="breadcrumb"><a href="#/">Home</a><span>/</span><a href="${shopLink(p.category)}">${p.category}</a><span>/</span>${p.name}</div><div class="product-detail-grid"><div class="product-gallery"><div class="gallery-thumbs">${p.images.map((image, i) => `<button class="gallery-thumb ${i === 0 ? 'selected' : ''}" data-gallery="${image}" aria-label="View image ${i + 1}" aria-pressed="${i === 0}"><img src="${img(image)}" alt="${p.name}, editorial view ${i + 1}"></button>`).join('')}</div><div class="detail-image"><img id="main-product-image" src="${img(p.image)}" alt="${p.name} in ${p.color}" width="900" height="1200"><button class="zoom-button icon-button" data-zoom="${p.id}" aria-label="Enlarge product image">${icon('plus')}</button></div></div><div class="product-information"><p class="eyebrow">THE EVERYDAY EDIT <span> / ${p.kind.toUpperCase()}</span></p><h1>${p.name}</h1><p class="detail-price">${money(p.price)} <span>Preview price</span></p><p class="product-description">${p.description}</p><div class="product-color"><span>Colour <strong>${p.color}</strong></span><span class="swatch-large" style="--swatch:${p.swatch}" aria-label="${p.color}"></span></div><div class="size-heading"><span>Size <strong id="selected-size-label">${selectedSize || 'Select a size'}</strong></span><button class="text-link" data-dialog="size">Size guide ${icon('diagonal')}</button></div><div class="size-options" aria-label="Available preview sizes">${p.sizes.map(size => `<button data-size="${size}" aria-pressed="${size === selectedSize}" class="${size === selectedSize ? 'selected' : ''}">${size}</button>`).join('')}</div><div class="add-row"><button id="add-to-bag" class="button button-dark" data-add="${p.id}" ${selectedSize ? '' : 'disabled'}>${icon('bag')} Add to preview bag ${icon('arrow')}</button><button class="save-button saved-btn ${state.saved.includes(p.id) ? 'is-saved' : ''}" data-save="${p.id}" aria-label="Save ${p.name}" aria-pressed="${state.saved.includes(p.id)}">${icon('heart')}</button></div><p class="purchase-note">${icon('info')} Preview item. Purchases are not enabled.</p><div class="product-accordions"><details open><summary>The details ${icon('plus')}</summary><p>A styling concept from the Velvet Vogue editorial collection. Photography illustrates the look; product specifications and availability will be confirmed before launch.</p></details><details><summary>Size & fit ${icon('plus')}</summary><p>Explore the available preview sizes above. Final garment measurements and fit advice will be supplied with the live collection.</p></details><details><summary>Delivery & returns ${icon('plus')}</summary><p>Delivery options, charges, and returns terms will be published when the store opens. No delivery promise applies to preview items.</p></details></div></div></div><section class="recommendations"><div class="section-heading"><div><p class="eyebrow">KEEP THE GOOD COMPANY</p><h2>A little more <em>your style.</em></h2></div><a class="text-link" href="${shopLink()}">Explore all ${icon('arrow')}</a></div><div class="product-grid">${products.filter(item => item.id !== p.id).map(productCard).join('')}</div></section></main>`;
}
function editPage() {
  return `<main id="main" tabindex="-1"><section class="edit-hero"><img src="${img('campaign.png')}" alt="The Velvet Vogue campaign in a warm stone courtyard"><div><p class="eyebrow">THE EDIT / ISSUE 01</p><h1>A quieter kind<br>of <em>statement.</em></h1></div></section><article class="edit-article"><p class="eyebrow">A NOTE ON GETTING DRESSED</p><h2>Style is personal.<br><em>Let’s keep it that way.</em></h2><p>Some days call for structure. Others, for something softer. We like a wardrobe that leaves room for both — pieces that work together without feeling like a uniform.</p><p>This first edit explores a warm, pared-back palette: sand, oat, camel, and black. Relaxed tailoring sits alongside textured knits. The shapes are easy. The possibilities are yours.</p><p>Start with one piece you love. Add a layer. Change your mind. Make it feel like you.</p><a class="button button-dark" href="${shopLink()}">Find your everyday ${icon('arrow')}</a><p class="collection-disclaimer">An editorial concept for the Velvet Vogue collection preview.</p></article></main>`;
}
function notFound() { return `<main id="main" tabindex="-1" class="empty-state"><p class="eyebrow">A SMALL DETOUR</p><h1>This page wandered off.</h1><a class="button button-dark" href="#/">Back to the collection ${icon('arrow')}</a></main>`; }

function adminPage() {
  const section = route().pathname.split('/')[2] || 'overview';
  const names = { overview: 'Overview', orders: 'Orders', products: 'Collection', customers: 'Customers', analytics: 'Analytics', settings: 'Settings' };
  const title = names[section] || 'Overview';
  const nav = [['overview', 'grid', 'Overview'], ['orders', 'bag', 'Orders'], ['products', 'box', 'Collection'], ['customers', 'user', 'Customers'], ['analytics', 'chart', 'Analytics']];
  return `<div class="admin-layout"><aside class="admin-sidebar"><a class="wordmark" href="#/">VELVET<br>VOGUE<span>THE WORKSPACE</span></a><p class="sidebar-label">STORE MANAGEMENT</p><nav aria-label="Dashboard navigation">${nav.map(([id, symbol, label]) => `<a href="#/admin/${id}" class="${section === id ? 'selected' : ''}">${icon(symbol)}${label}${section === id ? '<span class="sidebar-dot"></span>' : ''}</a>`).join('')}</nav><div class="workspace-note"><span class="status-dot"></span><h3>Your next chapter.</h3><p>A space for your store to grow. Explore the dashboard preview.</p><a href="#/">View storefront ${icon('diagonal')}</a></div><div class="sidebar-bottom"><a href="#/admin/settings">${icon('settings')} Settings</a><button data-dialog="contact">${icon('info')} Help & support</button><a href="#/">${icon('logout')} Back to storefront</a></div></aside>
    <main id="main" tabindex="-1" class="admin-main"><header class="admin-header"><div><p class="eyebrow">VELVET VOGUE / WORKSPACE</p><h1>${title}</h1></div><div class="admin-header-actions"><span class="workspace-badge">DESIGN PREVIEW</span><button class="icon-button" data-dialog="notifications" aria-label="Notifications">${icon('bell')}</button><a class="avatar" href="#/admin/settings" aria-label="Workspace settings">VV</a></div></header><div class="dashboard-intro"><div><h2>A fresh perspective.</h2><p>Your store at a glance. Live trading data is not connected.</p></div><div class="period-switch" aria-label="Dashboard date range">${['Day', 'Week', 'Month', 'Year'].map(p => `<button data-period="${p}" class="${period === p ? 'selected' : ''}" aria-pressed="${period === p}">${p}</button>`).join('')}</div></div>
    ${section === 'overview' || section === 'analytics' ? `<div class="metric-grid"><article class="metric-card metric-dark"><span>Total revenue ${icon('diagonal')}</span><strong>—</strong><small>Awaiting sales connection</small></article><article class="metric-card"><span>Orders ${icon('bag')}</span><strong>—</strong><small>No order data connected</small></article><article class="metric-card"><span>Customers ${icon('user')}</span><strong>—</strong><small>No customer data connected</small></article><article class="metric-card"><span>Preview styles ${icon('box')}</span><strong>${products.length.toString().padStart(2, '0')}</strong><small>Editorial fixtures, not live inventory</small></article></div><div class="dashboard-charts"><section class="dashboard-panel revenue-panel"><div class="panel-heading"><h3>Revenue overview</h3><span class="micro">${period.toUpperCase()} VIEW</span></div><div class="chart-placeholder"><div class="chart-lines" aria-hidden="true"></div><div class="chart-empty">${icon('chart')}<h3>Your story starts here.</h3><p>Revenue trends will appear when orders are connected.</p></div><div class="chart-axis"><span>${period === 'Month' ? 'Week 1' : 'Start'}</span><span>${period === 'Month' ? 'Week 2' : ''}</span><span>${period === 'Month' ? 'Week 3' : ''}</span><span>${period === 'Month' ? 'Week 4' : 'End'}</span></div></div></section><section class="dashboard-panel system-panel"><div class="panel-heading"><h3>Store readiness</h3>${icon('globe')}</div><p>Live checks of the connected foundation.</p><div class="health-row"><span>Application</span><span id="health-value" class="health-value">${esc(systemStatus.health)}</span></div><div class="health-row"><span>Dependencies</span><span id="ready-value" class="health-value">${esc(systemStatus.ready)}</span></div><div class="health-row"><span>Commerce services</span><span class="health-value unavailable">Not implemented</span></div><button class="button button-outline" data-check-health>Check connection ${icon('arrow')}</button><p class="micro">Connectivity does not establish store readiness.</p></section></div>` : ''}
    ${section === 'products' ? `<section class="dashboard-panel"><div class="panel-heading"><h3>Editorial collection</h3><a class="text-link" href="${shopLink()}">View collection ${icon('arrow')}</a></div><p class="admin-disclaimer">These four pieces belong to the design preview. Inventory editing is not connected.</p><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Piece</th><th>Category</th><th>Preview price</th><th>Source</th></tr></thead><tbody>${products.map(p => `<tr><td><a href="#/product/${p.id}"><img src="${img(p.image)}" alt="">${p.name}</a></td><td>${p.category}</td><td>${money(p.price)}</td><td><span class="table-badge">Preview</span></td></tr>`).join('')}</tbody></table></div></section>` : section === 'customers' ? `<section class="dashboard-panel dashboard-empty">${icon('user')}<h2>A place for your community.</h2><p>Customer accounts and customer management are not connected.</p><span class="table-badge">No customer records are shown</span></section>` : section === 'settings' ? `<section class="dashboard-panel settings-panel"><h2>Workspace details</h2><dl><div><dt>Store name</dt><dd>Velvet Vogue</dd></div><div><dt>Display currency</dt><dd>LKR · Sri Lankan rupee</dd></div><div><dt>Current mode</dt><dd>Local design preview</dd></div><div><dt>Purchases</dt><dd>Not enabled</dd></div></dl><p>This preview does not grant administrator access or update backend configuration.</p></section>` : `<section class="dashboard-panel orders-panel"><div class="panel-heading"><h3>Recent orders</h3><span class="table-badge">Not connected</span></div><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead></table></div><div class="orders-empty">${icon('bag')}<h3>Good things are on their way.</h3><p>Orders will appear here once the commerce service is implemented.</p><a class="text-link" href="#/">Explore the storefront ${icon('arrow')}</a></div></section>`}
    <div class="admin-footer"><span>VELVET VOGUE WORKSPACE</span><span>Preview only · No administrative operations are enabled</span></div></main></div>`;
}
function render() {
  const path = route().pathname;
  const admin = path.startsWith('/admin');
  document.body.classList.toggle('admin-body', admin);
  const content = admin ? adminPage() : header() + (path === '/' ? home() : path === '/shop' ? shop() : path === '/saved' ? shop(true) : path.startsWith('/product/') ? productPage(path.split('/')[2]) : path === '/edit' ? editPage() : notFound()) + footer();
  app.innerHTML = content;
  document.title = `${admin ? 'Workspace' : path.startsWith('/product/') ? productById(path.split('/')[2])?.name || 'Collection' : path === '/shop' ? 'The Collection' : path === '/saved' ? 'Saved Pieces' : 'The everyday, elevated.'} — Velvet Vogue`;
}
function dialogContent(mode) {
  if (mode === 'bag') {
    return `<p class="dialog-eyebrow">YOUR EVERYDAY FAVOURITES</p><h2 id="drawer-title">The bag. <span>(${bagCount(state)})</span></h2><p class="dialog-description">Preview selections, saved on this device.</p>${state.bag.length ? `<div class="bag-items">${state.bag.map((item, index) => {
      const p = productById(item.id);
      return `<article class="bag-item"><a href="#/product/${p.id}" data-close><img src="${img(p.image)}" alt="${p.name}"></a><div><h3>${p.name}</h3><p>${p.color} / ${item.size}</p><strong>${money(p.price)}</strong><div class="bag-controls"><div class="quantity-control"><button data-quantity="${index}" data-delta="-1" aria-label="Decrease quantity of ${p.name}">${icon('minus')}</button><span>${item.quantity}</span><button data-quantity="${index}" data-delta="1" aria-label="Increase quantity of ${p.name}" ${item.quantity === 9 ? 'disabled' : ''}>${icon('plus')}</button></div><button class="remove-item" data-remove="${index}" aria-label="Remove ${p.name}">Remove</button></div></div></article>`;
    }).join('')}</div><div class="bag-summary"><div><span>Preview subtotal</span><strong>${money(bagTotal(state))}</strong></div><p>This bag does not reserve stock or create an order. Shipping and taxes are not calculated.</p><button class="button button-dark" disabled>Checkout not available</button><button class="text-link" data-close>Keep exploring ${icon('arrow')}</button></div>` : `<div class="empty-state">${icon('bag')}<h3>A little room for something good.</h3><p>Find a piece you love and add it to your preview bag.</p><a href="${shopLink()}" data-close class="button button-dark">Explore the collection ${icon('arrow')}</a></div>`}`;
  }
  if (mode === 'search') return `<p class="dialog-eyebrow">FIND YOUR NEXT FAVOURITE</p><h2 id="drawer-title">Looking for <em>something?</em></h2><form id="search-form"><label for="collection-search">Search by piece, category, or colour</label><div class="search-field"><input id="collection-search" name="q" type="search" placeholder="Try “blazer” or “oat”" maxlength="100" autofocus><button aria-label="Submit search">${icon('arrow')}</button></div></form><p class="eyebrow search-suggestions-title">A FEW PLACES TO START</p><div class="search-suggestions">${['Tailoring', 'Knitwear', 'Outerwear', 'Accessories'].map(c => `<a href="${shopLink(c)}" data-close>${c} ${icon('arrow')}</a>`).join('')}</div>`;
  if (mode === 'menu') return `<h2 id="drawer-title">Explore.</h2><nav class="mobile-nav">${['All', 'Women', 'Men', 'Accessories'].map(c => `<a href="${shopLink(c)}" data-close>${c === 'All' ? 'New arrivals' : c}${icon('arrow')}</a>`).join('')}<a href="#/edit" data-close>The Edit ${icon('arrow')}</a><a href="#/saved" data-close>Saved pieces ${icon('heart')}</a></nav>`;
  if (mode === 'size') return `<p class="dialog-eyebrow">FIND YOUR FIT</p><h2 id="drawer-title">A little guidance.</h2><p class="dialog-description">Illustrative body measurements in centimetres. Final garment measurements will be confirmed with the live collection.</p><table class="size-table"><thead><tr><th>Size</th><th>Chest</th><th>Waist</th><th>Hip</th></tr></thead><tbody>${[['XS','80–84','62–66','86–90'],['S','84–88','66–70','90–94'],['M','88–94','70–76','94–100'],['L','94–100','76–82','100–106'],['XL','100–106','82–88','106–112']].map(row => `<tr>${row.map(v => `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table><p>Measure around the fullest part of your chest and hips, and your natural waist. This preview guide does not establish a product’s actual fit.</p>`;
  const information = {
    account: ['Your own little wardrobe.', 'Customer accounts are coming with the live store. For now, you can save favourite pieces and explore a preview bag on this device. No account or password is required.'],
    policies: ['The finer details.', 'Delivery options, charges, payment methods and returns terms will be published before the store opens. This collection is a preview and does not accept purchases.'],
    contact: ['Let’s stay in touch.', 'Customer support details will be added before launch. This preview does not send messages or collect contact information.'],
    privacy: ['A note on your privacy.', 'This preview stores your saved pieces and bag selections in this browser only. No customer account is created, and newsletter email addresses are not transmitted or stored. The dashboard can request the backend’s public health endpoints. All editorial images are served locally.'],
    notifications: ['All quiet for now.', 'There are no connected store notifications. Order, inventory and payment alerts will become available when their backend services are implemented.'],
  };
  const [title, description] = information[mode] || information.account;
  return `<p class="dialog-eyebrow">VELVET VOGUE</p><h2 id="drawer-title">${title}</h2><p class="dialog-description">${description}</p><a class="button button-dark" href="${shopLink()}" data-close>Explore the collection ${icon('arrow')}</a>`;
}
function openDialog(mode) {
  drawerMode = mode;
  drawer.className = `drawer ${mode === 'size' ? 'center-dialog' : ''}`;
  drawer.innerHTML = `<button class="dialog-close icon-button" data-close aria-label="Close dialog">${icon('close')}</button>${dialogContent(mode)}`;
  if (!drawer.open) drawer.showModal();
  document.body.classList.add('dialog-open');
  if (mode === 'search') document.querySelector('#collection-search').focus();
}
function closeDialog() { drawer.close(); document.body.classList.remove('dialog-open'); }
drawer.addEventListener('close', () => document.body.classList.remove('dialog-open'));
drawer.addEventListener('click', event => { if (event.target === drawer) { const r = drawer.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) closeDialog(); } });
function updateCounts() {
  document.querySelectorAll('.bag-count').forEach(n => n.textContent = bagCount(state) || '');
  document.querySelectorAll('.saved-count').forEach(n => n.textContent = state.saved.length || '');
}
async function checkHealth() {
  const button = document.querySelector('[data-check-health]');
  if (button) { button.disabled = true; button.textContent = 'Checking…'; }
  await Promise.all(['health', 'ready'].map(async endpoint => {
    try {
      const response = await fetch(`/api/v1/${endpoint}`, { signal: AbortSignal.timeout(5000), credentials: 'same-origin', headers: { Accept: 'application/json' } });
      const data = await response.json();
      systemStatus[endpoint] = response.ok && data.data?.status === (endpoint === 'health' ? 'alive' : 'ready') ? 'Connected' : 'Unavailable';
    } catch { systemStatus[endpoint] = 'Unavailable'; }
    const node = document.querySelector(`#${endpoint}-value`);
    if (node) { node.textContent = systemStatus[endpoint]; node.classList.toggle('connected', systemStatus[endpoint] === 'Connected'); node.classList.toggle('unavailable', systemStatus[endpoint] !== 'Connected'); }
  }));
  if (button?.isConnected) { button.disabled = false; button.innerHTML = `Check again ${icon('arrow')}`; }
}
document.addEventListener('click', event => {
  const node = event.target.closest('button, a');
  if (!node) return;
  if (node.hasAttribute('data-close')) closeDialog();
  if (node.dataset.dialog) openDialog(node.dataset.dialog);
  if (node.dataset.save) {
    const id = node.dataset.save;
    if (!productById(id)) return;
    const saved = state.saved.includes(id);
    state.saved = saved ? state.saved.filter(value => value !== id) : [...state.saved, id];
    persist(); updateCounts();
    document.querySelectorAll(`[data-save="${id}"]`).forEach(button => { button.classList.toggle('is-saved', !saved); button.setAttribute('aria-pressed', String(!saved)); });
    toast(saved ? 'Removed from your saved pieces.' : 'Saved for a little inspiration later.');
    if (route().pathname === '/saved') render();
  }
  if (node.dataset.size) {
    selectedSize = node.dataset.size;
    document.querySelectorAll('[data-size]').forEach(button => { button.classList.toggle('selected', button.dataset.size === selectedSize); button.setAttribute('aria-pressed', String(button.dataset.size === selectedSize)); });
    document.querySelector('#selected-size-label').textContent = selectedSize;
    document.querySelector('#add-to-bag').disabled = false;
  }
  if (node.dataset.add) {
    try { state = addToBag(state, node.dataset.add, selectedSize); persist(); updateCounts(); openDialog('bag'); }
    catch (error) { toast(error.message); }
  }
  if (node.hasAttribute('data-quantity')) {
    const index = Number(node.dataset.quantity); const row = state.bag[index];
    if (!row) return;
    row.quantity = Math.min(9, row.quantity + Number(node.dataset.delta));
    if (row.quantity <= 0) state.bag.splice(index, 1);
    persist(); updateCounts(); openDialog('bag');
    drawer.querySelector(`[data-quantity="${index}"][data-delta="${node.dataset.delta}"]`)?.focus();
  }
  if (node.hasAttribute('data-remove')) { state.bag.splice(Number(node.dataset.remove), 1); persist(); updateCounts(); openDialog('bag'); drawer.querySelector('.dialog-close').focus(); }
  if (node.dataset.gallery) {
    document.querySelector('#main-product-image').src = img(node.dataset.gallery);
    document.querySelectorAll('[data-gallery]').forEach(button => { button.classList.toggle('selected', button === node); button.setAttribute('aria-pressed', String(button === node)); });
  }
  if (node.dataset.zoom) {
    const image = document.querySelector('#main-product-image');
    drawer.className = 'drawer zoom-dialog';
    drawer.innerHTML = `<button class="dialog-close icon-button" data-close aria-label="Close image">${icon('close')}</button><h2 id="drawer-title" class="sr-only">${productById(node.dataset.zoom).name}</h2><img class="zoom-image" src="${image.src}" alt="${image.alt}">`;
    drawer.showModal(); document.body.classList.add('dialog-open');
  }
  if (node.dataset.period) { period = node.dataset.period; render(); document.querySelector(`[data-period="${period}"]`)?.focus(); }
  if (node.hasAttribute('data-check-health')) checkHealth();
});
document.addEventListener('submit', event => {
  if (event.target.id === 'search-form') { event.preventDefault(); const query = new FormData(event.target).get('q').trim().slice(0, 100); closeDialog(); location.hash = `/shop?${new URLSearchParams({ q: query })}`; }
  if (event.target.id === 'newsletter-form') { event.preventDefault(); document.querySelector('#newsletter-status').textContent = 'Signups aren’t open yet. Your email has not been sent or saved.'; event.target.reset(); }
});
document.addEventListener('change', event => {
  if (event.target.id === 'sort-products') { const current = route(); current.searchParams.set('sort', event.target.value); location.hash = current.pathname + current.search; }
});
window.addEventListener('hashchange', () => { closeDialog(); render(); window.scrollTo({ top: 0, behavior: 'instant' }); document.querySelector('#main')?.focus({ preventScroll: true }); });
window.addEventListener('storage', event => { if (event.key === STORAGE_KEY) { try { state = normalizeState(JSON.parse(event.newValue)); } catch { state = normalizeState(null); } render(); if (drawer.open && drawerMode === 'bag') openDialog('bag'); } });
render();
