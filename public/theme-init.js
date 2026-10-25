// Applies a saved theme choice before the page paints. "System" needs no script.
try {
  var theme = localStorage.getItem("safeclick-theme");
  if (theme === "light" || theme === "dark") document.documentElement.dataset.theme = theme;
} catch {}
