'use strict';

const byId = id => document.getElementById(id);
const make = (tag, className, text) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
};
let undangan;
let siapDibuka = false;
let sudahDibuka = false;
let timerToast;
let audioContext;
let musicMaster;
let musicMode = 'file';
let synthBeatTimer;
let synthBeatIndex = 0;
let synthPlaying = false;
const synthNotes = new Set();
const chordProgression = [
  [130.81, 164.81, 196, 246.94],
  [110, 130.81, 164.81, 196],
  [87.31, 130.81, 174.61, 220],
  [98, 146.83, 196, 220]
];
const melodyProgression = [
  [392, 493.88, 587.33, 493.88],
  [392, 440, 523.25, 659.25],
  [440, 523.25, 587.33, 523.25],
  [392, 493.88, 587.33, 493.88]
];

function tampilkanToast(pesan) {
  const toast = byId('toast');
  toast.textContent = pesan;
  toast.classList.add('show');
  window.clearTimeout(timerToast);
  timerToast = window.setTimeout(() => toast.classList.remove('show'), 2600);
}

function isi(id, teks) {
  byId(id).textContent = teks || '';
}

function aturLatar(selector, sumber) {
  const section = document.querySelector(selector);
  if (section && sumber) section.style.setProperty('--scene-image', `url("${sumber}")`);
}

function buatField(labelText, control) {
  const label = make('label', 'field', labelText);
  label.append(control);
  return label;
}

