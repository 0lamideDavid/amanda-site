(function () {
  "use strict";

  // Same mechanism as the public site's theme toggle (src/public/js/site.js)
  // and the same localStorage key, so switching themes in one area carries
  // over to the other.
  var root = document.documentElement;
  var toggleBtn = document.getElementById("theme-toggle");

  function currentTheme() {
    return root.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }
  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    localStorage.setItem("amandas-theme", theme);
    if (toggleBtn) toggleBtn.textContent = theme === "dark" ? "☀" : "☾";
  }
  if (toggleBtn) {
    toggleBtn.textContent = currentTheme() === "dark" ? "☀" : "☾";
    toggleBtn.addEventListener("click", function () {
      applyTheme(currentTheme() === "dark" ? "light" : "dark");
    });
  }
})();
