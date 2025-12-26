# Fix Feeding Animation, List Navigation, and Hat Placement

## Overview
Fix three issues: eating animation not playing in overlay, list view navigation not working, and systematic hat positioning on pet head.

## 1. Fix Eating Animation Not Showing

**Issue:** The feeding overlay shows but the eating animation doesn't play.

**Root Cause:** The `PetCanvasController` for the feeding overlay is initialized but `startAnimationLoop()` is not being called, so the animation loop never runs.

**File:** [`js/app.js`](js/app.js) - Lines 256-261

**Fix:**
```javascript
// Current code:
const feedingPetCanvas = new PetCanvasController(this.db, null, 'feeding');
feedingPetCanvas.initialize();
feedingPetCanvas.playFeedingAnimation();

// Add after playFeedingAnimation():
feedingPetCanvas.startAnimationLoop();
```

Also need to ensure the controller is properly cleaned up when hiding the overlay (already has `stopAnimations()` call at line 266).

## 2. Fix List View Navigation

**Issue:** Clicking entries in list view doesn't navigate to journal entry view.

**Root Cause:** After filtering by date or rendering list, the `innerHTML +=` at line 323 destroys all the card elements and their event listeners that were just added.

**File:** [`js/ui/archive-controller.js`](js/ui/archive-controller.js) - Line 323

**Fix:** Replace `innerHTML +=` with DOM manipulation:
```javascript
// Current (BREAKS event listeners):
listContainer.innerHTML += '<p class="text-center text-retro-gray font-pixel text-xs mt-8 opacity-50">END OF RECORDS</p>';

// Fixed:
const endMessage = document.createElement('p');
endMessage.className = 'text-center text-retro-gray font-pixel text-xs mt-8 opacity-50';
endMessage.textContent = 'END OF RECORDS';
listContainer.appendChild(endMessage);
```

## 3. Systematic Hat Positioning

**Issue:** Hats are using a fixed Y position (18% from top) which doesn't account for different hat sizes or the actual pet head location.

**Current Implementation:** [`js/ui/pet-canvas-controller.js`](js/ui/pet-canvas-controller.js) - Lines 348-367

**Systematic Solution:**

### Calculate actual pet head position:
1. Pet sprite is drawn at a calculated position and scale
2. Hat should be positioned relative to the pet's actual rendered position, not the canvas

### Implementation approach:
```javascript
drawHat() {
    // ... existing setup ...
    
    // Get pet rendering info
    const petCanvas = this.canvases.pet;
    const petCtx = this.contexts.pet;
    
    // Calculate pet scale and position (same logic as drawPetFrame)
    const scalePercent = this.canvasPrefix === 'feeding' ? 0.80 : 0.60;
    const targetSize = Math.min(petCanvas.width, petCanvas.height) * scalePercent;
    
    // Get current pet frame to know its dimensions
    const frames = this.animationState === 'feeding' 
        ? this.sprites.foxes[this.currentPetColor].eat
        : this.sprites.foxes[this.currentPetColor].idle;
    const currentPetImg = frames[this.currentFrame] || frames[0];
    
    if (!currentPetImg) return;
    
    const petScale = targetSize / Math.max(currentPetImg.width, currentPetImg.height);
    const petDrawH = currentPetImg.height * petScale;
    const petY = (petCanvas.height - petDrawH) / 2;
    
    // Hat positioning: place on top of pet head
    // Pet head is approximately at 20-30% down from top of pet sprite
    const headOffsetPercent = 0.25; // 25% down from top of pet sprite
    const hatY = petY + (petDrawH * headOffsetPercent) - (drawH * 0.8); // Slight overlap
    
    const hatX = (canvas.width - drawW) / 2;
    
    ctx.drawImage(hatImg, hatX, hatY, drawW, drawH);
}
```

This approach:
- Calculates the actual rendered position of the pet sprite
- Positions hat relative to the pet's rendered position
- Uses a percentage offset to find the "head" area (25% down from top of sprite)
- Works across different canvas sizes and pet scales
- No per-hat adjustments needed

## Summary of Changes

1. **[`js/app.js`](js/app.js)** - Add `startAnimationLoop()` call after `playFeedingAnimation()`
2. **[`js/ui/archive-controller.js`](js/ui/archive-controller.js)** - Replace `innerHTML +=` with `appendChild()` 
3. **[`js/ui/pet-canvas-controller.js`](js/ui/pet-canvas-controller.js)** - Implement systematic hat positioning based on pet sprite bounds

