const C = window.CONFIG;
const $ = id => document.getElementById(id);
const sb = supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Countdown
(function () {
  const t = new Date(C.EVENT_START), e = new Date(C.EVENT_END), now = new Date();
  const d = Math.ceil((t - now) / 864e5);
  $('count').textContent = now > e ? 'This event has ended. Thank you for joining.' :
    now >= t ? 'Happening today.' : d === 1 ? 'Tomorrow.' : d + ' days to go.';
})();

// Timeline: 9 am to 2 pm (starts at 9 am, finishes at 2 pm)
const timeSlots = [
  '9:00 am - 10:00 am',
  '10:00 am - 11:00 am',
  '11:00 am - 12:00 pm',
  '12:00 pm - 1:00 pm',
  '1:00 pm - 2:00 pm'
];
$('tl').innerHTML = timeSlots.map((h, i) => `<div class="hr" style="grid-column:${i + 1};grid-row:1">${h}</div>`).join('') +
  C.EVENTS.map((ev, i) => `<button type="button" class="bar ${ev.id === 'ctf' ? 'flag' : ''}" data-ev="${ev.id}"
    style="grid-column:${ev.from - 8}/${ev.to - 8};grid-row:${i + 2}"><b>${esc(ev.name)}</b><span>${esc(ev.time)}</span></button>`).join('');

// Event overview cards
$('cards').innerHTML = C.EVENTS.map(ev => `<article class="ev">
  <h3>${esc(ev.name)}</h3>
  <p>${esc(ev.time)}</p>
  <p>${esc(ev.desc)}</p>
  <p class="who">${esc(ev.audience)}</p>
</article>`).join('');

// QR Lightbox modal helper
window.showQr = function (src) {
  $('modalQrImg').src = src;
  $('qrModal').classList.remove('hidden');
};

// Form Setup
$('department').innerHTML += C.DEPARTMENTS.map(d => `<option>${esc(d.name)}</option>`).join('');
$('problem_statement').innerHTML = C.PROBLEM_STATEMENTS.map(p => `<option>${esc(p)}</option>`).join('');
$('eventOpts').innerHTML = C.EVENTS.map(ev => `<label class="opt" id="o-${ev.id}"><input type="radio" name="event" value="${ev.id}">
  <span><b>${esc(ev.name)}</b> <small>${esc(ev.time)} | ${esc(ev.audience)}</small></span></label>`).join('');

function eligible(id, type, dept) {
  if (id === 'ctf') return type === 'student' ? true : 'CTF is for students only.';
  return true;
}

function refresh() {
  const type = $('participant_type').value, dept = $('department').value;
  const student = type === 'student';
  $('regWrap').classList.toggle('hidden', !student);
  $('yearWrap').classList.toggle('hidden', !student);

  C.EVENTS.forEach(ev => {
    const ok = eligible(ev.id, type, dept), el = $('o-' + ev.id), inp = el.querySelector('input');
    el.classList.toggle('off', ok !== true);
    inp.disabled = ok !== true;
    el.title = ok === true ? '' : ok;
    if (ok !== true && inp.checked) inp.checked = false;
  });
  renderTeam();
}

function curEvent() {
  const s = document.querySelector('input[name=event]:checked');
  return s ? C.EVENTS.find(x => x.id === s.value) : null;
}

function teamSize(ev) {
  return ev.team.min === ev.team.max ? ev.team.min : +$('team_size').value;
}

