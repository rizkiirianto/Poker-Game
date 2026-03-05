# 🃏 React Poker Game - Single Player & Multiplayer

A browser-based Texas Hold'em poker game built with React. Play against AI bots or challenge your friends in local network multiplayer!

👉 **[Play the Live Demo Here](https://rizkiirianto.github.io/Poker-Game/)**

## ✨ Features

### Single Player Mode
* **Full Texas Hold'em Engine:** Complete round progression (Pre-Flop, Flop, Turn, River, Showdown).
* **Hand Evaluation:** Automatically calculates the best 5-card hand from hole and community cards.
* **AI Opponents:** Play against up to 5 bots, each assigned a random profile:
  * *Aggressive:* Bets big and bluffs often.
  * *Conservative:* Only plays strong hands.
  * *Calling Station:* Rarely folds, loves to see the next card.
  * *Balanced:* Mixes up playstyles dynamically.
* **Assist Mode:** Optional toggle that tells you the current strength of your hand.
* **Indonesian Rupiah Currency:** All chip amounts are in IDR with thousand separators.
* **Blind Escalation:** Configurable blind increases over time to keep the game moving.

### Multiplayer Mode (Local Network) 🌐
* **LAN Multiplayer:** Play with friends on the same local network - **FULLY FUNCTIONAL!**
* **Room System:** Host creates a room, others join with a 6-digit code
* **Real-time Sync:** All game actions synchronized via WebSocket
* **In-game Chat:** Communicate with other players during lobby
* **2-6 Players:** Support for 2 to 6 human players (no bots)
* **Host Controls:** Host can configure game settings and start the game
* **Turn-based Play:** Only the current player can make actions
* **Card Privacy:** Players only see their own cards until showdown
* **Live Updates:** Pot, bets, chips, and community cards sync in real-time

## 🛠️ Technologies Used
* **React.js** (Hooks, state management)
* **Vite** (Build tool)
* **Socket.IO** (Real-time multiplayer communication)
* **Express.js** (WebSocket server)
* **Tailwind CSS v3** (Styling and layout)
* **GitHub Pages** (Hosting for single player)

## 🚀 Getting Started

### Single Player (Online)
Simply visit the [live demo](https://rizkiirianto.github.io/Poker-Game/) - no installation required!

### Local Development & Multiplayer

#### Prerequisites
* Node.js (v16 or higher)
* npm or yarn

#### Installation
```bash
# Clone the repository
git clone https://github.com/rizkiirianto/Poker-Game.git
cd Poker-Game

# Install dependencies
npm install
```

#### Running Single Player Mode
```bash
# Start the development server
npm run dev
# Open http://localhost:5173 in your browser
```

#### Running Multiplayer Mode
```bash
# Start both the Vite dev server and WebSocket server
npm run dev:mp

# Or run them separately:
# Terminal 1: npm run dev
# Terminal 2: npm run server
```

**To play multiplayer:**
1. Make sure all devices are on the same local network (WiFi/LAN)
2. Check the terminal for your network IP address (e.g., `http://192.168.1.100:3001`)
3. Host player: Open `http://192.168.1.100:5173` and create a room
4. Other players: Open the same URL and join using the room code
5. All players ready up, host starts the game!

**Ports:**
- Frontend: `5173` (Vite dev server)
- Backend: `3001` (WebSocket server)

**Note:** Make sure ports 5173 and 3001 are not blocked by your firewall.

## 📁 Project Structure
```
poker-game/
├── src/
│   ├── App.jsx                 # Main app with mode selection
│   ├── PokerGame.jsx           # Single player poker game
│   ├── MultiplayerPoker.jsx    # Multiplayer lobby & UI
│   └── main.jsx                # Entry point
├── server.js                   # WebSocket server for multiplayer
├── public/                     # Static assets
└── package.json               # Dependencies & scripts
```

## 🎮 How to Play

### Single Player
1. Enter your name and configure game settings
2. Choose number of AI bots (1-5)
3. Set starting chips, blinds, and blind escalation
4. Click "Deal Me In" to start
5. Use Fold/Call/Raise buttons to play your hand

### Multiplayer (LAN)
1. **Host:** Select "Multiplayer (LAN)", enter your name, configure settings, and click "Create Room"
2. **Host:** Share the 6-digit room code with other players
3. **Players:** Select "Multiplayer (LAN)", enter name and room code, then click "Join Room"
4. All players click "Ready Up!" when ready
5. **Host:** Click "Start Game" when all players are ready
6. Play poker with your friends!

## 🔧 Configuration Options

- **Starting Chips:** Amount each player starts with (in IDR)
- **Small Blind:** Initial small blind amount
- **Blind Multiplier:** How much blinds multiply each interval (e.g., 2x)
- **Blind Interval:** Minutes between blind increases
- **Assist Mode:** Shows your current hand strength
- **Show Bot Types:** Displays AI personality types

## 📝 Game Rules
Standard Texas Hold'em rules:
- Each player gets 2 hole cards (private)
- 5 community cards dealt in stages (Flop, Turn, River)
- Best 5-card hand wins
- Betting rounds after each stage
- Last player standing or best hand at showdown wins the pot

## 🤝 Contributing
Feel free to open issues or submit pull requests!

## 📄 License
MIT License - feel free to use this project for learning or personal use.

---

Made with ♠️ by [Rizki Irianto](https://github.com/rizkiirianto)