const BASE = 'https://elms.uiu.ac.bd';
const $ = id => document.getElementById(id);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const setStatus = t => { $('status').textContent = t; };
const get = url => fetch(url, { credentials: 'include' }).then(r => r.text());

// ---------- 1. course list ----------
async function getCourses() {
  const html = await get(`${BASE}/my/courses.php`);
  const m = html.match(/"sesskey":"([^"]+)"/) || html.match(/sesskey=([A-Za-z0-9]+)/);
  if (!m) throw new Error('Could not read session. Log in to eLMS in this browser first.');

  const method = 'core_course_get_enrolled_courses_by_timeline_classification';
  const res = await fetch(`${BASE}/lib/ajax/service.php?sesskey=${m[1]}&info=${method}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify([{
      index: 0, methodname: method,
      args: { offset: 0, limit: 0, classification: 'all', sort: 'fullname', customfieldname: '', customfieldvalue: '' }
    }])
  });
  const j = await res.json();
  if (j[0].error) throw new Error(j[0].exception?.message || 'Course list request failed');
  return j[0].data.courses.map(c => ({ id: String(c.id), name: c.fullname }));
}

function renderCourses(courses) {
  const box = $('courses');
  box.textContent = '';
  courses.forEach(c => {
    const label = document.createElement('label');
    const rb = document.createElement('input');
    rb.type = 'radio';
    rb.name = 'course'; // Ensures only one radio button can be selected at a time
    rb.value = c.id;
    rb.dataset.name = c.name;
    label.append(rb, ' ', c.name);
    box.append(label);
  });
}

// ---------- 2. participants + emails ----------
async function collect(course, includeTeachers) {
  const html = await get(`${BASE}/user/index.php?id=${course.id}&perpage=5000`);
  const doc = new DOMParser().parseFromString(html, 'text/html');

  const people = new Map();
  doc.querySelectorAll('table#participants tbody tr:not(.emptyrow)').forEach(tr => {
    if (!includeTeachers && /teacher|manager/i.test(tr.textContent)) return;
    tr.querySelectorAll('a[href*="/user/view.php?id="]').forEach(a => {
      const u = new URL(a.getAttribute('href'), BASE);
      const id = u.searchParams.get('id');
      const clone = a.cloneNode(true);
      clone.querySelectorAll('.userinitials, .avatar, img').forEach(n => n.remove());
      const name = (clone.textContent.trim() || a.textContent.trim()).replace(/^[A-Z]{2}(?=\d)/, '');
      const prev = people.get(id);
      // avatar link only has initials, so keep the longest text as the name
      if (!prev || name.length > prev.name.length) people.set(id, { name, url: u.href });
    });
  });

  const rows = [];
  let i = 0;
  for (const { name, url } of people.values()) {
    i++;
    setStatus(`${course.name}\nProfile ${i}/${people.size}…`);
    let email = '';
    try {
      const pdoc = new DOMParser().parseFromString(await get(url), 'text/html');
      const main = pdoc.querySelector('#region-main') || pdoc.body;
      const mail = main.querySelector('a[href^="mailto:"]');
      if (mail) {
        // Moodle percent-encodes mailto links to hide them from spam bots
        const raw = mail.getAttribute('href').replace(/^mailto:/i, '').split('?')[0];
        try { email = decodeURIComponent(raw).trim(); } catch (err) { email = raw.trim(); }
      } else {
        email = (main.textContent.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/) || [''])[0];
      }
    } catch (e) {
      email = '';
    }
    rows.push({ name, email, url });
    await sleep(300); // be gentle on the server
  }
  return { total: people.size, rows };
}

// ---------- 3. output ----------
function toCsv(rows) {
  const q = s => `"${String(s).replace(/"/g, '""')}"`;
  return 'name,email,url\n' + rows.map(r => [r.name, r.email, r.url].map(q).join(',')).join('\n');
}

function showResult(course, { total, rows }) {
  const emails = rows.map(r => r.email).filter(Boolean);
  const div = document.createElement('div');
  div.className = 'result';

  const h = document.createElement('h2');
  h.textContent = `${course.name}: ${emails.length} emails from ${total} people`;

  const ta = document.createElement('textarea');
  ta.value = [...new Set(emails)].join('\n');
  ta.readOnly = true;

  const copy = document.createElement('button');
  copy.textContent = 'Copy emails';
  copy.onclick = async () => {
    await navigator.clipboard.writeText(ta.value);
    copy.textContent = 'Copied!';
    setTimeout(() => (copy.textContent = 'Copy emails'), 1500);
  };

  const dl = document.createElement('button');
  dl.className = 'alt';
  dl.textContent = 'Download CSV';
  dl.onclick = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([toCsv(rows)], { type: 'text/csv' }));
    a.download = `emails-course-${course.id}.csv`;
    a.click();
  };

  div.append(h, ta, copy, dl);
  $('results').append(div);
}

// ---------- wiring ----------
$('go').onclick = async () => {
  const selectedRadio = document.querySelector('#courses input[type="radio"]:checked');
  const manual = $('manualId').value.trim();

  let course = null;
  if (selectedRadio) {
    course = { id: selectedRadio.value, name: selectedRadio.dataset.name };
  } else if (manual) {
    course = { id: manual, name: `Course ${manual}` };
  }

  if (!course) return setStatus('Select a course or enter a manual ID.');

  $('go').disabled = true;
  $('results').textContent = '';
  try {
    showResult(course, await collect(course, $('teachers').checked));
    setStatus('Done. Keep addresses in BCC.');
  } catch (e) {
    setStatus('Error: ' + e.message);
  }
  $('go').disabled = false;
};

(async () => {
  try {
    renderCourses(await getCourses());
    setStatus('Select a course. Keep this popup open while it runs.');
  } catch (e) {
    setStatus('Error: ' + e.message);
  }
  $('go').disabled = false;
})();
