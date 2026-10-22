/**
 * Accessibility controls shared across every page: high-contrast mode and
 * adjustable font size. Preferences persist in localStorage so they carry
 * across the whole session.
 */
(function () {
  const STORAGE_KEYS = { contrast: "vs_contrast", fontScale: "vs_font_scale" };
  const MIN_SCALE = 0.85;
  const MAX_SCALE = 1.6;
  const STEP = 0.1;

  function applyContrast(isHigh) {
    document.documentElement.setAttribute("data-contrast", isHigh ? "high" : "standard");
    const btn = document.getElementById("toggle-contrast");
    if (btn) btn.setAttribute("aria-pressed", String(isHigh));
  }

  function applyFontScale(scale) {
    document.documentElement.style.setProperty("--font-scale", scale);
    const label = document.getElementById("font-scale-label");
    if (label) label.textContent = Math.round(scale * 100) + "%";
  }

  function init() {
    const savedContrast = localStorage.getItem(STORAGE_KEYS.contrast) === "true";
    const savedScale = parseFloat(localStorage.getItem(STORAGE_KEYS.fontScale)) || 1;

    applyContrast(savedContrast);
    applyFontScale(savedScale);

    const contrastBtn = document.getElementById("toggle-contrast");
    if (contrastBtn) {
      contrastBtn.addEventListener("click", () => {
        const nowHigh = document.documentElement.getAttribute("data-contrast") !== "high";
        applyContrast(nowHigh);
        localStorage.setItem(STORAGE_KEYS.contrast, String(nowHigh));
      });
    }

    const increaseBtn = document.getElementById("font-increase");
    const decreaseBtn = document.getElementById("font-decrease");
    const resetBtn = document.getElementById("font-reset");

    function currentScale() {
      return parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--font-scale")) || 1;
    }

    if (increaseBtn) {
      increaseBtn.addEventListener("click", () => {
        const next = Math.min(MAX_SCALE, +(currentScale() + STEP).toFixed(2));
        applyFontScale(next);
        localStorage.setItem(STORAGE_KEYS.fontScale, String(next));
      });
    }
    if (decreaseBtn) {
      decreaseBtn.addEventListener("click", () => {
        const next = Math.max(MIN_SCALE, +(currentScale() - STEP).toFixed(2));
        applyFontScale(next);
        localStorage.setItem(STORAGE_KEYS.fontScale, String(next));
      });
    }
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        applyFontScale(1);
        localStorage.setItem(STORAGE_KEYS.fontScale, "1");
      });
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
