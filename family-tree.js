/* ========================================
   ANCESTORS & ECHOES - Main Application
   Family History Visualization Engine  
   HIERARCHICAL LAYOUT VERSION
   ======================================== */

// ========================================
// CONSTANTS & CONFIGURATION  
// ========================================

const CONFIG = {
    NODE_RADIUS: 25,
    VERTICAL_SPACING: 150,
    HORIZONTAL_SPACING: 200,
    ANIMATION_DURATION: 500,
    PLAYBACK_SPEED: 500, // ms per year
    COLORS: {
        familyAlive: '#10b981',
        familyDead: '#94a3b8',
        nonFamilyActive: '#3b82f6',
        nonFamilyInactive: '#f59e0b',
        nonFamilyDead: '#ef4444'
    },
    GENDER_ICONS: {
        male: '♂',
        female: '♀',
        'non-binary': '⚧'
    }
};

// ========================================
// MOCK DATA
// ========================================

const MOCK_CSV_DATA = `year,type,person,person2,person3,person_gender,person2_gender
1950,birth,John,,,,male
1952,birth,Mary,,,,female
1975,relationship_start,John,Sarah,,male,female
1977,birth,Alice,John,Sarah,female,
1980,birth,Bob,John,Sarah,male,
1995,relationship_end,John,Sarah,,male,female
1998,relationship_start,Alice,Michael,,female,male
2000,birth,Emma,Alice,Michael,female,
2005,relationship_start,Bob,Jennifer,,male,female
2008,birth,Lucas,Bob,Jennifer,male,
2010,birth,Sophia,Bob,Jennifer,female,
2015,death,John,,,,male
2020,relationship_start,Emma,David,,female,male
2025,birth,Oliver,Emma,David,male,`;

// ========================================
// STATE MANAGEMENT
// ========================================

class StateManager {
    constructor() {
        this.events = [];
        this.currentYear = 1990;
        this.minYear = 1950;
        this.maxYear = 2025;
        this.isPlaying = false;
        this.playInterval = null;
    }

    loadData(csvString) {
        this.events = this.parseCSV(csvString);
        this.calculateYearRange();
        this.sortEvents();
    }

    parseCSV(csvString) {
        const lines = csvString.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const events = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            const event = {};
            headers.forEach((header, index) => {
                event[header] = values[index] || '';
            });
            events.push(event);
        }

        return events;
    }

    calculateYearRange() {
        if (this.events.length === 0) return;

        const years = this.events.map(e => parseInt(e.year));
        this.minYear = Math.min(...years);
        this.maxYear = Math.max(...years);
        this.currentYear = this.minYear;
    }

    sortEvents() {
        this.events.sort((a, b) => parseInt(a.year) - parseInt(b.year));
    }

    getEventsUpToYear(year) {
        return this.events.filter(e => parseInt(e.year) <= year);
    }

    getEventYears() {
        return [...new Set(this.events.map(e => parseInt(e.year)))].sort((a, b) => a - b);
    }

    getPreviousEventYear() {
        const eventYears = this.getEventYears();
        const previousYears = eventYears.filter(y => y < this.currentYear);
        return previousYears.length > 0 ? previousYears[previousYears.length - 1] : this.minYear;
    }

    getNextEventYear() {
        const eventYears = this.getEventYears();
        const nextYears = eventYears.filter(y => y > this.currentYear);
        return nextYears.length > 0 ? nextYears[0] : this.maxYear;
    }

    exportCSV() {
        const headers = ['year', 'type', 'person', 'person2', 'person3', 'person_gender', 'person2_gender'];
        const rows = this.events.map(event =>
            headers.map(h => event[h] || '').join(',')
        );
        return [headers.join(','), ...rows].join('\n');
    }

    addEvent(event) {
        this.events.push(event);
        this.sortEvents();
        this.calculateYearRange();
    }

    updateEvent(index, event) {
        this.events[index] = event;
        this.sortEvents();
        this.calculateYearRange();
    }

    deleteEvent(index) {
        this.events.splice(index, 1);
        this.calculateYearRange();
    }
}

// ========================================
// FAMILY TREE BUILDER
// ========================================

class FamilyTreeBuilder {
    constructor() {
        this.people = new Map();
        this.relationships = [];
    }

    buildFromEvents(events) {
        this.people.clear();
        this.relationships = [];

        events.forEach(event => {
            const year = parseInt(event.year);

            switch (event.type) {
                case 'birth':
                    this.handleBirth(event);
                    break;
                case 'death':
                    this.handleDeath(event);
                    break;
                case 'relationship_start':
                    this.handleRelationshipStart(event);
                    break;
                case 'relationship_end':
                    this.handleRelationshipEnd(event);
                    break;
            }
        });

        return {
            nodes: Array.from(this.people.values()),
            links: this.relationships
        };
    }

