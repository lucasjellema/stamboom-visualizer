export default class FamilyTreeBuilder {
    constructor() {
        this.people = new Map();
        this.relationships = [];
    }

    buildFromEvents(events) {
        this.people.clear();
        this.relationships = [];

        events.forEach(event => {
            const year = parseInt(event.year); // Handle unused var lint if strict, but kept for clarity

            switch (event.type) {
                case 'birth':
                    this.handleBirth(event);
                    break;
                case 'death':
                    this.handleDeath(event);
                    break;
                case 'relationship_start':
                    this.handleRelationshipStart(event);
                    break;
                case 'relationship_end':
                    this.handleRelationshipEnd(event);
                    break;
            }
        });

        return {
            nodes: Array.from(this.people.values()),
            links: this.relationships
        };
    }

    handleBirth(event) {
        const person = event.person;
        const parent1 = event.person2;
        const parent2 = event.person3;
        const gender = event.person_gender;

        // Add the person being born
        if (!this.people.has(person)) {
            this.people.set(person, {
                id: person,
                name: person,
                gender: gender,
                isFamilyMember: true,
                birthYear: parseInt(event.year),
                deathYear: null,
                relationships: [],
                parents: [] // Store parents here instead of as links
            });
        }

        // Add parents if not already present
        if (parent1 && !this.people.has(parent1)) {
            this.people.set(parent1, {
                id: parent1,
                name: parent1,
                gender: '',
                isFamilyMember: true,
                birthYear: null,
                deathYear: null,
                relationships: [],
                parents: []
            });
        }

        if (parent2 && !this.people.has(parent2)) {
            this.people.set(parent2, {
                id: parent2,
                name: parent2,
                gender: '',
                isFamilyMember: false,
                birthYear: null,
                deathYear: null,
                relationships: [],
                parents: []
            });
        }

        // Store parent information on the child node
        const child = this.people.get(person);
        if (parent1) child.parents.push(parent1);
        if (parent2) child.parents.push(parent2);

        // DO NOT create parent-child relationship links
    }

    handleDeath(event) {
        const person = event.person;
        if (this.people.has(person)) {
            this.people.get(person).deathYear = parseInt(event.year);
        }
    }

    handleRelationshipStart(event) {
        const person1 = event.person;
        const person2 = event.person2;
        const gender2 = event.person2_gender;

        // Add person2 if not already present
        if (!this.people.has(person2)) {
            this.people.set(person2, {
                id: person2,
                name: person2,
                gender: gender2,
                isFamilyMember: false,
                birthYear: null,
                deathYear: null,
                relationships: []
            });
        }

        // Track relationship in person objects
        if (this.people.has(person1)) {
            this.people.get(person1).relationships.push({
                partner: person2,
                startYear: parseInt(event.year),
                endYear: null
            });
        }

        if (this.people.has(person2)) {
            this.people.get(person2).relationships.push({
                partner: person1,
                startYear: parseInt(event.year),
                endYear: null
            });
        }

        // Create relationship link
        this.relationships.push({
            source: person1,
            target: person2,
            type: 'relationship',
            startYear: parseInt(event.year),
            endYear: null,
            active: true
        });
    }

    handleRelationshipEnd(event) {
        const person1 = event.person;
        const person2 = event.person2;
        const endYear = parseInt(event.year);

        // Update relationship status in person objects
        if (this.people.has(person1)) {
            const rel = this.people.get(person1).relationships.find(r => r.partner === person2);
            if (rel) rel.endYear = endYear;
        }

        if (this.people.has(person2)) {
            const rel = this.people.get(person2).relationships.find(r => r.partner === person1);
            if (rel) rel.endYear = endYear;
        }

        // Update relationship link
        const link = this.relationships.find(r =>
            r.type === 'relationship' &&
            ((r.source === person1 && r.target === person2) ||
                (r.source === person2 && r.target === person1))
        );
        if (link) {
            link.endYear = endYear;
            link.active = false;
        }
    }
}
