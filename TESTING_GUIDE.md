# 🧪 Multiplayer Testing Guide

## Quick Test (Single Computer)

You can test the full multiplayer experience on one computer with multiple browser windows:

### 1. Start the Servers
```bash
npm run dev:mp
```

Wait for both servers to start. You should see:
```
VITE v5.x.x  ready in xxx ms
  ➜  Local:   http://localhost:5173/
  
════════════════════════════════════════
🃏  Poker Game Server Running
════════════════════════════════════════
```

### 2. Open Multiple Browser Windows

**Window 1 (Host):**
1. Open `http://localhost:5173`
2. Click "Multiplayer (LAN)"
3. Enter name: "Player 1"
4. Click "Create Room (Host)"
5. **Copy the 6-digit room code**

**Window 2 (Player 2):**
1. Open NEW browser window: `http://localhost:5173`
2. Click "Multiplayer (LAN)"
3. Enter name: "Player 2"
4. Paste room code
5. Click "Join Room"
6. Click "Ready Up!"

**Window 3 (Player 3) - Optional:**
1. Open ANOTHER browser window: `http://localhost:5173`
2. Follow same steps as Window 2 with name "Player 3"

### 3. Start the Game

In **Window 1 (Host):**
- Wait for all players to be ready
- Click "Start Game"

### 4. Play Poker!

- Each window represents a different player
- Only the current player can see action buttons enabled
- Make your moves in the correct window
- Watch game state sync across all windows in real-time

---

## Test Scenarios

### Scenario 1: Basic Two-Player Game
✅ Host creates room
✅ One player joins
✅ Both ready up
✅ Host starts game
✅ Take turns making actions (fold, call, raise)
✅ Verify game reaches showdown
✅ Verify winner is declared
✅ Verify chips are awarded correctly

### Scenario 2: Multi-Player Game (3-6 players)
✅ Host creates room
✅ Multiple players join
✅ All ready up
✅ Host starts game
✅ Verify turn order is correct
✅ Verify only current player can act
✅ Verify eliminated players are removed
✅ Verify game continues until one winner

### Scenario 3: Chat System
✅ Send messages in lobby
✅ Verify all players see messages
✅ Verify system messages (player joined/left)

### Scenario 4: Card Privacy
✅ Verify you only see YOUR hole cards
✅ Verify other players' cards show face-down
✅ Verify all cards revealed at showdown
✅ Verify community cards visible to all

### Scenario 5: Game State Sync
✅ Make action in one window
✅ Verify pot updates in all windows
✅ Verify chip counts update everywhere
✅ Verify community cards appear for all
✅ Verify turn indicator moves correctly

### Scenario 6: Player Disconnection
✅ Close one player's browser window
✅ Verify other players notified
✅ Verify game continues (if enough players)
✅ Re-join and verify can't resume (expected behavior)

### Scenario 7: Host Migration
✅ Host creates room with 3+ players
✅ All join and ready up
✅ **Before starting game**, host closes browser
✅ Verify new host is assigned
✅ Verify new host can start game

---

## Testing on Multiple Devices

### Network Setup
1. Connect all devices to **same WiFi network**
2. Find your computer's IP address (shown in server terminal)
3. Note the IP address (e.g., `192.168.1.100`)

### Device Setup

**Host Device:**
```bash
# On your main computer
npm run dev:mp
# Note your IP from terminal: http://192.168.1.100:3001
```

**Player Devices (phones, tablets, other computers):**
1. Open browser on device
2. Navigate to: `http://192.168.1.100:5173` (use YOUR IP)
3. Click "Multiplayer (LAN)"
4. Join the room

### What to Test
- [ ] All devices can connect
- [ ] Game state syncs across devices
- [ ] Mobile devices can play (touchscreen works)
- [ ] Different browsers work (Chrome, Firefox, Safari)
- [ ] Network latency is acceptable (<500ms response)

---

## Debugging Tests

### Test 1: Server Connection
**Open browser console (F12) on client:**
```javascript
// You should see:
Connected to server
```

**Check server terminal:**
```
Player connected: <socket-id>
```

### Test 2: Room Creation
**Server terminal should show:**
```
Room ABC123 created by Player 1
```

### Test 3: Player Join
**Server terminal should show:**
```
Player 2 joined room ABC123
```

**All players should see:**
- Player list updated
- Chat message: "Player 2 joined the game"

