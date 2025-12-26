# PWA Builder - Step by Step Guide

## Prerequisites

1. Your app must be accessible via a URL (can't use localhost)
2. You need either:
   - A deployed version (Vercel, Netlify, etc.), OR
   - A way to access your local server from the internet (ngrok)

## Step 1: Make Your App Accessible

### Option A: Deploy to Vercel (Easiest - 2 minutes)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel
   ```
   - Press Enter to accept defaults
   - It will give you a URL like `https://your-app.vercel.app`

3. **Copy that URL** - you'll need it for PWA Builder

### Option B: Use ngrok (For Local Testing)

1. **Download ngrok:** https://ngrok.com/download
   - Extract the .exe file

2. **Start your local server:**
   ```bash
   node server.js
   ```

3. **In a new terminal, start ngrok:**
   ```bash
   ngrok http 3000
   ```

4. **Copy the HTTPS URL** ngrok gives you (e.g., `https://abc123.ngrok.io`)

## Step 2: Use PWA Builder

1. **Go to PWA Builder:**
   - Open https://www.pwabuilder.com/ in your browser

2. **Enter Your App URL:**
   - Paste your app URL (from Vercel or ngrok)
   - Click "Start" or press Enter

3. **Wait for Analysis:**
   - PWA Builder will analyze your app
   - It checks for manifest, service worker, etc.
   - This takes 10-30 seconds

4. **Review Results:**
   - You'll see a score and any issues
   - Most issues are warnings and won't block APK creation

## Step 3: Build Android APK

1. **Click "Build My PWA" button** (usually at the top)

2. **Select "Android"** from the options

3. **Fill in App Details:**
   - **Package Name:** (auto-filled, like `com.yourname.pixelpet`)
   - **App Name:** "Pixel Pet Journal" or "The Empty Sanctuary"
   - **Version:** 1.0.0
   - **App Icon:** Upload your icon (use `public/icons/icon-512x512.png`)
   - **Splash Screen:** (optional, can use same icon)

4. **Click "Generate Package"**

5. **Wait for Build:**
   - This takes 1-3 minutes
   - You'll see a progress indicator

6. **Download APK:**
   - When complete, click "Download" button
   - The APK file will download to your computer

## Step 4: Install APK on Your Phone

### For Android:

1. **Transfer APK to Phone:**
   - Email it to yourself
   - Use USB cable
   - Use cloud storage (Google Drive, Dropbox)
   - Or use ADB: `adb install app.apk`

2. **Enable Unknown Sources:**
   - Go to Settings → Security
   - Enable "Install from Unknown Sources" or "Allow from this source"
   - (Android 8+: You'll be prompted when installing)

3. **Install:**
   - Open the APK file on your phone
   - Tap "Install"
   - Wait for installation
   - Tap "Open" when done

### For iOS:

**Note:** PWA Builder doesn't create iOS apps directly. For iOS:
- Use the PWA installation method (Safari → Add to Home Screen)
- Or use Xcode to create a WebView wrapper

## Step 5: Test Your App

1. **Open the installed app**
2. **Test offline:** Turn off WiFi/data and verify it still works
3. **Test features:** Create journal entries, check pet animations, etc.

## Troubleshooting

### "App not accessible" Error

**Problem:** PWA Builder can't reach your app

**Solutions:**
- Make sure your server is running (if using ngrok)
- Check the URL is correct
- Try deploying to Vercel instead

### "Manifest not found" Warning

**Problem:** PWA Builder can't find manifest.json

**Solution:**
- Check that `public/manifest.json` exists
- Verify the path in `index.html` is correct: `<link rel="manifest" href="public/manifest.json">`
- Make sure the URL is accessible

### "Service Worker not found" Warning

**Problem:** Service worker not detected

**Solution:**
- Check `sw.js` exists in root
- Verify registration in `js/app.js`
- Make sure it's accessible via HTTPS

### APK Won't Install

**Problem:** "App not installed" or "Parse error"

**Solutions:**
1. **Enable Unknown Sources** in phone settings
2. **Check Android version** - APK might need newer Android
3. **Try different phone** - some devices have restrictions
4. **Re-download APK** - file might be corrupted

### App Works But Needs Internet

**Problem:** App requires connection after installation

**Solution:**
- Service worker might not be caching properly
- Check browser console for errors
- Re-install the app
- Clear cache and reinstall

## Quick Reference

```
1. Deploy app → Get URL
2. Go to pwabuilder.com → Enter URL
3. Click "Build My PWA" → Select Android
4. Fill details → Generate Package
5. Download APK → Transfer to phone
6. Install APK → Done!
```

## Alternative: Direct PWA Installation (No APK Needed)

If you just want the app on your phone without creating an APK:

1. **Access your app URL on phone** (via Vercel or ngrok)
2. **Open in Chrome/Safari**
3. **Tap menu → "Add to Home Screen"**
4. **Done!** Works the same as APK, just installed differently

The PWA method is actually simpler and works on both Android and iOS!

