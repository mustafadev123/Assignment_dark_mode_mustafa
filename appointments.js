/* ==========================================================
   appointments.js
   Runs the "Find a therapist" page: filtering, sorting, the
   booking popup, and the list of booked appointments.
   No database yet, so the therapists are hard coded below and
   bookings are saved in localStorage
   ========================================================== */

// fake therapists for now, every name here is made up
// availability maps a weekday to the times that therapist is open
var therapists = [
  {
    id: 't1', name: 'Dr. Amara Okafor', credentials: 'PsyD', title: 'Licensed psychologist',
    years: 9, rating: 4.9, reviews: 132, accepting: true,
    specialties: ['Anxiety', 'Academic stress'],
    languages: ['English', 'French'],
    formats: ['video', 'in-person'],
    availability: { Mon: ['10:00 AM', '1:00 PM'], Wed: ['11:00 AM'], Thu: ['3:00 PM'] }
  },
  {
    id: 't2', name: 'Samir Haddad', credentials: 'LPC', title: 'Licensed professional counselor',
    years: 6, rating: 4.8, reviews: 87, accepting: true,
    specialties: ['Depression', 'Cultural adjustment'],
    languages: ['English', 'Arabic'],
    formats: ['video'],
    availability: { Tue: ['2:00 PM', '4:00 PM'], Thu: ['10:00 AM'] }
  },
  {
    id: 't3', name: 'Priya Raman', credentials: 'LCSW', title: 'Licensed clinical social worker',
    years: 7, rating: 4.7, reviews: 104, accepting: true,
    specialties: ['Relationships', 'Anxiety'],
    languages: ['English', 'Hindi', 'Tamil'],
    formats: ['video', 'in-person'],
    availability: { Mon: ['9:00 AM'], Wed: ['2:00 PM'], Fri: ['1:00 PM'] }
  },
  {
    id: 't4', name: 'Dr. Marcus Bell', credentials: 'PhD', title: 'Clinical psychologist',
    years: 14, rating: 4.6, reviews: 211, accepting: false,
    specialties: ['Trauma', 'Sleep'],
    languages: ['English'],
    formats: ['in-person'],
    availability: { Tue: ['9:00 AM'], Fri: ['10:00 AM', '3:00 PM'] }
  },
  {
    id: 't5', name: 'Lucia Fernandez', credentials: 'LMFT', title: 'Marriage and family therapist',
    years: 8, rating: 4.8, reviews: 96, accepting: true,
    specialties: ['Relationships', 'Cultural adjustment'],
    languages: ['English', 'Spanish'],
    formats: ['video', 'in-person'],
    availability: { Wed: ['10:00 AM'], Thu: ['1:00 PM', '4:00 PM'] }
  },
  {
    id: 't6', name: 'Jae-won Park', credentials: 'LPC', title: 'Licensed professional counselor',
    years: 4, rating: 4.5, reviews: 41, accepting: true,
    specialties: ['Academic stress', 'Sleep', 'Anxiety'],
    languages: ['English', 'Korean'],
    formats: ['video'],
    availability: { Mon: ['3:00 PM'], Tue: ['11:00 AM'], Fri: ['9:00 AM'] }
  },
  {
    id: 't7', name: 'Dr. Nadia Rahman', credentials: 'PsyD', title: 'Licensed psychologist',
    years: 11, rating: 4.9, reviews: 158, accepting: true,
    specialties: ['Depression', 'Trauma', 'Cultural adjustment'],
    languages: ['English', 'Urdu', 'Bengali'],
    formats: ['video', 'in-person'],
    availability: { Tue: ['1:00 PM'], Wed: ['4:00 PM'], Fri: ['11:00 AM'] }
  },
  {
    id: 't8', name: 'Tyrone Mitchell', credentials: 'LCSW', title: 'Licensed clinical social worker',
    years: 10, rating: 4.7, reviews: 119, accepting: true,
    specialties: ['Grief and loss', 'Depression'],
    languages: ['English'],
    formats: ['in-person'],
    availability: { Mon: ['11:00 AM'], Thu: ['2:00 PM'] }
  }
];

// ---------- little lookup tables ----------
var STORAGE_KEY = 'pantherwell_appointments';
var DAY_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
var DAY_INDEX = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5 };
var FORMAT_LABELS = { 'video': 'Video call', 'in-person': 'In person' };

// ---------- grab the page elements once ----------
var form = document.querySelector('#filters');
var results = document.querySelector('#results');
var result_count = document.querySelector('#result_count');
var empty_state = document.querySelector('#empty_state');
var reset_btn = document.querySelector('#reset_filters');
var my_appointments = document.querySelector('#my_appointments');
var dialog = document.querySelector('#booking_dialog');
var booking_form = document.querySelector('#booking_form');
var dialog_title = document.querySelector('#dialog_title');
var dialog_slots = document.querySelector('#dialog_slots');
var dialog_formats = document.querySelector('#dialog_formats');
var dialog_error = document.querySelector('#dialog_error');
var toast = document.querySelector('#toast');

// remembers which therapist the popup is open for
var current_therapist = null;

/* ---------- filling the dropdowns ---------- */

