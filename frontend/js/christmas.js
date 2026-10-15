/**
 * Zenith '26 College Fest - Christmas / Winter Holiday Module
 * Features:
 *  - Canvas-based falling snowflakes with gentle wobble
 *  - Flying Santa & reindeer sleighs across the sky with starry sparkle trail
 *  - Festive Holiday Welcome Popup modal
 *  - Floating "Holiday Cheer" button
 *  - Interactive Snow & Santa toggle controls
 */

(function () {
  let snowCanvas = null;
  let ctx = null;
  let snowflakes = [];
  let animFrameId = null;
  let isSnowing = true;
  let isSantaFlying = true;
  const SNOWFLAKE_COUNT = 85;

  // Initialize Christmas features on DOM ready
  document.addEventListener("DOMContentLoaded", () => {
    initSnowfall();
    initFlyingSanta();
    initChristmasPopup();
    initFloatingHolidayPill();
    initHolidayDecorations();
  });

  /**
   * 1. Falling Snow Effect (Canvas-based, performant 60fps)
   */
  function initSnowfall() {
    snowCanvas = document.createElement("canvas");
    snowCanvas.id = "snow-canvas";
    snowCanvas.style.cssText =
      "position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; pointer-events: none; z-index: 35;";
    document.body.appendChild(snowCanvas);

    ctx = snowCanvas.getContext("2d");
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Create initial snowflakes
    for (let i = 0; i < SNOWFLAKE_COUNT; i++) {
      snowflakes.push(createSnowflake());
    }

    animateSnow();
  }

  function resizeCanvas() {
    if (!snowCanvas) return;
    snowCanvas.width = window.innerWidth;
    snowCanvas.height = window.innerHeight;
  }

  function createSnowflake(fromTop = false) {
    const width = window.innerWidth;
    const height = window.innerHeight;
    return {
      x: Math.random() * width,
      y: fromTop ? -10 : Math.random() * height,
      radius: Math.random() * 2.8 + 0.8,
      speed: Math.random() * 1.4 + 0.6,
      wind: Math.random() * 0.8 - 0.4,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: Math.random() * 0.03 + 0.01,
      opacity: Math.random() * 0.65 + 0.35,
    };
  }

  function animateSnow() {
    if (!ctx) return;
    ctx.clearRect(0, 0, snowCanvas.width, snowCanvas.height);

    if (isSnowing) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      for (let i = 0; i < snowflakes.length; i++) {
        const flake = snowflakes[i];
        flake.wobble += flake.wobbleSpeed;
        flake.y += flake.speed;
        flake.x += Math.sin(flake.wobble) * 0.7 + flake.wind;

        // Reset if off bottom or sides
        if (flake.y > window.innerHeight + 10) {
          snowflakes[i] = createSnowflake(true);
        }
        if (flake.x > window.innerWidth + 10) {
          flake.x = -10;
        } else if (flake.x < -10) {
          flake.x = window.innerWidth + 10;
        }

        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${flake.opacity})`;
        ctx.fill();
      }
    }

    animFrameId = requestAnimationFrame(animateSnow);
  }

  /**
   * 2. Flying Santa & Reindeer Sleighs with Sparkles
   */
  function initFlyingSanta() {
    // Inject CSS for Santa flight animations
    const style = document.createElement("style");
    style.id = "christmas-styles";
    style.textContent = `
      @keyframes santaFlyAcross {
        0% {
          transform: translateX(-350px) translateY(0px) rotate(2deg);
          opacity: 0;
        }
        5% {
          opacity: 1;
        }
        25% {
          transform: translateX(25vw) translateY(-25px) rotate(-3deg);
        }
        50% {
          transform: translateX(50vw) translateY(15px) rotate(3deg);
        }
        75% {
          transform: translateX(75vw) translateY(-20px) rotate(-2deg);
        }
        95% {
          opacity: 1;
        }
        100% {
          transform: translateX(calc(100vw + 350px)) translateY(0px) rotate(2deg);
          opacity: 0;
        }
      }

      @keyframes santaAltFly {
        0% {
          transform: translateX(calc(100vw + 250px)) translateY(0px) scaleX(-1);
          opacity: 0;
        }
        8% { opacity: 0.85; }
        92% { opacity: 0.85; }
        100% {
          transform: translateX(-250px) translateY(-15px) scaleX(-1);
          opacity: 0;
        }
      }

      @keyframes sparkleTwinkle {
        0%, 100% { opacity: 0.2; transform: scale(0.6); }
        50% { opacity: 1; transform: scale(1.3); }
      }

      @keyframes festiveLightGlow {
        0%, 100% { filter: drop-shadow(0 0 3px currentColor); opacity: 0.8; }
        50% { filter: drop-shadow(0 0 9px currentColor); opacity: 1; }
      }

      .santa-flyer {
        position: fixed;
        top: 90px;
        left: 0;
        pointer-events: auto;
        cursor: pointer;
        z-index: 38;
        display: flex;
        align-items: center;
        gap: 6px;
        filter: drop-shadow(0 10px 15px rgba(0, 0, 0, 0.45));
        animation: santaFlyAcross 16s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        user-select: none;
      }

      .santa-flyer:hover {
        animation-play-state: paused;
      }

      .santa-alt-flyer {
        position: fixed;
        top: 220px;
        left: 0;
        pointer-events: none;
        z-index: 36;
        opacity: 0.6;
        animation: santaAltFly 22s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        animation-delay: 8s;
        user-select: none;
      }

      .holiday-string-lights {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 8px;
        display: flex;
        justify-content: space-around;
        pointer-events: none;
        z-index: 45;
        overflow: hidden;
      }

      .light-bulb {
        width: 8px;
        height: 12px;
        border-radius: 50% 50% 45% 45%;
        margin-top: -3px;
        animation: festiveLightGlow 1.5s infinite ease-in-out;
      }

      .bulb-red { background-color: #ef4444; color: #ef4444; animation-delay: 0s; }
      .bulb-green { background-color: #10b981; color: #10b981; animation-delay: 0.4s; }
      .bulb-yellow { background-color: #f59e0b; color: #f59e0b; animation-delay: 0.8s; }
      .bulb-blue { background-color: #38bdf8; color: #38bdf8; animation-delay: 1.2s; }
      .bulb-pink { background-color: #ec4899; color: #ec4899; animation-delay: 0.6s; }
    `;
    document.head.appendChild(style);

    // Primary Santa in Sleigh with Reindeer
    const santaContainer = document.createElement("div");
    santaContainer.id = "main-flying-santa";
    santaContainer.className = "santa-flyer";
    santaContainer.title = "🎅 Ho Ho Ho! Click me for holiday cheer!";
    santaContainer.innerHTML = `
      <div class="flex items-center text-3xl sm:text-4xl filter drop-shadow-md">
        <!-- Reindeer Team -->
        <span class="mr-1 transform hover:scale-125 transition-transform" title="Rudolph">🦌</span>
        <span class="mr-1 transform hover:scale-125 transition-transform">🦌</span>
        <span class="mr-2 text-2xl text-amber-300">✨</span>
        <!-- Santa in Sleigh -->
        <span class="text-4xl sm:text-5xl transform hover:scale-110 transition-transform">🛷</span>
        <span class="text-4xl sm:text-5xl -ml-6 -mt-3 transform hover:scale-125 transition-transform">🎅</span>
        <!-- Sparkle Trail -->
        <div class="flex items-center gap-1 ml-2 text-amber-300 text-sm">
          <span style="animation: sparkleTwinkle 1.2s infinite ease-in-out;">✨</span>
          <span style="animation: sparkleTwinkle 1.2s infinite ease-in-out 0.4s;">⭐</span>
          <span style="animation: sparkleTwinkle 1.2s infinite ease-in-out 0.8s;">🎁</span>
        </div>
      </div>
    `;

    santaContainer.addEventListener("click", () => {
      showChristmasToast("🎅 Ho Ho Ho! Santa brings you festive greetings for Zenith '26!");
      triggerHolidayCheerEffect(santaContainer);
    });

    document.body.appendChild(santaContainer);

    // Secondary background flyer (Santa with sleigh high above)
    const santaAlt = document.createElement("div");
    santaAlt.id = "alt-flying-santa";
    santaAlt.className = "santa-alt-flyer";
    santaAlt.innerHTML = `
      <div class="flex items-center text-2xl filter drop-shadow">
        <span>🦌</span>
        <span class="ml-1">🦌</span>
        <span class="ml-1 text-3xl">🛷🎅</span>
        <span class="text-xs text-yellow-300 ml-1">✨✨</span>
      </div>
    `;
    document.body.appendChild(santaAlt);
  }

  function triggerHolidayCheerEffect(element) {
    const rect = element.getBoundingClientRect();
    const burst = document.createElement("div");
    burst.style.cssText = `
      position: fixed;
      left: ${rect.left + rect.width / 2}px;
      top: ${rect.top}px;
      pointer-events: none;
      z-index: 100;
      font-size: 24px;
      transform: translate(-50%, -50%);
      transition: all 1s ease-out;
    `;
    burst.textContent = "🎄✨🎁 Ho Ho Ho! 🎅🎉";
    document.body.appendChild(burst);

    requestAnimationFrame(() => {
      burst.style.transform = "translate(-50%, -100px) scale(1.5)";
      burst.style.opacity = "0";
    });

    setTimeout(() => burst.remove(), 1000);
  }

  /**
   * 3. Festive Holiday Welcome Popup Modal
   */
  function initChristmasPopup() {
    const modal = document.createElement("div");
    modal.id = "christmas-modal";
    modal.className =
      "fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md hidden transition-opacity duration-300";
    modal.innerHTML = `
      <div class="relative bg-gradient-to-b from-slate-900 via-indigo-950/70 to-slate-900 border-2 border-red-500/40 rounded-3xl max-w-lg w-full p-6 sm:p-8 text-center shadow-2xl shadow-red-500/20 overflow-hidden transform transition-all">
        
        <!-- Holiday Decorative Top Ribbon -->
        <div class="absolute -top-12 -left-12 w-28 h-28 bg-red-600/20 rounded-full blur-2xl"></div>
        <div class="absolute -top-12 -right-12 w-28 h-28 bg-emerald-600/20 rounded-full blur-2xl"></div>
        
        <!-- Close Button -->
        <button id="close-christmas-modal-btn" class="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800/80 transition" aria-label="Close Christmas Modal">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <!-- Festive Icons Header -->
        <div class="flex items-center justify-center gap-3 text-4xl mb-3">
          <span class="animate-bounce" style="animation-duration: 2s;">🎄</span>
          <span class="text-5xl transform hover:scale-110 transition-transform">🎅</span>
          <span class="animate-bounce" style="animation-duration: 2.2s;">🎁</span>
        </div>

        <!-- Title -->
        <div class="inline-block px-3 py-1 rounded-full bg-red-950/80 border border-red-700/60 text-red-300 text-xs font-bold uppercase tracking-wider mb-2">
          ❄️ Winter Holiday Special ❄️
        </div>
        <h2 class="text-2xl sm:text-3xl font-extrabold text-white mb-2 leading-tight">
          Merry Christmas & Welcome to <span class="bg-clip-text text-transparent bg-gradient-to-r from-red-400 via-amber-300 to-emerald-400">Zenith '26!</span>
        </h2>
        <p class="text-slate-300 text-xs sm:text-sm mb-6 leading-relaxed">
          Celebrate the festive season with campus energy, hackathons, music showdowns, gaming leagues, and creative workshops. Santas are soaring and snow is falling!
        </p>

        <!-- Highlights Grid -->
        <div class="grid grid-cols-2 gap-3 mb-6 text-left">
          <div class="p-3 rounded-2xl bg-slate-800/70 border border-slate-700/60 flex items-center gap-3">
            <span class="text-2xl">🎟️</span>
            <div>
              <div class="text-white text-xs font-bold">14 Fest Events</div>
              <div class="text-slate-400 text-[11px]">Free & Premium Passes</div>
            </div>
          </div>
          <div class="p-3 rounded-2xl bg-slate-800/70 border border-slate-700/60 flex items-center gap-3">
            <span class="text-2xl">⚡</span>
            <div>
              <div class="text-white text-xs font-bold">Instant Booking</div>
              <div class="text-slate-400 text-[11px]">Live Capacity Updates</div>
            </div>
          </div>
          <div class="p-3 rounded-2xl bg-slate-800/70 border border-slate-700/60 flex items-center gap-3">
            <span class="text-2xl">🏆</span>
            <div>
              <div class="text-white text-xs font-bold">Grand Prizes</div>
              <div class="text-slate-400 text-[11px]">Trophies & Goodies</div>
            </div>
          </div>
          <div class="p-3 rounded-2xl bg-slate-800/70 border border-slate-700/60 flex items-center gap-3">
            <span class="text-2xl">❄️</span>
            <div>
              <div class="text-white text-xs font-bold">Holiday Spirit</div>
              <div class="text-slate-400 text-[11px]">Snow & Flying Santas</div>
            </div>
          </div>
        </div>

        <!-- Controls & Action Buttons -->
        <div class="space-y-3">
          <button id="explore-events-holiday-btn" class="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-emerald-600 hover:from-red-500 hover:to-emerald-500 text-white font-bold text-sm shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2">
            <span>Explore Fest Events Now</span>
            <span class="text-base">🚀</span>
          </button>

          <div class="flex items-center justify-between pt-2 border-t border-slate-800/80 px-1 text-xs text-slate-400">
            <span class="flex items-center gap-1.5">
              <span>❄️ Snow & Santa Effects:</span>
              <span id="effects-status-text" class="text-emerald-400 font-semibold">Active</span>
            </span>
            <button id="toggle-snow-btn" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium transition">
              Pause Snow
            </button>
          </div>
        </div>

      </div>
    `;

    document.body.appendChild(modal);

    const closeBtn = document.getElementById("close-christmas-modal-btn");
    const exploreBtn = document.getElementById("explore-events-holiday-btn");
    const toggleSnowBtn = document.getElementById("toggle-snow-btn");
    const effectsStatusText = document.getElementById("effects-status-text");

    const closeModal = () => {
      modal.classList.add("hidden");
      document.body.classList.remove("overflow-hidden");
    };

    const openModal = () => {
      modal.classList.remove("hidden");
      document.body.classList.add("overflow-hidden");
    };

    closeBtn.addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });

    exploreBtn.addEventListener("click", () => {
      closeModal();
      const eventsGrid = document.getElementById("events-grid");
      if (eventsGrid) {
        eventsGrid.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });

    // Snow toggle button
    toggleSnowBtn.addEventListener("click", () => {
      isSnowing = !isSnowing;
      isSantaFlying = !isSantaFlying;
      const mainSanta = document.getElementById("main-flying-santa");
      const altSanta = document.getElementById("alt-flying-santa");

      if (isSnowing) {
        toggleSnowBtn.textContent = "Pause Snow";
        effectsStatusText.textContent = "Active";
        effectsStatusText.className = "text-emerald-400 font-semibold";
        if (mainSanta) mainSanta.style.display = "flex";
        if (altSanta) altSanta.style.display = "flex";
      } else {
        toggleSnowBtn.textContent = "Resume Snow";
        effectsStatusText.textContent = "Paused";
        effectsStatusText.className = "text-slate-400 font-semibold";
        if (mainSanta) mainSanta.style.display = "none";
        if (altSanta) altSanta.style.display = "none";
      }
    });

    // Auto-open modal after 750ms so visitors get the warm holiday welcome!
    const hasSeenWelcome = sessionStorage.getItem("zenith26_christmas_welcomed");
    if (!hasSeenWelcome) {
      setTimeout(() => {
        openModal();
        sessionStorage.setItem("zenith26_christmas_welcomed", "true");
      }, 750);
    }

    // Expose open function globally
    window.openChristmasModal = openModal;
  }

  /**
   * 4. Floating "Holiday Cheer" Pill in bottom corner
   */
  function initFloatingHolidayPill() {
    const pill = document.createElement("button");
    pill.id = "holiday-floating-pill";
    pill.className =
      "fixed bottom-5 right-5 z-40 bg-gradient-to-r from-red-600 via-rose-600 to-emerald-600 hover:from-red-500 hover:to-emerald-500 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-full shadow-xl shadow-red-600/30 border border-white/20 flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 cursor-pointer";
    pill.innerHTML = `
      <span class="text-base">🎅</span>
      <span>Christmas Cheer</span>
      <span class="text-xs bg-white/20 px-1.5 py-0.5 rounded-full">❄️</span>
    `;
    pill.title = "Click to open Christmas Greetings & Effects Menu";

    pill.addEventListener("click", () => {
      if (typeof window.openChristmasModal === "function") {
        window.openChristmasModal();
      }
    });

    document.body.appendChild(pill);
  }

  /**
   * 5. Holiday Header String Lights & Logo Santa Hat
   */
  function initHolidayDecorations() {
    // Add glowing holiday string lights to top of header
    const header = document.querySelector("header");
    if (header) {
      const lightsContainer = document.createElement("div");
      lightsContainer.className = "holiday-string-lights";
      const colors = ["bulb-red", "bulb-green", "bulb-yellow", "bulb-blue", "bulb-pink"];

      const bulbCount = Math.floor(window.innerWidth / 35);
      for (let i = 0; i < bulbCount; i++) {
        const bulb = document.createElement("div");
        bulb.className = `light-bulb ${colors[i % colors.length]}`;
        lightsContainer.appendChild(bulb);
      }
      header.appendChild(lightsContainer);
    }

    // Add Santa Hat to Zenith 26 logo if present
    const logoContainer = document.querySelector("header .flex.items-center.gap-3");
    if (logoContainer) {
      const logoBadge = logoContainer.querySelector("div");
      if (logoBadge) {
        logoBadge.classList.add("relative");
        const hat = document.createElement("span");
        hat.textContent = "🎅";
        hat.style.cssText =
          "position: absolute; top: -14px; right: -12px; font-size: 22px; transform: rotate(15deg); pointer-events: none;";
        logoBadge.appendChild(hat);
      }
    }

    // Add Winter Holiday Edition Tag to Hero
    const heroTitle = document.querySelector("h1");
    if (heroTitle && heroTitle.parentNode) {
      const winterBadge = document.createElement("div");
      winterBadge.className =
        "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/70 border border-red-700/60 text-red-300 text-xs font-semibold mb-3";
      winterBadge.innerHTML = `<span>🎄 Winter Holiday Edition</span><span class="text-red-400">•</span><span>Snow & Festivities Active ❄️</span>`;
      heroTitle.parentNode.insertBefore(winterBadge, heroTitle);
    }
  }

  /**
   * Quick Toast Notification
   */
  function showChristmasToast(msg) {
    const toast = document.createElement("div");
    toast.className =
      "fixed top-20 right-5 z-50 bg-slate-900 border border-red-500/70 text-white text-xs sm:text-sm font-semibold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-fadeIn";
    toast.innerHTML = `<span>🎅</span><span>${msg}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = "opacity 0.4s ease, transform 0.4s ease";
      toast.style.opacity = "0";
      toast.style.transform = "translateY(-10px)";
      setTimeout(() => toast.remove(), 400);
    }, 3500);
  }
})();
