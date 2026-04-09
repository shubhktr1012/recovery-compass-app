
export interface OnboardingItem {
    id: string;
    title: string;
    description: string;
    image: string;
    eyebrow: string;
    accent: string;
}

export const ONBOARDING_DATA: OnboardingItem[] = [
    {
        id: '1',
        title: 'Navigate\nthe Urge',
        description: 'Master your cravings with real-time tools designed to regulate your nervous system.',
        image: 'compass',
        eyebrow: 'Awareness',
        accent: 'Steady in the moment',
    },
    {
        id: '2',
        title: 'Structured\nFreedom',
        description: 'A 6-day intensive program followed by 90 days of guided recovery.',
        image: 'path',
        eyebrow: 'Regulation',
        accent: 'A calmer daily rhythm',
    },
    {
        id: '3',
        title: 'Your\nCompass',
        description: 'Track your progress, journal your journey, and find your way back to yourself.',
        image: 'journal',
        eyebrow: 'Momentum',
        accent: 'Quiet proof of progress',
    },
];
