# Implementation Plan: Zen Block Puzzle Enhancement

## Overview
Transform the zen-block-puzzle game to support multiple aspect ratios (1:1, 4:3, 16:9, 9:16), all 7 standard Tetris pieces, progress tracking, and game mode selection. **Refactor first**, then add features.

## User Requirements
- ✓ Support different image sizes/aspect ratios (portrait/landscape)
- ✓ Use all 7 standard Tetris pieces (currently only 4: I, O, L, J - missing T, S, Z)
- ✓ Maintain ~16-25 pieces regardless of grid size
- ✓ Add progress bar showing batch/phase progress
- ✓ Add game modes selection screen (other modes as "coming soon")
- ✓ **Refactor Game.tsx (774 lines) before adding features**

---

## PHASE 1: REFACTORING FOUNDATION (CRITICAL - DO FIRST)

**Goal**: Break down 774-line `Game.tsx` into maintainable modules.

### 1.1 Create Utility Modules

**File: `utils/pieceMath.ts`** (NEW)
- Extract pure math functions from Game.tsx lines 10-44
- Functions: `areNeighbors()`, `getExpectedPosition()`, `calculatePieceBounds()`, `worldToScreen()`, `screenToWorld()`
- Add `blockSizeX`/`blockSizeY` parameters (preparing for non-square blocks)

**File: `utils/batchManager.ts`** (NEW)
- Extract batch spawning logic from Game.tsx lines 157-262
- Functions: `calculateOccupiedRects()`, `findSpawnPosition()`, `generateBatchPieces()`, `checkBatchCompletion()`
- Configurable spawn parameters (batch size, margin, spiral radius)

### 1.2 Create Custom Hooks

**File: `hooks/useGamePieces.ts`** (NEW)
- Manage pieces state, batch index, progression
- Extract lines 66-70, 265-297 from Game.tsx
- Return: `pieces`, `setPieces`, `batchIndex`, `progress`, `isGameComplete`
- Expose `BatchProgress` interface:
  ```typescript
  {
    currentBatch: number;
    totalBatches: number;
    piecesPlaced: number;
    totalPieces: number;
    percentComplete: number;
    currentBatchSize: number;
  }
  ```

**File: `hooks/useViewportTransform.ts`** (NEW)
- Manage pan/zoom/animation state
- Extract lines 55-60, 100-154, 522-641 from Game.tsx
- Handle wheel, touch, and pan events
- Return: `pan`, `zoom`, `isPanning`, `isAnimating`, `fitToView()`, event handlers

**File: `hooks/usePieceInteraction.ts`** (NEW)
- Handle drag/drop/snap/group merging
- Extract lines 74-80, 302-508 from Game.tsx
- Manage mismatch line detection
- Return: `mismatchLine`, `handlePointerDown()`

**File: `hooks/useGameMenu.ts`** (NEW)
- Simple menu state management
- Return: `isMenuOpen`, `openMenu()`, `closeMenu()`, `toggleMenu()`

### 1.3 Create UI Components

**File: `components/GameHUD.tsx`** (NEW)
- Extract lines 702-707 from Game.tsx
- Display piece count and progress bar (Phase 4)
- Props: `progress: BatchProgress`, `showProgressBar?: boolean`

**File: `components/GameMenu.tsx`** (NEW)
- Extract lines 730-771 from Game.tsx
- Menu overlay with game controls
- Props: `isOpen`, `onClose`, `onResetView`, `onNewGame`, `onHome`

### 1.4 Refactor Game.tsx

**File: `components/Game.tsx`** (MODIFY)
- Reduce from 774 lines → ~150 lines
- Compose all custom hooks and components
- Remove all extracted logic
- Keep only: hook calls, event wiring, render structure

### 1.5 Testing Checklist
- [x] Game starts correctly
- [x] Pieces spawn in batches of 5
- [x] Dragging works (single piece + grouped pieces)
- [x] Snapping to correct neighbors works
- [x] Red line shows for wrong neighbors
- [x] Pan/zoom with mouse and touch works
- [x] Menu opens/closes correctly
- [x] Game completion works