// Modul data: seluruh konten halaman dibaca dari satu berkas JSON klien.
function renderData(data) {
  undangan = data;
  const namaPasangan = `${data.mempelai.panggilanWanita} & ${data.mempelai.panggilanPria}`;
  document.title = `Undangan ${namaPasangan}`;

  isi('coverEyebrow', data.teks.theWeddingOf);
  isi('coverBride', data.mempelai.panggilanWanita);
  isi('coverGroom', data.mempelai.panggilanPria);
  isi('coverDate', data.tanggal.teks);
  isi('guestLabel', data.teks.kepada);
  isi('guestName', new URLSearchParams(window.location.search).get('to')?.trim() || data.teks.tamuDefault);
  isi('openLabel', data.teks.buka);
  isi('openingEyebrow', data.teks.theWeddingOf);
  isi('openingBride', data.mempelai.panggilanWanita);
  isi('openingGroom', data.mempelai.panggilanPria);
  isi('openingSkipLabel', data.teks.lewatiIntro);
  byId('cover').style.backgroundImage = data.foto.cover ? `url("${data.foto.cover}")` : '';
  byId('ambient').style.backgroundImage = data.foto.cover ? `url("${data.foto.cover}")` : '';
  if (data.foto.cover) byId('openingSplash').style.setProperty('--opening-image', `url("${data.foto.cover}")`);

  isi('introEyebrow', data.teks.theWeddingOf);
  isi('introNames', namaPasangan);
  isi('introDay', data.tanggal.angka.hari);
  isi('introMonth', data.tanggal.angka.bulan);
  isi('introYear', data.tanggal.angka.tahun);
  isi('introDate', data.tanggal.teks);
  isi('verseReference', data.ayat.referensi);
  isi('verseText', data.ayat.teks);
  const introMessage = make('p', 'intro-invitation', data.teks.pembuka);
  byId('introDate').after(introMessage);

  isi('brideRole', data.teks.theBride);
  isi('brideName', data.mempelai.wanita);
  isi('brideParentLabel', data.teks.putriDari);
  isi('brideParents', data.orangTua.wanita.join(' & '));
  isi('groomRole', data.teks.theGroom);
  isi('groomName', data.mempelai.pria);
  isi('groomParentLabel', data.teks.putraDari);
  isi('groomParents', data.orangTua.pria.join(' & '));

  isi('countdownScript', data.teks.hitungMundur);
  isi('saveTitle', data.teks.saveTheDate);
  isi('daysLabel', data.teks.hari);
  isi('hoursLabel', data.teks.jam);
  isi('minutesLabel', data.teks.menit);
  isi('secondsLabel', data.teks.detik);
  isi('saveDate', `${data.tanggal.angka.hari} / ${data.tanggal.angka.bulan} / ${data.tanggal.angka.tahun}`);
  isi('saveQuote', data.kutipanTanggal);
  isi('saveSource', data.sumberKutipanTanggal);

  isi('storyTitle', data.teks.ceritaCinta);
  isi('storyQuote', data.kutipanCerita);
  isi('storySource', data.sumberKutipanCerita);
  const storyPhotos = byId('storyPhotos');
  data.galeri.slice(0, 3).forEach(photo => {
    const image = make('img');
    image.src = photo.src;
    image.alt = photo.alt;
    image.loading = 'lazy';
    image.decoding = 'async';
    image.addEventListener('error', () => image.remove(), { once: true });
    storyPhotos.append(image);
  });
  const storyCopy = byId('storyCopy');
  data.ceritaCinta.forEach(paragraph => storyCopy.append(make('p', '', paragraph)));

  isi('eventScript', data.teks.acara);
  isi('eventTitle', data.teks.detail);
  renderAcara(data);
  isi('calendarLabel', data.teks.simpanKalender);
  byId('calendarLink').href = buatLinkKalender(data);

  isi('galleryScript', data.teks.kenanganScript);
  isi('galleryTitle', data.teks.lembaranKenangan);
  isi('galleryHint', data.teks.scrollReadMore);
  renderGaleri(data.galeri);

  isi('rsvpScript', data.teks.rsvpScript);
  isi('rsvpTitle', data.teks.rsvpTitle);
  renderForm(data.teks);

  isi('envelopeEyebrow', data.teks.amplopEyebrow);
  isi('envelopeTitle', data.teks.amplop);
  isi('envelopeNote', data.teks.amplopNote);
  renderRekening(data.rekening, data.teks);

  isi('closingEyebrow', data.teks.penutupEyebrow);
  isi('thanksScript', data.teks.terimaKasih);
  isi('closingMessage', data.teks.pesanPenutup);
  isi('closingNames', namaPasangan);
  isi('shareLabel', data.teks.bagikanWhatsApp);
  const cleanUrl = `${window.location.origin}${window.location.pathname}`;
  byId('shareLink').href = `https://wa.me/?text=${encodeURIComponent(`${data.teks.bagikanWhatsApp}: ${cleanUrl}`)}`;

  aturLatar('#pembuka', data.foto.pembuka);
  aturLatar('#mempelai-wanita', data.foto.wanita);
  aturLatar('#mempelai-pria', data.foto.pria);
  aturLatar('#save-the-date', data.foto.tanggal);
  aturLatar('#cerita-cinta', data.foto.cerita);
  aturLatar('#detail-acara', data.foto.acara);
  aturLatar('#lembaran-kenangan', data.foto.galeri);
  aturLatar('#rsvp-section', data.foto.rsvp);
  aturLatar('#amplop-digital', data.foto.amplop);
  aturLatar('#penutup', data.foto.penutup);

  renderMenu(data.teks);
  siapkanMusik(data.musik, data.teks.musik);
  mulaiAnimasiMasuk();
  siapDibuka = true;
  mulaiOpening();
}

// Modul detail acara: setiap tombol lokasi menggunakan tautan peta dari data klien.
function renderAcara(data) {
  const timeline = byId('eventTimeline');
  data.acara.forEach(acara => {
    const item = make('article', 'event-item');
    item.append(make('span', 'event-heart', '♡'));
    item.append(make('h3', '', acara.judul));
    item.append(make('p', 'event-date', acara.tanggal));
    item.append(make('p', '', acara.jam));
    item.append(make('p', 'event-location', data.teks.lokasiKeterangan));
    item.append(make('p', '', acara.alamat || data.lokasi.alamat));
    const mapLink = make('a', 'button', data.teks.lihatLokasi);
    mapLink.href = data.lokasi.maps;
    mapLink.target = '_blank';
    mapLink.rel = 'noopener noreferrer';
    item.append(mapLink);
    timeline.append(item);
  });
}