    handleBirth(event) {
        const person = event.person;
        const parent1 = event.person2;
        const parent2 = event.person3;
        const gender = event.person_gender;

        // Add the person being born
        if (!this.people.has(person)) {
            this.people.set(person, {
                id: person,
                name: person,
                gender: gender,
                isFamilyMember: true,
                birthYear: parseInt(event.year),
                deathYear: null,
                relationships: [],
                parents: [] // Store parents here instead of as links
            });
        }

        // Add parents if not already present
        if (parent1 && !this.people.has(parent1)) {
            this.people.set(parent1, {
                id: parent1,
                name: parent1,
                gender: '',
                isFamilyMember: true,
                birthYear: null,
                deathYear: null,
                relationships: [],
                parents: []
            });
        }

        if (parent2 && !this.people.has(parent2)) {
            this.people.set(parent2, {
                id: parent2,
                name: parent2,
                gender: '',
                isFamilyMember: false,
                birthYear: null,
                deathYear: null,
                relationships: [],
                parents: []
            });
        }

        // Store parent information on the child node
        const child = this.people.get(person);
        if (parent1) child.parents.push(parent1);
        if (parent2) child.parents.push(parent2);

        // DO NOT create parent-child relationship links
    }

    handleDeath(event) {
        const person = event.person;
        if (this.people.has(person)) {
            this.people.get(person).deathYear = parseInt(event.year);
        }
    }

    handleRelationshipStart(event) {
        const person1 = event.person;
        const person2 = event.person2;
        const gender2 = event.person2_gender;

        // Add person2 if not already present
        if (!this.people.has(person2)) {
            this.people.set(person2, {
                id: person2,
                name: person2,
                gender: gender2,
                isFamilyMember: false,
                birthYear: null,
                deathYear: null,
                relationships: []
            });
        }

        // Track relationship in person objects
        if (this.people.has(person1)) {
            this.people.get(person1).relationships.push({
                partner: person2,
                startYear: parseInt(event.year),
                endYear: null
            });
        }

        if (this.people.has(person2)) {
            this.people.get(person2).relationships.push({
                partner: person1,
                startYear: parseInt(event.year),
                endYear: null
            });
        }

        // Create relationship link
        this.relationships.push({
            source: person1,
            target: person2,
            type: 'relationship',
            startYear: parseInt(event.year),
            endYear: null,
            active: true
        });
    }

    handleRelationshipEnd(event) {
        const person1 = event.person;
        const person2 = event.person2;
        const endYear = parseInt(event.year);

        // Update relationship status in person objects
        if (this.people.has(person1)) {
            const rel = this.people.get(person1).relationships.find(r => r.partner === person2);
            if (rel) rel.endYear = endYear;
        }

        if (this.people.has(person2)) {
            const rel = this.people.get(person2).relationships.find(r => r.partner === person1);
            if (rel) rel.endYear = endYear;
        }

        // Update relationship link
        const link = this.relationships.find(r =>
            r.type === 'relationship' &&
            ((r.source === person1 && r.target === person2) ||
                (r.source === person2 && r.target === person1))
        );
        if (link) {
            link.endYear = endYear;
            link.active = false;
        }
    }
}

// ========================================
// D3 VISUALIZATION
// ========================================

class FamilyTreeVisualization {
    constructor(svgElementId) {
        this.svg = d3.select(`#${svgElementId}`);
        this.width = 0;
        this.height = 0;
        this.g = null;
        this.zoom = null;
        this.nodeMap = new Map();

        // Focus State
        this.focusedNodeId = null;
        this.lastTreeData = null;
        this.lastCurrentYear = null;

        this.initializeSVG();
    }

    initializeSVG() {
        const container = this.svg.node().parentElement;
        this.width = container.clientWidth - 32;
        this.height = container.clientHeight - 32;

        this.svg
            .attr('width', this.width)
            .attr('height', this.height);

        // Create zoom behavior
        this.zoom = d3.zoom()
            .scaleExtent([0.3, 3])
            .on('zoom', (event) => {
                this.g.attr('transform', event.transform);
            });

        this.svg.call(this.zoom);

        // Create main group for all elements
        this.g = this.svg.append('g');

        // Create dedicated groups for different elements (order matters for z-index)
        this.linksGroup = this.g.append('g').attr('class', 'links-layer');
        this.parentChildGroup = this.g.append('g').attr('class', 'parent-child-layer');
        this.nodesGroup = this.g.append('g').attr('class', 'nodes-layer');
    }

