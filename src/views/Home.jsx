import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gamepad2, MessageCircle, Image as ImageIcon } from 'lucide-react';
import { createRoom, joinRoom, listenToRoom, leaveGame } from '../services/roomService';
import GlobalChat from '../components/GlobalChat';
import Gallery from '../components/Gallery';
import sosImg from '../assets/sos.png';
import tictactoeImg from '../assets/tictactoe.png';
import rpsImg from '../assets/rps.png';

export default function Home({ user, userProfile }) {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeRoom, setActiveRoom] = useState(null);
  const [activeTab, setActiveTab] = useState('games');

  const pairId = user && userProfile?.partnerId ? [user.uid, userProfile.partnerId].sort().join('_') : null;

  // When landing on Home, remove self from activePlayers so the
  // 'Waiting for partner...' badge doesn't show stale state.
  useEffect(() => {
    if (pairId && user) {
      leaveGame(pairId, user).catch(() => {});
    }
  }, [pairId, user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!pairId) return;
    const unsub = listenToRoom(pairId, (data) => {
      setActiveRoom(data);
    });
    return unsub;
  }, [pairId]);

  const handleAction = async (gameType) => {
    if (!user || !pairId) {
      setError('Please login and pair with a partner first! 💕');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (activeRoom && activeRoom.gameType === gameType && activeRoom.hostId !== user.uid) {
        await joinRoom(pairId, user, userProfile);
        navigate(`/room/${pairId}?game=${gameType}`);
      } else {
        await Promise.race([
          createRoom(gameType, user, pairId, userProfile),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout: Could not reach Firebase.")), 5000))
        ]);
        setError('');
        navigate(`/room/${pairId}?game=${gameType}`);
      }
    } catch (err) {
      console.error(err);
      setError("Error: " + err.message);
      if (window.showAlert) window.showAlert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderGameStatus = (gameType) => {
    if (!activeRoom || activeRoom.gameType !== gameType) return null;

    const activePlayers = activeRoom.activePlayers || [];
    const iAmIn = activePlayers.includes(user.uid);
    const partnerIn = activePlayers.includes(userProfile?.partnerId);

    // Both left — show nothing
    if (!iAmIn && !partnerIn) return null;
    // I'm waiting, partner not here yet
    if (iAmIn && !partnerIn && activeRoom.status === 'waiting') {
      return <div style={{ marginTop: '0.5rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>⏳ Waiting for partner...</div>;
    }
    // Partner is waiting, I'm not in
    if (!iAmIn && partnerIn && activeRoom.status === 'waiting') {
      return <div style={{ marginTop: '0.5rem', color: 'var(--accent-primary)', fontWeight: 'bold' }}>💖 Partner is waiting!</div>;
    }
    // Both in, game playing
    if (iAmIn && partnerIn && activeRoom.status === 'playing') {
      return <div style={{ marginTop: '0.5rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>🎮 Game in progress</div>;
    }
    // Partner in game, I left — can rejoin
    if (!iAmIn && partnerIn && activeRoom.status === 'playing') {
      return <div style={{ marginTop: '0.5rem', color: 'var(--accent-primary)', fontWeight: 'bold' }}>💖 Partner is in game — rejoin?</div>;
    }

    return null;
  };

  const getButtonLabel = (gameType) => {
    if (!activeRoom || activeRoom.gameType !== gameType) return 'Start';
    const activePlayers = activeRoom.activePlayers || [];
    const iAmIn = activePlayers.includes(user.uid);
    const partnerIn = activePlayers.includes(userProfile?.partnerId);
    if (!iAmIn && partnerIn) return partnerIn && activeRoom.status === 'playing' ? 'Rejoin Game' : 'Join Partner';
    return 'Start';
  };

  const renderGamesTab = () => (
    <>
      <div className="glass-panel" style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '1rem' }}>
        <p style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>Choose a game to start</p>

        <div className="game-scroll-row hide-scrollbar">
          <div className="game-bubble-card game-card-item">
            <div className="bubble-content">
              <h4>SOS</h4>
              <p>Connect S-O-S to score!</p>
              <button className="gradient-btn" disabled={loading} onClick={() => handleAction('sos')}>
                {getButtonLabel('sos')}
              </button>
              {renderGameStatus('sos')}
            </div>
            <div className="bubble-image-container" style={{ background: 'linear-gradient(135deg, #a8edea, #fed6e3)' }}>
              <img src={sosImg} alt="SOS Game" />
            </div>
          </div>

          <div className="game-bubble-card game-card-item">
            <div className="bubble-content">
              <h4>Tic Tac Toe</h4>
              <p>Classic 3x3 strategy.</p>
              <button className="gradient-btn" disabled={loading} onClick={() => handleAction('tic_tac_toe')}>
                {getButtonLabel('tic_tac_toe')}
              </button>
              {renderGameStatus('tic_tac_toe')}
            </div>
            <div className="bubble-image-container" style={{ background: 'linear-gradient(135deg, #ffecd2, #fcb69f)' }}>
              <img src={tictactoeImg} alt="Tic Tac Toe Game" />
            </div>
          </div>

          <div className="game-bubble-card game-card-item">
            <div className="bubble-content">
              <h4>R.P.S.</h4>
              <p>Rock, Paper, Scissors.</p>
              <button className="gradient-btn" disabled={loading} onClick={() => handleAction('rps')}>
                {getButtonLabel('rps')}
              </button>
              {renderGameStatus('rps')}
            </div>
            <div className="bubble-image-container" style={{ background: 'linear-gradient(135deg, #c2e59c, #64b3f4)' }}>
              <img src={rpsImg} alt="Rock Paper Scissors Game" />
            </div>
          </div>

          <div style={{ flexShrink: 0, width: '1px' }} />
        </div>
      </div>
    </>
  );

  const getTabTitle = () => {
    switch (activeTab) {
      case 'chat': return 'Chat with Ur partner💕';
      case 'gallery': return 'Our Memories Together 📸';
      case 'games':
      default: return 'Play with Ur partner🥰';
    }
  };

  return (
    <div className="animate-in" style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>

      <div style={{ textAlign: 'center', marginBottom: '1.5rem', marginTop: '0.5rem', flexShrink: 0 }}>
        <h1>{getTabTitle()}</h1>
        {error && <p style={{ color: 'var(--text-error)', fontWeight: 'bold' }}>{error}</p>}
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingBottom: 'calc(70px + env(safe-area-inset-bottom, 0px))', overflowY: activeTab === 'chat' ? 'hidden' : 'auto', overflowX: 'hidden', minHeight: 0 }}>
        {activeTab === 'games' && renderGamesTab()}
        {activeTab === 'chat' && <GlobalChat user={user} userProfile={userProfile} pairId={pairId} />}
        {activeTab === 'gallery' && <Gallery user={user} userProfile={userProfile} pairId={pairId} />}
      </div>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <div
          id="tab-games"
          className="bottom-nav-item"
          onClick={() => setActiveTab('games')}
          style={{ color: activeTab === 'games' ? 'var(--accent-primary)' : 'var(--text-muted)' }}
        >
          <Gamepad2 size={24} />
          <span>Games</span>
        </div>

        <div
          id="tab-chat"
          className="bottom-nav-item"
          onClick={() => setActiveTab('chat')}
          style={{ color: activeTab === 'chat' ? 'var(--accent-primary)' : 'var(--text-muted)' }}
        >
          <MessageCircle size={24} />
          <span>Chat</span>
        </div>

        <div
          id="tab-gallery"
          className="bottom-nav-item"
          onClick={() => setActiveTab('gallery')}
          style={{ color: activeTab === 'gallery' ? 'var(--accent-primary)' : 'var(--text-muted)' }}
        >
          <ImageIcon size={24} />
          <span>Gallery</span>
        </div>
      </nav>

    </div>
  );
}
