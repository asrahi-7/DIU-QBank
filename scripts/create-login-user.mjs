import admin from "firebase-admin";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const email = process.argv[2];

if (!email) {
  console.error("Usage: npm run create-login-user -- student@example.com");
  process.exit(1);
}

const rl = readline.createInterface({ input, output });
const password = await rl.question("Temporary password: ");
rl.close();

if (password.length < 6) {
  console.error("Firebase requires passwords to be at least 6 characters.");
  process.exit(1);
}

const serviceAccountPath = join(process.cwd(), "serviceAccountKey.json");
const credential = existsSync(serviceAccountPath)
  ? admin.credential.cert(JSON.parse(readFileSync(serviceAccountPath, "utf8")))
  : admin.credential.applicationDefault();

admin.initializeApp({ credential });

let user;

try {
  user = await admin.auth().createUser({ email, password, emailVerified: false });
  console.log(`Created login user ${email} (${user.uid}).`);
} catch (error) {
  if (error.code !== "auth/email-already-exists") throw error;
  user = await admin.auth().getUserByEmail(email);
  await admin.auth().updateUser(user.uid, { password });
  console.log(`Updated password for existing user ${email} (${user.uid}).`);
}

await admin.auth().setCustomUserClaims(user.uid, {
  admin: false,
  mainAdmin: false
});

await admin.firestore().collection("users").doc(user.uid).set({
  email,
  role: "student",
  status: "active",
  provider: "password",
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  updated_at: admin.firestore.FieldValue.serverTimestamp()
}, { merge: true });

console.log("This user can sign in, but cannot edit admin-only data.");
