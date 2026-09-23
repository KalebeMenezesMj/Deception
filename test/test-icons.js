'use strict';

// Valida que todos os SVGs das cartas foram gerados e são bem formados.

const fs = require('fs');
const path = require('path');
const { MEANS, CLUES } = require('../lib/cards');

const OUT_DIR = path.join(__dirname, '..', 'public', 'icons');

const results = [];
function check(label, cond) {
  results.push({ label, ok: !!cond });
  console.log((cond ? '  ✓ ' : '  ✗ ') + label);
}

const all = [...CLUES, ...MEANS];

// 1. Todos os arquivos existem
const missing = all.filter((c) => !fs.existsSync(path.join(OUT_DIR, `${c.id}.svg`)));
check('todos os 290 SVGs existem', missing.length === 0);
if (missing.length) console.log('  Faltando:', missing.map((c) => c.id).join(', '));

// 2. Conteúdo bem formado
let bad = 0;
for (const c of all) {
  const p = path.join(OUT_DIR, `${c.id}.svg`);
  if (!fs.existsSync(p)) continue;
  const s = fs.readFileSync(p, 'utf8');
  const ok =
    s.startsWith('<svg') &&
    s.includes('viewBox="0 0 200 280"') &&
    s.includes(`>${c.pt}</text>`) &&
    (s.includes('fill="#e74c3c"') || s.includes('fill="#3a86ff"'));
  if (!ok) bad++;
}
check('SVGs bem formados (moldura + nome + cor)', bad === 0);

// 3. Sem caracteres inválidos no texto (XML escapado)
let escBad = 0;
for (const c of all) {
  const p = path.join(OUT_DIR, `${c.id}.svg`);
  if (!fs.existsSync(p)) continue;
  const s = fs.readFileSync(p, 'utf8');
  if (c.pt.includes('&') && !s.includes('&amp;')) escBad++;
}
check('nomes com & escapados corretamente', escBad === 0);

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} verificações OK`);
process.exit(failed.length ? 1 : 0);