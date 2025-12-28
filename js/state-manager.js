export default class StateManager {
    constructor() {
        this.events = [];
        this.currentYear = 1990;
        this.minYear = 1950;
        this.maxYear = 2025;
        this.isPlaying = false;
        this.playInterval = null;
    }

    loadData(csvString) {
        this.events = this.parseCSV(csvString);
        this.calculateYearRange();
        this.sortEvents();
    }

    parseCSV(csvString) {
        const lines = csvString.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const events = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            const event = {};
            headers.forEach((header, index) => {
                event[header] = values[index] || '';
            });
            events.push(event);
        }

        return events;
    }

    calculateYearRange() {
        if (this.events.length === 0) return;

        const years = this.events.map(e => parseInt(e.year));
        this.minYear = Math.min(...years);
        this.maxYear = Math.max(...years);
        this.currentYear = this.minYear;
    }

    sortEvents() {
        this.events.sort((a, b) => parseInt(a.year) - parseInt(b.year));
    }

    getEventsUpToYear(year) {
        return this.events.filter(e => parseInt(e.year) <= year);
    }

    getEventYears() {
        return [...new Set(this.events.map(e => parseInt(e.year)))].sort((a, b) => a - b);
    }

    getPreviousEventYear() {
        const eventYears = this.getEventYears();
        const previousYears = eventYears.filter(y => y < this.currentYear);
        return previousYears.length > 0 ? previousYears[previousYears.length - 1] : this.minYear;
    }

    getNextEventYear() {
        const eventYears = this.getEventYears();
        const nextYears = eventYears.filter(y => y > this.currentYear);
        return nextYears.length > 0 ? nextYears[0] : this.maxYear;
    }

    exportCSV() {
        const headers = ['year', 'type', 'person', 'person2', 'person3', 'person_gender', 'person2_gender'];
        const rows = this.events.map(event =>
            headers.map(h => event[h] || '').join(',')
        );
        return [headers.join(','), ...rows].join('\n');
    }

    addEvent(event) {
        this.events.push(event);
        this.sortEvents();
        this.calculateYearRange();
    }

    updateEvent(index, event) {
        this.events[index] = event;
        this.sortEvents();
        this.calculateYearRange();
    }

    deleteEvent(index) {
        this.events.splice(index, 1);
        this.calculateYearRange();
    }
}
