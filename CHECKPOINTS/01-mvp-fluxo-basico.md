# Checkpoint 01 — MVP: fluxo básico multiplayer

**Status:** ✅ concluído e testado

## Objetivo
Versão funcional mínima do **Deception: Murder in Hong Kong** digital, com o fluxo básico
de sala → papéis → cartas → painel, rodando em rede local (computador como painel + celulares).

## O que foi implementado

- **Servidor Node.js + Express + Socket.IO** (tempo real) + **qrcode** (QR Code no servidor).
- Criação de sala com **código de 5 caracteres** + **QR Code**.
- Entrada dos jogadores pelo celular (código ou URL `/sala/CODIGO`).
- **Lobby em tempo real** (lista de jogadores sincronizada).
- **Sorteio secreto dos papéis** (Cientista Forense, Assassino, Cúmplice, Testemunha, Investigadores).
- **Distribuição de cartas** (4 Pistas + 4 Armas por jogador; públicas, como no jogo físico).
- **Escolha secreta de arma + evidência** pelo assassino.
- Revelação da solução **apenas** ao Cientista Forense (e do assassino ao Cúmplice).
- **Painel principal** no computador (fase, cronômetro, jogadores, cartas).
- **Cronômetro sincronizado** (servidor é a fonte do tempo).
- **Sistema básico de fases**: lobby → papéis → cartas → investigação.

## Segurança (requisito crítico)

- O servidor envia **visão sanitizada** por destinatário (`viewFor` / `hostView`).
- O **computador** nunca recebe papéis nem a solução.
- Cada **jogador** recebe só o próprio papel e as próprias cartas.
- Nada é escondido apenas por CSS/JS no frontend.

## Arquivos principais

- `server.js`, `lib/config.js`, `lib/roles.js`, `lib/cards.js`, `lib/room.js`, `lib/sockets.js`
- `public/index.html` (host), `public/play.html` (jogador)
- `public/js/common.js`, `public/js/host.js`, `public/js/player.js`

## Testes

- `test/test-flow.js` — fluxo básico (26 verificações) ✅