function buatLinkKalender(data) {
  const mulai = new Date(data.tanggal.iso);
  const selesai = new Date(mulai.getTime() + 5 * 60 * 60 * 1000);
  const formatTanggal = date => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Pernikahan ${data.mempelai.panggilanWanita} & ${data.mempelai.panggilanPria}`,
    dates: `${formatTanggal(mulai)}/${formatTanggal(selesai)}`,
    details: data.teks.pembuka,
    location: `${data.lokasi.nama}, ${data.lokasi.alamat}`
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// Modul galeri: foto dibuat sebagai elemen, sehingga nama file dan alt tetap aman.
function renderGaleri(foto) {
  const strip = byId('galleryStrip');
  foto.forEach(item => {
    const button = make('button', 'gallery-photo');
    const image = make('img');
    image.src = item.src;
    image.alt = item.alt;
    image.loading = 'lazy';
    image.decoding = 'async';
    button.type = 'button';
    button.setAttribute('aria-label', item.alt);
    button.append(image);
    button.addEventListener('click', () => bukaLightbox(item));
    image.addEventListener('error', () => button.remove(), { once: true });
    strip.append(button);
  });
}

function renderForm(teks) {
  const form = byId('rsvpForm');
  form.className = 'rsvp-form';

  const name = make('input');
  name.type = 'text';
  name.name = 'nama';
  name.autocomplete = 'name';
  name.maxLength = 80;
  name.required = true;
  name.placeholder = teks.namaPlaceholder;
  form.append(buatField(teks.nama, name));

  const attendance = make('select');
  attendance.name = 'kehadiran';
  attendance.required = true;
  [teks.hadir, teks.tidakHadir].forEach((label, index) => {
    const option = make('option', '', label);
    option.value = index === 0 ? 'Hadir' : 'Tidak hadir';
    attendance.append(option);
  });
  form.append(buatField(teks.kehadiran, attendance));

  const guests = make('select');
  guests.name = 'jumlah';
  for (let count = 1; count <= 5; count += 1) {
    const option = make('option', '', String(count));
    option.value = String(count);
    guests.append(option);
  }
  form.append(buatField(teks.jumlahTamu, guests));

  const message = make('textarea');
  message.name = 'ucapan';
  message.rows = 3;
  message.maxLength = 500;
  message.placeholder = teks.ucapanPlaceholder;
  form.append(buatField(teks.ucapan, message));

  const submit = make('button', 'button', teks.kirim);
  submit.type = 'submit';
  form.append(submit);
  form.addEventListener('submit', kirimUcapan);
}

// Modul RSVP: WhatsApp menyiapkan pesan, lalu tamu menekan Kirim di aplikasinya.
function kirimUcapan(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const nama = String(formData.get('nama') || '').trim();
  if (!nama) {
    isi('formStatus', undangan.teks.formError);
    event.currentTarget.elements.nama.focus();
    return;
  }
  const nomor = String(undangan.whatsappPemilik || '').replace(/\D/g, '');
  if (!nomor) {
    isi('formStatus', undangan.teks.whatsappNomorError);
    return;
  }
  const pesan = [
    `${undangan.teks.rsvpTitle} - ${undangan.mempelai.panggilanWanita} & ${undangan.mempelai.panggilanPria}`,
    `${undangan.teks.nama}: ${nama}`,
    `${undangan.teks.kehadiran}: ${formData.get('kehadiran')}`,
    `${undangan.teks.jumlahTamu}: ${formData.get('jumlah')}`,
    `${undangan.teks.ucapan}: ${String(formData.get('ucapan') || '').trim() || '-'}`
  ].join('\n');
  const link = make('a', 'button', undangan.teks.whatsappLanjut);
  link.href = `https://wa.me/${nomor}?text=${encodeURIComponent(pesan)}`;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  const status = byId('formStatus');
  status.replaceChildren(document.createTextNode(`${undangan.teks.whatsappStatus} `), link);
  window.open(link.href, '_blank', 'noopener,noreferrer');
}

