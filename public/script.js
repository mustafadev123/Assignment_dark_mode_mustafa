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

/* ----------------------------------------------------------
   Logged in state
   Asks the server who is logged in, then adds a greeting and
   a Log out link to the nav. The server already keeps logged
   out visitors off the pages where this shows up.
   ---------------------------------------------------------- */

// adds the greeting and Log out link for whoever is logged in
function update_nav(username) {
  var nav = document.querySelector('.nav');
  if (!nav || !username) {
    return; // no nav on this page, or nobody is logged in, so leave it alone
  }

  // textContent, not innerHTML, so a strange username cannot inject html
  var greeting = document.createElement('span');
  greeting.className = 'greeting';
  greeting.textContent = 'Hi, ' + username;

  var logout = document.createElement('a');
  logout.href = '/logout';
  logout.textContent = 'Log out';

  nav.appendChild(greeting);
  nav.appendChild(logout);
}

// fetch fails if the page was opened as a file instead of through the server, that is fine
fetch('/me')
  .then(function (response) { return response.json(); })
  .then(function (data) { update_nav(data.username); })
  .catch(function () {});
