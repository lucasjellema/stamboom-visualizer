# 🌳 Ancestors & Echoes

**Interactive Family History Visualization**

A stunning, interactive web application for visualizing family history through time. Built with vanilla HTML, JavaScript, D3.js, and SVG for dynamic, animated family tree visualization.

![Premium Midnight Glass Design](https://img.shields.io/badge/Design-Midnight%20Glass-blue)
![D3.js](https://img.shields.io/badge/D3.js-v7-orange)
![Vanilla JS](https://img.shields.io/badge/JavaScript-Vanilla-yellow)

---

## ✨ Features

### 🎯 Core Functionality

- **Sliding-Window Timeline**: Travel through history using a dual-thumb slider to set a specific time window (`Start Year` to `Current Year`)
- **Event-Based Playback**: Step through births, deaths, and relationships with Previous/Next controls
- **Animated Transitions**: Smooth D3.js-powered animations as people and relationships appear/disappear
- **Interactive SVG Visualization**: Drag nodes, zoom, pan, and explore your family tree
- **Lineage-Aware Layout**: Balanced hierarchical positioning that clusters children directly under their parents
- **Focus Mode**: Double-click any person to isolate their specific family branch (descendants)
- **CSV Data Management**: Upload, edit, and download your family history data

### 🎨 Visual Excellence

- **Premium "Midnight Glass" Design**: Glassmorphism effects with vibrant gradients
- **Smart Connection Lines**: Children connect to the *midpoint* of their parents' relationship (with junction dots)
- **Balanced Hierarchy**: Siblings are grouped and centered relative to their parents' position
- **Cycle Detection**: Robust data handling that prevents crashes even with invalid parent-child loops
- **Vertical Partner Stacking**: Keep the tree compact by stacking partners vertically
- **Layered Rendering**: Advanced SVG layering prevents visual artifacts ("ghost lines") during animations
- **Smart Filtering**: Relationships remain visible if they span into or through the selected time window
- **Color-Coded Nodes**: Instantly identify family members, partners, and their status
- **Gender Icons**: Visual indicators (♂ ♀ ⚧) for each person
- **Relationship Lines**: Solid lines for active relationships, dotted for ended ones

### 📊 Data Capabilities

- **Rich Event Types**:
  - Birth events (with parents)
  - Death events
  - Relationship start/end events
- **Editable Data Table**: View and modify all events in a structured table
- **CSV Import/Export**: Easy data portability
- **Mock Data Included**: Pre-loaded example family for immediate demonstration

---

## 🚀 Getting Started

### Installation

No installation required! This is a static web application.

1. **Download the files**:
   - `family-tree.html`
   - `family-tree.css`
   - `family-tree.js`

2. **Open in browser**:
   ```
   Simply open family-tree.html in any modern web browser
   ```

3. **Or use a local server** (recommended):
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx http-server
   ```

### Requirements

- Modern web browser (Chrome, Firefox, Edge, Safari)
- Internet connection (for D3.js CDN and Google Fonts)

---

## 📝 CSV Data Format

Your family history CSV should follow this exact structure:

```csv
year,type,person,person2,person3,person_gender,person2_gender
1950,birth,John,,,,male
1975,relationship_start,John,Sarah,,male,female
1977,birth,Alice,John,Sarah,female,
2015,death,John,,,,male
1995,relationship_end,John,Sarah,,male,female
```

### Field Descriptions

| Field | Description | Required |
|-------|-------------|----------|
| **year** | 4-digit year (e.g., 1992, 2025) | ✅ Yes |
| **type** | Event type: `birth`, `death`, `relationship_start`, `relationship_end` | ✅ Yes |
| **person** | The family member involved | ✅ Yes |
| **person2** | For birth: family parent. For relationship: partner | Conditional |
| **person3** | For birth only: the other parent | Optional |
| **person_gender** | Gender: `male`, `female`, `non-binary` | Optional |
| **person2_gender** | Gender of person2 (used in relationship_start) | Optional |

### Event Type Rules

#### Birth
- **person**: The child being born
- **person2**: The parent who is a family member
- **person3**: The other parent (may or may not be family)
- **person_gender**: Gender of the child

#### Death
- **person**: The family member who died
- All other fields empty

#### Relationship Start
- **person**: Family member entering relationship
- **person2**: Their partner
- **person_gender**: Gender of family member
- **person2_gender**: Gender of partner

#### Relationship End
- **person**: Family member
- **person2**: Their partner
- Other fields empty

---

## 🎮 How to Use

### Timeline Navigation

1. **Dual-Thumb Slider**: Drag the left thumb to set the `Start Year` and the right thumb to set the `Current Year`. Only events occurring within this window are fully visualized.
2. **Constraint**: The `Start Year` cannot be moved past the `Current Year`.
3. **Previous Event**: Jump the `Current Year` backward to the previous family event
4. **Next Event**: Jump the `Current Year` forward to the next family event
5. **Play/Pause**: Auto-play through history (advances the `Current Year` thumb)

### Visualization Interaction

- **Drag Nodes**: Click and drag any person to rearrange the layout
- **Zoom**: Use the zoom buttons (+ - ⟲) in the bottom right
- **Pan**: Click and drag the background to move the entire view

### Data Management

1. **Switch to Data Tab**: Click "📊 Data Table" in the navigation
2. **Add Event**: Click "+ Add Event" button
3. **Edit Event**: Click "Edit" on any row
4. **Delete Event**: Click "Delete" on any row (with confirmation)

### File Operations

- **Upload CSV**: Click "📂 Upload CSV" and select your file
- **Download CSV**: Click "💾 Download CSV" to export current data

---

## 🎨 Visual Legend

### Node Colors

| Color | Meaning |
|-------|---------|
| 🟢 **Emerald** | Family member - Alive |
| ⚪ **Gray** | Family member - Deceased |
| 🔵 **Blue** | Partner - In active relationship |
| 🟡 **Amber** | Partner - Relationship ended |
| 🔴 **Red** | Partner - Deceased |

### Relationship Lines

| Style | Meaning |
|-------|---------|
| **Solid Line** | Active relationship or parent-child bond |
| **Dotted Line** | Ended relationship |

---

## 🏗️ Architecture

### Component Structure

```
FamilyTreeApp
├── StateManager          # Data and timeline state management
├── FamilyTreeBuilder     # Converts events into graph structure
├── FamilyTreeVisualization  # D3.js rendering and animations
└── UIController          # User interaction and event handling
```

### Key Technologies

- **D3.js v7**: Force-directed graph layout and SVG manipulation
- **Vanilla JavaScript**: ES6+ with classes and modern APIs
- **CSS Custom Properties**: Design system with consistent theming
- **SVG**: Scalable, crisp visualization graphics

### Data Flow

```
CSV Data → StateManager → FamilyTreeBuilder → D3 Visualization
                ↓
           UIController (handles interactions)
                ↓
        Updates year → Re-render tree
```

---

## 🎓 Example Family Story

The included mock data tells this story:

- **1950**: John is born
- **1952**: Mary is born
- **1975**: John and Sarah start a relationship
- **1977**: Alice is born (John + Sarah)
- **1980**: Bob is born (John + Sarah)
- **1995**: John and Sarah separate
- **1998**: Alice and Michael start a relationship
- **2000**: Emma is born (Alice + Michael)
- **2005**: Bob and Jennifer start a relationship
- **2008**: Lucas is born (Bob + Jennifer)
- **2010**: Sophia is born (Bob + Jennifer)
- **2015**: John passes away
- **2020**: Emma and David start a relationship
- **2025**: Oliver is born (Emma + David)

Navigate through this timeline to see the family grow and change!

---

## 🛠️ Customization

### Modify Visualization Settings

Edit `family-tree.js` CONFIG object:

```javascript
const CONFIG = {
    NODE_RADIUS: 25,          // Size of person circles
    NODE_CHARGE: -800,        // Force between nodes
    LINK_DISTANCE: 150,       // Preferred distance between connected nodes
    ANIMATION_DURATION: 500,  // Transition speed (ms)
    PLAYBACK_SPEED: 500,      // Auto-play speed (ms per year)
    // ... colors and icons
};
```

### Change Color Scheme

Edit `family-tree.css` CSS variables:

```css
:root {
    --color-emerald: #10b981;
    --color-sapphire: #3b82f6;
    /* ... edit any color */
}
```

---

## ⚡ Performance Tips

- **Large Datasets**: For families with 100+ people, consider increasing NODE_CHARGE to spread nodes further
- **Slow Animations**: Reduce ANIMATION_DURATION for snappier transitions
- **Memory**: The force simulation uses significant CPU when active. It calms down after a few seconds.

---

## 🐛 Troubleshooting

### Issue: Tree looks cramped

**Solution**: Increase `NODE_CHARGE` (make more negative) or `LINK_DISTANCE` in CONFIG

### Issue: Nodes overlapping

**Solution**: Increase `collision` force radius or `NODE_RADIUS` spacing

### Issue: CSV won't load

**Solution**: Ensure:
- First row has exact headers: `year,type,person,person2,person3,person_gender,person2_gender`
- No empty lines at the end
- Years are 4-digit numbers
- Event types match exactly: `birth`, `death`, `relationship_start`, `relationship_end`

### Issue: Visualization doesn't load

**Solution**: Check browser console (F12) for errors. Ensure D3.js CDN is accessible.

---

### Issue: Max Call Stack Size Exceeded (Recursion Error)

**Solution**: This is usually caused by a **cycle** in your family data (e.g., a person listed as their own parent). Ensure:
- Each person has a unique name identifier.
- Children are not assigned parents who are actually themselves or their own descendants.
- If you have two people with the same name, distinguish them (e.g., "Victoria (I)" and "Victoria (II)").

---

## 📄 License

This project is free to use and modify for personal and commercial purposes.

---

## 🙏 Credits

- **D3.js**: Mike Bostock and contributors
- **Design Inspiration**: Modern glassmorphism trends
- **Icons**: Unicode standard gender symbols

---

## 🚀 Future Enhancements

Potential features for future versions:

- [ ] Export visualization as PNG/SVG
- [ ] Import from GEDCOM format
- [ ] Search and filter by person name
- [ ] Show photos in nodes
- [ ] Multiple family trees (switch between datasets)
- [ ] Statistics dashboard (total births, marriages, etc.)
- [ ] Print-friendly layouts
- [ ] Dark/light mode toggle

---

## 💬 Feedback

Enjoy exploring your family's journey through time! 

*"Every family has a story. Make yours visible."*

🌳 **Ancestors & Echoes** - Built with ❤️ and JavaScript
