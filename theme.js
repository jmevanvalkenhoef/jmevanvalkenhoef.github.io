// Theme toggle: follows the system until clicked, then remembers the choice.
(() => {
  const root = document.documentElement;
  try { const t = localStorage.getItem("theme"); if (t) root.dataset.theme = t; } catch {}
  document.addEventListener("DOMContentLoaded", () => {
    const button = document.getElementById("theme");
    if (!button) return;
    const label = () => {
      const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
      button.textContent = dark ? "light" : "dark";
      return dark;
    };
    label();
    button.addEventListener("click", () => {
      root.dataset.theme = label() ? "light" : "dark";
      try { localStorage.setItem("theme", root.dataset.theme); } catch {}
      label();
    });
  });
})();
