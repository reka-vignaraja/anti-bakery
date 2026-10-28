
// =========================================
// ANTI BAKERY - CHECKOUT JAVASCRIPT
// Updated: Dynamic Products + Order History
// =========================================

// =========================================
// 1. STORAGE KEYS
// =========================================

const CART_KEY = "antiBakeryCartV1";
const PRODUCTS_KEY = "antiBakeryProductsV1";
const LAST_ORDER_KEY = "antiBakeryLastOrder";
const ORDERS_KEY = "antiBakeryOrders";

const DELIVERY_FEE = 0;

// =========================================
// 2. DEFAULT PRODUCTS
// =========================================

const DEFAULT_PRODUCTS = [
  {
    name: "Chocolate Cupcake",
    price: 2.50,
    image: "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?auto=format&fit=crop&w=600&q=85",
    status: "Available"
  },
  {
    name: "Berry Cheesecake",
    price: 3.75,
    image: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=600&q=85",
    status: "Available"
  },
  {
    name: "Chocolate Brownie",
    price: 2.99,
    image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=85",
    status: "Available"
  },
  {
    name: "Classic Doughnut",
    price: 1.99,
    image: "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=600&q=85",
    status: "Available"
  }
];

// =========================================
// 3. DOM ELEMENTS
// =========================================

const checkoutForm =
  document.getElementById("checkoutForm");

const checkoutItems =
  document.getElementById("checkoutItems");

const checkoutSubtotal =
  document.getElementById("checkoutSubtotal");

const checkoutDelivery =
  document.getElementById("checkoutDelivery");

const checkoutTotal =
  document.getElementById("checkoutTotal");

const placeOrderButton =
  document.getElementById("placeOrderButton");

// =========================================
// 4. FORMAT PRICE
// =========================================

function formatPrice(amount) {
  return "$" + Number(amount).toFixed(2);
}

// =========================================
// 5. READ LOCAL STORAGE SAFELY
// =========================================

function readStorage(key, fallback) {
  try {
    const storedValue = localStorage.getItem(key);

    if (storedValue === null) {
      return fallback;
    }

    return JSON.parse(storedValue);

  } catch (error) {
    console.error(
      "Error reading localStorage:",
      key,
      error
    );

    return fallback;
  }
}

// =========================================
// 6. CHECK PRODUCT AVAILABILITY
// =========================================

function getStockQuantity(product) {
  if (product.stockQuantity === null || product.stockQuantity === undefined || product.stockQuantity === "") return null;
  const n = Number(product.stockQuantity);
  return Number.isInteger(n) && n >= 0 ? n : null;
}

function isProductAvailable(product) {
  if (
    product.available === false ||
    product.inStock === false ||
    getStockQuantity(product) === 0 ||
    product.stock === 0 ||
    product.stock === "0"
  ) {
    return false;
  }

  const status = String(
    product.status ??
    product.stockStatus ??
    product.availability ??
    (typeof product.stock === "string" ? product.stock : undefined) ??
    "Available"
  ).trim().toLowerCase();

  return ![
    "out of stock",
    "out-of-stock",
    "out",
    "unavailable",
    "inactive",
    "sold out"
  ].includes(status);
}

// =========================================
// 7. LOAD PRODUCTS FROM ADMIN STORAGE
// =========================================

function getProducts() {
  const savedProducts = readStorage(
    PRODUCTS_KEY,
    null
  );

  const source = Array.isArray(savedProducts)
    ? savedProducts
    : DEFAULT_PRODUCTS;

  return source
    .filter(product => {
      if (
        !product ||
        typeof product !== "object"
      ) {
        return false;
      }

      const name = String(
        product.name ?? ""
      ).trim();

      const price = Number(product.price);

      return (
        name.length > 0 &&
        Number.isFinite(price) &&
        price >= 0
      );
    })
    .map(product => ({
      name: String(product.name).trim(),
      price: Number(product.price),
      image: String(
        product.image ??
        product.imageUrl ??
        DEFAULT_PRODUCTS[0].image
      ),
      available: isProductAvailable(product),
      stockQuantity: getStockQuantity(product)
    }));
}

// =========================================
// 8. GET SHOPPING CART
// =========================================

function getCart() {
  const savedCart = readStorage(CART_KEY, []);

  if (!Array.isArray(savedCart)) {
    return [];
  }

  const products = getProducts();

  return savedCart
    .filter(item => {
      if (
        !item ||
        typeof item.name !== "string"
      ) {
        return false;
      }

      const quantity = Number(item.quantity);

      const product = products.find(
        product => product.name === item.name
      );

      return (
        Boolean(product) &&
        Number.isInteger(quantity) &&
        quantity > 0 &&
        quantity <= 99
      );
    })
    .map(item => {
      const product = products.find(
        product => product.name === item.name
      );

      return {
        name: product.name,
        quantity: Number(item.quantity),
        price: product.price,
        image: product.image,
        available: product.available && (product.stockQuantity === null || Number(item.quantity) <= product.stockQuantity),
        stockQuantity: product.stockQuantity
      };
    });
}

