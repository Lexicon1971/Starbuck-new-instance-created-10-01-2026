import { db } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

/**
 * Posts high score to the secure Firebase Cloud Function endpoint.
 * @param name The name of the player.
 * @param score The net worth achieved.
 * @param days The number of days survived.
 */
export async function postHighScore(name: string, score: number, days: number = 1, achievements: string[] = []): Promise<boolean> {
  // Use VITE_FIREBASE_FUNCTIONS_URL environment variable, fallback to us-central1 default endpoint
  const url = import.meta.env.VITE_FIREBASE_FUNCTIONS_URL || "https://us-central1-starbucks-galaxy.cloudfunctions.net/submitScore";

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name, score, days, achievements })
    });
    return response.ok;
  } catch (error) {
    console.error("Error posting high score via secure endpoint:", error);
    return false;
  }
}

/**
 * Real-time subscription to the top 100 high scores in the global leaderboard.
 * @param callback Callback triggered on each snapshot update.
 */
export function subscribeToLeaderboard(callback: (scores: any[]) => void) {
  const q = query(
    collection(db, "leaderboard"),
    orderBy("score", "desc"),
    limit(100)
  );

  return onSnapshot(q, (snapshot) => {
    const scores: any[] = [];
    snapshot.forEach((doc) => {
      scores.push({ id: doc.id, ...doc.data() });
    });
    callback(scores);
  }, (error) => {
    console.error("Leaderboard real-time connection error:", error);
  });
}
