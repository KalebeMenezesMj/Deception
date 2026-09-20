'use strict';

// Testa os 3 caminhos de vitória dos assassinos:
//   A) todas as acusações erram (badges esgotados)
//   B) assassino identifica a testemunha no contra-ataque
//   C) crime não resolvido após 3 rodadas

const { io } = require('socket.io-client');

const URL = 'http://localhost:3000';
const NAMES = ['A', 'B', 'C', 'D', 'E', 'F'];

function connect() {
  return new Promise((resolve) => {
    const s = io(URL, { transports: ['websocket'], forceNew: true });
    s.on('connect', () => resolve(s));
  });
}
const latest = new Map();
function track(sock) { sock.on('state', (s) => latest.set(sock, s)); }
function stateOf(sock) { return latest.get(sock) || null; }
function waitFor(fn, timeout = 6000) {
  return new Promise((resolve) => {
    const start = Date.now();
    const t = setInterval(() => {
      if (fn()) { clearInterval(t); resolve(true); }
      else if (Date.now() - start > timeout) { clearInterval(t); resolve(false); }
    }, 15);
  });
}
function emitAck(sock, event, payload) {
  return new Promise((resolve) => sock.emit(event, payload, (res) => resolve(res)));
}

const FULL_EVIDENCE = {
  causeOfDeath: 0,
  location: { group: 0, option: 0 },
  clues: [
    { tileKey: 'motive', optionIndex: 0 },
    { tileKey: 'weather', optionIndex: 0 },
    { tileKey: 'corpseHint', optionIndex: 0 },
    { tileKey: 'impression', optionIndex: 0 },
  ],
};

const results = [];
function check(label, cond) {
  results.push({ label, ok: !!cond });
  console.log((cond ? '  ✓ ' : '  ✗ ') + label);
}

async function makeGame() {
  const host = await connect(); track(host);
  const players = [];
  for (const n of NAMES) { const p = await connect(); track(p); players.push(p); }
  const code = await new Promise((r) => { host.once('host:created', (d) => r(d.code)); host.emit('host:create'); });
  for (let i = 0; i < players.length; i++) await emitAck(players[i], 'player:join', { code, name: NAMES[i] });
  host.emit('host:start');
  await waitFor(() => players.every((p) => stateOf(p) && stateOf(p).phase === 'roles'));
  const roles = players.map((p) => stateOf(p).self.role.id);
  for (const p of players) p.emit('player:confirmRole');
  await waitFor(() => players.every((p) => stateOf(p) && stateOf(p).phase === 'cards'));

  const byRole = {};
  roles.forEach((r, i) => { byRole[r] = byRole[r] || []; byRole[r].push(players[i]); });
  const murderer = byRole.murderer[0];
  const clueId = stateOf(murderer).self.clues[0].id;
  const meansId = stateOf(murderer).self.means[0].id;
  murderer.emit('murderer:choose', { clueId, meansId });
  await waitFor(() => stateOf(byRole.forensicScientist[0]).secrets.solution);

  host.emit('host:beginInvestigation');
  await waitFor(() => stateOf(host).phase === 'evidence');
  await emitAck(byRole.forensicScientist[0], 'forensic:setEvidence', FULL_EVIDENCE);
  await waitFor(() => stateOf(host).evidence.complete);
  host.emit('host:endEvidence');
  await waitFor(() => stateOf(host).phase === 'presentation');

  return { host, players, byRole, clueId, meansId };
}

async function cleanup(g) {
  g.host.disconnect();
  g.players.forEach((p) => p.disconnect());
}

(async () => {
  // A) Todas as acusações erram → badges esgotados → assassinos vencem
  {
    const g = await makeGame();
    const badgeHolders = [...g.byRole.investigator, ...g.byRole.witness];
    for (const h of badgeHolders) {
      // acusa as próprias cartas (≠ solução) → erro
      await emitAck(h, 'player:solve', { targetId: stateOf(h).self.id, clueId: stateOf(h).self.clues[0].id, meansId: stateOf(h).self.means[0].id });
    }
    await waitFor(() => stateOf(g.host).phase === 'result');
    check('A) badges esgotados → assassinos vencem', stateOf(g.host).result.winnerTeam === 'murderers');
    check('A) motivo = badges_exhausted', stateOf(g.host).result.reason === 'badges_exhausted');
    await cleanup(g);
  }

  // B) Acusação correta → contra-ataque → assassino acerta a testemunha
  {
    const g = await makeGame();
    const inv = g.byRole.investigator[0];
    const witness = g.byRole.witness[0];
    await emitAck(inv, 'player:solve', { targetId: stateOf(g.byRole.murderer[0]).self.id, clueId: g.clueId, meansId: g.meansId });
    await waitFor(() => stateOf(g.host).phase === 'challenge');
    await emitAck(g.byRole.murderer[0], 'murderer:challenge', { guessedWitnessId: stateOf(witness).self.id });
    await waitFor(() => stateOf(g.host).phase === 'result');
    check('B) testemunha identificada → assassinos vencem', stateOf(g.host).result.winnerTeam === 'murderers');
    check('B) motivo = witness_identified', stateOf(g.host).result.reason === 'witness_identified');
    await cleanup(g);
  }

  // C) Ninguém resolve → 3 rodadas → assassinos vencem
  {
    const g = await makeGame(); // termina na apresentação da rodada 1
    for (let round = 1; round <= 3; round++) {
      g.host.emit('host:endPresentation');
      await waitFor(() => stateOf(g.host).phase === 'evidence' || stateOf(g.host).phase === 'result');
      if (stateOf(g.host).phase === 'result') break;
      g.host.emit('host:endEvidence');
      await waitFor(() => stateOf(g.host).phase === 'presentation');
    }
    check('C) após 3 rodadas → assassinos vencem', stateOf(g.host).result.winnerTeam === 'murderers');
    check('C) motivo = unsolved', stateOf(g.host).result.reason === 'unsolved');
    await cleanup(g);
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} verificações OK`);
  process.exit(failed.length ? 1 : 0);
})().catch((e) => {
  console.error('ERRO NO TESTE:', e.message);
  process.exit(1);
});