    render(treeData, currentYear) {
        // Store for re-rendering during focus operations
        this.lastTreeData = treeData;
        this.lastCurrentYear = currentYear;

        let workingNodes = treeData.nodes;
        let workingLinks = treeData.links;

        // Apply Focus Filter if active
        if (this.focusedNodeId) {
            const subTree = this.getSubTree(this.focusedNodeId, treeData.nodes, treeData.links);
            // If the focused node is visible/valid, use the subtree. 
            // Otherwise (e.g. node died or filtered out by year), stick to full tree or clear.
            if (subTree.nodes.length > 0) {
                workingNodes = subTree.nodes;
                workingLinks = subTree.links;
            }
        }

        // Filter nodes and links based on current year
        const visibleNodes = workingNodes.filter(node =>
            !node.birthYear || node.birthYear <= currentYear
        );

        const visibleNodeIds = new Set(visibleNodes.map(n => n.id));

        // Filter to ONLY relationship links (no parent-child links anymore)
        const visibleLinks = workingLinks.filter(link => {
            const sourceId = link.source.id || link.source;
            const targetId = link.target.id || link.target;

            const bothNodesVisible = visibleNodeIds.has(sourceId) && visibleNodeIds.has(targetId);
            const linkStarted = !link.startYear || link.startYear <= currentYear;

            return bothNodesVisible && linkStarted && link.type === 'relationship';
        });

        // Store nodes in map for easy access
        this.nodeMap.clear();
        visibleNodes.forEach(n => this.nodeMap.set(n.id, n));

        // Calculate hierarchical positions
        this.calculateHierarchicalLayout(visibleNodes, visibleLinks, currentYear);

        // Render relationship lines
        this.renderRelationshipLinks(visibleLinks, currentYear);

        // Render parent-child lines from relationship midpoints
        this.renderParentChildLines(visibleNodes, visibleLinks, currentYear);

        // Render nodes
        this.renderNodes(visibleNodes, currentYear);
    }

    calculateHierarchicalLayout(nodes, links, currentYear) {
        // Calculate generation ONLY for family members
        const generations = new Map();

        const calculateGeneration = (nodeId, gen = 0) => {
            const node = this.nodeMap.get(nodeId);
            if (!node || !node.isFamilyMember) return;

            const currentGen = generations.get(nodeId);
            if (currentGen !== undefined && currentGen >= gen) return; // Already processed at higher level

            generations.set(nodeId, gen);

            // Find children - any node that has this nodeId in their parents array
            nodes.forEach(otherNode => {
                if (otherNode.parents && otherNode.parents.includes(nodeId)) {
                    calculateGeneration(otherNode.id, gen + 1);
                }
            });
        };

        // Helper set for quick lookup of currently visible nodes (crucial for focus mode)
        const visibleNodeIds = new Set(nodes.map(n => n.id));

        // Start with family members that have no *visible* parents in the current view
        nodes.forEach(node => {
            if (!node.isFamilyMember) return;

            // A node is a root if it has no parents, OR if its parents are filtered out (focus mode)
            const hasVisibleParent = node.parents && node.parents.some(pId => visibleNodeIds.has(pId));

            if (!hasVisibleParent) {
                calculateGeneration(node.id, 0);
            }
        });

        // Position non-family members at their spouse's generation
        nodes.forEach(node => {
            if (node.isFamilyMember || generations.has(node.id)) return;

            // Find their partner who is a family member
            links.forEach(link => {
                if (link.type !== 'relationship') return;

                const sourceId = link.source.id || link.source;
                const targetId = link.target.id || link.target;

                if (sourceId === node.id && generations.has(targetId)) {
                    generations.set(node.id, generations.get(targetId));
                } else if (targetId === node.id && generations.has(sourceId)) {
                    generations.set(node.id, generations.get(sourceId));
                }
            });
        });

        // Group nodes by generation
        const generationGroups = new Map();
        generations.forEach((gen, nodeId) => {
            if (!generationGroups.has(gen)) {
                generationGroups.set(gen, []);
            }
            generationGroups.get(gen).push(nodeId);
        });

        // Find partner pairs for positioning (only active relationships)
        const partnerPairs = new Map(); // familyMember -> [partners]
        links.forEach(link => {
            if (link.type !== 'relationship') return;

            const sourceId = link.source.id || link.source;
            const targetId = link.target.id || link.target;

            const sourceNode = this.nodeMap.get(sourceId);
            const targetNode = this.nodeMap.get(targetId);

            if (sourceNode && targetNode) {
                if (sourceNode.isFamilyMember && !targetNode.isFamilyMember) {
                    if (!partnerPairs.has(sourceId)) partnerPairs.set(sourceId, []);
                    partnerPairs.get(sourceId).push(targetId);
                } else if (targetNode.isFamilyMember && !sourceNode.isFamilyMember) {
                    if (!partnerPairs.has(targetId)) partnerPairs.set(targetId, []);
                    partnerPairs.get(targetId).push(sourceId);
                }
            }
        });

        // Position nodes by generation
        const positioned = new Set();

        generationGroups.forEach((nodeIds, gen) => {
            const y = 100 + gen * CONFIG.VERTICAL_SPACING;

            // Separate family members from others
            const familyMembers = nodeIds.filter(id => {
                const node = this.nodeMap.get(id);
                return node && node.isFamilyMember;
            });

            // Calculate total width needed including partners
            let totalWidth = 0;
            familyMembers.forEach(nodeId => {
                const partners = partnerPairs.get(nodeId) || [];
                // Base width + width for ONE partner column (if any partners exist)
                // We stack partners vertically, so width doesn't grow with partner count
                const widthMultiplier = partners.length > 0 ? 2.0 : 1.0;
                totalWidth += CONFIG.HORIZONTAL_SPACING * widthMultiplier;
            });

            let x = (this.width - totalWidth) / 2;

            familyMembers.forEach(nodeId => {
                const node = this.nodeMap.get(nodeId);
                if (!node || positioned.has(nodeId)) return;

                // Calculate width for this family member + partners (capped for vertical stacking)
                const partners = partnerPairs.get(nodeId) || [];
                const widthMultiplier = partners.length > 0 ? 2.0 : 1.0;
                const groupWidth = CONFIG.HORIZONTAL_SPACING * widthMultiplier;

                // Position the family member
                node.x = x;
                node.y = y;
                positioned.add(nodeId);

                // Position their partner(s) next to them (vertically stacked)
                partners.forEach((partnerId, index) => {
                    const partnerNode = this.nodeMap.get(partnerId);
                    if (partnerNode && !positioned.has(partnerId)) {
                        // All partners in the same column
                        partnerNode.x = x + (CONFIG.HORIZONTAL_SPACING * 0.8);
                        // Subsequent partners stacked vertically below the first one
                        partnerNode.y = y + (index * 70);
                        positioned.add(partnerId);
                    }
                });

                // Move x position for next family member/group
                x += groupWidth;
            });
        });

        // Position any remaining unpositioned nodes
        nodes.forEach(node => {
            if (!positioned.has(node.id)) {
                node.x = this.width / 2;
                node.y = 100;
            }
        });
    }

