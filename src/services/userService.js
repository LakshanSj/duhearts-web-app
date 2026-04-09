import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, onSnapshot, writeBatch } from 'firebase/firestore';

const generateInviteCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const getUserProfile = async (uid) => {
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data();
  }
  return null;
};

export const createUserProfile = async (uid, username) => {
  let inviteCode;
  let codeIsUnique = false;
  
  // Ensure unique code
  while (!codeIsUnique) {
    inviteCode = generateInviteCode();
    const q = query(collection(db, 'users'), where('inviteCode', '==', inviteCode));
    const snapshot = await getDocs(q);
    if (snapshot.empty) codeIsUnique = true;
  }

  const userData = {
    uid,
    username,
    inviteCode,
    partnerId: null,
    createdAt: Date.now()
  };

  await setDoc(doc(db, 'users', uid), userData);
  return userData;
};

export const listenToUserProfile = (uid, callback) => {
  const docRef = doc(db, 'users', uid);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data());
    } else {
      callback(null);
    }
  });
};

export const updateUserProfile = async (uid, { displayName, photoURL }) => {
  const updates = {};
  if (displayName !== undefined) updates.displayName = displayName;
  if (photoURL !== undefined) updates.photoURL = photoURL;
  await updateDoc(doc(db, 'users', uid), updates);
};

export const pairWithPartner = async (uid, partnerCode) => {
  // Find partner
  const q = query(collection(db, 'users'), where('inviteCode', '==', partnerCode));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    throw new Error('Invalid code. Partner not found.');
  }

  const partnerDoc = snapshot.docs[0];
  const partnerData = partnerDoc.data();

  if (partnerData.uid === uid) {
    throw new Error('You cannot pair with your own code.');
  }

  if (partnerData.partnerId) {
    throw new Error('This partner is already paired with someone else.');
  }

  const myDocRef = doc(db, 'users', uid);
  const partnerDocRef = partnerDoc.ref;

  const batch = writeBatch(db);
  batch.update(myDocRef, { partnerId: partnerData.uid });
  batch.update(partnerDocRef, { partnerId: uid });
  
  await batch.commit();
};
