import { CONFIG } from './constants.js';

/**
 * Handles the actual D3 rendering of the family tree
 */
export class Renderer {
    constructor(svg, nodeMap, viz) {
        this.svg = svg;
        this.nodeMap = nodeMap;
        this.viz = viz; // Reference back to viz for focus/zoom actions

        this.g = this.svg.select('g');
        this.linksLayer = this.g.select('.links-layer');
        this.parentChildLayer = this.g.select('.parent-child-layer');
        this.nodesLayer = this.g.select('.nodes-layer');
    }

    renderLinks(links, currentYear) {
        const relationshipLinks = links.filter(d => d.type === 'relationship');
        this.renderRelationshipLinks(relationshipLinks, currentYear);
        // Note: Render nodes happens after this in the main Viz class
    }

    renderRelationshipLinks(links, currentYear) {
        const linkGroup = this.linksLayer.selectAll('.relationship-group')
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

        linkEnter.append('line').attr('class', 'relationship-line');
        linkEnter.append('text').attr('class', 'link-year-label');

        const linkUpdate = linkEnter.merge(linkGroup);

        linkUpdate.select('line')
            .attr('class', d => `relationship-line ${(d.endYear && d.endYear <= currentYear) ? 'ended' : 'active'}`)
            .transition().duration(CONFIG.ANIMATION_DURATION)
            .attr('x1', d => this.nodeMap.get(d.source.id || d.source)?.x || 0)
            .attr('y1', d => this.nodeMap.get(d.source.id || d.source)?.y || 0)
            .attr('x2', d => this.nodeMap.get(d.target.id || d.target)?.x || 0)
            .attr('y2', d => this.nodeMap.get(d.target.id || d.target)?.y || 0);

        linkUpdate.select('.link-year-label')
            .transition().duration(CONFIG.ANIMATION_DURATION)
            .attr('x', d => {
                const s = this.nodeMap.get(d.source.id || d.source);
                const t = this.nodeMap.get(d.target.id || d.target);
                return s && t ? (s.x + t.x) / 2 : 0;
            })
            .attr('y', d => {
                const s = this.nodeMap.get(d.source.id || d.source);
                const t = this.nodeMap.get(d.target.id || d.target);
                return s && t ? (s.y + t.y) / 2 - 5 : 0;
            })
            .text(d => {
                let label = d.startYear ? `${d.startYear}` : '';
                if (d.endYear && d.endYear <= currentYear) label += ` - ${d.endYear}`;
                return label;
            });

        linkUpdate.transition().duration(CONFIG.ANIMATION_DURATION).style('opacity', 1);
    }

    renderParentChildLines(visibleNodes, relationshipLinks, currentYear) {
        const relationshipMidpoints = new Map();
        relationshipLinks.forEach(link => {
            const sId = link.source.id || link.source;
            const tId = link.target.id || link.target;
            const p1 = this.nodeMap.get(sId);
            const p2 = this.nodeMap.get(tId);
            if (p1 && p2) {
                relationshipMidpoints.set([sId, tId].sort().join('-'), { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 });
            }
        });

        const drawingData = [];
        visibleNodes.forEach(node => {
            if (!node.parents || node.parents.length === 0) return;
            if (node.birthYear && node.birthYear > currentYear) return;

            if (node.parents.length === 2) {
                const midpoint = relationshipMidpoints.get([...node.parents].sort().join('-'));
                if (midpoint) drawingData.push({ id: `pc-${node.id}`, x1: node.x, y1: node.y, x2: midpoint.x, y2: midpoint.y });
            } else if (node.parents.length === 1) {
                const parent = this.nodeMap.get(node.parents[0]);
                if (parent) drawingData.push({ id: `pc-${node.id}`, x1: node.x, y1: node.y, x2: parent.x, y2: parent.y });
            }
        });

        this.parentChildLayer.selectAll('*').remove();
        this.parentChildLayer.selectAll('.parent-child-line').data(drawingData).enter()
            .append('line').attr('class', 'relationship-line parent-child')
            .attr('x1', d => d.x1).attr('y1', d => d.y1).attr('x2', d => d.x2).attr('y2', d => d.y2).style('opacity', 1);

        const junctionPoints = Array.from(new Set(drawingData.map(d => `${d.x2},${d.y2}`)))
            .map(key => ({ cx: parseFloat(key.split(',')[0]), cy: parseFloat(key.split(',')[1]) }));

        this.parentChildLayer.selectAll('.junction-point').data(junctionPoints).enter()
            .append('circle').attr('class', 'junction-point').attr('cx', d => d.cx).attr('cy', d => d.cy).attr('r', 4).style('opacity', 1);
    }