// build the topic and language dropdowns from the data so they never go out of date
function fill_select(select_name, field) {
  var seen = [];
  therapists.forEach(function (t) {
    t[field].forEach(function (value) {
      if (seen.indexOf(value) === -1) seen.push(value);
    });
  });
  seen.sort();

  seen.forEach(function (value) {
    var option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    form.elements[select_name].appendChild(option);
  });
}

/* ---------- filtering and sorting ---------- */

// read whatever the student has picked in the filter form
function get_filters() {
  return {
    search: form.elements['search'].value.trim().toLowerCase(),
    specialty: form.elements['specialty'].value,
    language: form.elements['language'].value,
    format: form.elements['format'].value,
    day: form.elements['day'].value,
    rating: Number(form.elements['rating'].value),
    accepting: form.elements['accepting'].checked,
    sort: form.elements['sort'].value
  };
}

// true if this therapist passes every filter
function matches(t, f) {
  if (f.search) {
    var text = (t.name + ' ' + t.title + ' ' + t.specialties.join(' ')).toLowerCase();
    if (text.indexOf(f.search) === -1) return false;
  }
  if (f.specialty !== 'all' && t.specialties.indexOf(f.specialty) === -1) return false;
  if (f.language !== 'all' && t.languages.indexOf(f.language) === -1) return false;
  if (f.format !== 'all' && t.formats.indexOf(f.format) === -1) return false;
  if (f.day !== 'all' && !t.availability[f.day]) return false;
  if (t.rating < f.rating) return false;
  if (f.accepting && !t.accepting) return false;
  return true;
}

// order the list the way the student asked
function sort_list(list, sort) {
  list.sort(function (a, b) {
    if (sort === 'experience') return b.years - a.years;
    if (sort === 'name') return a.name.localeCompare(b.name);
    return b.rating - a.rating || b.reviews - a.reviews;
  });
  return list;
}

/* ---------- drawing the therapist cards ---------- */

// "Dr. Amara Okafor" turns into "AO"
function initials(name) {
  var parts = name.replace('Dr. ', '').split(' ');
  return parts[0].charAt(0) + parts[parts.length - 1].charAt(0);
}

// builds the html for one card
function card_html(t) {
  var tags = t.specialties.map(function (s) { return '<li>' + s + '</li>'; }).join('');
  var days = DAY_ORDER.filter(function (d) { return t.availability[d]; }).join(', ');
  var formats = t.formats.map(function (f) { return FORMAT_LABELS[f]; }).join(' or ');

  // therapists with a full caseload get a note instead of a booking button
  var action = t.accepting
    ? '<button class="primary-btn" type="button" data-book="' + t.id + '">Book a session</button>'
    : '<span class="muted">Not taking new students right now</span>';

  return `
    <article class="therapist">
      <div class="avatar" aria-hidden="true">${initials(t.name)}</div>
      <div>
        <h3>${t.name} <span class="creds">${t.credentials}</span></h3>
        <p class="details">${t.title}, ${t.years} years of experience</p>
        <p><span class="rating">${t.rating.toFixed(1)} out of 5</span>
           <span class="muted">from ${t.reviews} reviews</span></p>
        <ul class="tags">${tags}</ul>
        <p class="details">Speaks ${t.languages.join(', ')}</p>
        <p class="details">Offers ${formats}</p>
        <p class="details">Open on ${days}</p>
        <div class="action">${action}</div>
      </div>
    </article>`;
}

// applies the filters and redraws the list
function render_results() {
  var f = get_filters();
  var list = sort_list(therapists.filter(function (t) { return matches(t, f); }), f.sort);

  results.innerHTML = list.map(card_html).join('');
  result_count.textContent = 'Showing ' + list.length + ' of ' + therapists.length + ' therapists';
  empty_state.hidden = list.length !== 0;
}

/* ---------- saved appointments (localStorage) ---------- */

// read the saved list, and quietly drop anything already in the past
function load_appointments() {
  var list = [];
  try {
    list = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (e) {
    list = [];
  }
  var now = Date.now();
  return list.filter(function (a) { return a.sortValue > now; });
}

function save_appointments(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    // saving failed, the booking just will not be remembered after a reload
  }
}

// draws the "Your appointments" box
function render_appointments() {
  var list = load_appointments().sort(function (a, b) { return a.sortValue - b.sortValue; });

  if (list.length === 0) {
    my_appointments.innerHTML = '<p class="muted">Nothing booked yet. Pick a therapist to get started.</p>';
    return;
  }

  my_appointments.innerHTML = list.map(function (a) {
    return `
      <div class="appt">
        <div>
          <strong>${a.therapist}</strong><br>
          <span class="muted">${a.when}<br>${a.format}</span>
        </div>
        <button class="toggle-btn" type="button" data-cancel="${a.key}">Cancel</button>
      </div>`;
  }).join('');
}

/* ---------- date helpers for the booking popup ---------- */

function pad(n) {
  return n < 10 ? '0' + n : '' + n;
}

