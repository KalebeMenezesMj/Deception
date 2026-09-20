# Checkpoint 02 — Regras completas do jogo base

**Status:** ✅ concluído e testado

## Objetivo
Completar as regras do jogo físico **Deception: Murder in Hong Kong** na versão digital.

## O que foi implementado

- **Coleta de evidências (Scene tiles + balas):**
  - O Cientista Forense posiciona **6 balas**: 1 na *Causa da Morte*, 1 no *Local do Crime* e 4 em outras pistas.
  - Painel de evidências público (todos veem as balas em tempo real).
  - Validação no servidor (papel/fase/número de balas).
- **3 rodadas** formais: coleta de evidências → apresentação (cronômetro) → próxima rodada.
- **Acusação ("Resolver o Crime"):**
  - Investigadores e Testemunha podem acusar **uma vez** (badge).
  - Erro → perde o badge; acerto → investigação resolvida.
- **Mecânica da Testemunha:** ao ser pego, o Assassino tenta identificar a Testemunha
  (se acertar, os culpados vencem).
- **Condições de vitória:**
  - Investigadores vencem ao resolver o crime.
  - Assassinos vencem se as acusações se esgotarem, se a testemunha for identificada,
    ou se o crime não for resolvido após 3 rodadas.
- **Resultado + placar acumulado** (pontuação configurável em `config.js`).
- **"Jogar novamente"** mantém jogadores e placar.

## Fases

`lobby → roles → cards → evidence → presentation → (challenge) → result`

## Pontuação (configurável em `lib/config.js`)

| Time vencedor | Cientista Forense | Testemunha | Investigador | Assassino | Cúmplice | Bônus |
|---|---|---|---|---|---|---|
| Investigadores | +2 | +2 | +1 | 0 | 0 | +3 (quem resolveu) |
| Assassinos | 0 | 0 | 0 | +2 | +2 | — |

## Testes

- `test/test-flow.js` — vitória dos investigadores (26) ✅
- `test/test-murderer-win.js` — 3 caminhos de vitória dos assassinos (6) ✅
