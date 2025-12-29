import { CONFIG } from './constants.js';

/**
 * Calculates a hierarchical layout for the family tree.
 * Positions nodes based on generations and sibling groups.
 */
export function calculateHierarchicalLayout(nodes, links, currentYear, width, nodeMap) {
    // 1. Calculate generation ONLY for family members
    const generations = new Map();

    const calculateGeneration = (nodeId, gen = 0, path = new Set()) => {
        const node = nodeMap.get(nodeId);
        if (!node || !node.isFamilyMember || path.has(nodeId)) return;

        const currentGen = generations.get(nodeId);
        if (currentGen !== undefined && currentGen >= gen) return; // Already processed at higher level

        generations.set(nodeId, gen);
        path.add(nodeId);

        // Find children - any node that has this nodeId in their parents array
        nodes.forEach(otherNode => {
            if (otherNode.parents && otherNode.parents.includes(nodeId)) {
                if (otherNode.id !== nodeId) {
                    calculateGeneration(otherNode.id, gen + 1, new Set(path));
                }
            }
        });
    };

    const visibleNodeIds = new Set(nodes.map(n => n.id));

    // Start with family members that have no *visible* parents in the current view
    nodes.forEach(node => {
        if (!node.isFamilyMember) return;
        const hasVisibleParent = node.parents && node.parents.some(pId => visibleNodeIds.has(pId));
        if (!hasVisibleParent) {
            calculateGeneration(node.id, 0);
        }
    });

    // 2. Position non-family members at their spouse's generation
    nodes.forEach(node => {
        if (node.isFamilyMember || generations.has(node.id)) return;
        links.forEach(link => {
            if (link.type !== 'relationship') return;
            const sId = link.source.id || link.source;
            const tId = link.target.id || link.target;
            if (sId === node.id && generations.has(tId)) generations.set(node.id, generations.get(tId));
            else if (tId === node.id && generations.has(sId)) generations.set(node.id, generations.get(sId));
        });
    });

    // 3. Group nodes by generation
    const generationGroups = new Map();
    generations.forEach((gen, nodeId) => {
        if (!generationGroups.has(gen)) generationGroups.set(gen, []);
        generationGroups.get(gen).push(nodeId);
    });

    // 4. Find partner pairs for positioning
    const partnerPairs = new Map();
    links.forEach(link => {
        if (link.type !== 'relationship') return;
        const sId = link.source.id || link.source;
        const tId = link.target.id || link.target;
        const sNode = nodeMap.get(sId);
        const tNode = nodeMap.get(tId);
        if (sNode && tNode) {
            if (sNode.isFamilyMember && !tNode.isFamilyMember) {
                if (!partnerPairs.has(sId)) partnerPairs.set(sId, []);
                partnerPairs.get(sId).push(tId);
            } else if (tNode.isFamilyMember && !sNode.isFamilyMember) {
                if (!partnerPairs.has(tId)) partnerPairs.set(tId, []);
                partnerPairs.get(tId).push(sId);
            }
        }
    });

    // 5. Position nodes by generation
    const positioned = new Set();
    const sortedGens = Array.from(generationGroups.keys()).sort((a, b) => a - b);

    sortedGens.forEach((gen) => {
        const nodeIds = generationGroups.get(gen);
        const y = 100 + gen * CONFIG.VERTICAL_SPACING;
        const generationFamilyMembers = nodeIds.filter(id => nodeMap.get(id)?.isFamilyMember);

        // Group family members by their parents to keep siblings together
        const units = [];
        const visited = new Set();

        generationFamilyMembers.forEach(id => {
            if (visited.has(id)) return;
            const node = nodeMap.get(id);
            const parentKey = (node.parents || []).sort().join('|');
            const siblings = generationFamilyMembers.filter(otherId => {
                if (visited.has(otherId)) return false;
                const otherNode = nodeMap.get(otherId);
                return (otherNode.parents || []).sort().join('|') === parentKey;
            });

            siblings.forEach(sId => visited.add(sId));

            let unitWidth = 0;
            siblings.forEach(sId => {
                const partners = partnerPairs.get(sId) || [];
                unitWidth += CONFIG.HORIZONTAL_SPACING * (partners.length > 0 ? 2.0 : 1.0);
            });

            let desiredX = width / 2;
            if (node.parents && node.parents.length > 0) {
                let sumX = 0, count = 0;
                node.parents.forEach(pId => {
                    const pNode = nodeMap.get(pId);
                    if (pNode && pNode.x !== undefined) {
                        sumX += pNode.x;
                        count++;
                    }
                });
                if (count > 0) desiredX = sumX / count;
            }

            units.push({ members: siblings, width: unitWidth, desiredX: desiredX, x: 0 });
        });

        units.sort((a, b) => a.desiredX - b.desiredX);

        let currentXLimit = -10000;
        units.forEach(unit => {
            let x = unit.desiredX - (unit.width / 2);
            if (x < currentXLimit + 50) x = currentXLimit + 50;
            unit.x = x;
            currentXLimit = x + unit.width;
        });

        if (units.length > 0) {
            const minX = units[0].x;
            const maxX = units[units.length - 1].x + units[units.length - 1].width;
            const shift = (width - (maxX - minX)) / 2 - minX;
            units.forEach(u => u.x += shift);
        }

        units.forEach(unit => {
            let nextX = unit.x;
            unit.members.forEach(mId => {
                const node = nodeMap.get(mId);
                const partners = partnerPairs.get(mId) || [];
                node.x = nextX;
                node.y = y;
                positioned.add(mId);
                partners.forEach((pId, idx) => {
                    const pNode = nodeMap.get(pId);
                    if (pNode && !positioned.has(pId)) {
                        pNode.x = nextX + (CONFIG.HORIZONTAL_SPACING * 0.8);
                        pNode.y = y + (idx * 70);
                        positioned.add(pId);
                    }
                });
                nextX += CONFIG.HORIZONTAL_SPACING * (partners.length > 0 ? 2.0 : 1.0);
            });
        });
    });

    // Position any remaining unpositioned nodes
    nodes.forEach(node => {
        if (!positioned.has(node.id)) {
            node.x = width / 2;
            node.y = 100;
        }
    });
}
