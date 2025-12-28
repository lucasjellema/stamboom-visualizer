import { CONFIG } from './constants.js';
import { calculateLayout } from './layout-engine.js';

export default class FamilyTreeVisualization {
    constructor(svgElementId) {
        this.svg = d3.select(`#${svgElementId}`);
        this.width = 0;
        this.height = 0;
        this.g = null;
        this.zoom = null;
        this.nodeMap = new Map();

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
        // Filter nodes and links based on current year
        const visibleNodes = treeData.nodes.filter(node =>
            !node.birthYear || node.birthYear <= currentYear
        );

        const visibleNodeIds = new Set(visibleNodes.map(n => n.id));

        // Filter to ONLY relationship links (no parent-child links anymore)
        const visibleLinks = treeData.links.filter(link => {
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
        calculateLayout(visibleNodes, visibleLinks, currentYear, this.width, this.nodeMap);

        // Render relationship lines
        this.renderRelationshipLinks(visibleLinks, currentYear);

        // Render parent-child lines from relationship midpoints
        this.renderParentChildLines(visibleNodes, visibleLinks, currentYear);

        // Render nodes
        this.renderNodes(visibleNodes, currentYear);
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
            // REMOVED transition -> Instant update
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
            // REMOVED transition -> Instant update
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

        linkUpdate.style('opacity', 1);
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
            .style('cursor', 'pointer'); // REMOVED DRAG call

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

    resetZoom() {
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
