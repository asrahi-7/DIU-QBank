# Publish Guide: DIU QBank On GitHub Pages

This is the from-zero checklist for publishing the website like:

```txt
https://asrahi-7.github.io/InfinityWord/
```

## 1. Create The GitHub Repository

1. Go to GitHub.
2. Create a public repository named `InfinityWord`.
3. Do not upload `serviceAccountKey.json`.

## 2. Files To Upload

Upload these:

- `index.html`
- `firebase-config.js`
- `firebase.json`
- `firestore.rules`
- `package.json`
- `package-lock.json`
- `FIREBASE_SETUP.md`
- `README.md`
- `GITHUB_PUBLISH_GUIDE.md`
- `.gitignore`
- `.nojekyll`
- `scripts/`
- `exports/`
- `netlify/` only if you also want optional Netlify proxy hosting.

Do not upload:

- `node_modules/`
- `serviceAccountKey.json`
- `.env` files

## 3. Enable GitHub Pages

1. Open the repository on GitHub.
2. Go to `Settings > Pages`.
3. Under `Build and deployment`, choose `Deploy from a branch`.
4. Branch: `main`.
5. Folder: `/root`.
6. Save.

After GitHub builds, your website should be:

```txt
https://asrahi-7.github.io/InfinityWord/
```

## 4. Firebase Authentication Setup

Open Firebase Console for project `diu-ai`.

1. Go to `Authentication > Sign-in method`.
2. Enable `Google`.
3. Enable `Email/Password`.
4. Go to `Authentication > Settings > Authorized domains`.
5. Add:

```txt
asrahi-7.github.io
localhost
127.0.0.1
```

Use `localhost` and `127.0.0.1` only for local testing.

## 5. Firestore Setup

1. Go to `Firestore Database`.
2. Create the database if it does not exist.
3. Choose production mode.
4. Publish the rules from `firestore.rules`.

From this folder you can deploy rules with:

```powershell
npm.cmd install
npm.cmd run deploy-rules
```

If Firebase CLI login is needed:

```powershell
npm.cmd exec firebase login
npm.cmd run deploy-rules
```

## 6. Set The Main Admin

Keep `serviceAccountKey.json` only on your own computer.

Run:

```powershell
npm.cmd install
npm.cmd run set-main-admin -- asrahi2007@gmail.com
```

Change the email if your admin email is different.

## 7. AI Setup

The site supports user-owned AI keys in Settings.

Best choices:

- Gemini key: best for PDFs and images.
- Groq key: free/fast for typed text questions.
- OpenAI key: good for image reasoning.
- Anthropic key: strong text reasoning.

The key is stored in the visitor browser local storage. For a public production app where users should not bring their own keys, add a real backend proxy with secret environment variables instead of exposing keys in the browser.

## 8. Optional Netlify Backend Proxy

Use this only if you want `/proxy` and `/ai-proxy` hosted.

1. Create a Netlify site from the same repository.
2. Keep `netlify.toml`.
3. Add environment variables in Netlify if you later rewrite the AI proxy to use server-side keys.
4. Deploy.

GitHub Pages will still be only static hosting. Netlify is the simple option for backend functions.

## 9. Update The Live Site Later

After editing locally:

```powershell
git add .
git commit -m "Update DIU QBank portal"
git push
```

GitHub Pages redeploys automatically.

## 10. If You Want To Start From The Command Line

Run these commands from this folder after creating the empty GitHub repository:

```powershell
git init
git add .
git status
git commit -m "Publish DIU QBank portal"
git branch -M main
git remote add origin https://github.com/asrahi-7/InfinityWord.git
git push -u origin main
```

Before `git commit`, check that `serviceAccountKey.json` is not listed. If it appears, stop and remove it from staging:

```powershell
git restore --staged serviceAccountKey.json
```

## 11. Final Pre-Publish Checklist

- `serviceAccountKey.json` is not in GitHub.
- `node_modules/` is not in GitHub.
- Firebase authorized domain includes `asrahi-7.github.io`.
- Firestore rules are deployed.
- Main admin custom claim is set.
- The site opens at `https://asrahi-7.github.io/InfinityWord/`.
