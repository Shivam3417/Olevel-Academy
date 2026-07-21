# O Level Prep — PWA (Progressive Web App) — v2.0

Complete, setup-free companion app for NIELIT O Level (R5) exam prep. No Flutter, no Android
Studio, no backend, no cost. Works fully offline once loaded.

## Files

```
index.html      → app shell: layout, styles, bottom nav
data.js         → all content: syllabus, question bank, notes, flashcards, achievements
app.js          → all logic: routing, quiz engine, mock test, playground, AI assistant, etc.
manifest.json   → app name/icon/install behaviour
sw.js           → offline caching (service worker)
icons/          → app icons
```

Split into 3 files (instead of 1 giant file) purely for readability at this size — still zero
build step, just open `index.html` through a local server as before.

## ⚠️ Run Through a Server, Not by Double-Clicking

Same as before — service worker, install prompt, and the AI/Code features need `http://` or
`https://`, not `file://`. See "Local Testing" below (unchanged from last time):

```bash
cd o_level_pwa
python -m http.server 8000
```
Then open `http://localhost:8000`. For phone testing or permanent free hosting (Netlify Drop,
Vercel, GitHub Pages, Firebase Hosting), see the previous guide steps — same process applies.

## Everything Now Included

| Feature | Details |
|---|---|
| **Full syllabus** | All 4 modules (M1–M4-R5), 24 topics, 60+ MCQs with explanations |
| **Topic & full-module quizzes** | Instant scoring, progress bar |
| **Full Syllabus Mock Test** | 30 random mixed questions, 20-minute timer, auto-submits at time-up |
| **Answer Review** | After every quiz/test, see each question with correct answer highlighted + explanation |
| **Bookmarks** | Star any question during a quiz, revisit anytime under Study → Bookmarks |
| **Quick Notes** | Short revision notes for every topic |
| **Flashcards** | Flip-card revision for key terms, all modules |
| **Search** | Search topics, notes and questions from the home screen |
| **Study Streak** | Daily streak counter, resets if a day is missed |
| **Exam Countdown** | Set your exam date in Settings, see days remaining on Home |
| **Achievements** | 8 unlockable badges (first quiz, 100%, 7-day streak, etc.) |
| **Code Playground** | Live HTML/CSS/JS editor with instant preview, and a real Python runner (via Pyodide, runs entirely in-browser, free) |
| **AI Doubt Assistant** | Built-in chat tutor — powered by a Netlify Function so your API key stays server-side; users never enter anything |
| **Dark & Light theme** | Toggle in Settings |
| **Backup & Restore** | Export/import your entire progress as a JSON file — no account needed |
| **Installable + Offline** | Add to home screen, works without internet after first load |

## Notes on the AI Assistant

The AI Doubt Assistant is **built-in** — users never enter an API key. It works via a small
Netlify Function (`netlify/functions/chat.js`) that keeps your Gemini API key safely on the
server side, as an environment variable, never exposed in the browser or page source. **You**
(the developer) set this up once — see `NETLIFY_DEPLOY_GUIDE.md` for the full steps (get a free
key, deploy to Netlify, add the environment variable). It only works after deploying to Netlify
with the key configured — it won't work when testing locally with a plain static server (see
the guide for how to test it locally too, via `netlify dev`).

## Notes on the Code Playground

- **Web tab**: type HTML/CSS/JS, click Run, see it rendered instantly in an embedded preview — great for practicing M2-R5 (Web Designing).
- **Python tab**: runs real Python in the browser via Pyodide (WebAssembly) — no server, completely free. First run downloads the Python engine (~10–15 sec, one-time per session), then runs instantly.

## Adding More Questions/Notes/Flashcards

Everything content-related lives in `data.js` — open it and extend the `QUESTIONS`, `NOTES`,
or `FLASHCARDS` arrays following the existing format. No other file needs to change.

## Roadmap Ideas (Not Yet Built)

- OCR-based notes scanning (needs camera access + ML model — can add next if useful)
- PDF export of notes/results (browser's built-in Print → Save as PDF works today as a free workaround)
- Previous year question papers (can add as a new data set in `data.js`)

Bata dijiye agar in mein se koi chahiye, ya kuch aur — jaise section ka scope aur wide karna ho.
