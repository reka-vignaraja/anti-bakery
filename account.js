
"use strict";

/* ==========================================
   ANTI BAKERY - ACCOUNT UI DEMO
========================================== */

const PROFILE_KEY = "antiBakeryDemoProfileV1";

const $ = (id) => document.getElementById(id);

const tabs = document.querySelectorAll(".tab-btn");

const panels = {
  login: $("loginPanel"),
  register: $("registerPanel"),
  profile: $("profilePanel")
};

/* YEAR */

$("year").textContent = new Date().getFullYear();

/* ==========================================
   TAB NAVIGATION
========================================== */

function switchTab(tabName) {
  if (!panels[tabName]) return;

  tabs.forEach((button) => {
    const active = button.dataset.tab === tabName;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });

  Object.entries(panels).forEach(([name, panel]) => {
    panel.hidden = name !== tabName;
  });

  const url = new URL(window.location.href);
  url.hash = tabName;
  history.replaceState(null, "", url);
}

tabs.forEach((button) => {
  button.addEventListener("click", () => {
    switchTab(button.dataset.tab);
  });
});

document.querySelectorAll("[data-switch]").forEach((button) => {
  button.addEventListener("click", () => {
    switchTab(button.dataset.switch);
  });
});

const initialTab = window.location.hash.slice(1);
switchTab(panels[initialTab] ? initialTab : "login");

/* ==========================================
   PASSWORD SHOW / HIDE
========================================== */

document.querySelectorAll(".show-password").forEach((button) => {
  button.addEventListener("click", () => {
    const input = $(button.dataset.target);
    if (!input) return;

    const show = input.type === "password";

    input.type = show ? "text" : "password";
    button.textContent = show ? "Hide" : "Show";
    button.setAttribute("aria-pressed", String(show));
  });
});

/* ==========================================
   FORM MESSAGES
========================================== */

function showMessage(id, message, type = "error") {
  const element = $(id);
  element.textContent = message;
  element.className = "form-message " + type;
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ==========================================
   LOGIN VALIDATION
========================================== */

$("loginForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const email = $("loginEmail").value.trim();
  const password = $("loginPassword").value;

  if (!validEmail(email) || !password) {
    showMessage(
      "loginMessage",
      "Please enter a valid email and password."
    );
    return;
  }

  showMessage(
    "loginMessage",
    "Login form validated. Actual sign-in requires backend integration.",
    "info"
  );
});

/* ==========================================
   REGISTER VALIDATION
========================================== */

$("registerForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const name = $("registerName").value.trim();
  const email = $("registerEmail").value.trim();
  const password = $("registerPassword").value;
  const confirm = $("confirmPassword").value;
  const agreed = $("agreeTerms").checked;

  if (name.length < 2) {
    showMessage("registerMessage", "Enter your full name.");
    return;
  }

  if (!validEmail(email)) {
    showMessage("registerMessage", "Enter a valid email.");
    return;
  }

  if (password.length < 8) {
    showMessage(
      "registerMessage",
      "Password must have at least 8 characters."
    );
    return;
  }

  if (password !== confirm) {
    showMessage("registerMessage", "Passwords do not match.");
    return;
  }

  if (!agreed) {
    showMessage(
      "registerMessage",
      "Please agree to the Terms & Conditions."
    );
    return;
  }

  showMessage(
    "registerMessage",
    "Registration form validated. Account creation requires backend integration.",
    "info"
  );
});

/* ==========================================
   DEMO PROFILE
========================================== */

const profileFields = {
  fullName: $("profileName"),
  email: $("profileEmail"),
  phone: $("profilePhone"),
  city: $("profileCity"),
  address: $("profileAddress")
};

function readProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return {};

    const data = JSON.parse(raw);
    return data && typeof data === "object" && !Array.isArray(data)
      ? data
      : {};
  } catch {
    return {};
  }
}

function updateProfileDisplay(profile) {
  const name = profile.fullName?.trim() || "Guest Customer";
  const email = profile.email?.trim() || "Demo Profile";

  $("displayName").textContent = name;
  $("displayEmail").textContent = email;
  $("profileAvatar").textContent = name[0].toUpperCase();
}

function loadProfile() {
  const profile = readProfile();

  Object.entries(profileFields).forEach(([key, input]) => {
    input.value = profile[key] || "";
  });

  updateProfileDisplay(profile);
}

loadProfile();

$("profileForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const profile = {};

  Object.entries(profileFields).forEach(([key, input]) => {
    profile[key] = input.value.trim();
  });

  if (profile.fullName.length < 2) {
    showMessage("profileMessage", "Enter your full name.");
    return;
  }

  if (!validEmail(profile.email)) {
    showMessage("profileMessage", "Enter a valid email.");
    return;
  }

  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));

    updateProfileDisplay(profile);

    showMessage(
      "profileMessage",
      "Demo profile saved in this browser successfully!",
      "success"
    );
  } catch {
    showMessage(
      "profileMessage",
      "Could not save profile. Check browser storage.",
      "error"
    );
  }
});

$("resetProfile").addEventListener("click", () => {
  loadProfile();
  showMessage(
    "profileMessage",
    "Unsaved changes have been reset.",
    "info"
  );
});
