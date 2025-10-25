# Farcaster Mini App - Step-by-Step Setup Guide

## What We Built

A complete Farcaster Mini App that allows users to mint NFTs on Base directly from Warpcast or other Farcaster clients. It shares the same backend and smart contract as your Telegram bot.

## Step-by-Step Setup

### Step 1: Test Locally (Development)

#### 1.1 Start the Backend

```bash
cd /Users/macbook/cookathon
npm run dev:backend
```

✅ **Verify:** You should see "Server running on port 3000" and "Database initialized successfully"

#### 1.2 Start the Farcaster Mini App

Open a new terminal:

```bash
cd /Users/macbook/cookathon
npm run dev:farcaster
```

✅ **Verify:** You should see "Local: http://localhost:5174"

#### 1.3 Test in Browser

1. Open `http://localhost:5174` in your browser
2. You should see "🎨 Mint NFT on Base" with purple theme
3. Click "Connect Wallet" (it will try to auto-connect)
4. Fill in the NFT details
5. Click "🚀 Generate Metadata URI"
6. Then click "🎨 Mint NFT"

✅ **Success:** If you can see the UI and it tries to connect a wallet, the mini app is working!

---

### Step 2: Deploy to Production

#### 2.1 Build the Farcaster Mini App

```bash
cd /Users/macbook/cookathon
npm run build:farcaster
```

This creates a production build in `farcaster-miniapp/dist/`

#### 2.2 Deploy to Vercel (Recommended)

**Option A: Deploy via Vercel CLI**

```bash
cd farcaster-miniapp
npm install -g vercel  # If you don't have it
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Scope? Choose your account
- Link to existing project? **N**
- Project name? `base-nft-farcaster` (or your choice)
- Directory? `./`
- Override settings? **Y**
  - Build Command: `npm run build`
  - Output Directory: `dist`
  - Install Command: `npm install`

**Option B: Deploy via Vercel Dashboard**

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure:
   - Framework Preset: **Vite**
   - Root Directory: **farcaster-miniapp**
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Add Environment Variables:
   - `VITE_CONTRACT_ADDRESS`: `0x15d56140A49c16EA636C9a7485D8f8E22a592bF0`
   - `VITE_BACKEND_URL`: `YOUR_BACKEND_URL` (see step 2.3)
5. Click **Deploy**

✅ **Result:** You'll get a URL like `https://your-app.vercel.app`

#### 2.3 Deploy Backend (if not already deployed)

Your backend needs to be publicly accessible. Options:

**Railway:**
1. Go to https://railway.app
2. New Project → Deploy from GitHub
3. Select your repository
4. Add environment variables from `.env`
5. Deploy

**Render:**
1. Go to https://render.com
2. New → Web Service
3. Connect your GitHub repository
4. Configure:
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && npm start`
5. Add environment variables
6. Deploy

✅ **Result:** You'll get a backend URL like `https://your-backend.railway.app`

#### 2.4 Update Environment Variables

Update your production environment variables:

**In Vercel (Farcaster Mini App):**
- `VITE_BACKEND_URL`: `https://your-backend.railway.app`

**In Railway/Render (Backend):**
- `FARCASTER_MINIAPP_URL`: `https://your-app.vercel.app`
- `BACKEND_URL`: `https://your-backend.railway.app`

---

### Step 3: Set Up Farcaster Account Association

This verifies you own the domain where the mini app is hosted.

#### 3.1 Install Farcaster Tools

```bash
npm install -g @farcaster/auth
```

#### 3.2 Generate Account Association