---

## PHASE 2: MULTI-ASPECT RATIO SUPPORT

**Goal**: Enable 1:1, 4:3, 16:9, 9:16 aspect ratios.

### 2.1 Define Grid Configurations

**File: `types.ts`** (MODIFY)
- Add: `type AspectRatio = '1:1' | '4:3' | '16:9' | '9:16'`
- Add: `ImageDimensions`, `GridConfig` interfaces

**File: `config/gridConfigs.ts`** (NEW)
- Define `GRID_CONFIGS` for each aspect ratio:
  ```typescript
  '1:1': { width: 800, height: 800, cols: 8, rows: 8, pieces: 16 }
  '4:3': { width: 800, height: 600, cols: 8, rows: 6, pieces: 16 }
  '16:9': { width: 1600, height: 900, cols: 16, rows: 9, pieces: 20 }
  '9:16': { width: 900, height: 1600, cols: 9, rows: 16, pieces: 20 }
  ```
- Block size remains ~100px for all ratios
- Export: `getGridConfig(aspectRatio)`

### 2.2 Update Constants

**File: `constants.ts`** (MODIFY)
- Replace `IMAGE_SIZE` with width/height from grid config
- Add: `BLOCK_SIZE_X`, `BLOCK_SIZE_Y` (separate for non-square blocks)
- Update: `getImageUrl(aspectRatio)` to request correct dimensions from Picsum

### 2.3 Update Components for Non-Square Blocks

**File: `components/PuzzlePiece.tsx`** (MODIFY)
- Add props: `blockSizeX: number`, `blockSizeY: number`
- Update all calculations to use separate X/Y block sizes
- Change background positioning to support non-square images

**File: `components/EndScreen.tsx`** (MODIFY)
- Add prop: `aspectRatio?: AspectRatio`
- Update aspect ratio CSS to match selected ratio

**File: `components/Game.tsx`** (MODIFY)
- Add prop: `aspectRatio?: AspectRatio`
- Get grid config: `const gridConfig = getGridConfig(aspectRatio)`
- Pass `blockSizeX`, `blockSizeY` to PuzzlePiece components

### 2.4 Update Utilities

**File: `utils/pieceMath.ts`** (MODIFY)
- Add `blockSizeX`, `blockSizeY` parameters to all functions
- Update distance calculations for non-square blocks

**Apply similar updates to:**
- `utils/batchManager.ts`
- `hooks/useViewportTransform.ts`
- `hooks/usePieceInteraction.ts`
- `hooks/useGamePieces.ts`

### 2.5 Testing Checklist
- [ ] 1:1 (800x800) loads correctly
- [ ] 4:3 (800x600) loads correctly
- [ ] 16:9 (1600x900) loads correctly
- [ ] 9:16 (900x1600) loads correctly
- [ ] Images display without distortion
- [ ] Pieces snap correctly for all ratios

---

## PHASE 3: ENHANCED PIECE GENERATION

**Goal**: Add T, S, Z pieces and algorithmic piece generation.

### 3.1 Define All Tetromino Shapes

**File: `config/tetrominoShapes.ts`** (NEW)
- Define all 7 standard tetrominoes: I, O, T, S, Z, L, J
- Each shape includes: type, blocks (relative coords), width, height, rotations
- Functions: `rotateTetromino()`, `getAllOrientations()`

### 3.2 Create Piece Generator

**File: `utils/pieceGenerator.ts`** (NEW)
- Implement algorithmic tiling: `generatePieceTiling(config: GridConfig)`
- Algorithm:
  1. Greedy placement (scan grid left-to-right, top-to-bottom)
  2. Try all 7 shapes in all rotations at each position
  3. Backtrack with different shape orders if stuck
  4. Use seeded randomness for variety
- Functions:
  - `attemptTiling()` - main tiling logic
  - `findBestPlacement()` - shape fitting
  - `canPlaceShape()` - collision detection
  - `generateFallbackTiling()` - simple horizontal bars if algorithm fails
  - `validateTiling()` - verify no gaps/overlaps

