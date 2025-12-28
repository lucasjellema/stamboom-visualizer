import { CONFIG } from './constants.js';

export default class UIController {
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
            // Assuming global 'app' object exists in window for these onclick handlers
            row.innerHTML = `
                <td>${event.year}</td>
                <td>${event.type}</td>
                <td>${event.person}</td>
                <td>${event.person2 || '-'}</td>
                <td>${event.person3 || '-'}</td>
                <td>${event.person_gender || '-'}</td>
                <td>${event.person2_gender || '-'}</td>
                <td class="table-actions">
                    <button class="table-action-btn" onclick="window.app.ui.editEvent(${index})">Edit</button>
                    <button class="table-action-btn delete" onclick="window.app.ui.deleteEvent(${index})">Delete</button>
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
