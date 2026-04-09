import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { changePassword } from '../firebase';
import { updateUserProfile } from '../services/userService';
import { openUploadWidget } from '../services/cloudinary';
import { auth } from '../firebase';
import { ArrowLeft, Eye, EyeOff, Save, Camera, User, Lock, Trash2, Palette } from 'lucide-react';
import { THEMES, applyTheme } from '../hooks/useTheme';

const SECTIONS = [
  { id: 'avatar',     label: 'Profile Picture', icon: Camera  },
  { id: 'name',       label: 'Change Name',     icon: User    },
  { id: 'password',   label: 'Change Password', icon: Lock    },
  { id: 'appearance', label: 'Appearance',      icon: Palette },
];

// ── Sub-Panels (Moved outside to prevent re-creation on every render) ────────────────

const AvatarPanel = ({ avatarPreview, uploadingAvatar, handleAvatarUpload, handleAvatarDelete }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.2rem', paddingTop: '0.5rem' }}>
    <h3 style={{ margin: 0 }}>Profile Picture</h3>
    <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', textAlign: 'center', margin: 0 }}>
      Your photo appears on both yours and your partner's screen.
    </p>
    <div style={{ position: 'relative', width: '120px' }}>
      <div style={{
        width: '120px', height: '120px', borderRadius: '50%',
        border: '4px solid var(--glass-border)', background: 'var(--bg-secondary)',
        overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: 'var(--solid-shadow)',
      }}>
        {avatarPreview
          ? <img src={avatarPreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <User size={55} color="var(--text-muted)" />
        }
      </div>
      <div style={{
        position: 'absolute', bottom: 2, right: 2,
        width: '34px', height: '34px', borderRadius: '50%',
        background: 'linear-gradient(135deg, var(--accent-secondary), var(--accent-primary))',
        border: '3px solid var(--glass-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '2px 2px 0px rgba(77,58,43,0.3)',
        pointerEvents: 'none',
      }}>
        <Camera size={16} color="#fff" />
      </div>
    </div>
    <button className="gradient-btn" onClick={handleAvatarUpload} disabled={uploadingAvatar}
      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <Camera size={17} /> {uploadingAvatar ? 'Opening...' : 'Choose Photo'}
    </button>
    {avatarPreview && (
      <button onClick={handleAvatarDelete} style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        padding: '0.45rem 1.1rem', borderRadius: '20px',
        background: 'transparent', border: '2.5px solid var(--text-error)',
        color: 'var(--text-error)', fontFamily: 'inherit', fontWeight: 700,
        fontSize: '0.88rem', cursor: 'pointer', transition: 'all 0.18s',
      }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--text-error)'; e.currentTarget.style.color = '#fff'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-error)'; }}
      >
        <Trash2 size={15} /> Remove Photo
      </button>
    )}
  </div>
);

const NamePanel = ({ displayName, setDisplayName, handleSaveName, savingName, username }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '0.5rem' }}>
    <h3 style={{ margin: 0 }}>Display Name</h3>
    <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>
      This is the name your partner sees. Separate from your login username.
    </p>
    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
      <input type="text" className="input-field" value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        placeholder={username || 'Your name'} maxLength={30}
        style={{ flex: '1 1 140px' }} />
      <button className="gradient-btn" onClick={handleSaveName} disabled={savingName}
        style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        {savingName ? 'Saving...' : <><Save size={15} /> Save</>}
      </button>
    </div>
    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
      Login username: <strong>{username}</strong>
    </p>
  </div>
);

