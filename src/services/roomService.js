import { db } from '../firebase';
import { doc, setDoc, getDoc, updateDoc, onSnapshot, collection, addDoc, query, orderBy, limit, arrayUnion, arrayRemove } from 'firebase/firestore';

export const createRoom = async (gameType, user, pairId, userProfile) => {
  if (!user || !pairId) throw new Error("Must be logged in and paired");
  const roomRef = doc(db, 'rooms', pairId);
  const hostName = userProfile?.displayName || userProfile?.username || 'Player 1';
  await setDoc(roomRef, {
    roomId: pairId,
    hostId: user.uid,
    hostName: hostName,
    guestId: userProfile?.partnerId,
    guestName: null,
    gameType: gameType,
    status: 'waiting',
    activePlayers: [user.uid],   // tracks who is currently in the game view
    board: Array(25).fill(""),
    scores: { p1: 0, p2: 0 },
    turnPlayer1: true,
    lastUpdate: Date.now()
  });
  return pairId;
};

export const joinRoom = async (code, user, userProfile) => {
  if (!user) throw new Error("Must be logged in");
  const roomRef = doc(db, 'rooms', code);
  const snap = await getDoc(roomRef);
  if (!snap.exists()) throw new Error("Room not found");
  const data = snap.data();
  const guestName = userProfile?.displayName || userProfile?.username || 'Player 2';
  if (data.hostId !== user.uid) {
    await updateDoc(roomRef, {
      guestId: user.uid,
      guestName: guestName,
      status: 'playing',
      activePlayers: arrayUnion(user.uid),
    });
  } else {
    // host re-joining
    await updateDoc(roomRef, { activePlayers: arrayUnion(user.uid) });
  }
  return data;
};

export const enterGame = async (code, user) => {
  const roomRef = doc(db, 'rooms', code);
  await updateDoc(roomRef, { activePlayers: arrayUnion(user.uid) });
};

export const leaveGame = async (code, user) => {
  const roomRef = doc(db, 'rooms', code);
  await updateDoc(roomRef, { activePlayers: arrayRemove(user.uid) });
};

export const updateGameState = async (code, updates) => {
  const roomRef = doc(db, 'rooms', code);
  await updateDoc(roomRef, { ...updates, lastUpdate: Date.now() });
};

export const listenToRoom = (code, callback) => {
  const roomRef = doc(db, 'rooms', code);
  return onSnapshot(roomRef, (snap) => {
    callback(snap.exists() ? snap.data() : null);
  });
};

export const sendMessage = async (roomId, user, text) => {
  if (!user || !text.trim()) return;
  const messagesRef = collection(db, 'rooms', roomId, 'messages');
  await addDoc(messagesRef, {
    text,
    senderId: user.uid,
    senderName: user.displayName || 'Player',
    timestamp: Date.now()
  });
};

export const listenToMessages = (roomId, limitCount, callback) => {
  const messagesRef = collection(db, 'rooms', roomId, 'messages');
  const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(limitCount));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() })).reverse());
  });
};