// =========================================
// 9. SHOW EMPTY CART
// =========================================

function showEmptyCart() {
  if (
    !checkoutItems ||
    !checkoutSubtotal ||
    !checkoutDelivery ||
    !checkoutTotal ||
    !placeOrderButton
  ) {
    return;
  }

  const empty = document.createElement("div");
  empty.className = "checkout-empty";

  const message = document.createElement("p");
  message.textContent =
    "Your shopping cart is empty.";

  const link = document.createElement("a");
  link.href = "index.html#menu";
  link.className = "button";
  link.textContent = "Continue Shopping";

  empty.append(message, link);
  checkoutItems.appendChild(empty);

  checkoutSubtotal.textContent = formatPrice(0);
  checkoutDelivery.textContent = formatPrice(0);
  checkoutTotal.textContent = formatPrice(0);

  placeOrderButton.disabled = true;
}

// =========================================
// 10. DISPLAY CHECKOUT PRODUCTS
// =========================================

function renderCheckout() {
  if (
    !checkoutItems ||
    !checkoutSubtotal ||
    !checkoutDelivery ||
    !checkoutTotal ||
    !placeOrderButton
  ) {
    console.error(
      "Checkout HTML elements are missing."
    );
    return;
  }

  const cart = getCart();

  checkoutItems.replaceChildren();

  if (cart.length === 0) {
    showEmptyCart();
    return;
  }

  const unavailableItems = cart.filter(
    item => !item.available
  );

  placeOrderButton.disabled =
    unavailableItems.length > 0;

  let subtotal = 0;

  cart.forEach(item => {
    const itemTotal =
      item.price * item.quantity;

    subtotal += itemTotal;

    // PRODUCT ROW
    const row = document.createElement("div");
    row.className = "checkout-item";

    // PRODUCT IMAGE
    const image = document.createElement("img");

    image.src = item.image;
    image.alt = item.name;
    image.loading = "lazy";

    // PRODUCT DETAILS
    const details = document.createElement("div");

    details.className =
      "checkout-item-details";

    const name = document.createElement("h3");
    name.textContent = item.name;

    const quantity = document.createElement("p");

    quantity.textContent =
      `${item.quantity} × ${formatPrice(item.price)}`;

    details.append(name, quantity);

    // OUT OF STOCK MESSAGE
    if (!item.available) {
      const warning = document.createElement("p");

      warning.textContent =
        "Unavailable or insufficient stock - please adjust your cart.";

      warning.style.color = "#dc2626";
      warning.style.fontSize = "13px";

      details.appendChild(warning);
    }

    // ITEM TOTAL
    const total = document.createElement("span");

    total.className = "checkout-item-price";

    total.textContent =
      formatPrice(itemTotal);

    row.append(image, details, total);

    checkoutItems.appendChild(row);
  });

  // SUBTOTAL
  checkoutSubtotal.textContent =
    formatPrice(subtotal);

  // DELIVERY FEE
  checkoutDelivery.textContent =
    formatPrice(DELIVERY_FEE);

  // GRAND TOTAL
  checkoutTotal.textContent =
    formatPrice(subtotal + DELIVERY_FEE);

  // SHOW WARNING IF ANY PRODUCT IS UNAVAILABLE
  if (unavailableItems.length > 0) {
    const warning = document.createElement("p");

    warning.textContent =
      "Some items are unavailable or exceed remaining stock. Please adjust your cart.";

    warning.style.color = "#dc2626";
    warning.style.marginTop = "15px";

    checkoutItems.appendChild(warning);
  }
}

// =========================================
// 11. SAVE ORDER TO HISTORY
// =========================================

function saveOrder(demoOrder) {
  try {
    const savedOrders = readStorage(
      ORDERS_KEY,
      []
    );

    if (!Array.isArray(savedOrders)) {
      throw new Error(
        "Invalid order history format."
      );
    }

    const updatedOrders = [...savedOrders];

    const previousOrder = readStorage(
      LAST_ORDER_KEY,
      null
    );

    // RECOVER PREVIOUS LAST ORDER
    if (
      previousOrder &&
      typeof previousOrder === "object" &&
      previousOrder.id &&
      Array.isArray(previousOrder.items) &&
      !updatedOrders.some(
        order => order.id === previousOrder.id
      )
    ) {
      updatedOrders.push(previousOrder);
    }

    // PREVENT DUPLICATE ORDER
    if (
      !updatedOrders.some(
        order => order.id === demoOrder.id
      )
    ) {
      updatedOrders.push(demoOrder);
    }

    // SAVE COMPLETE ORDER HISTORY
    localStorage.setItem(
      ORDERS_KEY,
      JSON.stringify(updatedOrders)
    );

    // SAVE CURRENT ORDER FOR SUCCESS PAGE
    localStorage.setItem(
      LAST_ORDER_KEY,
      JSON.stringify(demoOrder)
    );

    console.log(
      "Order saved successfully:",
      demoOrder.id
    );

    return true;

  } catch (error) {
    console.error(
      "Order saving failed:",
      error
    );

    return false;
  }
}

