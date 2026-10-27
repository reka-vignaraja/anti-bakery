
/* =========================================
   ANTI BAKERY - ADMIN PRODUCTS
   Product Management + Image Upload
========================================= */

const PRODUCTS_KEY = "antiBakeryProductsV1";

const DEFAULT_PRODUCTS = [
  {
    id: "product-1",
    name: "Chocolate Cupcake",
    price: 2.50,
    image: "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?auto=format&fit=crop&w=600&q=85",
    description: "Soft chocolate cupcake with creamy frosting.",
    stock: "available"
  },
  {
    id: "product-2",
    name: "Berry Cheesecake",
    price: 3.75,
    image: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=600&q=85",
    description: "Creamy cheesecake with delicious berry flavours.",
    stock: "available"
  },
  {
    id: "product-3",
    name: "Chocolate Brownie",
    price: 2.99,
    image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=85",
    description: "Rich and fudgy chocolate brownie.",
    stock: "available"
  },
  {
    id: "product-4",
    name: "Classic Doughnut",
    price: 1.99,
    image: "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=600&q=85",
    description: "Fluffy classic doughnut with sweet glaze.",
    stock: "available"
  }
];

/* =========================================
   DOM ELEMENTS
========================================= */

const productsGrid =
  document.getElementById("productsGrid");

const emptyProducts =
  document.getElementById("emptyProducts");

const totalProducts =
  document.getElementById("totalProducts");

const availableProducts =
  document.getElementById("availableProducts");

const outOfStockProducts =
  document.getElementById("outOfStockProducts");

const productSearch =
  document.getElementById("productSearch");

const stockFilter =
  document.getElementById("stockFilter");

const addProductBtn =
  document.getElementById("addProductBtn");

const productDialog =
  document.getElementById("productDialog");

const productForm =
  document.getElementById("productForm");

const dialogTitle =
  document.getElementById("dialogTitle");

const closeProductDialog =
  document.getElementById("closeProductDialog");

const cancelProductBtn =
  document.getElementById("cancelProductBtn");

const productName =
  document.getElementById("productName");

const productPrice =
  document.getElementById("productPrice");

const productImage =
  document.getElementById("productImage");

const productImageFile =
  document.getElementById("productImageFile");

const selectedImageName =
  document.getElementById("selectedImageName");

const imagePreviewBox =
  document.getElementById("imagePreviewBox");

const productImagePreview =
  document.getElementById("productImagePreview");

const productDescription =
  document.getElementById("productDescription");

const productStock =
  document.getElementById("productStock");

const saveProductBtn =
  document.getElementById("saveProductBtn");

/* =========================================
   STATE
========================================= */

let editingProductId = null;
let uploadedImageData = "";
let currentProductImage = "";
let isProcessingImage = false;

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp"
];

/* =========================================
   LOAD PRODUCTS
========================================= */

function getProducts() {
  try {
    const stored = localStorage.getItem(PRODUCTS_KEY);

    if (stored !== null) {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    }

    const defaults = DEFAULT_PRODUCTS.map(
      product => ({ ...product })
    );

    localStorage.setItem(
      PRODUCTS_KEY,
      JSON.stringify(defaults)
    );

    return defaults;

  } catch (error) {
    console.error("Product loading failed:", error);
    return [];
  }
}

/* =========================================
   SAVE PRODUCTS
========================================= */

function saveProducts(products) {
  try {
    localStorage.setItem(
      PRODUCTS_KEY,
      JSON.stringify(products)
    );

    return true;

  } catch (error) {
    console.error("Product saving failed:", error);

    alert(
      "Could not save product changes. " +
      "Browser storage may be full. " +
      "Try a smaller image."
    );

    return false;
  }
}

/* =========================================
   HELPERS
========================================= */

function money(value) {
  return "$" + Number(value).toFixed(2);
}

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

function updateStatistics(products) {
  totalProducts.textContent = products.length;

  availableProducts.textContent =
    products.filter(
      product => product.stock === "available"
    ).length;

  outOfStockProducts.textContent =
    products.filter(
      product => product.stock === "out"
    ).length;
}

/* =========================================
   PRODUCT CARDS
========================================= */

