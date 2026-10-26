
/* =========================================
   ANTI BAKERY - ADMIN DASHBOARD
   Complete Updated JavaScript
   Order Management + Status Updates
========================================= */

// =========================================
// STORAGE KEYS
// =========================================

const ORDERS_KEY = "antiBakeryOrders";
const LAST_ORDER_KEY = "antiBakeryLastOrder";

// =========================================
// DOM ELEMENTS
// =========================================

const adminTotalOrders =
  document.getElementById("adminTotalOrders");

const adminRevenue =
  document.getElementById("adminRevenue");

const adminProducts =
  document.getElementById("adminProducts");

const adminCustomers =
  document.getElementById("adminCustomers");

const adminOrdersBody =
  document.getElementById("adminOrdersBody");

const adminOrderFilter =
  document.getElementById("adminOrderFilter");

const adminOrderDetails =
  document.getElementById("adminOrderDetails");

const adminOrderDetailsContent =
  document.getElementById("adminOrderDetailsContent");

const closeOrderDetails =
  document.getElementById("closeOrderDetails");

// =========================================
// CONSTANTS
// =========================================

const PRODUCT_COUNT = 4;

const ORDER_STATUSES = [
  "Demo Only",
  "Pending",
  "Confirmed",
  "Preparing",
  "Out for Delivery",
  "Delivered",
  "Cancelled"
];

// =========================================
// FORMAT PRICE
// =========================================

function formatPrice(amount) {
  const value = Number(amount);

  return "$" +
    (Number.isFinite(value) ? value : 0).toFixed(2);
}

// =========================================
// FORMAT DATE
// =========================================

function formatDate(dateString) {
  if (!dateString) {
    return "—";
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-LK", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

// =========================================
// READ STORAGE SAFELY
// =========================================

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);

    return value ? JSON.parse(value) : fallback;

  } catch (error) {
    console.error(
      "Storage reading failed:",
      key,
      error
    );

    return fallback;
  }
}

// =========================================
// LOAD SAVED ORDERS
// =========================================

function getAdminOrders() {
  const savedOrders = readStorage(
    ORDERS_KEY,
    []
  );

  if (!Array.isArray(savedOrders)) {
    return [];
  }

  return savedOrders.filter(order => {
    return (
      order &&
      typeof order.id === "string" &&
      order.customer &&
      typeof order.customer === "object" &&
      Array.isArray(order.items) &&
      order.items.length > 0
    );
  });
}

// =========================================
// CALCULATE ORDER TOTAL
// =========================================

function getOrderTotal(order) {
  const savedTotal = Number(order.total);

  if (
    order.total !== undefined &&
    order.total !== null &&
    Number.isFinite(savedTotal) &&
    savedTotal >= 0
  ) {
    return savedTotal;
  }

  const subtotal = order.items.reduce(
    (sum, item) => {
      const price = Number(item.price) || 0;
      const quantity = Number(item.quantity) || 0;

      return sum + price * quantity;
    },
    0
  );

  const delivery = Number(order.deliveryFee) || 0;

  return subtotal + delivery;
}

// =========================================
// CREATE HTML ELEMENT
// =========================================

function createElement(tag, className, textValue) {
  const element = document.createElement(tag);

  if (className) {
    element.className = className;
  }

  if (textValue !== undefined) {
    element.textContent = String(textValue);
  }

  return element;
}

// =========================================
// UNIQUE CUSTOMERS
// =========================================

function getUniqueCustomerCount(orders) {
  const customers = new Set();

  orders.forEach(order => {
    const email = String(
      order.customer.email || ""
    ).trim().toLowerCase();

    if (email) {
      customers.add(email);
    }
  });

  return customers.size;
}

// =========================================
// UPDATE DASHBOARD STATISTICS
// =========================================

function updateAdminStatistics(orders) {
  if (adminTotalOrders) {
    adminTotalOrders.textContent = orders.length;
  }

  const revenue = orders.reduce(
    (sum, order) => sum + getOrderTotal(order),
    0
  );

  if (adminRevenue) {
    adminRevenue.textContent = formatPrice(revenue);
  }

  if (adminProducts) {
    adminProducts.textContent = PRODUCT_COUNT;
  }

  if (adminCustomers) {
    adminCustomers.textContent =
      getUniqueCustomerCount(orders);
  }
}

// =========================================
// SORT ORDERS
// =========================================

function sortAdminOrders(orders) {
  const sortType = adminOrderFilter
    ? adminOrderFilter.value
    : "all";

  const sorted = [...orders];

  const getTime = order => {
    const time = new Date(order.createdAt).getTime();

    return Number.isFinite(time) ? time : 0;
  };

  if (sortType === "oldest") {
    sorted.sort(
      (a, b) => getTime(a) - getTime(b)
    );
  } else {
    sorted.sort(
      (a, b) => getTime(b) - getTime(a)
    );
  }

  return sorted;
}

// =========================================
// CREATE TABLE CELL
// =========================================

function addTableCell(row, textValue) {
  const cell = document.createElement("td");

  cell.textContent = String(textValue);

  row.appendChild(cell);

  return cell;
}

