'use strict';

// Testa a reconexão (jogador e host) após "recarregar a página" (novo socket).

const { io } = require('socket.io-client');

const URL = 'http://localhost:3000';

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
  const host = await connect(); track(host);
  const p1 = await connect(); track(p1);
  const p2 = await connect(); track(p2);

  const created = await new Promise((r) => { host.once('host:created', (d) => r(d)); host.emit('host:create'); });
  const code = created.code;
  const hostToken = created.hostToken;

  const j1 = await emitAck(p1, 'player:join', { code, name: 'Kalebe' });
  await emitAck(p2, 'player:join', { code, name: 'Gustavo' });
  check('join retorna token', !!(j1 && j1.token));
  const stableId = stateOf(p1).self.id;
  check('jogador tem id estável', !!stableId);

  // --- Reconexão do JOGADOR ---
  p1.disconnect();
  await waitFor(() => stateOf(host).players.find((x) => x.name === 'Kalebe').connected === false);
  check('host vê o jogador desconectado', stateOf(host).players.find((x) => x.name === 'Kalebe').connected === false);

  const p1b = await connect(); track(p1b);
  const re = await emitAck(p1b, 'player:rejoin', { code, token: j1.token });
  check('rejoin do jogador aceito', !!(re && re.ok));
  await waitFor(() => stateOf(p1b) && stateOf(p1b).self);
  check('rejoin mantém o mesmo id estável', stateOf(p1b).self.id === stableId);
  check('rejoin mantém o nome', stateOf(p1b).self.name === 'Kalebe');

  // --- Reconexão do HOST ---
  host.disconnect();
  const host2 = await connect(); track(host2);
  const hr = await emitAck(host2, 'host:rejoin', { code, hostToken });
  check('rejoin do host aceito', !!(hr && hr.ok));
  await waitFor(() => stateOf(host2) && stateOf(host2).type === 'host');
  check('host recupera o painel após reconectar', stateOf(host2).type === 'host' && stateOf(host2).code === code);

  // Token errado não funciona
  const host3 = await connect();
  const bad = await emitAck(host3, 'host:rejoin', { code, hostToken: 'TOKEN_ERRADO' });
  check('token de host errado é rejeitado', !!(bad && !bad.ok));
  host3.disconnect();

  p2.disconnect();
  p1b.disconnect();
  host2.disconnect();

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} verificações OK`);
  process.exit(failed.length ? 1 : 0);
})().catch((e) => {
  console.error('ERRO NO TESTE:', e.message);
  process.exit(1);
});
