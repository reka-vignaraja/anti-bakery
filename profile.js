
"use strict";

/* ANTI BAKERY - DEMO CUSTOMER PROFILE */

const PROFILE_KEY = "antiBakeryDemoProfileV1";

const profileForm = document.getElementById("profileForm");
const profileMessage = document.getElementById("profileMessage");

const fields = {
  fullName: document.getElementById("fullName"),
  email: document.getElementById("email"),
  phone: document.getElementById("phone"),
  city: document.getElementById("city"),
  address: document.getElementById("address")
};

const displayName = document.getElementById("displayName");
const displayEmail = document.getElementById("displayEmail");
const profileAvatar = document.getElementById("profileAvatar");

const yearElement = document.getElementById("year");

if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

/* READ SAVED PROFILE */

function getSavedProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    return parsed;
  } catch (error) {
    console.error("Unable to read demo profile:", error);
    return {};
  }
}

/* DISPLAY PROFILE */

function updateProfileDisplay(profile) {
  const name = profile.fullName?.trim() || "Guest Customer";
  const email = profile.email?.trim() || "Demo Profile";

  displayName.textContent = name;
  displayEmail.textContent = email;
  profileAvatar.textContent = name.charAt(0).toUpperCase();
}

/* FILL FORM */

function fillProfileForm(profile) {
  Object.keys(fields).forEach((key) => {
    fields[key].value = profile[key] || "";
  });

  updateProfileDisplay(profile);
}

/* SHOW MESSAGE */

function showProfileMessage(message, type = "success") {
  profileMessage.textContent = message;
  profileMessage.className = "profile-message " + type;
}

/* INITIAL LOAD */

fillProfileForm(getSavedProfile());

/* SAVE PROFILE */

profileForm.addEventListener("submit", function(event) {
  event.preventDefault();

  const profile = {
    fullName: fields.fullName.value.trim(),
    email: fields.email.value.trim(),
    phone: fields.phone.value.trim(),
    city: fields.city.value.trim(),
    address: fields.address.value.trim()
  };

  if (profile.fullName.length < 2) {
    showProfileMessage(
      "Please enter your full name (at least 2 characters).",
      "error"
    );
    return;
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(profile.email)) {
    showProfileMessage(
      "Please enter a valid email address.",
      "error"
    );
    return;
  }

  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));

    updateProfileDisplay(profile);

    showProfileMessage(
      "Demo profile saved successfully! Your details are stored in this browser."
    );
  } catch (error) {
    console.error("Unable to save demo profile:", error);

    showProfileMessage(
      "Unable to save profile. Please check your browser storage settings.",
      "error"
    );
  }
});

/* RESET UNSAVED CHANGES */

document.getElementById("resetBtn").addEventListener("click", function() {
  fillProfileForm(getSavedProfile());
  showProfileMessage("Unsaved changes have been reset.");
});
