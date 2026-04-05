import type { ProgramSlug } from '@/lib/programs/types';

import type {
  GenderOption,
  GuidedIssueId,
  JourneyConfig,
  JourneyKey,
  OnboardingPath,
  SecondarySymptomId,
  SelectionOption,
} from '@/lib/onboarding.types';

export const PATH_OPTIONS: SelectionOption<OnboardingPath>[] = [
  {
    id: 'self_select',
    label: 'I already know what I want',
    description: 'Choose the program you have in mind, then answer a few questions so we can tailor it.',
  },
  {
    id: 'guided_recommendation',
    label: 'Help me choose',
    description: 'Tell us your main issue and we will guide you to the best-fit program before the paywall.',
  },
];

export const GUIDED_ISSUE_OPTIONS: SelectionOption<GuidedIssueId>[] = [
  {
    id: 'cravings_smoking_urges',
    label: 'Cravings / smoking urges',
    description: 'You keep getting pulled back into smoking even when you want out.',
  },
  {
    id: 'poor_sleep',
    label: 'Poor sleep',
    description: 'You are not getting restful sleep or your sleep schedule feels broken.',
  },
  {
    id: 'low_energy',
    label: 'Low energy',
    description: 'Your day keeps running on caffeine, force, or survival mode.',
  },
  {
    id: 'brain_fog',
    label: 'Brain fog',
    description: 'Your thinking feels slower, flatter, or less sharp than it should.',
  },
  {
    id: 'stress_overload',
    label: 'Stress overload',
    description: 'Your body feels stuck in overdrive even when you try to slow down.',
  },
  {
    id: 'weight_gain_slowed_metabolism',
    label: 'Weight gain / slowed metabolism',
    description: 'Your body feels like it is storing stress and not recovering well.',
  },
  {
    id: 'low_libido_poor_performance',
    label: 'Low libido / poor performance',
    description: 'Confidence, desire, or sexual performance feel off right now.',
  },
];

export const SECONDARY_SYMPTOM_OPTIONS: SelectionOption<SecondarySymptomId>[] = [
  { id: 'cravings_smoking_urges', label: 'Cravings / smoking urges' },
  { id: 'poor_sleep', label: 'Poor sleep' },
  { id: 'low_energy', label: 'Low energy' },
  { id: 'brain_fog', label: 'Brain fog' },
  { id: 'stress_overload', label: 'Stress overload' },
  { id: 'weight_gain_slowed_metabolism', label: 'Weight gain / slowed metabolism' },
  { id: 'low_libido_poor_performance', label: 'Low libido / poor performance' },
];

const JOURNEY_ORDER: JourneyKey[] = [
  'smoking',
  'sleep_disorder_reset',
  'energy_vitality',
  'age_reversal',
  'male_sexual_health',
];

