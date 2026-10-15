/**
 * Zenith '26 College Fest Management System
 * Student Portal Application Logic (frontend/js/app.js)
 */

document.addEventListener("DOMContentLoaded", () => {
  // State variables
  let currentCategory = "All";
  let searchQuery = "";
  let searchDebounceTimeout = null;
  let allLoadedEvents = [];

  // DOM Elements
  const eventsGrid = document.getElementById("events-grid");
  const loadingSpinner = document.getElementById("loading-spinner");
  const emptyState = document.getElementById("empty-state");
  const errorState = document.getElementById("error-state");
  const errorMessageText = document.getElementById("error-message-text");
  const retryBtn = document.getElementById("retry-btn");
  const resetFiltersBtn = document.getElementById("reset-filters-btn");
  const searchInput = document.getElementById("search-input");
  const categoryFilterContainer = document.getElementById("category-filters");

  // Hero metric elements
  const heroTotalEvents = document.getElementById("hero-total-events");
  const heroFreeEvents = document.getElementById("hero-free-events");
  const heroTotalCapacity = document.getElementById("hero-total-capacity");

  // Modal DOM Elements
  const modal = document.getElementById("event-modal");
  const closeModalBtn = document.getElementById("close-modal-btn");
  const modalIcon = document.getElementById("modal-icon");
  const modalCategory = document.getElementById("modal-category");
  const modalTitle = document.getElementById("modal-title");
  const modalDatetime = document.getElementById("modal-datetime");
  const modalVenue = document.getElementById("modal-venue");
  const modalFee = document.getElementById("modal-fee");
  const modalSeats = document.getElementById("modal-seats");
  const modalDescription = document.getElementById("modal-description");
  const modalBadgeCapacity = document.getElementById("modal-badge-capacity");
  const regForm = document.getElementById("registration-form");
  const regEventId = document.getElementById("reg-event-id");
  const regName = document.getElementById("reg-name");
  const regRoll = document.getElementById("reg-roll");
  const regPhone = document.getElementById("reg-phone");
  const regEmail = document.getElementById("reg-email");
  const submitRegBtn = document.getElementById("submit-reg-btn");
  const formAlert = document.getElementById("form-alert");

  // Validation Error Elements
  const errName = document.getElementById("err-name");
  const errRoll = document.getElementById("err-roll");
  const errEmail = document.getElementById("err-email");

  // Category visual badge config
  const categoryStyles = {
    Technical: {
      bg: "bg-blue-950/80",
      text: "text-blue-300",
      border: "border-blue-700/60",
    },
    Cultural: {
      bg: "bg-purple-950/80",
      text: "text-purple-300",
      border: "border-purple-700/60",
    },
    Sports: {
      bg: "bg-emerald-950/80",
      text: "text-emerald-300",
      border: "border-emerald-700/60",
    },
    Gaming: {
      bg: "bg-amber-950/80",
      text: "text-amber-300",
      border: "border-amber-700/60",
    },
    Workshop: {
      bg: "bg-pink-950/80",
      text: "text-pink-300",
      border: "border-pink-700/60",
    },
  };

  /**
   * Fetches events from the API with current category and search query
   */
  async function fetchEvents() {
    showLoading();

    try {
      const params = new URLSearchParams();
      if (currentCategory && currentCategory !== "All") {
        params.append("category", currentCategory);
      }
      if (searchQuery && searchQuery.trim() !== "") {
        params.append("search", searchQuery.trim());
      }

      const url = `/api/events${params.toString() ? "?" + params.toString() : ""}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}: ${response.statusText}`);
      }

      const events = await response.json();
      allLoadedEvents = events;
      renderEvents(events);
      updateHeroMetrics(events);
    } catch (err) {
      console.error("Error loading events:", err);
      showError(err.message || "Could not connect to fest server. Please check your backend.");
    }
  }

  /**
   * Renders events array into #events-grid
   */
  function renderEvents(events) {
    eventsGrid.innerHTML = "";
    loadingSpinner.classList.add("hidden");
    errorState.classList.add("hidden");

    if (!events || events.length === 0) {
      emptyState.classList.remove("hidden");
      eventsGrid.classList.add("hidden");
      return;
    }

    emptyState.classList.add("hidden");
    eventsGrid.classList.remove("hidden");

    events.forEach((ev, index) => {
      const isFull = ev.available_seats <= 0;
      const catStyle = categoryStyles[ev.category] || {
        bg: "bg-slate-800",
        text: "text-slate-300",
        border: "border-slate-700",
      };

      const card = document.createElement("div");
      card.className =
        "card-animate group bg-slate-800/80 hover:bg-slate-800 border border-slate-700/70 hover:border-indigo-500/50 rounded-2xl p-5 shadow-lg hover:shadow-indigo-500/10 transition-all duration-200 flex flex-col justify-between";
      card.style.animationDelay = `${index * 40}ms`;

      card.innerHTML = `
        <div>
          <!-- Card Header: Category Badge + Fee -->
          <div class="flex items-center justify-between gap-2 mb-3">
            <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full border ${catStyle.bg} ${catStyle.text} ${catStyle.border}">
              ${ev.category}
            </span>
            <span class="text-xs font-bold px-2.5 py-0.5 rounded-full ${
              ev.fee === 0
                ? "bg-emerald-950/70 text-emerald-300 border border-emerald-800/50"
                : "bg-amber-950/70 text-amber-300 border border-amber-800/50"
            }">
              ${ev.fee === 0 ? "Free Entry" : "₹" + ev.fee}
            </span>
          </div>

          <!-- Title & Icon -->
          <div class="flex items-start gap-3 mb-2.5">
            <div class="text-3xl p-2 rounded-xl bg-slate-900/80 border border-slate-700/60 group-hover:scale-110 transition-transform">
              ${ev.icon || "⚡"}
            </div>
            <div>
              <h3 class="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                ${escapeHtml(ev.title)}
              </h3>
              <p class="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <svg class="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                ${ev.event_date} • ${ev.event_time}
              </p>
            </div>
          </div>

          <!-- Description preview -->
          <p class="text-xs text-slate-300 mb-4 line-clamp-2 leading-relaxed">
            ${escapeHtml(ev.description || "No description provided.")}
          </p>

          <!-- Venue & Seats Info -->
          <div class="space-y-1.5 text-xs text-slate-400 mb-5 pt-3 border-t border-slate-700/60">
            <div class="flex items-center justify-between">
              <span class="flex items-center gap-1">
                <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                ${escapeHtml(ev.venue)}
              </span>
            </div>

            <div class="flex items-center justify-between font-medium">
              <span>Availability:</span>
              ${
                isFull
                  ? `<span class="px-2 py-0.5 rounded text-xs font-bold bg-rose-950 text-rose-300 border border-rose-800">FULL (0 seats)</span>`
                  : `<span class="text-emerald-400 font-semibold">${ev.available_seats} / ${ev.capacity} seats left</span>`
              }
            </div>
          </div>
        </div>

        <!-- Action Button -->
        <div>
          <button 
            data-id="${ev.id}" 
            class="view-details-btn w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              isFull
                ? "bg-slate-700/80 text-slate-300 hover:bg-slate-700 border border-slate-600"
                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 active:scale-[0.98]"
            }"
          >
            <span>View Details</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      `;

      eventsGrid.appendChild(card);
    });

    // Attach click listeners to "View Details" buttons
    document.querySelectorAll(".view-details-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const eventId = btn.getAttribute("data-id");
        openEventModal(eventId);
      });
    });
  }

  /**
   * Updates hero metric ribbons based on loaded events
   */
  function updateHeroMetrics(events) {
    if (currentCategory === "All" && (!searchQuery || searchQuery.trim() === "")) {
      if (heroTotalEvents) heroTotalEvents.textContent = events.length;
      if (heroFreeEvents) heroFreeEvents.textContent = events.filter((e) => e.fee === 0).length;
      if (heroTotalCapacity) {
        const totalCap = events.reduce((sum, e) => sum + e.capacity, 0);
        heroTotalCapacity.textContent = totalCap.toLocaleString();
      }
    }
  }

  /**
   * Open modal and fetch single event details via GET /api/events/{event_id}
   */
  async function openEventModal(eventId) {
    resetFormErrors();
    resetFormAlert();
    regForm.reset();

    try {
      const res = await fetch(`/api/events/${eventId}`);
      if (!res.ok) {
        throw new Error("Unable to fetch event details.");
      }
      const ev = await res.json();

      // Populate modal data
      regEventId.value = ev.id;
      modalTitle.textContent = ev.title;
      modalIcon.textContent = ev.icon || "⚡";
      modalDescription.textContent = ev.description || "No description provided.";
      modalDatetime.textContent = `${ev.event_date} • ${ev.event_time}`;
      modalVenue.textContent = ev.venue;
      modalFee.textContent = ev.fee === 0 ? "Free Entry" : `₹${ev.fee}`;

      const catStyle = categoryStyles[ev.category] || {
        bg: "bg-slate-800",
        text: "text-slate-300",
        border: "border-slate-700",
      };
      modalCategory.className = `inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`;
      modalCategory.textContent = ev.category;

      const isFull = ev.available_seats <= 0;
      if (isFull) {
        modalSeats.textContent = `0 / ${ev.capacity} seats remaining`;
        modalSeats.className = "font-bold text-rose-400 text-xs";
        modalBadgeCapacity.textContent = "Event Full";
        modalBadgeCapacity.className =
          "text-xs px-2 py-0.5 rounded font-bold bg-rose-950 text-rose-300 border border-rose-800";
        submitRegBtn.disabled = true;
        submitRegBtn.className =
          "w-full py-3 bg-slate-700 text-slate-400 font-bold rounded-xl text-sm cursor-not-allowed";
        submitRegBtn.innerHTML = "<span>Registration Closed (Event is Full)</span>";
      } else {
        modalSeats.textContent = `${ev.available_seats} / ${ev.capacity} seats left`;
        modalSeats.className = "font-bold text-emerald-400 text-xs";
        modalBadgeCapacity.textContent = `${ev.available_seats} Seats Available`;
        modalBadgeCapacity.className =
          "text-xs px-2 py-0.5 rounded font-medium bg-emerald-950 text-emerald-300 border border-emerald-800";
        submitRegBtn.disabled = false;
        submitRegBtn.className =
          "w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer";
        submitRegBtn.innerHTML = "<span>Confirm Registration</span>";
      }

      modal.classList.remove("hidden");
      document.body.classList.add("overflow-hidden");
    } catch (err) {
      console.error("Modal fetch error:", err);
      alert("Failed to load event details: " + err.message);
    }
  }

  /**
   * Close modal dialog
   */
  function closeModal() {
    modal.classList.add("hidden");
    document.body.classList.remove("overflow-hidden");
    resetFormAlert();
    resetFormErrors();
    regForm.reset();
  }

  /**
   * Client-side validation before sending registration request
   */
  function validateRegistrationForm() {
    let isValid = true;
    resetFormErrors();

    const name = regName.value.trim();
    const roll = regRoll.value.trim();
    const email = regEmail.value.trim();

    if (!name) {
      errName.classList.remove("hidden");
      isValid = false;
    }
    if (!roll) {
      errRoll.classList.remove("hidden");
      isValid = false;
    }
    if (!email || !email.includes("@") || email.startsWith("@") || email.endsWith("@")) {
      errEmail.classList.remove("hidden");
      isValid = false;
    }

    return isValid;
  }

  function resetFormErrors() {
    errName.classList.add("hidden");
    errRoll.classList.add("hidden");
    errEmail.classList.add("hidden");
  }

  function resetFormAlert() {
    formAlert.classList.add("hidden");
    formAlert.className = "hidden mb-4 p-3.5 rounded-xl text-xs sm:text-sm font-medium";
    formAlert.textContent = "";
  }

  function showFormAlert(message, isSuccess = false) {
    formAlert.classList.remove("hidden");
    if (isSuccess) {
      formAlert.className =
        "mb-4 p-3.5 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-950/80 border border-emerald-600 text-emerald-200";
    } else {
      formAlert.className =
        "mb-4 p-3.5 rounded-xl text-xs sm:text-sm font-semibold bg-rose-950/80 border border-rose-600 text-rose-200";
    }
    formAlert.textContent = message;
  }

  /**
   * Handle Registration Form Submission (POST /api/events/{event_id}/register)
   */
  regForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!validateRegistrationForm()) {
      return;
    }

    const eventId = regEventId.value;
    const studentName = regName.value.trim();
    const payload = {
      student_name: studentName,
      roll_number: regRoll.value.trim(),
      email: regEmail.value.trim(),
      phone: regPhone.value.trim() || null,
    };

    // Set button loading state
    submitRegBtn.disabled = true;
    const originalBtnHtml = submitRegBtn.innerHTML;
    submitRegBtn.innerHTML = `
      <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      <span>Submitting...</span>
    `;

    try {
      const response = await fetch(`/api/events/${eventId}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.status === 201) {
        // Step 7: Clear confirmation with event title
        showFormAlert(`🎉 Registration confirmed for "${modalTitle.textContent}"! Your registration ID is #${data.id}.`, true);
        submitRegBtn.innerHTML = "<span>✓ Registered Successfully</span>";

        // Re-fetch events so available seats update immediately
        await fetchEvents();

        // Close after 2.2 seconds
        setTimeout(() => {
          closeModal();
        }, 2200);
      } else {
        // Step 7: Exact error message returned by server (e.g. 400 or 409 "Event is full", "Already registered")
        const errorDetail = data.detail || `Registration failed with HTTP ${response.status}`;
        showFormAlert(`⚠️ ${errorDetail}`, false);
        submitRegBtn.disabled = false;
        submitRegBtn.innerHTML = originalBtnHtml;
      }
    } catch (err) {
      console.error("Registration submit error:", err);
      showFormAlert(`⚠️ Network error: ${err.message}. Could not reach the server.`, false);
      submitRegBtn.disabled = false;
      submitRegBtn.innerHTML = originalBtnHtml;
    }
  });

  // Modal event listeners
  closeModalBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) {
      closeModal();
    }
  });

  // Category filter buttons
  categoryFilterContainer.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const category = btn.getAttribute("data-category");
      currentCategory = category;

      // Update button visual active styles
      categoryFilterContainer.querySelectorAll(".filter-btn").forEach((b) => {
        b.className =
          "filter-btn px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/50";
      });
      btn.className =
        "filter-btn px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all bg-indigo-600 text-white shadow-md shadow-indigo-600/30";

      fetchEvents();
    });
  });

  // Search input debounced handler
  searchInput.addEventListener("input", (e) => {
    clearTimeout(searchDebounceTimeout);
    searchDebounceTimeout = setTimeout(() => {
      searchQuery = e.target.value;
      fetchEvents();
    }, 280);
  });

  // Reset filters button
  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener("click", () => {
      searchInput.value = "";
      searchQuery = "";
      currentCategory = "All";

      categoryFilterContainer.querySelectorAll(".filter-btn").forEach((b) => {
        if (b.getAttribute("data-category") === "All") {
          b.className =
            "filter-btn px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all bg-indigo-600 text-white shadow-md shadow-indigo-600/30";
        } else {
          b.className =
            "filter-btn px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/50";
        }
      });

      fetchEvents();
    });
  }

  // Retry button
  if (retryBtn) {
    retryBtn.addEventListener("click", () => {
      fetchEvents();
    });
  }

  // State helpers
  function showLoading() {
    loadingSpinner.classList.remove("hidden");
    eventsGrid.classList.add("hidden");
    emptyState.classList.add("hidden");
    errorState.classList.add("hidden");
  }

  function showError(msg) {
    loadingSpinner.classList.add("hidden");
    eventsGrid.classList.add("hidden");
    emptyState.classList.add("hidden");
    errorState.classList.remove("hidden");
    if (errorMessageText) errorMessageText.textContent = msg;
  }

  function escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Initial fetch
  fetchEvents();
});
