import React, { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  query,
  where,
  serverTimestamp,
  doc,
  updateDoc,
  onSnapshot,
  increment,
} from "firebase/firestore";

const Redeem: React.FC = () => {
  const [coins, setCoins] = useState(0);
  const [amount, setAmount] = useState("");
  const [redeemHistory, setRedeemHistory] = useState<any[]>([]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // ✅ realtime coins fetch
    const userRef = doc(db, "users", user.email!);
    const unsubUser = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        setCoins(snap.data().coins || 0);
      }
    });

    // ✅ realtime redeem history fetch
    const redeemQuery = query(
      collection(db, "redeemRequests"),
      where("userEmail", "==", user.email)
    );
    const unsubRedeem = onSnapshot(redeemQuery, (snapshot) => {
      const historyData: any[] = [];
      snapshot.forEach((doc) => {
        historyData.push(doc.data());
      });
      setRedeemHistory(historyData);
    });

    return () => {
      unsubUser();
      unsubRedeem();
    };
  }, []);

  const handleRedeem = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const redeemAmount = parseInt(amount);
    if (redeemAmount > coins) {
      alert("Not enough coins to redeem.");
      return;
    }

    const userRef = doc(db, "users", user.email!);
    // ✅ safe coin deduction
    await updateDoc(userRef, {
      coins: increment(-redeemAmount),
    });

    // ✅ Firestore me redeem request add
    await addDoc(collection(db, "redeemRequests"), {
      userEmail: user.email,
      userName: user.displayName || "User",
      coinsSpent: redeemAmount,
      reward: "Reward Pending",
      status: "pending",
      requestedAt: serverTimestamp(),
    });

    setAmount("");
    alert("Redeem request submitted!");
  };

  return (
    <div>
      <h2>Redeem Coins</h2>
      <p>Available Coins: {coins}</p>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Enter coins to redeem"
      />
      <button onClick={handleRedeem}>Redeem</button>

      <h3>Redeem History</h3>
      <ul>
        {redeemHistory.map((item, index) => (
          <li key={index}>
            {item.coinsSpent} coins - {item.status}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Redeem;
