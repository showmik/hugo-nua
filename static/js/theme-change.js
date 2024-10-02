const toggleIcon = document.getElementById("themeColorToggle");

// Set initial theme based on localStorage
setTheme(localStorage.getItem("theme") || "light");

// Toggle theme on button click
toggleIcon.addEventListener("click", () => setTheme(getCurrentTheme() === "dark" ? "light" : "dark"));

function setTheme(theme) {
  // Update theme attribute and localStorage
  document.body.setAttribute("theme", theme);
  localStorage.setItem("theme", theme);
  toggleIcon.src = toggleIcon.getAttribute(`src-${theme}`);
}

function getCurrentTheme() {
  return document.body.getAttribute("theme");
}
