import { useState, useEffect, useCallback, useRef } from "react";

// ─── CARD ENGINE ───────────────────────────────────────────────
const CARD_VALUES = { '2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'T':10,'J':11,'Q':12,'K':13,'A':14 };
const VALUES = Object.keys(CARD_VALUES);
const SUITS = ['♠','♥','♦','♣'];
const BOT_PROFILES = ["Aggressive","Conservative","Calling Station","Balanced"];
const HAND_NAMES = ["High Card","Pair","Two Pair","Three of a Kind","Straight","Flush","Full House","Four of a Kind","Straight Flush","Royal Flush"];

function buildDeck() {
  const d = VALUES.flatMap(v => SUITS.map(s => v + s));
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

function evaluate5(hand) {
  let vals = hand.map(c => CARD_VALUES[c[0]]).sort((a,b)=>b-a);
  const suits = hand.map(c => c[1]);
  const isFlush = new Set(suits).size === 1;
  let isStraight = vals.every((v,i) => i===0 || vals[i-1]-v===1);
  if (!isStraight && vals.join()===`14,5,4,3,2`) { isStraight=true; vals=[5,4,3,2,1]; }
  const cnt = {};
  vals.forEach(v => cnt[v]=(cnt[v]||0)+1);
  const freqs = Object.entries(cnt).map(([v,c])=>([c,+v])).sort((a,b)=>b[0]-a[0]||b[1]-a[1]);
  const pat = freqs.map(f=>f[0]);
  const tb = freqs.map(f=>f[1]);
  if (isStraight && isFlush && vals[0]===14) return [9,tb];
  if (isStraight && isFlush) return [8,tb];
  if (pat[0]===4) return [7,tb];
  if (pat[0]===3&&pat[1]===2) return [6,tb];
  if (isFlush) return [5,tb];
  if (isStraight) return [4,tb];
  if (pat[0]===3) return [3,tb];
  if (pat[0]===2&&pat[1]===2) return [2,tb];
  if (pat[0]===2) return [1,tb];
  return [0,tb];
}

function combinations(arr, k) {
  if (k===0) return [[]];
  if (arr.length<k) return [];
  const [first,...rest] = arr;
  return [...combinations(rest,k-1).map(c=>[first,...c]),...combinations(rest,k)];
}

function getBestHand(community, hole) {
  const all = [...community,...hole];
  let best = [-1,[]];
  for (const combo of combinations(all,5)) {
    const s = evaluate5(combo);
    if (s[0]>best[0]||(s[0]===best[0]&&s[1].join()>best[1].join())) best=s;
  }
  return best;
}

function handName(score) { return HAND_NAMES[score[0]]; }

function compareSrc(a, b) {
  if (a[0]!==b[0]) return a[0]-b[0];
  for (let i=0;i<Math.max(a[1].length,b[1].length);i++) {
    const d=(a[1][i]||0)-(b[1][i]||0);
    if (d!==0) return d;
  }
  return 0;
}

function evalPreflopStrength(hole) {
  const v1=CARD_VALUES[hole[0][0]], v2=CARD_VALUES[hole[1][0]];
  if (v1===v2&&v1>=10) return 3;
  if (v1===v2||(v1>=13&&v2>=13)) return 2;
  if (Math.max(v1,v2)>=11) return 1;
  return 0;
}

function getCpuAction(p, callAmt, community, bigBlind) {
  const hs = community.length===0 ? evalPreflopStrength(p.holeCards) :
    (() => { const r=getBestHand(community,p.holeCards)[0]; return r===0?0:r===1?1:r===2?2:3; })();
  const isHuge = callAmt > p.chips * 0.3;
  const stdRaise = bigBlind*2;
  const aggRaise = bigBlind*4;
  let weights=[0,0,0], raiseAmt=stdRaise;
  if (p.profile==="Aggressive") {
    raiseAmt=aggRaise;
    if (hs===3) weights=[70,30,0];
    else if (hs===2) weights=[50,40,10];
    else if (hs===1) weights=[30,40,30];
    else weights=[20,20,60];
  } else if (p.profile==="Conservative") {
    if (hs===3) weights=[60,40,0];
    else if (hs===2) weights=[30,60,10];
    else if (hs===1) weights=[5,45,50];
    else weights=[0,10,90];
  } else if (p.profile==="Calling Station") {
    if (hs===3) weights=[20,80,0];
    else if (hs===2) weights=[10,85,5];
    else if (hs===1) weights=[0,90,10];
    else weights=[0,70,30];
  } else {
    if (hs===3) weights=[50,50,0];
    else if (hs===2) weights=[30,60,10];
    else if (hs===1) weights=[10,60,30];
    else weights=[5,20,75];
  }
  if (callAmt>0&&isHuge&&hs<2) { weights[2]+=40; weights[0]=Math.max(0,weights[0]-20); weights[1]=Math.max(0,weights[1]-20); }
  if (callAmt===0) { weights[1]+=weights[2]; weights[2]=0; }
  const total=weights.reduce((a,b)=>a+b,0);
  const r=Math.random()*total;
  if (r<weights[0]) return {type:'raise',amount:raiseAmt};
  if (r<weights[0]+weights[1]) return {type:'call'};
  return {type:'fold'};
}

// ─── CARD DISPLAY ──────────────────────────────────────────────
const isRed = s => s==='♥'||s==='♦';

function CardFace({ card, hidden=false, small=false }) {
  const val = card?.[0];
  const suit = card?.[1];
  const red = isRed(suit);
  const sz = small ? 'w-10 h-14 text-xs' : 'w-14 h-20 text-sm';
  if (hidden) return (
    <div className={`${sz} rounded-lg flex items-center justify-center shadow-lg`}
      style={{background:'linear-gradient(135deg,#1a3a6b 0%,#0d2144 50%,#1a3a6b 100%)',border:'1px solid #2a4a8b'}}>
      <div style={{fontSize: small?'1.2rem':'1.6rem',opacity:0.4}}>🂠</div>
    </div>
  );
  return (
    <div className={`${sz} rounded-lg flex flex-col justify-between p-1 shadow-lg`}
      style={{background:'#fff',border:'1px solid #ccc',color:red?'#c0392b':'#1a1a2e'}}>
      <div className="font-bold leading-none" style={{fontSize:small?'0.7rem':'0.9rem'}}>{val}<br/>{suit}</div>
      <div className="font-bold leading-none self-end rotate-180" style={{fontSize:small?'0.7rem':'0.9rem'}}>{val}<br/>{suit}</div>
    </div>
  );
}

function EmptyCard({ small=false }) {
  const sz = small ? 'w-10 h-14' : 'w-14 h-20';
  return <div className={`${sz} rounded-lg`} style={{background:'rgba(255,255,255,0.05)',border:'1px dashed rgba(255,255,255,0.15)'}}/>;
}

// ─── GAME STATES ───────────────────────────────────────────────
const PHASE = { SETUP:'setup', PLAYING:'playing', WAITING:'waiting', SHOWDOWN:'showdown', GAMEOVER:'gameover' };
const ROUND = { PRE_FLOP:'Pre-Flop', FLOP:'Flop', TURN:'Turn', RIVER:'River' };

function makePlayer(name, chips, isCpu=false, profile=null) {
  return { name, chips, isCpu, profile: profile || (isCpu?BOT_PROFILES[Math.floor(Math.random()*BOT_PROFILES.length)]:'Human'),
    holeCards:[], currentBet:0, isFolded:false, isEliminated:false };
}

// ─── MAIN COMPONENT ────────────────────────────────────────────
export default function PokerGame() {
  const [phase, setPhase] = useState(PHASE.SETUP);
  const [setupForm, setSetupForm] = useState({ name:'', chips:'1000', smallBlind:'10', numBots:'2', assist:'true', showProfiles:'true', blindMultiplier:'2', blindInterval:'10' });
  const [players, setPlayers] = useState([]);
  const [deck, setDeck] = useState([]);
  const [community, setCommunity] = useState([]);
  const [pot, setPot] = useState(0);
  const [highestBet, setHighestBet] = useState(0);
  const [dealerIdx, setDealerIdx] = useState(0);
  const [smallBlind, setSmallBlind] = useState(10);
  const [bigBlind, setBigBlind] = useState(20);
  const [assistMode, setAssistMode] = useState(true);
  const [showBotProfiles, setShowBotProfiles] = useState(true);
  const [round, setRound] = useState(ROUND.PRE_FLOP);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [hasActed, setHasActed] = useState({});
  const [log, setLog] = useState([]);
  const [raiseInput, setRaiseInput] = useState('');
  const [showdown, setShowdown] = useState(null);
  const [gameResult, setGameResult] = useState('');
  const [botThinking, setBotThinking] = useState(false);
  const [blindMultiplier, setBlindMultiplier] = useState(2);
  const [blindIntervalMinutes, setBlindIntervalMinutes] = useState(10);
  const [gameStartTime, setGameStartTime] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [blindLevel, setBlindLevel] = useState(1);
  const logRef = useRef(null);
  const gameStateRef = useRef({});

  const addLog = useCallback((msg, type='normal') => {
    setLog(l => [...l.slice(-60), { msg, type, id: Date.now()+Math.random() }]);
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  // Game timer for blind escalation
  useEffect(() => {
    if (phase !== PHASE.PLAYING && phase !== PHASE.WAITING) return;
    if (!gameStartTime) return;
    
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - gameStartTime) / 1000);
      setElapsedSeconds(elapsed);
      
      // Check if blinds should increase
      const intervalSeconds = blindIntervalMinutes * 60;
      const newLevel = Math.floor(elapsed / intervalSeconds) + 1;
      
      if (newLevel > blindLevel) {
        const multiplier = Math.pow(blindMultiplier, newLevel - 1);
        const baseSB = parseInt(setupForm.smallBlind) || 10;
        const newSB = Math.round(baseSB * multiplier);
        const newBB = newSB * 2;
        
        setSmallBlind(newSB);
        setBigBlind(newBB);
        setBlindLevel(newLevel);
        addLog(`🔔 Blinds increased to ${newSB}/${newBB}!`, 'round');
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [phase, gameStartTime, elapsedSeconds, blindLevel, blindIntervalMinutes, blindMultiplier, setupForm.smallBlind, addLog]);

  // Store mutable state for bot callbacks
  useEffect(() => {
    gameStateRef.current = { players, deck, community, pot, highestBet, dealerIdx, round, currentTurn, hasActed, smallBlind, bigBlind };
  });

  // ── GAME INIT ─────────────────────────────────────────────────
  function startGame() {
    const { name, chips, smallBlind: sb, numBots, assist, showProfiles, blindMultiplier: bm, blindInterval: bi } = setupForm;
    if (!name.trim()) return;
    const sc = parseInt(chips)||1000, sbl = parseInt(sb)||10, nb = Math.min(5,Math.max(1,parseInt(numBots)||2));
    const bmVal = parseFloat(bm) || 2;
    const biVal = parseInt(bi) || 10;
    const ps = [makePlayer(name.trim(), sc, false)];
    for (let i=0;i<nb;i++) ps.push(makePlayer(`Bot_${i+1}`,sc,true));
    setPlayers(ps);
    setSmallBlind(sbl);
    setBigBlind(sbl*2);
    setAssistMode(assist==='true');
    setShowBotProfiles(showProfiles==='true');
    setBlindMultiplier(bmVal);
    setBlindIntervalMinutes(biVal);
    setGameStartTime(Date.now());
    setElapsedSeconds(0);
    setBlindLevel(1);
    setDealerIdx(0);
    setLog([]);
    startHand(ps, 0, sbl, sbl*2);
  }

  function startHand(ps, dIdx, sb, bb) {
    const alive = ps.filter(p=>!p.isEliminated);
    if (alive.length < 2) return;
    const newDeck = buildDeck();
    let deckCopy = [...newDeck];

    // Reset players
    const reset = alive.map(p => ({...p, holeCards:[], currentBet:0, isFolded:false}));

    // Deal hole cards
    for (let i=0;i<2;i++) reset.forEach(p=>{ p.holeCards.push(deckCopy.pop()); });

    // Post blinds
    const sbIdx = (dIdx+1) % reset.length;
    const bbIdx = (dIdx+2) % reset.length;
    const sbAmt = Math.min(sb, reset[sbIdx].chips);
    const bbAmt = Math.min(bb, reset[bbIdx].chips);
    reset[sbIdx].chips -= sbAmt; reset[sbIdx].currentBet = sbAmt;
    reset[bbIdx].chips -= bbAmt; reset[bbIdx].currentBet = bbAmt;
    const newPot = sbAmt + bbAmt;
    const newHighest = bb;

    setPlayers(reset);
    setDeck(deckCopy);
    deckRef.current = deckCopy;
    setCommunity([]);
    setPot(newPot);
    setHighestBet(newHighest);
    setRound(ROUND.PRE_FLOP);
    setShowdown(null);

    const acted = {};
    reset.forEach(p=>acted[p.name]=false);
    setHasActed(acted);

    const startIdx = (dIdx+3) % reset.length;
    setCurrentTurn(startIdx);
    setPhase(PHASE.PLAYING);

    addLog(`━━━ NEW HAND ━━━ Dealer: ${reset[dIdx].name}`, 'round');
    addLog(`${reset[sbIdx].name} posts SB ${sbAmt} | ${reset[bbIdx].name} posts BB ${bbAmt}`, 'blind');
  }

  // ── BOT ACTION ────────────────────────────────────────────────
  const doBotAction = useCallback(() => {
    const { players:ps, community:comm, pot:curPot, highestBet:hb, currentTurn:ct, hasActed:ha, bigBlind:bb, dealerIdx:di, round:rnd } = gameStateRef.current;
    const p = ps[ct];
    if (!p||!p.isCpu||p.isFolded) return;

    const callAmt = hb - p.currentBet;
    const action = getCpuAction(p, callAmt, comm, bb);
    const newPs = ps.map(x=>({...x}));
    const np = newPs[ct];
    let newPot = curPot, newHb = hb, newHa = {...ha};

    if (action.type==='fold') {
      np.isFolded = true;
      addLog(`${np.name} folds`, 'fold');
    } else if (action.type==='raise') {
      const total = Math.min(callAmt + action.amount, np.chips);
      np.chips -= total; np.currentBet += total; newPot += total; newHb = np.currentBet;
      addLog(`${np.name} raises to ${np.currentBet}`, 'raise');
      newPs.forEach(x=>{ newHa[x.name]=false; });
    } else {
      const actual = Math.min(callAmt, np.chips);
      np.chips -= actual; np.currentBet += actual; newPot += actual;
      addLog(actual===0 ? `${np.name} checks` : `${np.name} calls ${actual}`, 'call');
    }
    newHa[np.name] = true;

    setPlayers(newPs);
    setPot(newPot);
    setHighestBet(newHb);
    setHasActed(newHa);
    setBotThinking(false);

    // advance
    advanceTurn(newPs, ct, newHb, newHa, newPot, comm, rnd, di, bb);
  }, [addLog]);

  useEffect(() => {
    if (phase !== PHASE.PLAYING) return;
    const p = players[currentTurn];
    if (!p||p.isFolded||p.isCpu===false) return;
    setBotThinking(true);
    const t = setTimeout(doBotAction, 900 + Math.random()*600);
    return () => clearTimeout(t);
  }, [phase, currentTurn, players, doBotAction]);

  function advanceTurn(ps, ct, hb, ha, curPot, comm, rnd, di, bb) {
    const active = ps.filter(p=>!p.isFolded);

    // Everyone folded except one
    if (active.length===1) {
      const winner = active[0];
      const newPs = ps.map(p=> p.name===winner.name ? {...p, chips:p.chips+curPot} : p);
      addLog(`${winner.name} wins ${curPot} chips! (all others folded)`, 'win');
      setPot(0);
      setPlayers(newPs);
      endHand(newPs, di, bb/2);
      return;
    }

    // Check if round is over
    const allActed = active.filter(p=>p.chips>0).every(p=>ha[p.name]);
    const allMatched = active.filter(p=>p.chips>0).every(p=>p.currentBet===hb);

    if (allActed && allMatched) {
      nextRound(ps, curPot, hb, comm, rnd, di, bb);
      return;
    }

    // Next player
    let next = (ct+1) % ps.length;
    while (ps[next].isFolded || ps[next].chips<=0) next = (next+1) % ps.length;
    setCurrentTurn(next);
  }

  // Use a ref to track the live deck for imperative dealing
  const deckRef = useRef([]);
  useEffect(() => { deckRef.current = deck; }, [deck]);

  function nextRound(ps, curPot, hb, comm, rnd, di, bb) {
    if (rnd===ROUND.RIVER) {
      doShowdown(ps, comm, curPot, di, bb);
      return;
    }

    // Determine next round name
    let newRound;
    if (rnd===ROUND.PRE_FLOP) newRound=ROUND.FLOP;
    else if (rnd===ROUND.FLOP) newRound=ROUND.TURN;
    else newRound=ROUND.RIVER;

    // Deal community cards from ref deck
    const d = [...deckRef.current];
    d.pop(); // burn card
    let newComm;
    if (newRound===ROUND.FLOP) {
      newComm=[d.pop(),d.pop(),d.pop()];
      addLog(`Flop: ${newComm.join(' ')}`, 'community');
    } else {
      const card = d.pop();
      newComm = [...comm, card];
      addLog(`${newRound}: ${card}`, 'community');
    }
    deckRef.current = d;
    setDeck(d);
    setCommunity(newComm);

    const newPs = ps.map(p=>({...p, currentBet:0}));
    const newHa = {};
    newPs.forEach(p=>newHa[p.name]=false);

    addLog(`━━━ ${newRound.toUpperCase()} ━━━`, 'round');
    setRound(newRound);
    setPlayers(newPs);
    setPot(curPot);
    setHighestBet(0);
    setHasActed(newHa);

    const startIdx = (di+1) % newPs.length;
    let idx = startIdx;
    while (newPs[idx].isFolded) idx = (idx+1)%newPs.length;
    setCurrentTurn(idx);
  }

  function doShowdown(ps, comm, curPot, di, bb) {
    const active = ps.filter(p=>!p.isFolded);
    let bestScore = [-1,[]];
    let winners = [];
    const results = active.map(p => {
      const score = getBestHand(comm, p.holeCards);
      if (compareSrc(score, bestScore)>0) { bestScore=score; winners=[p]; }
      else if (compareSrc(score,bestScore)===0) winners.push(p);
      return { player:p, score, handStr:handName(score) };
    });

    const winAmt = Math.floor(curPot / winners.length);
    const newPs = ps.map(p => {
      if (winners.find(w=>w.name===p.name)) return {...p, chips:p.chips+winAmt};
      return {...p};
    });

    addLog(`━━━ SHOWDOWN ━━━ ${handName(bestScore)}`, 'round');
    winners.forEach(w => addLog(`🏆 ${w.name} wins ${winAmt} chips!`, 'win'));

    setShowdown({ results, winners, bestHand: handName(bestScore) });
    setPot(0);
    setPlayers(newPs);
    setPhase(PHASE.SHOWDOWN);

    setTimeout(() => endHand(newPs, di, bb/2), 3500);
  }

  function endHand(ps, di, sb) {
    const alive = ps.filter(p=>p.chips>0);
    const eliminated = ps.filter(p=>p.chips<=0);
    eliminated.forEach(p=>addLog(`💀 ${p.name} eliminated!`, 'elim'));

    const human = alive.find(p=>!p.isCpu);
    if (!human) { setPhase(PHASE.GAMEOVER); setGameResult('lose'); return; }
    if (alive.length===1) { setPhase(PHASE.GAMEOVER); setGameResult('win'); return; }

    const newPs = alive.map(p=>({...p}));
    const newDi = (di+1) % newPs.length;
    setDealerIdx(newDi);
    setPhase(PHASE.WAITING);
  }

  function handleNextHand() {
    startHand(players.filter(p=>p.chips>0), dealerIdx, smallBlind, bigBlind);
  }

  // ── HUMAN ACTION ──────────────────────────────────────────────
  function handleAction(type, amount=0) {
    const ps = [...players.map(p=>({...p}))];
    const p = ps[currentTurn];
    if (!p||p.isCpu||p.isFolded) return;
    const callAmt = highestBet - p.currentBet;
    let newPot=pot, newHb=highestBet, newHa={...hasActed};

    if (type==='fold') {
      p.isFolded=true;
      addLog(`${p.name} folds`, 'fold');
    } else if (type==='raise') {
      const total = Math.min(callAmt+amount, p.chips);
      if (total<=callAmt&&p.chips>callAmt) { addLog('Raise must be > 0','error'); return; }
      p.chips-=total; p.currentBet+=total; newPot+=total; newHb=p.currentBet;
      addLog(`You raise to ${p.currentBet}`, 'raise');
      ps.forEach(x=>newHa[x.name]=false);
    } else {
      const actual=Math.min(callAmt,p.chips);
      p.chips-=actual; p.currentBet+=actual; newPot+=actual;
      addLog(actual===0 ? 'You check' : `You call ${actual}`, 'call');
    }
    newHa[p.name]=true;
    setRaiseInput('');
    setPlayers(ps);
    setPot(newPot);
    setHighestBet(newHb);
    setHasActed(newHa);
    advanceTurn(ps, currentTurn, newHb, newHa, newPot, community, round, dealerIdx, bigBlind);
  }

  // ── DERIVED ───────────────────────────────────────────────────
  const human = players.find(p=>!p.isCpu);
  const callAmt = human ? Math.max(0, highestBet - (human.currentBet||0)) : 0;
  const isHumanTurn = phase===PHASE.PLAYING && players[currentTurn] && !players[currentTurn].isCpu && !players[currentTurn].isFolded;
  const assistHand = assistMode && human && human.holeCards.length===2
    ? (community.length===0
        ? (()=>{ const v1=human.holeCards[0][0],v2=human.holeCards[1][0]; return v1===v2?`Pair of ${v1}s`:`High Card ${CARD_VALUES[v1]>CARD_VALUES[v2]?v1:v2}`; })()
        : handName(getBestHand(community, human.holeCards)))
    : null;

  // ── SETUP SCREEN ──────────────────────────────────────────────
  if (phase===PHASE.SETUP) return (
    <div style={{ minHeight:'100vh', background:'#0a1628', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Georgia, serif' }}>
      <div style={{ background:'linear-gradient(145deg,#0f2040,#071528)', border:'1px solid rgba(180,140,60,0.3)', borderRadius:16, padding:40, width:380, boxShadow:'0 0 60px rgba(0,0,0,0.8)' }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontSize:48 }}>🃏</div>
          <h1 style={{ color:'#c8a84b', fontFamily:'Georgia,serif', fontSize:28, margin:'8px 0 4px', letterSpacing:2 }}>POKER</h1>
          <p style={{ color:'rgba(200,168,75,0.6)', fontSize:12, letterSpacing:4, textTransform:'uppercase' }}>Texas Hold'em</p>
        </div>
        {[['Your Name','name','text','Maverick'],['Starting Chips','chips','number','1000'],['Small Blind','smallBlind','number','10'],['# of Bots (1-5)','numBots','number','2'],['Blind Multiplier','blindMultiplier','number','2'],['Blind Interval (min)','blindInterval','number','10']].map(([label,key,type,ph])=>(
          <div key={key} style={{ marginBottom:16 }}>
            <label style={{ color:'rgba(200,168,75,0.8)', fontSize:12, letterSpacing:1, display:'block', marginBottom:6, textTransform:'uppercase' }}>{label}</label>
            <input type={type} value={setupForm[key]} min={key==='numBots'?1:undefined} max={key==='numBots'?5:undefined}
              onChange={e=>setSetupForm(f=>({...f,[key]:e.target.value}))}
              placeholder={ph}
              style={{ width:'100%', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(180,140,60,0.3)', borderRadius:8, padding:'10px 14px', color:'#e8d5a0', fontSize:15, outline:'none', boxSizing:'border-box' }}/>
          </div>
        ))}
        <div style={{ marginBottom:16, display:'flex', alignItems:'center', gap:10 }}>
          <label style={{ color:'rgba(200,168,75,0.8)', fontSize:12, letterSpacing:1, textTransform:'uppercase' }}>Assist Mode</label>
          <div onClick={()=>setSetupForm(f=>({...f,assist:f.assist==='true'?'false':'true'}))}
            style={{ width:44,height:24,borderRadius:12,background:setupForm.assist==='true'?'#c8a84b':'rgba(255,255,255,0.1)',cursor:'pointer',position:'relative',transition:'background 0.2s' }}>
            <div style={{ position:'absolute',top:2,left:setupForm.assist==='true'?22:2,width:20,height:20,borderRadius:'50%',background:'#fff',transition:'left 0.2s' }}/>
          </div>
        </div>
        <div style={{ marginBottom:24, display:'flex', alignItems:'center', gap:10 }}>
          <label style={{ color:'rgba(200,168,75,0.8)', fontSize:12, letterSpacing:1, textTransform:'uppercase' }}>Show Bot Types</label>
          <div onClick={()=>setSetupForm(f=>({...f,showProfiles:f.showProfiles==='true'?'false':'true'}))}
            style={{ width:44,height:24,borderRadius:12,background:setupForm.showProfiles==='true'?'#c8a84b':'rgba(255,255,255,0.1)',cursor:'pointer',position:'relative',transition:'background 0.2s' }}>
            <div style={{ position:'absolute',top:2,left:setupForm.showProfiles==='true'?22:2,width:20,height:20,borderRadius:'50%',background:'#fff',transition:'left 0.2s' }}/>
          </div>
        </div>
        <button onClick={startGame}
          style={{ width:'100%', padding:'14px 0', background:'linear-gradient(135deg,#c8a84b,#a07030)', border:'none', borderRadius:8, color:'#0a1628', fontFamily:'Georgia,serif', fontSize:16, fontWeight:'bold', letterSpacing:2, cursor:'pointer', textTransform:'uppercase' }}>
          Deal Me In
        </button>
      </div>
    </div>
  );

  // ── GAME OVER ─────────────────────────────────────────────────
  if (phase===PHASE.GAMEOVER) return (
    <div style={{ minHeight:'100vh', background:'#0a1628', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Georgia,serif' }}>
      <div style={{ textAlign:'center', padding:40 }}>
        <div style={{ fontSize:72 }}>{gameResult==='win'?'🏆':'💸'}</div>
        <h1 style={{ color:gameResult==='win'?'#c8a84b':'#e74c3c', fontSize:42, margin:'16px 0 8px' }}>
          {gameResult==='win'?'You Win!':'Busted Out'}
        </h1>
        <p style={{ color:'rgba(200,168,75,0.6)', fontSize:16, marginBottom:32 }}>
          {gameResult==='win'?'You outlasted all the bots!':'Better luck next time.'}
        </p>
        <button onClick={()=>{setPhase(PHASE.SETUP);setPlayers([]);setLog([]);}}
          style={{ padding:'14px 40px', background:'linear-gradient(135deg,#c8a84b,#a07030)', border:'none', borderRadius:8, color:'#0a1628', fontFamily:'Georgia,serif', fontSize:16, fontWeight:'bold', cursor:'pointer', letterSpacing:2 }}>
          Play Again
        </button>
      </div>
    </div>
  );

  // ── MAIN GAME ─────────────────────────────────────────────────
  const activePlayers = players.filter(p=>!p.isFolded);
  const bots = players.filter(p=>p.isCpu);

  return (
    <div style={{ minHeight:'100vh', background:'#071020', fontFamily:'Georgia,serif', display:'flex', flexDirection:'column' }}>
      {/* Header */}
      <div style={{ background:'rgba(0,0,0,0.4)', borderBottom:'1px solid rgba(180,140,60,0.2)', padding:'10px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ color:'#c8a84b', fontWeight:'bold', fontSize:18, letterSpacing:2 }}>♠ POKER ♣</span>
        <div style={{ display:'flex', gap:20, alignItems:'center' }}>
          <div style={{ color:'rgba(200,168,75,0.7)', fontSize:12 }}>
            <div>⏱️ {Math.floor(elapsedSeconds / 60)}:{String(elapsedSeconds % 60).padStart(2, '0')}</div>
            <div style={{ fontSize:10, opacity:0.7 }}>Level {blindLevel} · {smallBlind}/{bigBlind}</div>
          </div>
          <span style={{ color:'rgba(200,168,75,0.7)', fontSize:13 }}>{round}</span>
          <span style={{ color:'#e8d5a0', fontSize:13 }}>Pot: <strong style={{color:'#c8a84b'}}>{pot}</strong></span>
        </div>
        <button onClick={()=>setPhase(PHASE.SETUP)} style={{ background:'none', border:'1px solid rgba(180,140,60,0.3)', color:'rgba(200,168,75,0.6)', padding:'4px 12px', borderRadius:6, cursor:'pointer', fontSize:12 }}>Menu</button>
      </div>

      <div style={{ flex:1, display:'flex', flexDirection:'column', maxWidth:900, margin:'0 auto', width:'100%', padding:'16px', gap:12, boxSizing:'border-box' }}>
        {/* Bots */}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'center' }}>
          {bots.map((bot,i)=>{
            const isThinking = botThinking && currentTurn===players.indexOf(bot);
            return (
              <div key={bot.name} style={{ background:'rgba(255,255,255,0.04)', border:`1px solid ${bot.isFolded?'rgba(100,100,100,0.2)':'rgba(180,140,60,0.2)'}`, borderRadius:10, padding:'10px 14px', minWidth:130, opacity:bot.isFolded?0.4:1, position:'relative' }}>
                {isThinking && <div style={{ position:'absolute',top:4,right:6,width:8,height:8,borderRadius:'50%',background:'#c8a84b',animation:'pulse 0.8s infinite' }}/>}
                {showBotProfiles && <div style={{ color:'rgba(200,168,75,0.8)', fontSize:11, marginBottom:4, textTransform:'uppercase', letterSpacing:1 }}>{bot.profile}</div>}
                <div style={{ color:'#e8d5a0', fontSize:13, fontWeight:'bold', marginBottom:6 }}>{bot.name.replace(/Bot_\d+\s?/,'Bot '+(i+1))}</div>
                <div style={{ display:'flex', gap:4, marginBottom:6 }}>
                  {bot.holeCards.length>0
                    ? bot.holeCards.map((c,j)=><CardFace key={j} card={c} hidden={!showdown} small/>)
                    : [0,1].map(j=><EmptyCard key={j} small/>)}
                </div>
                <div style={{ color:'#c8a84b', fontSize:12 }}>💰 {bot.chips}</div>
                {bot.currentBet>0&&<div style={{ color:'rgba(200,168,75,0.6)', fontSize:11 }}>Bet: {bot.currentBet}</div>}
                {bot.isFolded&&<div style={{ color:'#e74c3c', fontSize:11 }}>FOLDED</div>}
                {players[currentTurn]?.name===bot.name&&!bot.isFolded&&<div style={{ color:'#c8a84b', fontSize:10, marginTop:2 }}>◀ ACTING</div>}
              </div>
            );
          })}
        </div>

        {/* Community Cards */}
        <div style={{ background:'#0d2a18', border:'2px solid rgba(180,140,60,0.25)', borderRadius:16, padding:'20px', textAlign:'center', position:'relative' }}>
          <div style={{ color:'rgba(200,168,75,0.5)', fontSize:11, letterSpacing:3, textTransform:'uppercase', marginBottom:12 }}>{round} — Community Cards</div>
          <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
            {[0,1,2,3,4].map(i=>(
              community[i] ? <CardFace key={i} card={community[i]}/> : <EmptyCard key={i}/>
            ))}
          </div>
          <div style={{ marginTop:12, color:'#c8a84b', fontSize:18, fontWeight:'bold' }}>Pot: {pot}</div>
          {showdown && (
            <div style={{ marginTop:8, color:'#e8d5a0', fontSize:13 }}>
              🏆 {showdown.bestHand} — {showdown.winners.map(w=>w.name).join(' & ')} win!
            </div>
          )}
        </div>

        {/* Human Player */}
        {human && (
          <div style={{ background:isHumanTurn?'rgba(200,168,75,0.08)':'rgba(255,255,255,0.03)', border:`2px solid ${isHumanTurn?'rgba(200,168,75,0.6)':'rgba(180,140,60,0.2)'}`, borderRadius:14, padding:'16px 20px', transition:'all 0.3s' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
              <div>
                <div style={{ color:'rgba(200,168,75,0.7)', fontSize:11, textTransform:'uppercase', letterSpacing:1 }}>You {isHumanTurn?'▶ Your Turn':''}</div>
                <div style={{ color:'#e8d5a0', fontSize:16, fontWeight:'bold', marginBottom:8 }}>{human.name}</div>
                <div style={{ display:'flex', gap:6 }}>
                  {human.holeCards.map((c,i)=><CardFace key={i} card={c}/>)}
                </div>
                {assistHand&&<div style={{ color:'#c8a84b', fontSize:13, marginTop:6 }}>✨ {assistHand}</div>}
                {human.isFolded&&<div style={{ color:'#e74c3c', fontSize:14, marginTop:6 }}>FOLDED</div>}
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ color:'#c8a84b', fontSize:20, fontWeight:'bold' }}>💰 {human.chips}</div>
                {human.currentBet>0&&<div style={{ color:'rgba(200,168,75,0.6)', fontSize:13 }}>Bet: {human.currentBet}</div>}
                <div style={{ color:'rgba(200,168,75,0.6)', fontSize:13 }}>To Call: {callAmt}</div>
              </div>
            </div>

            {/* Action Buttons */}
            {isHumanTurn && !human.isFolded && (
              <div style={{ marginTop:16, display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
                <button onClick={()=>handleAction('fold')}
                  style={{ padding:'10px 20px', background:'rgba(231,76,60,0.15)', border:'1px solid rgba(231,76,60,0.4)', borderRadius:8, color:'#e74c3c', cursor:'pointer', fontFamily:'Georgia,serif', fontSize:14, fontWeight:'bold' }}>
                  Fold
                </button>
                <button onClick={()=>handleAction('call')}
                  style={{ padding:'10px 20px', background:'rgba(39,174,96,0.15)', border:'1px solid rgba(39,174,96,0.4)', borderRadius:8, color:'#2ecc71', cursor:'pointer', fontFamily:'Georgia,serif', fontSize:14, fontWeight:'bold' }}>
                  {callAmt===0 ? 'Check' : `Call ${callAmt}`}
                </button>
                <input type="number" value={raiseInput} onChange={e=>setRaiseInput(e.target.value)}
                  placeholder="Raise amt" min={1} max={human.chips}
                  style={{ width:100, background:'rgba(255,255,255,0.07)', border:'1px solid rgba(180,140,60,0.3)', borderRadius:8, padding:'10px 12px', color:'#e8d5a0', fontSize:14, outline:'none' }}/>
                <button onClick={()=>{ const r=parseInt(raiseInput); if(r>0) handleAction('raise',r); }}
                  style={{ padding:'10px 20px', background:'rgba(200,168,75,0.15)', border:'1px solid rgba(200,168,75,0.4)', borderRadius:8, color:'#c8a84b', cursor:'pointer', fontFamily:'Georgia,serif', fontSize:14, fontWeight:'bold' }}>
                  Raise
                </button>
                <button onClick={()=>handleAction('raise',human.chips-callAmt)}
                  style={{ padding:'10px 20px', background:'rgba(200,168,75,0.25)', border:'1px solid rgba(200,168,75,0.6)', borderRadius:8, color:'#c8a84b', cursor:'pointer', fontFamily:'Georgia,serif', fontSize:14, fontWeight:'bold' }}>
                  All-In
                </button>
              </div>
            )}
          </div>
        )}

        {/* Next Hand / Log */}
        <div style={{ display:'flex', gap:12, flex:1 }}>
          {/* Log */}
          <div ref={logRef} style={{ flex:1, background:'rgba(0,0,0,0.3)', border:'1px solid rgba(180,140,60,0.15)', borderRadius:10, padding:'10px 14px', overflowY:'auto', maxHeight:160, fontSize:12 }}>
            {log.map(entry=>(
              <div key={entry.id} style={{ marginBottom:3, color:
                entry.type==='win'?'#f1c40f':entry.type==='fold'?'rgba(231,76,60,0.8)':entry.type==='raise'?'#e67e22':entry.type==='round'?'rgba(200,168,75,0.9)':entry.type==='community'?'#3498db':entry.type==='elim'?'#e74c3c':entry.type==='error'?'#e74c3c':'rgba(232,213,160,0.7)' }}>
                {entry.msg}
              </div>
            ))}
          </div>

          {/* Next hand button */}
          {phase===PHASE.WAITING && (
            <button onClick={handleNextHand}
              style={{ padding:'0 28px', background:'linear-gradient(135deg,#c8a84b,#a07030)', border:'none', borderRadius:10, color:'#0a1628', fontFamily:'Georgia,serif', fontSize:15, fontWeight:'bold', cursor:'pointer', letterSpacing:1 }}>
              Next Hand ▶
            </button>
          )}
        </div>

        {/* Chip counts */}
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {players.map(p=>(
            <div key={p.name} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(180,140,60,0.15)', borderRadius:6, padding:'4px 10px', fontSize:12 }}>
              <span style={{ color:'rgba(200,168,75,0.7)' }}>{p.isCpu ? p.name.replace(/Bot_\d+\s?/,'🤖 ') : '👤 '+p.name}</span>
              <span style={{ color:'#c8a84b', marginLeft:6, fontWeight:'bold' }}>{p.chips}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}
