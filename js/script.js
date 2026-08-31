// Simple cart and UI interactions for the starter site
document.addEventListener('DOMContentLoaded', () => {
  // Year in footer
  const yearEls = document.querySelectorAll('[id^="year"]');
  yearEls.forEach(el => el.textContent = new Date().getFullYear());

  // Add to cart buttons
  document.querySelectorAll('[data-product]').forEach(btn => {
    btn.addEventListener('click', () => {
      const product = JSON.parse(btn.getAttribute('data-product'));
      addToCart(product);
    });
  });

  // Cart modal
  const cartBtn = document.getElementById('cartBtn');
  const cartModal = document.getElementById('cartModal');
  const closeCart = document.getElementById('closeCart');
  cartBtn.addEventListener('click', () => cartModal.classList.toggle('hidden'));
  closeCart.addEventListener('click', () => cartModal.classList.add('hidden'));

  // Cart state
  const CART_KEY = 'orio_cart';
  function getCart(){ return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
  function saveCart(cart){ localStorage.setItem(CART_KEY, JSON.stringify(cart)); renderCart(); }

  function addToCart(product){
    const cart = getCart();
    const found = cart.find(i => i.id === product.id);
    if(found) found.qty += 1;
    else cart.push({ ...product, qty: 1 });
    saveCart(cart);
  }

  function renderCart(){
    const cart = getCart();
    const cartCount = cart.reduce((s,i)=>s+i.qty,0);
    document.getElementById('cartCount').textContent = cartCount;
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    cartItems.innerHTML = '';
    let total = 0;
    if(cart.length === 0){
      cartItems.innerHTML = '<p class="muted">Your cart is empty.</p>';
    } else {
      cart.forEach(item => {
        total += item.price * item.qty;
        const row = document.createElement('div');
        row.className = 'cart-row';
        row.innerHTML = `
          <div style="display:flex;gap:0.75rem;align-items:center;margin-bottom:0.5rem">
            <img src="images/product.png" alt="${item.name}" style="height:48px;border-radius:6px"/>
            <div>
              <div style="font-weight:600">${item.name}</div>
              <div class="muted">₱${item.price} × ${item.qty}</div>
            </div>
          </div>
        `;
        cartItems.appendChild(row);
      });
    }
    cartTotal.textContent = total;
  }

  // Initialize
  renderCart();
});
