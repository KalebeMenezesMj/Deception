# Deception — Murder in Hong Kong (versão digital multiplayer local)

Versão digital do jogo de tabuleiro **Deception: Murder in Hong Kong**, para jogar na
mesma rede local (LAN): o **computador é o painel principal** e cada jogador usa o
**próprio celular** como controle individual, tudo em tempo real.

Inclui o **jogo base completo** e a **expansão Undercover Allies**.

## Requisitos

- [Node.js](https://nodejs.org) **16+** instalado no computador que será o servidor/painel.
- Todos os dispositivos (computador + celulares) na **mesma rede Wi-Fi**.

## Como rodar

```bash
# 1. Instale as dependências (uma única vez)
npm install

# 2. Inicie o servidor
npm start
```

O servidor imprime no terminal os endereços:

```
Computador (host):   http://192.168.0.10:3000/
Celulares (jogar):   http://192.168.0.10:3000/play
```

## Como jogar

1. No **computador**, abra `http://<ip>:3000/` e clique em **CRIAR PARTIDA**.
2. Aparece o **código da sala** (ex.: `A7K9P`), um **QR Code** e a lista de jogadores.
3. Nos **celulares**, escaneie o QR Code **ou** abra `http://<ip>:3000/sala/A7K9P`
   (ou `/play` e digite o código), informe o nome e clique **ENTRAR NA PARTIDA**.
4. Quando todos estiverem no lobby, o computador clica **INICIAR PARTIDA**.
5. O sistema **sorteia os papéis** em segredo (cada um vê só o seu no celular).
6. Cada jogador clica **ENTENDI**.
7. As **cartas são distribuídas** (públicas, como no jogo físico).
8. O **assassino** escolhe, só no próprio celular, a **arma** e a **evidência**.
9. (7+ jogadores) Ocorre a **Fase dos Aliados**: o Técnico checa 1 carta e o Infiltrado
   remove o badge de alguém.
10. O computador inicia a **investigação**; o **Cientista Forense** posiciona as **6 balas**.
11. Seguem as **3 rodadas** de evidências + apresentação, com **acusações**.
12. Ao final, o **resultado** é revelado e o **placar** é atualizado.

## Fases da partida

`lobby → roles → cards → allies* → evidence → presentation → (challenge) → result`

\* `allies` só ocorre com Técnico/Infiltrado em jogo (7+ jogadores).

## Funcionalidades

- Sala com código + QR Code (gerado no servidor — celulares não precisam de internet).
- Lobby e estado da partida **sincronizados em tempo real** (Socket.IO).
- Sorteio **secreto** de papéis; cartas **públicas**; solução **secreta**.
- Cronômetro **sincronizado** (o servidor é a fonte oficial do tempo).
- Coleta de evidências com os Scene tiles (6 balas).
- Acusação + mecânica da Testemunha + placar acumulado + revanche.
- **Reconexão automática** do celular (recarregar a página não perde o jogo).
- Expansão **Undercover Allies** (Técnico de Laboratório, Infiltrado, Segurança).

## Segurança da informação

O servidor é a única fonte de verdade. Cada cliente recebe uma visão **sanitizada**:

- O **computador** nunca recebe papéis nem a solução (só informações públicas).
- Cada **jogador** recebe somente o próprio papel e as próprias cartas.
- A **solução** só é enviada ao Cientista Forense; o nome do assassino, ao Cúmplice;
  os culpados, à Testemunha; etc.
- Nada é escondido apenas por CSS/JS no frontend.

## Regras configuráveis (`lib/config.js`)

```js
gameConfig = {
  minPlayers, maxPlayers, roomCodeLength, port,
  clueCardsPerPlayer, meansCardsPerPlayer,
  rolesForPlayerCount(n),   // distribuição de papéis por nº de jogadores
  includeProtectiveDetail,  // expansão: "Segurança"
  rounds,                   // 3 rodadas
  timers: { discussion, accusation },
  scoring: { investigatorWin, murdererWin, solveBonus },
}
```

## Testes

```bash
npm test
```

Roda 4 suítes (46 verificações): fluxo completo, vitória dos assassinos, reconexão e expansão.

> O servidor precisa estar rodando (`npm start`) para os testes passarem.

## Estrutura do projeto

```
deception/
├── server.js              # entrada: Express + Socket.IO + rotas/QR/scene-tiles
├── lib/
│   ├── config.js          # gameConfig (regras configuráveis)
│   ├── roles.js           # papéis (base + expansão)
│   ├── cards.js           # 90 armas, 200 pistas, scene tiles
│   ├── room.js            # sala + máquina de estados + segurança + reconexão
│   └── sockets.js         # eventos de Socket.IO
├── public/
│   ├── index.html         # tela do computador (host)
│   ├── play.html          # tela do celular (jogador)
│   ├── css/style.css
│   ├── js/{common,host,player}.js
│   └── icons/             # 290 SVGs das cartas (gerados)
├── lib/icons/             # definições dos ícones (chunk-*.js)
├── tools/generate-icons.js # regenera os SVGs das cartas
├── test/                  # 5 suítes de teste (socket.io-client)
└── CHECKPOINTS/           # documentação do progresso por etapa
```

## Observações técnicas

- Para liberar o acesso na rede, o Windows pode perguntar sobre o Firewall ao rodar o
  `node server.js` — permita na rede **privada**.
- O QR Code é gerado no servidor; os celulares só precisam da rede local (sem internet).
- Não há build step: é Node + HTML/CSS/JS puro (navegador).
