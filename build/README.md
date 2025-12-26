# Pixel Pet Journal - Local Installation

## Installation Steps

### Method 1: Using Local Server (Recommended)

1. **Transfer the build folder to your phone:**
   - Use USB cable, cloud storage, or email
   - Or keep it on your computer and access via network

2. **Start the server:**
   ```bash
   node server.js
   ```

3. **On your phone:**
   - Connect to same WiFi as computer
   - Open browser and go to the URL shown (e.g., http://192.168.1.100:3000)
   - Install as PWA from browser menu

### Method 2: Using Android (APK)

1. **Install PWA Builder:**
   - Go to https://www.pwabuilder.com/
   - Enter your app URL
   - Download Android APK
   - Install on your phone

### Method 3: Direct File Access (Limited)

Some browsers allow installing PWAs from file:// URLs:
- Transfer build folder to phone
- Open index.html in Chrome
- Try "Add to Home Screen"

## After Installation

Once installed, the app works completely offline! All data is stored locally on your phone using IndexedDB.

## Troubleshooting

- If PWA won't install, try using HTTPS (use ngrok or deploy to a service)
- Make sure service worker is working (check browser console)
- Clear browser cache if you see old versions
