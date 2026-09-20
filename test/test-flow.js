'use strict';

// Teste de ponta a ponta: host + 6 jogadores (cobre o jogo completo).
// Roda contra o servidor local (node server.js). Valida lógica e segurança.

const { io } = require('socket.io-client');

const URL = 'http://localhost:3000';
const NAMES = ['Kalebe', 'Gustavo', 'Jogador 3', 'Jogador 4', 'Jogador 5', 'Jogador 6'];

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

const results = [];
function check(label, cond) {
  results.push({ label, ok: !!cond });
  console.log((cond ? '  ✓ ' : '  ✗ ') + label);
}

(async () => {
  const host = await connect();
  track(host);
  const players = [];
  for (const n of NAMES) { const p = await connect(); track(p); players.push(p); }

  // 1. Criar sala + entrar
  const code = await new Promise((resolve) => { host.once('host:created', (d) => resolve(d.code)); host.emit('host:create'); });
  for (let i = 0; i < players.length; i++) {
    const ok = await emitAck(players[i], 'player:join', { code, name: NAMES[i] });
    check(`jogador ${i + 1} entra na sala`, ok && ok.ok);
  }

  // 2. Iniciar + confirmar papéis
  host.emit('host:start');
  await waitFor(() => players.every((p) => stateOf(p) && stateOf(p).phase === 'roles'));
  const roles = players.map((p) => stateOf(p).self.role.id);
  check('6 papéis: FS, assassino, cúmplice, testemunha, 2 investigadores',
    roles.filter((r) => r === 'forensicScientist').length === 1 &&
    roles.filter((r) => r === 'murderer').length === 1 &&
    roles.filter((r) => r === 'accomplice').length === 1 &&
    roles.filter((r) => r === 'witness').length === 1 &&
    roles.filter((r) => r === 'investigator').length === 2);

  for (const p of players) p.emit('player:confirmRole');
  await waitFor(() => players.every((p) => stateOf(p) && stateOf(p).phase === 'cards'));

  const forensic = players[roles.indexOf('forensicScientist')];
  const murderer = players[roles.indexOf('murderer')];
  const witness = players[roles.indexOf('witness')];
  const investigators = roles.map((r, i) => r === 'investigator' ? players[i] : null).filter(Boolean);

  // 3. Assassino escolhe
  const clueId = stateOf(murderer).self.clues[0].id;
  const meansId = stateOf(murderer).self.means[0].id;
  murderer.emit('murderer:choose', { clueId, meansId });
  await waitFor(() => stateOf(forensic).secrets && stateOf(forensic).secrets.solution);

  // 4. Investigação → coleta de evidências
  host.emit('host:beginInvestigation');
  await waitFor(() => stateOf(host).phase === 'evidence');
  check('fase de coleta de evidências', stateOf(host).phase === 'evidence');

  const setEv = await emitAck(forensic, 'forensic:setEvidence', {
    causeOfDeath: 0,
    location: { group: 0, option: 2 },
    clues: [
      { tileKey: 'motive', optionIndex: 0 },
      { tileKey: 'weather', optionIndex: 1 },
      { tileKey: 'corpseHint', optionIndex: 2 },
      { tileKey: 'impression', optionIndex: 3 },
    ],
  });
  check('forense posiciona as 6 balas', setEv.ok === true);
  await waitFor(() => stateOf(host).evidence && stateOf(host).evidence.complete);
  check('evidências completas (6 balas)', stateOf(host).evidence.complete === true);
  check('board de evidências tem 6 balas', stateOf(host).evidence.bullets.length === 6);

  // 5. Apresentação
  host.emit('host:endEvidence');
  await waitFor(() => stateOf(host).phase === 'presentation');
  check('fase de apresentação inicia', stateOf(host).phase === 'presentation');
  check('cronômetro da discussão roda', stateOf(host).timer.running === true);

  // 6. Acusação errada (investigador 1) → perde badge
  const inv1 = investigators[0];
  const wrongClue = stateOf(inv1).self.clues[0].id; // cartas do próprio investigador (≠ solução)
  const wrongMeans = stateOf(inv1).self.means[0].id;
  const wrongRes = await emitAck(inv1, 'player:solve', { targetId: stateOf(inv1).self.id, clueId: wrongClue, meansId: wrongMeans });
  check('acusação errada detectada', wrongRes.ok === true && wrongRes.wrong === true);
  await waitFor(() => stateOf(inv1).self.badgeUsed === true);
  check('investigador perde o badge após errar', stateOf(inv1).self.badgeUsed === true);

  // 7. Acusação correta (investigador 2) → contra-ataque (há testemunha)
  const inv2 = investigators[1];
  const solveRes = await emitAck(inv2, 'player:solve', { targetId: stateOf(murderer).self.id, clueId, meansId });
  check('acusação correta dispara contra-ataque', solveRes.ok === true && solveRes.challenged === true);
  await waitFor(() => stateOf(host).phase === 'challenge');
  check('fase de contra-ataque', stateOf(host).phase === 'challenge');

  // 8. Assassino erra a testemunha → investigadores vencem
  const chRes = await emitAck(murderer, 'murderer:challenge', { guessedWitnessId: stateOf(inv1).self.id });
  check('contra-ataque processado', chRes.ok === true);
  await waitFor(() => stateOf(host).phase === 'result');
  check('fase de resultado', stateOf(host).phase === 'result');
  check('investigadores vencem', stateOf(host).result.winnerTeam === 'investigators');
  check('solução revelada no resultado', !!(stateOf(host).result.solution && stateOf(host).result.solution.clue));

  // 9. Pontuação
  await waitFor(() => stateOf(inv2).self.score > 0);
  check('resolvedor ganha bônus (1 + 3 = 4 pts)', stateOf(inv2).self.score === 4);
  check('testemunha ganha 2 pts', stateOf(witness).self.score === 2);
  check('assassino fica com 0 pts', stateOf(murderer).self.score === 0);

  // 10. Segurança final: host nunca viu papéis
  check('host segue sem papéis no fim', stateOf(host).players.every((p) => !p.role));

  // 11. Jogar novamente (revanche mantém placar)
  host.emit('host:backToLobby');
  await waitFor(() => stateOf(host).phase === 'lobby');
  check('voltar ao lobby mantém placar', stateOf(host).players.some((p) => p.score > 0));

  host.disconnect();
  players.forEach((p) => p.disconnect());

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} verificações OK`);
  process.exit(failed.length ? 1 : 0);
})().catch((e) => {
  console.error('ERRO NO TESTE:', e.message);
  process.exit(1);
});