function createProductCard(product) {
  const card = createElement(
    "article",
    "product-card"
  );

  const image = createElement(
    "img",
    "product-image"
  );

  image.src = product.image;
  image.alt = product.name;
  image.loading = "lazy";

  const info = createElement(
    "div",
    "product-info"
  );

  const name = createElement(
    "h3",
    "",
    product.name
  );

  const description = createElement(
    "p",
    "product-description",
    product.description || "Freshly baked with love."
  );

  const price = createElement(
    "p",
    "product-price",
    money(product.price)
  );

  const stock = createElement(
    "span",
    "stock-badge " + product.stock,
    product.stock === "available"
      ? "Available"
      : "Out of Stock"
  );

  const actions = createElement(
    "div",
    "product-actions"
  );

  const editButton = createElement(
    "button",
    "edit-btn",
    "Edit"
  );

  editButton.type = "button";

  editButton.addEventListener("click", () => {
    openEditProduct(product.id);
  });

  const deleteButton = createElement(
    "button",
    "delete-btn",
    "Delete"
  );

  deleteButton.type = "button";

  deleteButton.addEventListener("click", () => {
    deleteProduct(product.id);
  });

  actions.append(editButton, deleteButton);

  info.append(
    name,
    description,
    price,
    stock,
    actions
  );

  card.append(image, info);

  return card;
}

/* =========================================
   RENDER PRODUCTS
========================================= */

function renderProducts() {
  const products = getProducts();

  updateStatistics(products);

  const searchText =
    productSearch.value.trim().toLowerCase();

  const selectedStock = stockFilter.value;

  const filtered = products.filter(product => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchText);

    const matchesStock =
      selectedStock === "all" ||
      product.stock === selectedStock;

    return matchesSearch && matchesStock;
  });

  productsGrid.replaceChildren();

  emptyProducts.hidden = filtered.length > 0;

  filtered.forEach(product => {
    productsGrid.appendChild(
      createProductCard(product)
    );
  });
}

/* =========================================
   IMAGE PREVIEW
========================================= */

function showImagePreview(imageSource) {
  if (!imageSource) {
    imagePreviewBox.hidden = true;
    productImagePreview.removeAttribute("src");
    return;
  }

  productImagePreview.src = imageSource;
  imagePreviewBox.hidden = false;
}

function resetImageState() {
  uploadedImageData = "";
  currentProductImage = "";
  isProcessingImage = false;

  productImageFile.value = "";
  productImage.value = "";

  selectedImageName.textContent =
    "No image selected";

  showImagePreview("");
  saveProductBtn.disabled = false;
  saveProductBtn.textContent = "Save Product";
}

/* =========================================
   COMPRESS IMAGE
========================================= */

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error("Could not read image."));
    };

    reader.onload = () => {
      const image = new Image();

      image.onerror = () => {
        reject(new Error("Invalid image file."));
      };

      image.onload = () => {
        const maxWidth = 650;
        const maxHeight = 650;

        const scale = Math.min(
          1,
          maxWidth / image.width,
          maxHeight / image.height
        );

        const width = Math.max(
          1,
          Math.round(image.width * scale)
        );

        const height = Math.max(
          1,
          Math.round(image.height * scale)
        );

        const canvas = document.createElement("canvas");

        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");

        if (!context) {
          reject(new Error("Image processing unavailable."));
          return;
        }

        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, width, height);

        context.drawImage(
          image,
          0,
          0,
          width,
          height
        );

        const compressedData =
          canvas.toDataURL("image/jpeg", 0.72);

        resolve(compressedData);
      };

      image.src = reader.result;
    };

    reader.readAsDataURL(file);
  });
}

/* =========================================
   FILE UPLOAD EVENT
========================================= */

productImageFile.addEventListener(
  "change",
  async event => {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      alert("Please select a JPG, PNG or WebP image.");
      productImageFile.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      alert("Image must be smaller than 5 MB.");
      productImageFile.value = "";
      return;
    }

    isProcessingImage = true;
    saveProductBtn.disabled = true;
    saveProductBtn.textContent = "Processing...";

    selectedImageName.textContent =
      "Processing " + file.name + "...";

    try {
      const compressedImage = await compressImage(file);

      uploadedImageData = compressedImage;
      productImage.value = "";

      selectedImageName.textContent =
        "Selected: " + file.name;

      showImagePreview(uploadedImageData);

    } catch (error) {
      console.error(error);
      alert("Could not process this image.");
      productImageFile.value = "";
      selectedImageName.textContent =
        "No image selected";

    } finally {
      isProcessingImage = false;
      saveProductBtn.disabled = false;
      saveProductBtn.textContent = "Save Product";
    }
  }
);

