'use strict';

(function () {
  const el = (id) => document.getElementById(id);

  let current = null; // último estado (hostView)
  let selectedPlayerId = null;

  // Reconexão do host (a página foi recarregada).
  let savedHost = null;
  try { savedHost = JSON.parse(localStorage.getItem('deception_host') || 'null'); } catch (e) {}
  if (savedHost && savedHost.code && savedHost.hostToken) {
    socket.emit('host:rejoin', { code: savedHost.code, hostToken: savedHost.hostToken }, (res) => {
      if (!res || !res.ok) localStorage.removeItem('deception_host');
      // Se der certo, os eventos 'state' assumem a interface.
    });
  }

  const PHASE_LABELS = {
    lobby: 'Lobby',
    roles: 'Distribuição de Papéis',
    cards: 'Escolha do Assassino',
    allies: 'Fase dos Aliados',
    evidence: 'Coleta de Evidências',
    presentation: 'Apresentação / Discussão',
    challenge: 'Contra-ataque do Assassino',
    result: 'Resultado',
  };

  // ---- Criação de sala -----------------------------------------------------
  el('btn-create').addEventListener('click', () => {
    el('btn-create').disabled = true;
    socket.emit('host:create');
  });

  socket.on('host:created', (data) => {
    el('btn-create').disabled = false;
    const { code, serverInfo, hostToken } = data;
    localStorage.setItem('deception_host', JSON.stringify({ code, hostToken }));
    el('room-code').textContent = code;

    const joinUrl = `http://${serverInfo.ip}:${serverInfo.port}/sala/${code}`;
    el('join-url').querySelector('.val').textContent = joinUrl;

    fetch(`/api/qr?text=${encodeURIComponent(joinUrl)}`)
      .then((r) => r.text())
      .then((dataUrl) => { el('room-qr').src = dataUrl; })
      .catch(() => {});
  });

  // ---- Botões --------------------------------------------------------------
  el('btn-start').addEventListener('click', () => socket.emit('host:start'));
  el('btn-investigate').addEventListener('click', () => socket.emit('host:beginInvestigation'));
  el('btn-end-allies').addEventListener('click', () => socket.emit('host:endAllies'));
  el('btn-end-evidence').addEventListener('click', () => socket.emit('host:endEvidence'));
  el('btn-end-presentation').addEventListener('click', () => socket.emit('host:endPresentation'));
  el('btn-play-again').addEventListener('click', () => socket.emit('host:backToLobby'));
  el('btn-lobby').addEventListener('click', () => socket.emit('host:backToLobby'));
  el('btn-reset-scores').addEventListener('click', () => socket.emit('host:resetScores'));

  // ---- Estado --------------------------------------------------------------
  socket.on('state', (state) => {
    if (!state || state.type !== 'host') return;
    current = state;
    render();
  });

  function render() {
    if (!current) return;
    if (current.phase === 'lobby') {
      showScreen('screen-room');
      renderRoom();
    } else {
      showScreen('screen-game');
      renderGame();
    }
  }

  function renderRoom() {
    el('player-count').textContent = current.playerCount;
    const list = el('player-list');
    list.innerHTML = '';
    current.players.forEach((p) => {
      const row = document.createElement('div');
      row.className = 'player-row';
      row.innerHTML =
        `<span class="player-dot${p.connected ? '' : ' off'}"></span><span class="player-name">${escapeHtml(p.name)}</span>` +
        `<span class="player-meta">${p.connected ? '' : 'desconectado · '}${p.score > 0 ? p.score + ' pts' : ''}</span>`;
      list.appendChild(row);
    });

    const canStart = current.playerCount >= current.minPlayers;
    el('btn-start').disabled = !canStart;
    el('start-hint').textContent = canStart
      ? 'Tudo pronto. Clique para sortear os papéis.'
      : `Mínimo de ${current.minPlayers} jogadores.`;
  }

  function renderGame() {
    el('phase-name').textContent = PHASE_LABELS[current.phase] || current.phase;
    el('round-indicator').textContent = current.round > 0 ? `${current.round}/${current.maxRounds}` : '—';
    startTicker(current.timer.running ? current.timer.endsAt : null, el('timer'));

    renderResult();
    renderEvidence();
    renderGamePlayers();
    renderScoreboard();
    renderSelectedPlayerCards();
    renderControls();
  }

  function renderEvidence() {
    const show = ['evidence', 'presentation', 'challenge', 'result'].includes(current.phase);
    el('evidence-panel').classList.toggle('hidden', !show);
    if (show) renderEvidenceBoard(el('evidence-board'), current.evidence);
  }

  function renderGamePlayers() {
    const list = el('game-player-list');
    list.innerHTML = '';

    if (!selectedPlayerId && current.players.length) selectedPlayerId = current.players[0].id;
    if (selectedPlayerId && !current.players.some((p) => p.id === selectedPlayerId)) {
      selectedPlayerId = current.players[0] ? current.players[0].id : null;
    }

    current.players.forEach((p) => {
      const row = document.createElement('div');
      row.className = 'player-row' + (p.id === selectedPlayerId ? ' active' : '');
      let status = '';
      if (current.phase === 'roles') status = p.confirmed ? '✔' : '…';
      if (current.phase === 'evidence' || current.phase === 'presentation') {
        status = p.badgeUsed ? '❌' : '●';
      }
      row.innerHTML =
        `<span class="player-dot${p.connected ? '' : ' off'}"></span><span class="player-name">${escapeHtml(p.name)}</span>` +
        `<span class="player-meta">${status}</span>`;
      row.addEventListener('click', () => {
        selectedPlayerId = p.id;
        renderSelectedPlayerCards();
        renderGamePlayers();
      });
      list.appendChild(row);
    });
  }

  function renderScoreboard() {
    const list = el('scoreboard');
    list.innerHTML = '';
    const sorted = current.players.slice().sort((a, b) => b.score - a.score);
    sorted.forEach((p) => {
      const row = document.createElement('div');
      row.className = 'player-row';
      row.innerHTML =
        `<span class="player-name">${escapeHtml(p.name)}</span>` +
        `<span class="player-meta badge-score">${p.score} pts</span>`;
      list.appendChild(row);
    });
  }

  function renderSelectedPlayerCards() {
    const nameEl = el('selected-player-name');
    const player = current.players.find((p) => p.id === selectedPlayerId);
    if (!player) {
      nameEl.textContent = '—';
      el('selected-clues').innerHTML = '';
      el('selected-means').innerHTML = '';
      return;
    }
    nameEl.textContent = player.name;
    const pc = current.cards[player.id] || { clues: [], means: [] };
    renderCardsGrid(el('selected-clues'), pc.clues, 'clue', { small: true });
    renderCardsGrid(el('selected-means'), pc.means, 'means', { small: true });
  }

  function renderControls() {
    const p = current.phase;
    el('btn-investigate').classList.toggle('hidden', p !== 'cards');
    el('btn-end-allies').classList.toggle('hidden', p !== 'allies');
    el('btn-end-evidence').classList.toggle('hidden', p !== 'evidence');
    el('btn-end-evidence').disabled = p === 'evidence' && !(current.evidence && current.evidence.complete);
    el('btn-end-presentation').classList.toggle('hidden', p !== 'presentation');
    el('btn-play-again').classList.toggle('hidden', p !== 'result');

    el('btn-lobby').classList.toggle('hidden', !['allies', 'evidence', 'presentation', 'challenge', 'result'].includes(p));
    el('btn-reset-scores').classList.toggle('hidden', p !== 'result');

    const hints = {
      roles: 'Aguardando todos confirmarem seus papéis...',
      cards: 'Aguarde o assassino escolher arma + evidência. Depois clique em Iniciar Investigação.',
      allies: 'O Técnico e o Infiltrado estão agindo em segredo. Conclua quando terminarem.',
      evidence: 'O Cientista Forense está posicionando as 6 balas. Conclua quando terminar.',
      presentation: 'Discussão em andamento. Encerre a rodada para avançar.',
      challenge: 'O assassino está tentando identificar a testemunha...',
      result: 'Partida finalizada.',
    };
    el('host-hint').textContent = hints[p] || '';
  }

  function renderResult() {
    const panel = el('result-panel');
    if (current.phase !== 'result' || !current.result) {
      panel.classList.add('hidden');
      return;
    }
    panel.classList.remove('hidden');
    const r = current.result;
    const win = r.winnerTeam === 'investigators';

    const reasonText = {
      solved: r.solverName ? `O crime foi resolvido por ${r.solverName}!` : 'O crime foi resolvido!',
      unsolved: 'O crime não foi resolvido a tempo.',
      badges_exhausted: 'Todas as tentativas de acusação falharam.',
      witness_identified: 'O assassino identificou a testemunha!',
    }[r.reason] || '';

    const sol = r.solution || {};
    panel.innerHTML =
      `<div class="result-title ${win ? 'result-win' : 'result-lose'}">` +
      (win ? 'Investigadores venceram' : 'Assassinos venceram') + `</div>` +
      `<p class="center muted mt-sm">${escapeHtml(reasonText)}</p>` +
      `<div class="solution-grid mt">` +
      `<div class="secret-box"><div class="lbl">O assassino era</div><div class="val">${escapeHtml(sol.murdererName || '—')}</div></div>` +
      `<div class="secret-box"><div class="lbl">Arma do crime</div><div class="val">${escapeHtml(sol.means ? sol.means.pt : '—')}</div></div>` +
      `<div class="secret-box"><div class="lbl">Evidência</div><div class="val">${escapeHtml(sol.clue ? sol.clue.pt : '—')}</div></div>` +
      (r.witnessName
        ? `<div class="secret-box"><div class="lbl">Testemunha</div><div class="val">${escapeHtml(r.witnessName)}</div></div>`
        : `<div class="secret-box"><div class="lbl">Resolvido por</div><div class="val">${escapeHtml(r.solverName || '—')}</div></div>`) +
      `</div>`;
  }
})();
