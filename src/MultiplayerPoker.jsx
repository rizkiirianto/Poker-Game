import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import PokerGame from './PokerGame';

// Dynamically determine server URL based on current host
const SERVER_URL = import.meta.env.DEV 
  ? `http://${window.location.hostname}:3006`
  : window.location.origin;

export default function MultiplayerPoker({ onBackToMenu }) {
  const [socket, setSocket] = useState(null);
  const [phase, setPhase] = useState('menu'); // menu, lobby, game
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [currentRoom, setCurrentRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [error, setError] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [gameConfig, setGameConfig] = useState({
    chips: '1000000',
    smallBlind: '10000',
    assist: 'true',
    showProfiles: 'true',
    blindMultiplier: '2',
    blindInterval: '10'
  });

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(SERVER_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to server');
    });

    newSocket.on('room-created', ({ roomCode }) => {
      setCurrentRoom(roomCode);
      setPhase('lobby');
      setError('');
    });

    newSocket.on('room-joined', ({ roomCode, players }) => {
      setCurrentRoom(roomCode);
      setPlayers(players);
      setPhase('lobby');
      setError('');
    });

    newSocket.on('join-error', ({ message }) => {
      setError(message);
    });

    newSocket.on('player-joined', ({ players, playerName: newPlayerName }) => {
      setPlayers(players);
      addChatMessage(`${newPlayerName} joined the game`, 'system');
    });

    newSocket.on('player-left', ({ playerName: leftPlayerName, players }) => {
      setPlayers(players);
      addChatMessage(`${leftPlayerName} left the game`, 'system');
    });

    newSocket.on('players-updated', ({ players }) => {
      setPlayers(players);
    });

    newSocket.on('host-changed', ({ newHost, players }) => {
      setPlayers(players);
      addChatMessage(`${newHost.name} is now the host`, 'system');
    });

    newSocket.on('game-started', ({ players: gamePlayers }) => {
      setPhase('game');
      addChatMessage('Game is starting!', 'system');
      // TODO: Initialize actual poker game
    });

    newSocket.on('start-error', ({ message }) => {
      setError(message);
    });

    newSocket.on('chat-message', ({ playerName: sender, message }) => {
      addChatMessage(`${sender}: ${message}`, 'chat');
    });

    return () => newSocket.close();
  }, []);

  const addChatMessage = (message, type = 'chat') => {
    setChatMessages(prev => [...prev, { message, type, id: Date.now() + Math.random() }]);
  };

  const handleCreateRoom = () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    socket.emit('create-room', { playerName: playerName.trim(), gameConfig });
  };

  const handleJoinRoom = () => {
    if (!playerName.trim() || !roomCode.trim()) {
      setError('Please enter your name and room code');
      return;
    }
    socket.emit('join-room', { roomCode: roomCode.trim().toUpperCase(), playerName: playerName.trim() });
  };

  const handleToggleReady = () => {
    socket.emit('toggle-ready', { roomCode: currentRoom });
  };

  const handleStartGame = () => {
    socket.emit('start-game', { roomCode: currentRoom });
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    socket.emit('chat-message', { roomCode: currentRoom, message: chatInput.trim(), playerName });
    setChatInput('');
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(currentRoom);
    alert('Room code copied to clipboard!');
  };

  const myPlayer = players.find(p => p.id === socket?.id);
  const isHost = myPlayer?.isHost;

  // ── MENU SCREEN ──────────────────────────────────────────────
  if (phase === 'menu') {
    return (
      <div style={{ minHeight: '100vh', background: '#0a1628', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif' }}>
        <div style={{ background: 'linear-gradient(145deg,#0f2040,#071528)', border: '1px solid rgba(180,140,60,0.3)', borderRadius: 16, padding: 40, width: 420, boxShadow: '0 0 60px rgba(0,0,0,0.8)' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 48 }}>🃏</div>
            <h1 style={{ color: '#c8a84b', fontFamily: 'Georgia,serif', fontSize: 28, margin: '8px 0 4px', letterSpacing: 2 }}>MULTIPLAYER POKER</h1>
            <p style={{ color: 'rgba(200,168,75,0.6)', fontSize: 12, letterSpacing: 4, textTransform: 'uppercase' }}>Texas Hold'em - Local Network</p>
          </div>

          {error && (
            <div style={{ background: 'rgba(231,76,60,0.15)', border: '1px solid rgba(231,76,60,0.4)', borderRadius: 8, padding: 12, marginBottom: 16, color: '#e74c3c', fontSize: 13 }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ color: 'rgba(200,168,75,0.8)', fontSize: 12, letterSpacing: 1, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Your Name</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(180,140,60,0.3)', borderRadius: 8, padding: '10px 14px', color: '#e8d5a0', fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: 24, padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(180,140,60,0.2)' }}>
            <div style={{ color: 'rgba(200,168,75,0.8)', fontSize: 11, letterSpacing: 1, marginBottom: 12, textTransform: 'uppercase' }}>Game Settings</div>
            {[
              ['Starting Chips (IDR)', 'chips', '1000000'],
              ['Small Blind (IDR)', 'smallBlind', '10000'],
              ['Blind Multiplier', 'blindMultiplier', '2'],
              ['Blind Interval (min)', 'blindInterval', '10']
            ].map(([label, key, ph]) => (
              <div key={key} style={{ marginBottom: 12 }}>
                <label style={{ color: 'rgba(200,168,75,0.7)', fontSize: 11, display: 'block', marginBottom: 4 }}>{label}</label>
                <input
                  type="number"
                  value={gameConfig[key]}
                  onChange={(e) => setGameConfig({ ...gameConfig, [key]: e.target.value })}
                  placeholder={ph}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(180,140,60,0.2)', borderRadius: 6, padding: '8px 10px', color: '#e8d5a0', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            ))}
          </div>

          <button
            onClick={handleCreateRoom}
            style={{ width: '100%', padding: '14px 0', background: 'linear-gradient(135deg,#c8a84b,#a07030)', border: 'none', borderRadius: 8, color: '#0a1628', fontFamily: 'Georgia,serif', fontSize: 16, fontWeight: 'bold', letterSpacing: 2, cursor: 'pointer', textTransform: 'uppercase', marginBottom: 12 }}
          >
            🎮 Create Room (Host)
          </button>

          <div style={{ textAlign: 'center', color: 'rgba(200,168,75,0.5)', fontSize: 12, margin: '16px 0', textTransform: 'uppercase', letterSpacing: 2 }}>
            — OR —
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ color: 'rgba(200,168,75,0.8)', fontSize: 12, letterSpacing: 1, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Room Code</label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="Enter 6-digit code"
              maxLength={6}
              style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(180,140,60,0.3)', borderRadius: 8, padding: '10px 14px', color: '#e8d5a0', fontSize: 15, outline: 'none', boxSizing: 'border-box', textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center', fontWeight: 'bold' }}
            />
          </div>

          <button
            onClick={handleJoinRoom}
            style={{ width: '100%', padding: '14px 0', background: 'rgba(200,168,75,0.15)', border: '1px solid rgba(200,168,75,0.4)', borderRadius: 8, color: '#c8a84b', fontFamily: 'Georgia,serif', fontSize: 16, fontWeight: 'bold', letterSpacing: 2, cursor: 'pointer', textTransform: 'uppercase', marginBottom: 12 }}
          >
            🔗 Join Room
          </button>

          <button
            onClick={onBackToMenu}
            style={{ width: '100%', padding: '10px 0', background: 'none', border: '1px solid rgba(180,140,60,0.3)', borderRadius: 8, color: 'rgba(200,168,75,0.6)', fontFamily: 'Georgia,serif', fontSize: 13, cursor: 'pointer' }}
          >
            ← Back to Main Menu
          </button>

          <div style={{ marginTop: 24, padding: 12, background: 'rgba(52,152,219,0.1)', border: '1px solid rgba(52,152,219,0.3)', borderRadius: 8, fontSize: 11, color: 'rgba(200,168,75,0.6)', lineHeight: 1.6 }}>
            💡 <strong>How to play:</strong><br />
            1. One player creates a room and shares the code<br />
            2. Others join using the room code<br />
            3. All players must be on the same network<br />
            4. Host starts the game when everyone is ready
          </div>
        </div>
      </div>
    );
  }

  // ── LOBBY SCREEN ─────────────────────────────────────────────
  if (phase === 'lobby') {
    return (
      <div style={{ minHeight: '100vh', background: '#0a1628', padding: 40, fontFamily: 'Georgia, serif' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h1 style={{ color: '#c8a84b', fontSize: 32, margin: 0, letterSpacing: 2 }}>GAME LOBBY</h1>
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <div style={{ background: 'rgba(200,168,75,0.15)', border: '1px solid rgba(200,168,75,0.4)', borderRadius: 8, padding: '12px 24px' }}>
                <div style={{ color: 'rgba(200,168,75,0.6)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Room Code</div>
                <div style={{ color: '#c8a84b', fontSize: 24, fontWeight: 'bold', letterSpacing: 6 }}>{currentRoom}</div>
              </div>
              <button
                onClick={copyRoomCode}
                style={{ padding: '12px 20px', background: 'rgba(200,168,75,0.2)', border: '1px solid rgba(200,168,75,0.4)', borderRadius: 8, color: '#c8a84b', cursor: 'pointer', fontSize: 13, fontFamily: 'Georgia,serif' }}
              >
                📋 Copy
              </button>
            </div>
          </div>

          {error && (
            <div style={{ background: 'rgba(231,76,60,0.15)', border: '1px solid rgba(231,76,60,0.4)', borderRadius: 8, padding: 12, marginBottom: 16, color: '#e74c3c', fontSize: 13, textAlign: 'center' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
            {/* Players */}
            <div style={{ background: 'linear-gradient(145deg,#0f2040,#071528)', border: '1px solid rgba(180,140,60,0.3)', borderRadius: 16, padding: 24 }}>
              <h3 style={{ color: '#c8a84b', fontSize: 16, margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: 2 }}>
                Players ({players.length}/6)
              </h3>
              {players.map((player, i) => (
                <div key={player.id} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(180,140,60,0.2)', borderRadius: 8, padding: 12, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ color: '#e8d5a0', fontSize: 14, fontWeight: 'bold' }}>
                      {player.name}
                      {player.isHost && <span style={{ marginLeft: 8, color: '#c8a84b', fontSize: 11 }}>👑 HOST</span>}
                      {player.id === socket?.id && <span style={{ marginLeft: 8, color: '#3498db', fontSize: 11 }}>(You)</span>}
                    </div>
                  </div>
                  <div>
                    {player.isHost ? (
                      <span style={{ color: 'rgba(200,168,75,0.6)', fontSize: 11 }}>READY</span>
                    ) : player.isReady ? (
                      <span style={{ color: '#2ecc71', fontSize: 11, fontWeight: 'bold' }}>✓ READY</span>
                    ) : (
                      <span style={{ color: 'rgba(231,76,60,0.8)', fontSize: 11 }}>NOT READY</span>
                    )}
                  </div>
                </div>
              ))}

              {players.length < 2 && (
                <div style={{ color: 'rgba(200,168,75,0.5)', fontSize: 12, textAlign: 'center', marginTop: 16, fontStyle: 'italic' }}>
                  Waiting for more players...
                </div>
              )}
            </div>

            {/* Chat */}
            <div style={{ background: 'linear-gradient(145deg,#0f2040,#071528)', border: '1px solid rgba(180,140,60,0.3)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ color: '#c8a84b', fontSize: 16, margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: 2 }}>
                Chat
              </h3>
              <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(180,140,60,0.15)', borderRadius: 8, padding: 12, maxHeight: 200, overflowY: 'auto', marginBottom: 12, fontSize: 12 }}>
                {chatMessages.length === 0 ? (
                  <div style={{ color: 'rgba(200,168,75,0.4)', fontStyle: 'italic' }}>No messages yet...</div>
                ) : (
                  chatMessages.map(msg => (
                    <div key={msg.id} style={{ marginBottom: 6, color: msg.type === 'system' ? '#3498db' : 'rgba(232,213,160,0.8)' }}>
                      {msg.message}
                    </div>
                  ))
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendChat()}
                  placeholder="Type a message..."
                  style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(180,140,60,0.3)', borderRadius: 8, padding: '8px 12px', color: '#e8d5a0', fontSize: 13, outline: 'none' }}
                />
                <button
                  onClick={handleSendChat}
                  style={{ padding: '8px 16px', background: 'rgba(200,168,75,0.2)', border: '1px solid rgba(200,168,75,0.4)', borderRadius: 8, color: '#c8a84b', cursor: 'pointer', fontSize: 13 }}
                >
                  Send
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            {!isHost && (
              <button
                onClick={handleToggleReady}
                style={{ padding: '14px 32px', background: myPlayer?.isReady ? 'rgba(231,76,60,0.2)' : 'rgba(46,204,113,0.2)', border: `1px solid ${myPlayer?.isReady ? 'rgba(231,76,60,0.4)' : 'rgba(46,204,113,0.4)'}`, borderRadius: 8, color: myPlayer?.isReady ? '#e74c3c' : '#2ecc71', fontFamily: 'Georgia,serif', fontSize: 16, fontWeight: 'bold', cursor: 'pointer', letterSpacing: 1 }}
              >
                {myPlayer?.isReady ? 'Not Ready' : 'Ready Up!'}
              </button>
            )}

            {isHost && (
              <button
                onClick={handleStartGame}
                style={{ padding: '14px 32px', background: 'linear-gradient(135deg,#c8a84b,#a07030)', border: 'none', borderRadius: 8, color: '#0a1628', fontFamily: 'Georgia,serif', fontSize: 16, fontWeight: 'bold', cursor: 'pointer', letterSpacing: 2, textTransform: 'uppercase' }}
              >
                🎮 Start Game
              </button>
            )}

            <button
              onClick={() => {
                socket.disconnect();
                onBackToMenu();
              }}
              style={{ padding: '14px 32px', background: 'none', border: '1px solid rgba(180,140,60,0.3)', borderRadius: 8, color: 'rgba(200,168,75,0.6)', fontFamily: 'Georgia,serif', fontSize: 14, cursor: 'pointer' }}
            >
              Leave Lobby
            </button>
          </div>

          <div style={{ marginTop: 24, textAlign: 'center', color: 'rgba(200,168,75,0.5)', fontSize: 12 }}>
            {isHost ? (
              <>👑 You are the host. Start the game when everyone is ready.</>
            ) : (
              <>⏳ Waiting for host to start the game...</>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── GAME SCREEN ─────────────────────────────────────────────
  if (phase === 'game') {
    const myPlayer = players.find(p => p.id === socket?.id);
    const isHost = myPlayer?.isHost || false;
    
    return (
      <PokerGame
        onBackToMenu={() => {
          socket?.disconnect();
          onBackToMenu();
        }}
        isMultiplayer={true}
        socket={socket}
        roomCode={currentRoom}
        playerId={socket?.id}
        multiplayerPlayers={players}
        isHost={isHost}
        gameConfig={gameConfig}
      />
    );
  }

  return null;
}
