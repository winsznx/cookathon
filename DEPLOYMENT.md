# Deployment Guide

## Deploying to Vercel

### Prerequisites
- Vercel account
- GitHub repository (push your code first)
- Contract deployed on Base Mainnet

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Add NFT minting webapp with Chaincircle styling"
git push origin main
```

### Step 2: Import to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `webapp`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Step 3: Set Environment Variables

Add these environment variables in Vercel:

```
VITE_REOWN_PROJECT_ID=362002cb5c92ab86837e35b9fb903e46
VITE_CONTRACT_ADDRESS=0x15d56140A49c16EA636C9a7485D8f8E22a592bF0
VITE_BACKEND_URL=http://localhost:3000
```

**Important:** Update `VITE_BACKEND_URL` to your deployed backend URL once you deploy the backend.

### Step 4: Deploy

Click "Deploy" and Vercel will build and deploy your webapp.

### Step 5: Update Backend Configuration

Once deployed, you'll get a Vercel URL like: `https://your-app.vercel.app`

Update your backend `.env` file:

```
WEBAPP_URL=https://your-app.vercel.app
```

Then restart your backend server.

### Step 6: Update Telegram Bot

Your Telegram bot will now open the Vercel-hosted webapp when users click `/mint`.

## Build Information

- **Build Output**: `webapp/dist/`
- **Total Build Size**: ~1.8 MB (gzipped: ~505 KB)
- **Entry Point**: `webapp/dist/index.html`

## Deployed Contract

- **Network**: Base Mainnet
- **Address**: `0x15d56140A49c16EA636C9a7485D8f8E22a592bF0`
- **Explorer**: https://basescan.org/address/0x15d56140A49c16EA636C9a7485D8f8E22a592bF0

## Features

✅ Chaincircle-inspired design
✅ Mobile and desktop responsive
✅ Reown AppKit v1.8.11 integration
✅ Base network support
✅ Telegram WebApp integration
✅ Dark theme with purple gradients
✅ Glass-morphism UI elements

## Troubleshooting

### Build Fails
- Ensure all dependencies are installed
- Check that `.env` files are properly configured
- Verify Node.js version (18+)

### Webapp Not Loading
- Check environment variables in Vercel
- Ensure contract address is correct
- Verify Reown Project ID is valid

### Telegram Bot Not Working
- Ensure WEBAPP_URL in backend .env points to Vercel URL
- Verify bot is running
- Check backend logs for errors

## Support

For issues, check:
- Backend logs
- Vercel deployment logs
- Browser console for frontend errors
