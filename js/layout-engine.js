import { CONFIG } from './constants.js';

export function calculateLayout(nodes, links, currentYear, width, nodeMap) {
    // Calculate generation ONLY for family members
    const generations = new Map();

    const calculateGeneration = (nodeId, gen = 0) => {
        const node = nodeMap.get(nodeId);
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

    // Start with family members that have no parents
    nodes.forEach(node => {
        if (!node.isFamilyMember) return;

        const hasParent = node.parents && node.parents.length > 0;

        if (!hasParent) {
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

    // Find partner pairs for positioning (ALL relationships, even ended ones, to prevent overlap)
    const partnerPairs = new Map(); // familyMember -> [partners]
    links.forEach(link => {
        if (link.type !== 'relationship') return;

        const sourceId = link.source.id || link.source;
        const targetId = link.target.id || link.target;

        // REMOVED isActive check to keep ex-partners positioned correctly

        const sourceNode = nodeMap.get(sourceId);
        const targetNode = nodeMap.get(targetId);

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
            const node = nodeMap.get(id);
            return node && node.isFamilyMember;
        });

        // Calculate total width needed including partners
        let totalWidth = 0;
        familyMembers.forEach(nodeId => {
            const partners = partnerPairs.get(nodeId) || [];
            // Base width + extra for each partner (increased to 1.0 to fit text)
            totalWidth += CONFIG.HORIZONTAL_SPACING * (1 + partners.length * 1.0);
        });

        let x = (width - totalWidth) / 2;

        familyMembers.forEach(nodeId => {
            const node = nodeMap.get(nodeId);
            if (!node || positioned.has(nodeId)) return;

            // Calculate width for this family member + partners
            const partners = partnerPairs.get(nodeId) || [];
            const groupWidth = CONFIG.HORIZONTAL_SPACING * (1 + partners.length * 1.0);

            // Position the family member
            node.x = x;
            node.y = y;
            positioned.add(nodeId);

            // Position their partner(s) next to them
            partners.forEach((partnerId, index) => {
                const partnerNode = nodeMap.get(partnerId);
                if (partnerNode && !positioned.has(partnerId)) {
                    // Increased spacing to 0.8 * HORIZONTAL_SPACING to fit year labels
                    partnerNode.x = x + (index + 1) * (CONFIG.HORIZONTAL_SPACING * 0.8);
                    partnerNode.y = y;
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
            node.x = width / 2;
            node.y = 100;
        }
    });
}
