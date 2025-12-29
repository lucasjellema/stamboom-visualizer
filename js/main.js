import { MOCK_CSV_DATA } from './constants.js';
import StateManager from './state-manager.js';
import FamilyTreeBuilder from './family-tree-builder.js';
import FamilyTreeVisualization from './visualization.js';
import UIController from './ui-controller.js';
import UITable from './ui-table.js';

/**
 * Entry point for Ancestors & Echoes
 */
const app = {
    state: null,
    builder: null,
    viz: null,
    ui: null
};

// Make accessible globally for inline event handlers (e.g. data table buttons)
window.app = app;

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing Ancestors & Echoes modules...');

    // Initialize core components
    app.state = new StateManager();
    app.builder = new FamilyTreeBuilder();
    app.viz = new FamilyTreeVisualization('familyTreeSvg');

    // Initialize UI controllers
    app.ui = new UIController(app.state, app.builder, app.viz);
    app.ui.table = new UITable(app.state, app.ui);

    // Initial load
    app.state.loadData(MOCK_CSV_DATA);
    app.ui.updateUI();

    console.log('🌳 Ancestors & Echoes - Modularized & Ready!');
});

window.addEventListener('resize', () => {
    if (app.viz) {
        const container = app.viz.svg.node().parentElement;
        app.viz.width = container.clientWidth - 32;
        app.viz.height = container.clientHeight - 32;
        app.viz.svg.attr('width', app.viz.width).attr('height', app.viz.height);

        // Re-render
        app.ui.updateVisualization();
    }
});
