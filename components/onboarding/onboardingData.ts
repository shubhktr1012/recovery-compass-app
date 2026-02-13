
export interface OnboardingItem {
    id: string;
    title: string;
    description: string;
    image: string; // Placeholder for now, can be an Illustration component key
}

export const ONBOARDING_DATA: OnboardingItem[] = [
    {
        id: '1',
        title: 'Navigate\nthe Urge',
        description: 'Master your cravings with real-time tools designed to regulate your nervous system.',
        image: 'compass',
    },
    {
        id: '2',
        title: 'Structured\nFreedom',
        description: 'A 6-day intensive program followed by 90 days of guided recovery.',
        image: 'path',
    },
    {
        id: '3',
        title: 'Your\nCompass',
        description: 'Track your progress, journal your journey, and find your way back to yourself.',
        image: 'journal',
    },
];
