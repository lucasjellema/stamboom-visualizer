export default class StateManager {
    constructor() {
        this.events = [];
        this.currentYear = 1990;
        this.startYear = 1950;
        this.minYear = 1950;
        this.maxYear = 2025;
        this.isPlaying = false;
        this.playInterval = null;
        this.labelMode = 'years'; // 'years' or 'age'
    }

    loadData(csvString) {
        this.events = this.parseCSV(csvString);
        this.calculateYearRange();
        this.sortEvents();
    }

    parseCSV(csvString) {
        if (!csvString) return [];
        const lines = csvString.trim().split('\n');
        if (lines.length < 2) return [];

        const headers = lines[0].split(',').map(h => h.trim());
        const events = [];

        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            const event = {};
            headers.forEach((header, index) => {
                event[header] = values[index] || '';
            });
            events.push(event);
        }

        return events;
    }

    /**
     * Simple CSV line parser that handles quoted values with commas
     */
    parseCSVLine(line) {
        const result = [];
        let curValue = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(curValue.trim());
                curValue = '';
            } else {
                curValue += char;
            }
        }
        result.push(curValue.trim());
        return result;
    }

    calculateYearRange() {
        if (this.events.length === 0) return;

        const years = this.events.map(e => parseInt(e.year));
        this.minYear = Math.min(...years);
        this.maxYear = Math.max(...years);
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
        const headers = ['year', 'type', 'person', 'person2', 'person3', 'person_gender', 'person2_gender', 'person2_year', 'description'];
        const rows = this.events.map(event =>
            headers.map(h => {
                const val = event[h] || '';
                // Quote values that contain commas
                return val.toString().includes(',') ? `"${val}"` : val;
            }).join(',')
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
