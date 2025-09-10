// script.js - vanilla JS to populate menu, manage cart, and handle forms.
// No external libs. Keep things simple and accessible.

// --------- Sample menu data ---------
const MENU = [
  {
    id: 'margherita',
    name: 'Margherita',
    description: 'San Marzano tomato, fior di latte, basil, extra-virgin olive oil.',
    price: 12.5,
    image: '' // optional path like 'images/margherita.jpg'
  },
  {
    id: 'pepperoni',
    name: 'Pepperoni',
    description: 'Classic pepperoni, house sauce, mozzarella.',
    price: 14.0,
    image: ''
  },
  {
    id: 'funghi',
    name: 'Fungi',
    description: 'Wild mushrooms, fontina, thyme, garlic butter drizzle.',
    price: 15.5,
    image: ''
  },
  {
    id: 'vegan-delight',
    name: 'Vegan Delight',
    description: 'Vegan cheese, roasted pepper, olives, spinach.',
    price: 13.5,
    image: ''
  },
  {
    id: 'bbq-chicken',
    name: 'BBQ Chicken',
    description: 'Smoky BBQ sauce, chicken, red onion, cilantro.',
    price: 16.0,
    image: ''
  },
  {
    id: 'four-cheese',
    name: 'Four Cheese',
    description: 'Mozzarella, gorgonzola, fontina, parmesan.',
    price: 16.5,
    image: ''
  }
];

// --------- Utilities ---------
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
const currency = v => `$${v.toFixed(2)}`;

// Persist cart to localStorage for demo
const CART_KEY = 'lp_cart_v1';
let cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]'); // array: [{id, qty}]

// --------- DOM nodes ---------
const menuGrid = $('#menuGrid');
const cartBtn = $('#cartBtn');
const cartCount = $('#cartCount');
const cartItemsNode = $('#cartItems');
const subtotalNode = $('#subtotal');
const taxNode = $('#tax');
const totalNode = $('#total');
const checkoutBtn = $('#checkoutBtn');
const drawer = $('#cartDrawer');
const drawerBody = $('#drawerBody');
const drawerSubtotal = $('#drawerSubtotal');
const drawerCheckout = $('#drawerCheckout');
const yearNode = $('#year');
const contactForm = $('#contactForm');
const contactStatus = $('#contactStatus');
const cartBtnClose = $('#closeCart');

// --------- Init ---------
yearNode.textContent = new Date().getFullYear();
renderMenu();
renderCartUI();
attachHandlers();

// --------- Render menu cards dynamically ---------
function renderMenu(){
  menuGrid.innerHTML = '';
  MENU.forEach(item => {
    const card = document.createElement('article');
    card.className = 'menu-card';
    card.setAttribute('tabindex','0');
    card.innerHTML = `
      <div style="width:96px;height:96px;border-radius:8px;overflow:hidden;flex-shrink:0;background:#fffef8;display:flex;align-items:center;justify-content:center;font-size:1.6rem">
        ${item.image ? `<img src="${item.image}" alt="${item.name}">` : '🍕'}
      </div>
      <div class="menu-meta">
        <h4>${escapeHtml(item.name)} <span class="price">${currency(item.price)}</span></h4>
        <p>${escapeHtml(item.description)}</p>
      </div>
      <div class="menu-actions">
        <label style="display:flex;gap:.4rem;align-items:center">
          <input aria-label="quantity" type="number" min="1" value="1" style="width:60px;padding:.25rem;border-radius:8px;border:1px solid rgba(0,0,0,0.06)">
        </label>
        <button class="btn btn-primary addBtn" data-id="${item.id}" aria-label="Add ${item.name} to cart">Add</button>
      </div>
    `;
    // Add to DOM
    menuGrid.appendChild(card);
  });
  // bind add buttons
  $$('.addBtn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = btn.dataset.id;
      const qtyInput = btn.closest('.menu-card').querySelector('input[type="number"]');
      const qty = Math.max(1, parseInt(qtyInput.value || '1', 10));
      addToCart(id, qty);
      // quick feedback
      btn.textContent = 'Added ✓';
      setTimeout(()=>btn.textContent='Add',700);
    });
  });
}

// --------- Cart logic ---------
function addToCart(id, qty = 1){
  const found = cart.find(c => c.id === id);
  if(found) found.qty += qty;
  else cart.push({id, qty});
  saveCart();
  renderCartUI();
}

function setQty(id, qty){
  qty = Math.max(0, qty);
  if(qty === 0) cart = cart.filter(c => c.id !== id);
  else {
    const found = cart.find(c => c.id === id);
    if(found) found.qty = qty;
  }
  saveCart();
  renderCartUI();
}

function clearCart(){
  cart = [];
  saveCart();
  renderCartUI();
}