function renderRekening(rekening, teks) {
  const container = byId('accountCard');
  rekening.forEach(item => {
    const account = make('div', 'account-entry');
    account.append(make('p', 'account-bank', item.bank));
    account.append(make('p', 'account-name', `a.n. ${item.nama}`));
    account.append(make('p', 'account-number', item.nomor));
    const copyButton = make('button', 'button', teks.salinNomor);
    copyButton.type = 'button';
    copyButton.addEventListener('click', () => salinNomor(item.nomor, teks));
    account.append(copyButton);
    container.append(account);
  });
}

async function salinNomor(nomor, teks) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(nomor);
    } else {
      const temp = make('textarea');
      temp.value = nomor;
      temp.setAttribute('readonly', '');
      temp.style.position = 'fixed';
      temp.style.opacity = '0';
      document.body.append(temp);
      temp.select();
      const tersalin = document.execCommand('copy');
      temp.remove();
      if (!tersalin) throw new Error('Clipboard tidak tersedia');
    }
    tampilkanToast(teks.rekeningTersalin);
  } catch (error) {
    tampilkanToast(`${teks.salinGagal}${nomor}`);
  }
}

// Modul countdown: menghitung waktu menuju akad sesuai zona waktu dalam data.
function mulaiCountdown(tanggalISO) {
  const target = new Date(tanggalISO).getTime();
  const tick = () => {
    const sisa = Math.max(0, target - Date.now());
    isi('days', String(Math.floor(sisa / 86400000)).padStart(2, '0'));
    isi('hours', String(Math.floor((sisa % 86400000) / 3600000)).padStart(2, '0'));
    isi('minutes', String(Math.floor((sisa % 3600000) / 60000)).padStart(2, '0'));
    isi('seconds', String(Math.floor((sisa % 60000) / 1000)).padStart(2, '0'));
  };
  tick();
  window.setInterval(tick, 1000);
}

let timerOpening;
function mulaiOpening() {
  const opening = byId('openingSplash');
  opening.setAttribute('aria-hidden', 'false');
  opening.classList.add('is-visible');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  timerOpening = window.setTimeout(tutupOpening, reducedMotion ? 500 : 2400);
}

function tutupOpening() {
  window.clearTimeout(timerOpening);
  const opening = byId('openingSplash');
  opening.classList.remove('is-visible');
  opening.classList.add('is-leaving');
  opening.setAttribute('aria-hidden', 'true');
}

byId('openingSkip').addEventListener('click', tutupOpening);

// Modul cover: membuka undangan hanya sekali dan memulai audio setelah tindakan tamu.
function bukaUndangan() {
  if (!siapDibuka || sudahDibuka) return;
  sudahDibuka = true;
  tutupOpening();
  byId('cover').classList.add('open');
  document.body.classList.remove('locked');
  byId('floatingControls').hidden = false;
  window.scrollTo({ top: 0, behavior: 'instant' });
  mulaiMusik();
}

byId('openButton').addEventListener('click', bukaUndangan);
window.addEventListener('wheel', event => {
  if (event.deltaY > 0 && !sudahDibuka) {
    event.preventDefault();
    bukaUndangan();
  }
}, { passive: false });
let posisiSentuh = null;
window.addEventListener('touchstart', event => {
  posisiSentuh = event.touches[0]?.clientY ?? null;
}, { passive: true });
window.addEventListener('touchend', event => {
  const akhir = event.changedTouches[0]?.clientY;
  if (posisiSentuh !== null && akhir !== undefined && posisiSentuh - akhir > 25 && !sudahDibuka) bukaUndangan();
  posisiSentuh = null;
}, { passive: true });
window.addEventListener('keydown', event => {
  if (!sudahDibuka && ['ArrowDown', 'PageDown', ' '].includes(event.key) && !event.target.matches('button, a, input, textarea, select')) {
    event.preventDefault();
    bukaUndangan();
  }
});