function renderTeam() {
  const ev = curEvent(), box = $('teamBox'), pWrap = $('paymentWrap');
  if (ev) {
    pWrap.classList.remove('hidden');
    $('activeQrImg').src = ev.qr;
  } else {
    pWrap.classList.add('hidden');
  }

  if (!ev || ev.team.max === 1) {
    box.classList.add('hidden');
    return;
  }
  box.classList.remove('hidden');
  const fixed = ev.team.min === ev.team.max, hack = ev.id === 'hackathon';
  $('tsWrap').classList.toggle('hidden', fixed);
  $('psWrap').classList.toggle('hidden', !hack);

  if (!fixed && $('team_size').dataset.ev !== ev.id) {
    $('team_size').innerHTML = Array.from({ length: ev.team.max - ev.team.min + 1 }, (_, i) => `<option value="${ev.team.min + i}">${ev.team.min + i} members</option>`).join('');
    $('team_size').dataset.ev = ev.id;
  }
  const n = teamSize(ev), old = [...document.querySelectorAll('#members input')].map(i => i.value);
  $('memLabel').textContent = `Team members (${n} in total)`;
  let html = `<div><label>Member 1 (team lead)</label><input id="m1" readonly value="${esc($('full_name').value)}"></div>`;
  for (let i = 2; i <= n; i++) {
    html += `<div><label for="m${i}">Member ${i} full name</label><input id="m${i}" class="mem" maxlength="100" autocomplete="off"></div>`;
  }
  $('members').innerHTML = html;
  document.querySelectorAll('#members .mem').forEach((el, k) => { el.value = old[k + 1] || ''; });
}

