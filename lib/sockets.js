'use strict';

const { Room, PHASES, genCode } = require('./room');
const { gameConfig } = require('./config');

/**
 * Gerencia as salas e conecta os eventos de Socket.IO.
 * `getServerInfo()` retorna { ip, port } para montar a URL/QR Code.
 */
function createRoomManager() {
  return new Map(); // code -> Room
}

function broadcast(io, room) {
  // Envia a visão personalizada para cada socket da sala.
  const hostSock = io.sockets.sockets.get(room.hostId);
  if (hostSock) hostSock.emit('state', room.hostView());

  for (const p of room.connectedPlayers) {
    if (!p.socketId) continue;
    const sock = io.sockets.sockets.get(p.socketId);
    if (!sock) continue;
    sock.emit('state', room.viewFor(p.socketId));
  }
}

function setupSocketHandlers(io, rooms, getServerInfo) {
  io.on('connection', (socket) => {
    let currentRoom = null;
    let currentCode = null;

    const joinSocketRoom = (code) => {
      currentCode = code;
      socket.join(code);
    };

    // ---- HOST: criar sala --------------------------------------------------
    socket.on('host:create', () => {
      if (currentRoom) return; // este socket já está em uma sala
      let code = genCode(gameConfig.roomCodeLength);
      while (rooms.has(code)) code = genCode(gameConfig.roomCodeLength);

      const room = new Room(code, socket.id);
      room.onTimerExpire(() => broadcast(io, room));
      rooms.set(code, room);
      currentRoom = room;
      joinSocketRoom(code);

      socket.emit('host:created', { code, serverInfo: getServerInfo(), hostToken: room.hostToken });
      broadcast(io, room);
    });

    // ---- HOST: reconectar (recarregou a página) -----------------------------
    socket.on('host:rejoin', (payload, ack) => {
      if (currentRoom) return ack && ack({ ok: false, error: 'already_in_room' });
      const { code, hostToken } = payload || {};
      const room = code ? rooms.get(code.toUpperCase()) : null;
      if (!room) return ack && ack({ ok: false, error: 'room_not_found' });
      if (!hostToken || room.hostToken !== hostToken) return ack && ack({ ok: false, error: 'bad_token' });

      room.hostId = socket.id;
      currentRoom = room;
      joinSocketRoom(room.code);
      ack && ack({ ok: true, code: room.code });
      broadcast(io, room);
    });

    // ---- JOGADOR: entrar ----------------------------------------------------
    socket.on('player:join', (payload, ack) => {
      if (currentRoom) return ack && ack({ ok: false, error: 'already_in_room' });
      const { code, name } = payload || {};
      const room = code ? rooms.get(code.toUpperCase()) : null;

      if (!room) return ack && ack({ ok: false, error: 'room_not_found' });
      if (!name || !name.trim()) return ack && ack({ ok: false, error: 'invalid_name' });
      if (room.phase !== PHASES.LOBBY) return ack && ack({ ok: false, error: 'game_started' });
      if (room.playerCount() >= gameConfig.maxPlayers) {
        return ack && ack({ ok: false, error: 'room_full' });
      }

      const player = room.addPlayer(socket.id, name.trim());
      currentRoom = room;
      joinSocketRoom(room.code);

      ack && ack({ ok: true, code: room.code, playerId: player.id, token: player.token });
      broadcast(io, room);
    });

    // ---- JOGADOR: reconectar (recarregou a página) --------------------------
    socket.on('player:rejoin', (payload, ack) => {
      if (currentRoom) return ack && ack({ ok: false, error: 'already_in_room' });
      const { code, token } = payload || {};
      const room = code ? rooms.get(code.toUpperCase()) : null;
      if (!room) return ack && ack({ ok: false, error: 'room_not_found' });

      const p = room.rejoin(token, socket.id);
      if (!p) return ack && ack({ ok: false, error: 'not_found' });

      currentRoom = room;
      joinSocketRoom(room.code);
      ack && ack({ ok: true, code: room.code, playerId: p.id });
      broadcast(io, room);
    });

    // ---- HOST: iniciar partida ---------------------------------------------
    socket.on('host:start', () => {
      if (!currentRoom || socket.id !== currentRoom.hostId) return;
      if (currentRoom.playerCount() < gameConfig.minPlayers) return;
      if (currentRoom.phase !== PHASES.LOBBY) return;

      currentRoom.startGame();
      broadcast(io, currentRoom);
    });

    // ---- JOGADOR: confirmar papel ------------------------------------------
    socket.on('player:confirmRole', () => {
      if (!currentRoom || !currentRoom.playerBySocket(socket.id)) return;
      if (currentRoom.phase !== PHASES.ROLES) return;

      currentRoom.confirmRole(socket.id);
      broadcast(io, currentRoom);
    });

    // ---- ASSASSINO: escolher arma + evidência ------------------------------
    socket.on('murderer:choose', (payload) => {
      if (!currentRoom || !currentRoom.playerBySocket(socket.id)) return;
      if (currentRoom.phase !== PHASES.CARDS) return;

      const { clueId, meansId } = payload || {};
      const res = currentRoom.chooseSolution(socket.id, clueId, meansId);
      if (res.ok) broadcast(io, currentRoom);
    });

    // ---- HOST: iniciar investigação ----------------------------------------
    socket.on('host:beginInvestigation', () => {
      if (!currentRoom || socket.id !== currentRoom.hostId) return;
      if (currentRoom.phase !== PHASES.CARDS) return;
      if (!currentRoom.solution) return; // precisa da escolha do assassino

      currentRoom.beginInvestigation();
      broadcast(io, currentRoom);
    });

    // ---- HOST: concluir Fase dos Aliados -----------------------------------
    socket.on('host:endAllies', () => {
      if (!currentRoom || socket.id !== currentRoom.hostId) return;
      const res = currentRoom.endAllies();
      if (res.ok) broadcast(io, currentRoom);
    });

    // ---- TÉCNICO: checar 1 carta -------------------------------------------
    socket.on('labtech:check', (payload, ack) => {
      if (!currentRoom || !currentRoom.playerBySocket(socket.id)) {
        return ack && ack({ ok: false, error: 'not_found' });
      }
      const res = currentRoom.labCheck(socket.id, payload && payload.cardId);
      if (ack) ack(res);
      if (res.ok) broadcast(io, currentRoom);
    });

    // ---- INFILTRADO: remover badge de 1 jogador ----------------------------
    socket.on('insideman:remove', (payload, ack) => {
      if (!currentRoom || !currentRoom.playerBySocket(socket.id)) {
        return ack && ack({ ok: false, error: 'not_found' });
      }
      const res = currentRoom.insideManRemove(socket.id, payload && payload.targetId);
      if (ack) ack(res);
      if (res.ok) broadcast(io, currentRoom);
    });

    // ---- FORENSE: posicionar balas (evidências) ----------------------------
    socket.on('forensic:setEvidence', (payload, ack) => {
      if (!currentRoom || !currentRoom.playerBySocket(socket.id)) {
        return ack && ack({ ok: false, error: 'not_found' });
      }
      const res = currentRoom.setEvidence(socket.id, payload);
      if (ack) ack(res);
      if (res.ok) broadcast(io, currentRoom);
    });

    // ---- HOST: concluir coleta de evidências → apresentação ----------------
    socket.on('host:endEvidence', () => {
      if (!currentRoom || socket.id !== currentRoom.hostId) return;
      const res = currentRoom.endEvidence();
      if (res.ok) broadcast(io, currentRoom);
    });

    // ---- HOST: encerrar rodada (apresentação) ------------------------------
    socket.on('host:endPresentation', () => {
      if (!currentRoom || socket.id !== currentRoom.hostId) return;
      const res = currentRoom.endPresentation();
      if (res.ok) broadcast(io, currentRoom);
    });

    // ---- JOGADOR: acusar (resolver o crime) --------------------------------
    socket.on('player:solve', (payload, ack) => {
      if (!currentRoom || !currentRoom.playerBySocket(socket.id)) {
        return ack && ack({ ok: false, error: 'not_found' });
      }
      const { clueId, meansId, targetId } = payload || {};
      const res = currentRoom.solve(socket.id, clueId, meansId, targetId);
      if (ack) ack(res);
      broadcast(io, currentRoom);
    });

    // ---- ASSASSINO: contra-ataque (identificar a testemunha) ---------------
    socket.on('murderer:challenge', (payload, ack) => {
      if (!currentRoom || !currentRoom.playerBySocket(socket.id)) {
        return ack && ack({ ok: false, error: 'not_found' });
      }
      const res = currentRoom.challenge(socket.id, payload && payload.guessedWitnessId);
      if (ack) ack(res);
      broadcast(io, currentRoom);
    });

    // ---- HOST: voltar ao lobby (revanche, mantém placar) -------------------
    socket.on('host:backToLobby', () => {
      if (!currentRoom || socket.id !== currentRoom.hostId) return;
      currentRoom.backToLobby();
      broadcast(io, currentRoom);
    });

    // ---- HOST: zerar placar ------------------------------------------------
    socket.on('host:resetScores', () => {
      if (!currentRoom || socket.id !== currentRoom.hostId) return;
      currentRoom.resetScores();
      broadcast(io, currentRoom);
    });

    // ---- Desconexão ---------------------------------------------------------
    socket.on('disconnect', () => {
      if (!currentRoom) return;
      if (socket.id !== currentRoom.hostId) {
        currentRoom.markDisconnected(socket.id);
      }

      // Limpeza: remove a sala quando não há mais ninguém (nem host).
      if (currentRoom.playerCount() === 0 && !io.sockets.sockets.get(currentRoom.hostId)) {
        rooms.delete(currentRoom.code);
        return;
      }
      broadcast(io, currentRoom);
    });
  });
}

module.exports = { createRoomManager, setupSocketHandlers, broadcast };
