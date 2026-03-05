import { useState } from 'react';
import PokerGame from './PokerGame';
import MultiplayerPoker from './MultiplayerPoker';

function App() {
  const [mode, setMode] = useState('menu'); // menu, singleplayer, multiplayer

  // ── MODE SELECTION ────────────────────────────────────────────
  if (mode === 'menu') {
    return (
      <div style={{ minHeight: '100vh', background: '#0a1628', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif' }}>
        <div style={{ background: 'linear-gradient(145deg,#0f2040,#071528)', border: '1px solid rgba(180,140,60,0.3)', borderRadius: 16, padding: 40, width: 420, boxShadow: '0 0 60px rgba(0,0,0,0.8)' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ fontSize: 64 }}>🃏</div>
            <h1 style={{ color: '#c8a84b', fontFamily: 'Georgia,serif', fontSize: 36, margin: '16px 0 8px', letterSpacing: 3 }}>POKER</h1>
            <p style={{ color: 'rgba(200,168,75,0.6)', fontSize: 13, letterSpacing: 4, textTransform: 'uppercase' }}>Texas Hold'em</p>
          </div>

          <button
            onClick={() => setMode('singleplayer')}
            style={{ width: '100%', padding: '16px 0', background: 'linear-gradient(135deg,#c8a84b,#a07030)', border: 'none', borderRadius: 10, color: '#0a1628', fontFamily: 'Georgia,serif', fontSize: 18, fontWeight: 'bold', letterSpacing: 2, cursor: 'pointer', textTransform: 'uppercase', marginBottom: 16, boxShadow: '0 4px 12px rgba(200,168,75,0.3)' }}
          >
            🎮 Single Player
          </button>

          <button
            onClick={() => setMode('multiplayer')}
            style={{ width: '100%', padding: '16px 0', background: 'rgba(52,152,219,0.2)', border: '2px solid rgba(52,152,219,0.5)', borderRadius: 10, color: '#5dade2', fontFamily: 'Georgia,serif', fontSize: 18, fontWeight: 'bold', letterSpacing: 2, cursor: 'pointer', textTransform: 'uppercase', marginBottom: 24 }}
          >
            🌐 Multiplayer (LAN)
          </button>

          <div style={{ padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px dashed rgba(180,140,60,0.2)' }}>
            <div style={{ color: 'rgba(200,168,75,0.8)', fontSize: 13, marginBottom: 10, fontWeight: 'bold' }}>
              🎯 Single Player
            </div>
            <div style={{ color: 'rgba(200,168,75,0.6)', fontSize: 11, lineHeight: 1.6, marginBottom: 16 }}>
              Play against AI bots with different play styles. Practice your poker skills offline.
            </div>
            
            <div style={{ color: 'rgba(200,168,75,0.8)', fontSize: 13, marginBottom: 10, fontWeight: 'bold' }}>
              🌐 Multiplayer (LAN)
            </div>
            <div style={{ color: 'rgba(200,168,75,0.6)', fontSize: 11, lineHeight: 1.6 }}>
              Play with friends on the same local network. One player hosts, others join using a room code.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── SINGLE PLAYER ─────────────────────────────────────────────
  if (mode === 'singleplayer') {
    return (
      <div className="w-full min-h-screen">
        <PokerGame onBackToMenu={() => setMode('menu')} />
      </div>
    );
  }

  // ── MULTIPLAYER ───────────────────────────────────────────────
  if (mode === 'multiplayer') {
    return (
      <div className="w-full min-h-screen">
        <MultiplayerPoker onBackToMenu={() => setMode('menu')} />
      </div>
    );
  }

  return null;
}

export default App