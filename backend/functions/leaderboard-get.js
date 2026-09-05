import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function db() {
  if (!getApps().length) {
    initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
  }
  return getFirestore();
}

export default async function handler(req, res) {
  const snap = await db().collection('leaderboard').orderBy('score', 'desc').limit(10).get();
  res.status(200).json(snap.docs.map(d => d.data()));
}
