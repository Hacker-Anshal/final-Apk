import React, { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import {
  doc,
  setDoc,
  updateDoc,
  increment,
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";

export default function Earn() {
  const [coins, setCoins] = useState(0);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = doc(db, "users", user.email!);

    // ✅ realtime coins fetch
    const unsub = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        setCoins(snap.data().coins || 0);
      } else {
        setDoc(userRef, { coins: 0 });
        setCoins(0);
      }
    });

    return () => unsub();
  }, []);

  const handleWatchAd = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const reward = 5;
    const userRef = doc(db, "users", user.email!);
    await updateDoc(userRef, { coins: increment(reward) }).catch(async () => {
      await setDoc(userRef, { coins: reward });
    });

    await addDoc(collection(db, "coins"), {
      userEmail: user.email,
      title: "Watched Ad",
      coins: reward,
      earnedAt: serverTimestamp(),
    });

    alert(`🎉 You earned +${reward} coins from watching ad!`);
  };

  return (
    <div className="p-4 text-center">
      <h2 className="text-xl font-bold">Earn Coins</h2>
      <p className="mt-2">Your Coins: {coins}</p>

      <button
        onClick={handleWatchAd}
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
      >
        Watch Ad (+5 coins)
      </button>
    </div>
  );
}
