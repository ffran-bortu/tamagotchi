# Sprite Analysis Report

Based on inspection of actual sprite files in `/public/sprites/`.

---

## Fox Spritesheets

### Dimensions
- **File**: `fox_1_spritesheet.png.png`, `fox_2_spritesheet.png`, `fox_3_spritesheet.png.png`
- **Total Size**: 256px × 128px
- **Frame Size**: **64px × 64px** (NOT 96x96 as estimated)
- **Layout**: 4 columns × 2 rows

### Frame Layout

```
┌─────┬─────┬─────┬─────┐
│  0  │  1  │  2  │  3  │  ← Top Row: IDLE ANIMATION (4 frames)
├─────┼─────┼─────┼─────┤
│  0  │  1  │  2  │  3  │  ← Bottom Row: FEEDING ANIMATION (4 frames)
└─────┴─────┴─────┴─────┘
```

### Frame Counts
- **Idle Frames**: **4** (not 8)
- **Feeding Frames**: **4** (not 12)

### Animation Timing Recommendations
- **Current**: 150ms per frame
- **Total loop**: 
  - Idle: 4 frames × 150ms = 600ms (1.67 FPS) ✓ Good for pixel art
  - Feeding: 4 frames × 150ms = 600ms one-shot

---

## Static Fox Sprites

### Dimensions
- **File**: `fox_1.png`, `fox_2.png`, `fox_3.png`
- **Size**: **64px × 64px**
- **Purpose**: Static reference (not used if spritesheets work)

---

## Hats Grid

### Dimensions
- **File**: `hats_grid.png`
- **Total Size**: 192px × 192px
- **Grid Layout**: 3 columns × 3 rows
- **Individual Hat Size**: **64px × 64px**

### Hat Grid Map

```
┌──────┬──────┬──────┐
│  1   │  2   │  3   │  Row 0: Top hats, Wizard hat, Crown
├──────┼──────┼──────┤
│  4   │  5   │  6   │  Row 1: Bow, Flower, Bunny ears
├──────┼──────┼──────┤
│  7   │  8   │  9   │  Row 2: Santa hat, Party hat, Halo
└──────┴──────┴──────┘

0 = No hat (special case)
```

### Hat Positioning
- **Hat size**: 64px
- **Pet sprite size**: 64px
- **Rendered scale**: 2x (128px pet, 128px hat)
- **Offset calculation**: Hat should sit ~20-30px above pet center
  - **Recommended HAT_OFFSET_Y**: **-30** to **-40**

---

## Code Updates Required

### In `pet-canvas-controller.js`:

```javascript
// CURRENT (WRONG):
this.frameWidth = 96;
this.frameHeight = 96;
this.idleFrameCount = 8;
this.feedingFrameCount = 12;

// CORRECTED:
this.frameWidth = 64;
this.frameHeight = 64;
this.idleFrameCount = 4;
this.feedingFrameCount = 4;
```

### Spritesheet Initialization:

```javascript
// CURRENT (WRONG):
this.spritesheets.fox1 = new SpriteSheet(this.sprites.fox1, 96, 96, 1, 1);

// CORRECTED:
this.spritesheets.fox1 = new SpriteSheet(this.sprites.fox1, 64, 64, 1, 1);
```

### Hat Grid Size:

```javascript
// Hat extraction
const hatSize = this.sprites.hatsGrid.width / 3; // = 192 / 3 = 64px ✓
```

---

## Rendering Scale

### Current Approach
Pet and hats are rendered at **2x scale** (64px → 128px) for visibility.

```javascript
ctx.drawImage(
    spritesheet.image,
    frame.x, frame.y, 64, 64,     // Source
    x, y, 128, 128                 // Destination (2x)
);
```

### Canvas Size
- **Container**: Max 400px square
- **Canvas**: Sized to fit container
- **Sprite scale**: 2x minimum, may scale further to fit

---

## Visual Observations

### Fox Sprites
- **Style**: Cute pixel art fox
- **Colors**:
  - fox_1: Orange/brown
  - fox_2: Blue/cyan
  - fox_3: Pink/magenta
- **Idle animation**: Subtle breathing/bobbing
- **Feeding animation**: Eating motion

### Hats
- Pixel art accessories
- Range from simple (bow) to complex (wizard hat)
- Designed to sit above pet's head

---

## Performance Notes

- **Total sprites**: 7 files, ~50KB total
- **Cached**: By service worker (v3)
- **Load time**: <100ms on local
- **Animation FPS**: ~6.67 FPS (150ms/frame) - appropriate for retro pixel art

---

## Recommendations

1. ✅ **Update frame counts to 4**
2. ✅ **Update frame size to 64px**
3. ✅ **Keep 150ms frame delay** (feels good for pixel art)
4. ⚠️ **Test hat offset** - May need adjustment between -25 to -40
5. ⚠️ **Consider adding frame interpolation** - Currently no easing, just hard cuts (fine for pixel art)

---

**Status**: Ready to apply corrections to `pet-canvas-controller.js`
