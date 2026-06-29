import { db } from '../firebase';
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, Timestamp
} from 'firebase/firestore';

// ── Milestone types & defaults ────────────────────────────────
export const MILESTONE_TYPES = [
  { type: 'anniversary',  label: 'Anniversary',   emoji: '💍' },
  { type: 'first_date',   label: 'First Date',    emoji: '🌹' },
  { type: 'first_kiss',   label: 'First Kiss',    emoji: '💋' },
  { type: 'birthday_p1',  label: 'Birthday (You)',emoji: '🎂' },
  { type: 'birthday_p2',  label: "Birthday (Partner)", emoji: '🎂' },
  { type: 'engagement',   label: 'Engagement',    emoji: '💎' },
  { type: 'wedding',      label: 'Wedding Day',   emoji: '👰' },
  { type: 'custom',       label: 'Custom',        emoji: '⭐' },
];

// ── Helpers ───────────────────────────────────────────────────

/**
 * Returns the next upcoming occurrence of a milestone date (this year or next).
 * `milestoneDate` is a JS Date (or Firestore Timestamp).
 */
export const getNextOccurrence = (milestoneDate) => {
  const d = milestoneDate instanceof Date ? milestoneDate : milestoneDate.toDate();
  const now = new Date();
  const thisYear = new Date(now.getFullYear(), d.getMonth(), d.getDate());
  if (thisYear >= now) return thisYear;
  return new Date(now.getFullYear() + 1, d.getMonth(), d.getDate());
};

/**
 * Days until the next occurrence of a milestone.
 * Returns 0 if today is the milestone day.
 */
export const daysUntil = (milestoneDate) => {
  const next = getNextOccurrence(milestoneDate);
  const now = new Date();
  const diffMs = next.setHours(0,0,0,0) - now.setHours(0,0,0,0);
  return Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
};

/**
 * Is today within `windowDays` of the next occurrence?
 */
export const isNearMilestone = (milestoneDate, windowDays = 7) => {
  return daysUntil(milestoneDate) <= windowDays;
};

/**
 * Is today exactly the milestone day?
 */
export const isTodayMilestone = (milestoneDate) => {
  return daysUntil(milestoneDate) === 0;
};

// ── Firestore CRUD ────────────────────────────────────────────

/** Listen to all milestones for a couple pair in real time. */
export const listenToMilestones = (pairId, callback) => {
  const ref = collection(db, 'milestones', pairId, 'events');
  const q = query(ref, orderBy('date', 'asc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
};

/** Add a new milestone. `date` should be a JS Date. */
export const addMilestone = async (pairId, { type, label, date, emoji, createdBy }) => {
  const ref = collection(db, 'milestones', pairId, 'events');
  await addDoc(ref, {
    type,
    label,
    emoji,
    date: Timestamp.fromDate(date),
    createdBy,
    celebrationMode: true,
    createdAt: Timestamp.now(),
  });
};

/** Update an existing milestone. */
export const updateMilestone = async (pairId, eventId, updates) => {
  const ref = doc(db, 'milestones', pairId, 'events', eventId);
  const safeUpdates = { ...updates };
  if (updates.date instanceof Date) safeUpdates.date = Timestamp.fromDate(updates.date);
  await updateDoc(ref, safeUpdates);
};

/** Delete a milestone. */
export const deleteMilestone = async (pairId, eventId) => {
  await deleteDoc(doc(db, 'milestones', pairId, 'events', eventId));
};
