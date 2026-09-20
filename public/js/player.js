'use strict';

(function () {
  const el = (id) => document.getElementById(id);

  let current = null;
  let selectedPlayerId = null;

  // Seleção do assassino
  let murClue = null;
  let murMeans = null;

  // Seleção de evidências do forense
  let evSel = null;
  let sceneTiles = null;

  // Acusação
  let solveOpen = false;
  let solveTargetId = null;
  let solveClueId = null;
  let solveMeansId = null;
  let solveFeedback = '';

  // Expansão: Fase dos Aliados
  let insideManActed = false;

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

  const JOIN_ERRORS = {
    room_not_found: 'Sala não encontrada. Confira o código.',
    invalid_name: 'Informe um nome.',
    game_started: 'Esta partida já começou.',
    room_full: 'Esta sala está cheia.',
  };

  // -------------------------------------------------------------------------
  // Entrar / reconectar
  // -------------------------------------------------------------------------
  const urlCode = roomCodeFromUrl();
  if (urlCode) el('join-code').value = urlCode;

  let saved = null;
  try { saved = JSON.parse(localStorage.getItem('deception_session') || 'null'); } catch (e) {}

  // Reconexão automática (a página foi recarregada).
  if (saved && saved.code && saved.token) {
    if (urlCode && urlCode !== saved.code) {
      localStorage.removeItem('deception_session');
    } else {
      socket.emit('player:rejoin', { code: saved.code, token: saved.token }, (res) => {
        if (!res || !res.ok) localStorage.removeItem('deception_session');
        // Se der certo, os eventos 'state' assumem a interface.
      });
    }
  }

  el('btn-join').addEventListener('click', join);
  el('join-name').addEventListener('keydown', (e) => { if (e.key === 'Enter') join(); });
  el('join-code').addEventListener('keydown', (e) => { if (e.key === 'Enter') el('join-name').focus(); });

  function join() {
    const code = el('join-code').value.trim().toUpperCase();
    const name = el('join-name').value.trim();
    el('join-error').textContent = '';
    if (!code || !name) { el('join-error').textContent = 'Informe o código e o nome.'; return; }
    el('btn-join').disabled = true;
    socket.emit('player:join', { code, name }, (res) => {
      el('btn-join').disabled = false;
      if (!res || !res.ok) {
        el('join-error').textContent = (res && JOIN_ERRORS[res.error]) || 'Erro ao entrar.';
      } else {
        localStorage.setItem('deception_session', JSON.stringify({ code, token: res.token, name }));
      }
    });
  }

  // -------------------------------------------------------------------------
  // Ações
  // -------------------------------------------------------------------------
  el('btn-understood').addEventListener('click', () => socket.emit('player:confirmRole'));
  el('btn-confirm-murder').addEventListener('click', () => {
    if (murClue && murMeans) socket.emit('murderer:choose', { clueId: murClue.id, meansId: murMeans.id });
  });
  el('p-accuse').addEventListener('click', () => { solveOpen = true; solveTargetId = null; solveClueId = null; solveMeansId = null; solveFeedback = ''; renderSolve(); });
  el('btn-cancel-solve').addEventListener('click', () => { solveOpen = false; render(); });
  el('btn-confirm-solve').addEventListener('click', () => {
    if (!solveTargetId || !solveClueId || !solveMeansId) return;
    socket.emit('player:solve', { targetId: solveTargetId, clueId: solveClueId, meansId: solveMeansId }, (res) => {
      if (!res || !res.ok) {
        solveFeedback = 'Não foi possível acusar agora.';
        el('solve-feedback').textContent = solveFeedback;
        return;
      }
      if (res.wrong) {
        solveFeedback = '❌ Errou! Você perdeu sua única tentativa.';
        el('solve-feedback').textContent = solveFeedback;
        // A tela permanece aberta; o re-render mostra "Fechar" (badgeUsed).
      } else {
        solveOpen = false;
      }
    });
  });

  // -------------------------------------------------------------------------
  // Estado
  // -------------------------------------------------------------------------
  socket.on('state', (state) => {
    if (!state || state.type !== 'player') return;
    current = state;
    if (['lobby', 'roles', 'cards'].includes(current.phase)) { evSel = null; insideManActed = false; } // novo jogo
    render();
  });

  function render() {
    if (!current) return;
    if (solveOpen) { renderSolve(); return; }

    switch (current.phase) {
      case 'lobby': renderLobby(); break;
      case 'roles': renderRole(); break;
      case 'cards': renderCardsPhase(); break;
      case 'allies': renderAlliesPhase(); break;
      case 'evidence': renderEvidencePhase(); break;
      case 'challenge': renderChallengePhase(); break;
      case 'result': renderResult(); break;
      default: renderGame(); break; // presentation
    }
  }

  // -------------------------------------------------------------------------
  // Lobby / Papel
  // -------------------------------------------------------------------------
  function renderLobby() {
    showScreen('screen-lobby');
    el('lobby-code').textContent = current.code;
  }

  function renderRole() {
    showScreen('screen-role');
    const role = current.self.role;
    el('role-card').innerHTML =
      `<div class="role-name ${role.team}">${ROLE_EMOJI[role.id] || ''} ${escapeHtml(role.name)}</div>` +
      `<div class="role-tagline">${escapeHtml(role.tagline)}</div>` +
      `<div class="role-instruction">${escapeHtml(role.instruction)}</div>`;

    const secretBox = el('role-secret');
    secretBox.innerHTML = '';
    const s = current.secrets || {};
    if (s.murdererName) secretBox.appendChild(secretEl('O Assassino é', s.murdererName));
    if (s.accompliceName) secretBox.appendChild(secretEl('O Cúmplice é', s.accompliceName));
    if (s.witnessName) secretBox.appendChild(secretEl('A Testemunha é', s.witnessName));
    if (s.culprits && s.culprits.length) secretBox.appendChild(secretEl('Os culpados são', s.culprits.join(' e ')));

    const confirmed = current.self.confirmed;
    el('btn-understood').classList.toggle('hidden', confirmed);
    el('role-waiting').classList.toggle('hidden', !confirmed);
  }

  function secretEl(label, value) {
    const box = document.createElement('div');
    box.className = 'secret-box mt-sm';
    box.innerHTML = `<div class="lbl">${escapeHtml(label)}</div><div class="val">${escapeHtml(value)}</div>`;
    return box;
  }

  // -------------------------------------------------------------------------
  // Fase de cartas
  // -------------------------------------------------------------------------
  function renderCardsPhase() {
    const roleId = current.self.role.id;
    const hasSolution = !!(current.secrets && current.secrets.solution);

    if (roleId === 'murderer' && !hasSolution) { renderMurdererChoice(); return; }
    if (roleId === 'forensicScientist' || (roleId === 'murderer' && hasSolution)) { renderSetupDone(); return; }
    renderGame(); // investigador/cúmplice/testemunha veem as cartas enquanto aguardam
  }

  function renderSetupDone() {
    showScreen('screen-setup-done');
    const body = el('setup-done-body');
    const roleId = current.self.role.id;
    const hasSolution = !!(current.secrets && current.secrets.solution);

    if (roleId === 'murderer' && hasSolution) {
      const sol = current.secrets.solution;
      body.innerHTML =
        `<div class="role-name murderers" style="font-size:26px;">ESCOLHAS CONFIRMADAS</div>` +
        `<div class="secret-box mt"><div class="lbl">Arma do crime</div><div class="val">${escapeHtml(sol.means.pt)}</div></div>` +
        `<div class="secret-box mt-sm"><div class="lbl">Evidência</div><div class="val">${escapeHtml(sol.clue.pt)}</div></div>` +
        `<p class="muted mt">Aguardando o início da investigação...</p>`;
    } else if (roleId === 'forensicScientist' && hasSolution) {
      const sol = current.secrets.solution;
      body.innerHTML =
        `<div class="role-name investigators" style="font-size:24px;">A SOLUÇÃO DO CRIME</div>` +
        `<div class="secret-box mt"><div class="lbl">Evidência (pista)</div><div class="val">${escapeHtml(sol.clue.pt)}</div></div>` +
        `<div class="secret-box mt-sm"><div class="lbl">Arma (meio)</div><div class="val">${escapeHtml(sol.means.pt)}</div></div>` +
        `<div class="secret-box mt-sm"><div class="lbl">Escolhida por</div><div class="val">${escapeHtml(sol.murdererName)}</div></div>` +
        `<p class="muted mt">Aguardando o início da investigação...</p>`;
    } else {
      body.innerHTML =
        `<p style="font-size:20px;">As cartas foram distribuídas.</p>` +
        `<p class="muted mt">Aguardando a escolha do assassino...</p>`;
    }
  }

  function renderMurdererChoice() {
    showScreen('screen-murderer');
    murClue = murClue && current.self.clues.some((c) => c.id === murClue.id) ? murClue : null;
    murMeans = murMeans && current.self.means.some((m) => m.id === murMeans.id) ? murMeans : null;

    renderCardsGrid(el('murder-clues'), current.self.clues, 'clue', {
      small: true, selectable: true,
      selected: (c) => murClue && c.id === murClue.id,
      onClick: (c) => { murClue = c.id === (murClue && murClue.id) ? null : c; refreshMurderer(); },
    });
    renderCardsGrid(el('murder-means'), current.self.means, 'means', {
      small: true, selectable: true,
      selected: (c) => murMeans && c.id === murMeans.id,
      onClick: (c) => { murMeans = c.id === (murMeans && murMeans.id) ? null : c; refreshMurderer(); },
    });

    el('btn-confirm-murder').disabled = !(murClue && murMeans);
    el('murder-summary').textContent = murClue && murMeans
      ? `Arma: ${murMeans.pt}  •  Evidência: ${murClue.pt}`
      : 'Selecione uma evidência e uma arma.';
  }

  function refreshMurderer() { renderMurdererChoice(); }

  // -------------------------------------------------------------------------
  // Coleta de evidências
  // -------------------------------------------------------------------------
  function renderEvidencePhase() {
    if (current.self.role.id === 'forensicScientist') renderForensicEvidence();
    else renderGame();
  }

  function renderForensicEvidence() {
    if (!evSel) {
      const raw = (current.secrets && current.secrets.rawEvidence) || {};
      evSel = {
        causeOfDeath: raw.causeOfDeath != null ? raw.causeOfDeath : null,
        location: raw.location || null,
        clues: (raw.clues || []).slice(),
      };
    }
    if (!sceneTiles) {
      loadSceneTiles().then((st) => { sceneTiles = st; renderEvidenceBuilder(); });
    } else {
      renderEvidenceBuilder();
    }
  }

  function renderEvidenceBuilder() {
    showScreen('screen-evidence');
    el('ev-round').textContent = current.round;

    const sol = current.secrets.solution;
    el('evidence-solution').innerHTML = sol
      ? `<div class="lbl">Solução (secreta)</div><div class="val">${escapeHtml(sol.clue.pt)} + ${escapeHtml(sol.means.pt)} (por ${escapeHtml(sol.murdererName)})</div>`
      : '<div class="lbl">Solução ainda não definida</div><div class="val">—</div>';

    updateEvidenceProgress();
    const b = el('evidence-builder');
    b.innerHTML = '';
    buildCauseOfDeath(b);
    buildLocation(b);
    buildClues(b);
  }

  function updateEvidenceProgress() {
    const n = (evSel.causeOfDeath != null ? 1 : 0) + (evSel.location ? 1 : 0) + evSel.clues.length;
    el('evidence-progress').textContent =
      `Balas colocadas: ${n}/6${n === 6 ? ' — pronto! Aguarde o host concluir.' : ''}`;
  }

  function emitEvidence() {
    socket.emit('forensic:setEvidence', {
      causeOfDeath: evSel.causeOfDeath,
      location: evSel.location,
      clues: evSel.clues,
    });
  }

  function chip(text, selected, onClick) {
    const c = document.createElement('span');
    c.className = 'chip' + (selected ? ' selected' : '');
    c.textContent = text;
    c.addEventListener('click', onClick);
    return c;
  }

  function buildCauseOfDeath(container) {
    const g = document.createElement('div');
    g.className = 'evidence-group';
    g.innerHTML = '<h3>Causa da Morte</h3>';
    const opts = document.createElement('div');
    opts.className = 'tile-options';
    sceneTiles.causeOfDeath.options.forEach((o, i) => {
      opts.appendChild(chip(o, evSel.causeOfDeath === i, () => {
        evSel.causeOfDeath = evSel.causeOfDeath === i ? null : i;
        emitEvidence(); renderEvidenceBuilder();
      }));
    });
    g.appendChild(opts);
    container.appendChild(g);
  }

  function buildLocation(container) {
    const g = document.createElement('div');
    g.className = 'evidence-group';
    g.innerHTML = '<h3>Local do Crime</h3>';
    sceneTiles.location.groups.forEach((grp, gi) => {
      const row = document.createElement('div');
      row.className = 'location-row';
      row.innerHTML = `<div class="muted" style="font-size:12px;">Conjunto ${gi + 1}</div>`;
      const opts = document.createElement('div');
      opts.className = 'tile-options';
      grp.forEach((o, oi) => {
        const sel = evSel.location && evSel.location.group === gi && evSel.location.option === oi;
        opts.appendChild(chip(o, sel, () => {
          evSel.location = sel ? null : { group: gi, option: oi };
          emitEvidence(); renderEvidenceBuilder();
        }));
      });
      row.appendChild(opts);
      g.appendChild(row);
    });
    container.appendChild(g);
  }

  function buildClues(container) {
    const g = document.createElement('div');
    g.className = 'evidence-group';
    g.innerHTML = '<h3>Outras pistas (escolha até 4)</h3>';
    sceneTiles.details.forEach((t) => {
      const tile = document.createElement('div');
      tile.className = 'tile' + (evSel.clues.some((c) => c.tileKey === t.key) ? ' selected' : '');
      tile.innerHTML = `<div class="tile-title">${escapeHtml(t.title.pt)}</div>`;
      const opts = document.createElement('div');
      opts.className = 'tile-options';
      const sel = evSel.clues.find((c) => c.tileKey === t.key);
      t.options.forEach((o, i) => {
        opts.appendChild(chip(o, sel && sel.optionIndex === i, () => toggleClue(t.key, i)));
      });
      tile.appendChild(opts);
      g.appendChild(tile);
    });
    container.appendChild(g);
  }

  function toggleClue(key, idx) {
    const existing = evSel.clues.find((c) => c.tileKey === key);
    if (existing) {
      if (existing.optionIndex === idx) evSel.clues = evSel.clues.filter((c) => c.tileKey !== key);
      else existing.optionIndex = idx;
    } else {
      if (evSel.clues.length >= 4) { updateEvidenceProgress(); el('evidence-progress').textContent += ' (máximo 4 pistas)'; return; }
      evSel.clues.push({ tileKey: key, optionIndex: idx });
    }
    emitEvidence();
    renderEvidenceBuilder();
  }

  // -------------------------------------------------------------------------
  // Fase dos Aliados (expansão Undercover Allies)
  // -------------------------------------------------------------------------
  function renderAlliesPhase() {
    const roleId = current.self.role.id;
    if (roleId === 'labTechnician') renderAlliesLabtech();
    else if (roleId === 'insideMan') renderAlliesInsideman();
    else renderGame();
  }

  function renderAlliesLabtech() {
    const lc = current.secrets && current.secrets.labCheck;
    showScreen('screen-allies-labtech');
    const res = el('lab-result');

    if (lc) {
      res.classList.remove('hidden');
      res.innerHTML =
        `<div class="lbl">Resultado da checagem</div>` +
        `<div class="val">${escapeHtml(lc.card.pt)} — ${lc.isSolution ? 'FAZ parte da solução' : 'NÃO faz parte da solução'}</div>`;
      el('lab-player-tabs').innerHTML = '';
      el('lab-clues').innerHTML = '';
      el('lab-means').innerHTML = '';
      return;
    }

    res.classList.add('hidden');
    if (!selectedPlayerId || !current.players.some((p) => p.id === selectedPlayerId)) {
      selectedPlayerId = current.players[0] ? current.players[0].id : current.self.id;
    }
    renderLabTabs();
    renderLabCards();
  }

  function renderLabTabs() {
    const tabs = el('lab-player-tabs');
    tabs.innerHTML = '';
    current.players.forEach((p) => {
      const row = document.createElement('div');
      row.className = 'player-row' + (p.id === selectedPlayerId ? ' active' : '');
      row.style.width = 'auto';
      row.innerHTML = `<span class="player-name" style="font-size:14px;">${escapeHtml(p.name)}</span>`;
      row.addEventListener('click', () => { selectedPlayerId = p.id; renderLabTabs(); renderLabCards(); });
      tabs.appendChild(row);
    });
  }

  function renderLabCards() {
    el('lab-selected-name').textContent =
      (current.players.find((p) => p.id === selectedPlayerId) || {}).name || '—';
    const pc = current.cards[selectedPlayerId] || { clues: [], means: [] };
    renderCardsGrid(el('lab-clues'), pc.clues, 'clue', {
      small: true, selectable: true,
      onClick: (c) => socket.emit('labtech:check', { cardId: c.id }),
    });
    renderCardsGrid(el('lab-means'), pc.means, 'means', {
      small: true, selectable: true,
      onClick: (c) => socket.emit('labtech:check', { cardId: c.id }),
    });
  }

  function renderAlliesInsideman() {
    showScreen('screen-allies-insideman');
    const list = el('insideman-targets');
    list.innerHTML = '';
    if (insideManActed) {
      list.innerHTML = '<p class="muted center">✔ Feito. Aguarde o host concluir.</p>';
      return;
    }
    current.players.filter((p) => p.id !== current.self.id).forEach((p) => {
      const row = document.createElement('div');
      row.className = 'player-row';
      row.innerHTML = `<span class="player-dot"></span><span class="player-name">${escapeHtml(p.name)}</span>`;
      row.addEventListener('click', () => {
        socket.emit('insideman:remove', { targetId: p.id }, (res) => {
          if (res && res.ok) insideManActed = true;
          renderAlliesInsideman();
        });
      });
      list.appendChild(row);
    });
  }

  // -------------------------------------------------------------------------
  // Contra-ataque (assassino identifica a testemunha)
  // -------------------------------------------------------------------------
  function renderChallengePhase() {
    if (current.self.role.id === 'murderer') renderChallenge();
    else renderGame();
  }

  function renderChallenge() {
    showScreen('screen-challenge');
    const list = el('challenge-targets');
    list.innerHTML = '';
    const candidates = current.players.filter((p) =>
      p.id !== current.self.id && p.id !== (current.secrets.accompliceId));
    candidates.forEach((p) => {
      const row = document.createElement('div');
      row.className = 'player-row';
      row.innerHTML = `<span class="player-dot"></span><span class="player-name">${escapeHtml(p.name)}</span>`;
      row.addEventListener('click', () => socket.emit('murderer:challenge', { guessedWitnessId: p.id }));
      list.appendChild(row);
    });
  }

  // -------------------------------------------------------------------------
  // Acusação (resolver o crime)
  // -------------------------------------------------------------------------
  function renderSolve() {
    showScreen('screen-solve');
    const targets = current.players.filter((p) => p.id !== current.self.id);

    const tEl = el('solve-targets');
    tEl.innerHTML = '';
    targets.forEach((p) => {
      const row = document.createElement('div');
      row.className = 'player-row' + (p.id === solveTargetId ? ' active' : '');
      row.innerHTML = `<span class="player-dot"></span><span class="player-name">${escapeHtml(p.name)}</span>`;
      row.addEventListener('click', () => {
        solveTargetId = p.id; solveClueId = null; solveMeansId = null;
        renderSolve();
      });
      tEl.appendChild(row);
    });

    const cardsEl = el('solve-cards');
    cardsEl.innerHTML = '';
    if (solveTargetId) {
      const pc = current.cards[solveTargetId] || { clues: [], means: [] };
      cardsEl.innerHTML = '<div class="section-title mt">Evidência (pista):</div>';
      const cg = document.createElement('div');
      cg.className = 'cards-grid';
      renderCardsGrid(cg, pc.clues, 'clue', {
        small: true, selectable: true,
        selected: (c) => solveClueId === c.id,
        onClick: (c) => { solveClueId = solveClueId === c.id ? null : c.id; renderSolve(); },
      });
      cardsEl.appendChild(cg);

      cardsEl.appendChild(Object.assign(document.createElement('div'), { className: 'section-title mt', innerHTML: 'Arma (meio):' }));
      const mg = document.createElement('div');
      mg.className = 'cards-grid';
      renderCardsGrid(mg, pc.means, 'means', {
        small: true, selectable: true,
        selected: (c) => solveMeansId === c.id,
        onClick: (c) => { solveMeansId = solveMeansId === c.id ? null : c.id; renderSolve(); },
      });
      cardsEl.appendChild(mg);
    }

    const failed = current.self.badgeUsed;
    el('btn-confirm-solve').disabled = failed || !(solveTargetId && solveClueId && solveMeansId);
    el('btn-cancel-solve').textContent = failed ? 'Fechar' : 'Cancelar';
    el('solve-feedback').textContent = solveFeedback;
  }

  // -------------------------------------------------------------------------
  // Jogo em andamento (investigadores e demais)
  // -------------------------------------------------------------------------
  function renderGame() {
    showScreen('screen-game');
    el('p-phase').textContent = PHASE_LABELS[current.phase] || current.phase;
    el('p-round').textContent = current.round > 0 ? current.round : '—';
    startTicker(current.timer.running ? current.timer.endsAt : null, el('p-timer'));

    el('p-role').querySelector('.val').textContent =
      current.self.role ? `${ROLE_EMOJI[current.self.role.id] || ''} ${current.self.role.name}` : '—';

    // O Cientista Forense precisa lembrar a solução durante a discussão.
    const solBox = el('p-solution');
    if (current.self.role.id === 'forensicScientist' && current.secrets && current.secrets.solution) {
      const sol = current.secrets.solution;
      solBox.classList.remove('hidden');
      solBox.innerHTML =
        `<div class="section-title">Solução do crime (secreta)</div>` +
        `<div class="secret-box"><div class="lbl">Evidência + Arma</div><div class="val">${escapeHtml(sol.clue.pt)} + ${escapeHtml(sol.means.pt)}</div></div>`;
    } else {
      solBox.classList.add('hidden');
    }

    renderEvidenceBoard(el('p-evidence'), current.evidence);

    if (!selectedPlayerId || !current.players.some((p) => p.id === selectedPlayerId)) {
      selectedPlayerId = current.self.id;
    }
    renderPlayerTabs();
    renderPlayerCards();

    el('p-accuse').classList.toggle('hidden', !current.self.canSolve);
  }

  function renderPlayerTabs() {
    const tabs = el('p-player-tabs');
    tabs.innerHTML = '';
    current.players.forEach((p) => {
      const row = document.createElement('div');
      row.className = 'player-row' + (p.id === selectedPlayerId ? ' active' : '');
      row.style.width = 'auto';
      row.innerHTML =
        `<span class="player-dot${p.connected ? '' : ' off'}"></span>` +
        `<span class="player-name" style="font-size:14px;">${escapeHtml(p.name)}${p.id === current.self.id ? ' (você)' : ''}</span>`;
      row.addEventListener('click', () => {
        selectedPlayerId = p.id;
        renderPlayerTabs();
        renderPlayerCards();
      });
      tabs.appendChild(row);
    });
  }

  function renderPlayerCards() {
    el('p-selected-name').textContent =
      selectedPlayerId === current.self.id ? 'você' : (current.players.find((p) => p.id === selectedPlayerId) || {}).name;

    const pc = current.cards[selectedPlayerId] || { clues: [], means: [] };
    renderCardsGrid(el('p-clues'), pc.clues, 'clue', { small: true });
    renderCardsGrid(el('p-means'), pc.means, 'means', { small: true });
  }

  // -------------------------------------------------------------------------
  // Resultado
  // -------------------------------------------------------------------------
  function renderResult() {
    showScreen('screen-result');
    const r = current.result;
    const body = el('player-result-body');
    if (!r) { body.innerHTML = '<p class="center muted">Partida finalizada.</p>'; return; }

    const iWon = current.self.role.team === r.winnerTeam;
    const sol = r.solution || {};

    const reasonText = {
      solved: r.solverName ? `O crime foi resolvido por ${r.solverName}.` : 'O crime foi resolvido.',
      unsolved: 'O crime não foi resolvido a tempo.',
      badges_exhausted: 'Todas as acusações falharam.',
      witness_identified: 'O assassino identificou a testemunha!',
    }[r.reason] || '';

    body.innerHTML =
      `<div class="result-title ${iWon ? 'result-win' : 'result-lose'}">${iWon ? 'Você venceu!' : 'Você perdeu'}</div>` +
      `<p class="center muted mt-sm">${escapeHtml(reasonText)}</p>` +
      `<div class="solution-grid mt">` +
      `<div class="secret-box"><div class="lbl">O assassino era</div><div class="val">${escapeHtml(sol.murdererName || '—')}</div></div>` +
      `<div class="secret-box"><div class="lbl">Arma do crime</div><div class="val">${escapeHtml(sol.means ? sol.means.pt : '—')}</div></div>` +
      `<div class="secret-box"><div class="lbl">Evidência</div><div class="val">${escapeHtml(sol.clue ? sol.clue.pt : '—')}</div></div>` +
      `</div>` +
      `<div class="secret-box mt"><div class="lbl">Seu placar</div><div class="val">${current.self.score} pts</div></div>`;
  }
})();
