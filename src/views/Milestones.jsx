import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import {
  listenToMilestones, addMilestone, updateMilestone, deleteMilestone,
  MILESTONE_TYPES, daysUntil, isTodayMilestone, isNearMilestone,
} from '../services/milestonesService';

// ── Month names for the date display ─────────────────────────
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatDate(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

// ── Empty date input → JS Date ────────────────────────────────
function inputToDate(str) {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function dateToInput(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${da}`;
}

// ── Milestone card ────────────────────────────────────────────
function MilestoneCard({ m, pairId, uid, onEdit }) {
  const isToday = isTodayMilestone(m.date.toDate ? m.date.toDate() : new Date(m.date));
  const isNear  = isNearMilestone(m.date.toDate ? m.date.toDate() : new Date(m.date));
  const days    = daysUntil(m.date.toDate ? m.date.toDate() : new Date(m.date));

  const handleDelete = () => {
    if (window.showConfirm) {
      window.showConfirm(`Remove "${m.label}"?`, () => deleteMilestone(pairId, m.id));
    }
  };

  return (
    <div
      className="glass-panel"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '1rem 1.2rem',
        marginBottom: '0.75rem',
        borderColor: isToday ? 'var(--accent-secondary)' : undefined,
        background: isToday
          ? 'linear-gradient(135deg, rgba(230,178,101,0.25), rgba(223,139,145,0.25))'
          : undefined,
        position: 'relative',
        overflow: 'visible',
        animation: isToday ? 'celebrationPulse 2s ease-in-out infinite' : undefined,
      }}
    >
      {/* Near badge */}
      {isNear && !isToday && (
        <div style={{
          position: 'absolute', top: -8, right: 12,
          background: 'var(--accent-secondary)', color: '#fff',
          fontSize: '0.62rem', fontWeight: 800, padding: '2px 8px',
          borderRadius: '20px', border: '2px solid var(--glass-border)',
          boxShadow: '1px 1px 0 rgba(77,58,43,0.2)',
        }}>
          {days === 0 ? 'TODAY!' : `${days}d away`}
        </div>
      )}
      {isToday && (
        <div style={{
          position: 'absolute', top: -8, right: 12,
          background: 'var(--accent-secondary)', color: '#fff',
          fontSize: '0.65rem', fontWeight: 900, padding: '3px 10px',
          borderRadius: '20px', border: '2px solid var(--glass-border)',
          animation: 'wiggle 1s infinite',
        }}>
          🎉 TODAY!
        </div>
      )}

      {/* Emoji */}
      <div style={{
        fontSize: '2rem',
        width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-primary)', borderRadius: '50%',
        border: '2px solid var(--glass-border)',
        flexShrink: 0,
      }}>
        {m.emoji}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)', marginBottom: 2 }}>
          {m.label}
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          {formatDate(m.date)}
          {days > 0 && (
            <span style={{
              marginLeft: '0.75rem',
              color: isNear ? 'var(--accent-secondary)' : 'var(--text-muted)',
              fontWeight: isNear ? 800 : 600,
            }}>
              {days === 1 ? 'Tomorrow!' : `in ${days} days`}
            </span>
          )}
          {days === 0 && (
            <span style={{ marginLeft: '0.75rem', color: 'var(--accent-secondary)', fontWeight: 800 }}>
              🎊 Today!
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
        <button
          onClick={() => onEdit(m)}
          style={{
            width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--glass-border)',
            background: 'var(--bg-primary)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-muted)',
          }}
        >
          <Edit2 size={14} />
        </button>
        <button
          onClick={handleDelete}
          style={{
            width: 32, height: 32, borderRadius: '50%', border: '2px solid #ffcdd2',
            background: '#fff5f5', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-error)',
          }}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

// ── Add / Edit form ───────────────────────────────────────────
function MilestoneForm({ pairId, uid, initial, onDone }) {
  const typeInfo = MILESTONE_TYPES.find(t => t.type === (initial?.type || 'custom')) || MILESTONE_TYPES[MILESTONE_TYPES.length - 1];
  const [type,   setType]  = useState(initial?.type  || 'custom');
  const [label,  setLabel] = useState(initial?.label || '');
  const [emoji,  setEmoji] = useState(initial?.emoji || typeInfo.emoji);
  const [date,   setDate]  = useState(initial?.date ? dateToInput(initial.date) : '');
  const [saving, setSaving] = useState(false);

  // Auto-fill label + emoji when type changes
  const handleTypeChange = (t) => {
    setType(t);
    const info = MILESTONE_TYPES.find(x => x.type === t);
    if (info && (!label || MILESTONE_TYPES.some(x => x.label === label))) {
      setLabel(info.label);
    }
    if (info) setEmoji(info.emoji);
  };

  const handleSave = async () => {
    if (!label.trim()) { if (window.showAlert) window.showAlert('Please enter a label.'); return; }
    if (!date) { if (window.showAlert) window.showAlert('Please pick a date.'); return; }
    setSaving(true);
    try {
      const payload = { type, label: label.trim(), emoji, date: inputToDate(date), createdBy: uid };
      if (initial?.id) {
        await updateMilestone(pairId, initial.id, payload);
      } else {
        await addMilestone(pairId, payload);
      }
      onDone();
    } catch (err) {
      if (window.showAlert) window.showAlert('Error: ' + err.message);
    }
    setSaving(false);
  };

  return (
    <div className="glass-panel" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
      <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>
        {initial?.id ? '✏️ Edit Milestone' : '➕ Add Milestone'}
      </h3>

      {/* Type */}
      <div style={{ marginBottom: '0.75rem' }}>
        <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.4rem', fontSize: '0.85rem' }}>Type</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {MILESTONE_TYPES.map(t => (
            <button
              key={t.type}
              onClick={() => handleTypeChange(t.type)}
              style={{
                padding: '0.3rem 0.7rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700,
                fontFamily: 'inherit', cursor: 'pointer',
                border: '2px solid var(--glass-border)',
                background: type === t.type ? 'var(--accent-secondary)' : 'var(--bg-primary)',
                color: type === t.type ? '#fff' : 'var(--text-muted)',
              }}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Label */}
      <div style={{ marginBottom: '0.75rem' }}>
        <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.4rem', fontSize: '0.85rem' }}>Label</label>
        <input
          className="input-field"
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="e.g. Our First Anniversary"
          style={{ width: '100%', boxSizing: 'border-box' }}
          maxLength={40}
        />
      </div>

      {/* Emoji + Date row */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '0 0 80px' }}>
          <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.4rem', fontSize: '0.85rem' }}>Emoji</label>
          <input
            className="input-field"
            value={emoji}
            onChange={e => setEmoji(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box', textAlign: 'center', fontSize: '1.4rem' }}
            maxLength={2}
          />
        </div>
        <div style={{ flex: 1, minWidth: '160px' }}>
          <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.4rem', fontSize: '0.85rem' }}>Date</label>
          <input
            type="date"
            className="input-field"
            value={date}
            onChange={e => setDate(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button className="gradient-btn" onClick={handleSave} disabled={saving}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Check size={15} /> {saving ? 'Saving…' : 'Save'}
        </button>
        <button onClick={onDone}
          style={{
            padding: '0.5rem 1rem', borderRadius: '20px', fontFamily: 'inherit', fontWeight: 700,
            fontSize: '0.9rem', cursor: 'pointer', border: '2px solid var(--glass-border)',
            background: 'transparent', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem',
          }}>
          <X size={15} /> Cancel
        </button>
      </div>
    </div>
  );
}

// ── Main Milestones view ──────────────────────────────────────
export default function Milestones({ userProfile }) {
  const navigate = useNavigate();
  const [milestones, setMilestones] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const pairId = userProfile?.uid && userProfile?.partnerId
    ? [userProfile.uid, userProfile.partnerId].sort().join('_')
    : null;
  const uid = userProfile?.uid;

  useEffect(() => {
    if (!pairId) return;
    return listenToMilestones(pairId, setMilestones);
  }, [pairId]);

  if (!pairId) {
    return (
      <div className="flex-center animate-in" style={{ flex: 1 }}>
        <p>Pair with a partner first to track milestones 💕</p>
      </div>
    );
  }

  const upcoming = milestones.filter(m => daysUntil(m.date.toDate ? m.date.toDate() : new Date(m.date)) <= 30);
  const rest     = milestones.filter(m => daysUntil(m.date.toDate ? m.date.toDate() : new Date(m.date)) > 30);

  const handleEdit = (m) => { setEditing(m); setShowForm(true); };
  const handleFormDone = () => { setShowForm(false); setEditing(null); };

  return (
    <div className="animate-in" style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <style>{`
        @keyframes celebrationPulse {
          0%, 100% { box-shadow: var(--solid-shadow); }
          50% { box-shadow: 0 0 0 6px rgba(223,139,145,0.3), var(--solid-shadow); }
        }
      `}</style>

      {/* Header */}
      <div style={{ flexShrink: 0, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button className="btn btn-secondary"
          onClick={() => navigate('/')}
          style={{ padding: '0.4rem 0.9rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Back
        </button>
        <h2 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '1.3rem' }}>
          Moments & Milestones 💍
        </h2>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>

        {/* Add / Edit form */}
        {showForm && (
          <MilestoneForm pairId={pairId} uid={uid} initial={editing} onDone={handleFormDone} />
        )}

        {!showForm && (
          <button
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="gradient-btn"
            style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', justifyContent: 'center' }}
          >
            <Plus size={18} /> Add Milestone
          </button>
        )}

        {milestones.length === 0 && !showForm && (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>💌</div>
            <p style={{ fontWeight: 700 }}>No milestones yet!</p>
            <p style={{ fontSize: '0.85rem', marginTop: '0.4rem' }}>
              Add your anniversary, birthdays, or any special date and the app will keep track of them for you.
            </p>
          </div>
        )}

        {/* Upcoming (≤ 30 days) */}
        {upcoming.length > 0 && (
          <>
            <div style={{ fontWeight: 800, fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
              Coming Up Soon
            </div>
            {upcoming.map(m => (
              <MilestoneCard key={m.id} m={m} pairId={pairId} uid={uid} onEdit={handleEdit} />
            ))}
          </>
        )}

        {/* Rest */}
        {rest.length > 0 && (
          <>
            <div style={{ fontWeight: 800, fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '1rem 0 0.5rem' }}>
              All Milestones
            </div>
            {rest.map(m => (
              <MilestoneCard key={m.id} m={m} pairId={pairId} uid={uid} onEdit={handleEdit} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
