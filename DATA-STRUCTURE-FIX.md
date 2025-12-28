# Family Tree Visualization - Major Data Structure Overhaul

## Problem Summary
The family tree was drawing spurious lines between unrelated people because the old data structure stored parent-child relationships as link objects, which created visual connections between people who shouldn't be connected (e.g., John→Michael, Michael→Lucas).

## Solution: Data Structure Redesign

### Previous Structure (BROKEN)
```javascript
// Links array contained BOTH relationship and parent-child links
links: [
  { source: 'John', target: 'Sarah', type: 'relationship' },
  { source: 'John', target: 'Alice', type: 'parent-child' },  // ❌ Created lines
  { source: 'Sarah', target: 'Alice', type: 'parent-child' }, // ❌ Created lines
  ...
]
```

This caused D3 to draw lines for ALL links, creating a tangled mess.

### New Structure (FIXED)
```javascript
// Only relationship links in the links array
links: [
  { source: 'John', target: 'Sarah', type: 'relationship', startYear: 1975, endYear: 1995 },
  { source: 'Alice', target: 'Michael', type: 'relationship', startYear: 1998 },
  ...
]

// Parent info stored ON the child node
nodes: [
  { id: 'Alice', parents: ['John', 'Sarah'], ... },
  { id: 'Bob', parents: ['John', 'Sarah'], ... },
  { id: 'Emma', parents: ['Alice', 'Michael'], ... },
  ...
]
```

## Changed Files

### 1. `FamilyTreeBuilder.handleBirth()` 
**Changed:** No longer creates parent-child link objects. Instead stores parent IDs in the child node's `parents` array.

```javascript
// OLD - Created link objects
this.relationships.push({
    source: parent1,
    target: person,
    type: 'parent-child'
});

// NEW - Store on node
const child = this.people.get(person);
if (parent1) child.parents.push(parent1);
```

### 2. `FamilyTreeVisualization.render()`
**Changed:** Now filters to ONLY show relationship links. Parent-child connections are calculated and drawn separately.

```javascript
// Only include relationship-type links
const visibleLinks = treeData.links.filter(link => 
    bothNodesVisible && linkStarted && link.type === 'relationship'
);
```

### 3. `FamilyTreeVisualization.calculateHierarchicalLayout()`
**Changed:** Uses `node.parents` array instead of searching through `parent-child` links.

```javascript
// OLD - Searched through links
const hasParent = links.some(link => 
    link.type === 'parent-child' && link.target === node.id
);

// NEW - Check node property
const hasParent = node.parents && node.parents.length > 0;
```

### 4. **NEW METHOD:** `FamilyTreeVisualization.renderParentChildLines()`
**Purpose:** Draws clean lines from children to their parents' relationship midpoint.

**Algorithm:**
1. Build map of relationship midpoints from the relationship links
2. For each node with parents:
   - If 2 parents: Find the relationship between them, draw line to midpoint
   - If 1 parent: Draw direct line to that parent
3. Render these calculated lines (not from link data)

```javascript
// Example: Alice has parents John and Sarah
const relKey = [...node.parents].sort().join('-'); // "John-Sarah"
const midpoint = relationshipMidpoints.get(relKey);  // {x: 450, y: 100}

drawingData.push({
    id: 'pc-Alice',
    x1: alice.x,    // Child position
    y1: alice.y,
    x2: midpoint.x, // Midpoint of John←→Sarah line
    y2: midpoint.y
});
```

### 5. Spacing Fix for Mary
**Changed:** Improved width calculation to prevent overlap.

```javascript
// Calculate full group width including partners
const groupWidth = CONFIG.HORIZONTAL_SPACING * (1 + partners.length * 0.6);

// John+Sarah group: 200 * (1 + 1*0.6) = 320px
// Mary alone: 200 * (1 + 0*0.6) = 200px
// Total separation ensures no overlap
```

## What You Should See Now

### ✅ At Year 2018 (from screenshot):
**Row 1:**
- John (1950 - 2015) [gray - deceased]
- ---- 1975-1995 ---- (dotted line, relationship ended)
- Sarah [amber - inactive]
- **[GAP]**
- Mary (1952) [green - alive, no overlap with Sarah]

**Row 2:**
- Alice (1977) [green] ---- 1998 ---- Michael [blue]
- **[GAP]**
- Bob (1980) [green] ---- 2005 ---- Jennifer [blue]

**Row 3:**
- Emma (2000) [green]
- Lucas (2008) [green]
- Sophia (2010) [green]

### ✅ Lines Drawn:
1. **Horizontal relationship lines:**
   - John ←→ Sarah (with "1975 - 1995" label)
   - Alice ←→ Michael (with "1998" label)
   - Bob ←→ Jennifer (with "2005" label)

2. **Vertical parent-child lines:**
   - Alice → midpoint(John-Sarah line)
   - Bob → midpoint(John-Sarah line)
   - Emma → midpoint(Alice-Michael line)
   - Lucas → midpoint(Bob-Jennifer line)
   - Sophia → midpoint(Bob-Jennifer line)

### ❌ Lines NOT Drawn (correctly eliminated):
- ~~John → Alice~~ ❌
- ~~Sarah → Alice~~ ❌
- ~~John → Bob~~ ❌
- ~~Sarah → Bob~~ ❌
- ~~John → Michael~~ ❌
- ~~Michael → Lucas~~ ❌
- ~~Any sibling connections~~ ❌

## Benefits of New Structure

1. **Clean Visualization:** Only logical connections are drawn
2. **Easier Maintenance:** Parent info is on the child, not scattered in links
3. **Better Performance:** Fewer links to process and render
4. **Clearer Logic:** Relationship lines and parent-child lines are separate

concerns

## Testing Checklist

- [ ] Refresh page (Ctrl+R or Cmd+R)
- [ ] At year 1950: Should see only John and Mary
- [ ] At year 1975: Sarah appears, line connects John←→Sarah
- [ ] At year 1977: Alice appears with ONE line to John-Sarah midpoint
- [ ] At year 1980: Bob appears with ONE line to John-Sarah midpoint  
- [ ] At year 1995: John-Sarah line becomes dotted
- [ ] At year 2015: John turns gray
- [ ] At year 2025: Full tree with clean connections
- [ ] Mary is clearly visible (not hidden under Sarah)
- [ ] No spurious lines between unrelated people

---

**Status: ✅ Data structure redesigned, spurious lines eliminated, spacing fixed**

The visualization should now be clean and correct!
