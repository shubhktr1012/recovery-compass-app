import type { DayContent } from '@/types/content';

export const sixDayResetDay1: DayContent = {
  programSlug: 'six_day_reset',
  dayNumber: 1,
  dayTitle: 'Decision & Environment Reset',
  estimatedMinutes: 10,
  cards: [
    {
      type: 'intro',
      dayNumber: 1,
      dayTitle: 'Decision & Environment Reset',
      goal: 'Break autopilot by making smoking conscious, inconvenient, and interruptible.',
      estimatedMinutes: 10,
    },
    {
      type: 'lesson',
      title: 'What Day 1 is really about',
      paragraphs: [
        'Most people think quitting fails because of weak willpower. Day 1 reframes the problem: smoking continues because it happens automatically and without friction.',
        'Today is not about forcing confidence. It is about breaking unconscious access so smoking cannot happen on autopilot.',
      ],
      highlight: 'If smoking requires effort and awareness, its power drops immediately.',
    },
    {
      type: 'action_step',
      stepNumber: 1,
      title: 'Make one decision, once',
      duration: '5 min',
      instructions: [
        'Say out loud: “I am stopping smoking. I do not need to feel confident. I do not need to feel ready.”',
        'Treat this as closure of debate for today, not a forever promise.',
      ],
      whyThisWorks: 'The goal is to stop renegotiating with each urge.',
      proTip: 'Do not wait for motivation before you start.',
    },
    {
      type: 'action_step',
      stepNumber: 2,
      title: 'Reset your environment',
      instructions: [
        'Throw away cigarettes, lighters, ashtrays, and any emergency stash.',
        'Remove the objects that let smoking happen without thought.',
      ],
      whyThisWorks: 'Access creates action. Removing access cuts the habit loop at its easiest point.',
    },
    {
      type: 'action_step',
      stepNumber: 3,
      title: 'Break one trigger routine',
      instructions: [
        'Pick one predictable smoking moment, like after coffee or during a work break.',
        'Replace it with a small interruption such as standing up immediately or walking for one minute.',
      ],
      proTip: 'One disrupted routine is enough for Day 1.',
    },
    {
      type: 'mindfulness_exercise',
      title: 'Use the urge interruption sequence',
      duration: '2-3 min',
      steps: [
        'Start a 10-minute timer and say: “I am not deciding now.”',
        'Name 5 things you can see.',
        'Name 3 things you can hear.',
        'Press your feet into the ground and let the urge pass through.',
      ],
      completionMessage: 'You interrupted the loop instead of obeying it.',
    },
    {
      type: 'journal',
      prompt: 'Which one trigger routine will you change today, and what will you do instead?',
      helperText: 'Keep it short. This is about clarity, not perfect writing.',
      followUpPrompt: 'What usually makes that moment automatic?',
    },
    {
      type: 'close',
      message: 'Today you made smoking conscious instead of automatic.',
      secondaryMessage: 'If you delayed even one urge and changed one routine, Day 1 worked.',
    },
  ],
};
