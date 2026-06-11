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
    label: 'Smoking / drinking urges',
    description: 'You keep getting pulled back into smoking, alcohol, or both even when you want out.',
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
  {
    id: 'gut_discomfort',
    label: 'Gut discomfort',
    description: 'Bloating, heaviness, irregularity, or food sensitivity keeps showing up.',
  },
];

export const SECONDARY_SYMPTOM_OPTIONS: SelectionOption<SecondarySymptomId>[] = [
  { id: 'cravings_smoking_urges', label: 'Smoking / drinking urges' },
  { id: 'poor_sleep', label: 'Poor sleep' },
  { id: 'low_energy', label: 'Low energy' },
  { id: 'brain_fog', label: 'Brain fog' },
  { id: 'stress_overload', label: 'Stress overload' },
  { id: 'weight_gain_slowed_metabolism', label: 'Weight gain / slowed metabolism' },
  { id: 'low_libido_poor_performance', label: 'Low libido / poor performance' },
  { id: 'gut_discomfort', label: 'Gut discomfort' },
];

const JOURNEY_ORDER: JourneyKey[] = [
  'smoking',
  'sleep_disorder_reset',
  'energy_vitality',
  'age_reversal',
  'male_sexual_health',
  'gut_health_reset',
];

function createStartReasonQuestion(idPrefix: string) {
  return {
    id: `${idPrefix}_start_reason`,
    title: 'Why are you starting this now?',
    description: 'Choose one reason, write your own, or skip this for now. We will keep it as your personal anchor.',
    type: 'single_select' as const,
    required: false,
    allowEmpty: true,
    customOptionId: 'custom_reason',
    customInputId: `${idPrefix}_start_reason_custom`,
    customInputLabel: 'YOUR REASON',
    customInputPlaceholder: 'Write one honest sentence...',
    options: [
      { id: 'control_again', label: 'I want to feel in control again' },
      { id: 'health_energy', label: 'I want better health and energy' },
      { id: 'stop_hiding', label: 'I want to stop hiding this from people close to me' },
      { id: 'feel_like_myself', label: 'I want to feel like myself again' },
      { id: 'custom_reason', label: 'I will write my own reason' },
    ],
  };
}

