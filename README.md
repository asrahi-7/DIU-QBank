# InfinityWord — DIU AI QBank

A study portal for browsing past exam papers from Daffodil International University, with an in-page PDF viewer and an AI solver that explains questions for you.

![Preview](docs/preview.png)

## What you can do

- **Browse about 1,300 papers** by department, exam type (Mid, Final, Quiz, Lab Final) and semester.
- **Search** by course name, semester or exam type. Press `/` anywhere to jump to the search box.
- **Read papers in the page** with a choice of viewers (Google, Direct, Office), or open the original PDF.
- **Ask the AI solver** to solve a question, list key topics, generate practice questions, or analyse a PDF or image you upload. Bring your own key for Anthropic, OpenAI, Gemini or Groq.
- **Sign in when you need to.** Browsing works as a guest. Google or email login is for uploading and managing papers, with student and admin roles backed by Firebase.

## The look: Aurora Observatory

The interface is styled as a night-sky study desk. It ships as a drop-in layer, so none of your Firebase, auth or AI code is touched.

| Effect | What it does |
| --- | --- |
| Constellation background | Drifting stars linked like a graph. Your cursor wires itself to the nearest ones. |
| Aurora light | Two slow colour fields behind the whole page. |
| Hero strip | Headline entrance, live counts, and a bar showing papers by exam type. Click a segment to filter. |
| Tilting cards | Cards lean toward your cursor and pick up a spotlight. |
| Count-up numbers | Stat cards animate to their value when they appear. |
| Glass panels | Sidebar, top bar, modals and cards use frosted glass. |
| Mobile drawer | The department sidebar opens from a menu button on small screens. |

Everything respects `prefers-reduced-motion`. Pointer effects switch off on touch devices.

## Quick start

1. Clone the repo and open the project folder.
2. Set up Firebase by following [`FIREBASE_SETUP.md`](FIREBASE_SETUP.md), and put your web config in `firebase-config.js`.
3. Serve the folder with the method you already use (`server.py` or the scripts in `package.json`), then open `index.html` in the browser.

To see the new design without any setup, open `preview.html`. It uses a small sample of the question data and a stripped-down copy of the page logic.

## Installing the theme

Copy `theme.css` and `fx.js` next to `index.html`, then add two lines.

**1. Before `</head>`, after your existing `<style>` block:**

```html
<link rel="stylesheet" href="theme.css">
```

**2. Before `</body>`, after every other `<script>`:**

```html
<script src="fx.js"></script>
```

The order matters. `theme.css` must come after your own styles so it wins, and `fx.js` must come after the script that declares `QRAW` so the hero can read your question data.

### Turning effects on and off

Define `FX_CONFIG` before loading `fx.js`. Every option defaults to `true`.

```html
<script>
  window.FX_CONFIG = {
    constellation: true,  // star-graph background
    cursorGlow: true,     // soft light that follows the pointer
    tilt: true,           // 3D card tilt and spotlight
    hero: true,           // headline + stats + exam-type bar
    reveal: true,         // staggered fade-in for new cards
    ripple: true,         // click ripple on buttons and chips
    mobileMenu: true,     // sidebar drawer on small screens
    shortcut: true        // "/" focuses search
  };
</script>
<script src="fx.js"></script>
```

## Customising

All colours and fonts live in the `:root` block at the top of `theme.css`.

| Variable | Default | Used for |
| --- | --- | --- |
| `--accent` | `#9a86ff` | Primary violet: active states, focus glow, buttons |
| `--accent2` | `#22d3ee` | Cyan: search focus, links, spinner |
| `--bg` | `#050713` | Page background |
| `--fx-display` | Bricolage Grotesque | Headlines, card titles, numbers |
| `--fx-body` | Instrument Sans | Everything else |

Exam-type colours are set in the `TYPES` list near the top of the `hero()` function in `fx.js`, and in the `.badge-*` rules in `theme.css`.

## Files

```
index.html         the app (your existing page)
theme.css          visual theme
fx.js              effects and hero strip
preview.html       standalone demo of the theme with sample data
FIREBASE_SETUP.md  Firebase setup guide
firestore.rules    Firestore security rules
firebase.json      Firebase project config
server.py          local server
docs/preview.png   screenshot used above
```

## Performance and accessibility

- The canvas caps at about 90 nodes on desktop and about 36 on phones, and pauses when the tab is hidden.
- Reduced-motion users get a static star field and no entrance animations.
- Every interactive element keeps a visible keyboard focus ring.
- Text contrast on the dark glass panels stays above WCAG AA for body copy.

## Troubleshooting

**Emoji or dashes show up as `ðŸŽ“` or `â€”`.** The file was saved in the wrong encoding. Re-save `index.html` as UTF-8 in your editor. In VS Code, use "Save with Encoding" and pick UTF-8. This is separate from the theme.

**The hero strip is missing.** `fx.js` could not find `QRAW`. Check that the script tag is after the one that declares your question array. The rest of the theme still works without it.

**Fonts look plain.** The theme loads Bricolage Grotesque and Instrument Sans from Google Fonts. Offline, it falls back to your system sans-serif.

**A card effect feels heavy on an old laptop.** Set `constellation`, `cursorGlow` and `tilt` to `false` in `FX_CONFIG`.

## Security notes

- Firebase web config values are not secrets, but your data is only as safe as [`firestore.rules`](firestore.rules). Review them before going public.
- Never commit AI provider keys. Users enter their own keys in Settings, and those stay in their own browser.

## License

Add a license of your choice here.