/* =========================================
   IMAGE URL EVENT
========================================= */

productImage.addEventListener("input", () => {
  const url = productImage.value.trim();

  if (url) {
    uploadedImageData = "";
    productImageFile.value = "";

    selectedImageName.textContent =
      "Using image URL";

    showImagePreview(url);

  } else if (uploadedImageData) {
    showImagePreview(uploadedImageData);

  } else if (editingProductId) {
    showImagePreview(currentProductImage);

  } else {
    showImagePreview("");
  }
});

/* =========================================
   OPEN ADD PRODUCT
========================================= */

function openAddProduct() {
  editingProductId = null;

  productForm.reset();
  resetImageState();

  dialogTitle.textContent = "Add Product";
  productStock.value = "available";

  productDialog.showModal();
}

/* =========================================
   OPEN EDIT PRODUCT
========================================= */

function openEditProduct(productId) {
  const product = getProducts().find(
    item => item.id === productId
  );

  if (!product) {
    alert("Product not found.");
    return;
  }

  editingProductId = product.id;

  productForm.reset();
  resetImageState();

  dialogTitle.textContent = "Edit Product";

  productName.value = product.name;
  productPrice.value = product.price;
  productDescription.value =
    product.description || "";

  productStock.value = product.stock;

  currentProductImage = product.image || "";

  // Keep old image unless user changes it.
  // URL images remain editable in the URL field.
  if (
    currentProductImage &&
    !currentProductImage.startsWith("data:")
  ) {
    productImage.value = currentProductImage;
  }

  selectedImageName.textContent =
    "Current product image";

  showImagePreview(currentProductImage);

  productDialog.showModal();
}

/* =========================================
   SAVE PRODUCT
========================================= */

productForm.addEventListener("submit", event => {
  event.preventDefault();

  if (isProcessingImage) {
    alert("Please wait for image processing.");
    return;
  }

  if (!productForm.reportValidity()) {
    return;
  }

  const name = productName.value.trim();
  const price = Number(productPrice.value);
  const imageUrl = productImage.value.trim();

  const image =
    uploadedImageData ||
    imageUrl ||
    currentProductImage;

  const description =
    productDescription.value.trim();

  const stock = productStock.value;

  if (
    !name ||
    !Number.isFinite(price) ||
    price <= 0 ||
    !image
  ) {
    alert(
      "Please enter valid product details " +
      "and upload an image or enter an image URL."
    );
    return;
  }

  let products = getProducts();

  const duplicate = products.some(product =>
    product.name.toLowerCase() === name.toLowerCase() &&
    product.id !== editingProductId
  );

  if (duplicate) {
    alert("A product with this name already exists.");
    return;
  }

  if (editingProductId) {
    products = products.map(product =>
      product.id === editingProductId
        ? {
            ...product,
            name,
            price,
            image,
            description,
            stock
          }
        : product
    );

  } else {
    products.push({
      id: "product-" + Date.now(),
      name,
      price,
      image,
      description,
      stock
    });
  }

  if (saveProducts(products)) {
    productDialog.close();
    renderProducts();
  }
});

/* =========================================
   DELETE PRODUCT
========================================= */

function deleteProduct(productId) {
  const products = getProducts();

  const product = products.find(
    item => item.id === productId
  );

  if (!product) {
    return;
  }

  const confirmed = confirm(
    `Delete "${product.name}"?`
  );

  if (!confirmed) {
    return;
  }

  const updatedProducts = products.filter(
    item => item.id !== productId
  );

  if (saveProducts(updatedProducts)) {
    renderProducts();
  }
}

/* =========================================
   EVENT LISTENERS
========================================= */

addProductBtn.addEventListener(
  "click",
  openAddProduct
);

closeProductDialog.addEventListener(
  "click",
  () => productDialog.close()
);

cancelProductBtn.addEventListener(
  "click",
  () => productDialog.close()
);

productSearch.addEventListener(
  "input",
  renderProducts
);

stockFilter.addEventListener(
  "change",
  renderProducts
);

/* =========================================
   FOOTER YEAR
========================================= */

document.getElementById("year").textContent =
  new Date().getFullYear();

/* =========================================
   INITIALIZE
========================================= */

renderProducts();
