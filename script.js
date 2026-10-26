
/* ==========================================
   ANTI BAKERY - MAIN JAVASCRIPT
   Shopping Cart + Checkout Integration
========================================== */

// DOM ELEMENTS
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

const cartCount = document.getElementById("cartCount");
const cartButton = document.getElementById("cartButton");
const cartOverlay = document.getElementById("cartOverlay");
const cartPanel = cartOverlay.querySelector(".cart-panel");

const closeCartButton = document.getElementById("closeCart");
const cartItemsContainer = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");

const clearCartButton = document.getElementById("clearCart");
const checkoutButton = document.getElementById("checkoutButton");

const toast = document.getElementById("toast");

// LOCAL STORAGE KEY
// Must match the key in checkout.js
const STORAGE_KEY = "antiBakeryCartV1";

let toastTimer;
let previousFocus = null;

// ==========================================
// PRODUCT DATA
// ==========================================

const products = Array.from(
  document.querySelectorAll(".product-card")
).map(card => ({
  name: card.dataset.name,
  price: Number(card.dataset.price),
  image: card.querySelector("img").src
}));

// ==========================================
// LOAD CART FROM LOCAL STORAGE
// ==========================================

function loadCart() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(STORAGE_KEY)
    );

    if (!Array.isArray(saved)) {
      return [];
    }

    return saved
      .filter(item =>
        item &&
        products.some(product => product.name === item.name) &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0 &&
        item.quantity <= 99
      )
      .map(item => ({
        name: item.name,
        quantity: item.quantity
      }));

  } catch (error) {
    console.error("Error loading cart:", error);
    return [];
  }
}

let cart = loadCart();

// ==========================================
// SAVE CART
// ==========================================

function saveCart() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(cart)
    );
  } catch (error) {
    showToast("Cart could not be saved in this browser.");
  }
}

// ==========================================
// FORMAT PRICE
// ==========================================

function money(amount) {
  return `$${amount.toFixed(2)}`;
}

// ==========================================
// TOAST NOTIFICATION
// ==========================================

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2400);
}

// ==========================================
// DISPLAY SHOPPING CART
// ==========================================

function renderCart() {

  cartItemsContainer.replaceChildren();

  let count = 0;
  let total = 0;

  // EMPTY CART MESSAGE
  if (!cart.length) {
    const empty = document.createElement("p");
    empty.className = "empty-cart";
    empty.textContent = "Your cart is empty 🛒";

    cartItemsContainer.append(empty);
  }

  // DISPLAY CART PRODUCTS
  cart.forEach(item => {

    const product = products.find(
      p => p.name === item.name
    );

    if (!product) return;

    count += item.quantity;
    total += product.price * item.quantity;

    // PRODUCT ROW
    const row = document.createElement("article");
    row.className = "cart-item";

    // PRODUCT IMAGE
    const img = document.createElement("img");
    img.src = product.image;
    img.alt = product.name;

    // PRODUCT DETAILS
    const details = document.createElement("div");

    const name = document.createElement("h3");
    name.textContent = product.name;

    const price = document.createElement("p");
    price.className = "cart-item-price";

    price.textContent =
      `${money(product.price)} each · ${money(
        product.price * item.quantity
      )}`;

    // QUANTITY CONTROLS
    const controls = document.createElement("div");
    controls.className = "cart-item-controls";

    function actionButton(
      label,
      text,
      action,
      className
    ) {
      const button = document.createElement("button");

      button.type = "button";
      button.className = className;

      button.setAttribute(
        "aria-label",
        `${label} ${product.name}`
      );

      button.textContent = text;

      button.addEventListener("click", () => {
        changeQuantity(product.name, action);
      });

      return button;
    }

    // DECREASE QUANTITY
    const minus = actionButton(
      "Decrease quantity of",
      "−",
      -1,
      "quantity-button"
    );

    // CURRENT QUANTITY
    const quantity = document.createElement("span");
    quantity.className = "cart-quantity";
    quantity.textContent = item.quantity;

    // INCREASE QUANTITY
    const plus = actionButton(
      "Increase quantity of",
      "+",
      1,
      "quantity-button"
    );

    plus.disabled = item.quantity >= 99;

    // REMOVE PRODUCT
    const remove = actionButton(
      "Remove",
      "Remove",
      0,
      "remove-item"
    );

    controls.append(
      minus,
      quantity,
      plus,
      remove
    );

    details.append(
      name,
      price,
      controls
    );

    row.append(
      img,
      details
    );

    cartItemsContainer.append(row);
  });

  // UPDATE CART COUNT AND TOTAL
  cartCount.textContent = count;
  cartTotal.textContent = money(total);

  // DISABLE BUTTONS WHEN EMPTY
  clearCartButton.disabled = !cart.length;
  checkoutButton.disabled = !cart.length;
}