const PasswordPanel = ({ 
  handleUpdatePassword, loadingPw, currentPassword, setCurrentPassword, 
  newPassword, setNewPassword, confirmPassword, setConfirmPassword,
  showCurrent, setShowCurrent, showNew, setShowNew, showConfirmPw, setShowConfirmPw 
}) => {
  const Field = ({ label, value, setValue, show, setShow }) => (
    <div>
      <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--text-main)' }}>{label}</label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input type={show ? 'text' : 'password'} className="input-field" value={value}
          onChange={(e) => setValue(e.target.value)} placeholder="••••••••"
          style={{ width: '100%', boxSizing: 'border-box', paddingRight: '2.5rem' }} />
        <button type="button" onClick={() => setShow(!show)}
          style={{ position: 'absolute', right: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
          {show ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
    </div>
  );
  return (
    <div style={{ paddingTop: '0.5rem' }}>
      <h3 style={{ margin: '0 0 0.5rem' }}>Change Password</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1rem' }}>
        At least 6 characters.
      </p>
      <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Field label="Current Password" value={currentPassword} setValue={setCurrentPassword} show={showCurrent} setShow={setShowCurrent} />
        <Field label="New Password"     value={newPassword}     setValue={setNewPassword}     show={showNew}     setShow={setShowNew}     />
        <Field label="Confirm Password" value={confirmPassword} setValue={setConfirmPassword} show={showConfirmPw}  setShow={setShowConfirmPw}  />
        <button type="submit" className="gradient-btn" disabled={loadingPw}
          style={{ marginTop: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          {loadingPw ? 'Updating...' : <><Save size={17} /> Update Password</>}
        </button>
      </form>
    </div>
  );
};

const AppearancePanel = ({ activeTheme, handleThemeSelect }) => (
  <div style={{ paddingTop: '0.5rem' }}>
    <h3 style={{ margin: '0 0 0.4rem' }}>Appearance</h3>
    <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.2rem' }}>
      Pick a theme. It's saved to your profile and applies every time you log in.
    </p>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {THEMES.map((theme) => {
        const isActive = activeTheme === theme.id;
        const { bg, card, accent, pink, border } = theme.preview;
        return (
          <button
            key={theme.id}
            onClick={() => handleThemeSelect(theme.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '1rem',
              padding: '0.85rem 1rem', borderRadius: '16px', cursor: 'pointer',
              border: isActive ? `3px solid var(--accent-secondary)` : '3px solid var(--glass-border)',
              background: isActive ? 'var(--bg-secondary)' : 'var(--input-bg)',
              fontFamily: 'inherit', textAlign: 'left',
              boxShadow: isActive ? 'var(--solid-shadow)' : 'none',
              transition: 'all 0.18s',
            }}
          >
            <div style={{
              width: '54px', height: '40px', borderRadius: '10px',
              background: bg, border: `2px solid ${border}`,
              flexShrink: 0, overflow: 'hidden', position: 'relative',
            }}>
              <div style={{ position: 'absolute', bottom: 4, left: 4, right: 4, height: 14, background: card, borderRadius: 4, border: `1.5px solid ${border}` }} />
              <div style={{ position: 'absolute', top: 4, left: 4, width: 8, height: 8, borderRadius: '50%', background: accent }} />
              <div style={{ position: 'absolute', top: 4, left: 14, width: 8, height: 8, borderRadius: '50%', background: pink }} />
            </div>

            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '0.15rem' }}>{theme.name}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>{theme.description}</div>
            </div>

            {isActive && (
              <div style={{
                marginLeft: 'auto', flexShrink: 0,
                width: '22px', height: '22px', borderRadius: '50%',
                background: 'var(--accent-secondary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: '0.7rem', fontWeight: 900,
              }}>✓</div>
            )}
          </button>
        );
      })}
    </div>
  </div>
);

export default function Settings({ userProfile }) {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('avatar');

  // Avatar
  const [avatarPreview, setAvatarPreview] = useState(userProfile?.photoURL || null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Display Name
  const [displayName, setDisplayName] = useState(userProfile?.displayName || userProfile?.username || '');
  const [savingName, setSavingName] = useState(false);

  // Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loadingPw, setLoadingPw] = useState(false);

  // Theme
  const [activeTheme, setActiveTheme] = useState(userProfile?.theme || 'paper');

  useEffect(() => {
    if (userProfile?.theme) setActiveTheme(userProfile.theme);
  }, [userProfile?.theme]);

  const uid = auth.currentUser?.uid;

  const handleAvatarUpload = () => {
    setUploadingAvatar(true);
    openUploadWidget(
      { folder: `duohearts/avatars/${uid}`, tags: ['avatar'] },
      async (url) => {
        setAvatarPreview(url);
        try {
          await updateUserProfile(uid, { photoURL: url });
          if (window.showAlert) window.showAlert('Profile picture updated! 📸');
        } catch (err) {
          console.error(err);
          if (window.showAlert) window.showAlert('Failed: ' + err.message);
        }
        setUploadingAvatar(false);
      }
    );
    setTimeout(() => setUploadingAvatar(false), 60000);
  };

  const handleAvatarDelete = () => {
    if (!avatarPreview) return;
    if (window.showConfirm) {
      window.showConfirm('Remove your profile picture?', async () => {
        try {
          await updateUserProfile(uid, { photoURL: '' });
          setAvatarPreview(null);
          if (window.showAlert) window.showAlert('Profile picture removed.');
        } catch (err) {
          if (window.showAlert) window.showAlert('Failed: ' + err.message);
        }
      });
    }
  };

  const handleSaveName = async () => {
    if (!displayName.trim()) { if (window.showAlert) window.showAlert('Name cannot be empty.'); return; }
    setSavingName(true);
    try {
      await updateUserProfile(uid, { displayName: displayName.trim() });
      if (window.showAlert) window.showAlert('Display name updated! ✨');
    } catch (err) {
      if (window.showAlert) window.showAlert('Failed: ' + err.message);
    }
    setSavingName(false);
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) { if (window.showAlert) window.showAlert('Please fill in all fields.'); return; }
    if (newPassword !== confirmPassword) { if (window.showAlert) window.showAlert('New passwords do not match.'); return; }
    if (newPassword.length < 6) { if (window.showAlert) window.showAlert('Password must be at least 6 characters.'); return; }
    setLoadingPw(true);
    try {
      await changePassword(currentPassword, newPassword);
      if (window.showAlert) window.showAlert('Password updated! ✅');
      navigate('/');
    } catch (err) {
      if (window.showAlert) window.showAlert(err.code === 'auth/invalid-credential' ? 'Current password is incorrect.' : 'Error: ' + err.message);
    }
    setLoadingPw(false);
  };

  const handleThemeSelect = async (themeId) => {
    setActiveTheme(themeId);   // optimistic
    applyTheme(themeId);
    try {
      await updateUserProfile(uid, { theme: themeId });
    } catch (err) {
      console.error('Theme save failed:', err);
      setActiveTheme(userProfile?.theme || 'paper');
      applyTheme(userProfile?.theme || 'paper');
    }
  };

  const renderPanel = () => {
    switch (activeSection) {
      case 'avatar':     return <AvatarPanel avatarPreview={avatarPreview} uploadingAvatar={uploadingAvatar} handleAvatarUpload={handleAvatarUpload} handleAvatarDelete={handleAvatarDelete} />;
      case 'name':       return <NamePanel displayName={displayName} setDisplayName={setDisplayName} handleSaveName={handleSaveName} savingName={savingName} username={userProfile?.username} />;
      case 'password':   return <PasswordPanel handleUpdatePassword={handleUpdatePassword} loadingPw={loadingPw} currentPassword={currentPassword} setCurrentPassword={setCurrentPassword} newPassword={newPassword} setNewPassword={setNewPassword} confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword} showCurrent={showCurrent} setShowCurrent={setShowCurrent} showNew={showNew} setShowNew={setShowNew} showConfirmPw={showConfirmPw} setShowConfirmPw={setShowConfirmPw} />;
      case 'appearance': return <AppearancePanel activeTheme={activeTheme} handleThemeSelect={handleThemeSelect} />;
      default:           return <AvatarPanel />;
    }
  };

  return (
    <div className="animate-in" style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, gap: '0.75rem' }}>
      <div style={{ flexShrink: 0 }}>
        <button className="btn btn-secondary" onClick={() => navigate('/')}
          style={{ padding: '0.4rem 0.9rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      <div className="settings-layout">
        <div className="settings-sidebar">
          {SECTIONS.map(({ id, label, icon: Icon }) => {
            const active = activeSection === id;
            return (
              <button key={id} onClick={() => setActiveSection(id)} style={{
                display: 'flex', alignItems: 'center', gap: '0.65rem',
                padding: '0.8rem 0.9rem', borderRadius: '14px', flexShrink: 0,
                border: active ? '3px solid var(--glass-border)' : '3px solid transparent',
                background: active ? 'var(--bg-secondary)' : 'transparent',
                fontFamily: 'inherit', fontWeight: active ? 800 : 600, fontSize: '0.9rem',
                color: active ? 'var(--text-main)' : 'var(--text-muted)',
                cursor: 'pointer', textAlign: 'left', transition: 'all 0.18s',
                boxShadow: active ? 'var(--solid-shadow)' : 'none',
                position: 'relative', whiteSpace: 'nowrap',
              }}>
                {active && (
                  <div style={{
                    position: 'absolute', left: 0, top: '20%', bottom: '20%',
                    width: '4px', borderRadius: '0 4px 4px 0',
                    background: 'linear-gradient(180deg, var(--accent-secondary), var(--accent-primary))',
                  }} />
                )}
                <Icon size={17} color={active ? 'var(--accent-secondary)' : 'var(--text-muted)'} />
                {label}
              </button>
            );
          })}
        </div>
        <div className="glass-panel settings-panel">
          {renderPanel()}
        </div>
      </div>
    </div>
  );
}
