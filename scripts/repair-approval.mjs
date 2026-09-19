import admin from 'firebase-admin';
import { readFileSync } from 'node:fs';

const serviceAccount = JSON.parse(readFileSync(new URL('../serviceAccountKey.json', import.meta.url), 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

await db.collection('appConfig').doc('public').set({
  autoApproveGoogle: true,
  autoApproveEmail: false,
  updated_at: admin.firestore.FieldValue.serverTimestamp(),
}, { merge: true });

const pendingGoogle = await db.collection('users')
  .where('provider', '==', 'google.com')
  .where('status', '==', 'pending')
  .get();

let approved = 0;
const batch = db.batch();
pendingGoogle.docs.forEach((doc) => {
  batch.set(doc.ref, {
    status: 'active',
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
  approved += 1;
});

if (approved) await batch.commit();

console.log(`Approval config repaired. Pending Google students approved: ${approved}`);
