'use strict';

// Socket.IO cliente (servido pelo próprio servidor — sem CDN).
const socket = io();

// ---------------------------------------------------------------------------
// Emojis para as cartas (apenas visual; fallback por tipo)
// ---------------------------------------------------------------------------
const EMOJI_MAP = {
  // armas / meios
  knife: '🔪', knifeandfork: '🍴', dagger: '🗡️', sword: '🗡️', axe: '🪓', cleaver: '🔪',
  machete: '🔪', pistol: '🔫', sniper: '🎯', gunpowder: '🧨', explosives: '💣',
  rope: '🪢', wire: '🧵', metalwire: '🧵', scarf: '🧣', belt: '👖', pillow: '🛏️',
  poison: '☠️', arsenic: '☠️', poisonousgas: '☠️', poisonneedle: '💉', virus: '🦠',
  pesticide: '🧪', mercury: '🧪', chemicals: '🧪', sulfuricacid: '🧪', injection: '💉',
  syringe: '💉', pill: '💊', overdose: '💊', hammer: '🔨', brick: '🧱', stone: '🪨',
  chainsaw: '🪚', drill: '🔩', wrench: '🔧', scissors: '✂️', razorblade: '🪒',
  candlestick: '🕯️', match: '🔥', lighter: '🔥', arson: '🔥', fire: '🔥', smoke: '💨',
  alcohol: '🍺', wine: '🍷', bat: '🏏', dumbbell: '🏋️', foldingchair: '🪑',
  electriccurrent: '⚡', electricbaton: '⚡', radiation: '☢️', maddog: '🐕',
  venomoussnake: '🐍', venomousscorpion: '🦂', drown: '🌊', plasticbag: '🛍️',
  // pistas / evidências
  blood: '🩸', bloodstain: '🩸', fingerprint: '🔍', footmark: '👣', footprint: '👣',
  hair: '💇', dogfur: '🐕', fingernails: '💅', skull: '💀', bone: '🦴', teeth: '🦷',
  cigarettebutt: '🚬', cigaretteash: '🚬', cigar: '🚬', gloves: '🧤', hat: '👒',
  glasses: '👓', sunglasses: '🕶️', shoe: '👟', highheel: '👠', flipflop: '🩴',
  necklace: '📿', ring: '💍', earrings: '💎', diamond: '💎', jewelry: '💎',
  bracelet: '📿', watch: '⌚', phone: '📱', mobilephone: '📱', computer: '💻',
  computermouse: '🖱️', computerdisk: '💾', usbflashdrive: '💽', camera: '📷',
  surveillancecamera: '📹', videocamera: '📹', photograph: '🖼️', oilpainting: '🖼️',
  key: '🔑', lock: '🔒', envelope: '✉️', letter: '💌', newspaper: '📰', magazine: '📓',
  book: '📕', dictionary: '📖', notebook: '📔', diary: '📔', document: '📄',
  documents: '📄', money: '💵', banknote: '💵', coins: '🪙', wallet: '👛',
  lottery: '🎟️', ticket: '🎟️', dice: '🎲', playingcards: '🃏', mahjongtiles: '🀄',
  coffee: '☕', juice: '🧃', softdrink: '🥤', wine: '🍷', cake: '🎂', bread: '🍞',
  apple: '🍎', egg: '🥚', peanut: '🥜', candy: '🍬', snacks: '🍿', soap: '🧼',
  umbrella: '☂️', raincoat: '🧥', mirror: '🪞', comb: '💇', lipstick: '💄',
  perfume: '🧴', rose: '🌹', leaf: '🍃', plant: '🪴', insect: '🐜', ant: '🐜',
  cockroach: '🪳', mosquito: '🦟', spider: '🕷️', rat: '🐀', cat: '🐈',
  knife: '🔪', bullet: '🔫', syringe: '💉', rope: '🪢', poison: '☠️',
};