// Modul menu: panel dapat ditutup lewat tombol, tautan, atau Escape.
function renderMenu(teks) {
  const links = [
    ['pembuka', teks.menuPembuka], ['mempelai-wanita', undangan.mempelai.panggilanWanita],
    ['mempelai-pria', undangan.mempelai.panggilanPria], ['save-the-date', teks.saveTheDate],
    ['cerita-cinta', teks.ceritaCinta], ['detail-acara', teks.menuDetailAcara],
    ['lembaran-kenangan', teks.lembaranKenangan], ['rsvp-section', teks.rsvpTitle],
    ['amplop-digital', teks.amplop], ['penutup', teks.terimaKasih]
  ];
  isi('menuLabel', teks.menu);
  isi('menuEyebrow', teks.navigasi);
  isi('menuCloseLabel', teks.tutup);
  links.forEach(([target, label]) => {
    const link = make('a', '', label);
    link.href = `#${target}`;
    link.addEventListener('click', tutupMenu);
    byId('menuLinks').append(link);
  });
  byId('menuOpen').addEventListener('click', bukaMenu);
  byId('menuClose').addEventListener('click', tutupMenu);
}

function bukaMenu() {
  const panel = byId('menuPanel');
  panel.inert = false;
  panel.setAttribute('aria-hidden', 'false');
  panel.classList.add('open');
  byId('menuClose').focus();
}

function tutupMenu() {
  const panel = byId('menuPanel');
  panel.classList.remove('open');
  panel.setAttribute('aria-hidden', 'true');
  panel.inert = true;
  byId('menuOpen').focus();
}

// Modul musik: berkas opsional, dan browser baru diminta memutar setelah cover dibuka.
function siapkanMusik(sumber, label) {
  if (!sumber) return;
  musicMode = sumber === 'instrumental' ? 'instrumental' : 'file';
  isi('musicLabel', label);
  byId('musicToggle').addEventListener('click', toggleMusik);

  if (musicMode === 'instrumental') {
    if (!window.AudioContext && !window.webkitAudioContext) return;
    byId('musicToggle').hidden = false;
    return;
  }

  const audio = byId('weddingMusic');
  audio.src = sumber;
  audio.addEventListener('error', () => { byId('musicToggle').hidden = true; }, { once: true });
  fetch(sumber, { method: 'HEAD' }).then(response => {
    if (!response.ok) return;
    byId('musicToggle').hidden = false;
  }).catch(() => { byId('musicToggle').hidden = true; });
}

function mulaiMusik() {
  if (musicMode === 'instrumental') {
    void mulaiInstrumental();
    return;
  }
  const audio = byId('weddingMusic');
  if (!audio.src || byId('musicToggle').hidden) return;
  audio.play().then(() => byId('musicToggle').classList.add('playing')).catch(() => {});
}

function toggleMusik() {
  if (musicMode === 'instrumental') {
    if (synthPlaying) jedaInstrumental();
    else void mulaiInstrumental();
    return;
  }
  const audio = byId('weddingMusic');
  if (audio.paused) {
    audio.play().then(() => byId('musicToggle').classList.add('playing')).catch(() => {});
  } else {
    audio.pause();
    byId('musicToggle').classList.remove('playing');
  }
}

async function mulaiInstrumental() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  if (!audioContext) {
    audioContext = new AudioContextClass();
    musicMaster = audioContext.createGain();
    musicMaster.gain.value = 0;
    musicMaster.connect(audioContext.destination);
  }
  try {
    await audioContext.resume();
  } catch (error) {
    return;
  }
  synthPlaying = true;
  synthBeatIndex = 0;
  const now = audioContext.currentTime;
  musicMaster.gain.cancelScheduledValues(now);
  musicMaster.gain.setTargetAtTime(0.28, now, 0.12);
  byId('musicToggle').classList.add('playing');
  mainkanBeatInstrumental();
  synthBeatTimer = window.setInterval(mainkanBeatInstrumental, (60 / 72) * 1000);
}

