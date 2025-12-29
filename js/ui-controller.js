import { CONFIG } from './constants.js';

/**
 * Manages UI interactions and application flow
 */
export default class UIController {
    constructor(state, builder, viz) {
        this.state = state;
        this.builder = builder;
        this.viz = viz;
        this.table = null; // Set after initialization

        this.initializeEventListeners();
        this.updateUI();
    }

    setTableController(table) {
        this.table = table;
    }

    initializeEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.closest('.tab-btn').dataset.tab));
        });

        // Timeline sliders
        document.getElementById('startYearSlider').addEventListener('input', (e) => {
            let val = parseInt(e.target.value);
            if (val > this.state.currentYear) {
                val = this.state.currentYear;
                e.target.value = val;
            }
            this.state.startYear = val;
            this.updateVisualization();
        });

        document.getElementById('timelineSlider').addEventListener('input', (e) => {
            let val = parseInt(e.target.value);
            if (val < this.state.startYear) {
                val = this.state.startYear;
                e.target.value = val;
            }
            this.state.currentYear = val;
            this.updateVisualization();
        });

        // Playback
        document.getElementById('prevEventBtn').addEventListener('click', () => this.previousEvent());
        document.getElementById('nextEventBtn').addEventListener('click', () => this.nextEvent());
        document.getElementById('playBtn').addEventListener('click', () => this.togglePlay());

        // Zoom
        document.getElementById('zoomInBtn').addEventListener('click', () => this.viz.zoomIn());
        document.getElementById('zoomOutBtn').addEventListener('click', () => this.viz.zoomOut());
        document.getElementById('zoomResetBtn').addEventListener('click', () => this.viz.resetZoom());

        // File
        document.getElementById('uploadBtn').addEventListener('click', () => document.getElementById('fileInput').click());
        document.getElementById('fileInput').addEventListener('change', (e) => this.handleFileUpload(e));
        document.getElementById('downloadBtn').addEventListener('click', () => this.downloadCSV());

        // Display Mode
        document.querySelectorAll('input[name="displayMode"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.state.labelMode = e.target.value;
                this.updateVisualization();
            });
        });
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabName));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.toggle('active', content.id === `${tabName}Tab`));
        if (tabName === 'data' && this.table) this.table.render();
    }

    updateUI() {
        const { minYear, maxYear, currentYear, startYear } = this.state;

        ['timelineSlider', 'startYearSlider'].forEach(id => {
            const el = document.getElementById(id);
            el.min = minYear;
            el.max = maxYear;
        });

        document.getElementById('timelineSlider').value = currentYear;
        document.getElementById('startYearSlider').value = startYear;
        document.getElementById('minYear').textContent = minYear;
        document.getElementById('maxYear').textContent = maxYear;

        this.updateVisualization();
    }

    updateVisualization() {
        const events = this.state.getEventsUpToYear(this.state.currentYear);
        const treeData = this.builder.buildFromEvents(events);
        this.viz.render(treeData, this.state.currentYear, this.state.startYear);
        document.getElementById('currentYearDisplay').textContent = `${this.state.startYear} - ${this.state.currentYear}`;
    }

    previousEvent() { this.state.currentYear = this.state.getPreviousEventYear(); this.updateUI(); }
    nextEvent() { this.state.currentYear = this.state.getNextEventYear(); this.updateUI(); }

    togglePlay() {
        this.state.isPlaying = !this.state.isPlaying;
        const btn = document.getElementById('playBtn');
        btn.querySelector('#playIcon').textContent = this.state.isPlaying ? '⏸' : '▶';
        btn.querySelector('#playText').textContent = this.state.isPlaying ? 'Pause' : 'Play';

        if (this.state.isPlaying) {
            this.state.playInterval = setInterval(() => {
                if (this.state.currentYear >= this.state.maxYear) return this.togglePlay();
                this.state.currentYear++;
                this.updateUI();
            }, CONFIG.PLAYBACK_SPEED);
        } else {
            clearInterval(this.state.playInterval);
        }
    }

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            this.state.loadData(e.target.result);
            this.updateUI();
        };
        reader.readAsText(file);
    }

    downloadCSV() {
        const blob = new Blob([this.state.exportCSV()], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `family-history-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }
}