function saveCart(){
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

// Compute totals
function computeTotals(){
  const subtotal = cart.reduce((sum, ci) => {
    const item = MENU.find(m => m.id === ci.id);
    return sum + (item ? item.price * ci.qty : 0);
  }, 0);
  const tax = subtotal * 0.08; // 8% tax for demo
  const total = subtotal + tax;
  return {subtotal, tax, total};
}

// Render UI for cart (sidebar)
function renderCartUI(){
  // update count
  const count = cart.reduce((s,c)=>s+c.qty,0);
  cartCount.textContent = count;

  // update checkout state
  checkoutBtn.disabled = count === 0;
  drawerCheckout.disabled = count === 0;

  // render items in checkout card
  const itemsHtml = cart.length === 0 ? `<p class="muted">Your cart is empty — add pizzas from the menu.</p>` : cart.map(ci => {
    const item = MENU.find(m => m.id === ci.id) || {name:ci.id,price:0};
    return `
      <div class="cart-item" data-id="${ci.id}">
        <div style="flex:1">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div><strong>${escapeHtml(item.name)}</strong></div>
            <div class="muted">${currency(item.price)}</div>
          </div>
          <div style="display:flex;gap:.6rem;align-items:center;margin-top:.4rem">
            <button data-action="dec" aria-label="Decrease" class="btn btn-outline" style="padding:.25rem .5rem">−</button>
            <span class="qty">${ci.qty}</span>
            <button data-action="inc" aria-label="Increase" class="btn btn-outline" style="padding:.25rem .5rem">+</button>
            <button data-action="remove" aria-label="Remove item" class="btn" style="margin-left:auto;background:#feece6;border:1px solid rgba(0,0,0,0.04)">Remove</button>
          </div>
        </div>
      </div>`;
  }).join('');

  cartItemsNode.innerHTML = itemsHtml;

  // attach item controls
  $$('.cart-item').forEach(node => {
    const id = node.dataset.id;
    node.querySelector('[data-action="inc"]').addEventListener('click', ()=> {
      const c = cart.find(x=>x.id===id);
      setQty(id, (c?.qty||0) + 1);
    });
    node.querySelector('[data-action="dec"]').addEventListener('click', ()=> {
      const c = cart.find(x=>x.id===id);
      setQty(id, Math.max(0, (c?.qty||0) - 1));
    });
    node.querySelector('[data-action="remove"]').addEventListener('click', ()=> {
      setQty(id, 0);
    });
  });

  // also render drawer (mobile)
  renderDrawer();

  // totals
  const {subtotal, tax, total} = computeTotals();
  subtotalNode.textContent = currency(subtotal);
  taxNode.textContent = currency(tax);
  totalNode.textContent = currency(total);

  drawerSubtotal.textContent = currency(subtotal);
}

// Drawer (mobile) UI
function renderDrawer(){
  if(cart.length === 0) {
    drawerBody.innerHTML = `<p class="muted">Cart is empty.</p>`;
    drawerCheckout.disabled = true;
    return;
  }
  drawerBody.innerHTML = cart.map(ci => {
    const item = MENU.find(m => m.id === ci.id) || {name:ci.id,price:0};
    return `<div style="display:flex;justify-content:space-between;align-items:center;padding:.6rem 0;border-bottom:1px dashed rgba(0,0,0,0.06)">
        <div>
          <strong>${escapeHtml(item.name)}</strong><div class="muted" style="font-size:.9rem">${ci.qty} × ${currency(item.price)}</div>
        </div>
        <div style="text-align:right"><div style="font-weight:700">${currency(item.price * ci.qty)}</div></div>
      </div>`;
  }).join('');
  drawerCheckout.disabled = false;
}

// --------- Event handlers ---------
function attachHandlers(){
  // Open cart: toggle drawer for mobile
  cartBtn.addEventListener('click', ()=>{
    const open = drawer.classList.toggle('open');
    drawer.setAttribute('aria-hidden', String(!open));
    cartBtn.setAttribute('aria-expanded', String(open));
  });

  $('#closeCart').addEventListener('click', ()=> {
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden','true');
    cartBtn.setAttribute('aria-expanded','false');
  });

  // Checkout placeholder
  checkoutBtn.addEventListener('click', () => {
    // For demo: gather minimal order and show confirmation
    const {subtotal, tax, total} = computeTotals();
    if(cart.length===0) return;
    const summary = cart.map(ci => {
      const item = MENU.find(m=>m.id===ci.id);
      return `${ci.qty}× ${item.name}`;
    }).join(', ');
    alert(`Thanks! Order received:\n${summary}\nTotal: ${currency(total)}\n\nThis demo site does not process payments. Implement a backend or payment gateway to complete orders.`);
    clearCart();
  });

  // Drawer checkout behavior: same as checkout
  drawerCheckout.addEventListener('click', () => {
    checkoutBtn.click();
    drawer.classList.remove('open');
  });

  // Contact form: simple validation & fake send
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    contactStatus.textContent = '';
    const form = new FormData(contactForm);
    const name = form.get('name')?.trim();
    const phone = form.get('phone')?.trim();
    if(!name || !phone) {
      contactStatus.textContent = 'Please fill name and phone.';
      contactStatus.style.color = 'crimson';
      return;
    }
    // Simulate sending: for real site, POST to server here
    contactStatus.style.color = 'var(--green)';
    contactStatus.textContent = 'Message sent — we will call to confirm your pickup.';
    contactForm.reset();
    setTimeout(()=>contactStatus.textContent='', 4000);
  });

  // drawer auto close when clicking outside on wider screens
  document.addEventListener('click', (e) => {
    if(!drawer.classList.contains('open')) return;
    if(!drawer.contains(e.target) && !cartBtn.contains(e.target)) {
      drawer.classList.remove('open');
      drawer.setAttribute('aria-hidden','true');
      cartBtn.setAttribute('aria-expanded','false');
    }
  });

  // keyboard accessibility: Esc to close drawer
  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape' && drawer.classList.contains('open')) {
      drawer.classList.remove('open');
      drawer.setAttribute('aria-hidden','true');
      cartBtn.setAttribute('aria-expanded','false');
    }
  });
}

// --------- Helpers ---------
function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, function(m){
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m];
  });
}
