import { MOCK_CSV_DATA } from './constants.js';
import StateManager from './state-manager.js';
import FamilyTreeBuilder from './family-tree-builder.js';
import FamilyTreeVisualization from './visualization.js';
import UIController from './ui-controller.js';

// Global app object
const app = {
    state: null,
    builder: null,
    viz: null,
    ui: null
};

// Make accessible globally for inline event handlers (e.g. data table buttons)
window.app = app;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing Ancestors & Echoes modules...');

    // Initialize components
    app.state = new StateManager();
    app.builder = new FamilyTreeBuilder();
    app.viz = new FamilyTreeVisualization('familyTreeSvg');
    app.ui = new UIController(app.state, app.builder, app.viz);

    // Load mock data
    app.state.loadData(MOCK_CSV_DATA);
    app.ui.updateUI();

    console.log('🌳 Ancestors & Echoes - Modularized & Ready!');
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
