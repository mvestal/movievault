# Matt's Film Vault — Deploy Instructions

## What you need
- A free Netlify account (netlify.com)
- A free Google Gemini API key (no credit card required)

---

## Step 1 — Get your free Gemini API key
1. Go to https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API key"
4. Copy it — you'll need it in Step 3

---

## Step 2 — Deploy to Netlify via GitHub (recommended)

1. Create a free GitHub account at github.com if you don't have one
2. Create a new repository called "film-vault"
3. Upload all the files from this zip to that repo
4. Go to https://app.netlify.com and sign up free
5. Click "Add new site" → "Import an existing project" → Connect GitHub
6. Select your film-vault repo
7. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
8. Click "Deploy site"

---

## Step 3 — Add your Gemini API key to Netlify
1. In Netlify, go to your site → "Site configuration" → "Environment variables"
2. Click "Add a variable"
3. Key: `GEMINI_API_KEY`
4. Value: your key from Step 1
5. Save, then go to "Deploys" and trigger a new deploy

---

## Step 4 — Add to your iPhone home screen
1. Open your Netlify URL in Safari (e.g. https://your-site.netlify.app)
2. Tap the Share button (box with arrow)
3. Tap "Add to Home Screen"
4. Name it "Film Vault"
5. It'll look and feel like a native app!

---

## Costs
- Netlify: FREE
- Gemini API: FREE (generous free tier, no credit card needed)

---

## Troubleshooting
- If recs aren't working, check that GEMINI_API_KEY is set correctly in Netlify env vars
- Ratings are stored in your browser's localStorage — they persist between sessions on the same device
