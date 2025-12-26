const fs = require('fs');
const path = require('path');

// Build script to prepare the app for local installation
const BUILD_DIR = path.join(__dirname, 'build');
const PUBLIC_DIR = path.join(__dirname, 'public');

// Clean and create build directory
if (fs.existsSync(BUILD_DIR)) {
    fs.rmSync(BUILD_DIR, { recursive: true, force: true });
}
fs.mkdirSync(BUILD_DIR, { recursive: true });

console.log('📦 Building app for local installation...');

// Copy all necessary files
const filesToCopy = [
    'index.html',
    'styles.css',
    'sw.js',
    'js',
    'public'
];

function copyRecursive(src, dest) {
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        const entries = fs.readdirSync(src);
        for (const entry of entries) {
            copyRecursive(path.join(src, entry), path.join(dest, entry));
        }
    } else {
        fs.copyFileSync(src, dest);
    }
}

filesToCopy.forEach(item => {
    const src = path.join(__dirname, item);
    const dest = path.join(BUILD_DIR, item);
    if (fs.existsSync(src)) {
        console.log(`  ✓ Copying ${item}...`);
        copyRecursive(src, dest);
    }
});

// Update paths in index.html for build
const indexHtml = fs.readFileSync(path.join(BUILD_DIR, 'index.html'), 'utf8');
const updatedIndexHtml = indexHtml
    .replace(/href="public\//g, 'href="./public/')
    .replace(/src="public\//g, 'src="./public/')
    .replace(/href="js\//g, 'href="./js/')
    .replace(/src="js\//g, 'src="./js/')
    .replace(/href="sw\.js/g, 'href="./sw.js')
    .replace(/src="sw\.js/g, 'src="./sw.js')
    .replace(/href="styles\.css/g, 'href="./styles.css')
    .replace(/src="styles\.css/g, 'src="./styles.css');

fs.writeFileSync(path.join(BUILD_DIR, 'index.html'), updatedIndexHtml);

// Update service worker paths
const swJs = fs.readFileSync(path.join(BUILD_DIR, 'sw.js'), 'utf8');
const updatedSwJs = swJs
    .replace(/'\//g, "'./")
    .replace(/"\//g, '"./');

fs.writeFileSync(path.join(BUILD_DIR, 'sw.js'), updatedSwJs);

// Create a simple local server file
const localServer = `const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const BASE_DIR = __dirname;

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.wasm': 'application/wasm'
};

const server = http.createServer((req, res) => {
    let filePath = path.join(BASE_DIR, req.url === '/' ? 'index.html' : req.url);
    const ext = path.extname(filePath);
    const mimeType = MIME_TYPES[ext] || 'text/plain';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404);
                res.end('404 Not Found');
            } else {
                res.writeHead(500);
                res.end(\`Server Error: \${err.code}\`);
            }
        } else {
            res.writeHead(200, { 'Content-Type': mimeType });
            res.end(content);
        }
    });
});

server.listen(PORT, '0.0.0.0', () => {
    const os = require('os');
    const networkInterfaces = os.networkInterfaces();
    let localIP = 'localhost';
    
    for (const interfaceName of Object.keys(networkInterfaces)) {
        for (const iface of networkInterfaces[interfaceName]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                localIP = iface.address;
                break;
            }
        }
        if (localIP !== 'localhost') break;
    }
    
    console.log(\`🚀 App running at http://localhost:\${PORT}/\`);
    console.log(\`📱 Open on phone: http://\${localIP}:\${PORT}/\`);
    console.log('Press Ctrl+C to stop');
});
`;

fs.writeFileSync(path.join(BUILD_DIR, 'server.js'), localServer);

// Create README for installation
const readme = `# Pixel Pet Journal - Local Installation

## Installation Steps

### Method 1: Using Local Server (Recommended)

1. **Transfer the build folder to your phone:**
   - Use USB cable, cloud storage, or email
   - Or keep it on your computer and access via network

2. **Start the server:**
   \`\`\`bash
   node server.js
   \`\`\`

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
`;

fs.writeFileSync(path.join(BUILD_DIR, 'README.md'), readme);

console.log('✅ Build complete!');
console.log(`📁 Build folder: ${BUILD_DIR}`);
console.log('\n📱 Next steps:');
console.log('1. Transfer the "build" folder to your phone');
console.log('2. Or run "node build/server.js" and access from phone on same WiFi');
console.log('3. Install as PWA from browser menu');

