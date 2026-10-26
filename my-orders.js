
/* =========================================
   ANTI BAKERY - MY ORDERS
   Complete Updated Version
   Order History + Admin Status Sync
========================================= */

// =========================================
// STORAGE KEYS
// =========================================

const ORDERS_KEY = "antiBakeryOrders";
const LAST_ORDER_KEY = "antiBakeryLastOrder";

// =========================================
// DOM ELEMENTS
// =========================================

const ordersList =
  document.getElementById("ordersList");

const emptyOrders =
  document.getElementById("emptyOrders");

const sortOrders =
  document.getElementById("sortOrders");

const orderDialog =
  document.getElementById("orderDialog");

const orderDetails =
  document.getElementById("orderDetails");

const closeDialog =
  document.getElementById("closeDialog");

const totalOrdersElement =
  document.getElementById("totalOrders");

const totalItemsElement =
  document.getElementById("totalItems");

const totalSpentElement =
  document.getElementById("totalSpent");

// =========================================
// READ LOCAL STORAGE
// =========================================

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);

    return value ? JSON.parse(value) : fallback;

  } catch (error) {
    console.error(
      "Storage reading error:",
      key,
      error
    );

    return fallback;
  }
}

// =========================================
// GET LATEST ORDER HISTORY
// =========================================

function getOrders() {
  const history = readStorage(ORDERS_KEY, []);

  const orders = Array.isArray(history)
    ? [...history]
    : [];

  const lastOrder = readStorage(
    LAST_ORDER_KEY,
    null
  );

  // Include old last order only if missing
  if (
    lastOrder &&
    typeof lastOrder.id === "string" &&
    Array.isArray(lastOrder.items) &&
    !orders.some(
      order => order && order.id === lastOrder.id
    )
  ) {
    orders.push(lastOrder);
  }

  // Remove invalid and duplicate orders
  const uniqueOrders = new Map();

  orders.forEach(order => {
    if (
      order &&
      typeof order.id === "string" &&
      Array.isArray(order.items)
    ) {
      uniqueOrders.set(order.id, order);
    }
  });

  return Array.from(uniqueOrders.values());
}

// =========================================
// FORMAT PRICE
// =========================================

function money(value) {
  const amount = Number(value);

  return "$" +
    (Number.isFinite(amount) ? amount : 0).toFixed(2);
}

// =========================================
// FORMAT DATE
// =========================================

