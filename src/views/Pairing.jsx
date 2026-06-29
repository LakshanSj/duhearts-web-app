import { useState } from 'react';
import { pairWithPartner } from '../services/userService';
import { Copy, Check, Heart } from 'lucide-react';

export default function Pairing({ userProfile }) {
  const [partnerCode, setPartnerCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Relationship start date step
  const [step, setStep] = useState('pair');   // 'pair' | 'date'
  const [pendingCode, setPendingCode] = useState('');
  const [startDate, setStartDate] = useState('');
  const [dateSaving, setDateSaving] = useState(false);

  const inviteLink = 'https://duohearts.web.app/';

  const copyToClipboard = (text, setCopiedState) => {
    navigator.clipboard.writeText(text);
    setCopiedState(true);
    setTimeout(() => setCopiedState(false), 2000);
  };

  const handlePair = async (e) => {
    e.preventDefault();
    if (partnerCode.trim().length !== 6) {
      if (window.showAlert) window.showAlert('Code must be exactly 6 characters.');
      return;
    }
    setLoading(true);
    try {
      // Try pairing without date first; after pairing we'll ask for date
      await pairWithPartner(userProfile.uid, partnerCode.trim().toUpperCase());
      // Instead of navigating away immediately, show the date prompt
      setPendingCode(partnerCode.trim().toUpperCase());
      setStep('date');
    } catch (err) {
      if (window.showAlert) window.showAlert(err.message);
    }
    setLoading(false);
  };

  const handleSaveDate = async () => {
    if (!startDate) {
      // Skip — App.jsx listener will detect partnerId and redirect
      return;
    }
    setDateSaving(true);
    try {
      const { updateUserProfile } = await import('../services/userService');
      const d = new Date(startDate);
      await updateUserProfile(userProfile.uid, { relationshipStartDate: d.getTime() });
    } catch (err) {
      console.error('Failed to save start date:', err);
    }
    setDateSaving(false);
    // App.jsx will re-render via onSnapshot once partnerId is set
  };

  // ── Date step ─────────────────────────────────────────────
  if (step === 'date') {
    return (
      <div className="flex-center animate-in" style={{ width: '100%', flex: 1, flexDirection: 'column', gap: '2rem' }}>
        <div className="glass-panel" style={{ maxWidth: '400px', width: '100%', padding: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem', animation: 'logoBeat 1.5s ease-in-out infinite' }}>💕</div>
          <h2 style={{ marginBottom: '0.5rem' }}>You're Connected!</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
            When did your relationship begin? This powers the "Days Together" counter on your dashboard.
          </p>

          <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              Relationship Start Date
            </label>
            <input
              type="date"
              className="input-field"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
              This can be your first date, the day you met, or whenever feels right 🌹
            </p>
          </div>

          <button
            className="gradient-btn"
            onClick={handleSaveDate}
            disabled={dateSaving || !startDate}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}
          >
            <Heart size={16} />
            {dateSaving ? 'Saving…' : 'Save Our Start Date'}
          </button>

          <button
            onClick={handleSaveDate} // calling without date just navigates (partnerId is already set)
            style={{
              background: 'none', border: 'none', color: 'var(--text-muted)',
              fontFamily: 'inherit', fontWeight: 600, fontSize: '0.82rem',
              cursor: 'pointer', textDecoration: 'underline',
            }}
          >
            Skip for now
          </button>

          <style>{`
            @keyframes logoBeat {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.1); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  // ── Pair step ─────────────────────────────────────────────
  return (
    <div className="flex-center animate-in" style={{ width: '100%', flex: 1, flexDirection: 'column', gap: '2rem' }}>
      <div className="glass-panel" style={{ maxWidth: '400px', width: '100%', padding: '2rem', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: '1rem' }}>Find Your Partner 💘</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
          Share your code with your partner, or enter their code below to connect your accounts forever.
        </p>

        <div style={{ background: 'var(--bg-main)', padding: '1.5rem', borderRadius: '16px', marginBottom: '2rem' }}>
          <p style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--text-muted)' }}>YOUR INVITE CODE</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', marginTop: '0.5rem' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: '900', letterSpacing: '4px', color: 'var(--accent-primary)', textShadow: '0px 2px 4px rgba(255, 107, 107, 0.3)' }}>
              {userProfile?.inviteCode || '------'}
            </div>
            <button
              className="btn btn-secondary"
              style={{ width: '40px', height: '40px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}
              onClick={() => copyToClipboard(userProfile?.inviteCode || '', setCopiedCode)}
              title="Copy Code"
            >
              {copiedCode ? <Check size={18} color="green" /> : <Copy size={18} />}
            </button>
          </div>

          <div style={{ marginTop: '1.5rem', padding: '0.8rem', background: 'rgba(255,255,255,0.5)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{inviteLink}</span>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0 }}
              onClick={() => copyToClipboard(inviteLink, setCopiedLink)}
            >
              {copiedLink ? <Check size={14} color="green" /> : <Copy size={14} />} Copy Link
            </button>
          </div>
        </div>

        <form onSubmit={handlePair} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Partner's Code</label>
            <input
              type="text"
              className="input-field"
              value={partnerCode}
              onChange={e => setPartnerCode(e.target.value.toUpperCase())}
              placeholder="e.g. A4X9T2"
              maxLength={6}
              style={{ width: '100%', boxSizing: 'border-box', textAlign: 'center', fontSize: '1.5rem', letterSpacing: '2px', textTransform: 'uppercase' }}
            />
          </div>
          <button type="submit" className="gradient-btn" disabled={loading || partnerCode.trim().length !== 6}>
            {loading ? 'Connecting…' : 'Connect Accounts'}
          </button>
        </form>
      </div>
    </div>
  );
}
