const fs = require('fs');
const path = require('path');

function getDimensions(filePath) {
    const buffer = fs.readFileSync(filePath);
    // PNG signature
    if (buffer.toString('hex', 0, 8) !== '89504e470d0a1a0a') return 'Not PNG';

    // IHDR chunk
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    return `${width}x${height}`;
}

const files = [
    'public/sprites/fox_1/idle/fox_1_idle_1.png',
    'public/sprites/fox_1/idle/fox_1_idle_2.png',
    'public/sprites/fox_1/idle/fox_1_idle_3.png',
    'public/sprites/fox_1/idle/fox_1_idle_4.png',
    'public/sprites/fox_1/eat/fox_1_eat_1.png',
    'public/sprites/hats/hat_1.png'
];

files.forEach(f => {
    try {
        console.log(`${f}: ${getDimensions(f)}`);
    } catch (e) {
        console.log(`${f}: Error ${e.message}`);
    }
});
