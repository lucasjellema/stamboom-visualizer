export const CONFIG = {
    NODE_RADIUS: 25,
    VERTICAL_SPACING: 150,
    HORIZONTAL_SPACING: 200,
    ANIMATION_DURATION: 500,
    PLAYBACK_SPEED: 500, // ms per year
    COLORS: {
        familyAlive: '#10b981',
        familyDead: '#94a3b8',
        nonFamilyActive: '#3b82f6',
        nonFamilyInactive: '#f59e0b',
        nonFamilyDead: '#ef4444'
    },
    GENDER_ICONS: {
        male: '♂',
        female: '♀',
        'non-binary': '⚧'
    }
};

export const MOCK_CSV_DATA = `year,type,person,person2,person3,person_gender,person2_gender
1950,birth,John,,,,male
1952,birth,Mary,,,,female
1975,relationship_start,John,Sarah,,male,female
1977,birth,Alice,John,Sarah,female,
1980,birth,Bob,John,Sarah,male,
1995,relationship_end,John,Sarah,,male,female
1998,relationship_start,Alice,Michael,,female,male
2000,birth,Emma,Alice,Michael,female,
2005,relationship_start,Bob,Jennifer,,male,female
2008,birth,Lucas,Bob,Jennifer,male,
2010,birth,Sophia,Bob,Jennifer,female,
2015,death,John,,,,male
2020,relationship_start,Emma,David,,female,male
2025,birth,Oliver,Emma,David,male,`;
