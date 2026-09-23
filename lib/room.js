'use strict';

const { randomUUID } = require('crypto');
const { gameConfig } = require('./config');
const { ROLES } = require('./roles');
const { MEANS, CLUES, SCENE_TILES } = require('./cards');

/**
 * Sala de partida. Guarda TODO o estado e é a única fonte de verdade.
 *
 * SEGURANÇA: nenhum segredo (papel, escolha do assassino, solução) sai daqui para
 * um cliente que não tenha permissão. `viewFor()` / `hostView()` montam uma versão
 * "sanitizada" do estado para cada destinatário.
 *
 * IDENTIDADE ESTÁVEL: cada jogador tem um `id` fixo (token), independente do socket.
 * Isso permite reconectar (recarregar a página) sem perder o papel/cartas.
 */

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function genCode(len) {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // sem caracteres ambíguos
  let out = '';
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

const PHASES = {
  LOBBY: 'lobby',
  ROLES: 'roles',
  CARDS: 'cards',
  ALLIES: 'allies', // expansão: técnico de laboratório e infiltrado agem
  EVIDENCE: 'evidence',
  PRESENTATION: 'presentation',
  CHALLENGE: 'challenge',
  RESULT: 'result',
};

const CLUE_TILE_KEYS = SCENE_TILES.details.map((d) => d.key);

class Room {
  constructor(code, hostId) {
    this.code = code;
    this.hostId = hostId;
    this.hostToken = randomUUID(); // para o host reconectar (recarregar a página)
    this.phase = PHASES.LOBBY;
    this.round = 0;

    // playerId (estável) -> player
    this.players = new Map();

    this.solution = null;
    this.evidence = { causeOfDeath: null, location: null, clues: [] };
    this.usedBadge = new Set(); // playerIds que erraram (ou perderam o badge)
    this.result = null;

    // Expansão: Fase dos Aliados
    this.alliesDone = false;
    this.labCheckResult = null; // { cardId, labTechId, isSolution } resultado da checagem

    this.timer = { running: false, endsAt: null, totalMs: null, label: null };
    this._timerInterval = null;
  }

  get connectedPlayers() {
    return [...this.players.values()];
  }

  playerBySocket(socketId) {
    return this.connectedPlayers.find((p) => p.socketId === socketId) || null;
  }

  addPlayer(socketId, name) {
    const id = randomUUID();
    const player = {
      id, // estável
      token: id,
      socketId,
      name,
      roleId: null,
      clues: [],
      means: [],
      confirmed: false,
      score: 0,
      connected: true,
    };
    this.players.set(id, player);
    return player;
  }

  // Marca como desconectado (mantém o jogador para permitir reconexão).
  markDisconnected(socketId) {
    const p = this.playerBySocket(socketId);
    if (p) {
      p.connected = false;
      p.socketId = null;
    }
  }

  // Reconecta um jogador existente a um novo socket (página recarregada).
  rejoin(token, newSocketId) {
    const p = this.players.get(token);
    if (!p) return null;
    p.socketId = newSocketId;
    p.connected = true;
    return p;
  }

  removeDisconnected() {
    for (const p of this.connectedPlayers) {
      if (!p.connected) this.players.delete(p.id);
    }
  }

  playerCount() {
    return this.connectedPlayers.filter((p) => p.connected).length;
  }

  // ---------------------------------------------------------------------------
  // Fluxo da partida
  // ---------------------------------------------------------------------------

  startGame() {
    this.removeDisconnected(); // quem saiu não joga
    const n = this.playerCount();
    const roleIds = shuffle(gameConfig.rolesForPlayerCount(n));
    const players = this.connectedPlayers;

    players.forEach((p, i) => {
      p.roleId = roleIds[i];
      p.confirmed = false;
      p.clues = [];
      p.means = [];
    });

    this.solution = null;
    this.evidence = { causeOfDeath: null, location: null, clues: [] };
    this.usedBadge = new Set();
    this.result = null;
    this.alliesDone = false;
    this.labCheckResult = null;
    this.pendingSolverId = null;
    this.round = 0;
    this.stopTimer();
    this.phase = PHASES.ROLES;
  }

  allConfirmed() {
    // Jogadores desconectados não bloqueiam a partida (são ignorados).
    return this.connectedPlayers.every((p) => p.confirmed || !p.connected);
  }

  confirmRole(socketId) {
    const p = this.playerBySocket(socketId);
    if (!p) return false;
    p.confirmed = true;
    if (this.allConfirmed()) {
      this.dealCards();
      return true;
    }
    return false;
  }

  dealCards() {
    const clueDeck = shuffle(CLUES);
    const meansDeck = shuffle(MEANS);

    let ci = 0;
    let mi = 0;

    const cardHolders = this.connectedPlayers.filter((p) => p.roleId !== 'forensicScientist');

    for (const p of cardHolders) {
      p.clues = clueDeck.slice(ci, ci + gameConfig.clueCardsPerPlayer).map((c) => c.id);
      p.means = meansDeck.slice(mi, mi + gameConfig.meansCardsPerPlayer).map((m) => m.id);
      ci += gameConfig.clueCardsPerPlayer;
      mi += gameConfig.meansCardsPerPlayer;
    }

    this.phase = PHASES.CARDS;
  }

  chooseSolution(socketId, clueId, meansId) {
    const p = this.playerBySocket(socketId);
    if (!p || p.roleId !== 'murderer') return { ok: false, error: 'not_murderer' };
    if (!p.clues.includes(clueId) || !p.means.includes(meansId)) {
      return { ok: false, error: 'invalid_cards' };
    }
    this.solution = { clueId, meansId, murdererId: p.id };
    return { ok: true };
  }

  // ---------------------------------------------------------------------------
  // Investigação (rodadas, evidências, acusação)
  // ---------------------------------------------------------------------------

  beginInvestigation() {
    this.round = 1;
    this.evidence = { causeOfDeath: null, location: null, clues: [] };
    this.stopTimer();
    this.phase = this.hasAllies() && !this.alliesDone ? PHASES.ALLIES : PHASES.EVIDENCE;
  }

  // ---------------------------------------------------------------------------
  // Expansão: Fase dos Aliados (Técnico de Laboratório e Infiltrado)
  // ---------------------------------------------------------------------------

  hasAllies() {
    return this.connectedPlayers.some((p) => p.roleId === 'labTechnician' || p.roleId === 'insideMan');
  }

  endAllies() {
    if (this.phase !== PHASES.ALLIES) return { ok: false, error: 'wrong_phase' };
    this.alliesDone = true;
    this.phase = PHASES.EVIDENCE;
    return { ok: true };
  }

  cardById(id) {
    return MEANS.find((c) => c.id === id) || CLUES.find((c) => c.id === id) || null;
  }

  // O técnico checa 1 carta; o servidor calcula a resposta usando a solução.
  labCheck(socketId, cardId) {
    const p = this.playerBySocket(socketId);
    if (!p || p.roleId !== 'labTechnician') return { ok: false, error: 'not_labtech' };
    if (this.phase !== PHASES.ALLIES) return { ok: false, error: 'wrong_phase' };
    if (this.labCheckResult && this.labCheckResult.labTechId === p.id) return { ok: false, error: 'already_checked' };
    if (!cardId || !this.cardById(cardId)) return { ok: false, error: 'bad_card' };

    const isSolution = this.solution && (this.solution.clueId === cardId || this.solution.meansId === cardId);
    this.labCheckResult = { cardId, labTechId: p.id, isSolution: !!isSolution };
    return { ok: true };
  }

  // O infiltrado faz 1 jogador perder o badge.
  insideManRemove(socketId, targetId) {
    const p = this.playerBySocket(socketId);
    if (!p || p.roleId !== 'insideMan') return { ok: false, error: 'not_insideman' };
    if (this.phase !== PHASES.ALLIES) return { ok: false, error: 'wrong_phase' };

    const target = this.players.get(targetId);
    if (!target || target.id === p.id) return { ok: false, error: 'bad_target' };

    this.usedBadge.add(target.id);
    return { ok: true };
  }

  canSolvePlayer(p) {
    if (!p) return false;
    if (!p.connected) return false;
    if (p.roleId !== 'investigator' && p.roleId !== 'witness') return false;
    if (this.usedBadge.has(p.id)) return false;
    if (this.phase !== PHASES.EVIDENCE && this.phase !== PHASES.PRESENTATION) return false;
    return true;
  }

  setEvidence(socketId, evidence) {
    const p = this.playerBySocket(socketId);
    if (!p || p.roleId !== 'forensicScientist') return { ok: false, error: 'not_forensic' };
    if (this.phase !== PHASES.EVIDENCE) return { ok: false, error: 'wrong_phase' };

    const e = evidence || {};
    const parsed = { causeOfDeath: null, location: null, clues: [] };

    if (e.causeOfDeath != null) {
      const i = Number(e.causeOfDeath);
      if (!Number.isInteger(i) || i < 0 || i > 5) return { ok: false, error: 'bad_cause' };
      parsed.causeOfDeath = i;
    }

    if (e.location != null) {
      const g = Number(e.location.group);
      const o = Number(e.location.option);
      if (!Number.isInteger(g) || g < 0 || g > 3) return { ok: false, error: 'bad_location' };
      if (!Number.isInteger(o) || o < 0 || o > 5) return { ok: false, error: 'bad_location' };
      parsed.location = { group: g, option: o };
    }

    const clues = Array.isArray(e.clues) ? e.clues : [];
    if (clues.length > 4) return { ok: false, error: 'too_many_clues' };
    const seen = new Set();
    for (const c of clues) {
      if (!c || !CLUE_TILE_KEYS.includes(c.tileKey)) return { ok: false, error: 'bad_tile' };
      const i = Number(c.optionIndex);
      if (!Number.isInteger(i) || i < 0 || i > 5) return { ok: false, error: 'bad_option' };
      if (seen.has(c.tileKey)) return { ok: false, error: 'dup_tile' };
      seen.add(c.tileKey);
      parsed.clues.push({ tileKey: c.tileKey, optionIndex: i });
    }

    this.evidence = parsed;
    return { ok: true };
  }

  evidenceComplete() {
    const e = this.evidence;
    return e.causeOfDeath != null && e.location != null && e.clues.length === 4;
  }

  endEvidence() {
    if (this.phase !== PHASES.EVIDENCE) return { ok: false, error: 'wrong_phase' };
    if (!this.evidenceComplete()) return { ok: false, error: 'incomplete' };
    this.phase = PHASES.PRESENTATION;
    this.startTimer('discussão', gameConfig.timers.discussion);
    return { ok: true };
  }

  endPresentation() {
    if (this.phase !== PHASES.PRESENTATION) return { ok: false, error: 'wrong_phase' };
    this.stopTimer();
    if (this.round < gameConfig.rounds) {
      this.round += 1;
      this.phase = PHASES.EVIDENCE;
      return { ok: true };
    }
    this.finishGame('murderers', 'unsolved');
    return { ok: true };
  }

  solve(socketId, clueId, meansId, targetId) {
    const p = this.playerBySocket(socketId);
    if (!p) return { ok: false, error: 'not_found' };
    if (!this.canSolvePlayer(p)) return { ok: false, error: 'cannot_solve' };
    if (!this.solution) return { ok: false, error: 'no_solution' };

    const correct = clueId === this.solution.clueId && meansId === this.solution.meansId;

    if (correct) {
      const hasWitness = this.connectedPlayers.some((x) => x.roleId === 'witness');
      if (hasWitness) {
        this.phase = PHASES.CHALLENGE;
        this.pendingSolverId = p.id;
        this.stopTimer();
        return { ok: true, challenged: true };
      }
      this.finishGame('investigators', 'solved', { solverId: p.id });
      return { ok: true, challenged: false };
    }

    this.usedBadge.add(p.id);
    if (this.allBadgesUsed()) {
      this.finishGame('murderers', 'badges_exhausted');
      return { ok: true, exhausted: true };
    }
    return { ok: true, wrong: true };
  }

  allBadgesUsed() {
    // Apenas jogadores conectados contam (desconectados perdem a chance de acusar).
    return this.connectedPlayers
      .filter((p) => p.connected && (p.roleId === 'investigator' || p.roleId === 'witness'))
      .every((p) => this.usedBadge.has(p.id));
  }

  challenge(socketId, guessedWitnessId) {
    const p = this.playerBySocket(socketId);
    if (!p || p.roleId !== 'murderer') return { ok: false, error: 'not_murderer' };
    if (this.phase !== PHASES.CHALLENGE) return { ok: false, error: 'wrong_phase' };

    const target = this.players.get(guessedWitnessId);
    if (!target) return { ok: false, error: 'bad_target' };
    if (target.roleId === 'murderer' || target.roleId === 'accomplice') {
      return { ok: false, error: 'bad_target' };
    }

    if (target.roleId === 'witness') {
      this.finishGame('murderers', 'witness_identified', { witnessId: target.id });
    } else {
      this.finishGame('investigators', 'solved', { solverId: this.pendingSolverId });
    }
    return { ok: true };
  }

  // ---------------------------------------------------------------------------
  // Resultado e pontuação
  // ---------------------------------------------------------------------------

  finishGame(winnerTeam, reason, details = {}) {
    this.stopTimer();

    const sol = this.solution;
    const murderer = sol ? this.players.get(sol.murdererId) : null;

    this.result = {
      winnerTeam,
      reason,
      solution: sol
        ? {
            clue: CLUES.find((c) => c.id === sol.clueId) || null,
            means: MEANS.find((m) => m.id === sol.meansId) || null,
            murdererName: murderer ? murderer.name : null,
          }
        : null,
      solverName: details.solverId ? (this.players.get(details.solverId) || {}).name : null,
      witnessName: details.witnessId ? (this.players.get(details.witnessId) || {}).name : null,
    };

    this.applyScores(winnerTeam, details.solverId);
    this.phase = PHASES.RESULT;
  }

  applyScores(winnerTeam, solverId) {
    const cfg = gameConfig.scoring;
    for (const p of this.connectedPlayers) {
      const table = winnerTeam === 'investigators' ? cfg.investigatorWin : cfg.murdererWin;
      p.score += table[p.roleId] || 0;
    }
    if (winnerTeam === 'investigators' && solverId) {
      const solver = this.players.get(solverId);
      if (solver) solver.score += cfg.solveBonus;
    }
  }

  backToLobby() {
    this.stopTimer();
    this.removeDisconnected();
    this.phase = PHASES.LOBBY;
    this.round = 0;
    this.solution = null;
    this.evidence = { causeOfDeath: null, location: null, clues: [] };
    this.usedBadge = new Set();
    this.result = null;
    for (const p of this.connectedPlayers) {
      p.roleId = null;
      p.clues = [];
      p.means = [];
      p.confirmed = false;
    }
  }

  resetScores() {
    for (const p of this.connectedPlayers) p.score = 0;
  }

  // ---------------------------------------------------------------------------
  // Cronômetro
  // ---------------------------------------------------------------------------

  startTimer(label, seconds) {
    this.stopTimer();
    const totalMs = seconds * 1000;
    this.timer = { running: true, endsAt: Date.now() + totalMs, totalMs, label };

    this._timerInterval = setInterval(() => {
      if (this.timer.running && this.timer.endsAt <= Date.now()) {
        this.stopTimer();
        if (this._onTimerExpire) this._onTimerExpire();
      }
    }, 250);
  }

  stopTimer() {
    if (this._timerInterval) {
      clearInterval(this._timerInterval);
      this._timerInterval = null;
    }
    this.timer = { running: false, endsAt: null, totalMs: null, label: null };
  }

  onTimerExpire(fn) {
    this._onTimerExpire = fn;
  }

  remainingMs() {
    if (!this.timer.running || !this.timer.endsAt) return 0;
    return Math.max(0, this.timer.endsAt - Date.now());
  }

  // ---------------------------------------------------------------------------
  // Serialização "segura"
  // ---------------------------------------------------------------------------

  cardRefs(ids) {
    const all = [...MEANS, ...CLUES];
    const map = new Map(all.map((c) => [c.id, c]));
    return ids.map((id) => map.get(id)).filter(Boolean);
  }

  publicCards() {
    const out = {};
    for (const p of this.connectedPlayers) {
      out[p.id] = {
        clues: this.cardRefs(p.clues),
        means: this.cardRefs(p.means),
      };
    }
    return out;
  }

  publicPlayers() {
    return this.connectedPlayers.map((p) => ({
      id: p.id,
      name: p.name,
      connected: p.connected,
      confirmed: p.confirmed,
      score: p.score,
      hasCards: p.clues.length > 0,
      badgeUsed: this.usedBadge.has(p.id),
    }));
  }

  timerView() {
    return {
      running: this.timer.running,
      endsAt: this.timer.endsAt,
      totalMs: this.timer.totalMs,
      label: this.timer.label,
      remainingMs: this.remainingMs(),
    };
  }

  evidenceView() {
    const e = this.evidence || { causeOfDeath: null, location: null, clues: [] };
    const bullets = [];

    if (e.causeOfDeath != null) {
      bullets.push({
        type: 'causeOfDeath',
        title: SCENE_TILES.causeOfDeath.title,
        options: SCENE_TILES.causeOfDeath.options,
        selected: e.causeOfDeath,
      });
    }
    if (e.location && e.location.group != null) {
      const grp = SCENE_TILES.location.groups[e.location.group];
      bullets.push({
        type: 'location',
        title: SCENE_TILES.location.title,
        options: grp,
        selected: e.location.option,
      });
    }
    for (const c of e.clues) {
      const t = SCENE_TILES.details.find((d) => d.key === c.tileKey);
      if (t) {
        bullets.push({
          type: 'clue',
          key: t.key,
          title: t.title,
          options: t.options,
          selected: c.optionIndex,
        });
      }
    }

    return {
      complete: this.evidenceComplete(),
      placed: bullets.length,
      bullets,
    };
  }

  secretsFor(socketId) {
    const p = this.playerBySocket(socketId);
    if (!p) return {};
    const secrets = {};

    const sol = this.solution;
    const murderer = sol ? this.players.get(sol.murdererId) : null;

    switch (p.roleId) {
      case 'forensicScientist':
        if (sol) {
          secrets.solution = {
            clue: CLUES.find((c) => c.id === sol.clueId) || null,
            means: MEANS.find((m) => m.id === sol.meansId) || null,
            murdererName: murderer ? murderer.name : null,
          };
        }
        secrets.rawEvidence = this.evidence;
        break;

      case 'murderer': {
        if (sol) {
          secrets.solution = {
            clue: CLUES.find((c) => c.id === sol.clueId) || null,
            means: MEANS.find((m) => m.id === sol.meansId) || null,
          };
        }
        secrets.accompliceName =
          this.connectedPlayers.filter((x) => x.roleId === 'accomplice').map((x) => x.name)[0] || null;
        secrets.accompliceId =
          this.connectedPlayers.filter((x) => x.roleId === 'accomplice').map((x) => x.id)[0] || null;
        break;
      }

      case 'accomplice':
        secrets.murdererName =
          this.connectedPlayers.filter((x) => x.roleId === 'murderer').map((x) => x.name)[0] || null;
        break;

      case 'witness':
        secrets.culprits = this.connectedPlayers
          .filter((x) => x.roleId === 'murderer' || x.roleId === 'accomplice')
          .map((x) => x.name);
        break;

      case 'labTechnician':
        if (this.labCheckResult && this.labCheckResult.labTechId === p.id) {
          secrets.labCheck = {
            card: this.cardById(this.labCheckResult.cardId),
            isSolution: this.labCheckResult.isSolution,
          };
        }
        break;

      case 'protectiveDetail':
        secrets.witnessName =
          this.connectedPlayers.filter((x) => x.roleId === 'witness').map((x) => x.name)[0] || null;
        break;

      default:
        break;
    }

    return secrets;
  }

  hostView() {
    const reveal = this.phase === PHASES.RESULT;
    return {
      type: 'host',
      code: this.code,
      phase: this.phase,
      round: this.round,
      maxRounds: gameConfig.rounds,
      playerCount: this.playerCount(),
      minPlayers: gameConfig.minPlayers,
      players: this.publicPlayers(),
      cards: this.publicCards(),
      evidence: this.evidenceView(),
      timer: this.timerView(),
      solution: reveal ? (this.result ? this.result.solution : null) : null,
      solutionChosen: !!this.solution,
      result: reveal ? this.result : null,
    };
  }

  viewFor(socketId) {
    const p = this.playerBySocket(socketId);
    if (!p) return null;

    const role = ROLES[p.roleId] || null;

    return {
      type: 'player',
      code: this.code,
      phase: this.phase,
      round: this.round,
      maxRounds: gameConfig.rounds,
      self: {
        id: p.id,
        name: p.name,
        role: role
          ? { id: role.id, name: role.name, team: role.team, tagline: role.tagline, instruction: role.instruction }
          : null,
        clues: this.cardRefs(p.clues),
        means: this.cardRefs(p.means),
        confirmed: p.confirmed,
        score: p.score,
        canSolve: this.canSolvePlayer(p),
        badgeUsed: this.usedBadge.has(p.id),
      },
      players: this.publicPlayers(),
      cards: this.publicCards(),
      evidence: this.evidenceView(),
      timer: this.timerView(),
      secrets: this.secretsFor(socketId),
      result: this.phase === PHASES.RESULT ? this.result : null,
    };
  }
}

module.exports = { Room, PHASES, genCode, shuffle };