const JOURNEY_CONFIG: Record<JourneyKey, JourneyConfig> = {
  smoking: {
    selectionLabel: 'Quit Smoking',
    selectionDescription: 'Interrupt the craving loop and regain control without relying on pressure or perfection.',
    primaryGoal: 'Break the craving loop and rebuild calmer, more reliable control over smoking triggers.',
    recommendation: {
      title: 'Your smoking paths are ready.',
      subtitle: 'We recommend starting with a smoking program that interrupts urges and rebuilds control from the ground up.',
      whyFits:
        'Your main issue points to a nicotine loop driven by stress, habit timing, and environmental triggers, not just motivation.',
      focusLabel: 'What this path targets',
      focusPoints: [
        'Interrupt automatic smoking moments before they run the day.',
        'Lower the intensity of craving spikes with simple regulation tools.',
        'Build enough control to choose between a short reset or a longer guided quit path.',
      ],
    },
    questions: {
      friction: {
        id: 'smoking_friction',
        title: 'What about smoking is hurting you most right now?',
        description: 'Choose the one impact that feels most true in your day-to-day life.',
        type: 'single_select',
        required: true,
        options: [
          { id: 'controlled_by_cravings', label: 'Feeling controlled by cravings' },
          { id: 'hiding_from_family', label: 'The anxiety of hiding it from family or people close to me' },
          { id: 'stamina_drop', label: 'My stamina and breathing keep getting worse' },
          { id: 'health_crash_fear', label: 'The fear of a sudden health crash keeps following me' },
        ],
      },
      duration: {
        id: 'smoking_duration',
        title: 'How long has smoking been part of your routine?',
        description: 'This gives us history and context, not judgment.',
        type: 'single_select',
        required: true,
        options: [
          { id: 'under_1_year', label: 'Under 1 year' },
          { id: '1_3_years', label: '1-3 years' },
          { id: '3_10_years', label: '3-10 years' },
          { id: '10_plus_years', label: '10+ years' },
        ],
      },
      trigger: {
        id: 'smoking_trigger',
        title: 'When do urges hit hardest?',
        description: 'Pick the pattern that most often starts the loop.',
        type: 'single_select',
        required: true,
        options: [
          { id: 'work_stress', label: 'Work stress or meetings' },
          { id: 'post_meal', label: 'After meals' },
          { id: 'socializing_drinking', label: 'Socializing or drinking' },
          { id: 'morning_routine', label: 'First thing in the morning' },
        ],
      },
      severity: {
        id: 'smoking_daily_count',
        title: 'How many cigarettes do you smoke on an average day?',
        description: 'A rough number is enough. We just need your current baseline.',
        type: 'number_input',
        required: true,
        placeholder: 'Enter a number',
        keyboardType: 'number-pad',
      },
      coping: {
        id: 'smoking_coping',
        title: 'What do you usually rely on when you try to stop or slow down?',
        description: 'Choose the response that feels most familiar.',
        type: 'single_select',
        required: true,
        options: [
          { id: 'willpower', label: 'Pure willpower' },
          { id: 'vapes_or_gums', label: 'Vapes, gums, or replacements' },
          { id: 'distraction', label: 'I distract myself and hope the urge passes' },
          { id: 'delay_until_later', label: 'I tell myself I will deal with it later' },
        ],
      },
    },
  },
  sleep_disorder_reset: {
    selectionLabel: '21-Day Deep Sleep Reset',
    selectionDescription: 'Reset the body clock and nervous system so sleep starts feeling natural again.',
    primaryGoal: 'Restore consistent, deeper sleep by calming the nervous system and resetting the body clock.',
    recommendation: {
      title: '21-Day Deep Sleep Reset fits your current pattern.',
      subtitle: 'Your answers point to a sleep rhythm problem, not just a bad bedtime routine.',
      whyFits:
        'What you described is consistent with a body that is not getting the right cues for rest, recovery, and nighttime downshift.',
      focusLabel: 'What this path targets',
      focusPoints: [
        'Reset the timing signals that tell your body when to sleep.',
        'Reduce the overstimulation that keeps your mind active at night.',
        'Create steadier rest so mornings stop feeling like recovery from survival mode.',
      ],
    },
    questions: {
      friction: {
        id: 'sleep_friction',
        title: 'What bothers you most about your sleep right now?',
        description: 'Choose the part that is affecting you most day to day.',
        type: 'single_select',
        required: true,
        options: [
          { id: 'wake_exhausted', label: 'I wake up exhausted even after enough time in bed' },
          { id: 'fall_asleep_slowly', label: 'I take too long to fall asleep' },
          { id: 'wake_multiple_times', label: 'I wake up multiple times in the night' },
          { id: 'brain_wont_switch_off', label: 'My brain will not switch off at night' },
        ],
      },
      duration: {
        id: 'sleep_duration',
        title: 'How long has sleep been this unstable?',
        description: 'We are looking for pattern length, not the perfect answer.',
        type: 'single_select',
        required: true,
        options: [
          { id: 'few_weeks', label: 'A few weeks' },
          { id: 'few_months', label: 'A few months' },
          { id: '6_12_months', label: '6-12 months' },
          { id: 'over_year', label: 'More than a year' },
        ],
      },
      trigger: {
        id: 'sleep_trigger',
        title: 'What most often throws sleep off track?',
        description: 'Pick the one pattern that shows up most often.',
        type: 'single_select',
        required: true,
        options: [
          { id: 'late_stress', label: 'Late-night stress or planning tomorrow' },
          { id: 'phone_scrolling', label: 'Phone scrolling' },
          { id: 'irregular_schedule', label: 'An irregular sleep schedule' },
          { id: 'caffeine_stimulants', label: 'Caffeine, stimulants, or sleep aids' },
        ],
      },
      severity: {
        id: 'sleep_reliance_count',
        title: 'How many coffees, energy drinks, or sleep aids do you rely on in a day?',
        description: 'Count both the things keeping you going and the things helping you crash.',
        type: 'number_input',
        required: true,
        placeholder: 'Enter a number',
        keyboardType: 'number-pad',
      },
      coping: {
        id: 'sleep_coping',
        title: 'What do you usually rely on to get through it?',
        description: 'Choose the coping loop you fall back on most.',
        type: 'single_select',
        required: true,
        options: [
          { id: 'more_caffeine', label: 'More caffeine' },
          { id: 'sleep_aids', label: 'Melatonin, pills, or other sleep aids' },
          { id: 'naps', label: 'Naps whenever I can' },
          { id: 'push_through', label: 'I just push through and hope tonight is better' },
        ],
      },
    },
  },
  energy_vitality: {
    selectionLabel: '14-Day Energy Restore',
    selectionDescription: 'Rebuild daily energy, rhythm, and focus instead of living on caffeine and force.',
    primaryGoal: 'Restore steady daily energy by improving rhythm, recovery, and nervous-system load.',
    recommendation: {
      title: '14-Day Energy Restore is the best fit here.',
      subtitle: 'Your answers point to an energy system that needs rhythm, recovery, and consistency.',
      whyFits:
        'The core problem you described is not just tiredness. It is a daily rhythm problem that keeps draining energy faster than you can recover it.',
      focusLabel: 'What this path targets',
      focusPoints: [
        'Rebuild a steadier baseline so afternoons stop feeling like a crash.',
        'Use sunlight, movement, and recovery habits to make energy less fragile.',
        'Reduce the need to force productivity with caffeine, stress, or guilt.',
      ],
    },
    questions: {
      friction: {
        id: 'energy_friction',
        title: 'What is the biggest cost of low energy right now?',
        description: 'Pick the one impact that keeps showing up.',
        type: 'single_select',
        required: true,
        options: [
          { id: 'afternoon_crash', label: 'I crash hard in the afternoon' },
          { id: 'focus_disappears', label: 'My focus disappears too easily' },
          { id: 'workouts_impossible', label: 'Exercise or movement feels impossible to sustain' },
          { id: 'flat_unmotivated', label: 'I feel flat and unmotivated most days' },
        ],
      },
      duration: {
        id: 'energy_duration',
        title: 'How long has your energy felt off?',
        description: 'This helps us understand whether this is a short disruption or a deeper pattern.',
        type: 'single_select',
        required: true,
        options: [
          { id: 'few_weeks', label: 'A few weeks' },
          { id: 'few_months', label: 'A few months' },
          { id: '6_12_months', label: '6-12 months' },
          { id: 'over_year', label: 'More than a year' },
        ],
      },
      trigger: {
        id: 'energy_trigger',
        title: 'What seems to drain you the most?',
        description: 'Choose the lifestyle load that feels most accurate.',
        type: 'single_select',
        required: true,
        options: [
          { id: 'poor_sleep_rhythm', label: 'Poor sleep rhythm' },
          { id: 'screen_heavy_days', label: 'Screen-heavy workdays' },
          { id: 'stress_overthinking', label: 'Stress and overthinking' },
          { id: 'low_movement', label: 'Too little movement or sunlight' },
        ],
      },
      severity: {
        id: 'energy_screen_hours',
        title: 'How many hours a day are you at a desk or screen?',
        description: 'A rough estimate is enough.',
        type: 'single_select',
        required: true,
        options: [
          { id: 'under_4', label: 'Under 4 hours' },
          { id: '4_6', label: '4-6 hours' },
          { id: '6_8', label: '6-8 hours' },
          { id: '8_plus', label: '8+ hours' },
        ],
      },
      coping: {
        id: 'energy_coping',
        title: 'What do you currently rely on to push through?',
        description: 'Choose the one that feels most familiar.',
        type: 'single_select',
        required: true,
        options: [
          { id: 'coffee_energy_drinks', label: 'Coffee or energy drinks' },
          { id: 'sugar_snacking', label: 'Sugar or constant snacking' },
          { id: 'scrolling_reset', label: 'Scrolling to mentally reset' },
          { id: 'force_through', label: 'I just force myself through the day' },
        ],
      },
    },
  },
  age_reversal: {
    selectionLabel: '90-Day Biohacking Reset',
    selectionDescription: 'Restore energy, resilience, and recovery when your body feels older than it should.',
    primaryGoal: 'Reduce hidden stress load and rebuild steadier energy, clarity, and biological resilience.',
    recommendation: {
      title: '90-Day Biohacking Reset is the strongest fit.',
      subtitle: 'Your answers point to stress-driven wear and tear, not just a temporary rough patch.',
      whyFits:
        'The combination of stress load, brain fog, and slowed recovery suggests a system that needs calmer rhythms and better recovery signals.',
      focusLabel: 'What this path targets',
      focusPoints: [
        'Lower hidden stress load so your body can stop living in constant overdrive.',
        'Rebuild daily rhythm to support steadier energy, focus, and recovery.',
        'Create routines that help you feel sharper and less biologically taxed.',
      ],
    },
    questions: {
      friction: {
        id: 'age_friction',
        title: 'What feels most off in your body right now?',
        description: 'Choose the one signal that feels most important.',
        type: 'single_select',
        required: true,
        options: [
          { id: 'brain_fog', label: 'Brain fog' },
          { id: 'hidden_stress', label: 'Hidden stress that never really switches off' },
          { id: 'stubborn_weight', label: 'Stubborn weight gain or metabolic slowdown' },
          { id: 'feel_older', label: 'I feel older than I should for my age' },
        ],
      },
      duration: {
        id: 'age_duration',
        title: 'How long has this been building?',
        description: 'Pick the time span that feels closest.',
        type: 'single_select',
        required: true,
        options: [
          { id: 'few_months', label: 'A few months' },
          { id: '1_3_years', label: '1-3 years' },
          { id: '3_5_years', label: '3-5 years' },
          { id: 'over_5_years', label: 'More than 5 years' },
        ],
      },
      trigger: {
        id: 'age_trigger',
        title: 'What in your lifestyle feels hardest to recover from?',
        description: 'Choose the drain that keeps repeating.',
        type: 'single_select',
        required: true,
        options: [
          { id: 'always_on_stress', label: 'Always-on stress' },
          { id: 'screen_heavy_days', label: 'Screen-heavy days' },
          { id: 'poor_sleep', label: 'Poor sleep and restless nights' },
          { id: 'irregular_routine', label: 'Irregular meals, timing, or daily structure' },
        ],
      },
      severity: {
        id: 'age_screen_hours',
        title: 'How many hours a day are you looking at a screen?',
        description: 'A rough estimate is enough.',
        type: 'single_select',
        required: true,
        options: [
          { id: 'under_4', label: 'Under 4 hours' },
          { id: '4_6', label: '4-6 hours' },
          { id: '6_8', label: '6-8 hours' },
          { id: '8_plus', label: '8+ hours' },
        ],
      },
      coping: {
        id: 'age_coping',
        title: 'What do you usually rely on to survive the day?',
        description: 'Choose the pattern that feels most true.',
        type: 'single_select',
        required: true,
        options: [
          { id: 'endless_caffeine', label: 'Endless caffeine' },
          { id: 'sleeping_pills', label: 'Melatonin or sleeping pills' },
          { id: 'scrolling_numb', label: 'Scrolling to numb the brain' },
          { id: 'crash_diets', label: 'Crash diets or extreme fixes' },
        ],
      },
    },
  },
  male_sexual_health: {
    selectionLabel: "30-Day Men's Vitality Reset",
    selectionDescription: 'Support confidence, control, and physical vitality with steady, body-based routines.',
    primaryGoal: 'Restore confidence and physical vitality through steadier routines, lower stress, and better regulation.',
    recommendation: {
      title: "30-Day Men's Vitality Reset is the best fit.",
      subtitle: 'Your answers point to a confidence and regulation problem, not something that will improve through avoidance.',
      whyFits:
        'The pattern you described suggests a need for calmer stress responses, stronger body awareness, and steadier daily habits.',
      focusLabel: 'What this path targets',
      focusPoints: [
        'Reduce performance pressure and anxiety around the issue.',
        'Support circulation, regulation, and steady physical confidence.',
        'Build routines that improve vitality over time instead of chasing quick fixes.',
      ],
    },
    questions: {
      friction: {
        id: 'male_friction',
        title: 'What about this is affecting you most?',
        description: 'Pick the impact that feels most honest right now.',
        type: 'single_select',
        required: true,
        options: [
          { id: 'low_confidence', label: 'It is affecting my confidence' },
          { id: 'low_desire', label: 'Low desire or low interest' },
          { id: 'performance_anxiety', label: 'Performance anxiety' },
          { id: 'physically_off', label: 'I just feel physically off' },
        ],
      },
      duration: {
        id: 'male_duration',
        title: 'How long has this been affecting you?',
        description: 'Pick the time span that feels closest.',
        type: 'single_select',
        required: true,
        options: [
          { id: 'few_weeks', label: 'A few weeks' },
          { id: 'few_months', label: 'A few months' },
          { id: '6_12_months', label: '6-12 months' },
          { id: 'over_year', label: 'More than a year' },
        ],
      },
      trigger: {
        id: 'male_trigger',
        title: 'What seems most connected to it?',
        description: 'Choose the pattern that feels most familiar.',
        type: 'single_select',
        required: true,
        options: [
          { id: 'stress_anxiety', label: 'Stress and anxiety' },
          { id: 'poor_sleep', label: 'Poor sleep' },
          { id: 'overstimulation', label: 'Porn or overstimulation' },
          { id: 'low_movement', label: 'Low movement and poor daily routine' },
        ],
      },
      severity: {
        id: 'male_frequency',
        title: 'How often does this affect you in a typical week?',
        description: 'Pick the closest pattern.',
        type: 'single_select',
        required: true,
        options: [
          { id: '1_2', label: '1-2 times' },
          { id: '3_4', label: '3-4 times' },
          { id: '5_plus', label: '5+ times' },
          { id: 'almost_daily', label: 'Almost every day' },
        ],
      },
      coping: {
        id: 'male_coping',
        title: 'What do you usually do right now?',
        description: 'Choose the default response you fall back on.',
        type: 'single_select',
        required: true,
        options: [
          { id: 'ignore_it', label: 'Ignore it and hope it improves' },
          { id: 'search_quick_fixes', label: 'Search for quick fixes online' },
          { id: 'avoid_situations', label: 'Avoid situations that bring it up' },
          { id: 'push_through', label: 'Push through without changing much' },
        ],
      },
    },
  },
};

