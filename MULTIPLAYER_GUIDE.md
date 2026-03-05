# 🌐 Multiplayer Setup & Troubleshooting Guide

## Quick Start

### 1. Start the Servers
```bash
npm run dev:mp
```

This starts both:
- **Vite Dev Server** on port 5173 (frontend)
- **WebSocket Server** on port 3001 (backend)

### 2. Find Your Network IP

The server will display your network IP address in the terminal:
```
════════════════════════════════════════
🃏  Poker Game Server Running
════════════════════════════════════════

📡 Server running on port 3001

🌐 Connections:
   Local:   http://localhost:3001
   Network: http://192.168.1.100:3001

💡 Share the Network address with other players on your LAN
```

### 3. Connect Players

**All players** should open: `http://192.168.1.100:5173` (replace with your IP)

- **Host:** Click "Multiplayer (LAN)" → "Create Room" → Share room code
- **Players:** Click "Multiplayer (LAN)" → Enter room code → "Join Room"

---

## Network Requirements

### Same Network
All players MUST be on the same local network:
- ✅ All connected to the same WiFi
- ✅ All connected via Ethernet to the same router
- ❌ One on WiFi, one using mobile data (won't work)
- ❌ Different WiFi networks (won't work)

### Firewall Settings
Ensure these ports are **not blocked**:
- **5173** - Frontend (React app)
- **3001** - Backend (WebSocket server)

**Windows Firewall:**
1. Search "Windows Defender Firewall"
2. Click "Allow an app through firewall"
3. Allow Node.js for both Private and Public networks

**Mac Firewall:**
1. System Preferences → Security & Privacy → Firewall
2. Click "Firewall Options"
3. Add Node and allow incoming connections

---

## Troubleshooting

### ❌ "Can't connect to server"

**Problem:** Players can't join the lobby

**Solutions:**
1. **Check if server is running:**
   ```bash
   npm run server
   ```
   You should see "Poker Game Server Running"

2. **Verify IP address:**
   - Use the IP shown in the server terminal
   - Don't use "localhost" for other devices
   
3. **Test connection:**
   Open http://YOUR_IP:3001 in a browser
   You should see Socket.IO working

4. **Firewall:**
   - Temporarily disable firewall to test
   - If it works, add exception for ports 3001 and 5173

5. **Same network check:**
   - All devices on same WiFi/router?
   - Check IP ranges match (e.g., all 192.168.1.x)

### ❌ "Room not found"

**Problem:** Player enters room code but can't join

**Solutions:**
1. **Verify room code:** Room codes are case-sensitive (6 characters)
2. **Check server:** Make sure host's server is still running
3. **Room expired:** Host may have left - create new room

### ❌ Game already in progress

**Problem:** Can't join after game started

**Solution:** Wait for current game to end, or host creates new room

### ❌ Server crashes or restarts

**Problem:** All players disconnected

**Solution:**
1. Restart server: `npm run dev:mp`
2. All players refresh browser
3. Host creates new room
4. Players join again

### ❌ Players see different game states

**Problem:** Game state not synchronized

**Solution:**
1. All players refresh their browsers
2. Host restarts the server
3. Reconnect to a new room

### ❌ High latency between players

**Problem:** Slow response times

**Solutions:**
1. **Check WiFi signal:** Move closer to router
2. **Reduce network traffic:** Stop downloads/streams
3. **Use Ethernet:** Connect via cable instead of WiFi
4. **Router quality:** Older routers may struggle

---

## Finding Your IP Address

### Windows
```bash
ipconfig
```
Look for "IPv4 Address" under your active network adapter

### Mac/Linux
```bash
ifconfig
```
or
```bash
ip addr show
```
Look for "inet" address (usually 192.168.x.x or 10.0.x.x)

### Quick Method (Any OS)
When you run `npm run server`, it automatically displays your network IP!

---

## Advanced Configuration

### Change Server Port

Edit `server.js` line:
```javascript
const PORT = process.env.PORT || 3001;
```

Or use environment variable:
```bash
PORT=4000 npm run server
```

Don't forget to update the client connection in `MultiplayerPoker.jsx`:
```javascript
const SERVER_URL = import.meta.env.DEV ? 'http://localhost:4000' : window.location.origin;
```

### Running on Different Ports

```bash
# Terminal 1 - Frontend on port 8080
PORT=8080 npm run dev

# Terminal 2 - Backend on port 4000
PORT=4000 npm run server
```

Update `MultiplayerPoker.jsx` to match your backend port.

---

## Network Architecture

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│  Player 1   │         │  Player 2   │         │  Player 3   │
│  Browser    │         │  Browser    │         │  Browser    │
│  :5173      │         │  :5173      │         │  :5173      │
└──────┬──────┘         └──────┬──────┘         └──────┬──────┘
       │                       │                        │
       │         WebSocket Connection (Socket.IO)       │
       │                       │                        │
       └───────────────────────┼────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Node.js Server    │
                    │      :3001          │
                    │  ┌───────────────┐  │
                    │  │  Socket.IO    │  │
                    │  │  Room Manager │  │
                    │  │  Game State   │  │
                    │  └───────────────┘  │
                    └─────────────────────┘
```

### How It Works
1. **Host** creates a room, server generates 6-digit code
2. **Players** join room using code, WebSocket connection established
3. **Host** starts game, server broadcasts game state to all players
4. **Players** make actions, server syncs state across all clients
5. All game logic runs on host's machine, server relays messages

---

## Performance Tips

1. **Close unnecessary apps** to free up network bandwidth
2. **Use wired connection** (Ethernet) when possible for stability
3. **Limit number of players** to 4-6 for best performance
4. **Strong WiFi signal** - stay near router
5. **Modern router** with good concurrent connection handling

---

## Security Note

This multiplayer implementation is designed for **LOCAL NETWORK PLAY ONLY**. 

❌ **Not suitable for internet play:**
- No authentication
- No encryption
- Vulnerable to tampering
- Not production-ready

✅ **Safe for LAN parties and home play:**
- All devices on trusted local network
- No internet exposure
- Fun with friends and family

---

## Still Having Issues?

### Check Logs
The server terminal shows all connections and errors. Look for:
```
Player connected: <socket-id>
Room <code> created by <name>
<name> joined room <code>
Game started in room <code>
```

### Test Checklist
- [ ] Server running (`npm run server`)
- [ ] Frontend running (`npm run dev`)
- [ ] All devices on same WiFi/network
- [ ] Firewall allows ports 5173 and 3001
- [ ] Using correct IP address (shown in server terminal)
- [ ] Room code entered correctly (6 characters, uppercase)

### Getting Help
1. Check the server terminal for error messages
2. Check browser console (F12) for client errors
3. Verify network connectivity with `ping <host-ip>`
4. Try creating a new room

---

Made with ♠️ for local multiplayer fun!