    renderLinks(links, currentYear) {
        // Separate relationship links from parent-child links
        const relationshipLinks = links.filter(d => d.type === 'relationship');
        const parentChildLinks = links.filter(d => d.type === 'parent-child');

        // Render relationship lines first
        this.renderRelationshipLinks(relationshipLinks, currentYear);

        // Render parent-child connections (from child to parents' relationship line)
        this.renderParentChildLinks(parentChildLinks, relationshipLinks, currentYear);
    }

    renderRelationshipLinks(links, currentYear) {
        const linkGroup = this.linksGroup.selectAll('.relationship-group')
            .data(links, d => {
                const sourceId = d.source.id || d.source;
                const targetId = d.target.id || d.target;
                return `rel-${sourceId}-${targetId}`;
            });

        linkGroup.exit().remove();

        const linkEnter = linkGroup.enter()
            .append('g')
            .attr('class', 'relationship-group')
            .style('opacity', 0);

        linkEnter.append('line')
            .attr('class', 'relationship-line');

        linkEnter.append('text')
            .attr('class', 'link-year-label');

        const linkUpdate = linkEnter.merge(linkGroup);

        linkUpdate.select('line')
            .attr('class', d => {
                let classes = 'relationship-line';
                if (d.endYear && d.endYear <= currentYear) classes += ' ended';
                else classes += ' active';
                return classes;
            })
            .transition()
            .duration(CONFIG.ANIMATION_DURATION)
            .attr('x1', d => {
                const sourceId = d.source.id || d.source;
                const source = this.nodeMap.get(sourceId);
                return source ? source.x : 0;
            })
            .attr('y1', d => {
                const sourceId = d.source.id || d.source;
                const source = this.nodeMap.get(sourceId);
                return source ? source.y : 0;
            })
            .attr('x2', d => {
                const targetId = d.target.id || d.target;
                const target = this.nodeMap.get(targetId);
                return target ? target.x : 0;
            })
            .attr('y2', d => {
                const targetId = d.target.id || d.target;
                const target = this.nodeMap.get(targetId);
                return target ? target.y : 0;
            });

        linkUpdate.select('.link-year-label')
            .transition()
            .duration(CONFIG.ANIMATION_DURATION)
            .attr('x', d => {
                const sourceId = d.source.id || d.source;
                const targetId = d.target.id || d.target;
                const source = this.nodeMap.get(sourceId);
                const target = this.nodeMap.get(targetId);
                return source && target ? (source.x + target.x) / 2 : 0;
            })
            .attr('y', d => {
                const sourceId = d.source.id || d.source;
                const targetId = d.target.id || d.target;
                const source = this.nodeMap.get(sourceId);
                const target = this.nodeMap.get(targetId);
                return source && target ? (source.y + target.y) / 2 - 5 : 0;
            })
            .text(d => {
                let label = d.startYear ? `${d.startYear}` : '';
                if (d.endYear && d.endYear <= currentYear) {
                    label += ` - ${d.endYear}`;
                }
                return label;
            });

        linkUpdate
            .transition()
            .duration(CONFIG.ANIMATION_DURATION)
            .style('opacity', 1);
    }

