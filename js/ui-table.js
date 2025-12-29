/**
 * Manages the data table and event modal
 */
export default class UITable {
    constructor(state, ui) {
        this.state = state;
        this.ui = ui;
        this.editingIndex = null;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        document.getElementById('addRowBtn').addEventListener('click', () => this.openModal());
        document.getElementById('modalClose').addEventListener('click', () => this.closeModal());
        document.getElementById('cancelBtn').addEventListener('click', () => this.closeModal());
        document.getElementById('eventForm').addEventListener('submit', (e) => this.handleSubmit(e));
        document.getElementById('eventType').addEventListener('change', (e) => this.updateFields(e.target.value));
        document.getElementById('eventModal').addEventListener('click', (e) => {
            if (e.target.id === 'eventModal') this.closeModal();
        });
    }

    render() {
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
                <td>${event.person2_year || '-'}</td>
                <td title="${event.description || ''}">${event.description ? (event.description.length > 30 ? event.description.substring(0, 30) + '...' : event.description) : '-'}</td>
                <td class="table-actions">
                    <button class="table-action-btn" onclick="app.ui.table.editEvent(${index})">Edit</button>
                    <button class="table-action-btn delete" onclick="app.ui.table.deleteEvent(${index})">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    openModal(data = null, index = null) {
        this.editingIndex = index;
        const form = document.getElementById('eventForm');

        if (data) {
            document.getElementById('modalTitle').textContent = 'Edit Event';
            ['year', 'type', 'person', 'person2', 'person3', 'description'].forEach(field => {
                document.getElementById(`event${field.charAt(0).toUpperCase() + field.slice(1)}`).value = data[field] || '';
            });
            document.getElementById('eventGender').value = data.person_gender || '';
            document.getElementById('eventGender2').value = data.person2_gender || '';
            document.getElementById('eventPerson2Year').value = data.person2_year || '';
            this.updateFields(data.type);
        } else {
            document.getElementById('modalTitle').textContent = 'Add Event';
            form.reset();
            this.updateFields('');
        }
        document.getElementById('eventModal').classList.add('active');
    }

    closeModal() {
        document.getElementById('eventModal').classList.remove('active');
        document.getElementById('eventForm').reset();
        this.editingIndex = null;
    }

    updateFields(type) {
        const groups = {
            person2: document.getElementById('person2Group'),
            person3: document.getElementById('person3Group'),
            gender: document.getElementById('genderGroup'),
            gender2: document.getElementById('gender2Group'),
            year2: document.getElementById('person2YearGroup')
        };

        Object.values(groups).forEach(el => el.style.display = 'block');

        if (type === 'birth') {
            groups.gender2.style.display = 'none';
            groups.year2.style.display = 'none';
        } else if (type === 'death') {
            ['person2', 'person3', 'gender2', 'year2'].forEach(k => groups[k].style.display = 'none');
        } else if (type === 'relationship_start') {
            groups.person3.style.display = 'none';
        } else if (type === 'relationship_end') {
            ['person3', 'gender', 'gender2', 'year2'].forEach(k => groups[k].style.display = 'none');
        }
    }

    handleSubmit(e) {
        e.preventDefault();
        const data = {
            year: document.getElementById('eventYear').value,
            type: document.getElementById('eventType').value,
            person: document.getElementById('eventPerson').value,
            person2: document.getElementById('eventPerson2').value,
            person3: document.getElementById('eventPerson3').value,
            person_gender: document.getElementById('eventGender').value,
            person2_gender: document.getElementById('eventGender2').value,
            person2_year: document.getElementById('eventPerson2Year').value,
            description: document.getElementById('eventDescription').value
        };

        if (this.editingIndex !== null) this.state.updateEvent(this.editingIndex, data);
        else this.state.addEvent(data);

        this.ui.updateUI();
        this.closeModal();
        if (document.querySelector('.tab-btn[data-tab="data"]').classList.contains('active')) this.render();
    }

    editEvent(index) { this.openModal(this.state.events[index], index); }

    deleteEvent(index) {
        if (confirm('Are you sure you want to delete this event?')) {
            this.state.deleteEvent(index);
            this.render();
            this.ui.updateUI();
        }
    }
}
