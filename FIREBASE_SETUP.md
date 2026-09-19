# Secure Firebase Login Setup

The site is public by default. Visitors can browse/search/view papers without logging in.

Login is only needed for:

- student uploads
- admin approval/suspension/removal
- submission review

## Auth Behavior

- Google login: auto-approved as an active student when `autoApproveGoogle` is on.
- Email/password request: creates a pending student account.
- Admin panel: can approve/suspend/remove students and approve/reject/remove submissions.
- Main admin: controlled by Firebase custom claims, not by passwords in HTML.

## Required Firebase Console Settings

1. Authentication > Sign-in method: enable Google.
2. Authentication > Sign-in method: enable Email/Password.
3. Authentication > Settings > Authorized domains: add `asrahi-7.github.io`.
4. Firestore Database > Rules: publish `firestore.rules`.

## Set Main Admin

Put your private service account JSON in this folder as:

```txt
serviceAccountKey.json
```

Never upload that file to GitHub.

Then run:

```powershell
npm.cmd install
npm.cmd run set-main-admin -- asrahi2007@gmail.com
```

This also creates the public app config:

```js
autoApproveGoogle: true
autoApproveEmail: false
```

## Add Email/Password Student Manually

```powershell
npm.cmd run create-login-user -- student@example.com
```

Students can also request an email/password account from the login modal. Those requests appear in Admin Panel as pending users.

## AI API Recommendation

Use Gemini first for this website because the browser-only implementation can send PDF/image files directly to Gemini. OpenAI works well for images. Groq is good for fast text answers but does not analyze PDFs/images here.