    renderNodes(nodes, currentYear, labelMode) {
        const node = this.nodesLayer.selectAll('.node-group').data(nodes, d => d.id);

        node.exit().transition().duration(CONFIG.ANIMATION_DURATION)
            .attr('transform', d => `translate(${d.x},${d.y}) scale(0)`).remove();

        const nodeEnter = node.enter().append('g').attr('class', 'node-group')
            .attr('transform', d => `translate(${d.x},${d.y})`).style('cursor', 'pointer')
            .on('dblclick', (event, d) => { event.stopPropagation(); this.viz.setFocus(d.id); });

        nodeEnter.append('circle').attr('r', 0)
            .attr('class', d => `node ${!d.isFamilyMember ? 'partner' : ''} ${(d.deathYear && d.deathYear <= currentYear) ? 'deceased' : ''}`)
            .on('mouseover', (event, d) => this.showTooltip(event, d))
            .on('mousemove', (event) => this.moveTooltip(event))
            .on('mouseout', () => this.hideTooltip())
            .transition().duration(400).ease(d3.easeBackOut.overshoot(1.7)).attr('r', CONFIG.NODE_RADIUS);

        nodeEnter.append('text').attr('class', 'gender-icon').attr('dy', 5);
        nodeEnter.append('text').attr('dy', CONFIG.NODE_RADIUS + 20).attr('text-anchor', 'middle').attr('class', 'node-label').style('opacity', 0)
            .transition().delay(200).duration(400).style('opacity', 1);

        const nodeUpdate = nodeEnter.merge(node);
        nodeUpdate.attr('transform', d => `translate(${d.x},${d.y})`);

        nodeUpdate.select('circle')
            .attr('class', d => `node ${!d.isFamilyMember ? 'partner' : ''} ${(d.deathYear && d.deathYear <= currentYear) ? 'deceased' : ''}`)
            .style('fill', d => this.getNodeColor(d, currentYear));

        nodeUpdate.select('.gender-icon').text(d => CONFIG.GENDER_ICONS[d.gender] || '');
        nodeUpdate.select('.node-label').text(d => this.getNodeLabel(d, currentYear, labelMode));
    }

    getNodeColor(d, currentYear) {
        const isDead = d.deathYear && d.deathYear <= currentYear;
        if (isDead) return d.isFamilyMember ? CONFIG.COLORS.familyDead : CONFIG.COLORS.nonFamilyDead;
        if (!d.isFamilyMember) {
            const ended = d.relationships.some(r => r.endYear && r.endYear <= currentYear);
            return ended ? CONFIG.COLORS.nonFamilyInactive : CONFIG.COLORS.nonFamilyActive;
        }
        return CONFIG.COLORS.familyAlive;
    }

    getNodeLabel(d, currentYear, labelMode) {
        let label = d.name;
        if (labelMode === 'age' && d.birthYear) {
            const isDead = d.deathYear && d.deathYear <= currentYear;
            label += isDead ? ` (Died at ${d.deathYear - d.birthYear})` : ` (${currentYear - d.birthYear})`;
        } else if (d.birthYear) {
            label += ` (${d.birthYear}${d.deathYear && d.deathYear <= currentYear ? ` - ${d.deathYear}` : ''})`;
        }
        return label;
    }

    showTooltip(event, d) {
        const tooltip = d3.select('#nodeTooltip');
        const desc = d.descriptions && d.descriptions.length > 0 ? d.descriptions.join('<br>') : 'No description available.';
        tooltip.html(`<span class="tooltip-name">${d.name}</span><span class="tooltip-meta">Born: ${d.birthYear || 'Unknown'}${d.deathYear ? ` - ${d.deathYear}` : ''}</span><span class="tooltip-desc">${desc}</span>`);
        tooltip.classed('active', true);
        this.moveTooltip(event);
    }

    moveTooltip(event) {
        d3.select('#nodeTooltip').style('left', (event.pageX + 15) + 'px').style('top', (event.pageY - 15) + 'px');
    }

    hideTooltip() {
        d3.select('#nodeTooltip').classed('active', false);
    }
}