// =========================================
// 12. CUSTOMER FORM + PLACE ORDER
// =========================================

if (checkoutForm) {
  checkoutForm.addEventListener(
    "submit",
    function(event) {
      event.preventDefault();

      const cart = getCart();

      // CHECK EMPTY CART
      if (cart.length === 0) {
        alert(
          "Your cart is empty. Add products first."
        );

        renderCheckout();
        return;
      }

      // CHECK PRODUCT AVAILABILITY
      const unavailableItems = cart.filter(
        item => !item.available
      );

      if (unavailableItems.length > 0) {
        alert(
          "Some products are out of stock. Please remove them before placing your order."
        );

        renderCheckout();
        return;
      }

      // HTML FORM VALIDATION
      if (!checkoutForm.reportValidity()) {
        return;
      }

      const formData =
        new FormData(checkoutForm);

      // CUSTOMER INFORMATION
      const customer = {
        name: String(
          formData.get("customerName") || ""
        ).trim(),

        email: String(
          formData.get("customerEmail") || ""
        ).trim(),

        phone: String(
          formData.get("customerPhone") || ""
        ).trim(),

        address: String(
          formData.get("deliveryAddress") || ""
        ).trim(),

        city: String(
          formData.get("deliveryCity") || ""
        ).trim(),

        postalCode: String(
          formData.get("deliveryPostal") || ""
        ).trim(),

        notes: String(
          formData.get("orderNotes") || ""
        ).trim(),

        paymentMethod: String(
          formData.get("paymentMethod") || ""
        ).trim()
      };

      // VALIDATE REQUIRED FIELDS
      if (
        !customer.name ||
        !customer.email ||
        !customer.phone ||
        !customer.address ||
        !customer.city
      ) {
        alert(
          "Please fill all required delivery details."
        );
        return;
      }

      // CALCULATE SUBTOTAL
      const subtotal = cart.reduce(
        (sum, item) =>
          sum + item.price * item.quantity,
        0
      );

      // CREATE NEW ORDER
      const demoOrder = {
        id: "ANTI-" + Date.now(),

        customer: customer,

        items: cart.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          image: item.image
        })),

        subtotal: subtotal,

        deliveryFee: DELIVERY_FEE,

        total: subtotal + DELIVERY_FEE,

        status: "Pending",

        createdAt: new Date().toISOString()
      };

      // Re-read current stock immediately before placing the order.
      const rawProducts = readStorage(PRODUCTS_KEY, null);
      const stockProducts = Array.isArray(rawProducts) ? rawProducts : null;
      const updatedProducts = stockProducts ? stockProducts.map(p => ({ ...p })) : null;
      if (updatedProducts) {
        let stockError = false;
        for (const item of cart) {
          const product = updatedProducts.find(p => p.name === item.name);
          if (!product || !isProductAvailable(product)) { stockError = true; break; }
          const count = getStockQuantity(product);
          if (count !== null) {
            if (count < item.quantity) { stockError = true; break; }
            product.stockQuantity = count - item.quantity;
            if (product.stockQuantity === 0) product.stock = "out";
          }
        }
        if (stockError) {
          alert("Stock has changed. Please review your cart.");
          renderCheckout();
          return;
        }
      }

      // Demo-only localStorage update. Backend transactions are required for real shops.
      try {
        if (updatedProducts) localStorage.setItem(PRODUCTS_KEY, JSON.stringify(updatedProducts));
      } catch (error) {
        alert("Unable to update stock. Order was not placed.");
        return;
      }

      // SAVE ORDER
      const orderSaved = saveOrder(demoOrder);
      if (!orderSaved && stockProducts) {
        try { localStorage.setItem(PRODUCTS_KEY, JSON.stringify(stockProducts)); }
        catch (error) { console.error("Stock rollback failed", error); }
      }

      if (!orderSaved) {
        alert(
          "Could not save your order. Please try again."
        );
        return;
      }

      // CLEAR SHOPPING CART
      localStorage.removeItem(CART_KEY);

      // REDIRECT TO ORDER SUCCESS
      window.location.assign(
        "order-success.html"
      );
    }
  );
}

// =========================================
// 13. FOOTER YEAR
// =========================================

const yearElement =
  document.getElementById("year");

if (yearElement) {
  yearElement.textContent =
    new Date().getFullYear();
}

// =========================================
// 14. REFRESH CHECKOUT
// =========================================

window.addEventListener("pageshow", () => {
  renderCheckout();
});

window.addEventListener("storage", event => {
  if (
    event.key === CART_KEY ||
    event.key === PRODUCTS_KEY
  ) {
    renderCheckout();
  }
});

// =========================================
// 15. INITIALIZE CHECKOUT
// =========================================

renderCheckout();

console.log("Anti Bakery checkout initialized.");