### 3.3 Update Constants

**File: `constants.ts`** (MODIFY)
- Replace hardcoded `PIECE_DEFINITIONS` with:
  ```typescript
  export const PIECE_DEFINITIONS = generatePieceTiling(defaultConfig);
  export function getPieceDefinitions(aspectRatio: AspectRatio): PieceDef[]
  ```

### 3.4 Update Game Component

**File: `components/Game.tsx`** (MODIFY)
- Generate pieces dynamically:
  ```typescript
  const pieceDefinitions = useMemo(
    () => getPieceDefinitions(aspectRatio),
    [aspectRatio]
  );
  ```
- Pass to `useGamePieces` hook

### 3.5 Testing Checklist
- [ ] All 7 tetromino types appear in game
- [ ] Pieces tile grid perfectly (no gaps)
- [ ] Generated tilings pass validation
- [ ] T, S, Z shapes snap correctly
- [ ] Different sessions have variety
- [ ] Piece generation completes in <100ms

---

## PHASE 4: PROGRESS TRACKING

**Goal**: Add visual progress bar.

### 4.1 Update GameHUD Component

**File: `components/GameHUD.tsx`** (MODIFY)
- Add progress bar UI:
  - Phase indicator: "Phase 2 of 4"
  - Subtle progress bar with muted colors
  - Percentage display
  - Smooth transitions (500ms ease-out)
  - Positioned at top of screen (not bottom)
- Enable by default: `showProgressBar={true}`
- Keep piece count at bottom

### 4.2 Testing Checklist
- [x] Progress bar updates as pieces placed
- [x] Phase number increments correctly
- [x] Percentage calculation is accurate
- [x] Progress bar fills at game end
- [x] Progress bar is subtle and unobtrusive
- [x] Progress bar positioned at top of screen

---

## PHASE 5: GAME MODES SELECTION SCREEN

**Goal**: Add mode selection between start and game screens.

### 5.1 Define Game Modes

**File: `config/gameModes.ts`** (NEW)
- Define 8 modes (4 available, 4 coming soon):
  - **Classic** (1:1) - Available
  - **Landscape** (16:9) - Available
  - **Portrait** (9:16) - Available
  - **Widescreen** (4:3) - Available
  - Timed Mode - Coming Soon
  - Zen Plus - Coming Soon
  - Daily Challenge - Coming Soon
  - Multiplayer - Coming Soon
- Interface: `GameMode` with id, name, description, aspectRatio, icon, isAvailable
- Functions: `getGameMode()`, `getAvailableModes()`

### 5.2 Create Mode Selection Screen

**File: `components/GameModesScreen.tsx`** (NEW)
- Props: `onSelectMode(mode)`, `onBack()`
- Grid layout (responsive: 1-3 columns)
- Mode cards with:
  - Icon (emoji)
  - Name and description
  - "Coming Soon" badge for unavailable modes
  - Aspect ratio tag for available modes
  - Hover effects
- Back button to return to start screen

### 5.3 Update App Routing

**File: `App.tsx`** (MODIFY)
- Change: `type ScreenState = 'start' | 'modes' | 'game' | 'end'`
- Add state: `selectedMode: GameMode | null`
- Update flow:
  - Start → click → Modes
  - Modes → select mode → Game
  - Game → complete → End
  - End → restart → Modes (not Start)
- Pass `aspectRatio` prop to Game and EndScreen

### 5.4 Optional: Update StartScreen

**File: `components/StartScreen.tsx`** (MODIFY)
- Change button text: "Begin" → "Choose Mode"

### 5.5 Testing Checklist
- [ ] Start navigates to modes screen
- [ ] All 8 modes displayed
- [ ] Only available modes clickable
- [ ] Coming soon badges visible
- [ ] Back button returns to start
- [ ] Mode selection starts game with correct aspect ratio
- [ ] Restart returns to modes (not start)
- [ ] Grid layout responsive on mobile/tablet/desktop

---

## CRITICAL FILES

