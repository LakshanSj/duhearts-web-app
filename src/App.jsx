import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, logout } from './firebase';
import { listenToUserProfile, getUserProfile } from './services/userService';
import { Settings as SettingsIcon, User, LogOut } from 'lucide-react';
import { useTheme, applyTheme } from './hooks/useTheme';
import Home from './views/Home';
import Room from './views/Room';
import Game from './views/Game';
import Login from './views/Login';
import Pairing from './views/Pairing';
import Settings from './views/Settings';
import './index.css';

function Avatar({ photoURL, name, size = 36 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: '2.5px solid var(--glass-border)',
      background: 'var(--bg-secondary)',
      overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
      boxShadow: '2px 2px 0px rgba(77,58,43,0.2)',
    }}>
      {photoURL
        ? <img src={photoURL} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <User size={size * 0.55} color="var(--text-muted)" />
      }
    </div>
  );
}

function TopNav({ currentUser, userProfile, partnerProfile, handleAuth, loading }) {
  const location = useLocation();
  const navigate = useNavigate();
  const showNavItems = location.pathname === '/' && currentUser;
  const onHome = location.pathname === '/';

  const confirmLogout = () => {
    if (window.showConfirm) {
      window.showConfirm("Are you sure you want to log out?", handleAuth);
    } else {
      handleAuth();
    }
  };

  const myName = userProfile?.displayName || userProfile?.username || '';
  const partnerName = partnerProfile?.displayName || partnerProfile?.username || '';

  return (
    <header className="header-nav" style={{ position: 'relative' }}>
      {/* Left: logo */}
      <h2 style={{ flexShrink: 0 }}>DuoHearts ❤️</h2>

      {/* Center: couple display */}
      {!loading && currentUser && userProfile?.partnerId && partnerProfile && (
        <div style={{
          position: 'absolute', left: '50%', transform: 'translateX(-50%)',
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          background: 'var(--glass-bg)',
          border: '2.5px solid var(--glass-border)',
          borderRadius: '999px',
          padding: '0.2rem 0.6rem 0.2rem 0.2rem',
          boxShadow: '3px 3px 0px rgba(77,58,43,0.15)',
          maxWidth: 'calc(100vw - 280px)',
          overflow: 'hidden',
        }}>
          <Avatar photoURL={userProfile.photoURL} name={myName} size={32} />
          <span className="couple-name" style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--accent-primary)', maxWidth: 55, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{myName}</span>
          <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>❤️</span>
          <span className="couple-name" style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--accent-secondary)', maxWidth: 55, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{partnerName}</span>
          <Avatar photoURL={partnerProfile.photoURL} name={partnerName} size={32} />
        </div>
      )}

      {/* Right: actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
        {!loading && onHome && currentUser && (
          <>
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/settings')}
              style={{ width: '38px', height: '38px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}
              title="Settings"
            >
              <SettingsIcon size={18} />
            </button>
            <button
              className="btn btn-secondary"
              onClick={confirmLogout}
              style={{ width: '38px', height: '38px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </>
        )}
      </div>
    </header>
  );
}

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [partnerProfile, setPartnerProfile] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [popupMessage, setPopupMessage] = useState('');
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupType, setPopupType] = useState('alert');
  const [onConfirmCb, setOnConfirmCb] = useState(null);

  useEffect(() => {
    window.showAlert = (msg) => { setPopupMessage(msg); setPopupType('alert'); setIsPopupOpen(true); };
    window.showConfirm = (msg, onConfirm) => { setPopupMessage(msg); setPopupType('confirm'); setOnConfirmCb(() => onConfirm); setIsPopupOpen(true); };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoadingAuth(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (currentUser) {
      setLoadingProfile(true);
      const unsubscribeProfile = listenToUserProfile(currentUser.uid, (profile) => {
        setUserProfile(profile);
        setLoadingProfile(false);
      });
      return unsubscribeProfile;
    } else {
      setUserProfile(null);
      setPartnerProfile(null);
      setLoadingProfile(false);
    }
  }, [currentUser]);

  // Fetch partner profile whenever partnerId changes
  useEffect(() => {
    if (!userProfile?.partnerId) { setPartnerProfile(null); return; }
    getUserProfile(userProfile.partnerId).then(setPartnerProfile);
  }, [userProfile?.partnerId]);

  // Re-fetch partner profile when partner updates their display name / photo
  // by listening via a simple interval (lightweight, avoids adding another onSnapshot)
  useEffect(() => {
    if (!userProfile?.partnerId) return;
    const interval = setInterval(() => {
      getUserProfile(userProfile.partnerId).then(setPartnerProfile);
    }, 15000);
    return () => clearInterval(interval);
  }, [userProfile?.partnerId]);

  // Apply theme whenever profile loads/changes
  useEffect(() => {
    applyTheme(userProfile?.theme || 'paper');
  }, [userProfile?.theme]);

  const handleAuth = async () => { if (currentUser) await logout(); };

  const loading = loadingAuth || (currentUser && loadingProfile);

  const renderContent = () => {
    if (loading) return <div className="flex-center" style={{ flex: 1 }}>Loading...</div>;
    if (!currentUser) return <Login />;
    if (!userProfile?.partnerId) return <Pairing userProfile={userProfile} />;

    return (
      <Routes>
        <Route path="/" element={<Home user={currentUser} userProfile={userProfile} partnerProfile={partnerProfile} />} />
        <Route path="/room/:roomId" element={<Room user={currentUser} userProfile={userProfile} />} />
        <Route path="/game/:roomId" element={<Game user={currentUser} userProfile={userProfile} />} />
        <Route path="/settings" element={<Settings userProfile={userProfile} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  };

  return (
    <Router>
      <div className="app-container">
        <TopNav
          currentUser={currentUser}
          userProfile={userProfile}
          partnerProfile={partnerProfile}
          handleAuth={handleAuth}
          loading={loading}
        />

        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {renderContent()}
        </main>

        {isPopupOpen && (
          <div className="custom-popup-overlay" onClick={() => setIsPopupOpen(false)}>
            <div className="custom-popup-box" onClick={(e) => e.stopPropagation()}>
              <button className="close-btn" onClick={() => setIsPopupOpen(false)}>X</button>
              <h3>{popupType === 'confirm' ? 'Are you sure?' : 'Attention!'}</h3>
              <p>{popupMessage}</p>
              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                {popupType === 'alert' ? (
                  <button className="gradient-btn" onClick={() => setIsPopupOpen(false)}>Got it</button>
                ) : (
                  <>
                    <button className="btn btn-secondary" onClick={() => setIsPopupOpen(false)} style={{ borderRadius: '20px' }}>Cancel</button>
                    <button className="gradient-btn" onClick={() => { setIsPopupOpen(false); if (onConfirmCb) onConfirmCb(); }}>Yes, Exit</button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Router>
  );
}

export default App;