function emojiFor(kind, en) {
  const key = (en || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (EMOJI_MAP[key]) return EMOJI_MAP[key];
  return kind === 'means' ? '🔪' : '🔍';
}

// Emoji por papel (usado na revelação do papel e no painel).
const ROLE_EMOJI = {
  forensicScientist: '🔬',
  murderer: '🔪',
  accomplice: '🥷',
  witness: '👁️',
  investigator: '🕵️',
  labTechnician: '🧪',
  insideMan: '🎭',
  protectiveDetail: '🛡️',
};

// ---------------------------------------------------------------------------
// Formatação
// ---------------------------------------------------------------------------
function fmtClock(ms) {
  if (ms == null || isNaN(ms)) return '--:--';
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function roomCodeFromUrl() {
  const m = window.location.pathname.match(/\/sala\/([A-Za-z0-9]+)/);
  return m ? m[1].toUpperCase() : '';
}

// ---------------------------------------------------------------------------
// Renderização de cartas
// ---------------------------------------------------------------------------
function cardEl(card, kind, opts = {}) {
  const selected = typeof opts.selected === 'function' ? opts.selected(card) : !!opts.selected;
  const el = document.createElement('div');
  el.className = 'card ' + kind + (opts.small ? ' small' : '') + (opts.selectable ? ' selectable' : '') + (selected ? ' selected' : '');
  // Ícone SVG da carta (com fallback para emoji se o SVG não carregar).
  el.innerHTML =
    `<img class="card-icon" src="/icons/${card.id}.svg" alt="${escapeHtml(card.pt)}" ` +
    `onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />` +
    `<div class="icon icon-fallback">${emojiFor(kind, card.en)}</div>` +
    `<div class="name-pt">${escapeHtml(card.pt)}</div>`;
  if (opts.onClick) el.addEventListener('click', () => opts.onClick(card, el));
  return el;
}

function renderCardsGrid(container, cards, kind, opts = {}) {
  container.innerHTML = '';
  (cards || []).forEach((c) => container.appendChild(cardEl(c, kind, opts)));
}

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ---------------------------------------------------------------------------
// Cronômetro local (espelhando o tempo autoritativo do servidor)
// ---------------------------------------------------------------------------
let _tickerHandle = null;
function stopTicker() {
  if (_tickerHandle) {
    clearInterval(_tickerHandle);
    _tickerHandle = null;
  }
}
function startTicker(endsAt, el) {
  stopTicker();
  if (!endsAt) {
    el.textContent = '--:--';
    el.classList.remove('warn', 'danger');
    return;
  }
  const update = () => {
    const ms = endsAt - Date.now();
    if (ms <= 0) {
      el.textContent = '00:00';
      el.classList.add('danger');
      stopTicker();
      return;
    }
    el.textContent = fmtClock(ms);
    el.classList.toggle('warn', ms < 60000);
    el.classList.toggle('danger', ms < 20000);
  };
  update();
  _tickerHandle = setInterval(update, 250);
}

// ---------------------------------------------------------------------------
// Trocador de telas (helper simples)
// ---------------------------------------------------------------------------
function showScreen(id) {
  document.querySelectorAll('section[id^="screen-"]').forEach((s) => s.classList.add('hidden'));
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
}

// ---------------------------------------------------------------------------
// Board de evidências (balas do Cientista Forense) — público e somente leitura
// ---------------------------------------------------------------------------
function renderEvidenceBoard(container, evidence) {
  container.innerHTML = '';
  if (!evidence || !evidence.bullets || !evidence.bullets.length) {
    container.innerHTML = '<p class="muted">Nenhuma bala posicionada ainda.</p>';
    return;
  }
  evidence.bullets.forEach((b) => {
    const tile = document.createElement('div');
    tile.className = 'tile selected';
    const title = b.title && b.title.pt ? b.title.pt : (b.title && b.title.en);
    tile.innerHTML = `<div class="tile-title">${escapeHtml(title)}</div>`;
    const opts = document.createElement('div');
    opts.className = 'tile-options';
    b.options.forEach((o, i) => {
      const chip = document.createElement('span');
      chip.className = 'chip readonly' + (i === b.selected ? ' selected' : '');
      chip.textContent = o;
      opts.appendChild(chip);
    });
    tile.appendChild(opts);
    container.appendChild(tile);
  });
}

// ---------------------------------------------------------------------------
// Scene tiles (dados estáticos, carregados do servidor sob demanda)
// ---------------------------------------------------------------------------
let _sceneTiles = null;
function loadSceneTiles() {
  if (_sceneTiles) return Promise.resolve(_sceneTiles);
  return fetch('/api/scene-tiles')
    .then((r) => r.json())
    .then((d) => { _sceneTiles = d; return d; });
}
