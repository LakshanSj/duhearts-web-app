import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { listenToRoom, updateGameState, listenToMessages, sendMessage, enterGame, leaveGame } from '../services/roomService';
import { SendHorizonal } from 'lucide-react';

// ── Toast notification ────────────────────────────────────────
function Toast({ message, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div style={{
      position: 'fixed', top: '80px', left: '50%', transform: 'translateX(-50%)',
      background: 'var(--glass-bg)', border: '3px solid var(--glass-border)',
      borderRadius: '20px', padding: '0.6rem 1.4rem',
      boxShadow: '4px 4px 0px rgba(77,58,43,0.2)',
      fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)',
      zIndex: 9999, pointerEvents: 'none',
      animation: 'popIn 0.3s ease forwards',
      whiteSpace: 'nowrap',
    }}>
      {message}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────
const name1 = (r) => r.hostName || 'Host';
const name2 = (r) => r.guestName || 'Guest';

// ── SOS ──────────────────────────────────────────────────────
function SOSGame({ roomData, user }) {
  const SIZE = 5;
  const board = roomData.board || Array(SIZE * SIZE).fill("");
  const turnPlayer1 = roomData.turnPlayer1;
  const scores = roomData.scores || { p1: 0, p2: 0 };
  const winningLines = roomData.winningLines || [];
  const [selectedLetter, setSelectedLetter] = useState('S');

  const isHost = user?.uid === roomData.hostId;
  const isSoloTestMode = isHost && !roomData.guestId;
  const isMyTurn = isSoloTestMode ? true : (isHost ? turnPlayer1 : !turnPlayer1);

  const checkSOS = (newBoard, index, letter) => {
    let newSOSCount = 0, newLines = [];
    const r = Math.floor(index / SIZE), c = index % SIZE;
    const checkLine = (r1,c1,r2,c2,r3,c3) => {
      if ([r1,r2,r3].every(x=>x>=0&&x<SIZE) && [c1,c2,c3].every(x=>x>=0&&x<SIZE)) {
        const [i1,i2,i3] = [r1*SIZE+c1, r2*SIZE+c2, r3*SIZE+c3];
        if (newBoard[i1]==='S' && newBoard[i2]==='O' && newBoard[i3]==='S') { newLines.push(i1,i2,i3); return 1; }
      }
      return 0;
    };
    for (let [dr,dc] of [[0,1],[1,0],[1,1],[1,-1]]) {
      if (letter==='S') {
        newSOSCount += checkLine(r,c,r+dr,c+dc,r+2*dr,c+2*dc);
        newSOSCount += checkLine(r-2*dr,c-2*dc,r-dr,c-dc,r,c);
      } else if (letter==='O') {
        newSOSCount += checkLine(r-dr,c-dc,r,c,r+dr,c+dc);
      }
    }
    return { newSOSCount, newLines };
  };

  const handleClick = async (i) => {
    if (!isMyTurn) { if (window.showAlert) window.showAlert("It's not your turn!"); return; }
    if (board[i] || !board.includes("")) return;
    const newBoard = [...board];
    newBoard[i] = selectedLetter;
    const { newSOSCount, newLines } = checkSOS(newBoard, i, selectedLetter);
    const newScores = { ...scores };
    let nextTurn = turnPlayer1;
    if (newSOSCount > 0) { if (turnPlayer1) newScores.p1 += newSOSCount; else newScores.p2 += newSOSCount; }
    else nextTurn = !turnPlayer1;
    try {
      await updateGameState(roomData.roomId, { board: newBoard, scores: newScores, turnPlayer1: nextTurn, winningLines: [...winningLines, ...newLines] });
    } catch (err) { if (window.showAlert) window.showAlert("Failed: " + err.message); }
  };

  const isGameOver = !board.includes("");
  const n1 = name1(roomData), n2 = name2(roomData);
  let status = isSoloTestMode
    ? `Test Mode — Turn: ${turnPlayer1 ? n1 : n2}`
    : `Turn: ${turnPlayer1 ? n1 : n2}`;
  if (isGameOver) {
    if (scores.p1 > scores.p2) status = `${n1} Wins! 💖🎉`;
    else if (scores.p2 > scores.p1) status = `${n2} Wins! 💘🎉`;
    else status = "It's a tie! 🎀";
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h3 style={{ marginBottom: '1rem', textAlign: 'center' }}>{status}</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ padding: '0.5rem 1rem', background: turnPlayer1 ? 'var(--accent-hover)' : 'transparent', borderRadius: '12px' }}>
          <strong>{n1}: {scores.p1}</strong>
        </div>
        <div style={{ padding: '0.5rem 1rem', background: !turnPlayer1 ? 'var(--accent-hover)' : 'transparent', borderRadius: '12px' }}>
          <strong>{n2}: {scores.p2}</strong>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <button className={`btn ${selectedLetter==='S'?'btn-primary':'btn-secondary'}`} onClick={() => setSelectedLetter('S')}>Place 'S'</button>
        <button className={`btn ${selectedLetter==='O'?'btn-primary':'btn-secondary'}`} onClick={() => setSelectedLetter('O')}>Place 'O'</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${SIZE}, clamp(40px, 12vw, 60px))`, gap: 'clamp(4px,1.5vw,8px)' }}>
        {board.map((cell, i) => (
          <button key={i} className="glass-panel" style={{
            width: '100%', aspectRatio: '1/1', fontSize: 'clamp(1rem,5vw,1.5rem)', padding: 0, fontWeight: 'bold',
            color: 'var(--text-main)', background: (roomData.winningLines||[]).includes(i) ? 'var(--accent-hover)' : 'var(--glass-bg)',
            cursor: (isMyTurn && cell==="") ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }} onClick={() => handleClick(i)} disabled={cell !== ""}>
            {cell}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Tic Tac Toe ───────────────────────────────────────────────
function TicTacToeGame({ roomData, user }) {
  const SIZE = 3;
  const board = roomData.board?.length === 9 ? roomData.board : Array(9).fill("");
  const turnPlayer1 = roomData.turnPlayer1;
  const winningLines = roomData.winningLines || [];
  const isHost = user?.uid === roomData.hostId;
  const isSoloTestMode = isHost && !roomData.guestId;
  const isMyTurn = isSoloTestMode ? true : (isHost ? turnPlayer1 : !turnPlayer1);

  const checkWin = (b) => {
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (let [a,bx,c] of lines) if (b[a] && b[a]===b[bx] && b[a]===b[c]) return { winner: b[a], line: [a,bx,c] };
    return null;
  };

  const handleClick = async (i) => {
    if (!isMyTurn || board[i] !== "" || winningLines.length > 0) {
      if (!isMyTurn && window.showAlert) window.showAlert("It's not your turn!"); return;
    }
    const newBoard = [...board];
    newBoard[i] = turnPlayer1 ? 'X' : 'O';
    const winData = checkWin(newBoard);
    try {
      await updateGameState(roomData.roomId, { board: newBoard, turnPlayer1: !turnPlayer1, winningLines: winData ? winData.line : [] });
    } catch (err) { if (window.showAlert) window.showAlert("Failed: " + err.message); }
  };

  const handleReset = async () => {
    if (!isHost) return;
    try { await updateGameState(roomData.roomId, { board: Array(9).fill(""), winningLines: [], turnPlayer1: true }); }
    catch (err) { console.error(err); }
  };

  const isGameOver = winningLines.length > 0 || !board.includes("");
  const n1 = name1(roomData), n2 = name2(roomData);
  let status = isSoloTestMode
    ? `Test Mode — Turn: ${turnPlayer1 ? n1+' (X)' : n2+' (O)'}`
    : `Turn: ${turnPlayer1 ? n1+' (X)' : n2+' (O)'}`;
  if (winningLines.length > 0) status = `${board[winningLines[0]]==='X' ? n1 : n2} Wins! 🎉`;
  else if (isGameOver) status = "It's a draw! 🎀";

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h3 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>{status}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${SIZE}, clamp(60px,15vw,90px))`, gap: 'clamp(6px,2vw,12px)', marginBottom: '2rem' }}>
        {board.map((cell, i) => (
          <button key={i} className="glass-panel" style={{
            width: '100%', aspectRatio: '1/1', fontSize: 'clamp(2rem,8vw,3rem)', padding: 0, fontWeight: 'bold',
            color: cell==='X' ? 'var(--text-main)' : 'var(--accent-hover)',
            background: winningLines.includes(i) ? '#ffd58c' : 'var(--glass-bg)',
            cursor: (isMyTurn && cell==="" && !isGameOver) ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }} onClick={() => handleClick(i)} disabled={cell !== "" || winningLines.length > 0}>
            {cell}
          </button>
        ))}
      </div>
      {isGameOver && isHost && <button className="gradient-btn" onClick={handleReset}>Play Again</button>}
      {isGameOver && !isHost && <p style={{ color: 'var(--text-muted)' }}>Waiting for host to start a new game...</p>}
    </div>
  );
}