    renderParentChildLines(nodes, relationshipLinks, currentYear) {
        // Build a map of relationship midpoints
        const relationshipMidpoints = new Map();

        relationshipLinks.forEach(link => {
            const sourceId = link.source.id || link.source;
            const targetId = link.target.id || link.target;
            const relKey = [sourceId, targetId].sort().join('-');

            const parent1 = this.nodeMap.get(sourceId);
            const parent2 = this.nodeMap.get(targetId);

            if (parent1 && parent2) {
                relationshipMidpoints.set(relKey, {
                    x: (parent1.x + parent2.x) / 2,
                    y: (parent1.y + parent2.y) / 2
                });
            }
        });

        // Draw lines from visible children to their parents' relationship midpoint
        const drawingData = [];

        nodes.forEach(node => {
            if (!node.parents || node.parents.length === 0) return;
            if (node.birthYear && node.birthYear > currentYear) return;

            if (node.parents.length === 2) {
                // Find the relationship midpoint
                const relKey = [...node.parents].sort().join('-');
                const midpoint = relationshipMidpoints.get(relKey);

                if (midpoint) {
                    drawingData.push({
                        id: `pc-${node.id}`,
                        x1: node.x,
                        y1: node.y,
                        x2: midpoint.x,
                        y2: midpoint.y
                    });
                }
            } else if (node.parents.length === 1) {
                // Single parent - draw direct line
                const parent = this.nodeMap.get(node.parents[0]);
                if (parent) {
                    drawingData.push({
                        id: `pc-${node.id}`,
                        x1: node.x,
                        y1: node.y,
                        x2: parent.x,
                        y2: parent.y
                    });
                }
            }
        });

        // "Nuclear option": Clear the entire group ensures cleanup
        this.parentChildGroup.selectAll('*').remove();

        // Render INSTANTLY (no transitions)
        this.parentChildGroup.selectAll('.parent-child-line')
            .data(drawingData)
            .enter()
            .append('line')
            .attr('class', 'relationship-line parent-child')
            .attr('x1', d => d.x1)
            .attr('y1', d => d.y1)
            .attr('x2', d => d.x2)
            .attr('y2', d => d.y2)
            .style('opacity', 1); // Instant visibility

        // Identify unique junction points (midpoints on relationship lines)
        // We only want to draw dots where lines actually connect
        const junctionPoints = new Map();
        drawingData.forEach(d => {
            // Create a unique key for the coordinate
            const key = `${d.x2},${d.y2}`;
            if (!junctionPoints.has(key)) {
                junctionPoints.set(key, { cx: d.x2, cy: d.y2 });
            }
        });

        // Draw junction points
        this.parentChildGroup.selectAll('.junction-point')
            .data(Array.from(junctionPoints.values()))
            .enter()
            .append('circle')
            .attr('class', 'junction-point')
            .attr('cx', d => d.cx)
            .attr('cy', d => d.cy)
            .attr('r', 4)  // Small circle radius
            .style('opacity', 1);
    }

