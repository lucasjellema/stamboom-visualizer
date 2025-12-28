# Family Tree Visualization - Ghost Line Fix

## Problem
When nodes moved position (e.g., Alice shifting left when Bob appears), the original parent-child connection line persisted, creating a "ghost line" artifact alongside the new correct line.

## Solution: Layered Rendering Architecture

The rendering system has been refactored to use dedicated SVG layers instead of a single flat group. This allows precise control over element lifecycle and z-indexing.

### 1. New Layer Structure
The visualization now initializes three distinct groups (layers) in specific Z-order:
1. `this.linksGroup`: Bottom layer (Horizontal relationship lines)
2. `this.parentChildGroup`: Middle layer (Vertical parent-child connections)
3. `this.nodesGroup`: Top layer (Person circles and text)

### 2. The "Nuclear" Fix for Ghost Lines
To strictly guarantee that old lines are removed:
- The `renderParentChildLines` method now performs a **complete clear** of the `this.parentChildGroup` layer at the start of every render.
- `this.parentChildGroup.selectAll('*').remove()`
- This destroys all existing line elements before drawing the new set based on current positions.
- While this removes the transition animation for these specific lines, it 100% eliminates the visual bug of persistent/stuck lines.

### 3. Benefits
- **Zero Artifacts:** It is impossible for a line to persist if its container is wiped.
- **Better Z-Indexing:** Nodes will always be drawn above lines, preventing ugly overlaps.
- **Performance:** Clean separation of concerns makes the D3 selectors faster (don't need to filter out other elements).

## Verification
1. Load the visualization.
2. Scrub timeline to 1977 (Alice appears).
3. Scrub to 1980 (Bob appears).
4. Alice moves left. The old line pointing to her old position is **gone**. The new line points to her new position.