// ==========================================
// CHANGE PRODUCT QUANTITY
// ==========================================

function changeQuantity(name, change) {

  const item = cart.find(
    p => p.name === name
  );

  if (!item) return;

  // REMOVE PRODUCT
  if (change === 0) {
    cart = cart.filter(
      p => p.name !== name
    );
  } else {

    item.quantity = Math.min(
      99,
      item.quantity + change
    );

    if (item.quantity <= 0) {
      cart = cart.filter(
        p => p.name !== name
      );
    }
  }

  saveCart();
  renderCart();
}

// ==========================================
// OPEN SHOPPING CART
// ==========================================

function openCart() {

  previousFocus = document.activeElement;

  cartOverlay.classList.add("open");

  cartOverlay.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.classList.add("cart-open");

  closeCartButton.focus();
}

// ==========================================
// CLOSE SHOPPING CART
// ==========================================

function closeCart() {

  cartOverlay.classList.remove("open");

  cartOverlay.setAttribute(
    "aria-hidden",
    "true"
  );

  document.body.classList.remove("cart-open");

  if (
    previousFocus &&
    typeof previousFocus.focus === "function"
  ) {
    previousFocus.focus();
  }
}

// ==========================================
// MOBILE NAVIGATION
// ==========================================

menuToggle.addEventListener("click", () => {

  const isOpen = navLinks.classList.toggle("open");

  menuToggle.setAttribute(
    "aria-expanded",
    String(isOpen)
  );

  menuToggle.textContent = isOpen ? "✕" : "☰";
});

navLinks.querySelectorAll("a").forEach(link => {

  link.addEventListener("click", () => {

    navLinks.classList.remove("open");

    menuToggle.setAttribute(
      "aria-expanded",
      "false"
    );

    menuToggle.textContent = "☰";
  });
});

// ==========================================
// ADD PRODUCTS TO CART
// ==========================================

document.querySelectorAll(".add-cart").forEach(button => {

  button.addEventListener("click", () => {

    const name = button.closest(
      ".product-card"
    ).dataset.name;

    const existing = cart.find(
      item => item.name === name
    );

    if (existing) {

      if (existing.quantity >= 99) {
        showToast("Maximum 99 per product.");
        return;
      }

      existing.quantity++;

    } else {

      cart.push({
        name,
        quantity: 1
      });

    }

    saveCart();
    renderCart();

    showToast(`${name} added to your cart!`);
  });
});

// ==========================================
// CART OPEN AND CLOSE EVENTS
// ==========================================

cartButton.addEventListener(
  "click",
  openCart
);

closeCartButton.addEventListener(
  "click",
  closeCart
);

// CLOSE WHEN CLICKING OUTSIDE
cartOverlay.addEventListener("click", event => {

  if (event.target === cartOverlay) {
    closeCart();
  }
});

// ==========================================
// KEYBOARD ACCESSIBILITY
// ==========================================

document.addEventListener("keydown", event => {

  if (!cartOverlay.classList.contains("open")) {
    return;
  }

  // ESCAPE TO CLOSE
  if (event.key === "Escape") {
    closeCart();
  }

  // FOCUS TRAP
  if (event.key === "Tab") {

    const focusable = [
      ...cartPanel.querySelectorAll(
        "button:not(:disabled)"
      )
    ];

    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (
      event.shiftKey &&
      document.activeElement === first
    ) {
      event.preventDefault();
      last.focus();
    }

    else if (
      !event.shiftKey &&
      document.activeElement === last
    ) {
      event.preventDefault();
      first.focus();
    }
  }
});

// ==========================================
// CLEAR SHOPPING CART
// ==========================================

clearCartButton.addEventListener("click", () => {

  cart = [];

  saveCart();
  renderCart();

  showToast("Cart cleared.");
});

// ==========================================
// CHECKOUT BUTTON - NEW FEATURE
// ==========================================

checkoutButton.addEventListener("click", () => {

  // CHECK IF CART IS EMPTY
  if (cart.length === 0) {

    showToast(
      "Your cart is empty. Please add products first."
    );

    return;
  }

  // SAVE CART BEFORE NAVIGATION
  saveCart();

  // OPEN CHECKOUT PAGE
  window.location.href = "checkout.html";
});

// ==========================================
// UPDATE FOOTER YEAR
// ==========================================

const yearElement = document.getElementById("year");

if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

// ==========================================
// INITIALIZE SHOPPING CART
// ==========================================

renderCart();
