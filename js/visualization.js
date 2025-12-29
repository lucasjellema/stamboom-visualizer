import { CONFIG } from './constants.js';
import { calculateHierarchicalLayout } from './layout-engine.js';
import { Renderer } from './renderer.js';

/**
 * Main orchestration class for the family tree visualization
 */
export default class FamilyTreeVisualization {
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
        this.lastStartYear = null;

        this.initializeSVG();
        this.renderer = new Renderer(this.svg, this.nodeMap, this);
    }

    initializeSVG() {
        const container = this.svg.node().parentElement;
        this.width = container.clientWidth - 32;
        this.height = container.clientHeight - 32;

        this.svg.attr('width', this.width).attr('height', this.height);

        this.zoom = d3.zoom().scaleExtent([0.3, 3]).on('zoom', (event) => {
            this.g.attr('transform', event.transform);
        });

        this.svg.call(this.zoom);
        this.g = this.svg.append('g');

        // Create dedicated layers
        this.g.append('g').attr('class', 'links-layer');
        this.g.append('g').attr('class', 'parent-child-layer');
        this.g.append('g').attr('class', 'nodes-layer');
    }

    render(treeData, currentYear, startYear) {
        this.lastTreeData = treeData;
        this.lastCurrentYear = currentYear;
        this.lastStartYear = startYear;

        let { nodes, links } = this.focusedNodeId
            ? this.getSubTree(this.focusedNodeId, treeData.nodes, treeData.links)
            : treeData;

        // Filter based on timeline
        const visibleNodes = nodes.filter(node =>
            (!node.birthYear || node.birthYear <= currentYear) && (!node.deathYear || node.deathYear >= startYear)
        );
        const visibleNodeIds = new Set(visibleNodes.map(n => n.id));

        const visibleLinks = links.filter(link =>
            link.type === 'relationship' &&
            visibleNodeIds.has(link.source.id || link.source) &&
            visibleNodeIds.has(link.target.id || link.target) &&
            (!link.startYear || link.startYear <= currentYear) &&
            (!link.endYear || link.endYear >= startYear)
        );

        this.nodeMap.clear();
        visibleNodes.forEach(n => this.nodeMap.set(n.id, n));

        // Layout & Render
        calculateHierarchicalLayout(visibleNodes, visibleLinks, currentYear, this.width, this.nodeMap);

        this.renderer.renderRelationshipLinks(visibleLinks, currentYear);
        this.renderer.renderParentChildLines(visibleNodes, visibleLinks, currentYear);
        this.renderer.renderNodes(visibleNodes, currentYear, window.app.state.labelMode);
    }

    setFocus(nodeId) {
        if (this.focusedNodeId === nodeId) return;
        this.focusedNodeId = nodeId;
        if (this.lastTreeData) this.render(this.lastTreeData, this.lastCurrentYear, this.lastStartYear);
        this.resetZoom(false);
    }

    getSubTree(rootId, allNodes, allLinks) {
        const includedIds = new Set([rootId]);
        const queue = [rootId];

        while (queue.length > 0) {
            const currentId = queue.shift();

            // Partners
            allLinks.forEach(link => {
                if (link.type === 'relationship') {
                    const s = link.source.id || link.source;
                    const t = link.target.id || link.target;
                    if (s === currentId) includedIds.add(t);
                    if (t === currentId) includedIds.add(s);
                }
            });

            // Children
            allNodes.forEach(node => {
                if (node.parents && node.parents.includes(currentId) && !includedIds.has(node.id)) {
                    includedIds.add(node.id);
                    queue.push(node.id);
                }
            });
        }

        return {
            nodes: allNodes.filter(n => includedIds.has(n.id)),
            links: allLinks.filter(l => includedIds.has(l.source.id || l.source) && includedIds.has(l.target.id || l.target))
        };
    }

    resetZoom(clearFocus = true) {
        if (clearFocus && this.focusedNodeId) {
            this.focusedNodeId = null;
            if (this.lastTreeData) this.render(this.lastTreeData, this.lastCurrentYear, this.lastStartYear);
        }
        this.svg.transition().duration(CONFIG.ANIMATION_DURATION).call(this.zoom.transform, d3.zoomIdentity);
    }

    zoomIn() { this.svg.transition().duration(CONFIG.ANIMATION_DURATION).call(this.zoom.scaleBy, 1.3); }
    zoomOut() { this.svg.transition().duration(CONFIG.ANIMATION_DURATION).call(this.zoom.scaleBy, 0.7); }
}