### Phase 1 (Refactoring)
- `components/Game.tsx` - MODIFY (774 → 150 lines)
- `hooks/useGamePieces.ts` - NEW
- `hooks/useViewportTransform.ts` - NEW
- `hooks/usePieceInteraction.ts` - NEW
- `hooks/useGameMenu.ts` - NEW
- `utils/pieceMath.ts` - NEW
- `utils/batchManager.ts` - NEW
- `components/GameHUD.tsx` - NEW
- `components/GameMenu.tsx` - NEW

### Phase 2 (Aspect Ratios)
- `types.ts` - MODIFY
- `config/gridConfigs.ts` - NEW
- `constants.ts` - MODIFY
- `components/PuzzlePiece.tsx` - MODIFY
- `components/EndScreen.tsx` - MODIFY
- All files from Phase 1 - MODIFY (add blockSizeX/Y params)

### Phase 3 (Piece Generation)
- `config/tetrominoShapes.ts` - NEW
- `utils/pieceGenerator.ts` - NEW
- `constants.ts` - MODIFY
- `components/Game.tsx` - MODIFY

### Phase 4 (Progress)
- `components/GameHUD.tsx` - MODIFY
- `components/BatchCompleteNotification.tsx` - NEW
- `hooks/useGamePieces.ts` - MODIFY
- `components/Game.tsx` - MODIFY

### Phase 5 (Game Modes)
- `config/gameModes.ts` - NEW
- `components/GameModesScreen.tsx` - NEW
- `App.tsx` - MODIFY
- `components/StartScreen.tsx` - MODIFY (optional)

---

## IMPLEMENTATION ORDER

**Must follow this sequence:**
1. **Phase 1** (Refactoring) - REQUIRED FIRST - foundation for all other phases
2. **Phase 2** (Aspect Ratios) + **Phase 3** (Piece Generation) - Can be parallel
3. **Phase 4** (Progress) - Depends on Phase 1's useGamePieces hook
4. **Phase 5** (Game Modes) - Last, integrates everything

---

## MIGRATION STRATEGY

For each phase:
1. Create new files alongside existing code
2. Modify files incrementally (don't delete until tested)
3. Test thoroughly before moving to next phase
4. Keep backup of working state at each phase

**Feature flags for gradual rollout:**
```typescript
const USE_REFACTORED_GAME = true; // Phase 1
const USE_DYNAMIC_ASPECT_RATIOS = true; // Phase 2
const USE_GENERATED_PIECES = true; // Phase 3
const SHOW_PROGRESS_BAR = true; // Phase 4
const ENABLE_MODE_SELECTION = true; // Phase 5
```

---

## KEY ARCHITECTURAL DECISIONS

1. **Refactor First**: Clean up Game.tsx before adding features (prevents further bloat)
2. **Fixed Piece Count**: Maintain ~16-25 pieces regardless of grid size (consistent difficulty)
3. **Algorithmic Tiling**: Generate pieces instead of hardcoding (supports any grid size/ratio)
4. **Separate Block Sizes**: Use blockSizeX/blockSizeY for non-square images (flexibility)
5. **Progressive Disclosure**: Show mode selection before game (better UX for multiple modes)

---

## PERFORMANCE CONSIDERATIONS

- **Piece Generation**: Cache generated tilings per aspect ratio
- **Viewport Transform**: Use CSS transforms (GPU-accelerated)
- **Drag Performance**: Events already throttled via React event system
- **Component Rendering**: Use useMemo for expensive calculations
- **Touch Handling**: Passive event listeners where possible

---

## TESTING APPROACH

Each phase includes:
- **Unit Tests**: Utilities and hooks (pure functions)
- **Integration Tests**: Component interactions
- **Visual Testing**: Manual verification of UI
- **Performance Testing**: Generation time, frame rate

Final acceptance test:
- [ ] All 4 aspect ratios playable
- [ ] All 7 tetromino types appear
- [ ] Progress bar shows accurate completion
- [ ] Mode selection works smoothly
- [ ] No performance regressions
- [ ] Mobile touch controls work
