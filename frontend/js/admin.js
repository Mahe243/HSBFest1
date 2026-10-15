/**
 * Zenith '26 College Fest Management System
 * Admin Dashboard Application Logic (frontend/js/admin.js)
 */

document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements - Navigation & Refresh
  const refreshBtn = document.getElementById("refresh-dashboard-btn");
  const tabEventsBtn = document.getElementById("tab-events-btn");
  const tabRegsBtn = document.getElementById("tab-regs-btn");
  const viewEventsTable = document.getElementById("view-events-table");
  const viewRegistrationsTable = document.getElementById("view-registrations-table");
  const adminAlert = document.getElementById("admin-alert");

  // DOM Elements - Stat Cards
  const statsLoading = document.getElementById("stats-loading");
  const statsCards = document.getElementById("stats-cards");
  const statTotalEvents = document.getElementById("stat-total-events");
  const statTotalRegistrations = document.getElementById("stat-total-registrations");
  const statUtilizationPct = document.getElementById("stat-utilization-pct");
  const statUtilizationSub = document.getElementById("stat-utilization-sub");
  const statUpcomingEvents = document.getElementById("stat-upcoming-events");
  const categoryBreakdownContainer = document.getElementById("category-breakdown-container");

  // DOM Elements - Tables
  const eventsTableBody = document.getElementById("events-table-body");
  const registrationsTableBody = document.getElementById("registrations-table-body");
  const filterRegEvent = document.getElementById("filter-reg-event");

  // DOM Elements - Modals
  const openAddEventBtn = document.getElementById("open-add-event-btn");
  const addEventModal = document.getElementById("add-event-modal");
  const closeAddEventBtn = document.getElementById("close-add-event-btn");
  const addEventForm = document.getElementById("add-event-form");
  const addEventAlert = document.getElementById("add-event-alert");
  const cancelModal = document.getElementById("cancel-modal");
  const cancelModalText = document.getElementById("cancel-modal-text");
  const cancelAbortBtn = document.getElementById("cancel-abort-btn");
  const cancelConfirmBtn = document.getElementById("cancel-confirm-btn");

  let pendingDeleteRegistrationId = null;
  let cachedEvents = [];

  /**
   * Fetch Live Stats from GET /api/stats
   */
  async function loadStats() {
    try {
      const res = await fetch("/api/stats");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const stats = await res.json();

      statTotalEvents.textContent = stats.total_events;
      statTotalRegistrations.textContent = stats.total_registrations;
      statUtilizationPct.textContent = `${stats.overall_utilization_pct}%`;
      statUtilizationSub.textContent = `${stats.total_registrations} / ${stats.total_capacity} total seats filled`;
      statUpcomingEvents.textContent = stats.upcoming_events_count;

      statsLoading.classList.add("hidden");
      statsCards.classList.remove("hidden");

      renderCategoryBreakdown(stats.events_by_category);
    } catch (err) {
      console.error("Error loading stats:", err);
      showAlert("⚠️ Failed to load platform statistics: " + err.message, "error");
    }
  }

  /**
   * Render Category Breakdown
   */
  function renderCategoryBreakdown(categoryMap) {
    categoryBreakdownContainer.innerHTML = "";
    const categoryColors = {
      Technical: { bg: "bg-blue-950/60", border: "border-blue-700/60", text: "text-blue-300" },
      Cultural: { bg: "bg-purple-950/60", border: "border-purple-700/60", text: "text-purple-300" },
      Sports: { bg: "bg-emerald-950/60", border: "border-emerald-700/60", text: "text-emerald-300" },
      Gaming: { bg: "bg-amber-950/60", border: "border-amber-700/60", text: "text-amber-300" },
      Workshop: { bg: "bg-pink-950/60", border: "border-pink-700/60", text: "text-pink-300" },
    };

    for (const [category, count] of Object.entries(categoryMap || {})) {
      const color = categoryColors[category] || { bg: "bg-slate-800", border: "border-slate-700", text: "text-slate-300" };
      const box = document.createElement("div");
      box.className = `p-3.5 rounded-xl border ${color.bg} ${color.border} flex flex-col justify-between`;
      box.innerHTML = `
        <span class="text-xs font-semibold ${color.text} uppercase tracking-wider">${category}</span>
        <div class="flex items-baseline justify-between mt-2">
          <span class="text-2xl font-bold text-white">${count}</span>
          <span class="text-xs text-slate-400">events</span>
        </div>
      `;
      categoryBreakdownContainer.appendChild(box);
    }
  }

  /**
   * Fetch Events & Render Table sorted by Utilization % Descending (Step 8)
   */
  async function loadEventsTable() {
    eventsTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="py-8 text-center text-slate-400">
          <div class="inline-block w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mr-2"></div>
          Loading events data...
        </td>
      </tr>
    `;

    try {
      const res = await fetch("/api/events");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const events = await res.json();
      cachedEvents = events;

      // Populate dropdown for registrations tab
      populateEventDropdown(events);

      // Compute registered count and utilization % for sorting
      const enrichedEvents = events.map((ev) => {
        const registered = ev.capacity - ev.available_seats;
        const utilizationPct = ev.capacity > 0 ? (registered / ev.capacity) * 100 : 0;
        return {
          ...ev,
          registered,
          utilizationPct: Math.round(utilizationPct * 10) / 10,
        };
      });

      // Sort by utilization percentage descending by default
      enrichedEvents.sort((a, b) => b.utilizationPct - a.utilizationPct);

      eventsTableBody.innerHTML = "";

      if (enrichedEvents.length === 0) {
        eventsTableBody.innerHTML = `
          <tr><td colspan="7" class="py-6 text-center text-slate-400">No events found in system.</td></tr>
        `;
        return;
      }

      enrichedEvents.forEach((ev) => {
        const isCritical = ev.utilizationPct >= 90;
        const isFull = ev.available_seats <= 0;

        const row = document.createElement("tr");
        // Highlight row in warning color if capacity > 90%
        if (isCritical) {
          row.className = "bg-rose-950/20 hover:bg-rose-950/30 transition-colors border-l-4 border-l-rose-500";
        } else {
          row.className = "hover:bg-slate-800/40 transition-colors";
        }

        row.innerHTML = `
          <td class="py-3.5 px-4">
            <div class="flex items-center gap-2.5">
              <span class="text-xl">${ev.icon || "⚡"}</span>
              <span class="font-bold text-white">${escapeHtml(ev.title)}</span>
            </div>
          </td>
          <td class="py-3.5 px-4">
            <span class="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 font-medium text-slate-300">
              ${ev.category}
            </span>
          </td>
          <td class="py-3.5 px-4 text-slate-300 whitespace-nowrap text-xs">
            ${ev.event_date} <span class="text-slate-500">•</span> ${ev.event_time}
          </td>
          <td class="py-3.5 px-4 text-slate-300 text-xs">
            ${escapeHtml(ev.venue)}
          </td>
          <td class="py-3.5 px-4 text-center font-semibold whitespace-nowrap">
            <span class="${isFull ? 'text-rose-400 font-bold' : 'text-slate-200'}">
              ${ev.registered} / ${ev.capacity}
            </span>
          </td>
          <td class="py-3.5 px-4 text-center">
            <div class="inline-flex items-center gap-2">
              <div class="w-16 bg-slate-800 rounded-full h-2 overflow-hidden hidden sm:block">
                <div class="h-2 rounded-full ${isCritical ? 'bg-rose-500' : 'bg-indigo-500'}" style="width: ${Math.min(100, ev.utilizationPct)}%"></div>
              </div>
              <span class="text-xs font-bold ${isCritical ? 'text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800' : 'text-slate-300'}">
                ${ev.utilizationPct}%
              </span>
            </div>
          </td>
          <td class="py-3.5 px-4 text-right font-medium text-slate-300 whitespace-nowrap">
            ${ev.fee === 0 ? '<span class="text-emerald-400 font-semibold">Free</span>' : '₹' + ev.fee}
          </td>
        `;

        eventsTableBody.appendChild(row);
      });
    } catch (err) {
      console.error("Error loading events table:", err);
      eventsTableBody.innerHTML = `
        <tr><td colspan="7" class="py-6 text-center text-rose-400">Error loading events: ${err.message}</td></tr>
      `;
    }
  }

  /**
   * Fetch Raw Registrations from GET /api/registrations (Step 8 & Stretch Goal 2)
   */
  async function loadRegistrationsTable(eventId = "") {
    registrationsTableBody.innerHTML = `
      <tr>
        <td colspan="8" class="py-8 text-center text-slate-400">
          <div class="inline-block w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mr-2"></div>
          Loading registrations records...
        </td>
      </tr>
    `;

    try {
      const url = eventId ? `/api/registrations?event_id=${eventId}` : "/api/registrations";
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const regs = await res.json();

      registrationsTableBody.innerHTML = "";

      if (regs.length === 0) {
        registrationsTableBody.innerHTML = `
          <tr><td colspan="8" class="py-6 text-center text-slate-400">No registrations recorded yet.</td></tr>
        `;
        return;
      }

      regs.forEach((reg) => {
        const row = document.createElement("tr");
        row.className = "hover:bg-slate-800/40 transition-colors";
        row.innerHTML = `
          <td class="py-3.5 px-4 text-slate-400 font-mono text-xs">#${reg.id}</td>
          <td class="py-3.5 px-4 font-bold text-white">${escapeHtml(reg.student_name)}</td>
          <td class="py-3.5 px-4 text-slate-300 font-mono text-xs">${escapeHtml(reg.roll_number)}</td>
          <td class="py-3.5 px-4 text-slate-300 text-xs">${escapeHtml(reg.email)}</td>
          <td class="py-3.5 px-4 text-slate-400 text-xs">${escapeHtml(reg.phone || "-")}</td>
          <td class="py-3.5 px-4">
            <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-800/60">
              ${escapeHtml(reg.event_title)}
            </span>
          </td>
          <td class="py-3.5 px-4 text-slate-400 text-xs whitespace-nowrap">${reg.registered_at}</td>
          <td class="py-3.5 px-4 text-right">
            <!-- Stretch Goal 2: Cancel Registration Button -->
            <button 
              data-id="${reg.id}" 
              data-name="${escapeHtml(reg.student_name)}" 
              data-event="${escapeHtml(reg.event_title)}"
              class="cancel-reg-btn text-xs px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 text-rose-300 transition"
              title="Cancel Registration"
            >
              Cancel
            </button>
          </td>
        `;
        registrationsTableBody.appendChild(row);
      });

      // Attach cancel registration listeners
      document.querySelectorAll(".cancel-reg-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const regId = btn.getAttribute("data-id");
          const name = btn.getAttribute("data-name");
          const evTitle = btn.getAttribute("data-event");
          openCancelModal(regId, name, evTitle);
        });
      });
    } catch (err) {
      console.error("Error loading registrations:", err);
      registrationsTableBody.innerHTML = `
        <tr><td colspan="8" class="py-6 text-center text-rose-400">Error loading registrations: ${err.message}</td></tr>
      `;
    }
  }

  function populateEventDropdown(events) {
    const currentVal = filterRegEvent.value;
    filterRegEvent.innerHTML = `<option value="">All Events (${events.length})</option>`;
    events.forEach((ev) => {
      const opt = document.createElement("option");
      opt.value = ev.id;
      opt.textContent = `${ev.title} (${ev.category})`;
      filterRegEvent.appendChild(opt);
    });
    filterRegEvent.value = currentVal;
  }

  filterRegEvent.addEventListener("change", (e) => {
    loadRegistrationsTable(e.target.value);
  });

  // Tab Switching
  tabEventsBtn.addEventListener("click", () => {
    tabEventsBtn.className = "pb-3 text-sm font-bold text-indigo-400 border-b-2 border-indigo-500 transition";
    tabRegsBtn.className = "pb-3 text-sm font-semibold text-slate-400 hover:text-slate-200 border-b-2 border-transparent transition";
    viewEventsTable.classList.remove("hidden");
    viewRegistrationsTable.classList.add("hidden");
  });

  tabRegsBtn.addEventListener("click", () => {
    tabRegsBtn.className = "pb-3 text-sm font-bold text-purple-400 border-b-2 border-purple-500 transition";
    tabEventsBtn.className = "pb-3 text-sm font-semibold text-slate-400 hover:text-slate-200 border-b-2 border-transparent transition";
    viewEventsTable.classList.add("hidden");
    viewRegistrationsTable.classList.remove("hidden");
    loadRegistrationsTable(filterRegEvent.value);
  });

  // Refresh Button
  refreshBtn.addEventListener("click", async () => {
    refreshBtn.classList.add("opacity-50", "pointer-events-none");
    await Promise.all([loadStats(), loadEventsTable(), loadRegistrationsTable(filterRegEvent.value)]);
    showAlert("✓ Dashboard data refreshed live from SQLite database.", "success");
    refreshBtn.classList.remove("opacity-50", "pointer-events-none");
  });

  // Stretch Goal 1: Add New Event
  openAddEventBtn.addEventListener("click", () => {
    addEventAlert.classList.add("hidden");
    addEventForm.reset();
    addEventModal.classList.remove("hidden");
  });

  closeAddEventBtn.addEventListener("click", () => {
    addEventModal.classList.add("hidden");
  });

  addEventModal.addEventListener("click", (e) => {
    if (e.target === addEventModal) addEventModal.classList.add("hidden");
  });

  addEventForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      title: document.getElementById("add-title").value.trim(),
      category: document.getElementById("add-category").value,
      description: document.getElementById("add-description").value.trim(),
      event_date: document.getElementById("add-date").value,
      event_time: document.getElementById("add-time").value.trim(),
      venue: document.getElementById("add-venue").value.trim(),
      capacity: parseInt(document.getElementById("add-capacity").value, 10),
      fee: parseInt(document.getElementById("add-fee").value, 10) || 0,
      icon: document.getElementById("add-icon").value.trim() || "🎉",
    };

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.status === 201) {
        addEventModal.classList.add("hidden");
        showAlert(`🎉 Event "${payload.title}" created successfully!`, "success");
        await Promise.all([loadStats(), loadEventsTable()]);
      } else {
        addEventAlert.className = "p-3 rounded-xl text-xs font-semibold bg-rose-950 border border-rose-700 text-rose-300 block";
        addEventAlert.textContent = data.detail || "Failed to create event.";
      }
    } catch (err) {
      addEventAlert.className = "p-3 rounded-xl text-xs font-semibold bg-rose-950 border border-rose-700 text-rose-300 block";
      addEventAlert.textContent = "Network error: " + err.message;
    }
  });

  // Stretch Goal 2: Cancel Registration Modal
  function openCancelModal(regId, name, evTitle) {
    pendingDeleteRegistrationId = regId;
    cancelModalText.textContent = `Are you sure you want to cancel the registration for "${name}" for "${evTitle}"? This will free up 1 seat for the event.`;
    cancelModal.classList.remove("hidden");
  }

  cancelAbortBtn.addEventListener("click", () => {
    cancelModal.classList.add("hidden");
    pendingDeleteRegistrationId = null;
  });

  cancelConfirmBtn.addEventListener("click", async () => {
    if (!pendingDeleteRegistrationId) return;

    try {
      const res = await fetch(`/api/registrations/${pendingDeleteRegistrationId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        cancelModal.classList.add("hidden");
        showAlert(`✓ Registration #${pendingDeleteRegistrationId} cancelled successfully. Available seat restored.`, "success");
        pendingDeleteRegistrationId = null;
        await Promise.all([loadStats(), loadEventsTable(), loadRegistrationsTable(filterRegEvent.value)]);
      } else {
        const data = await res.json();
        alert(data.detail || "Failed to cancel registration.");
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  });

  function showAlert(msg, type = "info") {
    adminAlert.classList.remove("hidden");
    if (type === "success") {
      adminAlert.className = "p-4 rounded-xl text-sm font-semibold bg-emerald-950/80 border border-emerald-600 text-emerald-200 block";
    } else {
      adminAlert.className = "p-4 rounded-xl text-sm font-semibold bg-rose-950/80 border border-rose-600 text-rose-200 block";
    }
    adminAlert.textContent = msg;
    setTimeout(() => {
      adminAlert.classList.add("hidden");
    }, 4500);
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

  // Initial Data Load
  loadStats();
  loadEventsTable();
});
