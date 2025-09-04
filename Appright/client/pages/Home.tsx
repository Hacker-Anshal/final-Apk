import React, { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  setDoc,
  Timestamp,
  collection,
  addDoc,
  serverTimestamp,
  updateDoc,
  increment,
} from "firebase/firestore";

export default function Home() {
  const [coins, setCoins] = useState(0);
  const [canCheckIn, setCanCheckIn] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      // ✅ get coins from users collection
      const userRef = doc(db, "users", user.email!);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        setCoins(snap.data().coins || 0);
      } else {
        await setDoc(userRef, { coins: 0 });
        setCoins(0);
      }

      // ✅ check last daily check-in
      const checkinRef = doc(db, "checkins", user.email!);
      const checkinSnap = await getDoc(checkinRef);
      if (checkinSnap.exists()) {
        const lastCheckIn = checkinSnap.data().lastCheckIn?.toDate();
        const today = new Date();
        if (
          !lastCheckIn ||
          lastCheckIn.toDateString() !== today.toDateString()
        ) {
          setCanCheckIn(true);
        } else {
          setCanCheckIn(false);
        }
      } else {
        setCanCheckIn(true);
      }
    };

    fetchData();
  }, []);

  // ✅ Daily check-in logic
  const handleDailyCheckIn = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = doc(db, "users", user.email!);
    await updateDoc(userRef, { coins: increment(50) }).catch(async () => {
      await setDoc(userRef, { coins: 50 });
    });

    const checkinRef = doc(db, "checkins", user.email!);
    await setDoc(checkinRef, { lastCheckIn: Timestamp.now() });

    await addDoc(collection(db, "coins"), {
      userEmail: user.email,
      title: "Daily Check-in",
      coins: 50,
      earnedAt: serverTimestamp(),
    });

    setCoins(coins + 50);
    setCanCheckIn(false);
    alert("✅ Daily Check-in successful! +50 coins");
  };

  // ✅ Watch Ads unlimited (local only)
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

    setCoins(coins + reward);
    alert(`🎉 You earned +${reward} coins from watching ad!`);
  };

  return (
    <div className="p-4 text-center">
      <h2 className="text-xl font-bold">Welcome to Reward App</h2>
      <p className="mt-2">Your Coins: {coins}</p>

      {canCheckIn ? (
        <button
          onClick={handleDailyCheckIn}
          className="mt-4 bg-green-600 text-white px-4 py-2 rounded"
        >
          Daily Check-in
        </button>
      ) : (
        <p className="mt-4 text-gray-500">✅ Already checked in today</p>
      )}

      <button
        onClick={handleWatchAd}
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
      >
        Watch Ad (+5 coins)
      </button>
    </div>
  );
}