export function getJourneyConfig(journey: JourneyKey): JourneyConfig {
  return JOURNEY_CONFIG[journey];
}

export function getSelfSelectOptions(gender: GenderOption | '') {
  return JOURNEY_ORDER.filter((journey) => (journey === 'male_sexual_health' ? gender === 'Male' : true)).map(
    (journey) => ({
      id: journey,
      label: JOURNEY_CONFIG[journey].selectionLabel,
      description: JOURNEY_CONFIG[journey].selectionDescription,
    })
  );
}

export function getGuidedIssueOptions(gender: GenderOption | '') {
  return GUIDED_ISSUE_OPTIONS.filter((option) =>
    option.id === 'low_libido_poor_performance' ? gender === 'Male' : true
  );
}

export function getSecondarySymptomOptions(
  gender: GenderOption | '',
  excludedIssueId?: GuidedIssueId | null
) {
  return SECONDARY_SYMPTOM_OPTIONS.filter((option) => {
    if (option.id === 'low_libido_poor_performance' && gender !== 'Male') {
      return false;
    }

    if (excludedIssueId && option.id === excludedIssueId) {
      return false;
    }

    return true;
  });
}

export function getGuidedJourney(issueId: GuidedIssueId): JourneyKey {
  switch (issueId) {
    case 'cravings_smoking_urges':
      return 'smoking';
    case 'poor_sleep':
      return 'sleep_disorder_reset';
    case 'low_energy':
      return 'energy_vitality';
    case 'brain_fog':
    case 'stress_overload':
    case 'weight_gain_slowed_metabolism':
      return 'age_reversal';
    case 'low_libido_poor_performance':
      return 'male_sexual_health';
  }
}

export function getRecommendedProgramForJourney(journey: JourneyKey): ProgramSlug {
  return journey === 'smoking' ? 'six_day_reset' : journey;
}

export function getGuidedIssueLabel(issueId: GuidedIssueId | null) {
  if (!issueId) return null;
  return GUIDED_ISSUE_OPTIONS.find((option) => option.id === issueId)?.label ?? null;
}
