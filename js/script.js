// js/script.js - combined mobile toggle, products loader, cart, and checkout scaffold
document.addEventListener('DOMContentLoaded', () => {
  initMobileToggle();
  initCartUI();
  // Load product lists if present on page
  if (document.querySelectorAll('[data-product]').length) {
    bindProductButtons();
  }
  if (document.getElementById('productWrap')) {
    // product.html loader (if any)
    loadProductDetailFromQuery();
  }
  if (document.getElementById('orderForm')) {
    bindOrderForm();
  }
});

/* Mobile toggle (ids from hn.txt) */
function initMobileToggle() {
  const mobileToggle = document.getElementById('mobileToggle');
  const mainNav = document.getElementById('mainNav');
  if (!mobileToggle || !mainNav) return;
  mobileToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    mainNav.classList.toggle('open');
  });
  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (!mainNav.contains(e.target) && !mobileToggle.contains(e.target)) mainNav.classList.remove('open');
  });
}

/* PRODUCTS (fetch from products.json) */
const PRODUCTS_URL = 'products.json';
async function fetchProducts() {
  const res = await fetch(PRODUCTS_URL, {cache: 'no-store'});
  if (!res.ok) throw new Error('Could not load products');
  return res.json();
}

/* product detail loader for product.html */
async function loadProductDetailFromQuery() {
  const params = new URLSearchParams(location.search);
  const id = params.get('id') || 'classic';
  try {
    const products = await fetchProducts();
    const p = products.find(x => x.id === id);
    if (!p) throw new Error('Product not found');
    document.getElementById('productName').textContent = p.name;
    document.getElementById('productShort').textContent = p.short;
    document.getElementById('productPrice').textContent = `${p.currency} ${p.price}`;
    document.getElementById('productDesc').textContent = p.description;
    document.getElementById('productImage').src = p.image;
    document.getElementById('addToCartBtn').dataset.product = JSON.stringify({id:p.id,name:p.name,price:p.price});
    document.getElementById('buyNowBtn').dataset.product = JSON.stringify({id:p.id,name:p.name,price:p.price});
    
    // Add handlers with validation
    document.getElementById('addToCartBtn').addEventListener('click', () => {
      const qty = parseInt(document.getElementById('productQty').value || '1', 10);
      // FIX: Validate that qty is a positive integer
      if (!Number.isFinite(qty) || qty <= 0) {
        alert('Please enter a valid quantity (1 or more)');
        return;
      }
      addToCart({id:p.id,name:p.name,price:p.price}, qty);
      alert('Added to cart');
    });

    // FIX: Implement Buy Now button with checkout flow
    document.getElementById('buyNowBtn').addEventListener('click', () => {
      const qty = parseInt(document.getElementById('productQty').value || '1', 10);
      // Validate quantity
      if (!Number.isFinite(qty) || qty <= 0) {
        alert('Please enter a valid quantity (1 or more)');
        return;
      }
      addToCart({id:p.id,name:p.name,price:p.price}, qty);
      // Redirect to checkout/order page
      window.location.href = 'order.html';
    });
  } catch (err) {
    console.error(err);
    document.getElementById('productWrap').innerHTML = '<p class="muted">Product not found.</p>';
  }
}

/* Simple cart (localStorage) with migration support */
const CART_KEY = 'oreo_cart_v1';
const LEGACY_CART_KEY = 'orio_cart';

// FIX: Implement migration from legacy cart key to new key
function getCart() { 
  try { 
    // Try current key first
    const current = localStorage.getItem(CART_KEY);
    if (current !== null) return JSON.parse(current || '[]');
    
    // Migrate from legacy key if present
    const legacy = localStorage.getItem(LEGACY_CART_KEY);
    if (legacy !== null) {
      const legacyCart = JSON.parse(legacy);
      localStorage.setItem(CART_KEY, legacy);
      localStorage.removeItem(LEGACY_CART_KEY);
      return legacyCart;
    }
    
    return [];
  } catch (err) {
    console.error('Error parsing cart:', err);
    return [];
  }
}

function saveCart(cart) { 
  localStorage.setItem(CART_KEY, JSON.stringify(cart)); 
  renderCartUI(); 
}

function addToCart(product, qty = 1) {
  const cart = getCart();
  const found = cart.find(i => i.id === product.id);
  if (found) found.qty += qty;
  else cart.push({ ...product, qty });
  saveCart(cart);
}

function removeFromCart(id) {
  const cart = getCart().filter(i => i.id !== id);
  saveCart(cart);
}