### Test 4: Game State Broadcast
**Open browser console on client (F12):**
```javascript
// After each action, you should see messages received
```

**Server terminal shows:**
```
Player <id> action received
```

### Test 5: Action Execution
**When you click Fold/Call/Raise:**
- Client console: `Emitting player-action`
- Server: `Player action received`
- Host console: `Executing action locally`
- All clients: State updates received

---

## Known Limitations (By Design)

### Expected Behavior
1. **No reconnection** - Disconnected players can't resume
   - _Why:_ Game state is lost on disconnect
   - _Future:_ Could add reconnection logic with state persistence

2. **Host dependency** - Game stops if host disconnects mid-game
   - _Why:_ Host runs the game engine
   - _Future:_ Could migrate game state to new host

3. **No spectators** - Eliminated players can't watch
   - _Why:_ Not implemented yet
   - _Future:_ Easy to add spectator mode

4. **Local network only** - Can't play over internet
   - _Why:_ Not designed for internet play (security)
   - _Future:_ Would need authentication, encryption, etc.

5. **Room expires** - Rooms cleared when empty
   - _Why:_ No persistence layer
   - _Future:_ Could add database for permanent rooms

---

## Performance Benchmarks

### Expected Response Times
- **Action to sync:** <100ms on LAN
- **State broadcast:** <50ms
- **Chat message:** <100ms

### If experiencing lag:
1. Check WiFi signal strength
2. Reduce number of other devices on network
3. Use Ethernet connection instead of WiFi
4. Check for background downloads/uploads
5. Restart router

---

## Troubleshooting Checklist

### Can't Connect to Game
- [ ] Both servers running (`npm run dev:mp`)
- [ ] Correct IP address (check server terminal)
- [ ] Port 5173 not blocked by firewall
- [ ] All devices on same network
- [ ] No VPN active on any device

### Room Not Found
- [ ] Room code entered correctly (case-sensitive)
- [ ] Host hasn't closed browser
- [ ] Server still running

### Actions Not Working
- [ ] Is it your turn? (check turn indicator)
- [ ] Console errors? (press F12)
- [ ] Server still running?
- [ ] Refresh page and try again

### Game State Out of Sync
- [ ] All players refresh browsers
- [ ] Host restarts with `npm run dev:mp`
- [ ] All players rejoin room
- [ ] Start new game

### Cards Not Showing
- [ ] Are you looking at YOUR player section? (bottom)
- [ ] Other players' cards are hidden (expected)
- [ ] Cards revealed at showdown (wait for it)

---

## Test Result Template

Use this to track your testing:

```
## Test Session

**Date:** _______________
**Tester:** _______________
**Number of Players:** _______________
**Network Type:** WiFi / Ethernet / Mixed

### Setup
- [ ] Servers started successfully
- [ ] Host created room
- [ ] All players joined
- [ ] Chat working
- [ ] Game started

### Gameplay
- [ ] Turn system working
- [ ] Actions execute correctly
- [ ] Cards display properly
- [ ] Pot updates correctly
- [ ] Chips tracked accurately
- [ ] Blinds increase on schedule
- [ ] Showdown works correctly
- [ ] Winner declared properly

### Performance
- [ ] Response time <200ms
- [ ] No lag or stuttering
- [ ] State always in sync
- [ ] No disconnections

### Issues Found
1. _______________
2. _______________
3. _______________

### Overall Rating: ___ / 10
```

---

## Success Criteria

Your multiplayer implementation is working correctly if:

✅ Multiple players can join a room
✅ Game starts when host clicks "Start Game"
✅ Only current player can make actions
✅ All players see the same game state
✅ Cards are private (except at showdown)
✅ Pot and chips update in real-time
✅ Game progresses through all rounds
✅ Winner is declared correctly
✅ Players can play multiple hands
✅ No errors in console or server logs

---

## Advanced Testing

### Stress Test
- Test with 6 players (maximum)
- Play for 30+ minutes
- Monitor memory usage
- Check for performance degradation

### Edge Cases
- [ ] All players go all-in
- [ ] Multiple side pots
- [ ] Everyone folds except one
- [ ] Tie at showdown
- [ ] Player runs out of chips
- [ ] Blind increase mid-hand

### Browser Compatibility
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile Chrome
- [ ] Mobile Safari

---

Happy Testing! 🃏

If you find bugs or have suggestions, document them and they can be addressed in future updates.
