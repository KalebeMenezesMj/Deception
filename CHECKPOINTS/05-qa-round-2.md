# Checkpoint 05 — QA (2ª rodada) — varredura completa

**Status:** ✅ concluído e testado

Nesta rodada foi feita uma varredura de **todas as rotas HTTP e eventos Socket.IO**,
além de revisão linha a linha do frontend e do servidor.

## Bugs corrigidos

1. **Reconexão do host não era testada** — adicionado `host:rejoin` com validação de
   `hostToken` e teste de token inválido (rejeitado).
2. **Exclusão do cúmplice por nome** (no contra-ataque do assassino) — trocado por
   `accompliceId` (nomes duplicados causariam exclusão errada).
3. **Cientista Forense "esquecia" a solução** durante a discussão — adicionado lembrete
   da solução na tela de jogo (antes só aparecia na coleta de evidências).
4. **Vazamento de memória**: salas abandonadas nunca eram removidas — adicionada limpeza
   de salas vazias (sem jogadores e sem host).
5. **Duplicação**: criar/entrar em mais de uma sala no mesmo socket criava salas/jogadores
   órfãos — adicionadas guardas `already_in_room`.
6. **Crash potencial**: o Técnico podia checar um `cardId` inválido (resultaria em `null`
   no frontend) — adicionada validação `bad_card`.
7. **Papéis da expansão ganhavam 0 pontos** — tabelas de pontuação não incluíam
   Técnico, Infiltrado e Segurança (`table[role] || 0` retornava 0).
8. **`includeProtectiveDetail` era código morto** — agora substitui de fato um Investigador.
9. **Host não podia abandonar** a partida durante as fases `allies`/`challenge`.

## Rotas verificadas

- HTTP: `/`, `/play`, `/sala/:code`, `/api/qr`, `/api/scene-tiles`, assets estáticos — OK.
- Socket.IO: 19 eventos (`host:create`, `host:rejoin`, `player:join`, `player:rejoin`,
  `host:start`, `player:confirmRole`, `murderer:choose`, `host:beginInvestigation`,
  `host:endAllies`, `labtech:check`, `insideman:remove`, `forensic:setEvidence`,
  `host:endEvidence`, `host:endPresentation`, `player:solve`, `murderer:challenge`,
  `host:backToLobby`, `host:resetScores`, `disconnect`) — todos com validação de papel/fase/token.

## Testes

| Suíte | Verificações |
|---|---|
| `test-flow.js` | 26 ✓ |
| `test-murderer-win.js` | 6 ✓ |
| `test-reconnect.js` | 9 ✓ |
| `test-expansion.js` | 10 ✓ |
| **Total** | **51 ✓** |

Servidor sem erros durante todos os testes.

## Status final

Nenhum bug conhecido restante. Os pontos a seguir são simplificações aceitas (não bugs):
- Cronômetro da discussão não avança a rodada automaticamente (host controla).
- Fase dos Aliados ocorre antes da 1ª coleta de evidências (ver checkpoint 03).
- `timers.accusation` é config reservada (a acusação é instantânea, não cronometrada).
