# 🚀 Quick Start Guide

## Get Started in 3 Steps

### Step 1: Open the Application
Simply **double-click** `family-tree.html` or open it in your web browser.

### Step 2: Explore the Demo
The app loads with a 3-generation family story. Try these:
- 🎚️ Drag the **timeline slider** left and right
- ⏭️ Click **Next Event** to step through time
- ▶️ Press **Play** to watch the family grow automatically
- 🔍 Use **zoom buttons** (bottom right) to inspect closely
- 🖱️ **Drag any person** to rearrange the tree

### Step 3: Add Your Family
1. Click **📊 Data Table** tab
2. Click **➕ Add Event** 
3. Fill in the form and click **Save Event**
4. Switch back to **🌲 Family Tree** to see your changes

---

## 📁 Upload Your Own Data

### Option 1: Start from Sample
1. Open `sample-family-data.csv` in Excel or Notepad
2. Edit the data with your family information
3. Save as CSV
4. Click **📂 Upload CSV** in the app
5. Select your edited file

### Option 2: Create from Scratch
Create a CSV file with these exact columns:
```
year,type,person,person2,person3,person_gender,person2_gender
```

Then add rows following these patterns:

**Birth:**
```csv
1985,birth,Alice,John,Sarah,female,
```
(Alice born in 1985, parents John and Sarah)

**Relationship Start:**
```csv
2010,relationship_start,Alice,Michael,,female,male
```
(Alice and Michael couple up in 2010)

**Relationship End:**
```csv
2015,relationship_end,Alice,Michael,,
```
(They separate in 2015)

**Death:**
```csv
2020,death,John,,,,
```
(John passes away in 2020)

---

## 🎨 Understanding the Colors

| Color | Meaning | Example |
|-------|---------|---------|
| 🟢 **Green** | Family member, alive | Your direct ancestors |
| ⚪ **Gray** | Family member, deceased | Grandparents who passed |
| 🔵 **Blue** | Partner, in relationship | Current spouse |
| 🟡 **Orange** | Partner, separated | Ex-spouse |
| 🔴 **Red** | Partner, deceased | Late spouse |

---

## 🎮 Keyboard Tips

- **Click + Drag** on a person = Move them around
- **Click + Drag** on background = Pan the view
- **Scroll Wheel** = Zoom in/out (if supported)

---

## ⚠️ Common Issues

### "My CSV won't load!"
✅ **Check:**
- First line must be: `year,type,person,person2,person3,person_gender,person2_gender`
- No extra spaces around commas
- Years must be 4 digits (e.g., 1990, not 90)
- Types must be exactly: `birth`, `death`, `relationship_start`, or `relationship_end`

### "The tree looks cramped"
✅ **Solution:** Use the **zoom out button** (−) in the bottom right corner

### "I can't see all the people"
✅ **Solution:** 
- Zoom out to see the full tree
- Pan by dragging the background
- Advanced nodes might be overlapping - drag them apart!

---

## 💡 Pro Tips

1. **Start Simple**: Add people chronologically for best results
2. **Use Full Names**: "John Smith" not just "John" (if you have multiple Johns)
3. **Save Backups**: Download CSV regularly using **💾 Download CSV**
4. **Experiment**: Try the Play button to see the story unfold!
5. **Mobile Friendly**: Works on phones/tablets too!

---

## 📖 Event Types Explained

### Birth
**Required:** person, person_gender  
**Optional:** person2 (family parent), person3 (other parent)

Creates a new person and links them to parents if specified.

### Death
**Required:** person  
Changes the person's circle from colored to gray.

### Relationship Start
**Required:** person, person2  
**Optional:** person_gender, person2_gender

Draws a **solid line** between two people.

### Relationship End
**Required:** person, person2  
Changes the line to **dotted** to show the relationship ended.

---

## 🎯 Example: Adding Your Grandparents

**Step 1** - Add their births:
```csv
1930,birth,Grandfather,,,,male
1932,birth,Grandmother,,,,female
```

**Step 2** - Record their marriage:
```csv
1955,relationship_start,Grandfather,Grandmother,,male,female
```

**Step 3** - Add your parent:
```csv
1960,birth,Parent,Grandfather,Grandmother,male,
```

**Step 4** - Add yourself:
```csv
1990,birth,You,Parent,OtherParent,female,
```

Now set the timeline to **1990** and see 4 generations!

---

## 🌟 Ready to Explore?

Open `family-tree.html` and start visualizing your family's journey through time!

Need more help? Check `FAMILY-TREE-README.md` for detailed documentation.

---

**Happy Family Tree Building! 🌳**