// =========================================
// UPDATE ORDER STATUS
// =========================================

function updateOrderStatus(orderId, newStatus) {
  if (!ORDER_STATUSES.includes(newStatus)) {
    alert("Invalid order status.");
    return false;
  }

  try {
    const storedOrders = readStorage(
      ORDERS_KEY,
      []
    );

    if (!Array.isArray(storedOrders)) {
      throw new Error("Invalid order history.");
    }

    const order = storedOrders.find(
      item => item && item.id === orderId
    );

    if (!order) {
      alert("Order not found.");
      return false;
    }

    // CHANGE STATUS
    order.status = newStatus;

    // SAVE UPDATED HISTORY
    localStorage.setItem(
      ORDERS_KEY,
      JSON.stringify(storedOrders)
    );

    // UPDATE LAST ORDER IF MATCHING
    const lastOrder = readStorage(
      LAST_ORDER_KEY,
      null
    );

    if (
      lastOrder &&
      lastOrder.id === orderId
    ) {
      lastOrder.status = newStatus;

      localStorage.setItem(
        LAST_ORDER_KEY,
        JSON.stringify(lastOrder)
      );
    }

    console.log(
      "Order status updated:",
      orderId,
      newStatus
    );

    return true;

  } catch (error) {
    console.error(
      "Order status update failed:",
      error
    );

    alert("Could not update order status.");

    return false;
  }
}

// =========================================
// CREATE STATUS DROPDOWN
// =========================================

function createStatusSelector(order) {
  const select = document.createElement("select");

  select.className = "admin-status-select";

  select.setAttribute(
    "aria-label",
    "Change status for order " + order.id
  );

  ORDER_STATUSES.forEach(status => {
    const option = document.createElement("option");

    option.value = status;
    option.textContent = status;

    select.appendChild(option);
  });

  select.value = ORDER_STATUSES.includes(order.status)
    ? order.status
    : "Demo Only";

  select.addEventListener("change", () => {
    const previousStatus =
      order.status || "Demo Only";

    const newStatus = select.value;

    const success = updateOrderStatus(
      order.id,
      newStatus
    );

    if (success) {
      renderAdminOrders();

      // Refresh open details if this order is selected
      if (
        adminOrderDetails &&
        !adminOrderDetails.hidden &&
        adminOrderDetails.dataset.orderId === order.id
      ) {
        const updatedOrder = getAdminOrders().find(
          item => item.id === order.id
        );

        if (updatedOrder) {
          showOrderDetails(updatedOrder, false);
        }
      }
    } else {
      select.value = previousStatus;
    }
  });

  return select;
}

// =========================================
// DISPLAY ORDERS TABLE
// =========================================

function renderAdminOrders() {
  if (!adminOrdersBody) {
    console.error("Orders table body is missing.");
    return;
  }

  const orders = getAdminOrders();

  updateAdminStatistics(orders);

  adminOrdersBody.replaceChildren();

  // EMPTY ORDERS
  if (orders.length === 0) {
    const row = document.createElement("tr");

    const cell = createElement(
      "td",
      "admin-empty",
      "No demo orders found. Place an order first."
    );

    cell.colSpan = 7;

    row.appendChild(cell);
    adminOrdersBody.appendChild(row);

    return;
  }

  const sortedOrders = sortAdminOrders(orders);

  sortedOrders.forEach(order => {
    const row = document.createElement("tr");

    // ORDER ID
    addTableCell(row, order.id);

    // CUSTOMER
    addTableCell(
      row,
      order.customer.name || "Unknown Customer"
    );

    // DATE
    addTableCell(
      row,
      formatDate(order.createdAt)
    );

    // ITEM COUNT
    const itemCount = order.items.reduce(
      (sum, item) =>
        sum + (Number(item.quantity) || 0),
      0
    );

    addTableCell(row, itemCount);

    // TOTAL
    addTableCell(
      row,
      formatPrice(getOrderTotal(order))
    );

    // STATUS DROPDOWN
    const statusCell = document.createElement("td");

    const statusSelect =
      createStatusSelector(order);

    statusCell.appendChild(statusSelect);
    row.appendChild(statusCell);

    // VIEW DETAILS BUTTON
    const actionCell = document.createElement("td");

    const viewButton = createElement(
      "button",
      "admin-view-button",
      "View Details"
    );

    viewButton.type = "button";

    viewButton.addEventListener("click", () => {
      showOrderDetails(order);
    });

    actionCell.appendChild(viewButton);
    row.appendChild(actionCell);

    adminOrdersBody.appendChild(row);
  });
}

// =========================================
// CREATE DETAIL ROW
// =========================================

function createDetailRow(label, value) {
  const row = createElement(
    "div",
    "admin-detail-row"
  );

  const labelElement = createElement(
    "span",
    "admin-detail-label",
    label
  );

  const valueElement = createElement(
    "span",
    "admin-detail-value",
    value === undefined ||
    value === null ||
    value === ""
      ? "—"
      : value
  );

  row.append(labelElement, valueElement);

  return row;
}

