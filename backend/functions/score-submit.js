// Vercel serverless function: POST { name, score } -> writes to Firestore.
// Requires FIREBASE_* env vars configured in Vercel project settings.
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function db() {
  if (!getApps().length) {
    initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
  }
  return getFirestore();
}

// Basic sanity guards. This is NOT a substitute for server-side score
// verification (a determined cheater can still POST fake scores directly) —
// real anti-cheat would replay/validate a game session server-side, which is
// out of scope here. This just blocks trivial spam/garbage.
const MAX_SCORE = 100000;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { name, score } = req.body ?? {};

  if (typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'name required' });
  }
  if (typeof score !== 'number' || !Number.isFinite(score) || score < 0 || score > MAX_SCORE) {
    return res.status(400).json({ error: 'invalid score' });
  }

  await db().collection('leaderboard').add({
    name: name.trim().slice(0, 24),
    score: Math.floor(score),
    ts: Date.now()
  });
  res.status(200).json({ ok: true });
}
