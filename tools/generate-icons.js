'use strict';

/**
 * Gerador de ícones SVG das cartas.
 *
 * Para cada carta (pista ou arma), produz um arquivo SVG em public/icons/
 * com: moldura da carta (vermelha para pistas, azul para armas), o desenho
 * do item no centro e o nome em português.
 *
 * Uso:  node tools/generate-icons.js
 */

const fs = require('fs');
const path = require('path');
const { MEANS, CLUES } = require('../lib/cards');

const ICON_DIR = path.join(__dirname, '..', 'lib', 'icons');
const OUT_DIR = path.join(__dirname, '..', 'public', 'icons');

// ---------------------------------------------------------------------------
// Carregar definições de ícones (lib/icons/chunk-*.js)
// ---------------------------------------------------------------------------
function loadIcons() {
  const icons = {};
  if (!fs.existsSync(ICON_DIR)) return icons;
  const files = fs.readdirSync(ICON_DIR).filter((f) => f.endsWith('.js'));
  for (const f of files) {
    Object.assign(icons, require(path.join(ICON_DIR, f)));
  }
  return icons;
}

// ---------------------------------------------------------------------------
// Escapar texto para XML
// ---------------------------------------------------------------------------
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ---------------------------------------------------------------------------
// Moldura da carta
// ---------------------------------------------------------------------------
function cardSvg(card, kind, icon) {
  const color = kind === 'clue' ? '#e74c3c' : '#3a86ff';
  const colorDark = kind === 'clue' ? '#c0392b' : '#2f6fe0';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 280">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="1" stop-color="#e8ecf2"/>
    </linearGradient>
  </defs>
  <rect x="8" y="8" width="184" height="264" rx="16" fill="url(#bg)" stroke="#2a3140" stroke-width="3"/>
  <path d="M24 8 H176 Q192 8 192 24 V46 H8 V24 Q8 8 24 8 Z" fill="${color}"/>
  <rect x="8" y="46" width="184" height="6" fill="${colorDark}"/>
  <rect x="14" y="58" width="172" height="180" rx="10" fill="none" stroke="#c8cfdb" stroke-width="1.5" stroke-dasharray="5 4"/>
  <g transform="translate(100,130) scale(1.5)">
    <g transform="translate(-50,-50)">${icon}</g>
  </g>
  <text x="100" y="254" text-anchor="middle" font-family="'Segoe UI', system-ui, sans-serif" font-size="15" font-weight="700" fill="#1a1f2b">${esc(card.pt)}</text>
</svg>
`;
}

// ---------------------------------------------------------------------------
// Gerar todos os SVGs
// ---------------------------------------------------------------------------
function main() {
  const icons = loadIcons();
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  let written = 0;
  let missing = [];

  for (const card of CLUES) {
    const icon = icons[card.id];
    if (!icon) { missing.push(card.id); continue; }
    fs.writeFileSync(path.join(OUT_DIR, `${card.id}.svg`), cardSvg(card, 'clue', icon));
    written++;
  }
  for (const card of MEANS) {
    const icon = icons[card.id];
    if (!icon) { missing.push(card.id); continue; }
    fs.writeFileSync(path.join(OUT_DIR, `${card.id}.svg`), cardSvg(card, 'means', icon));
    written++;
  }

  console.log(`Gerados: ${written} SVGs`);
  if (missing.length) {
    console.log(`Sem ícone (${missing.length}): ${missing.join(', ')}`);
    process.exit(1);
  }
}

main();