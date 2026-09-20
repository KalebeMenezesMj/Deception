'use strict';

// Testa a expansão Undercover Allies com 8 jogadores:
// papéis incluem Técnico de Laboratório e Infiltrado, e há a Fase dos Aliados.

const { io } = require('socket.io-client');

const URL = 'http://localhost:3000';
const NAMES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

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

(async () => {
  const host = await connect(); track(host);
  const players = [];
  for (const n of NAMES) { const p = await connect(); track(p); players.push(p); }

  const code = await new Promise((r) => { host.once('host:created', (d) => r(d.code)); host.emit('host:create'); });
  for (let i = 0; i < players.length; i++) await emitAck(players[i], 'player:join', { code, name: NAMES[i] });

  host.emit('host:start');
  await waitFor(() => players.every((p) => stateOf(p) && stateOf(p).phase === 'roles'));
  const roles = players.map((p) => stateOf(p).self.role.id);
  check('8 papéis incluem técnico e infiltrado',
    roles.filter((r) => r === 'labTechnician').length === 1 &&
    roles.filter((r) => r === 'insideMan').length === 1);

  for (const p of players) p.emit('player:confirmRole');
  await waitFor(() => players.every((p) => stateOf(p) && stateOf(p).phase === 'cards'));

  const byRole = {};
  roles.forEach((r, i) => { byRole[r] = byRole[r] || []; byRole[r].push(players[i]); });
  const murderer = byRole.murderer[0];
  const labTech = byRole.labTechnician[0];
  const insideMan = byRole.insideMan[0];
  const investigator = byRole.investigator[0];

  const clueId = stateOf(murderer).self.clues[0].id;
  const meansId = stateOf(murderer).self.means[0].id;
  murderer.emit('murderer:choose', { clueId, meansId });
  await waitFor(() => stateOf(byRole.forensicScientist[0]).secrets.solution);

  host.emit('host:beginInvestigation');
  await waitFor(() => stateOf(host).phase === 'allies');
  check('fase dos aliados inicia (há técnico/infiltrado)', stateOf(host).phase === 'allies');

  // Técnico checa a carta da solução
  const lc = await emitAck(labTech, 'labtech:check', { cardId: clueId });
  check('técnico checa 1 carta', lc.ok === true);
  await waitFor(() => stateOf(labTech).secrets && stateOf(labTech).secrets.labCheck);
  check('técnico descobre que a carta FAZ parte da solução', stateOf(labTech).secrets.labCheck.isSolution === true);

  // Infiltrado remove o badge de um investigador
  const rm = await emitAck(insideMan, 'insideman:remove', { targetId: stateOf(investigator).self.id });
  check('infiltrado remove badge', rm.ok === true);
  await waitFor(() => stateOf(investigator).self.badgeUsed === true);
  check('investigador perdeu o badge (não pode mais acusar)', stateOf(investigator).self.badgeUsed === true && stateOf(investigator).self.canSolve === false);

  // Host conclui a fase dos aliados → coleta de evidências
  host.emit('host:endAllies');
  await waitFor(() => stateOf(host).phase === 'evidence');
  check('fase dos aliados conclui e vai para evidências', stateOf(host).phase === 'evidence');

  // Completa o jogo até o resultado para verificar a pontuação da expansão.
  await emitAck(byRole.forensicScientist[0], 'forensic:setEvidence', FULL_EVIDENCE);
  await waitFor(() => stateOf(host).evidence.complete);
  host.emit('host:endEvidence');
  await waitFor(() => stateOf(host).phase === 'presentation');

  const solver = byRole.investigator[1]; // investigator[0] perdeu o badge para o infiltrado
  await emitAck(solver, 'player:solve', { targetId: stateOf(murderer).self.id, clueId, meansId });
  await waitFor(() => stateOf(host).phase === 'challenge');
  await emitAck(murderer, 'murderer:challenge', { guessedWitnessId: stateOf(byRole.investigator[0]).self.id });
  await waitFor(() => stateOf(host).phase === 'result');

  check('técnico pontua na vitória dos investigadores', stateOf(labTech).self.score === 1);
  check('infiltrado não pontua na derrota dos assassinos', stateOf(insideMan).self.score === 0);
  check('resolvedor (investigador) pontua com bônus', stateOf(solver).self.score === 4);

  host.disconnect();
  players.forEach((p) => p.disconnect());

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} verificações OK`);
  process.exit(failed.length ? 1 : 0);
})().catch((e) => {
  console.error('ERRO NO TESTE:', e.message);
  process.exit(1);
});
