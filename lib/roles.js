'use strict';

/**
 * Definição dos papéis do jogo base e suas metadados.
 * Cada papel pertence a um time e carrega um texto de instrução exibido
 * apenas no celular do jogador que o recebeu.
 */
const ROLES = {
  forensicScientist: {
    id: 'forensicScientist',
    name: 'Cientista Forense',
    team: 'investigators',
    tagline: 'Você conhece a verdade.',
    instruction:
      'Você conhece a solução do crime. Deve guiar os investigadores usando ' +
      'APENAS os ladrilhos de cena (Scene tiles) — sem falar, gesticular ou dar pistas.',
  },
  murderer: {
    id: 'murderer',
    name: 'Assassino',
    team: 'murderers',
    tagline: 'Você é o assassino.',
    instruction:
      'Escolha secretamente 1 Pista (evidência) e 1 Meio (arma) como a solução do crime. ' +
      'Seu objetivo é permanecer escondido e impedir que descubram sua identidade.',
  },
  accomplice: {
    id: 'accomplice',
    name: 'Cúmplice',
    team: 'murderers',
    tagline: 'Você é o cúmplice.',
    instruction:
      'Você conhece quem é o Assassino. Ajude-o a desviar as suspeitas e a confundir os investigadores.',
  },
  witness: {
    id: 'witness',
    name: 'Testemunha',
    team: 'investigators',
    tagline: 'Você é a testemunha.',
    instruction:
      'Você viu os culpados, mas não sabe dizer qual é o Assassino e qual é o Cúmplice. ' +
      'Ajude os investigadores sem se expor: se o Assassino te identificar, os culpados vencem.',
  },
  investigator: {
    id: 'investigator',
    name: 'Investigador',
    team: 'investigators',
    tagline: 'Você é um investigador.',
    instruction:
      'Analise as pistas do Cientista Forense e descubra qual é a evidência e a arma do crime — e de quem são.',
  },

  // --- Expansão Undercover Allies ---
  labTechnician: {
    id: 'labTechnician',
    name: 'Técnico de Laboratório',
    team: 'investigators',
    tagline: 'Você é o técnico de laboratório.',
    instruction:
      'Na Fase dos Aliados, você pode checar 1 carta em jogo para saber se ela faz parte da solução do crime.',
  },
  insideMan: {
    id: 'insideMan',
    name: 'Infiltrado',
    team: 'murderers',
    tagline: 'Você é o infiltrado.',
    instruction:
      'Na Fase dos Aliados, você faz com que 1 outro jogador perca o badge (a tentativa de acusação).',
  },
  protectiveDetail: {
    id: 'protectiveDetail',
    name: 'Segurança',
    team: 'investigators',
    tagline: 'Você é a segurança da testemunha.',
    instruction:
      'Você sabe quem é a Testemunha. Proteja-a: se o Assassino a identificar, os culpados vencem.',
  },
};

// Papéis que devem enxergar informação secreta de outros jogadores no sorteio.
const ROLE_ORDER = ['forensicScientist', 'murderer', 'accomplice', 'witness', 'investigator'];

module.exports = { ROLES, ROLE_ORDER };
