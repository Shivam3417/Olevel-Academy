# Netlify Deployment Guide

Ye guide batati hai app ko Netlify par deploy kaise karein, aur AI Doubt Assistant ke liye
Gemini API key ko **safely, server-side** kaise set karein (users ko kabhi kuch nahi karna
padega).

## Step 1 — Free Gemini API Key Banayein (aap khud, ek baar)

1. [aistudio.google.com/apikey](https://aistudio.google.com/apikey) par jayein, Google account se login karein.
2. **"Create API key"** click karein → key copy kar lein. (Free, koi credit card nahi chahiye.)

## Step 2 — Netlify Par Deploy Karein

**Option A — Drag & Drop (sabse aasan)**
1. [app.netlify.com/drop](https://app.netlify.com/drop) par jayein.
2. Poora `o_level_pwa` folder drag-drop karein.
3. Live URL mil jayega turant.

⚠️ Drag & Drop se deploy karne par **Netlify Functions automatically kaam nahi karti** —
usके liye Option B (Git-connected ya CLI) better hai. Agar sirf Drop use karna hai, to Step 2B
follow karein (Netlify CLI se) taaki functions bhi deploy ho.

**Option B — Netlify CLI (functions ke saath, recommended)**
```bash
npm install -g netlify-cli
cd o_level_pwa
netlify login
netlify deploy --prod
```
Jab poochhe **"Publish directory"** → `.` (current folder) daalein. Ye Git ke bina bhi kaam
karta hai aur Functions automatically detect ho jayengi (`netlify.toml` already configured hai).

**Option C — GitHub Se Connect (best for future updates)**
1. Iss folder ko GitHub repo mein push karein.
2. [app.netlify.com](https://app.netlify.com) → **Add new site → Import from Git** → apna repo select karein.
3. Build settings khali chhod dein (Publish directory: `.`) → Deploy.

## Step 3 — Environment Variable Set Karein (Zaroori — AI Assistant Ke Liye)

1. Netlify Dashboard → apna site select karein → **Site configuration → Environment variables**.
2. **Add a variable**:
   - Key: `GEMINI_API_KEY`
   - Value: (Step 1 wali key paste karein)
3. Save karein.
4. **Deploys** tab → **Trigger deploy → Clear cache and deploy site** (naya environment variable apply karne ke liye redeploy zaroori hai).

## Step 4 — Test Karein

Live URL kholein → **AI** tab par jayein → koi bhi doubt type karke bhejein. Agar "Assistant abhi
available nahi hai" wala message aaye:
- Confirm karein ki `GEMINI_API_KEY` sahi se set hai (Step 3)
- Confirm karein ki deploy Option B ya C se hua hai (Drag & Drop / Option A mein functions kaam nahi karti)
- Redeploy karein (cache clear karke)

## Local Testing Karte Waqt AI Assistant Kaam Nahi Karega — Ye Normal Hai

`python -m http.server` jaisa simple local server sirf static files serve karta hai —
Netlify Functions (jo AI Assistant chalati hai) sirf Netlify par (ya `netlify dev` command se
local mein) chalti hain. Baaki poora app (quiz, notes, flashcards, playground, etc.) local
testing mein bilkul normal kaam karega.

Agar local mein AI Assistant bhi test karna ho:
```bash
npm install -g netlify-cli
cd o_level_pwa
netlify dev
```
Isse ek local server chalega jo Functions ko bhi simulate karta hai.

## Security Note

`GEMINI_API_KEY` sirf Netlify ke server-side environment mein rehti hai — kabhi bhi browser
ya page source mein nahi aati. Users iss key ko dekh ya use nahi kar sakte, chahe woh
"View Page Source" ya DevTools kholein. Isi wajah se ye tareeka client-side mein key daalne se
zyada safe hai.
