/* ==========================================================
   script.js
   Theme switcher, shared by every page on the site.
   Idea comes from the dev.to dark theme tutorial: toggle a
   class on the body, then remember the choice in localStorage.
   ========================================================== */

// the key we use to save the theme in the browser
var THEME_KEY = 'website_theme';

// grab the button so we can listen for clicks on it
var theme_toggler = document.querySelector('#theme_toggler');

// keeps the button text and aria state in sync with the current theme
function update_button() {
  var is_dark = document.body.classList.contains('dark_mode');
  theme_toggler.textContent = is_dark ? 'Switch to light theme' : 'Switch to dark theme';
  theme_toggler.setAttribute('aria-pressed', is_dark);
}

// look up the saved theme and put it on the page
function retrieve_theme() {
  var theme = null;

  // some browsers block storage (private mode, strict settings), so be careful
  try {
    theme = localStorage.getItem(THEME_KEY);
  } catch (e) {
    theme = null;
  }

  // nothing saved yet means we keep the default light look
  if (theme !== null) {
    document.body.classList.remove('default', 'dark_mode');
    document.body.classList.add(theme);
  }
  update_button();
}

// remember what the student picked so it survives a reload
function save_theme() {
  var value = document.body.classList.contains('dark_mode') ? 'dark_mode' : 'default';
  try {
    localStorage.setItem(THEME_KEY, value);
  } catch (e) {
    // if saving fails the theme still works, it just will not stick
  }
}

// flip the theme whenever the button is clicked
theme_toggler.addEventListener('click', function () {
  document.body.classList.toggle('dark_mode');
  save_theme();
  update_button();
});

// if the theme changes in another tab, follow along here
window.addEventListener('storage', function () {
  retrieve_theme();
}, false);

// run once on load so the saved theme shows up right away
retrieve_theme();
