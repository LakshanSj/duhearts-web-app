import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDjWgjSYPh0JDGaZ9qBQuYgCYv56a3nESM",
  authDomain: "duohearts.firebaseapp.com",
  projectId: "duohearts",
  storageBucket: "duohearts.firebasestorage.app",
  messagingSenderId: "793584717207",
  appId: "1:793584717207:web:a13d8a3acd0466661188d2",
  measurementId: "G-Y2LWXTEE2N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Cloud Storage and get a reference to the service
export const storage = getStorage(app);

// Auth Helper Functions
const getDummyEmail = (username) => `${username.toLowerCase().trim()}@duohearts.local`;

export const loginWithUsername = async (username, password) => {
  try {
    const result = await signInWithEmailAndPassword(auth, getDummyEmail(username), password);
    return result.user;
  } catch (error) {
    console.error("Error signing in: ", error);
    throw error;
  }
};

export const signupWithUsername = async (username, password) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, getDummyEmail(username), password);
    return result.user;
  } catch (error) {
    console.error("Error signing up: ", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out: ", error);
  }
};

export const changePassword = async (currentPassword, newPassword) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  
  try {
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
  } catch(error) {
    console.error("Error updating password: ", error);
    throw error;
  }
};
