const storageKey = 'theme-preference';

// Toggle theme and save the preference
const onClick = () => {
  theme.value = theme.value === 'light' ? 'dark' : 'light';
  setPreference();
};

// Get color preference from localStorage or match media query
const getColorPreference = () => 
  localStorage.getItem(storageKey) || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

// Set theme preference in localStorage and apply it
const setPreference = () => {
  localStorage.setItem(storageKey, theme.value);
  reflectPreference();
};

// Apply theme and update aria-label
const reflectPreference = () => {
  document.firstElementChild.setAttribute('theme', theme.value);
  const toggleButton = document.querySelector('#theme-toggle');
  if (toggleButton) toggleButton.setAttribute('aria-label', theme.value);
  document.dispatchEvent(new CustomEvent('themechange', { detail: { theme: theme.value }}));
};

const theme = {
  value: getColorPreference(),
};

// Set theme early to avoid page flash
reflectPreference();

window.onload = () => {
  // Apply theme when the page loads
  reflectPreference();

  // Attach click event listener to theme toggle button
  const toggleButton = document.querySelector('#theme-toggle');
  if (toggleButton) toggleButton.addEventListener('click', onClick);
};

// Sync with system-level changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', ({ matches: isDark }) => {
  theme.value = isDark ? 'dark' : 'light';
  setPreference();
});