const JOURNEY_CONFIG: Record<JourneyKey, JourneyConfig> = {
  smoking: {
    selectionLabel: 'Smoking & Alcohol Quit',
    selectionDescription: 'Interrupt the smoking, alcohol, or combined craving loop with a structured 21-day path.',
    primaryGoal: 'Break the craving loop and rebuild calmer, more reliable control over smoking or drinking triggers.',
    recommendation: {
      title: 'Smoking & Alcohol Quit fits your current pattern.',
      subtitle: 'We recommend the 21-day quit program that maps your triggers, builds urge tools, and supports slip recovery.',
      whyFits:
        'Your main issue points to a substance loop driven by stress, habit timing, emotional cues, and environment, not just motivation.',
      focusLabel: 'What this path targets',
      focusPoints: [
        'Interrupt automatic smoking or drinking moments before they run the day.',
        'Lower the intensity of craving spikes with simple regulation tools.',
        'Build a 21-day quit structure with honesty, replacement practices, and relapse prevention.',
      ],
    },
    questions: {
      friction: {
        id: 'smoking_friction',
        title: 'What about smoking or drinking is hurting you most right now?',
        description: 'Choose the one impact that feels most true in your day-to-day life.',
        type: 'single_select',
        required: true,
        options: [
          { id: 'controlled_by_cravings', label: 'Feeling controlled by cravings' },
          { id: 'hiding_from_family', label: 'The anxiety of hiding it from people close to me' },
          { id: 'body_energy_drop', label: 'My body, energy, or sleep keeps getting worse' },
          { id: 'health_crash_fear', label: 'The fear of a sudden health crash keeps following me' },
        ],
      },
      duration: {
        id: 'smoking_duration',
        title: 'How long has this habit been part of your routine?',
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
      lifestyle: {
        id: 'smoking_disconnect',
        title: 'Does your current lifestyle give you space to disconnect from habit cues?',
        description: 'This helps us understand how much automatic pressure surrounds the habit.',
        type: 'single_select',
        required: true,
        options: [
          { id: 'yes_easily', label: 'Yes, I can disconnect when I need to' },
          { id: 'sometimes', label: 'Sometimes, but stress pulls me back' },
          { id: 'always_on', label: 'No, the cues are around me all day' },
          { id: 'socially_embedded', label: 'It is tied into my social routine' },
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
        id: 'smoking_baseline',
        title: 'Tell us about your daily habit.',
        description: 'Provide your typical daily count and spend. Use cigarettes, drinks, or combined episodes.',
        type: 'compound_number_input',
        required: true,
        inputs: [
          { id: 'smoking_daily_count', label: 'Uses per day', placeholder: 'Count' },
          { id: 'smoking_daily_spend', label: 'Daily spend', placeholder: 'Amount in INR' }
        ]
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
      outcome: {
        id: 'smoking_outcome',
        title: 'Which outcome do you need most right now?',
        description: 'This helps us understand the kind of control you want from the 21-day path.',
        type: 'single_select',
        required: true,
        options: [
          { id: 'immediate_control', label: 'I need immediate control over urges' },
          { id: 'full_quit_longer_path', label: 'I want to fully quit with a guided path' },
          { id: 'not_sure', label: 'I am not sure yet' },
        ],
      },
      startReason: createStartReasonQuestion('smoking'),
    },
  },
  sleep_disorder_reset: {
    selectionLabel: 'Deep Sleep Reset',
    selectionDescription: 'Reset the body clock and nervous system so sleep starts feeling natural again.',
    primaryGoal: 'Restore consistent, deeper sleep by calming the nervous system and resetting the body clock.',
    recommendation: {
      title: 'Deep Sleep Reset fits your current pattern.',
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
      lifestyle: {
        id: 'sleep_disconnect',
        title: 'Does your current lifestyle allow you to truly downshift at night?',
        description: 'This tells us whether sleep is mainly a timing issue, a stress issue, or both.',
        type: 'single_select',
        required: true,
        options: [
          { id: 'yes_easily', label: 'Yes, I can switch off most nights' },
          { id: 'sometimes', label: 'Sometimes, but not consistently' },
          { id: 'always_on', label: 'No, I am always mentally on' },
          { id: 'schedule_chaotic', label: 'My schedule keeps changing too much' },
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
        id: 'sleep_affected_nights',
        title: 'How many nights a week does this usually affect you?',
        description: 'Pick the closest pattern.',
        type: 'single_select',
        required: true,
        options: [
          { id: '1_2', label: '1-2 nights' },
          { id: '3_4', label: '3-4 nights' },
          { id: '5_6', label: '5-6 nights' },
          { id: 'almost_every_night', label: 'Almost every night' },
        ],
      },
      baseline: [
        {
          id: 'sleep_reliance_count',
          title: 'How many coffees, energy drinks, or sleep aids do you rely on in a day?',
          description: 'Count both the things keeping you going and the things helping you crash.',
          type: 'number_input',
          minValue: 0,
          required: true,
          placeholder: 'Enter a number',
          keyboardType: 'number-pad',
        },
      ],
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
      startReason: createStartReasonQuestion('sleep'),
    },
  },
  energy_vitality: {
    selectionLabel: 'Energy Restore',
    selectionDescription: 'Rebuild daily energy, rhythm, and focus instead of living on caffeine and force.',
    primaryGoal: 'Restore steady daily energy by improving rhythm, recovery, and nervous-system load.',
    recommendation: {
      title: 'Energy Restore is the best fit here.',
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
      lifestyle: {
        id: 'energy_crash_timing',
        title: 'When does your energy crash hardest?',
        description: 'This gives us a baseline for the daily rhythm we need to rebuild.',
        type: 'single_select',
        required: true,
        options: [
          { id: 'morning', label: 'Morning' },
          { id: 'afternoon', label: 'Afternoon' },
          { id: 'evening', label: 'Evening' },
          { id: 'all_day', label: 'It feels low all day' },
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
      baseline: [
        {
          id: 'energy_caffeine_count',
          title: 'How many coffees or energy drinks do you rely on daily?',
          description: 'A rough daily count is enough.',
          type: 'number_input',
          minValue: 0,
          required: true,
          placeholder: 'Enter a number',
          keyboardType: 'number-pad',
        },
      ],
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
      startReason: createStartReasonQuestion('energy'),
    },
  },
  age_reversal: {
    selectionLabel: 'Age Well',
    selectionDescription: 'Restore energy, resilience, and recovery when your body feels older than it should.',
    primaryGoal: 'Reduce hidden stress load and rebuild steadier energy, clarity, and biological resilience.',
    recommendation: {
      title: 'Age Well is the strongest fit.',
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
      lifestyle: {
        id: 'age_disconnect',
        title: 'Does your current lifestyle allow you to truly disconnect?',
        description: 'This is a core signal for hidden stress load and recovery strain.',
        type: 'single_select',
        required: true,
        options: [
          { id: 'yes_easily', label: 'Yes, easily' },
          { id: 'sometimes', label: 'Sometimes' },
          { id: 'always_on', label: 'No, I am always on' },
          { id: 'only_when_exhausted', label: 'Only when I completely crash' },
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
      startReason: createStartReasonQuestion('age'),
    },
  },
  male_sexual_health: {
    selectionLabel: "Men’s Vitality Reset",
    selectionDescription: 'Support confidence, control, and physical vitality with steady, body-based routines.',
    primaryGoal: 'Restore confidence and physical vitality through steadier routines, lower stress, and better regulation.',
    recommendation: {
      title: "Men’s Vitality Reset is the best fit.",
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
      lifestyle: {
        id: 'male_lifestyle_load',
        title: 'How much daily pressure is your body carrying right now?',
        description: 'This keeps the question private while still giving us useful context.',
        type: 'single_select',
        required: true,
        options: [
          { id: 'low', label: 'Low, my routine is fairly steady' },
          { id: 'moderate', label: 'Moderate, stress comes and goes' },
          { id: 'high', label: 'High, I feel tense most days' },
          { id: 'very_high', label: 'Very high, I rarely feel fully relaxed' },
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
      startReason: createStartReasonQuestion('male'),
    },
  },
  gut_health_reset: {
    selectionLabel: 'Gut Reset',
    selectionDescription: 'Reset bloating, heaviness, and eating rhythm with a structured daily gut-health path.',
    primaryGoal: 'Rebuild gut comfort and daily digestive rhythm through hydration, food timing, movement, and calm regulation.',
    recommendation: {
      title: 'Gut Reset fits your current pattern.',
      subtitle: 'Your answers point to a gut rhythm problem that needs consistency, not random food rules.',
      whyFits:
        'Bloating, heaviness, irregularity, and food sensitivity often get worse when meals, stress, hydration, and movement are inconsistent.',
      focusLabel: 'What this path targets',
      focusPoints: [
        'Reduce daily gut discomfort by rebuilding steady hydration and meal timing.',
        'Use gentle movement and breathing to support digestion instead of forcing strict diets.',
        'Create a 21-day reset that is practical enough to repeat when your routine gets disrupted.',
      ],
    },
    questions: {
      friction: {
        id: 'gut_friction',
        title: 'What is the biggest gut issue showing up right now?',
        description: 'Choose the one that affects your day most often.',
        type: 'single_select',
        required: true,
        options: [
          { id: 'bloating_heaviness', label: 'Bloating or heaviness after meals' },
          { id: 'irregular_bowels', label: 'Irregular bowel routine' },
          { id: 'food_sensitivity', label: 'Food sensitivity or uncertainty' },
          { id: 'low_appetite_energy', label: 'Low appetite, energy, or comfort' },
        ],
      },
      duration: {
        id: 'gut_duration',
        title: 'How long has your gut felt off?',
        description: 'Pick the closest timeline.',
        type: 'single_select',
        required: true,
        options: [
          { id: 'few_weeks', label: 'A few weeks' },
          { id: 'few_months', label: 'A few months' },
          { id: '6_12_months', label: '6-12 months' },
          { id: 'over_year', label: 'More than a year' },
        ],
      },
      lifestyle: {
        id: 'gut_routine',
        title: 'How consistent are your meals and hydration right now?',
        description: 'This helps us understand how much rhythm needs rebuilding.',
        type: 'single_select',
        required: true,
        options: [
          { id: 'very_consistent', label: 'Very consistent most days' },
          { id: 'somewhat_consistent', label: 'Somewhat consistent' },
          { id: 'chaotic_timing', label: 'Meal timing is chaotic' },
          { id: 'skip_or_overeat', label: 'I often skip meals or overeat later' },
        ],
      },
      trigger: {
        id: 'gut_trigger',
        title: 'What seems to trigger it most?',
        description: 'Choose the pattern that feels most familiar.',
        type: 'single_select',
        required: true,
        options: [
          { id: 'heavy_meals', label: 'Heavy or late meals' },
          { id: 'stress', label: 'Stress and rushing' },
          { id: 'low_water', label: 'Low water or too much caffeine' },
          { id: 'unclear_foods', label: 'I cannot tell which foods trigger it' },
        ],
      },
      severity: {
        id: 'gut_frequency',
        title: 'How often does this affect you in a normal week?',
        description: 'Pick the closest pattern.',
        type: 'single_select',
        required: true,
        options: [
          { id: '1_2_days', label: '1-2 days' },
          { id: '3_4_days', label: '3-4 days' },
          { id: '5_plus_days', label: '5+ days' },
          { id: 'almost_daily', label: 'Almost daily' },
        ],
      },
      baseline: [
        {
          id: 'gut_water_glasses',
          title: 'How many glasses of water do you usually drink daily?',
          description: 'A rough daily count is enough.',
          type: 'number_input',
          minValue: 0,
          required: true,
          placeholder: 'Enter a number',
          keyboardType: 'number-pad',
        },
      ],
      coping: {
        id: 'gut_coping',
        title: 'What do you usually do when your gut feels off?',
        description: 'Choose your most common response.',
        type: 'single_select',
        required: true,
        options: [
          { id: 'ignore_it', label: 'Ignore it and continue' },
          { id: 'random_restriction', label: 'Randomly restrict foods' },
          { id: 'antacids_or_meds', label: 'Use antacids, tablets, or quick fixes' },
          { id: 'search_online', label: 'Search online and try new rules' },
        ],
      },
      startReason: createStartReasonQuestion('gut'),
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
    case 'gut_discomfort':
      return 'gut_health_reset';
  }
}

export function getRecommendedProgramForJourney(journey: JourneyKey): ProgramSlug {
  return journey === 'smoking' ? 'smoking_alcohol_quit' : journey;
}

export function getGuidedIssueLabel(issueId: GuidedIssueId | null) {
  if (!issueId) return null;
  return GUIDED_ISSUE_OPTIONS.find((option) => option.id === issueId)?.label ?? null;
}
