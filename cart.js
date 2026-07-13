function getCart() {
  return JSON.parse(localStorage.getItem("tb_cart") || "[]");
}

function saveCart(cart) {
  localStorage.setItem("tb_cart", JSON.stringify(cart));
  renderCart();
}

function normalizeCart(items) {
  const map = new Map();

  for (const item of items) {
    const id = String(item.id);
    if (!map.has(id)) {
      map.set(id, { ...item, quantity: Number(item.quantity || 1) });
    } else {
      map.get(id).quantity += Number(item.quantity || 1);
    }
  }

  return [...map.values()];
}

function updateQuantity(id, quantity) {
  const cart = normalizeCart(getCart());
  const item = cart.find(product => String(product.id) === String(id));
  if (!item) return;

  item.quantity = Math.max(1, Number(quantity || 1));
  saveCart(cart);
}

function removeItem(id) {
  const cart = normalizeCart(getCart()).filter(
    item => String(item.id) !== String(id)
  );
  saveCart(cart);
}

function renderCart() {
  const cart = normalizeCart(getCart());
  localStorage.setItem("tb_cart", JSON.stringify(cart));

  const container = document.getElementById("cart-items");
  const totalElement = document.getElementById("cart-total");
  const checkoutLink = document.getElementById("checkout-link");

  if (!cart.length) {
    container.innerHTML = "<p>Kurven er tom.</p>";
    totalElement.textContent = "Total: 0.00 NOK";
    checkoutLink.style.pointerEvents = "none";
    checkoutLink.style.opacity = "0.5";
    return;
  }

  container.innerHTML = cart.map(item => {
    const price = Number(item.price || 0);
    const quantity = Number(item.quantity || 1);
    const lineTotal = price * quantity;

    return `
      <div class="cart-row">
        <div>
          <strong>${item.name}</strong>
          <p class="muted">${price.toFixed(2)} NOK per stk</p>
        </div>

        <div class="cart-actions">
          <input
            type="number"
            min="1"
            value="${quantity}"
            onchange="updateQuantity('${item.id}', this.value)"
            aria-label="Antall"
          >
          <strong>${lineTotal.toFixed(2)} NOK</strong>
          <button class="btn danger" onclick="removeItem('${item.id}')">Fjern</button>
        </div>
      </div>
    `;
  }).join("");

  const total = cart.reduce((sum, item) => {
    return sum + Number(item.price || 0) * Number(item.quantity || 1);
  }, 0);

  totalElement.textContent = `Total: ${total.toFixed(2)} NOK`;
  checkoutLink.style.pointerEvents = "auto";
  checkoutLink.style.opacity = "1";
}

window.updateQuantity = updateQuantity;
window.removeItem = removeItem;
renderCart();
