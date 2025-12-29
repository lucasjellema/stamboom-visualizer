export default class FamilyTreeBuilder {
    constructor() {
        this.people = new Map();
        this.relationships = [];
    }

    buildFromEvents(events) {
        this.people.clear();
        this.relationships = [];

        events.forEach(event => {
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
        const description = event.description;
        const birthYear = parseInt(event.year);

        // Add the person being born
        if (!this.people.has(person)) {
            this.people.set(person, {
                id: person,
                name: person,
                gender: gender,
                isFamilyMember: true,
                birthYear: birthYear,
                deathYear: null,
                relationships: [],
                parents: [],
                descriptions: description ? [description] : []
            });
        } else {
            const p = this.people.get(person);
            if (!p.birthYear) p.birthYear = birthYear;
            if (gender && !p.gender) p.gender = gender;
            if (description) p.descriptions.push(description);
        }

        // Add parents if not already present
        [parent1, parent2].forEach((parent, index) => {
            if (parent && !this.people.has(parent)) {
                this.people.set(parent, {
                    id: parent,
                    name: parent,
                    gender: '',
                    isFamilyMember: index === 0, // First parent usually family
                    birthYear: null,
                    deathYear: null,
                    relationships: [],
                    parents: [],
                    descriptions: []
                });
            }
        });

        // Store parent information on the child node
        const child = this.people.get(person);
        if (parent1) child.parents.push(parent1);
        if (parent2) child.parents.push(parent2);
    }

    handleDeath(event) {
        const person = event.person;
        const description = event.description;
        if (this.people.has(person)) {
            const p = this.people.get(person);
            p.deathYear = parseInt(event.year);
            if (description) p.descriptions.push(description);
        }
    }

    handleRelationshipStart(event) {
        const person1 = event.person;
        const person2 = event.person2;
        const gender2 = event.person2_gender;
        const birthYear2 = event.person2_year ? parseInt(event.person2_year) : null;
        const description = event.description;
        const startYear = parseInt(event.year);

        // Add person2 if not already present
        if (!this.people.has(person2)) {
            this.people.set(person2, {
                id: person2,
                name: person2,
                gender: gender2,
                isFamilyMember: false,
                birthYear: birthYear2,
                deathYear: null,
                relationships: [],
                descriptions: []
            });
        } else {
            const p2 = this.people.get(person2);
            if (birthYear2 && !p2.birthYear) p2.birthYear = birthYear2;
            if (gender2 && !p2.gender) p2.gender = gender2;
        }

        if (description && this.people.has(person1)) {
            this.people.get(person1).descriptions.push(description);
        }

        // Track relationship in person objects
        [person1, person2].forEach((pId, idx) => {
            const otherId = idx === 0 ? person2 : person1;
            if (this.people.has(pId)) {
                this.people.get(pId).relationships.push({
                    partner: otherId,
                    startYear: startYear,
                    endYear: null
                });
            }
        });

        // Create relationship link
        this.relationships.push({
            source: person1,
            target: person2,
            type: 'relationship',
            startYear: startYear,
            endYear: null,
            active: true
        });
    }

    handleRelationshipEnd(event) {
        const person1 = event.person;
        const person2 = event.person2;
        const endYear = parseInt(event.year);

        [person1, person2].forEach(pId => {
            if (this.people.has(pId)) {
                const otherId = pId === person1 ? person2 : person1;
                const rel = this.people.get(pId).relationships.find(r => r.partner === otherId);
                if (rel) rel.endYear = endYear;
            }
        });

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
