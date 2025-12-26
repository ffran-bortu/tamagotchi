# Deployment Guide - Pixel Pet Journal

## Option 1: Local Network Deployment (Quick Testing)

### Step 1: Update Server for Network Access

The server needs to listen on all network interfaces (0.0.0.0) instead of just localhost.

**Update `server.js` line 44:**
```javascript
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Pixel Pet PWA Server running at http://localhost:${PORT}/`);
    console.log(`📱 Access from phone: http://YOUR_COMPUTER_IP:${PORT}/`);
    console.log('Press Ctrl+C to stop the server');
});
```

### Step 2: Find Your Computer's IP Address

**Windows:**
```powershell
ipconfig
```
Look for "IPv4 Address" under your active network adapter (usually WiFi or Ethernet).

**Mac/Linux:**
```bash
ifconfig | grep "inet "
```
or
```bash
ip addr show
```

### Step 3: Start the Server

```bash
node server.js
```

### Step 4: Access from Your Phone

1. Make sure your phone is on the **same WiFi network** as your computer
2. Open your phone's browser (Chrome/Safari)
3. Navigate to: `http://YOUR_COMPUTER_IP:3000`
   - Example: `http://192.168.1.100:3000`

### Step 5: Install as PWA

**Android (Chrome):**
1. Open the site in Chrome
2. Tap the menu (3 dots) → "Add to Home screen" or "Install app"
3. Confirm installation

**iOS (Safari):**
1. Open the site in Safari
2. Tap the Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Confirm

## Option 2: Production Deployment (Recommended)

### Deploy to a Hosting Service

**Free Options:**
- **Vercel**: `vercel deploy`
- **Netlify**: Drag and drop the folder
- **GitHub Pages**: Push to GitHub and enable Pages
- **Firebase Hosting**: `firebase deploy`

**Steps for Vercel (Easiest):**
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow the prompts
4. Your app will be live at `https://your-app.vercel.app`

### After Deployment

1. Access your deployed URL on your phone
2. Install as PWA (same steps as above)
3. The app will work offline once installed

## Widget Setup

### Android Widgets (Android 12+)

**Note:** PWA widgets are currently experimental and have limited support.

1. Install the PWA on your phone
2. Long-press the app icon on your home screen
3. Look for "Widgets" option
4. If available, drag the "Pet Status" widget to your home screen

**Alternative:** Some Android launchers support PWA widgets differently. You may need to:
- Use a widget app that can display web content
- Or wait for better PWA widget support in Android

### iOS Widgets

**Note:** iOS doesn't natively support PWA widgets yet. You would need:
- A native iOS app wrapper
- Or use Shortcuts app to create a widget that opens the PWA

### Current Widget Status

The widget HTML is ready at `public/widget.html`, but full widget functionality requires:
- **Android**: Android 12+ with PWA widget support (still experimental)
- **iOS**: Not natively supported (would need native app)

**Workaround:** You can bookmark the widget page directly or create a home screen shortcut to it.

## Troubleshooting

### Can't Access from Phone

1. **Check Firewall**: Windows Firewall may block the port
   - Windows: Allow Node.js through firewall
   - Or temporarily disable firewall for testing

2. **Check Network**: Ensure phone and computer are on same WiFi

3. **Try Different Port**: Change PORT in server.js if 3000 is blocked

### PWA Won't Install

1. **HTTPS Required**: Some browsers require HTTPS for PWA installation
   - Use a service like ngrok for HTTPS: `ngrok http 3000`
   - Or deploy to a hosting service (they provide HTTPS)

2. **Manifest Issues**: Check browser console for errors

3. **Service Worker**: Ensure `sw.js` is accessible

### Widget Not Showing

- PWA widgets are still experimental
- May not work on all devices/browsers
- Consider using a home screen shortcut to the widget page instead

## Quick Start (Local Network)

```bash
# 1. Update server.js to listen on 0.0.0.0
# 2. Find your IP: ipconfig (Windows) or ifconfig (Mac/Linux)
# 3. Start server
node server.js

# 4. On phone: Open http://YOUR_IP:3000
# 5. Install as PWA from browser menu
```