You'll need:
- Your Farcaster FID (find at https://warpcast.com/~/settings)
- Your custody address or signer key
- Your deployed domain (e.g., `your-app.vercel.app`)

```bash
# This is a simplified example - check Farcaster docs for exact command
farcaster-auth create-signature --domain your-app.vercel.app --fid YOUR_FID
```

✅ **Result:** You'll get three values:
- `header` (base64)
- `payload` (base64)
- `signature` (hex)

#### 3.3 Update Backend Environment

Add these to your backend environment variables:

```env
FARCASTER_ACCOUNT_HEADER=eyJ... (the header you got)
FARCASTER_ACCOUNT_PAYLOAD=eyJ... (the payload you got)
FARCASTER_ACCOUNT_SIGNATURE=0x... (the signature you got)
```

Redeploy your backend after adding these.

---

### Step 4: Create a Farcaster Cast

#### 4.1 Create the Cast

1. Open Warpcast
2. Create a new cast
3. Add your mini app URL: `https://your-app.vercel.app`
4. Add some text like: "🎨 Mint your NFT on Base! ⛓️"
5. Publish the cast

#### 4.2 Test the Mini App

1. Open your cast in Warpcast
2. You should see a preview with your meta tag image
3. Click the "Mint NFT" button
4. The mini app should open in Warpcast
5. Your wallet should auto-connect
6. Try minting an NFT!

---

### Step 5: Customize Your Mini App

#### 5.1 Update Meta Tags

Edit `farcaster-miniapp/index.html`:

```html
<!-- Update the image URL to your own -->
<meta name="fc:miniapp" content='{"version":"1","imageUrl":"https://your-cdn.com/preview.png","button":{"title":"Mint NFT","action":"launch_miniapp"}}' />
```

**Image Requirements:**
- Aspect ratio: 3:2
- Recommended size: 1200x800px
- Format: PNG or JPG
- Max file size: <1MB

#### 5.2 Add Custom Branding

Edit `farcaster-miniapp/src/App.css` to match your brand colors.

#### 5.3 Create Splash Screen

Add a splash screen image to `farcaster-miniapp/public/`:
- `splash.png` - 1024x1024px
- `icon.png` - 512x512px

Update the manifest in your backend `.env`:

```env
FARCASTER_MINIAPP_URL=https://your-app.vercel.app
```

---

## Quick Reference

### Local Development URLs
- Backend: `http://localhost:3000`
- Telegram WebApp: `http://localhost:5173`
- Farcaster Mini App: `http://localhost:5174`

### Important Files
- **Mini App Code:** `/farcaster-miniapp/src/App.jsx`
- **Mini App Styles:** `/farcaster-miniapp/src/App.css`
- **Mini App Config:** `/farcaster-miniapp/src/config.js`
- **Backend Farcaster Handler:** `/backend/src/handlers/farcasterHandler.js`
- **Environment:** `/.env` and `/farcaster-miniapp/.env`

### NPM Commands
```bash
# Development
npm run dev:backend       # Start backend
npm run dev:farcaster     # Start Farcaster mini app
npm run dev:webapp        # Start Telegram webapp

# Production
npm run build:farcaster   # Build Farcaster mini app
npm install:all           # Install all dependencies
```

---

## Troubleshooting

### Issue: "Wallet not connecting"
**Solution:** Make sure you're testing in a Farcaster client (Warpcast) or use a regular wallet for testing in browser

### Issue: "Wrong network"
**Solution:** Switch to Base Mainnet (Chain ID: 8453) in your wallet

### Issue: "IPFS upload failing"
**Solution:** Check your Pinata API keys in backend `.env`

### Issue: "Manifest not loading"
**Solution:**
1. Check `FARCASTER_MINIAPP_URL` in backend `.env`
2. Visit `https://your-backend.com/.well-known/farcaster.json`
3. Verify it returns valid JSON

### Issue: "Backend errors"
**Solution:** Check backend logs for specific errors. Common issues:
- Missing environment variables
- Database connection issues
- CORS errors (add your frontend URL to CORS whitelist)

---

## Next Steps

1. ✅ **Test locally** - Make sure everything works on localhost
2. ✅ **Deploy frontend** - Get your mini app on Vercel
3. ✅ **Deploy backend** - Get your backend on Railway/Render
4. ✅ **Set up domain verification** - Create Farcaster account association
5. ✅ **Create a cast** - Share your mini app with the world!
6. 🎨 **Customize branding** - Make it yours!
7. 📢 **Promote** - Share on Farcaster and get users minting!

---

## Resources

- [Farcaster Mini Apps Docs](https://miniapps.farcaster.xyz/)
- [Warpcast](https://warpcast.com/)
- [Base Network](https://base.org/)
- [Vercel Deployment](https://vercel.com/docs)
- [Railway Deployment](https://docs.railway.app/)

## Support

If you run into issues:
1. Check the troubleshooting section above
2. Review the logs in your backend/frontend
3. Check the full documentation in `FARCASTER_INTEGRATION.md`
4. Test the Telegram bot to verify backend is working

---

**You're all set! 🚀**

Your users can now mint NFTs on Base from both Telegram and Farcaster!
