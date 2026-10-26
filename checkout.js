
/* =========================================
   ANTI BAKERY - CHECKOUT JAVASCRIPT
   Complete Updated Version
   Cart + Checkout + Order History
========================================= */

// =========================================
// STORAGE KEYS
// =========================================

const CART_KEY = "antiBakeryCartV1";
const LAST_ORDER_KEY = "antiBakeryLastOrder";
const ORDERS_KEY = "antiBakeryOrders";

// =========================================
// PRODUCT DETAILS
// =========================================

const PRODUCTS = {
  "Chocolate Cupcake": {
    price: 2.50,
    image: "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?auto=format&fit=crop&w=600&q=85"
  },

  "Berry Cheesecake": {
    price: 3.75,
    image: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=600&q=85"
  },

  "Chocolate Brownie": {
    price: 2.99,
    image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=85"
  },

  "Classic Doughnut": {
    price: 1.99,
    image: "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=600&q=85"
  }
};

// =========================================
// DOM ELEMENTS
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

const DELIVERY_FEE = 0;

// =========================================
// FORMAT PRICE
// =========================================

function formatPrice(amount) {
  return "$" + Number(amount).toFixed(2);
}

// =========================================
// READ LOCAL STORAGE SAFELY
// =========================================

function readStorage(key, fallback) {
  try {
    const storedValue = localStorage.getItem(key);

    if (!storedValue) {
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
// GET SHOPPING CART
// =========================================

function getCart() {
  const savedCart = readStorage(CART_KEY, []);

  if (!Array.isArray(savedCart)) {
    return [];
  }

  return savedCart
    .filter(item => {
      if (
        !item ||
        typeof item.name !== "string"
      ) {
        return false;
      }

      const quantity = Number(item.quantity);

      return (
        Object.prototype.hasOwnProperty.call(
          PRODUCTS,
          item.name
        ) &&
        Number.isInteger(quantity) &&
        quantity > 0 &&
        quantity <= 99
      );
    })
    .map(item => {
      const product = PRODUCTS[item.name];

      return {
        name: item.name,
        quantity: Number(item.quantity),
        price: product.price,
        image: product.image
      };
    });
}

// =========================================
// SHOW EMPTY CART
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
// DISPLAY CHECKOUT PRODUCTS
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

  placeOrderButton.disabled = false;

  let subtotal = 0;

  cart.forEach(item => {
    const itemTotal =
      item.price * item.quantity;

    subtotal += itemTotal;

    const row =
      document.createElement("div");

    row.className = "checkout-item";

    // PRODUCT IMAGE
    const image =
      document.createElement("img");

    image.src = item.image;
    image.alt = item.name;
    image.loading = "lazy";

    // PRODUCT DETAILS
    const details =
      document.createElement("div");

    details.className =
      "checkout-item-details";

    const name =
      document.createElement("h3");

    name.textContent = item.name;

    const quantity =
      document.createElement("p");

    quantity.textContent =
      `${item.quantity} × ${formatPrice(item.price)}`;

    details.append(name, quantity);

    // ITEM TOTAL
    const total =
      document.createElement("span");

    total.className =
      "checkout-item-price";

    total.textContent =
      formatPrice(itemTotal);

    row.append(image, details, total);

    checkoutItems.appendChild(row);
  });

  checkoutSubtotal.textContent =
    formatPrice(subtotal);

  checkoutDelivery.textContent =
    formatPrice(DELIVERY_FEE);

  checkoutTotal.textContent =
    formatPrice(subtotal + DELIVERY_FEE);
}

// =========================================
// SAVE ORDER TO HISTORY
// =========================================

function saveOrder(demoOrder) {
  try {
    // GET EXISTING ORDER HISTORY
    const savedOrders =
      readStorage(ORDERS_KEY, []);

    if (!Array.isArray(savedOrders)) {
      throw new Error(
        "Invalid order history format."
      );
    }

    // COPY EXISTING ORDERS
    const updatedOrders = [...savedOrders];

    // GET PREVIOUS LAST ORDER
    const previousOrder =
      readStorage(LAST_ORDER_KEY, null);

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

    // SAVE COMPLETE HISTORY
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

    console.log(
      "Total saved orders:",
      updatedOrders.length
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
// CUSTOMER FORM + PLACE ORDER
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

      // CREATE NEW DEMO ORDER
      const demoOrder = {
        id: "ANTI-" + Date.now(),

        customer: customer,

        items: cart,

        subtotal: subtotal,

        deliveryFee: DELIVERY_FEE,

        total: subtotal + DELIVERY_FEE,

        status: "Demo Only",

        createdAt: new Date().toISOString()
      };

      // SAVE ORDER
      const orderSaved =
        saveOrder(demoOrder);

      if (!orderSaved) {
        alert(
          "Could not save your demo order. Please try again."
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
// FOOTER YEAR
// =========================================

const yearElement =
  document.getElementById("year");

if (yearElement) {
  yearElement.textContent =
    new Date().getFullYear();
}

// =========================================
// INITIALIZE CHECKOUT
// =========================================

renderCheckout();
