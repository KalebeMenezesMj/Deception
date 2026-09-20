'use strict';

/**
 * Configuração central do jogo.
 * As regras são configuráveis aqui para que possam ser ajustadas sem
 * mexer na lógica (requisito: "estruturar o sistema para que as regras
 * possam ser facilmente configuradas").
 */
const gameConfig = {
  // Sala / rede
  minPlayers: 4,
  maxPlayers: 12,
  roomCodeLength: 5,
  port: 3000,

  // Cartas por jogador (como no jogo físico: públicas, viradas para cima)
  clueCardsPerPlayer: 4,
  meansCardsPerPlayer: 4,

  // Papéis por quantidade de jogadores (jogo base + expansão Undercover Allies).
  // Recebe o número de jogadores e devolve um array de ids de papel.
  rolesForPlayerCount(playerCount) {
    const set = ['forensicScientist', 'murderer'];

    // Cúmplice e Testemunha entram a partir de 6 jogadores.
    if (playerCount >= 6) {
      set.push('accomplice', 'witness');
    }

    // Expansão Undercover Allies: Técnico de Laboratório (7+) e Infiltrado (8+).
    if (playerCount >= 7) {
      set.push('labTechnician');
    }
    if (playerCount >= 8) {
      set.push('insideMan');
    }

    // Preenche o restante com Investigadores.
    while (set.length < playerCount) {
      set.push('investigator');
    }

    // "Segurança" (opcional): substitui um Investigador em jogos com Testemunha.
    if (this.includeProtectiveDetail && playerCount >= 6) {
      const idx = set.indexOf('investigator');
      if (idx !== -1) set[idx] = 'protectiveDetail';
    }

    return set;
  },

  // "Segurança" (Protective Detail) é opcional; se ativado, substitui um Investigador
  // em jogos com Testemunha.
  includeProtectiveDetail: false,

  // Rodadas (jogo físico: 3 rodadas de evidência + apresentação)
  rounds: 3,

  // Tempos (em segundos)
  timers: {
    discussion: 300, // 5 min por rodada de discussão (ajustável)
    accusation: 120,
  },

  // Pontuação acumulada ao final de cada partida (ajustável).
  scoring: {
    // Time dos investigadores vence (alguém resolveu o crime):
    investigatorWin: {
      forensicScientist: 2,
      witness: 2,
      investigator: 1,
      labTechnician: 1,
      protectiveDetail: 2,
      murderer: 0,
      accomplice: 0,
      insideMan: 0,
    },
    // Time dos assassinos vence (não resolveram, ou testemunha identificada):
    murdererWin: {
      murderer: 2,
      accomplice: 2,
      insideMan: 2,
      forensicScientist: 0,
      witness: 0,
      investigator: 0,
      labTechnician: 0,
      protectiveDetail: 0,
    },
    solveBonus: 3, // bônus para quem resolveu o crime
  },
};

module.exports = { gameConfig };