    renderNodes(nodes, currentYear) {
        const node = this.nodesGroup.selectAll('.node-group')
            .data(nodes, d => d.id);

        node.exit()
            .transition()
            .duration(CONFIG.ANIMATION_DURATION)
            .attr('transform', d => `translate(${d.x},${d.y}) scale(0)`) // Shrink out
            .remove();

        const nodeEnter = node.enter()
            .append('g')
            .attr('class', 'node-group')
            .attr('transform', d => `translate(${d.x},${d.y})`) // Start at position
            .style('cursor', 'pointer') // Add pointer cursor for better feel
            .on('dblclick', (event, d) => {
                event.stopPropagation();
                this.setFocus(d.id);
            });

        // Circle with POP animation
        nodeEnter.append('circle')
            .attr('r', 0) // Start invisible
            .attr('class', d => {
                let classes = 'node';
                if (!d.isFamilyMember) classes += ' partner';
                if (d.deathYear && d.deathYear <= currentYear) classes += ' deceased';
                return classes;
            })
            .transition() // Animate "pop"
            .duration(400)
            .ease(d3.easeBackOut.overshoot(1.7)) // Bouncy effect
            .attr('r', CONFIG.NODE_RADIUS);

        // Add gender icons
        nodeEnter.append('text')
            .attr('class', 'gender-icon')
            .attr('dy', 5);

        nodeEnter.append('text')
            .attr('dy', CONFIG.NODE_RADIUS + 20)
            .attr('text-anchor', 'middle')
            .attr('class', 'node-label')
            .style('opacity', 0)
            .transition()
            .delay(200)
            .duration(400)
            .style('opacity', 1);

        // Update all nodes
        const nodeUpdate = nodeEnter.merge(node);

        // Update position for existing nodes INSTANTLY (no smooth slide)
        nodeUpdate
            .attr('transform', d => `translate(${d.x},${d.y})`);

        // Check for state changes (e.g. Alive -> Deceased) to animate color only
        nodeUpdate.select('circle')
            .attr('class', d => {
                let classes = 'node';
                if (!d.isFamilyMember) classes += ' partner';
                if (d.deathYear && d.deathYear <= currentYear) classes += ' deceased';
                return classes;
            })
            .style('fill', d => {
                if (d.deathYear && d.deathYear <= currentYear) {
                    return d.isFamilyMember ? CONFIG.COLORS.familyDead : CONFIG.COLORS.nonFamilyDead;
                }
                if (!d.isFamilyMember) {
                    // Check if relationship ended
                    const ended = d.relationships.some(r => r.endYear && r.endYear <= currentYear);
                    return ended ? CONFIG.COLORS.nonFamilyInactive : CONFIG.COLORS.nonFamilyActive;
                }
                return CONFIG.COLORS.familyAlive;
            });

        nodeUpdate.select('.gender-icon')
            .text(d => CONFIG.GENDER_ICONS[d.gender] || '');

        nodeUpdate.select('.node-label')
            .text(d => {
                let label = d.name;
                if (d.birthYear) {
                    label += ` (${d.birthYear}`;
                    if (d.deathYear && d.deathYear <= currentYear) {
                        label += ` - ${d.deathYear}`;
                    }
                    label += ')';
                }
                return label;
            });
    }

    getNodeColor(node, currentYear) {
        const isDead = node.deathYear && node.deathYear <= currentYear;

        if (node.isFamilyMember) {
            return isDead ? CONFIG.COLORS.familyDead : CONFIG.COLORS.familyAlive;
        } else {
            if (isDead) return CONFIG.COLORS.nonFamilyDead;

            const hasActiveRelationship = node.relationships.some(rel =>
                rel.startYear <= currentYear && (!rel.endYear || rel.endYear > currentYear)
            );

            return hasActiveRelationship ? CONFIG.COLORS.nonFamilyActive : CONFIG.COLORS.nonFamilyInactive;
        }
    }

    setFocus(nodeId) {
        if (this.focusedNodeId === nodeId) return;
        this.focusedNodeId = nodeId;

        // Re-render with focus applied
        if (this.lastTreeData && this.lastCurrentYear) {
            this.render(this.lastTreeData, this.lastCurrentYear);
        }

        // Center view on top (optional, feels better)
        this.resetZoom(false); // Reset transform only, don't clear focus here
    }

    getSubTree(rootId, allNodes, allLinks) {
        const includedIds = new Set([rootId]);
        const queue = [rootId];

        while (queue.length > 0) {
            const currentId = queue.shift();

            // 1. Include Partners (for context)
            // We just make them visible, we don't traverse down from them 
            // (unless they are parents of the root's children, which are handled below)
            allLinks.forEach(link => {
                if (link.type === 'relationship') {
                    const s = link.source.id || link.source;
                    const t = link.target.id || link.target;
                    if (s === currentId) includedIds.add(t);
                    if (t === currentId) includedIds.add(s);
                }
            });

            // 2. Find Children (Traverse Down)
            allNodes.forEach(node => {
                if (node.parents && node.parents.includes(currentId)) {
                    if (!includedIds.has(node.id)) {
                        includedIds.add(node.id);
                        queue.push(node.id); // Continue traversal
                    }
                }
            });
        }

        return {
            nodes: allNodes.filter(n => includedIds.has(n.id)),
            links: allLinks.filter(l => {
                const s = l.source.id || l.source;
                const t = l.target.id || l.target;
                // Only include links if both parties are in our subtree
                return includedIds.has(s) && includedIds.has(t);
            })
        };
    }

    resetZoom(clearFocus = true) {
        if (clearFocus && this.focusedNodeId) {
            this.focusedNodeId = null;
            // Trigger full re-render
            if (this.lastTreeData && this.lastCurrentYear) {
                this.render(this.lastTreeData, this.lastCurrentYear);
            }
        }

        this.svg.transition()
            .duration(CONFIG.ANIMATION_DURATION)
            .call(this.zoom.transform, d3.zoomIdentity);
    }

    zoomIn() {
        this.svg.transition()
            .duration(CONFIG.ANIMATION_DURATION)
            .call(this.zoom.scaleBy, 1.3);
    }

    zoomOut() {
        this.svg.transition()
            .duration(CONFIG.ANIMATION_DURATION)
            .call(this.zoom.scaleBy, 0.7);
    }
}

