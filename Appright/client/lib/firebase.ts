// Firebase configuration and initialization
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup 
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  increment, 
  addDoc, 
  serverTimestamp, 
  Timestamp 
} from "firebase/firestore";

// 🔑 Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCMYrPBDKa44vMseGWHb8TGgek2_Mi2wIw",
  authDomain: "reward-coins-app-a9af0.firebaseapp.com",
  projectId: "reward-coins-app-a9af0",
  storageBucket: "reward-coins-app-a9af0.firebasestorage.app",
  messagingSenderId: "590301179268",
  appId: "1:590301179268:web:8ba2138b990f0893f441d1",
};

// 🔥 Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const provider = new GoogleAuthProvider();
export const db = getFirestore(app);

// 🔐 Google Sign-In
export function signInWithGoogle() {
  return signInWithPopup(auth, provider)
    .then((result) => {
      console.log("✅ Firebase Auth Success!", result.user?.email);
      return result;
    })
    .catch((error) => {
      console.error("❌ Firebase Auth Error:", error);
      throw error;
    });
}

// 💰 Fetch user's current coin balance
export async function fetchUserCoins(email: string): Promise<number> {
  const userRef = doc(db, "users", email);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return userSnap.data().coins || 0;
  } else {
    await setDoc(userRef, { coins: 0 });
    return 0;
  }
}

// ➕ Increment coins securely in Firestore
export async function incrementCoins(email: string, amount: number): Promise<void> {
  const userRef = doc(db, "users", email);
  await updateDoc(userRef, {
    coins: increment(amount),
  }).catch(async () => {
    await setDoc(userRef, { coins: amount });
  });
}

// 🪙 Add earning history (for Watch Ads, Spin, Check-in, etc.)
export async function addCoinHistory(userEmail: string, title: string, coins: number) {
  if (!userEmail) return;
  await addDoc(collection(db, "coins"), {
    userEmail,
    title,
    coins,
    earnedAt: serverTimestamp(),
  });
}

// ✅ Get last daily check-in date
export async function getLastCheckIn(email: string): Promise<Date | null> {
  const docRef = doc(db, "checkins", email);
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) {
    const data = snapshot.data();
    return data.lastCheckIn?.toDate?.() || null;
  }
  return null;
}

// ✅ Set last daily check-in timestamp
export async function setLastCheckIn(email: string): Promise<void> {
  const docRef = doc(db, "checkins", email);
  await setDoc(docRef, {
    lastCheckIn: Timestamp.now(),
  });
}

// 🎡 Spin: update spinCount + date
export async function updateSpinData(email: string, count: number): Promise<void> {
  const today = new Date().toISOString().split("T")[0];
  const spinRef = doc(db, "spin", email);
  await setDoc(spinRef, {
    lastSpinDate: today,
    spinCount: count,
  });
}
