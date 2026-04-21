import type { DayContent } from '@/types/content';

export const ageReversalDay1: DayContent = {
  programSlug: 'age_reversal',
  dayNumber: 1,
  dayTitle: 'Beginning the Journey',
  estimatedMinutes: 25,
  cards: [
    {
      type: 'intro',
      dayNumber: 1,
      dayTitle: 'Beginning the Journey',
      goal: 'Activate circulation, engage facial muscles, and establish a calm recovery rhythm',
      estimatedMinutes: 25,
      phase: 'Phase 1 · Foundation',
      params: [
        { value: '2', label: 'Sets' },
        { value: '3', label: 'Reps' },
        { value: '8 sec', label: 'Hold' },
        { value: '25 min', label: 'Total' },
      ],
    },
    {
      type: 'lesson',
      title: "Today's Focus",
      paragraphs: [
        'Today is about building the foundation. Gentle activation prepares your body and face for consistent progress.',
        'You will combine light movement, targeted facial holds, and calm breathing to stimulate circulation and recovery.',
        'Keep everything relaxed and controlled. The goal is consistency, not intensity.',
      ],
      highlight: 'Small, controlled actions today create visible results over time.',
    },
    {
      type: 'action_step',
      stepNumber: 1,
      title: 'Walking (Body Activation)',
      instructions: [
        'Take a 20-minute relaxed walk',
        'Keep your posture upright and shoulders relaxed',
        'Walk at a comfortable pace',
        'Breathe naturally through your nose if possible',
      ],
      whyThisWorks:
        'Improves blood circulation and delivers oxygen to facial tissues, preparing muscles for activation',
      proTip: 'Avoid rushing. A calm pace improves both circulation and mental clarity',
    },
    {
      type: 'exercise_routine',
      title: 'Facial Activation Routine',
      totalDuration: '5 min',
      exercises: [
        {
          name: 'Cheek Lift Hold',
          instructions: [
            'Sit comfortably with a straight back',
            'Smile as wide as possible',
            'Place fingertips lightly on top of cheeks',
            'Lift cheek muscles upward toward the eyes',
            'Hold firmly',
          ],
          reps: '2 sets × 3 reps',
          duration: '8 sec hold per rep',
          rest: '5–10 sec between reps',
        },
        {
          name: 'Jawline Pucker Hold',
          instructions: [
            'Sit or stand with a straight back',
            'Tilt your head slightly upward',
            'Pucker lips as if kissing the ceiling',
            'Feel the stretch under the jaw and neck',
            'Hold firmly',
          ],
          reps: '2 sets × 3 reps',
          duration: '8 sec hold per rep',
          rest: '5–10 sec between reps',
        },
      ],
    },
    {
      type: 'breathing_exercise',
      title: 'Calm Breathing',
      pattern: {
        inhaleSeconds: 4,
        holdSeconds: 0,
        exhaleSeconds: 6,
      },
      cycles: 20,
      instructions:
        'Sit quietly. Inhale slowly for 4 seconds and exhale gently for 6 seconds. Keep your body relaxed and your breathing smooth',
    },
    {
      type: 'action_step',
      stepNumber: 2,
      title: 'Sleep Preparation',
      instructions: [
        'Aim to sleep before 11 PM',
        'Turn off screens 30 minutes before bed',
        'Allow your body and mind to relax',
        'Maintain a consistent sleep schedule',
      ],
      whyThisWorks:
        'Deep sleep supports collagen production, muscle recovery, and hormonal balance',
      proTip: 'Dim the lights early to signal your body that it is time to wind down',
    },
    {
      type: 'lesson',
      title: 'Why This Works',
      paragraphs: [
        'Isometric holds activate the superficial muscular aponeurotic system, the same layer targeted in facial treatments.',
        'This stimulation signals fibroblasts to produce more collagen, improving firmness over time.',
        'Combined with circulation and recovery, this creates visible and sustainable results.',
      ],
      highlight: 'Consistency is what transforms activation into visible change.',
    },
    {
      type: 'close',
      message: "You've started. Keep it simple and stay consistent.",
      secondaryMessage: 'Tomorrow builds slightly more control.',
    },
  ],
};
