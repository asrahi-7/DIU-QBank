# DIU QBank Smart Study Portal

A GitHub Pages-ready frontend for browsing DIU question papers, previewing PDFs, student uploads, admin approval, and AI-assisted study help.

## What Is Included

- `index.html`: complete frontend app.
- `firebase-config.js`: public Firebase web app configuration.
- `firestore.rules`: backend security rules for users, submissions, and app settings.
- `scripts/`: admin helper scripts for Firebase custom claims and setup.
- `server.py`: local-only preview server with `/proxy` and `/ai-proxy`.
- `netlify/functions/`: optional hosted proxy functions if you deploy with Netlify.

## Frontend

The frontend is static HTML/CSS/JS, so GitHub Pages can host it directly.

Core pages and flows:

- Public question browsing, search, department filters, exam type filters, and semester filters.
- PDF preview with Google, direct, proxy, Office, and PDF.js modes.
- AI solver settings for Gemini, OpenAI, Anthropic, and Groq.
- Student upload panel.
- Admin approval panel.

## Backend

GitHub Pages does not run backend code. This project uses Firebase as the backend:

- Firebase Authentication: Google login and email/password login.
- Cloud Firestore: users, app configuration, and submitted question papers.
- Firebase custom claims: admin and main admin permissions.

Optional proxy backend:

- `server.py` is for local testing only.
- `netlify/functions/proxy.js` and `netlify/functions/ai-proxy.js` can run on Netlify.
- GitHub Pages cannot run those functions. On GitHub Pages, Gemini usually works directly from the browser. OpenAI, Anthropic, and Groq may need the proxy for reliable production use.

## Local Preview

```powershell
npm.cmd run start
```

Then open:

```txt
http://127.0.0.1:8787/index.html
```

## Important Security Note

Do not upload `serviceAccountKey.json` to GitHub. It is a private Firebase admin key. The `.gitignore` file blocks it, but if you manually upload files in the browser, leave it out.

If this key was ever uploaded publicly, revoke it in Google Cloud and create a new service account key.

## Publish To GitHub Pages

Full beginner steps are in [GITHUB_PUBLISH_GUIDE.md](GITHUB_PUBLISH_GUIDE.md).
