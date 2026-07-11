const { onRequest } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

initializeApp();
const db = getFirestore();

/**
 * Cloud Function to submit player high scores safely.
 * Sanitizes player name, validates the score payload, and adds it to Firestore.
 */
exports.submitScore = onRequest({ cors: true }, async (req, res) => {
  // Only accept POST requests
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  try {
    const { name, score, days } = req.body;

    // 1. Sanitize name
    let sanitizedName = "Anonymous";
    if (typeof name === "string") {
      // Remove any non-alphanumeric/spaces/special chars and trim
      sanitizedName = name.replace(/[^a-zA-Z0-9\s.\-_]/g, "").trim().substring(0, 20);
    }
    if (!sanitizedName) {
      sanitizedName = "Anonymous";
    }

    // 2. Validate score
    const parsedScore = Number(score);
    if (typeof score === "undefined" || isNaN(parsedScore) || parsedScore < 0) {
      return res.status(400).send("Invalid score value.");
    }

    // 3. Simple anti-cheat threshold check (Galaxy cap of 10 Trillion)
    if (parsedScore > 1000000000000000) {
      return res.status(400).send("Score exceeds physical galaxy limits.");
    }

    // Days validated as a positive number
    const parsedDays = Math.max(1, Number(days) || 1);

    const data = {
      name: sanitizedName,
      score: parsedScore,
      days: parsedDays,
      date: new Date().toLocaleDateString()
    };

    // 4. Write verified data to global leaderboard collection
    await db.collection("leaderboard").add(data);

    return res.status(200).json({ success: true, message: "Score registered." });
  } catch (error) {
    console.error("Error submitting score:", error);
    return res.status(500).send("Internal Server Error");
  }
});