// ========================================
// UI CONTROLLER
// ========================================

class UIController {
    constructor(stateManager, treeBuilder, visualization) {
        this.state = stateManager;
        this.builder = treeBuilder;
        this.viz = visualization;
        this.editingIndex = null;

        this.initializeEventListeners();
        this.updateUI();
    }

    initializeEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.closest('.tab-btn').dataset.tab));
        });

        // Timeline slider
        const slider = document.getElementById('timelineSlider');
        slider.addEventListener('input', (e) => {
            this.state.currentYear = parseInt(e.target.value);
            this.updateVisualization();
        });

        // Playback controls
        document.getElementById('prevEventBtn').addEventListener('click', () => this.previousEvent());
        document.getElementById('nextEventBtn').addEventListener('click', () => this.nextEvent());
        document.getElementById('playBtn').addEventListener('click', () => this.togglePlay());

        // Zoom controls
        document.getElementById('zoomInBtn').addEventListener('click', () => this.viz.zoomIn());
        document.getElementById('zoomOutBtn').addEventListener('click', () => this.viz.zoomOut());
        document.getElementById('zoomResetBtn').addEventListener('click', () => this.viz.resetZoom());

        // File operations
        document.getElementById('uploadBtn').addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });

        document.getElementById('fileInput').addEventListener('change', (e) => this.handleFileUpload(e));
        document.getElementById('downloadBtn').addEventListener('click', () => this.downloadCSV());

        // Data table
        document.getElementById('addRowBtn').addEventListener('click', () => this.openEventModal());

        // Modal
        document.getElementById('modalClose').addEventListener('click', () => this.closeModal());
        document.getElementById('cancelBtn').addEventListener('click', () => this.closeModal());
        document.getElementById('eventForm').addEventListener('submit', (e) => this.handleFormSubmit(e));

        // Event type change (show/hide fields)
        document.getElementById('eventType').addEventListener('change', (e) => this.updateFormFields(e.target.value));

        // Close modal on background click
        document.getElementById('eventModal').addEventListener('click', (e) => {
            if (e.target.id === 'eventModal') this.closeModal();
        });
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}Tab`);
        });

        if (tabName === 'data') {
            this.renderDataTable();
        }
    }

    updateUI() {
        // Update slider
        const slider = document.getElementById('timelineSlider');
        slider.min = this.state.minYear;
        slider.max = this.state.maxYear;
        slider.value = this.state.currentYear;

        // Update year displays
        document.getElementById('currentYearDisplay').textContent = this.state.currentYear;
        document.getElementById('minYear').textContent = this.state.minYear;
        document.getElementById('maxYear').textContent = this.state.maxYear;

        this.updateVisualization();
    }

    updateVisualization() {
        const events = this.state.getEventsUpToYear(this.state.currentYear);
        const treeData = this.builder.buildFromEvents(events);
        this.viz.render(treeData, this.state.currentYear);

        document.getElementById('currentYearDisplay').textContent = this.state.currentYear;
        document.getElementById('timelineSlider').value = this.state.currentYear;
    }

    previousEvent() {
        this.state.currentYear = this.state.getPreviousEventYear();
        this.updateVisualization();
    }

    nextEvent() {
        this.state.currentYear = this.state.getNextEventYear();
        this.updateVisualization();
    }

    togglePlay() {
        this.state.isPlaying = !this.state.isPlaying;

        const playBtn = document.getElementById('playBtn');
        const playIcon = document.getElementById('playIcon');
        const playText = document.getElementById('playText');

        if (this.state.isPlaying) {
            playIcon.textContent = '⏸';
            playText.textContent = 'Pause';
            this.startPlayback();
        } else {
            playIcon.textContent = '▶';
            playText.textContent = 'Play';
            this.stopPlayback();
        }
    }

    startPlayback() {
        this.state.playInterval = setInterval(() => {
            if (this.state.currentYear >= this.state.maxYear) {
                this.stopPlayback();
                return;
            }
            this.state.currentYear++;
            this.updateVisualization();
        }, CONFIG.PLAYBACK_SPEED);
    }

    stopPlayback() {
        if (this.state.playInterval) {
            clearInterval(this.state.playInterval);
            this.state.playInterval = null;
        }
        this.state.isPlaying = false;

        const playIcon = document.getElementById('playIcon');
        const playText = document.getElementById('playText');
        playIcon.textContent = '▶';
        playText.textContent = 'Play';
    }

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                this.state.loadData(e.target.result);
                this.updateUI();
                alert('File loaded successfully!');
            } catch (error) {
                alert('Error loading file: ' + error.message);
            }
        };
        reader.readAsText(file);
    }

    downloadCSV() {
        const csv = this.state.exportCSV();
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `family-history-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    renderDataTable() {
        const tbody = document.getElementById('dataTableBody');
        tbody.innerHTML = '';

        this.state.events.forEach((event, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${event.year}</td>
                <td>${event.type}</td>
                <td>${event.person}</td>
                <td>${event.person2 || '-'}</td>
                <td>${event.person3 || '-'}</td>
                <td>${event.person_gender || '-'}</td>
                <td>${event.person2_gender || '-'}</td>
                <td class="table-actions">
                    <button class="table-action-btn" onclick="app.ui.editEvent(${index})">Edit</button>
                    <button class="table-action-btn delete" onclick="app.ui.deleteEvent(${index})">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    openEventModal(eventData = null, index = null) {
        this.editingIndex = index;
        const modal = document.getElementById('eventModal');
        const form = document.getElementById('eventForm');

        if (eventData) {
            document.getElementById('modalTitle').textContent = 'Edit Event';
            document.getElementById('eventYear').value = eventData.year;
            document.getElementById('eventType').value = eventData.type;
            document.getElementById('eventPerson').value = eventData.person;
            document.getElementById('eventPerson2').value = eventData.person2 || '';
            document.getElementById('eventPerson3').value = eventData.person3 || '';
            document.getElementById('eventGender').value = eventData.person_gender || '';
            document.getElementById('eventGender2').value = eventData.person2_gender || '';
            this.updateFormFields(eventData.type);
        } else {
            document.getElementById('modalTitle').textContent = 'Add Event';
            form.reset();
            this.updateFormFields('');
        }

        modal.classList.add('active');
    }

    closeModal() {
        document.getElementById('eventModal').classList.remove('active');
        document.getElementById('eventForm').reset();
        this.editingIndex = null;
    }

    updateFormFields(eventType) {
        const person2Group = document.getElementById('person2Group');
        const person3Group = document.getElementById('person3Group');
        const genderGroup = document.getElementById('genderGroup');
        const gender2Group = document.getElementById('gender2Group');

        // Reset visibility
        [person2Group, person3Group, genderGroup, gender2Group].forEach(el => {
            el.style.display = 'block';
        });

        switch (eventType) {
            case 'birth':
                person3Group.style.display = 'block';
                gender2Group.style.display = 'none';
                break;
            case 'death':
                person2Group.style.display = 'none';
                person3Group.style.display = 'none';
                gender2Group.style.display = 'none';
                break;
            case 'relationship_start':
                person3Group.style.display = 'none';
                break;
            case 'relationship_end':
                person3Group.style.display = 'none';
                genderGroup.style.display = 'none';
                gender2Group.style.display = 'none';
                break;
            default:
                break;
        }
    }

    handleFormSubmit(event) {
        event.preventDefault();

        const eventData = {
            year: document.getElementById('eventYear').value,
            type: document.getElementById('eventType').value,
            person: document.getElementById('eventPerson').value,
            person2: document.getElementById('eventPerson2').value,
            person3: document.getElementById('eventPerson3').value,
            person_gender: document.getElementById('eventGender').value,
            person2_gender: document.getElementById('eventGender2').value
        };

        if (this.editingIndex !== null) {
            this.state.updateEvent(this.editingIndex, eventData);
        } else {
            this.state.addEvent(eventData);
        }

        this.updateUI();
        this.closeModal();

        if (document.querySelector('.tab-btn[data-tab="data"]').classList.contains('active')) {
            this.renderDataTable();
        }
    }

    editEvent(index) {
        this.openEventModal(this.state.events[index], index);
    }

    deleteEvent(index) {
        if (confirm('Are you sure you want to delete this event?')) {
            this.state.deleteEvent(index);
            this.renderDataTable();
            this.updateUI();
        }
    }
}

// ========================================
// APPLICATION INITIALIZATION
// ========================================

const app = {
    state: null,
    builder: null,
    viz: null,
    ui: null
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize components
    app.state = new StateManager();
    app.builder = new FamilyTreeBuilder();
    app.viz = new FamilyTreeVisualization('familyTreeSvg');
    app.ui = new UIController(app.state, app.builder, app.viz);

    // Load mock data
    app.state.loadData(MOCK_CSV_DATA);
    app.ui.updateUI();

    console.log('🌳 Ancestors & Echoes - Hierarchical layout with visible lines!');
});

// Handle window resize
window.addEventListener('resize', () => {
    if (app.viz) {
        const container = app.viz.svg.node().parentElement;
        app.viz.width = container.clientWidth - 32;
        app.viz.height = container.clientHeight - 32;
        app.viz.svg.attr('width', app.viz.width).attr('height', app.viz.height);

        // Re-render with current data
        const events = app.state.getEventsUpToYear(app.state.currentYear);
        const treeData = app.builder.buildFromEvents(events);
        app.viz.render(treeData, app.state.currentYear);
    }
});