function mainkanBeatInstrumental() {
  if (!synthPlaying || !audioContext || !musicMaster) return;
  const beat = 60 / 72;
  const bar = Math.floor(synthBeatIndex / 4) % chordProgression.length;
  const beatInBar = synthBeatIndex % 4;
  const startsAt = audioContext.currentTime + 0.025;
  if (beatInBar === 0) {
    chordProgression[bar].forEach(frequency => buatNadaInstrumental(frequency, startsAt, beat * 3.75, 0.035, 'sine'));
  }
  buatNadaInstrumental(melodyProgression[bar][beatInBar], startsAt, beat * 0.78, 0.075, 'triangle');
  synthBeatIndex = (synthBeatIndex + 1) % 16;
}

function buatNadaInstrumental(frequency, startsAt, duration, volume, waveform) {
  const oscillator = audioContext.createOscillator();
  const envelope = audioContext.createGain();
  oscillator.type = waveform;
  oscillator.frequency.setValueAtTime(frequency, startsAt);
  envelope.gain.setValueAtTime(0.0001, startsAt);
  envelope.gain.exponentialRampToValueAtTime(volume, startsAt + 0.06);
  envelope.gain.exponentialRampToValueAtTime(0.0001, startsAt + duration);
  oscillator.connect(envelope);
  envelope.connect(musicMaster);
  oscillator.onended = () => {
    synthNotes.delete(oscillator);
    oscillator.disconnect();
    envelope.disconnect();
  };
  synthNotes.add(oscillator);
  oscillator.start(startsAt);
  oscillator.stop(startsAt + duration + 0.02);
}

function jedaInstrumental() {
  synthPlaying = false;
  window.clearInterval(synthBeatTimer);
  const now = audioContext.currentTime;
  musicMaster.gain.cancelScheduledValues(now);
  musicMaster.gain.setTargetAtTime(0.0001, now, 0.035);
  synthNotes.forEach(note => {
    try { note.stop(now + 0.12); } catch (error) {}
  });
  byId('musicToggle').classList.remove('playing');
}

function bukaLightbox(foto) {
  const lightbox = byId('lightbox');
  const image = byId('lightboxImage');
  image.src = foto.src;
  image.alt = foto.alt;
  isi('lightboxCloseLabel', undangan.teks.lightboxTutup);
  lightbox.inert = false;
  lightbox.setAttribute('aria-hidden', 'false');
  lightbox.classList.add('open');
  byId('lightboxClose').focus();
}

function tutupLightbox() {
  const lightbox = byId('lightbox');
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden', 'true');
  lightbox.inert = true;
  byId('lightboxImage').removeAttribute('src');
}

byId('lightboxClose').addEventListener('click', tutupLightbox);
byId('lightbox').addEventListener('click', event => {
  if (event.target === byId('lightbox')) tutupLightbox();
});
window.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  if (byId('lightbox').classList.contains('open')) tutupLightbox();
  if (byId('menuPanel').classList.contains('open')) tutupMenu();
});

function mulaiAnimasiMasuk() {
  const elemen = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    elemen.forEach(item => item.classList.add('is-visible'));
    return;
  }
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      currentObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12 });
  elemen.forEach(item => observer.observe(item));
}

fetch('data.json').then(response => {
  if (!response.ok) throw new Error('Berkas data tidak ditemukan');
  return response.json();
}).then(data => {
  renderData(data);
  mulaiCountdown(data.tanggal.iso);
}).catch(() => {
  const error = byId('loadError');
  error.textContent = 'Data undangan tidak dapat dimuat. Jalankan lewat Live Server.';
  error.hidden = false;
});