// ── Rock Paper Scissors ───────────────────────────────────────
function RockPaperScissorsGame({ roomData, user }) {
  const isHost = user?.uid === roomData.hostId;
  const isSoloTestMode = isHost && !roomData.guestId;
  const maxRounds = roomData.maxRounds || 0;
  const currentRound = roomData.currentRound || 1;
  const scores = roomData.scores || { p1: 0, p2: 0 };
  const p1Choice = roomData.p1Choice || "";
  const p2Choice = roomData.p2Choice || "";
  const roundState = roomData.roundState || "playing";
  const [roundsInput, setRoundsInput] = useState(5);
  const [localChoice, setLocalChoice] = useState("");

  const n1 = name1(roomData), n2 = name2(roomData);
  const choiceIcons = { rock: "✊", paper: "✋", scissors: "✌️" };
  const myChoiceLabel = isHost ? p1Choice : p2Choice;

  const evaluateRound = useCallback(async (c1, c2) => {
    let winner = 0;
    if ((c1==='rock'&&c2==='scissors')||(c1==='paper'&&c2==='rock')||(c1==='scissors'&&c2==='paper')) winner = 1;
    else if (c1 !== c2) winner = 2;
    const newScores = { ...scores };
    if (winner===1) newScores.p1 += 1;
    if (winner===2) newScores.p2 += 1;
    await updateGameState(roomData.roomId, { scores: newScores, roundState: currentRound >= maxRounds ? "over" : "revealed", p2Choice: c2 });
  }, [scores, currentRound, maxRounds, roomData.roomId]);

  useEffect(() => {
    if (roundState==="playing" && (!p1Choice || !p2Choice)) setLocalChoice("");
    if (isHost && p1Choice && (p2Choice || isSoloTestMode) && roundState==="playing") {
      const p2Actual = isSoloTestMode ? ["rock","paper","scissors"][Math.floor(Math.random()*3)] : p2Choice;
      evaluateRound(p1Choice, p2Actual);
    }
  }, [p1Choice, p2Choice, roundState, isHost, isSoloTestMode, evaluateRound]);

  const handleStartGame = async () => {
    if (!isHost) return;
    if (roundsInput < 1 || roundsInput > 25) { if (window.showAlert) window.showAlert("Pick between 1 and 25 rounds."); return; }
    await updateGameState(roomData.roomId, { maxRounds: parseInt(roundsInput), currentRound: 1, p1Choice: "", p2Choice: "", scores: { p1: 0, p2: 0 }, roundState: "playing" });
  };

  const handleNextRound = async () => {
    if (!isHost) return;
    await updateGameState(roomData.roomId, { currentRound: currentRound+1, p1Choice: "", p2Choice: "", roundState: "playing" });
  };

  const selectChoice = async (choice) => {
    if (roundState !== "playing" || myChoiceLabel) return;
    setLocalChoice(choice);
    await updateGameState(roomData.roomId, isHost ? { p1Choice: choice } : { p2Choice: choice });
  };

  if (maxRounds === 0) {
    return isHost ? (
      <div style={{ textAlign: 'center' }}>
        <h3>Game Settings</h3>
        <p>How many rounds would you like to play?</p>
        <input type="number" className="input-field" value={roundsInput} onChange={(e) => setRoundsInput(e.target.value)} min="1" max="25" style={{ width: '100px', margin: '1rem', textAlign: 'center' }} />
        <br /><button className="gradient-btn" onClick={handleStartGame}>Start Match</button>
      </div>
    ) : <div style={{ textAlign: 'center', padding: '1rem' }}>Waiting for {n1} to choose number of rounds...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      <h3 style={{ marginBottom: '1rem' }}>Round {Math.min(currentRound, maxRounds)} of {maxRounds}</h3>

      {/* Score cards — horizontal row, no wrapping */}
      <div style={{ display: 'flex', flexDirection: 'row', gap: '0.75rem', marginBottom: '1.5rem', width: '100%' }}>
        <div className="glass-panel" style={{ flex: 1, minWidth: 0, textAlign: 'center', padding: '0.75rem 0.5rem' }}>
          <h4 style={{ fontSize: 'clamp(0.75rem,3vw,1rem)', marginBottom: '0.4rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n1}</h4>
          <div style={{ fontSize: 'clamp(1rem,4vw,1.4rem)', fontWeight: 800 }}>Score: {scores.p1}</div>
          <div style={{ fontSize: 'clamp(1.8rem,7vw,3rem)', margin: '0.5rem 0' }}>
            {roundState==="playing" ? (p1Choice ? "❔" : "⏳") : choiceIcons[p1Choice]}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', fontSize: '1.5rem', flexShrink: 0 }}>VS</div>

        <div className="glass-panel" style={{ flex: 1, minWidth: 0, textAlign: 'center', padding: '0.75rem 0.5rem' }}>
          <h4 style={{ fontSize: 'clamp(0.75rem,3vw,1rem)', marginBottom: '0.4rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n2}</h4>
          <div style={{ fontSize: 'clamp(1rem,4vw,1.4rem)', fontWeight: 800 }}>Score: {scores.p2}</div>
          <div style={{ fontSize: 'clamp(1.8rem,7vw,3rem)', margin: '0.5rem 0' }}>
            {roundState==="playing" ? (p2Choice ? "❔" : "⏳") : choiceIcons[p2Choice]}
          </div>
        </div>
      </div>

      {roundState === "playing" && (
        <div style={{ textAlign: 'center', width: '100%' }}>
          <p style={{ marginBottom: '0.75rem', fontWeight: 'bold' }}>
            {localChoice ? "Choice locked! Waiting for opponent..." : "Make your choice:"}
          </p>
          {/* Choice buttons always horizontal */}
          <div style={{ display: 'flex', flexDirection: 'row', gap: 'clamp(0.4rem,2vw,1rem)', justifyContent: 'center' }}>
            {["rock","paper","scissors"].map(c => (
              <button key={c} className="btn btn-secondary" style={{
                fontSize: 'clamp(1.5rem,6vw,2.2rem)',
                padding: 'clamp(0.5rem,2vw,1rem)',
                background: localChoice===c ? 'var(--accent-secondary)' : '#fff',
                minWidth: 0, flex: '0 0 auto',
              }} onClick={() => selectChoice(c)} disabled={!!myChoiceLabel}>
                {choiceIcons[c]}
              </button>
            ))}
          </div>
        </div>
      )}

      {roundState === "revealed" && isHost && (
        <button className="gradient-btn" style={{ marginTop: '1rem' }} onClick={handleNextRound}>Start Next Round</button>
      )}
      {roundState === "revealed" && !isHost && (
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>Waiting for {n1} to start next round...</p>
      )}

      {roundState === "over" && (
        <div style={{ textAlign: 'center', margin: '1.5rem 0' }}>
          <h2 style={{ color: 'var(--accent-secondary)' }}>
            GAME OVER!<br />
            {scores.p1 > scores.p2 ? `${n1} Wins! 🎉` : scores.p2 > scores.p1 ? `${n2} Wins! 🎉` : "It's a Tie! 🎀"}
          </h2>
          {isHost && <button className="gradient-btn" onClick={handleStartGame} style={{ marginTop: '1rem' }}>Play Again</button>}
        </div>
      )}
    </div>
  );
}

// ── Main Game view ────────────────────────────────────────────
export default function Game({ user }) {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [roomData, setRoomData] = useState(null);
  const prevRoomData = useRef(null);

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [msgLimit, setMsgLimit] = useState(20);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [toast, setToast] = useState(null);
  const chatScrollRef = useRef(null);
  const chatBottomRef = useRef(null);

  // Register presence when entering, remove on leave/unload
  useEffect(() => {
    if (!roomId || !user) return;
    enterGame(roomId, user);
    const onUnload = () => leaveGame(roomId, user);
    window.addEventListener('beforeunload', onUnload);
    return () => {
      leaveGame(roomId, user);
      window.removeEventListener('beforeunload', onUnload);
    };
  }, [roomId, user]);

  // Listen to room data + detect partner leave/join for toast
  useEffect(() => {
    if (!roomId) return;
    const unsubRoom = listenToRoom(roomId, (data) => {
      if (data && prevRoomData.current) {
        const prev = prevRoomData.current;
        const prevActive = prev.activePlayers || [];
        const currActive = data.activePlayers || [];
        const partnerId = user?.uid === data.hostId ? data.guestId : data.hostId;
        const partnerName = user?.uid === data.hostId ? name2(data) : name1(data);
        if (partnerId) {
          const wasIn = prevActive.includes(partnerId);
          const isIn  = currActive.includes(partnerId);
          if (wasIn && !isIn) setToast(`💔 ${partnerName} left the game`);
          if (!wasIn && isIn) setToast(`💖 ${partnerName} joined back!`);
        }
      }
      prevRoomData.current = data;
      setRoomData(data);
    });
    return () => unsubRoom();
  }, [roomId]);

  // Listen to chat messages (re-subscribes when msgLimit changes)
  useEffect(() => {
    if (!roomId) return;
    const unsubChat = listenToMessages(roomId, msgLimit, (msgs) => {
      if (chatScrollRef.current && loadingOlder) {
        const oldH = chatScrollRef.current.scrollHeight;
        setTimeout(() => {
          if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight - oldH;
          setLoadingOlder(false);
        }, 100);
      }
      setMessages(msgs);
    });
    return () => unsubChat();
  }, [roomId, msgLimit]);

  useEffect(() => {
    if (!loadingOlder) chatBottomRef.current?.scrollIntoView();
  }, [messages]);

  const handleChatScroll = (e) => {
    if (e.target.scrollTop === 0 && messages.length >= msgLimit && !loadingOlder) {
      setLoadingOlder(true);
      setMsgLimit(prev => prev + 20);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    await sendMessage(roomId, user, inputText);
    setInputText('');
  };

  const handleBackHome = () => {
    if (window.showConfirm) {
      window.showConfirm("Are you sure you want to exit the room?", () => navigate('/'));
    } else {
      if (window.confirm("Exit the room?")) navigate('/');
    }
  };

  if (!roomData) return <div className="flex-center animate-in">Loading Game...</div>;

  return (
    <div className="animate-in" style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}

      <div className="game-page-scroll" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '1rem' }}>

        <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto', display: 'flex', justifyContent: 'flex-start' }}>
          <button className="btn btn-secondary" onClick={handleBackHome} style={{ padding: '0.5rem 1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.7)' }}>
            ⬅️ Back Home
          </button>
        </div>

        <div className="glass-panel" style={{ width: '100%', maxWidth: '800px', margin: '0 auto', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {roomData.gameType === 'sos'         && <SOSGame roomData={roomData} user={user} />}
          {roomData.gameType === 'tic_tac_toe' && <TicTacToeGame roomData={roomData} user={user} />}
          {roomData.gameType === 'rps'         && <RockPaperScissorsGame roomData={roomData} user={user} />}
          {!['sos','tic_tac_toe','rps'].includes(roomData.gameType) && <div>Game type {roomData.gameType} is under construction!</div>}
        </div>

        <div className="glass-panel" style={{ width: '100%', maxWidth: '800px', margin: '0 auto', padding: '1rem', display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ marginBottom: '0.5rem', flexShrink: 0 }}>Room Chat 💬</h4>
          <div ref={chatScrollRef} onScroll={handleChatScroll} className="chat-container hide-scrollbar" style={{ minHeight: '120px' }}>
            <div className="chat-message system"><span>Welcome to the room, love!</span></div>
            {messages.map((msg) => {
              const isMe = msg.senderId === user?.uid;
              return (
                <div key={msg.id} className={`chat-message ${isMe ? 'mine' : 'theirs'} animate-in`}>
                  <div className="bubble">{msg.text}</div>
                </div>
              );
            })}
            <div ref={chatBottomRef} />
          </div>
          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.75rem', flexShrink: 0 }}>
            <input type="text" className="input-field" style={{ flex: 1, borderRadius: '24px', padding: '0.8rem 1.2rem', backgroundColor: '#fff' }}
              placeholder="Chat with ur partner💕..." value={inputText} onChange={(e) => setInputText(e.target.value)} />
            <button type="submit" className="gradient-btn flex-center" style={{ width: '44px', height: '44px', flexShrink: 0, borderRadius: '50%', padding: 0 }} disabled={!inputText.trim()}>
              <SendHorizonal size={18} />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
