import admin from "firebase-admin";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const email = process.argv[2];

if (!email) {
  console.error("Usage: npm run set-main-admin -- your-email@gmail.com");
  process.exit(1);
}

const serviceAccountPath = join(process.cwd(), "serviceAccountKey.json");
const credential = existsSync(serviceAccountPath)
  ? admin.credential.cert(JSON.parse(readFileSync(serviceAccountPath, "utf8")))
  : admin.credential.applicationDefault();

admin.initializeApp({ credential });

const user = await admin.auth().getUserByEmail(email);

await admin.auth().setCustomUserClaims(user.uid, {
  admin: true,
  mainAdmin: true
});

await admin.firestore().collection("users").doc(user.uid).set({
  email,
  role: "admin",
  status: "active",
  mainAdmin: true,
  provider: "google.com",
  updated_at: admin.firestore.FieldValue.serverTimestamp()
}, { merge: true });

await admin.firestore().collection("appConfig").doc("public").set({
  autoApproveGoogle: true,
  autoApproveEmail: false,
  updated_at: admin.firestore.FieldValue.serverTimestamp()
}, { merge: true });

console.log(`Main admin claim set for ${email} (${user.uid}).`);
console.log("Sign out and sign in again on the website so Firebase refreshes the token.");
