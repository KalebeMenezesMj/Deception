# Checkpoint 04 — Rodada de QA + Estilização

**Status:** ✅ concluído e testado

## Bugs encontrados e corrigidos

### 1. Host não reconectava (crítico)
Se o computador/painel recarregava a página, o `hostId` apontava para o socket antigo e o
host perdia o controle da sala.

**Correção:** `hostToken` na sala + evento `host:rejoin` (com validação de token) + salvamento
em `localStorage` no `host.js` com reconexão automática.

### 2. Jogador desconectado bloqueava a partida
`allConfirmed()` exigia confirmação de **todos** os jogadores, incluindo os desconectados —
se alguém saísse durante a confirmação de papéis, a partida travava.

**Correção:** `allConfirmed()` agora ignora jogadores com `connected === false`.

### 3. Feedback da acusação sumia
Após uma acusação errada, a mensagem "❌ Errou!" era sobrescrita pelo re-render
(que zerava o campo de feedback).

**Correção:** o feedback virou estado (`solveFeedback`), e o estado dos botões passou a
derivar de `badgeUsed` (após errar, o botão vira "Fechar" e a confirmação é desabilitada).

### 4. Nome ambíguo no código (manutenção)
O getter `connectedPlayers` retornava **todos** os jogadores (inclusive desconectados),
o que podia confundir. Documentado e corrigido onde importava (`allConfirmed`).

---

## Melhorias de estilização

- **Paleta refinada**: fundo com gradiente/vignette, painéis com `backdrop-filter`, sombras.
- **Tipografia**: títulos com mais peso, letter-spacing, cronômetro com `tabular-nums`.
- **Animações sutis**: fade-in na troca de telas, hover em botões/cartas/chips, pulso no cronômetro.
- **Cartas**: elevação no hover, sombras, borda colorida por tipo (pista/arma).
- **Indicador de conexão**: bolinha verde (conectado) / cinza (desconectado) nos jogadores.
- **Emojis por papel**: 🔬 Forense, 🔪 Assassino, 🥷 Cúmplice, 👁️ Testemunha, 🕵️ Investigador,
  🧪 Técnico, 🎭 Infiltrado, 🛡️ Segurança.
- **Responsividade**: ajustes para celular (tamanhos de cartas, botões, painéis).

---

## Testes (rodada completa)

| Suíte | Verificações |
|---|---|
| `test-flow.js` (vitória dos investigadores) | 26 ✓ |
| `test-murderer-win.js` (3 caminhos dos assassinos) | 6 ✓ |
| `test-reconnect.js` (jogador + host + token errado) | 9 ✓ |
| `test-expansion.js` (Fase dos Aliados) | 7 ✓ |
| **Total** | **48 ✓** |

## Smoke test de assets

Todos os endpoints retornam 200: `/`, `/play`, `/css/style.css`, `/js/*.js`,
`/api/scene-tiles`, `/api/qr`.

---

## Pontos ainda aceitos como simplificações (não são bugs)

- O cronômetro da apresentação **não** avança a rodada sozinho ao zerar (o host clica
  "Encerrar Rodada") — dá controle humano sobre o fim da discussão.
- A Fase dos Aliados ocorre **antes** da 1ª coleta de evidências (ver checkpoint 03).
- Se o assassino desconectar **no meio da escolha**, a partida fica aguardando (caso raro;
  reconexão automática cobre a maioria dos casos).