function formatDate(date) {
  const parsed = new Date(date);

  return Number.isNaN(parsed.getTime())
    ? "Unknown date"
    : parsed.toLocaleString("en-LK", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
}

// =========================================
// CREATE HTML ELEMENT
// =========================================

function createElement(tag, className, text) {
  const element = document.createElement(tag);

  if (className) {
    element.className = className;
  }

  if (text !== undefined) {
    element.textContent = String(text);
  }

  return element;
}

// =========================================
// GET ITEM COUNT
// =========================================

function getItemCount(order) {
  return order.items.reduce(
    (sum, item) =>
      sum + (Number(item.quantity) || 0),
    0
  );
}

// =========================================
// UPDATE STATISTICS
// =========================================

function updateStatistics(orders) {
  const totalItems = orders.reduce(
    (sum, order) => sum + getItemCount(order),
    0
  );

  const totalSpent = orders.reduce(
    (sum, order) => sum + (Number(order.total) || 0),
    0
  );

  if (totalOrdersElement) {
    totalOrdersElement.textContent =
      orders.length;
  }

  if (totalItemsElement) {
    totalItemsElement.textContent =
      totalItems;
  }

  if (totalSpentElement) {
    totalSpentElement.textContent =
      money(totalSpent);
  }
}

// =========================================
// SORT ORDERS
// =========================================

function sortedOrders(orders) {
  const result = [...orders];

  const selected = sortOrders
    ? sortOrders.value
    : "newest";

  const getTime = order => {
    const time = new Date(
      order.createdAt
    ).getTime();

    return Number.isFinite(time) ? time : 0;
  };

  if (selected === "oldest") {
    result.sort(
      (a, b) => getTime(a) - getTime(b)
    );

  } else if (selected === "highest") {
    result.sort(
      (a, b) =>
        Number(b.total || 0) -
        Number(a.total || 0)
    );

  } else if (selected === "lowest") {
    result.sort(
      (a, b) =>
        Number(a.total || 0) -
        Number(b.total || 0)
    );

  } else {
    result.sort(
      (a, b) => getTime(b) - getTime(a)
    );
  }

  return result;
}

// =========================================
// CREATE DETAIL ROW
// =========================================

function addDetail(parent, label, value) {
  const row = createElement(
    "div",
    "detail-row"
  );

  const name = createElement(
    "span",
    "",
    label
  );

  const detail = createElement(
    "strong",
    "",
    String(
      value === undefined ||
      value === null ||
      value === ""
        ? "—"
        : value
    )
  );

  row.append(name, detail);

  parent.appendChild(row);
}

// =========================================
// SHOW ORDER DETAILS
// =========================================

function showOrderDetails(orderId) {
  if (!orderDetails || !orderDialog) {
    return;
  }

  // Always read latest saved order
  const order = getOrders().find(
    item => item.id === orderId
  );

  if (!order) {
    alert("Order not found.");
    renderOrders();
    return;
  }

  orderDetails.replaceChildren();

  // ORDER INFORMATION
  addDetail(
    orderDetails,
    "Order Number",
    order.id
  );

  addDetail(
    orderDetails,
    "Order Date",
    formatDate(order.createdAt)
  );

  addDetail(
    orderDetails,
    "Status",
    order.status || "Demo Only"
  );

  // CUSTOMER INFORMATION
  const customer = order.customer || {};

  const customerHeading = createElement(
    "h3",
    "detail-section",
    "Customer Information"
  );

  orderDetails.appendChild(customerHeading);

  addDetail(
    orderDetails,
    "Name",
    customer.name
  );

  addDetail(
    orderDetails,
    "Email",
    customer.email
  );

  addDetail(
    orderDetails,
    "Phone",
    customer.phone
  );

  addDetail(
    orderDetails,
    "Address",
    [
      customer.address,
      customer.city,
      customer.postalCode
    ].filter(Boolean).join(", ")
  );

  addDetail(
    orderDetails,
    "Payment",
    customer.paymentMethod
  );

  // ORDERED PRODUCTS
  const itemsHeading = createElement(
    "h3",
    "detail-section",
    "Ordered Products"
  );

  orderDetails.appendChild(itemsHeading);

  order.items.forEach(item => {
    const quantity =
      Number(item.quantity) || 0;

    const price =
      Number(item.price) || 0;

    addDetail(
      orderDetails,
      `${item.name} × ${quantity}`,
      money(quantity * price)
    );
  });

  // PAYMENT SUMMARY
  const totalHeading = createElement(
    "h3",
    "detail-section",
    "Payment Summary"
  );

  orderDetails.appendChild(totalHeading);

  addDetail(
    orderDetails,
    "Subtotal",
    money(order.subtotal)
  );

  addDetail(
    orderDetails,
    "Delivery",
    money(order.deliveryFee)
  );

  addDetail(
    orderDetails,
    "Total",
    money(order.total)
  );

  // OPEN DIALOG
  if (!orderDialog.open) {
    if (
      typeof orderDialog.showModal === "function"
    ) {
      orderDialog.showModal();
    }
  }
}

// =========================================
// CREATE ORDER CARD
// =========================================

function createOrderCard(order) {
  const card = createElement(
    "article",
    "order-card"
  );

  const top = createElement(
    "div",
    "order-card-top"
  );

  const titleGroup = createElement("div");

  const title = createElement(
    "h3",
    "",
    order.id
  );

  const date = createElement(
    "p",
    "order-date",
    formatDate(order.createdAt)
  );

  titleGroup.append(title, date);

  // ORDER STATUS
  const status = createElement(
    "span",
    "status",
    order.status || "Demo Only"
  );

  top.append(titleGroup, status);

  // ORDER SUMMARY
  const summary = createElement(
    "p",
    "order-summary-text",
    `${getItemCount(order)} item(s) • ${order.items.length} product type(s)`
  );

  const bottom = createElement(
    "div",
    "order-card-bottom"
  );

  const total = createElement(
    "strong",
    "order-total",
    money(order.total)
  );

  const detailsButton = createElement(
    "button",
    "details-btn",
    "View Order Details"
  );

  detailsButton.type = "button";

  detailsButton.addEventListener(
    "click",
    () => {
      showOrderDetails(order.id);
    }
  );

  bottom.append(total, detailsButton);

  card.append(top, summary, bottom);

  return card;
}

// =========================================
// RENDER MY ORDERS
// =========================================

function renderOrders() {
  if (!ordersList || !emptyOrders) {
    console.error(
      "My Orders HTML elements are missing."
    );
    return;
  }

  const orders = getOrders();

  updateStatistics(orders);

  ordersList.replaceChildren();

  if (orders.length === 0) {
    emptyOrders.hidden = false;
    return;
  }

  emptyOrders.hidden = true;

  sortedOrders(orders).forEach(order => {
    ordersList.appendChild(
      createOrderCard(order)
    );
  });
}

// =========================================
// SORT CHANGE
// =========================================

if (sortOrders) {
  sortOrders.addEventListener(
    "change",
    renderOrders
  );
}

// =========================================
// CLOSE ORDER DETAILS
// =========================================

if (closeDialog && orderDialog) {
  closeDialog.addEventListener(
    "click",
    () => {
      orderDialog.close();
    }
  );
}

if (orderDialog) {
  orderDialog.addEventListener(
    "click",
    event => {
      if (event.target === orderDialog) {
        orderDialog.close();
      }
    }
  );
}

// =========================================
// REFRESH WHEN RETURNING TO PAGE
// =========================================

window.addEventListener("pageshow", () => {
  renderOrders();
});

// =========================================
// SYNC CHANGES FROM OTHER TABS
// =========================================

window.addEventListener(
  "storage",
  event => {
    if (
      event.key === ORDERS_KEY ||
      event.key === LAST_ORDER_KEY
    ) {
      renderOrders();
    }
  }
);

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
// INITIALIZE
// =========================================

renderOrders();
