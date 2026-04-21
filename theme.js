(function () {
  const STORAGE_KEY = "strafkatalog-theme-v4";

  function hexToRgb(hex) {
    const clean = String(hex || "").replace("#", "");
    const full = clean.length === 3
      ? clean.split("").map((char) => char + char).join("")
      : clean;

    const bigint = Number.parseInt(full || "000000", 16);
    return {
      r: (bigint >> 16) & 255,
      g: (bigint >> 8) & 255,
      b: bigint & 255
    };
  }

  function rgbToString(rgb) {
    return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  }

  function rgba(rgb, alpha) {
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
  }

  function mixWithBlack(rgb, amount) {
    return {
      r: Math.round(rgb.r * amount),
      g: Math.round(rgb.g * amount),
      b: Math.round(rgb.b * amount)
    };
  }

  function saveTheme(payload) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {}
  }

  function loadTheme() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function setActivePresetButton(themeName) {
    document.querySelectorAll("[data-theme-preset]").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.themePreset === themeName);
    });
  }

  window.initThemeControls = function initThemeControls() {
    const body = document.body;
    const dropdownBtn = document.getElementById("themeDropdownBtn");
    const dropdownMenu = document.getElementById("themeDropdownMenu");
    const customColor1 = document.getElementById("customColor1");
    const customColor2 = document.getElementById("customColor2");
    const applyCustomThemeBtn = document.getElementById("applyCustomTheme");

    if (!body || !dropdownBtn || !dropdownMenu || !customColor1 || !customColor2 || !applyCustomThemeBtn) {
      return;
    }

    function setMenuState(isOpen) {
      dropdownMenu.classList.toggle("hidden", !isOpen);
      dropdownBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
    }

    function toggleThemeMenu(force) {
      const shouldOpen = typeof force === "boolean"
        ? force
        : dropdownMenu.classList.contains("hidden");

      setMenuState(shouldOpen);
    }

    function clearCustomInlineVars() {
      [
        "--accent",
        "--accent-2",
        "--accent-soft",
        "--accent-border",
        "--page-start",
        "--page-end",
        "--page-glow-1",
        "--page-glow-2",
        "--topbar-start",
        "--topbar-mid",
        "--topbar-end",
        "--section-start",
        "--section-end",
        "--panel-start",
        "--panel-end",
        "--card-start",
        "--card-end",
        "--button-bg",
        "--field-bg",
        "--pill-bg"
      ].forEach((name) => body.style.removeProperty(name));
    }

    function applyPresetTheme(themeName, persist = true) {
      clearCustomInlineVars();
      body.setAttribute("data-theme", themeName);
      setActivePresetButton(themeName);

      if (persist) {
        saveTheme({ type: "preset", themeName });
      }
    }

    function applyCustomTheme(color1, color2, persist = true) {
      const c1 = hexToRgb(color1);
      const c2 = hexToRgb(color2);

      const d1 = mixWithBlack(c1, 0.18);
      const d2 = mixWithBlack(c2, 0.18);
      const d3 = mixWithBlack(c1, 0.12);
      const d4 = mixWithBlack(c2, 0.10);
      const d5 = mixWithBlack(c1, 0.28);
      const d6 = mixWithBlack(c2, 0.28);

      body.setAttribute("data-theme", "custom");

      body.style.setProperty("--accent", color1);
      body.style.setProperty("--accent-2", color2);
      body.style.setProperty("--accent-soft", rgba(c1, 0.12));
      body.style.setProperty("--accent-border", rgba(c2, 0.30));

      body.style.setProperty("--page-start", rgbToString(d3));
      body.style.setProperty("--page-end", rgbToString(d4));
      body.style.setProperty("--page-glow-1", rgba(c1, 0.16));
      body.style.setProperty("--page-glow-2", rgba(c2, 0.14));

      body.style.setProperty("--topbar-start", rgba(d5, 0.98));
      body.style.setProperty("--topbar-mid", rgba(d1, 0.98));
      body.style.setProperty("--topbar-end", rgba(d6, 0.98));

      body.style.setProperty("--section-start", rgba(mixWithBlack(c1, 0.35), 0.92));
      body.style.setProperty("--section-end", rgba(mixWithBlack(c2, 0.35), 0.92));

      body.style.setProperty("--panel-start", rgba(mixWithBlack(c1, 0.14), 0.98));
      body.style.setProperty("--panel-end", rgba(mixWithBlack(c2, 0.10), 0.98));

      body.style.setProperty("--card-start", rgba(mixWithBlack(c1, 0.22), 1));
      body.style.setProperty("--card-end", rgba(mixWithBlack(c2, 0.12), 1));

      body.style.setProperty(
        "--button-bg",
        `linear-gradient(135deg, ${rgba(mixWithBlack(c1, 0.34), 0.90)}, ${rgba(mixWithBlack(c2, 0.34), 0.90)})`
      );
      body.style.setProperty("--field-bg", rgba(mixWithBlack(c2, 0.14), 0.96));
      body.style.setProperty("--pill-bg", rgba(c1, 0.12));

      setActivePresetButton("");

      if (persist) {
        saveTheme({ type: "custom", color1, color2 });
      }
    }

    dropdownBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleThemeMenu();
    });

    dropdownMenu.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    document.querySelectorAll("[data-theme-preset]").forEach((btn) => {
      btn.addEventListener("click", () => {
        applyPresetTheme(btn.dataset.themePreset);
      });
    });

    applyCustomThemeBtn.addEventListener("click", () => {
      applyCustomTheme(customColor1.value, customColor2.value);
    });

    document.addEventListener("click", () => {
      toggleThemeMenu(false);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        toggleThemeMenu(false);
      }
    });

    const saved = loadTheme();

    if (saved && saved.type === "custom" && saved.color1 && saved.color2) {
      customColor1.value = saved.color1;
      customColor2.value = saved.color2;
      applyCustomTheme(saved.color1, saved.color2, false);
    } else if (saved && saved.type === "preset" && saved.themeName) {
      applyPresetTheme(saved.themeName, false);
    } else {
      applyPresetTheme("blue", false);
    }

    setMenuState(false);
  };
})();
