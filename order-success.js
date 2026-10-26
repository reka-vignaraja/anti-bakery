
/* =========================================
   ANTI BAKERY - ORDER SUCCESS JAVASCRIPT
   Full Updated Version
========================================= */

// SAME KEY USED IN checkout.js
const ORDER_STORAGE_KEY = "antiBakeryLastOrder";

// =========================================
// DOM ELEMENTS
// =========================================

const successOrderId =
  document.getElementById("successOrderId");

const successOrderItems =
  document.getElementById("successOrderItems");

const successCustomerName =
  document.getElementById("successCustomerName");

const successEmail =
  document.getElementById("successEmail");

const successPhone =
  document.getElementById("successPhone");

const successAddress =
  document.getElementById("successAddress");

const successPayment =
  document.getElementById("successPayment");

const successDate =
  document.getElementById("successDate");

const successStatus =
  document.getElementById("successStatus");

const successSubtotal =
  document.getElementById("successSubtotal");

const successDelivery =
  document.getElementById("successDelivery");

const successTotal =
  document.getElementById("successTotal");

const noOrderMessage =
  document.getElementById("noOrderMessage");

// =========================================
// FORMAT PRICE
// =========================================

function formatPrice(amount) {
  const value = Number(amount);

  return "$" + (
    Number.isFinite(value) ? value : 0
  ).toFixed(2);
}

// =========================================
// LOAD SAVED ORDER
// =========================================

function loadOrder() {
  try {
    const savedOrder =
      localStorage.getItem(ORDER_STORAGE_KEY);

    console.log("Saved order data:", savedOrder);

    if (!savedOrder) {
      return null;
    }

    const order = JSON.parse(savedOrder);

    if (
      !order ||
      typeof order !== "object" ||
      !order.customer ||
      !Array.isArray(order.items) ||
      order.items.length === 0
    ) {
      return null;
    }

    return order;

  } catch (error) {
    console.error("Error loading order:", error);
    return null;
  }
}

// =========================================
// SHOW NO ORDER MESSAGE
// =========================================

function showNoOrder() {
  const header =
    document.querySelector(".success-header");

  const layout =
    document.querySelector(".success-layout");

  if (header) {
    header.hidden = true;
  }

  if (layout) {
    layout.hidden = true;
  }

  if (noOrderMessage) {
    noOrderMessage.hidden = false;
  }
}

// =========================================
// DISPLAY ORDERED PRODUCTS
// =========================================

function displayOrderItems(items) {

  successOrderItems.replaceChildren();

  items.forEach(item => {

    const quantity = Number(item.quantity);
    const price = Number(item.price);

    const itemTotal = quantity * price;

    // PRODUCT ROW
    const row = document.createElement("div");
    row.className = "success-order-item";

    // PRODUCT IMAGE
    if (item.image) {
      const image = document.createElement("img");

      image.src = item.image;
      image.alt = item.name || "Bakery Product";
      image.loading = "lazy";

      row.appendChild(image);
    }

    // PRODUCT INFORMATION
    const info = document.createElement("div");
    info.className = "success-item-info";

    const name = document.createElement("h3");
    name.textContent = item.name || "Bakery Product";

    const quantityText = document.createElement("p");
    quantityText.textContent =
      `${quantity} × ${formatPrice(price)}`;

    info.append(name, quantityText);

    // PRODUCT TOTAL
    const total = document.createElement("span");
    total.className = "success-item-price";
    total.textContent = formatPrice(itemTotal);

    row.append(info, total);

    successOrderItems.appendChild(row);
  });
}

// =========================================
// DISPLAY CUSTOMER DETAILS
// =========================================

function displayCustomerDetails(customer) {

  successCustomerName.textContent =
    customer.name || "—";

  successEmail.textContent =
    customer.email || "—";

  successPhone.textContent =
    customer.phone || "—";

  // COMPLETE DELIVERY ADDRESS
  const fullAddress = [
    customer.address,
    customer.city,
    customer.postalCode
  ]
    .filter(value => value && String(value).trim())
    .join(", ");

  successAddress.textContent =
    fullAddress || "—";

  successPayment.textContent =
    customer.paymentMethod || "Cash on Delivery (Demo)";
}

// =========================================
// DISPLAY ORDER SUMMARY
// =========================================

function displayOrderSummary(order) {

  // ORDER NUMBER
  successOrderId.textContent =
    order.id || "—";

  // ORDER DATE
  if (order.createdAt) {

    const date = new Date(order.createdAt);

    successDate.textContent =
      Number.isNaN(date.getTime())
        ? "—"
        : date.toLocaleString("en-LK", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          });

  } else {
    successDate.textContent = "—";
  }

  // ORDER STATUS
  successStatus.textContent =
    order.status || "Demo Only";

  // SUBTOTAL
  const subtotal = order.items.reduce(
    (sum, item) => {
      return sum +
        Number(item.price) * Number(item.quantity);
    },
    0
  );

  // DELIVERY FEE
  const deliveryFee = Number(order.deliveryFee) || 0;

  // GRAND TOTAL
  const grandTotal = subtotal + deliveryFee;

  successSubtotal.textContent =
    formatPrice(subtotal);

  successDelivery.textContent =
    formatPrice(deliveryFee);

  successTotal.textContent =
    formatPrice(grandTotal);
}

// =========================================
// INITIALIZE ORDER SUCCESS PAGE
// =========================================

function initializeOrderSuccess() {

  const order = loadOrder();

  // NO ORDER FOUND
  if (!order) {
    console.warn("No demo order found.");
    showNoOrder();
    return;
  }

  console.log("Order loaded successfully:", order.id);

  // SHOW ORDER DETAILS
  displayOrderItems(order.items);

  displayCustomerDetails(order.customer);

  displayOrderSummary(order);

  // SHOW CONTENT
  const header =
    document.querySelector(".success-header");

  const layout =
    document.querySelector(".success-layout");

  if (header) {
    header.hidden = false;
  }

  if (layout) {
    layout.hidden = false;
  }

  if (noOrderMessage) {
    noOrderMessage.hidden = true;
  }
}

// =========================================
// FOOTER YEAR
// =========================================

const yearElement = document.getElementById("year");

if (yearElement) {
  yearElement.textContent =
    new Date().getFullYear();
}

// =========================================
// START PAGE
// =========================================

initializeOrderSuccess();
