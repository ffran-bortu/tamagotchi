# Local Installation Guide - Pixel Pet Journal

## Quick Start

### Step 1: Build the App
```bash
node build.js
```

This creates a `build` folder with all files ready for installation.

### Step 2: Install on Your Phone

#### Option A: Via Local Network (Easiest)

1. **Start the local server:**
   ```bash
   cd build
   node server.js
   ```

2. **On your phone:**
   - Make sure phone is on same WiFi as computer
   - Open browser (Chrome/Safari)
   - Go to the URL shown (e.g., `http://192.168.1.100:3000`)
   - Tap menu → "Add to Home screen" or "Install app"
   - The app is now installed and works completely offline!

#### Option B: Create APK (Android Only)

1. **Use PWA Builder:**
   - Go to https://www.pwabuilder.com/
   - Enter your app URL (from Option A)
   - Click "Build My PWA"
   - Download Android APK
   - Transfer to phone and install

2. **Or use Android Studio:**
   - Create a new WebView app
   - Point it to your local server URL
   - Build APK

#### Option C: Transfer Files Directly

1. **Transfer build folder to phone:**
   - USB cable
   - Cloud storage (Google Drive, Dropbox)
   - Email (zip the folder)

2. **On phone:**
   - Extract files
   - Open `index.html` in Chrome
   - Try "Add to Home Screen" (may require HTTPS)

## After Installation

✅ **The app works completely offline!**
- All data stored locally on your phone
- No internet connection needed
- No server required after installation
- Works like a native app

## Data Storage

The app uses:
- **IndexedDB** for journal entries and pet state
- **Local Storage** for preferences
- All data stays on your phone - never sent anywhere

## Updating the App

If you make changes:
1. Run `node build.js` again
2. Re-install the PWA (it will update automatically)
3. Or clear app data and reinstall

## Troubleshooting

### PWA Won't Install

**Problem:** Browser says "Can't install" or no install option

**Solutions:**
1. **Use HTTPS:** Some browsers require HTTPS for PWA installation
   - Use ngrok: `ngrok http 3000` (gives you HTTPS URL)
   - Or deploy to Vercel/Netlify temporarily just to install

2. **Check Manifest:** Open browser DevTools → Application → Manifest
   - Should show no errors

3. **Service Worker:** Check Application → Service Workers
   - Should be registered and active

### App Not Working Offline

**Problem:** App needs internet connection

**Solutions:**
1. Check service worker is registered
2. Clear cache and reinstall
3. Check browser console for errors

### Widget Not Showing

**Note:** PWA widgets are experimental
- Android 12+ may support them
- iOS doesn't support PWA widgets yet
- You can bookmark the widget page as a workaround

## File Structure After Build

```
build/
├── index.html          # Main app
├── styles.css          # Styles
├── sw.js              # Service worker
├── server.js          # Local server (optional)
├── js/               # All JavaScript
├── public/           # All assets (sprites, icons, etc.)
└── README.md         # This file
```

## Security Note

Since the app runs locally, there's no security risk. All data stays on your device. The app doesn't connect to any external servers (except for loading fonts, which can be cached).