// Client-Side Canvas Image Compression
let compressedScreenshot = null;
async function compressImage(file) {
  return new Promise((resolve, reject) => {
    if (file.size > 1024 * 1024) {
      return reject(new Error('Image must be under 1 MB.'));
    }
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 800;
        let w = img.width, h = img.height;
        if (w > h && w > maxDim) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else if (h > maxDim) {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
        const cvs = document.createElement('canvas');
        cvs.width = w; cvs.height = h;
        const ctx = cvs.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = cvs.toDataURL('image/jpeg', 0.55);
        resolve({
          dataUrl,
          origKb: Math.round(file.size / 1024),
          compKb: Math.round((dataUrl.length * 3 / 4) / 1024)
        });
      };
      img.onerror = () => reject(new Error('Failed to load image file.'));
      img.src = ev.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}

$('payment_screenshot').addEventListener('change', async e => {
  $('err').textContent = '';
  const file = e.target.files[0];
  if (!file) {
    compressedScreenshot = null;
    $('previewWrap').classList.add('hidden');
    return;
  }
  try {
    const res = await compressImage(file);
    compressedScreenshot = res.dataUrl;
    $('imgPreview').src = res.dataUrl;
    $('previewName').textContent = file.name;
    $('compressionRatio').textContent = `Original: ${res.origKb} KB → Compressed: ${res.compKb} KB`;
    $('previewWrap').classList.remove('hidden');
  } catch (err) {
    compressedScreenshot = null;
    $('previewWrap').classList.add('hidden');
    e.target.value = '';
    $('err').textContent = err.message || 'Error processing image.';
  }
});

// Realtime Input Restrictions
$('phone').addEventListener('input', e => {
  e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
});
$('team_size').addEventListener('change', renderTeam);
$('full_name').addEventListener('input', () => { const m = $('m1'); if (m) m.value = $('full_name').value; });
['participant_type', 'department'].forEach(i => $(i).addEventListener('change', refresh));
$('eventOpts').addEventListener('change', refresh);

document.querySelectorAll('.bar').forEach(b => b.addEventListener('click', () => {
  const r = document.querySelector(`input[value="${b.dataset.ev}"]`);
  if (!r.disabled) { r.checked = true; refresh(); }
  $('register').scrollIntoView({ behavior: 'smooth' });
}));
refresh();

// Form Submit Handler
$('form').addEventListener('submit', async e => {
  e.preventDefault();
  $('err').textContent = '';
  const f = Object.fromEntries(new FormData($('form')));
  const student = f.participant_type === 'student', ev = f.event;
  const fail = m => { $('err').textContent = m; };
  const cfg = C.EVENTS.find(x => x.id === ev);
  const size = cfg ? teamSize(cfg) : 1;
  const isTeam = size > 1;
  const others = isTeam ? [...document.querySelectorAll('#members .mem')].map(i => i.value.trim()) : [];

  // Sanitization
  const clean = s => typeof s === 'string' ? s.trim().replace(/\s+/g, ' ') : '';
  const fullName = clean(f.full_name);
  const email = (f.email || '').trim().toLowerCase();
  const phone = (f.phone || '').replace(/\D/g, '');
  const regNo = student ? (f.reg_no || '').trim().toUpperCase() : null;
  const dept = clean(f.department);
  const teamName = isTeam ? clean(f.team_name) : null;
  const teamMembers = isTeam ? others.map(clean) : [];

  if (!fullName || fullName.length < 2) return fail('Enter your full name.');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail('Enter a valid email address.');
  if (!/^[0-9]{10}$/.test(phone)) return fail('Enter a valid 10-digit mobile number.');
  if (student && !regNo) return fail('Enter your register number.');
  if (!dept) return fail('Choose your department.');
  if (!ev) return fail('Choose the event you want to join.');

  if (isTeam) {
    if (!teamName) return fail('Enter a team name.');
    if (ev === 'hackathon' && !f.problem_statement) return fail('Choose a problem statement.');
    if (teamMembers.length !== size - 1 || teamMembers.some(n => n.length < 2)) {
      return fail(`Enter the full names of all ${size} team members.`);
    }
    const all = [fullName, ...teamMembers].map(n => n.toLowerCase());
    if (new Set(all).size !== all.length) return fail('Each team member name must be different.');
  }

  const ok = eligible(ev, f.participant_type, dept);
  if (ok !== true) return fail(ok);

  if (!compressedScreenshot) return fail('Please upload your payment confirmation screenshot.');

  const id = crypto.randomUUID();
  const row = {
    id,
    full_name: fullName,
    email,
    phone,
    participant_type: f.participant_type,
    reg_no: regNo,
    department: dept,
    year: student ? +f.year : null,
    event: ev,
    team_size: size,
    team_name: teamName,
    team_members: isTeam ? teamMembers.join('\n') : null,
    problem_statement: ev === 'hackathon' ? f.problem_statement : null,
    payment_screenshot: compressedScreenshot
  };

  $('submit').disabled = true;
  $('submit').textContent = 'Registering...';
  const { data, error } = await sb.from('registrations').insert(row);
  $('submit').disabled = false;
  $('submit').textContent = 'Complete registration';

  if (error) {
    console.error('Supabase error details:', error);
    if (error.code === '23505') {
      const msg = error.message || '';
      if (msg.includes('registrations_email_uq') || msg.includes('email')) {
        return fail('This email is already registered. Each person can join one event.');
      }
      if (msg.includes('registrations_phone_uq') || msg.includes('phone')) {
        return fail('This phone number is already registered.');
      }
      if (msg.includes('registrations_reg_no_uq') || msg.includes('reg_no')) {
        return fail('This register number is already registered.');
      }
      if (msg.includes('registrations_team_name_uq') || msg.includes('team_name')) {
        return fail('This team name is already taken. Please choose another team name.');
      }
      if (msg.includes('registrations_payment_screenshot_uq') || msg.includes('payment_screenshot')) {
        return fail('This payment screenshot has already been used. Please upload your own valid payment proof.');
      }
      return fail('You are already registered. Each person can register once.');
    }
    return fail(`Registration failed: ${error.message || 'Check your connection and try again.'}`);
  }

  const evt = C.EVENTS.find(x => x.id === ev);
  $('doneMsg').textContent = `${row.full_name}, you are in for ${evt.name} on 30 November 2026, ${evt.time}.` +
    (row.team_name ? ` Team: ${row.team_name} (${row.team_size} members).` : '');
  $('ref').textContent = id.slice(0, 8).toUpperCase();
  $('form').classList.add('hidden');
  $('done').classList.remove('hidden');
  $('done').focus();
});