// =========================================
// CREATE DETAILS CARD
// =========================================

function createDetailCard(title) {
  const card = createElement(
    "div",
    "admin-detail-card"
  );

  const heading = createElement("h3", "", title);

  card.appendChild(heading);

  return card;
}

// =========================================
// DISPLAY ORDER DETAILS
// =========================================

function showOrderDetails(order, scroll = true) {
  if (
    !adminOrderDetails ||
    !adminOrderDetailsContent
  ) {
    return;
  }

  adminOrderDetailsContent.replaceChildren();

  adminOrderDetails.dataset.orderId = order.id;

  const customer = order.customer || {};

  // =====================================
  // ORDER INFORMATION
  // =====================================

  const orderCard = createDetailCard(
    "Order Information"
  );

  orderCard.append(
    createDetailRow("Order ID", order.id),

    createDetailRow(
      "Order Date",
      formatDate(order.createdAt)
    ),

    createDetailRow(
      "Status",
      order.status || "Demo Only"
    )
  );

  // =====================================
  // CUSTOMER INFORMATION
  // =====================================

  const customerCard = createDetailCard(
    "Customer Information"
  );

  customerCard.append(
    createDetailRow(
      "Customer Name",
      customer.name
    ),

    createDetailRow(
      "Email Address",
      customer.email
    ),

    createDetailRow(
      "Phone Number",
      customer.phone
    )
  );

  // =====================================
  // DELIVERY INFORMATION
  // =====================================

  const deliveryCard = createDetailCard(
    "Delivery Information"
  );

  deliveryCard.append(
    createDetailRow(
      "Delivery Address",
      customer.address
    ),

    createDetailRow(
      "City",
      customer.city
    ),

    createDetailRow(
      "Postal Code",
      customer.postalCode
    ),

    createDetailRow(
      "Order Notes",
      customer.notes
    ),

    createDetailRow(
      "Payment Method",
      customer.paymentMethod
    )
  );

  // =====================================
  // ORDERED PRODUCTS
  // =====================================

  const productsCard = createDetailCard(
    "Ordered Products"
  );

  order.items.forEach(item => {
    const productRow = createElement(
      "div",
      "admin-product-row"
    );

    // PRODUCT IMAGE
    if (item.image) {
      const image = document.createElement("img");

      image.src = item.image;
      image.alt = item.name || "Bakery Product";
      image.loading = "lazy";

      productRow.appendChild(image);
    }

    // PRODUCT INFORMATION
    const productInfo = createElement(
      "div",
      "admin-product-info"
    );

    const productName = createElement(
      "h4",
      "",
      item.name || "Bakery Product"
    );

    const productQuantity = createElement(
      "p",
      "",
      `${item.quantity} × ${formatPrice(item.price)}`
    );

    productInfo.append(
      productName,
      productQuantity
    );

    // PRODUCT TOTAL
    const productTotal = createElement(
      "span",
      "admin-product-price",
      formatPrice(
        (Number(item.price) || 0) *
        (Number(item.quantity) || 0)
      )
    );

    productRow.append(
      productInfo,
      productTotal
    );

    productsCard.appendChild(productRow);
  });

  // =====================================
  // PAYMENT SUMMARY
  // =====================================

  const summaryCard = createDetailCard(
    "Payment Summary"
  );

  const subtotal = order.items.reduce(
    (sum, item) =>
      sum +
      (Number(item.price) || 0) *
      (Number(item.quantity) || 0),
    0
  );

  const deliveryFee =
    Number(order.deliveryFee) || 0;

  summaryCard.append(
    createDetailRow(
      "Subtotal",
      formatPrice(subtotal)
    ),

    createDetailRow(
      "Delivery Fee",
      formatPrice(deliveryFee)
    ),

    createDetailRow(
      "Order Total",
      formatPrice(getOrderTotal(order))
    )
  );

  // ADD ALL CARDS
  adminOrderDetailsContent.append(
    orderCard,
    customerCard,
    deliveryCard,
    productsCard,
    summaryCard
  );

  // SHOW DETAILS
  adminOrderDetails.hidden = false;

  // SCROLL ONLY WHEN CLICKING VIEW DETAILS
  if (scroll) {
    adminOrderDetails.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
}

// =========================================
// CLOSE ORDER DETAILS
// =========================================

if (closeOrderDetails) {
  closeOrderDetails.addEventListener(
    "click",
    () => {
      if (adminOrderDetails) {
        adminOrderDetails.hidden = true;
        delete adminOrderDetails.dataset.orderId;
      }
    }
  );
}

// =========================================
// SORT FILTER
// =========================================

if (adminOrderFilter) {
  adminOrderFilter.addEventListener(
    "change",
    renderAdminOrders
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
// INITIALIZE DASHBOARD
// =========================================

if (
  adminTotalOrders &&
  adminRevenue &&
  adminProducts &&
  adminCustomers &&
  adminOrdersBody
) {
  renderAdminOrders();
} else {
  console.error(
    "Some Admin Dashboard HTML elements are missing."
  );
}
