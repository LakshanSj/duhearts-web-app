import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gamepad2, MessageCircle, Image as ImageIcon, LayoutDashboard, Trophy } from 'lucide-react';
import { createRoom, joinRoom, listenToRoom, terminateRoom } from '../services/roomService';
import { listenToMilestones, daysUntil, isTodayMilestone, isNearMilestone } from '../services/milestonesService';
import GlobalChat from '../components/GlobalChat';
import Gallery from '../components/Gallery';
import sosImg from '../assets/sos.png';
import tictactoeImg from '../assets/tictactoe.png';
import rpsImg from '../assets/rps.png';
import numberguessingImg from '../assets/numberguessing.png';

// ── Animated counter ──────────────────────────────────────────
function AnimatedNumber({ target }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(target / 40);
    clearInterval(ref.current);
    ref.current = setInterval(() => {
      start = Math.min(start + step, target);
      setDisplay(start);
      if (start >= target) clearInterval(ref.current);
    }, 24);
    return () => clearInterval(ref.current);
  }, [target]);
  return <span>{display.toLocaleString()}</span>;
}

// ── Days Together card ────────────────────────────────────────
function DaysTogetherCard({ userProfile, partnerProfile }) {
  const startTs = userProfile?.relationshipStartDate;
  if (!startTs) return null;

  const startDate = new Date(startTs);
  const now = new Date();
  const diffDays = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
  const months = Math.floor(diffDays / 30);
  const years  = Math.floor(diffDays / 365);

  const subtitle = years >= 1
    ? `${years} year${years > 1 ? 's' : ''} & ${months % 12} month${months % 12 !== 1 ? 's' : ''}`
    : months >= 1
    ? `${months} month${months > 1 ? 's' : ''} together`
    : 'Just getting started 🌱';

  return (
    <div
      className="glass-panel"
      style={{
        textAlign: 'center',
        padding: '1.5rem 1rem',
        background: 'linear-gradient(135deg, rgba(230,178,101,0.2), rgba(223,139,145,0.2))',
        marginBottom: '1rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* floating hearts bg */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', opacity: 0.18 }}>
        {['💕','💗','🩷','💖'].map((h, i) => (
          <span key={i} style={{
            position: 'absolute',
            fontSize: `${1.2 + i * 0.4}rem`,
            top: `${10 + i * 20}%`,
            left: `${5 + i * 25}%`,
            animation: `floatHeart ${4 + i}s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.8}s`,
          }}>{h}</span>
        ))}
      </div>

      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.35rem' }}>
        💑 Days Together
      </div>
      <div style={{ fontSize: 'clamp(2.8rem, 10vw, 4rem)', fontWeight: 900, color: 'var(--accent-secondary)', lineHeight: 1, marginBottom: '0.3rem' }}>
        <AnimatedNumber target={diffDays} />
      </div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
        {subtitle}
      </div>
      {partnerProfile && (
        <div style={{ marginTop: '0.6rem', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>
          you &amp; {partnerProfile.displayName || partnerProfile.username} 💕
        </div>
      )}
    </div>
  );
}

// ── Next Milestone card ───────────────────────────────────────
function NextMilestoneCard({ pairId, onGoToMilestones }) {
  const [milestones, setMilestones] = useState([]);

  useEffect(() => {
    if (!pairId) return;
    return listenToMilestones(pairId, setMilestones);
  }, [pairId]);

  if (!milestones.length) {
    return (
      <button
        onClick={onGoToMilestones}
        className="glass-panel"
        style={{
          width: '100%', textAlign: 'left', cursor: 'pointer',
          padding: '1rem 1.2rem', marginBottom: '1rem',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          fontFamily: 'inherit',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = 'var(--solid-shadow-hover)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
      >
        <span style={{ fontSize: '1.8rem' }}>💍</span>
        <div>
          <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main)' }}>Add Your First Milestone</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Anniversary, birthdays, first date…</div>
        </div>
      </button>
    );
  }

  // Find soonest
  const sorted = [...milestones].sort((a, b) => {
    const aDate = a.date.toDate ? a.date.toDate() : new Date(a.date);
    const bDate = b.date.toDate ? b.date.toDate() : new Date(b.date);
    return daysUntil(aDate) - daysUntil(bDate);
  });
  const next = sorted[0];
  const nextDate = next.date.toDate ? next.date.toDate() : new Date(next.date);
  const days = daysUntil(nextDate);
  const isToday = isTodayMilestone(nextDate);
  const isNear  = isNearMilestone(nextDate);

  return (
    <button
      onClick={onGoToMilestones}
      className="glass-panel"
      style={{
        width: '100%', textAlign: 'left', cursor: 'pointer',
        padding: '1rem 1.2rem', marginBottom: '1rem',
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        fontFamily: 'inherit',
        background: isToday
          ? 'linear-gradient(135deg, rgba(223,139,145,0.3), rgba(230,178,101,0.2))'
          : isNear
          ? 'linear-gradient(135deg, rgba(230,178,101,0.15), transparent)'
          : undefined,
        borderColor: isToday ? 'var(--accent-secondary)' : undefined,
        transition: 'transform 0.2s, box-shadow 0.2s',
        animation: isToday ? 'celebrationPulse 2s ease-in-out infinite' : undefined,
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = 'var(--solid-shadow-hover)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
    >
      <span style={{ fontSize: '2rem', animation: isToday ? 'wiggle 1s infinite' : undefined }}>{next.emoji}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main)' }}>
          {isToday ? '🎉 ' : isNear ? '⏳ ' : '📅 '}
          {next.label}
        </div>
        <div style={{ fontSize: '0.78rem', color: isToday ? 'var(--accent-secondary)' : 'var(--text-muted)', fontWeight: 700, marginTop: 2 }}>
          {isToday ? "It's today! Celebrate! 🎊" : days === 1 ? 'Tomorrow!' : `in ${days} days`}
        </div>
      </div>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, flexShrink: 0 }}>
        View all →
      </div>
    </button>
  );
}

// ── Today Celebration Banner (shown on milestone day) ─────────
function CelebrationBanner({ pairId }) {
  const [todayMilestones, setTodayMilestones] = useState([]);

  useEffect(() => {
    if (!pairId) return;
    return listenToMilestones(pairId, (all) => {
      setTodayMilestones(all.filter(m => {
        const d = m.date.toDate ? m.date.toDate() : new Date(m.date);
        return isTodayMilestone(d);
      }));
    });
  }, [pairId]);

  if (!todayMilestones.length) return null;

  return (
    <div
      className="glass-panel"
      style={{
        marginBottom: '1rem',
        padding: '1.2rem',
        background: 'linear-gradient(135deg, #ffe4ec, #fff9e4)',
        borderColor: 'var(--accent-secondary)',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        animation: 'celebrationPulse 2s ease-in-out infinite',
      }}
    >
      {/* Confetti dots */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: 8, height: 8, borderRadius: '50%',
            background: ['#ff8c8c','#ffd58c','#a8edea','#df8b91','#c2e59c'][i % 5],
            top: `${Math.random() * 80}%`,
            left: `${5 + i * 8}%`,
            animation: `confettiBounce ${1.5 + (i % 3) * 0.5}s ease-in-out ${(i * 0.15).toFixed(1)}s infinite alternate`,
          }} />
        ))}
      </div>

      {todayMilestones.map(m => (
        <div key={m.id} style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.3rem', animation: 'logoBeat 1.2s ease-in-out infinite' }}>{m.emoji}</div>
          <div style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--accent-secondary)', marginBottom: '0.2rem' }}>
            {m.label}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700 }}>
            Today is the day! 🎊 Celebrate together!
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Active Game shortcut card ─────────────────────────────────
function ActiveGameCard({ activeRoom, user, userProfile, onJoin }) {
  if (!activeRoom) return null;
  const activePlayers = activeRoom.activePlayers || [];
  const iAmIn = activePlayers.includes(user.uid);
  const partnerIn = activePlayers.includes(userProfile?.partnerId);
  if (!partnerIn || (iAmIn && partnerIn && activeRoom.status === 'playing')) return null;

  const gameLabels = { sos: 'SOS', tic_tac_toe: 'Tic Tac Toe', rps: 'Rock Paper Scissors', number_guessing: 'Hi-Lo' };
  const gameLabel = gameLabels[activeRoom.gameType] || activeRoom.gameType;

  return (
    <button
      onClick={onJoin}
      className="glass-panel"
      style={{
        width: '100%', textAlign: 'left', cursor: 'pointer',
        padding: '1rem 1.2rem', marginBottom: '1rem',
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        fontFamily: 'inherit',
        background: 'linear-gradient(135deg, rgba(162,203,193,0.25), rgba(230,178,101,0.15))',
        animation: 'wiggle 2.5s infinite',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = 'var(--solid-shadow-hover)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
    >
      <span style={{ fontSize: '1.8rem' }}>🎮</span>
      <div>
        <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main)' }}>
          Partner is waiting in {gameLabel}!
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Tap to join the game →</div>
      </div>
    </button>
  );
}

// ── Dashboard Tab ─────────────────────────────────────────────
function DashboardTab({ user, userProfile, partnerProfile, activeRoom, pairId, navigate }) {
  const handleJoinActive = async () => {
    if (!activeRoom) return;
    try {
      await joinRoom(pairId, user, userProfile);
      navigate(`/room/${pairId}?game=${activeRoom.gameType}`);
    } catch { navigate(`/room/${pairId}?game=${activeRoom.gameType}`); }
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', width: '100%' }}>
      <style>{`
        @keyframes floatHeart {
          from { transform: translateY(0) rotate(-5deg); }
          to   { transform: translateY(-12px) rotate(5deg); }
        }
        @keyframes logoBeat {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.12); }
        }
        @keyframes celebrationPulse {
          0%, 100% { box-shadow: var(--solid-shadow); }
          50% { box-shadow: 0 0 0 8px rgba(223,139,145,0.2), var(--solid-shadow); }
        }
        @keyframes confettiBounce {
          from { transform: translateY(0) rotate(0deg); opacity: 0.8; }
          to   { transform: translateY(-16px) rotate(180deg); opacity: 0.3; }
        }
      `}</style>

      {/* Today's celebration */}
      <CelebrationBanner pairId={pairId} />

      {/* Days Together */}
      <DaysTogetherCard userProfile={userProfile} partnerProfile={partnerProfile} />

      {/* Active game alert */}
      <ActiveGameCard
        activeRoom={activeRoom}
        user={user}
        userProfile={userProfile}
        onJoin={handleJoinActive}
      />

      {/* Next milestone */}
      <NextMilestoneCard pairId={pairId} onGoToMilestones={() => navigate('/milestones')} />

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
        {[
          { label: '🎮 Play a Game', sub: 'Challenge each other', action: 'games', color: 'rgba(162,203,193,0.3)' },
          { label: '💬 Send a Message', sub: 'Chat privately', action: 'chat', color: 'rgba(223,139,145,0.2)' },
          { label: '📸 Our Gallery', sub: 'Shared memories', action: 'gallery', color: 'rgba(230,178,101,0.25)' },
          { label: '💍 Milestones', sub: 'Special dates', action: 'milestones', color: 'rgba(162,130,255,0.2)' },
        ].map(({ label, sub, action, color }) => (
          <button
            key={action}
            onClick={() => action === 'milestones' ? navigate('/milestones') : undefined}
            style={{
              padding: '1rem 0.85rem',
              borderRadius: '20px',
              border: '3px solid var(--glass-border)',
              background: color,
              fontFamily: 'inherit',
              cursor: 'pointer',
              textAlign: 'left',
              boxShadow: 'var(--solid-shadow)',
              transition: 'transform 0.18s, box-shadow 0.18s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = 'var(--solid-shadow-hover)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
          >
            <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-main)', marginBottom: '0.2rem' }}>{label}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{sub}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Games Tab (unchanged from original) ──────────────────────
function GamesTab({ user, userProfile, activeRoom, loading, pairId, navigate, setError }) {
  const handleAction = async (gameType) => {
    if (!user || !pairId) { setError('Please login and pair with a partner first! 💕'); return; }
    try {
      if (activeRoom && activeRoom.gameType === gameType && activeRoom.hostId !== user.uid) {
        // Partner created this room — join it
        await joinRoom(pairId, user, userProfile);
        navigate(`/room/${pairId}?game=${gameType}`);
      } else {
        // Terminate any stale existing room before creating a fresh one
        if (activeRoom) await terminateRoom(pairId);
        await Promise.race([
          createRoom(gameType, user, pairId, userProfile),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout: Could not reach Firebase.')), 5000))
        ]);
        navigate(`/room/${pairId}?game=${gameType}`);
      }
    } catch (err) {
      setError('Error: ' + err.message);
      if (window.showAlert) window.showAlert('Error: ' + err.message);
    }
  };

  const renderGameStatus = (gameType) => {
    if (!activeRoom || activeRoom.gameType !== gameType) return null;
    const activePlayers = activeRoom.activePlayers || [];
    const iAmIn = activePlayers.includes(user.uid);
    const partnerIn = activePlayers.includes(userProfile?.partnerId);
    if (!iAmIn && !partnerIn) return null;
    if (iAmIn && !partnerIn && activeRoom.status === 'waiting') return <div style={{ marginTop: '0.5rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>⏳ Waiting for partner...</div>;
    if (!iAmIn && partnerIn && activeRoom.status === 'waiting') return <div style={{ marginTop: '0.5rem', color: 'var(--accent-primary)', fontWeight: 'bold' }}>💖 Partner is waiting!</div>;
    if (iAmIn && partnerIn && activeRoom.status === 'playing') return <div style={{ marginTop: '0.5rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>🎮 Game in progress</div>;
    if (!iAmIn && partnerIn && activeRoom.status === 'playing') return <div style={{ marginTop: '0.5rem', color: 'var(--accent-primary)', fontWeight: 'bold' }}>💖 Partner is in game — rejoin?</div>;
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

  const games = [
    { type: 'sos',             name: 'SOS',           desc: 'Connect S-O-S to score!',     img: sosImg,            bg: 'linear-gradient(135deg, #a8edea, #fed6e3)' },
    { type: 'tic_tac_toe',    name: 'Tic Tac Toe',   desc: 'Classic 3x3 strategy.',        img: tictactoeImg,      bg: 'linear-gradient(135deg, #ffecd2, #fcb69f)' },
    { type: 'rps',             name: 'R.P.S.',        desc: 'Rock, Paper, Scissors.',       img: rpsImg,            bg: 'linear-gradient(135deg, #c2e59c, #64b3f4)' },
    { type: 'number_guessing', name: 'Hi-Lo',         desc: 'Guess the secret number!',    img: numberguessingImg, bg: 'linear-gradient(135deg, #f8b4ff, #b4d4ff)' },
  ];

  return (
    <div className="glass-panel" style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '1rem' }}>
      <p style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>Choose a game to start</p>
      <div className="game-scroll-row hide-scrollbar">
        {games.map(g => (
          <div key={g.type} className="game-bubble-card game-card-item">
            <div className="bubble-content">
              <h4>{g.name}</h4>
              <p>{g.desc}</p>
              <button className="gradient-btn" disabled={loading} onClick={() => handleAction(g.type)}>
                {getButtonLabel(g.type)}
              </button>
              {renderGameStatus(g.type)}
            </div>
            <div className="bubble-image-container" style={{ background: g.bg }}>
              <img src={g.img} alt={g.name} />
            </div>
          </div>
        ))}
        <div style={{ flexShrink: 0, width: '1px' }} />
      </div>
    </div>
  );
}

// ── Bottom nav tabs ───────────────────────────────────────────
const TABS = [
  { id: 'dashboard', label: 'Home',    Icon: LayoutDashboard },
  { id: 'games',     label: 'Games',   Icon: Gamepad2 },
  { id: 'chat',      label: 'Chat',    Icon: MessageCircle },
  { id: 'gallery',   label: 'Gallery', Icon: ImageIcon },
];

// ── Main Home export ──────────────────────────────────────────
export default function Home({ user, userProfile, partnerProfile }) {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeRoom, setActiveRoom] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  const pairId = user && userProfile?.partnerId
    ? [user.uid, userProfile.partnerId].sort().join('_')
    : null;

  useEffect(() => {
    if (!pairId) return;
    return listenToRoom(pairId, setActiveRoom);
  }, [pairId]);

  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard': return `Hey, ${userProfile?.displayName || userProfile?.username || 'there'} 👋`;
      case 'chat':    return 'Chat with Ur partner💕';
      case 'gallery': return 'Our Memories Together 📸';
      case 'games':
      default:        return 'Play with Ur partner🥰';
    }
  };

  return (
    <div className="animate-in" style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>

      <div style={{ textAlign: 'center', marginBottom: '1rem', marginTop: '0.5rem', flexShrink: 0 }}>
        <h1 style={{ fontSize: 'clamp(1.1rem, 5vw, 1.6rem)' }}>{getTabTitle()}</h1>
        {error && <p style={{ color: 'var(--text-error)', fontWeight: 'bold', fontSize: '0.85rem' }}>{error}</p>}
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        display: 'flex', flexDirection: 'column',
        paddingBottom: '70px',
        overflowY: activeTab === 'chat' ? 'hidden' : 'auto',
        overflowX: 'hidden',
        minHeight: 0,
      }}>
        {activeTab === 'dashboard' && (
          <DashboardTab
            user={user}
            userProfile={userProfile}
            partnerProfile={partnerProfile}
            activeRoom={activeRoom}
            pairId={pairId}
            navigate={navigate}
          />
        )}
        {activeTab === 'games' && (
          <GamesTab
            user={user} userProfile={userProfile} activeRoom={activeRoom}
            loading={loading} pairId={pairId} navigate={navigate} setError={setError}
          />
        )}
        {activeTab === 'chat' && <GlobalChat user={user} userProfile={userProfile} pairId={pairId} />}
        {activeTab === 'gallery' && <Gallery user={user} userProfile={userProfile} pairId={pairId} />}
      </div>

      {/* Bottom nav */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)',
        borderTop: '2px solid var(--glass-border)',
        display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        zIndex: 100, boxShadow: '0 -4px 10px rgba(0,0,0,0.05)',
        paddingTop: '8px', paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
        height: 'auto', minHeight: '60px',
      }}>
        {TABS.map(({ id, label, Icon }) => {
          const active = activeTab === id;
          return (
            <div
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                width: `${100 / TABS.length}%`, cursor: 'pointer',
                color: active ? 'var(--accent-secondary)' : 'var(--text-muted)',
                transition: 'color 0.2s, transform 0.2s',
                transform: active ? 'translateY(-2px)' : 'none',
              }}
            >
              <Icon size={24} strokeWidth={active ? 2.5 : 1.8} />
              <span style={{ fontSize: '0.72rem', fontWeight: active ? 800 : 600, marginTop: '4px' }}>{label}</span>
              {active && (
                <div style={{
                  width: 20, height: 3, borderRadius: 2,
                  background: 'var(--accent-secondary)',
                  marginTop: 3,
                  animation: 'popIn 0.2s ease forwards',
                }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