// "2026-10-13", handy for building a unique slot key
function iso_date(d) {
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

// "1:30 PM" turns into minutes after midnight so we can sort times
function to_minutes(time) {
  var parts = time.split(/[: ]/);
  var hours = Number(parts[0]) % 12;
  if (parts[2] === 'PM') hours += 12;
  return hours * 60 + Number(parts[1]);
}

// the next few dates (starting tomorrow) that land on a given weekday
function next_dates(day, weeks) {
  var out = [];
  var start = new Date();
  start.setHours(0, 0, 0, 0);

  for (var i = 1; i <= weeks * 7; i++) {
    var d = new Date(start);
    d.setDate(start.getDate() + i);
    if (d.getDay() === DAY_INDEX[day]) out.push(d);
  }
  return out;
}

// turns a therapist's weekly hours into real bookable slots for the next two weeks
function build_slots(t) {
  var slots = [];
  DAY_ORDER.forEach(function (day) {
    if (!t.availability[day]) return;
    next_dates(day, 2).forEach(function (date) {
      t.availability[day].forEach(function (time) {
        slots.push({
          key: t.id + '|' + iso_date(date) + '|' + time,
          date: date,
          time: time,
          minutes: to_minutes(time)
        });
      });
    });
  });
  slots.sort(function (a, b) { return a.date - b.date || a.minutes - b.minutes; });
  return slots;
}

/* ---------- the booking popup ---------- */

function open_booking(id) {
  var t = therapists.filter(function (item) { return item.id === id; })[0];
  if (!t) return;
  current_therapist = t;

  // slots that are already booked get disabled so nobody double books
  var taken = load_appointments().map(function (a) { return a.key; });
  var date_format = { weekday: 'long', month: 'long', day: 'numeric' };

  dialog_title.textContent = 'Book a session with ' + t.name;
  dialog_error.textContent = '';

  // group the slot chips under a heading for each date
  var html = '';
  var last_date = '';
  build_slots(t).forEach(function (s) {
    var label = s.date.toLocaleDateString('en-US', date_format);
    if (label !== last_date) {
      if (last_date !== '') html += '</div>';
      html += '<p class="slot-date">' + label + '</p><div class="slots">';
      last_date = label;
    }
    html += '<label class="slot"><input type="radio" name="slot" value="' + s.key + '"' +
            ' data-when="' + label + ' at ' + s.time + '"' +
            ' data-sort="' + (s.date.getTime() + s.minutes * 60000) + '"' +
            (taken.indexOf(s.key) !== -1 ? ' disabled' : '') + '>' +
            '<span>' + s.time + '</span></label>';
  });
  dialog_slots.innerHTML = html + '</div>';

  // only offer the formats this therapist actually has, first one pre selected
  dialog_formats.innerHTML = t.formats.map(function (f, i) {
    return '<label><input type="radio" name="session_format" value="' + f + '"' +
           (i === 0 ? ' checked' : '') + '><span>' + FORMAT_LABELS[f] + '</span></label>';
  }).join('');

  dialog.showModal();
}

// runs when the student presses "Confirm booking"
booking_form.addEventListener('submit', function (event) {
  event.preventDefault();

  var slot = booking_form.querySelector('input[name="slot"]:checked');
  var format = booking_form.querySelector('input[name="session_format"]:checked');

  // make sure they actually picked a time first
  if (!slot) {
    dialog_error.textContent = 'Please pick a time before confirming.';
    return;
  }

  var list = load_appointments();
  list.push({
    key: slot.value,
    therapist: current_therapist.name,
    when: slot.getAttribute('data-when'),
    format: FORMAT_LABELS[format.value],
    sortValue: Number(slot.getAttribute('data-sort'))
  });
  save_appointments(list);

  dialog.close();
  render_appointments();
  show_toast('Booked with ' + current_therapist.name);
});

// the cancel button just closes the popup
document.querySelector('#dialog_cancel').addEventListener('click', function () {
  dialog.close();
});

/* ---------- small toast message ---------- */

var toast_timer = null;

function show_toast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toast_timer);
  toast_timer = setTimeout(function () {
    toast.classList.remove('show');
  }, 3000);
}

/* ---------- wiring everything together ---------- */

// redraw the list every time any filter changes
form.addEventListener('input', render_results);
form.addEventListener('submit', function (event) { event.preventDefault(); });

// put every filter back to its starting value
reset_btn.addEventListener('click', function () {
  form.reset();
  render_results();
});

// one click listener for all "Book a session" buttons, even ones drawn later
results.addEventListener('click', function (event) {
  var button = event.target.closest('[data-book]');
  if (button) open_booking(button.getAttribute('data-book'));
});

// same trick for the cancel buttons in the appointments box
my_appointments.addEventListener('click', function (event) {
  var button = event.target.closest('[data-cancel]');
  if (!button) return;

  var key = button.getAttribute('data-cancel');
  save_appointments(load_appointments().filter(function (a) { return a.key !== key; }));
  render_appointments();
  show_toast('Appointment canceled');
});

// if another tab books or cancels, keep this tab up to date
window.addEventListener('storage', render_appointments);

// first draw when the page opens
fill_select('specialty', 'specialties');
fill_select('language', 'languages');
render_results();
render_appointments();