/* UI: cart modal and counts */
function initCartUI() {
  // year fields
  document.querySelectorAll('[id^="year"]').forEach(el => el.textContent = new Date().getFullYear());

  const cartBtn = document.getElementById('cartBtn');
  const cartModal = document.getElementById('cartModal');
  const closeCart = document.getElementById('closeCart');
  
  // FIX: Guard cartBtn and cartModal access with null checks
  // cartModal may not exist on non-index pages
  if (cartBtn && cartModal) {
    cartBtn.addEventListener('click', () => cartModal.classList.toggle('hidden'));
  }
  if (closeCart && cartModal) {
    closeCart.addEventListener('click', () => cartModal.classList.add('hidden'));
  }
  
  renderCartUI();
}

// FIX: Use safe DOM construction instead of innerHTML with template literals
function renderCartUI() {
  const cart = getCart();
  const cartCountEl = document.getElementById('cartCount');
  const cartItems = document.getElementById('cartItems');
  const cartTotalEl = document.getElementById('cartTotal');
  
  if (cartCountEl) cartCountEl.textContent = cart.reduce((s,i) => s + i.qty, 0);
  if (!cartItems) return;
  
  cartItems.innerHTML = '';
  let total = 0;
  
  if (cart.length === 0) {
    cartItems.innerHTML = '<p class="muted">Your cart is empty.</p>';
  } else {
    cart.forEach(item => {
      total += item.price * item.qty;
      const row = document.createElement('div');
      row.className = 'cart-row';
      row.style.display = 'flex';
      row.style.gap = '0.75rem';
      row.style.alignItems = 'center';
      row.style.marginBottom = '0.5rem';
      
      // Create image element safely
      const img = document.createElement('img');
      img.src = 'images/product.png';
      img.alt = item.name; // Use textContent ensures no XSS
      img.style.height = '48px';
      img.style.borderRadius = '6px';
      
      // Create info div
      const infoDiv = document.createElement('div');
      
      const nameDiv = document.createElement('div');
      nameDiv.style.fontWeight = '600';
      nameDiv.textContent = item.name; // Use textContent (safe from XSS)
      
      const priceDiv = document.createElement('div');
      priceDiv.className = 'muted';
      priceDiv.textContent = `${item.currency || '₱'}${item.price} × ${item.qty}`; // Safe
      
      const removeButtonDiv = document.createElement('div');
      const removeBtn = document.createElement('button');
      removeBtn.className = 'btn ghost';
      removeBtn.textContent = 'Remove';
      removeBtn.dataset.itemId = item.id; // Use data attribute instead of inline onclick
      removeBtn.addEventListener('click', () => removeFromCart(item.id)); // Event listener (safe)
      removeButtonDiv.appendChild(removeBtn);
      
      infoDiv.appendChild(nameDiv);
      infoDiv.appendChild(priceDiv);
      infoDiv.appendChild(removeButtonDiv);
      
      row.appendChild(img);
      row.appendChild(infoDiv);
      
      cartItems.appendChild(row);
    });
  }
  if (cartTotalEl) cartTotalEl.textContent = total;
}

/* bind add-to-cart buttons on product cards */
function bindProductButtons() {
  document.querySelectorAll('[data-product]').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = JSON.parse(btn.getAttribute('data-product'));
      addToCart(p, 1);
    });
  });
}

/* Order form - simple client-side confirmation */
function bindOrderForm() {
  const form = document.getElementById('orderForm');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    document.getElementById('orderMessage').textContent = `Thanks ${data.name}! Your order for ${data.quantity} x ${data.product} has been received. We will contact you at ${data.email}.`;
    localStorage.removeItem(CART_KEY);
    renderCartUI();
    form.reset();
  });
}

/* Checkout scaffold (placeholders) */
async function createStripeCheckout() {
  const cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  if (cart.length === 0) {
    alert('Your cart is empty');
    return;
  }
  // Call your server to create a Stripe Checkout Session
  alert('Stripe checkout scaffold: implement server endpoint to create a session.');
}

async function createPayPalCheckout() {
  const cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  if (cart.length === 0) {
    alert('Your cart is empty');
    return;
  }
  // Call your server to create a PayPal order
  alert('PayPal checkout scaffold: implement server endpoint to create an order.');
}

/* Expose functions for global use */
window.removeFromCart = removeFromCart;
window.createStripeCheckout = createStripeCheckout;
window.createPayPalCheckout = createPayPalCheckout;
