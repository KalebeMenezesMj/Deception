# Checkpoint 03 — Reconexão + Expansão Undercover Allies

**Status:** ✅ concluído e testado

## 1. Reconexão (identidade estável)

- Cada jogador tem um **ID estável (token)**, independente do socket.
- O token é salvo no `localStorage` do celular.
- Ao recarregar a página, o celular **reconecta automaticamente** (`player:rejoin`),
  mantendo papel, cartas e placar.
- Jogadores desconectados são marcados como ausentes (não removidos) e podem voltar.

## 2. Expansão Undercover Allies

### Novos papéis (entram automaticamente pelo nº de jogadores)

| Papel | Time | Mecânica |
|---|---|---|
| **Técnico de Laboratório** (7+) | Investigadores | Checa 1 carta para saber se faz parte da solução. |
| **Infiltrado** (8+) | Assassinos | Faz 1 jogador perder o badge. |
| **Segurança** (opcional, `config.js`) | Investigadores | Sabe quem é a Testemunha. |

### Fase dos Aliados

- Nova fase **`allies`**, entre a escolha do assassino e a 1ª coleta de evidências.
- **Técnico:** escolhe 1 carta (de qualquer jogador) → o servidor calcula e revela
  se ela **faz/não faz** parte da solução.
- **Infiltrado:** escolhe 1 jogador → esse jogador perde o badge (não pode mais acusar).
- O host conclui a fase com "Concluir Fase dos Aliados".

> Nota de fidelidade: a regra oficial posiciona a Fase dos Aliados entre a 1ª e a 2ª rodada.
> Nesta implementação ela ocorre **antes da 1ª coleta de evidências** (mesma mecânica, timing
> simplificado) — fácil de mover alterando `beginInvestigation`/`endPresentation` em `lib/room.js`.

## Distribuição de papéis (em `lib/config.js`)

| Jogadores | Papéis |
|---|---|
| 4–5 | Forense, Assassino, Investigadores |
| 6 | + Cúmplice, Testemunha |
| 7 | + Técnico de Laboratório |
| 8+ | + Infiltrado (restante: Investigadores) |

## Testes

- `test/test-reconnect.js` — reconexão (7) ✅
- `test/test-expansion.js` — Fase dos Aliados (7) ✅

## Total de verificações: 46 ✅
