let supabaseClient;

function getCart() {
  return JSON.parse(localStorage.getItem("tb_cart") || "[]");
}

function calculateTotal(cart) {
  return cart.reduce((sum, item) => {
    return sum + Number(item.price || 0) * Number(item.quantity || 1);
  }, 0);
}

function showMessage(text, isError = false) {
  const el = document.getElementById("checkout-message");
  el.textContent = text;
  el.classList.remove("hidden");
  el.style.borderColor = isError ? "#7d2525" : "#0B3D2E";
}

function renderSummary() {
  const cart = getCart();
  const container = document.getElementById("checkout-items");

  if (!cart.length) {
    container.innerHTML = "<p>Kurven er tom.</p>";
    document.getElementById("checkout-total").textContent = "Total: 0.00 NOK";
    return;
  }

  container.innerHTML = cart.map(item => `
    <div class="cart-row">
      <span>${item.name} × ${Number(item.quantity || 1)}</span>
      <strong>${(Number(item.price || 0) * Number(item.quantity || 1)).toFixed(2)} NOK</strong>
    </div>
  `).join("");

  document.getElementById("checkout-total").textContent =
    `Total: ${calculateTotal(cart).toFixed(2)} NOK`;
}

async function initSupabase() {
  const config = await fetch("/api/config").then(response => response.json());

  if (!config.supabaseUrl || !config.supabaseKey) {
    throw new Error("Supabase-konfigurasjon mangler.");
  }

  supabaseClient = window.supabase.createClient(
    config.supabaseUrl,
    config.supabaseKey
  );
}

document.getElementById("checkout-form").addEventListener("submit", async event => {
  event.preventDefault();

  const cart = getCart();
  if (!cart.length) {
    showMessage("Kurven er tom.", true);
    return;
  }

  const button = event.target.querySelector("button[type='submit']");
  button.disabled = true;
  button.textContent = "Sender...";

  try {
    const total = calculateTotal(cart);

    const { data: order, error: orderError } = await supabaseClient
      .from("orders")
      .insert({
        customer_name: document.getElementById("customer-name").value.trim(),
        customer_email: document.getElementById("customer-email").value.trim(),
        customer_phone: document.getElementById("customer-phone").value.trim(),
        shipping_address: document.getElementById("address").value.trim(),
        postal_code: document.getElementById("postal-code").value.trim(),
        city: document.getElementById("city").value.trim(),
        total,
        status: "pending"
      })
      .select("id")
      .single();

    if (orderError) throw orderError;

    const orderItems = cart.map(item => ({
      order_id: order.id,
      product_id: item.id,
      quantity: Number(item.quantity || 1),
      price: Number(item.price || 0)
    }));

    const { error: itemError } = await supabaseClient
      .from("order_items")
      .insert(orderItems);

    if (itemError) throw itemError;

    localStorage.removeItem("tb_cart");
    showMessage("Bestillingen er mottatt. Takk!");
    event.target.reset();

    setTimeout(() => {
      window.location.href = "index.html";
    }, 1800);
  } catch (error) {
    console.error(error);
    showMessage(error.message || "Kunne ikke sende bestillingen.", true);
  } finally {
    button.disabled = false;
    button.textContent = "Send bestilling";
  }
});

(async () => {
  try {
    await initSupabase();
    renderSummary();
  } catch (error) {
    console.error(error);
    showMessage(error.message, true);
  }
})();
