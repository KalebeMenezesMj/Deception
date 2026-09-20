'use strict';

const http = require('http');
const os = require('os');
const path = require('path');
const express = require('express');
const QRCode = require('qrcode');
const { Server } = require('socket.io');

const { gameConfig } = require('./lib/config');
const { createRoomManager, setupSocketHandlers } = require('./lib/sockets');
const { SCENE_TILES } = require('./lib/cards');

const PORT = process.env.PORT || gameConfig.port;

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const rooms = createRoomManager();

// ---------------------------------------------------------------------------
// Utilidades de rede (para descobrir o IP na rede local e montar URL/QR)
// ---------------------------------------------------------------------------
function getLanIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return 'localhost';
}

function getServerInfo() {
  return { ip: getLanIp(), port: PORT };
}

// ---------------------------------------------------------------------------
// Rotas HTTP
// ---------------------------------------------------------------------------

// Página do computador (host)
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Página do celular (jogador). Também usada por /sala/CODIGO (via QR Code).
app.get('/play', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'play.html'));
});

app.get('/sala/:code', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'play.html'));
});

// QR Code gerado no servidor (evita depender de CDN/internet nos celulares).
app.get('/api/qr', async (req, res) => {
  try {
    const text = req.query.text || '';
    if (!text) return res.status(400).send('missing text');
    const dataUrl = await QRCode.toDataURL(text, { margin: 1, width: 320 });
    res.send(dataUrl);
  } catch (err) {
    res.status(500).send('qr error');
  }
});

// Scene tiles (dados estáticos usados pelo Cientista Forense na coleta de evidências).
app.get('/api/scene-tiles', (_req, res) => {
  res.json(SCENE_TILES);
});

// Assets estáticos
app.use(express.static(path.join(__dirname, 'public')));

// ---------------------------------------------------------------------------
// Socket.IO
// ---------------------------------------------------------------------------
setupSocketHandlers(io, rooms, getServerInfo);

server.listen(PORT, () => {
  const info = getServerInfo();
  console.log('');
  console.log('  ╔══════════════════════════════════════════════════════════╗');
  console.log('  ║   DECEPTION — MURDER IN HONG KONG (servidor local)       ║');
  console.log('  ╚══════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`  Computador (host):   http://${info.ip}:${PORT}/`);
  console.log(`  Celulares (jogar):   http://${info.ip}:${PORT}/play`);
  console.log('');
  console.log('  Abra o endereço do computador e clique em CRIAR PARTIDA.');
  console.log('  Os celulares entram escaneando o QR Code ou pela URL.');
  console.log('');
});
