import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 3006;

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Root route - test if server is working
app.get('/', (req, res) => {
  res.send('<h1>Poker Game Server Running on Port 3006</h1><p>Go to <a href="http://localhost:5173">http://localhost:5173</a> to play</p>');
});

// Serve static files in production only (uncomment when deploying)
// app.use(express.static(join(__dirname, 'dist')));

// Store active game rooms
const rooms = new Map();

// Get local IP address
import { networkInterfaces } from 'os';
function getLocalIpAddress() {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Create a new game room
  socket.on('create-room', ({ playerName, gameConfig }) => {
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    rooms.set(roomCode, {
      host: socket.id,
      players: [{
        id: socket.id,
        name: playerName,
        isHost: true,
        isReady: false
      }],
      gameConfig,
      gameState: null,
      started: false
    });

    socket.join(roomCode);
    socket.emit('room-created', { roomCode, playerName });
    
    console.log(`Room ${roomCode} created by ${playerName}`);
  });

  // Join an existing room
  socket.on('join-room', ({ roomCode, playerName }) => {
    const room = rooms.get(roomCode);
    
    if (!room) {
      socket.emit('join-error', { message: 'Room not found' });
      return;
    }

    if (room.started) {
      socket.emit('join-error', { message: 'Game already in progress' });
      return;
    }

    if (room.players.length >= 6) {
      socket.emit('join-error', { message: 'Room is full' });
      return;
    }

    room.players.push({
      id: socket.id,
      name: playerName,
      isHost: false,
      isReady: false
    });

    socket.join(roomCode);
    socket.emit('room-joined', { roomCode, players: room.players });
    
    // Notify all players in room
    io.to(roomCode).emit('player-joined', { 
      players: room.players,
      playerName 
    });

    console.log(`${playerName} joined room ${roomCode}`);
  });

  // Player ready toggle
  socket.on('toggle-ready', ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (player && !player.isHost) {
      player.isReady = !player.isReady;
      io.to(roomCode).emit('players-updated', { players: room.players });
    }
  });

  // Start game (host only)
  socket.on('start-game', ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room || room.host !== socket.id) return;

    const allReady = room.players.every(p => p.isHost || p.isReady);
    if (!allReady || room.players.length < 2) {
      socket.emit('start-error', { message: 'Not all players are ready or need at least 2 players' });
      return;
    }

    room.started = true;
    io.to(roomCode).emit('game-started', { 
      players: room.players,
      gameConfig: room.gameConfig 
    });

    console.log(`Game started in room ${roomCode}`);
  });

  // Sync game state from host
  socket.on('game-state-update', ({ roomCode, gameState }) => {
    const room = rooms.get(roomCode);
    if (!room || room.host !== socket.id) return;

    room.gameState = gameState;
    socket.to(roomCode).emit('game-state-sync', { gameState });
  });

  // Player action
  socket.on('player-action', ({ roomCode, action }) => {
    const room = rooms.get(roomCode);
    if (!room) return;

    // Forward action to host
    io.to(room.host).emit('player-action-received', { 
      playerId: socket.id,
      action 
    });
  });

  // Request current game state
  socket.on('request-game-state', ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room || !room.gameState) return;

    socket.emit('game-state-sync', { gameState: room.gameState });
  });

  // Chat message
  socket.on('chat-message', ({ roomCode, message, playerName }) => {
    io.to(roomCode).emit('chat-message', { playerName, message });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);

    // Find and update rooms
    for (const [roomCode, room] of rooms.entries()) {
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      
      if (playerIndex !== -1) {
        const player = room.players[playerIndex];
        room.players.splice(playerIndex, 1);

        // If host left, assign new host or close room
        if (socket.id === room.host) {
          if (room.players.length > 0) {
            room.host = room.players[0].id;
            room.players[0].isHost = true;
            io.to(roomCode).emit('host-changed', { 
              newHost: room.players[0],
              players: room.players 
            });
          } else {
            rooms.delete(roomCode);
            console.log(`Room ${roomCode} closed`);
          }
        } else {
          io.to(roomCode).emit('player-left', { 
            playerName: player.name,
            players: room.players 
          });
        }
      }
    }
  });
});

httpServer.listen(PORT, '0.0.0.0', () => {
  const localIp = getLocalIpAddress();
  console.log('\n════════════════════════════════════════');
  console.log('🃏  Poker Game Server Running');
  console.log('════════════════════════════════════════');
  console.log(`\n📡 Server running on port ${PORT}`);
  console.log(`\n🌐 Connections:`);
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   Network: http://${localIp}:${PORT}`);
  console.log(`\n💡 Share the Network address with other players on your LAN`);
  console.log('\n════════════════════════════════════════\n');
}).on('error', (err) => {
  console.error('❌ Server failed to start:', err.message);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please close other instances or change the port.`);
  }
  process.exit(1);
});
