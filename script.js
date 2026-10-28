
document.addEventListener("DOMContentLoaded", () => {
  // ==========================================
  // ANTI BAKERY - COMPLETE MAIN JAVASCRIPT
  // ==========================================

  const PRODUCT_STORAGE_KEY = "antiBakeryProductsV1";
  const CART_STORAGE_KEY = "antiBakeryCartV1";
  const WISHLIST_STORAGE_KEY = "antiBakeryWishlistV1";

  const defaultProducts = [
    {
      id: "default-1",
      name: "Chocolate Cupcake",
      price: 2.50,
      image: "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?auto=format&fit=crop&w=600&q=85",
      status: "Available"
    },
    {
      id: "default-2",
      name: "Berry Cheesecake",
      price: 3.75,
      image: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=600&q=85",
      status: "Available"
    },
    {
      id: "default-3",
      name: "Chocolate Brownie",
      price: 2.99,
      image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=85",
      status: "Available"
    },
    {
      id: "default-4",
      name: "Classic Doughnut",
      price: 1.99,
      image: "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=600&q=85",
      status: "Available"
    }
  ];

  // ELEMENTS
  const $ = id => document.getElementById(id);

  const productsGrid = $("productsGrid");
  const viewAllButton = $("viewAllProducts");
  const productSearch = $("productSearch");
  const categoryFilter = $("categoryFilter");
  const productResults = $("productResults");

  const cartButton = $("cartButton");
  const cartOverlay = $("cartOverlay");
  const cartPanel = cartOverlay?.querySelector(".cart-panel");
  const closeCartButton = $("closeCart");
  const cartItems = $("cartItems");
  const cartCount = $("cartCount");
  const cartTotal = $("cartTotal");
  const clearCartButton = $("clearCart");
  const checkoutButton = $("checkoutButton");

  const productModal = $("productModal");
  const productModalPanel =
    productModal?.querySelector(".product-modal");
  const closeProductModalButton = $("closeProductModal");
  const modalProductImage = $("modalProductImage");
  const modalProductName = $("modalProductName");
  const modalProductPrice = $("modalProductPrice");
  const modalProductDescription = $("modalProductDescription");
  const modalProductStock = $("modalProductStock");
  const modalQuantity = $("modalQuantity");
  const modalQuantityMinus = $("modalQuantityMinus");
  const modalQuantityPlus = $("modalQuantityPlus");
  const modalAddToCart = $("modalAddToCart");

  const wishlistButton = $("wishlistButton");
  const wishlistCount = $("wishlistCount");
  const wishlistOverlay = $("wishlistOverlay");
  const wishlistPanel =
    wishlistOverlay?.querySelector(".wishlist-panel");
  const wishlistItems = $("wishlistItems");
  const closeWishlistButton = $("closeWishlist");
  const continueWishlistShopping =
    $("continueWishlistShopping");

  const menuToggle = $("menuToggle");
  const navLinks = $("navLinks");
  const toast = $("toast");

  // APPLICATION STATE
  let products = [];
  let cart = [];
  let wishlist = [];
  let showAllProducts = false;
  let selectedModalProduct = null;
  let selectedModalQuantity = 1;
  let previousFocus = null;
  let toastTimer = null;

  // HELPERS
  function formatPrice(value) {
    return "$" + Number(value).toFixed(2);
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function safeImageURL(value) {
    const image = String(value ?? "").trim();

    if (/^data:image\/(?:jpeg|png|webp);base64,[a-z0-9+/=\s]+$/i.test(image)) {
      return image;
    }

    try {
      const url = new URL(image, window.location.href);

      if (url.protocol === "http:" || url.protocol === "https:") {
        return url.href;
      }
    } catch (error) {
      console.warn("Invalid image URL:", error);
    }

    return defaultProducts[0].image;
  }

  function getStockQuantity(product) {
    const raw = product.stockQuantity;
    if (raw === undefined || raw === null || raw === "") return null;
    const n = Number(raw);
    return Number.isInteger(n) && n >= 0 ? n : null;
  }
  function remainingStock(product) {
    if (!product || !product.available) return 0;
    return product.stockQuantity === null ? 99 : Math.min(99, product.stockQuantity);
  }
  function inCart(name) {
    return cart.find(item => item.name === name)?.quantity ?? 0;
  }

  function getProductStatus(product) {
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
    ).toLowerCase().trim();

    return ![
      "out of stock",
      "out-of-stock",
      "out",
      "unavailable",
      "inactive",
      "sold out"
    ].includes(status);
  }

  function getProductCategory(product) {
    const category = String(product.category ?? "")
      .toLowerCase().trim();

    if (category) return category;

    const name = String(product.name ?? "").toLowerCase();

    if (name.includes("cupcake")) return "cupcakes";
    if (name.includes("cheesecake")) return "cheesecakes";
    if (name.includes("brownie")) return "brownies";
    if (name.includes("doughnut") || name.includes("donut")) {
      return "doughnuts";
    }
    if (name.includes("cookie")) return "cookies";
    if (name.includes("cake")) return "cakes";

    return "other";
  }

  function normalizeProduct(product, index) {
    if (!product || typeof product !== "object") return null;

    const name = String(product.name ?? "").trim();
    const price = Number(product.price);

    if (!name || !Number.isFinite(price) || price < 0) {
      return null;
    }

    return {
      id: String(product.id ?? index),
      name,
      price,
      image: safeImageURL(product.image ?? product.imageUrl),
      available: getProductStatus(product),
      stockQuantity: getStockQuantity(product),
      category: getProductCategory(product),
      description: String(product.description ?? "").trim()
    };
  }

  function findProduct(name) {
    return products.find(product => product.name === name);
  }

  function findProductById(id) {
    return products.find(product => product.id === id);
  }

  function loadProducts() {
    let storedProducts = null;

    try {
      const saved = localStorage.getItem(PRODUCT_STORAGE_KEY);

      if (saved !== null) {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          storedProducts = parsed;
        }
      }
    } catch (error) {
      console.error("Unable to load products:", error);
    }

    const source = storedProducts ?? defaultProducts;

    products = source.map(normalizeProduct).filter(Boolean);
  }

  function showToast(message) {
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");
    toast.style.opacity = "1";

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
      toast.classList.remove("show");
      toast.style.opacity = "";
    }, 2500);
  }

  // ==========================================
  // PRODUCT CARDS
  // ==========================================

  function renderProducts() {
    if (!productsGrid) return;

    const searchText =
      productSearch?.value.toLowerCase().trim() || "";

    const selectedCategory = categoryFilter?.value || "all";

    const isFiltering =
      searchText !== "" || selectedCategory !== "all";

    const filteredProducts = products.filter(product => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchText);

      const matchesCategory =
        selectedCategory === "all" ||
        product.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });

    const visibleProducts =
      isFiltering || showAllProducts
        ? filteredProducts
        : filteredProducts.slice(0, 4);

    if (productResults) {
      productResults.textContent = isFiltering
        ? `${filteredProducts.length} product(s) found`
        : "";
    }

    if (visibleProducts.length === 0) {
      productsGrid.innerHTML = `
        <div class="product-empty">
          <h3>No products found 🧁</h3>
          <p>Try another search or category.</p>
        </div>
      `;
    } else {
      productsGrid.innerHTML = visibleProducts.map(product => {
        const name = escapeHTML(product.name);
        const image = escapeHTML(product.image);
        const id = escapeHTML(product.id);
        const isFavourite = wishlist.includes(product.id);

        return `
          <article
            class="product-card"
            data-name="${name}"
            data-price="${product.price}"
          >
            <img
              src="${image}"
              alt="${name}"
              loading="lazy"
            >

            <button
              type="button"
              class="product-wishlist-button ${isFavourite ? "active" : ""}"
              data-product-id="${id}"
              aria-label="${isFavourite ? "Remove from" : "Add to"} wishlist: ${name}"
              aria-pressed="${isFavourite}"
              title="${isFavourite ? "Remove from Wishlist" : "Add to Wishlist"}"
            >
              ${isFavourite ? "♥" : "♡"}
            </button>

            <div class="product-info">
              <h3>${name}</h3>

              <div class="product-bottom">
                <strong>${formatPrice(product.price)}</strong>

                <button
                  type="button"
                  class="add-cart"
                  aria-label="Add ${name} to cart"
                  ${product.available ? "" : "disabled"}
                  title="${product.available ? "Add to Cart" : "Out of Stock"}"
                >
                  ${product.available ? "＋" : "✕"}
                </button>
              </div>

              ${product.available
                ? (product.stockQuantity === null
                    ? ""
                    : `<p class="stock-message">${product.stockQuantity <= 5 ? "Only " : ""}${product.stockQuantity} in stock</p>`)
                : '<p class="stock-message">Out of Stock</p>'}
            </div>
          </article>
        `;
      }).join("");
    }

    updateViewAllButton();
  }

  function updateViewAllButton() {
    if (!viewAllButton) return;

    const isFiltering =
      Boolean(productSearch?.value.trim()) ||
      (categoryFilter?.value || "all") !== "all";

    if (isFiltering || products.length <= 4) {
      viewAllButton.style.display = "none";
      return;
    }

    viewAllButton.style.display = "inline-flex";
    viewAllButton.textContent =
      showAllProducts ? "Show Less ↑" : "View All ↗";

    viewAllButton.setAttribute(
      "aria-expanded",
      String(showAllProducts)
    );
  }

  viewAllButton?.addEventListener("click", event => {
    event.preventDefault();

    showAllProducts = !showAllProducts;
    renderProducts();

    if (!showAllProducts) {
      $("menu")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  });

  productSearch?.addEventListener("input", renderProducts);
  categoryFilter?.addEventListener("change", renderProducts);

  // ==========================================
  // CART
  // ==========================================

  function loadCart() {
    try {
      const saved = JSON.parse(
        localStorage.getItem(CART_STORAGE_KEY) || "[]"
      );

      if (!Array.isArray(saved)) {
        cart = [];
        return;
      }

      const combined = new Map();

      saved.forEach(item => {
        if (!item || typeof item.name !== "string") return;

        const product = findProduct(item.name);
        const quantity = Number(item.quantity);

        if (
          !product ||
          !Number.isInteger(quantity) ||
          quantity <= 0
        ) {
          return;
        }

        const current = combined.get(product.name) || 0;

        combined.set(
          product.name,
          Math.min(current + quantity, remainingStock(product))
        );
      });

      cart = Array.from(
        combined,
        ([name, quantity]) => ({ name, quantity })
      );
    } catch (error) {
      console.error("Unable to load cart:", error);
      cart = [];
    }
  }

  function saveCart() {
    try {
      localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(cart)
      );
    } catch (error) {
      console.error("Unable to save cart:", error);
      showToast("Unable to save cart.");
    }
  }

  function calculateSubtotal() {
    return cart.reduce((total, item) => {
      const product = findProduct(item.name);

      return total + (
        product ? product.price * item.quantity : 0
      );
    }, 0);
  }

  function calculateCartCount() {
    return cart.reduce(
      (total, item) => total + item.quantity,
      0
    );
  }

  function renderCart() {
    if (!cartItems) return;

    if (cart.length === 0) {
      cartItems.innerHTML = `
        <p class="empty-cart">Your cart is empty 🛒</p>
      `;
    } else {
      cartItems.innerHTML = cart.map(item => {
        const product = findProduct(item.name);

        if (!product) return "";

        const name = escapeHTML(product.name);
        const image = escapeHTML(product.image);

        return `
          <div class="cart-item" data-name="${name}">
            <img
              src="${image}"
              alt="${name}"
              class="cart-item-image"
            >

            <div class="cart-item-info">
              <h3>${name}</h3>
              <p>${formatPrice(product.price)}</p>

              <div class="cart-quantity">
                <button
                  type="button"
                  class="quantity-minus"
                  data-action="decrease"
                  aria-label="Decrease ${name} quantity"
                >−</button>

                <span>${item.quantity}</span>

                <button
                  type="button"
                  class="quantity-plus"
                  data-action="increase"
                  aria-label="Increase ${name} quantity"
                >+</button>
              </div>

              <button
                type="button"
                class="remove-item"
                data-action="remove"
              >Remove</button>
            </div>

            <strong class="cart-item-total">
              ${formatPrice(product.price * item.quantity)}
            </strong>
          </div>
        `;
      }).join("");
    }

    if (cartCount) {
      cartCount.textContent = calculateCartCount();
    }

    if (cartTotal) {
      cartTotal.textContent = formatPrice(calculateSubtotal());
    }

    if (checkoutButton) {
      checkoutButton.disabled = cart.length === 0;
    }

    if (clearCartButton) {
      clearCartButton.disabled = cart.length === 0;
    }
  }

  function addToCart(productName, quantity = 1) {
    const product = findProduct(productName);

    if (!product) {
      showToast("Product not found.");
      return false;
    }

    if (!product.available) {
      showToast("Sorry, this product is out of stock.");
      return false;
    }

    const existing = cart.find(
      item => item.name === product.name
    );

    const currentQuantity = existing?.quantity ?? 0;

    if (currentQuantity + quantity > remainingStock(product)) {
      showToast("Not enough stock available for this product.");
      return false;
    }

    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({
        name: product.name,
        quantity
      });
    }

    saveCart();
    renderCart();

    showToast(`${quantity} × ${product.name} added to cart!`);
    return true;
  }

  function removeFromCart(productName) {
    cart = cart.filter(item => item.name !== productName);

    saveCart();
    renderCart();
    showToast("Product removed from cart.");
  }

  function changeQuantity(productName, change) {
    const item = cart.find(
      cartItem => cartItem.name === productName
    );

    if (!item) return;

    const product = findProduct(productName);

    if (change > 0 && (!product || !product.available)) {
      showToast("This product is out of stock.");
      return;
    }

    const nextQuantity = item.quantity + change;

    if (nextQuantity <= 0) {
      removeFromCart(productName);
      return;
    }

    if (nextQuantity > remainingStock(product)) {
      showToast("Not enough stock available.");
      return;
    }

    item.quantity = nextQuantity;

    saveCart();
    renderCart();
  }

  productsGrid?.addEventListener("click", event => {
    if (!(event.target instanceof Element)) return;

    const button = event.target.closest(".add-cart");

    if (!button || button.disabled) return;

    const card = button.closest(".product-card");

    if (card) {
      addToCart(card.dataset.name);
    }
  });

  cartItems?.addEventListener("click", event => {
    if (!(event.target instanceof Element)) return;

    const button = event.target.closest(
      "button[data-action]"
    );

    const item = button?.closest(".cart-item");

    if (!item) return;

    const name = item.dataset.name;

    if (button.dataset.action === "increase") {
      changeQuantity(name, 1);
    } else if (button.dataset.action === "decrease") {
      changeQuantity(name, -1);
    } else if (button.dataset.action === "remove") {
      removeFromCart(name);
    }
  });

  function lockPage() {
    document.body.style.overflow = "hidden";
  }

  function unlockPage() {
    const anotherOverlayOpen =
      cartOverlay?.classList.contains("open") ||
      productModal?.classList.contains("open") ||
      wishlistOverlay?.classList.contains("open");

    if (!anotherOverlayOpen) {
      document.body.style.overflow = "";
    }
  }

  function openCart() {
    if (!cartOverlay) return;

    previousFocus = document.activeElement;

    cartOverlay.classList.add("active", "open");
    cartOverlay.setAttribute("aria-hidden", "false");

    lockPage();
    renderCart();
    closeCartButton?.focus();
  }

  function closeCart() {
    if (!cartOverlay) return;

    cartOverlay.classList.remove("active", "open");
    cartOverlay.setAttribute("aria-hidden", "true");

    unlockPage();

    if (previousFocus?.isConnected) {
      previousFocus.focus();
    }
  }

  cartButton?.addEventListener("click", openCart);
  closeCartButton?.addEventListener("click", closeCart);

  cartOverlay?.addEventListener("click", event => {
    if (event.target === cartOverlay) {
      closeCart();
    }
  });

  clearCartButton?.addEventListener("click", () => {
    if (!cart.length) return;

    cart = [];
    saveCart();
    renderCart();

    showToast("Cart cleared successfully.");
  });

  checkoutButton?.addEventListener("click", () => {
    if (!cart.length) {
      showToast("Please add products to your cart.");
      return;
    }

    loadProducts();

    const unavailable = cart.some(item => {
      const product = findProduct(item.name);

      return !product || !product.available || item.quantity > remainingStock(product);
    });

    if (unavailable) {
      showToast(
        "Please remove unavailable products before checkout."
      );
      return;
    }

    saveCart();
    window.location.href = "checkout.html";
  });

  // ==========================================
  // PRODUCT DETAILS POPUP
  // ==========================================

  function updateModalQuantity() {
    if (modalQuantity) {
      modalQuantity.textContent = selectedModalQuantity;
    }

    if (modalQuantityMinus) {
      modalQuantityMinus.disabled =
        selectedModalQuantity <= 1;
    }

    if (modalQuantityPlus) {
      modalQuantityPlus.disabled =
        selectedModalQuantity >= remainingStock(selectedModalProduct);
    }
  }

  function openProductModal(productName) {
    const product = findProduct(productName);

    if (!product || !productModal) return;

    selectedModalProduct = product;
    selectedModalQuantity = 1;
    previousFocus = document.activeElement;

    modalProductImage.src = product.image;
    modalProductImage.alt = product.name;

    modalProductName.textContent = product.name;
    modalProductPrice.textContent = formatPrice(product.price);

    modalProductDescription.textContent =
      product.description ||
      "Freshly baked with premium ingredients and lots of love. A delicious treat for every sweet moment.";

    modalProductStock.textContent =
      product.available
        ? (product.stockQuantity === null ? "✓ Available" : `✓ ${product.stockQuantity} in stock`)
        : "✕ Out of Stock";

    modalProductStock.classList.toggle(
      "out-of-stock",
      !product.available
    );

    modalAddToCart.disabled = !product.available;

    updateModalQuantity();

    productModal.classList.add("open");
    productModal.setAttribute("aria-hidden", "false");

    lockPage();
    closeProductModalButton?.focus();
  }

  function closeProductModal() {
    if (!productModal) return;

    productModal.classList.remove("open");
    productModal.setAttribute("aria-hidden", "true");

    selectedModalProduct = null;
    unlockPage();

    if (previousFocus?.isConnected) {
      previousFocus.focus();
    }
  }

  productsGrid?.addEventListener("click", event => {
    if (!(event.target instanceof Element)) return;

    const image = event.target.closest(".product-card > img");
    const title = event.target.closest(".product-info h3");

    if (!image && !title) return;

    const card = event.target.closest(".product-card");

    if (card) {
      openProductModal(card.dataset.name);
    }
  });

  modalQuantityMinus?.addEventListener("click", () => {
    if (selectedModalQuantity > 1) {
      selectedModalQuantity--;
      updateModalQuantity();
    }
  });

  modalQuantityPlus?.addEventListener("click", () => {
    if (selectedModalQuantity < remainingStock(selectedModalProduct)) {
      selectedModalQuantity++;
      updateModalQuantity();
    }
  });

  modalAddToCart?.addEventListener("click", () => {
    if (!selectedModalProduct) return;

    const success = addToCart(
      selectedModalProduct.name,
      selectedModalQuantity
    );

    if (success) {
      closeProductModal();
    }
  });

  closeProductModalButton?.addEventListener(
    "click",
    closeProductModal
  );

  productModal?.addEventListener("click", event => {
    if (event.target === productModal) {
      closeProductModal();
    }
  });

  // ==========================================
  // WISHLIST
  // ==========================================

  function loadWishlist() {
    try {
      const saved = JSON.parse(
        localStorage.getItem(WISHLIST_STORAGE_KEY) || "[]"
      );

      wishlist = Array.isArray(saved)
        ? [...new Set(
            saved.filter(id => typeof id === "string")
          )]
        : [];
    } catch (error) {
      console.error("Unable to load wishlist:", error);
      wishlist = [];
    }
  }

  function saveWishlist() {
    try {
      localStorage.setItem(
        WISHLIST_STORAGE_KEY,
        JSON.stringify(wishlist)
      );
    } catch (error) {
      console.error("Unable to save wishlist:", error);
      showToast("Unable to save wishlist.");
    }
  }

  function toggleWishlist(productId) {
    const product = findProductById(productId);

    if (!product) return;

    if (wishlist.includes(productId)) {
      wishlist = wishlist.filter(id => id !== productId);
      showToast(`${product.name} removed from wishlist.`);
    } else {
      wishlist.push(productId);
      showToast(`${product.name} added to wishlist! ♡`);
    }

    saveWishlist();
    renderProducts();
    renderWishlist();
  }

  function renderWishlist() {
    const favourites = wishlist
      .map(findProductById)
      .filter(Boolean);

    if (wishlistCount) {
      wishlistCount.textContent = favourites.length;
    }

    if (!wishlistItems) return;

    if (favourites.length === 0) {
      wishlistItems.innerHTML = `
        <div class="wishlist-empty">
          <span>♡</span>
          <h3>Your wishlist is empty</h3>
          <p>Save your favourite treats here!</p>
        </div>
      `;
      return;
    }

    wishlistItems.innerHTML = favourites.map(product => {
      const id = escapeHTML(product.id);
      const name = escapeHTML(product.name);
      const image = escapeHTML(product.image);

      return `
        <div class="wishlist-item" data-product-id="${id}">
          <img src="${image}" alt="${name}">

          <div>
            <h3>${name}</h3>

            <p class="wishlist-item-price">
              ${formatPrice(product.price)}
            </p>

            <div class="wishlist-item-actions">
              <button
                type="button"
                class="wishlist-add-cart"
                data-action="add"
                ${product.available ? "" : "disabled"}
              >
                ${product.available ? "Add to Cart" : "Out of Stock"}
              </button>

              <button
                type="button"
                class="wishlist-remove"
                data-action="remove"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  productsGrid?.addEventListener("click", event => {
    if (!(event.target instanceof Element)) return;

    const button = event.target.closest(
      ".product-wishlist-button"
    );

    if (!button) return;

    event.preventDefault();
    toggleWishlist(button.dataset.productId);
  });

  function openWishlist() {
    if (!wishlistOverlay) return;

    previousFocus = document.activeElement;
    renderWishlist();

    wishlistOverlay.classList.add("open");
    wishlistOverlay.setAttribute("aria-hidden", "false");

    lockPage();
    closeWishlistButton?.focus();
  }

  function closeWishlist() {
    if (!wishlistOverlay) return;

    wishlistOverlay.classList.remove("open");
    wishlistOverlay.setAttribute("aria-hidden", "true");

    unlockPage();

    if (previousFocus?.isConnected) {
      previousFocus.focus();
    }
  }

  wishlistButton?.addEventListener("click", openWishlist);

  closeWishlistButton?.addEventListener(
    "click",
    closeWishlist
  );

  continueWishlistShopping?.addEventListener("click", () => {
    closeWishlist();

    $("menu")?.scrollIntoView({
      behavior: "smooth"
    });
  });

  wishlistOverlay?.addEventListener("click", event => {
    if (event.target === wishlistOverlay) {
      closeWishlist();
    }
  });

  wishlistItems?.addEventListener("click", event => {
    if (!(event.target instanceof Element)) return;

    const button = event.target.closest(
      "button[data-action]"
    );

    const item = button?.closest(".wishlist-item");

    if (!item) return;

    const productId = item.dataset.productId;
    const product = findProductById(productId);

    if (button.dataset.action === "remove") {
      toggleWishlist(productId);
    }

    if (button.dataset.action === "add" && product) {
      addToCart(product.name);
    }
  });

  // ==========================================
  // KEYBOARD ACCESSIBILITY
  // ==========================================

  document.addEventListener("keydown", event => {
    let activePanel = null;
    let closePanel = null;

    if (wishlistOverlay?.classList.contains("open")) {
      activePanel = wishlistPanel;
      closePanel = closeWishlist;
    } else if (productModal?.classList.contains("open")) {
      activePanel = productModalPanel;
      closePanel = closeProductModal;
    } else if (cartOverlay?.classList.contains("open")) {
      activePanel = cartPanel;
      closePanel = closeCart;
    }

    if (!activePanel) return;

    if (event.key === "Escape") {
      event.preventDefault();
      closePanel();
      return;
    }

    if (event.key !== "Tab") return;

    const focusable = Array.from(
      activePanel.querySelectorAll(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled])'
      )
    );

    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (
      event.shiftKey &&
      document.activeElement === first
    ) {
      event.preventDefault();
      last.focus();
    } else if (
      !event.shiftKey &&
      document.activeElement === last
    ) {
      event.preventDefault();
      first.focus();
    }
  });

  // ==========================================
  // MOBILE NAVIGATION
  // ==========================================

  menuToggle?.addEventListener("click", () => {
    const isOpen =
      menuToggle.getAttribute("aria-expanded") === "true";

    const nextState = !isOpen;

    menuToggle.setAttribute(
      "aria-expanded",
      String(nextState)
    );

    navLinks?.classList.toggle("active", nextState);
    navLinks?.classList.toggle("open", nextState);
  });

  navLinks?.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("active", "open");

      menuToggle?.setAttribute(
        "aria-expanded",
        "false"
      );
    });
  });

  // ==========================================
  // FOOTER YEAR
  // ==========================================

  const yearElement = $("year");

  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  // ==========================================
  // INITIALIZATION & REFRESH
  // ==========================================

  function refreshProductsAndCart() {
    loadProducts();
    loadCart();
    loadWishlist();

    renderProducts();
    renderCart();
    renderWishlist();
  }

  window.addEventListener("storage", event => {
    if (
      event.key === PRODUCT_STORAGE_KEY ||
      event.key === CART_STORAGE_KEY ||
      event.key === WISHLIST_STORAGE_KEY
    ) {
      refreshProductsAndCart();
    }
  });

  window.addEventListener("pageshow", () => {
    refreshProductsAndCart();
  });

  refreshProductsAndCart();

  console.log("Anti Bakery website initialized successfully.");
});
