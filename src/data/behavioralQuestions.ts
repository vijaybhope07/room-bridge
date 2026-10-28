export interface QuestionnaireOption {
  value: string;
  label: string;
  description?: string;
  vectorEffect?: {
    cleanliness?: 'relaxed' | 'moderate' | 'spotless';
    noiseTolerance?: 'low' | 'moderate' | 'high';
    socialLifestyle?: 'introvert' | 'moderate' | 'extrovert';
    sleepTime?: string;
    wakeTime?: string;
    smokingPreference?: 'strictly-non-smoker' | 'outside-only' | 'smoker-friendly';
    guestPreference?: 'rarely' | 'weekends-only' | 'anytime';
    foodPreference?: 'vegetarian' | 'non-vegetarian' | 'any';
    studyHabit?: 'morning' | 'night' | 'flexible';
  };
}

export interface BehavioralQuestion {
  id: string;
  number: number;
  category: 'chronotype' | 'cleanliness' | 'social' | 'study_work' | 'finance_sharing' | 'boundaries_lifestyle';
  categoryLabel: string;
  categoryIcon: string;
  question: string;
  subtitle?: string;
  options: QuestionnaireOption[];
}

export const BEHAVIORAL_QUESTIONS: BehavioralQuestion[] = [
  // Category 1: Chronotype & Night-Time Living (Q1 - Q5)
  {
    id: 'q1_bedtime',
    number: 1,
    category: 'chronotype',
    categoryLabel: 'Sleep & Chronotype',
    categoryIcon: 'Moon',
    question: 'When do you typically sleep on weekdays?',
    subtitle: 'Sleep alignment prevents late-night noise friction.',
    options: [
      { value: '22:00', label: '10:00 PM', description: 'Early bird, lights out early', vectorEffect: { sleepTime: '22:00', studyHabit: 'morning' } },
      { value: '23:30', label: '11:30 PM', description: 'Standard healthy bedtime', vectorEffect: { sleepTime: '23:30', studyHabit: 'flexible' } },
      { value: '01:00', label: '01:00 AM', description: 'Moderate late-night habit', vectorEffect: { sleepTime: '01:00', studyHabit: 'night' } },
      { value: '02:30', label: '02:30 AM+', description: 'True night owl / late developer', vectorEffect: { sleepTime: '02:30', studyHabit: 'night' } },
    ]
  },
  {
    id: 'q2_light_sleeper',
    number: 2,
    category: 'chronotype',
    categoryLabel: 'Sleep & Chronotype',
    categoryIcon: 'Moon',
    question: 'How sensitive are you to noise or lights while trying to sleep?',
    subtitle: 'Crucial for room and roommate noise tolerance matching.',
    options: [
      { value: 'high_sensitivity', label: 'Light Sleeper', description: 'I wake up at slight sounds or footfalls', vectorEffect: { noiseTolerance: 'low' } },
      { value: 'moderate_sensitivity', label: 'Moderate Sleeper', description: 'Normal sounds do not disturb me much', vectorEffect: { noiseTolerance: 'moderate' } },
      { value: 'heavy_sleeper', label: 'Deep Sleeper', description: 'Can sleep through loud storms and alarms', vectorEffect: { noiseTolerance: 'high' } }
    ]
  },
  {
    id: 'q3_waketime',
    number: 3,
    category: 'chronotype',
    categoryLabel: 'Sleep & Chronotype',
    categoryIcon: 'Moon',
    question: 'What is your usual morning wake-up routine?',
    subtitle: 'Ensures morning bathroom queues and kitchen rush are manageable.',
    options: [
      { value: '06:30', label: '6:30 AM or earlier', description: 'Morning workout / early study', vectorEffect: { wakeTime: '06:30' } },
      { value: '07:30', label: '7:30 AM - 8:00 AM', description: 'Standard professional schedule', vectorEffect: { wakeTime: '07:30' } },
      { value: '09:00', label: '9:00 AM - 10:00 AM', description: 'Flexible remote / student morning', vectorEffect: { wakeTime: '09:00' } },
      { value: '11:00', label: 'After 10:30 AM', description: 'Late riser / nocturnal rhythm', vectorEffect: { wakeTime: '11:00' } }
    ]
  },
  {
    id: 'q4_alarm_habits',
    number: 4,
    category: 'chronotype',
    categoryLabel: 'Sleep & Chronotype',
    categoryIcon: 'Moon',
    question: 'How do you handle morning alarm clocks?',
    subtitle: 'Continuous snoozing is a top complaint among flatmates.',
    options: [
      { value: 'single_alarm', label: 'Single Alarm', description: 'Turn off immediately and get out of bed' },
      { value: 'few_snoozes', label: '1 - 2 Snoozes', description: 'Need 5-10 minutes transition time' },
      { value: 'heavy_snoozer', label: 'Multi-Alarm Storm', description: 'Sets 5+ alarms ringing across 45 minutes' }
    ]
  },
  {
    id: 'q5_ambient_sleep',
    number: 5,
    category: 'chronotype',
    categoryLabel: 'Sleep & Chronotype',
    categoryIcon: 'Moon',
    question: 'Preferred ambient condition for sleep environment:',
    subtitle: 'Temperature and sound preference in bedroom.',
    options: [
      { value: 'pitch_black_silent', label: 'Pitch Black & Total Silence', description: 'Need blackout curtains and zero sound' },
      { value: 'fan_ambient', label: 'Fan or Gentle White Noise', description: 'Air circulation or subtle ambient hum' },
      { value: 'flexible_sleep', label: 'Completely Flexible', description: 'Can sleep with nightlight or quiet music' }
    ]
  },

  // Category 2: Cleanliness, Tidiness & Chores (Q6 - Q10)
  {
    id: 'q6_sink_dishes',
    number: 6,
    category: 'cleanliness',
    categoryLabel: 'Cleanliness & Chores',
    categoryIcon: 'Sparkles',
    question: 'How do you handle used dishes and cookware in the kitchen?',
    subtitle: 'Kitchen cleanliness is the #1 cohabitation compatibility factor.',
    options: [
      { value: 'immediate_wash', label: 'Wash Immediately', description: 'Clean, wipe, and put away right after cooking/eating', vectorEffect: { cleanliness: 'spotless' } },
      { value: 'within_hours', label: 'Soak & Wash Within Hours', description: 'Cleaned before the end of the morning or evening', vectorEffect: { cleanliness: 'moderate' } },
      { value: 'once_daily', label: 'Wash Once Daily', description: 'Batch clean all dishes at night before bed', vectorEffect: { cleanliness: 'moderate' } },
      { value: 'maid_does_it', label: 'Leave for Housekeeping Maid', description: 'Rinse and leave for daily housekeeping staff', vectorEffect: { cleanliness: 'relaxed' } }
    ]
  },
  {
    id: 'q7_common_cleaning',
    number: 7,
    category: 'cleanliness',
    categoryLabel: 'Cleanliness & Chores',
    categoryIcon: 'Sparkles',
    question: 'How often should shared areas (living room, hallway, kitchen counter) be cleaned?',
    subtitle: 'Standard for common space sanitation and order.',
    options: [
      { value: 'daily_tidy', label: 'Daily Tidy & Wipe Down', description: 'Keep common counters clear and clean every day', vectorEffect: { cleanliness: 'spotless' } },
      { value: 'few_times_week', label: '2 - 3 Times a Week', description: 'Regular upkeep every other day', vectorEffect: { cleanliness: 'moderate' } },
      { value: 'weekly_routine', label: 'Weekly Deep Clean', description: 'Dedicated cleaning day once a weekend', vectorEffect: { cleanliness: 'moderate' } },
      { value: 'relaxed_maid', label: 'As Needed / Maid Dependent', description: 'Relaxed standard when clutter becomes visible', vectorEffect: { cleanliness: 'relaxed' } }
    ]
  },
  {
    id: 'q8_room_tidiness',
    number: 8,
    category: 'cleanliness',
    categoryLabel: 'Cleanliness & Chores',
    categoryIcon: 'Sparkles',
    question: 'What is your standard for your personal bedroom?',
    subtitle: 'Reflects personal organization and conscientiousness.',
    options: [
      { value: 'hotel_standard', label: 'Hotel Immaculate', description: 'Bed made daily, zero clutter on floor or desk', vectorEffect: { cleanliness: 'spotless' } },
      { value: 'organized_chaos', label: 'Moderately Neat', description: 'Lived-in comfort with designated organized zones', vectorEffect: { cleanliness: 'moderate' } },
      { value: 'creative_mess', label: 'Relaxed / Casual', description: 'Messy clothes chair is totally fine by me', vectorEffect: { cleanliness: 'relaxed' } }
    ]
  },
  {
    id: 'q9_chore_philosophy',
    number: 9,
    category: 'cleanliness',
    categoryLabel: 'Cleanliness & Chores',
    categoryIcon: 'Sparkles',
    question: 'How do you prefer dividing household chores?',
    subtitle: 'Trash disposal, bathroom scrubbing, and dusting.',
    options: [
      { value: 'chore_wheel', label: 'Strict Rotation Schedule', description: 'Calendar chart with fixed weekly turns' },
      { value: 'organic_pitchin', label: 'Collaborative Pitch-in', description: 'If you see something dirty, you clean it' },
      { value: 'hire_maid', label: 'Hire Full-time/Daily Maid', description: 'Pool funds to hire professional housekeeping' }
    ]
  },
  {
    id: 'q10_bathroom_hygiene',
    number: 10,
    category: 'cleanliness',
    categoryLabel: 'Cleanliness & Chores',
    categoryIcon: 'Sparkles',
    question: 'Shared bathroom hygiene etiquette:',
    subtitle: 'Hair traps, dry floor, and toiletries arrangement.',
    options: [
      { value: 'dry_bathroom', label: 'Wipe Floor Dry & Clean Drain', description: 'Leave bathroom pristine for the next person' },
      { value: 'tidy_toiletries', label: 'Neat & Tidy', description: 'Rinse sink and keep personal toiletries in caddy' },
      { value: 'quick_use', label: 'Casual / Relaxed', description: 'Routine cleanings once a week suffice' }
    ]
  },

  // Category 3: Social Dynamics & Guest Boundaries (Q11 - Q15)
  {
    id: 'q11_social_battery',
    number: 11,
    category: 'social',
    categoryLabel: 'Social Dynamics & Energy',
    categoryIcon: 'Users',
    question: 'How do you view home in terms of your social battery?',
    subtitle: 'Measures home introversion vs extroversion expectations.',
    options: [
      { value: 'quiet_sanctuary', label: 'Peaceful Sanctuary', description: 'Home is strictly to recharge quietly after the outside world', vectorEffect: { socialLifestyle: 'introvert', noiseTolerance: 'low' } },
      { value: 'balanced_vibe', label: 'Balanced Mix', description: 'Occasional friendly chats, watching Netflix together, but respect solo time', vectorEffect: { socialLifestyle: 'moderate', noiseTolerance: 'moderate' } },
      { value: 'buzzing_hub', label: 'Lively Social Hub', description: 'Love having energy, music, and social warmth around the apartment', vectorEffect: { socialLifestyle: 'extrovert', noiseTolerance: 'high' } }
    ]
  },
  {
    id: 'q12_overnight_guests',
    number: 12,
    category: 'social',
    categoryLabel: 'Social Dynamics & Energy',
    categoryIcon: 'Users',
    question: 'Policy regarding overnight guests and significant others:',
    subtitle: 'Clear expectations prevent boundary disputes.',
    options: [
      { value: 'prior_notice', label: 'Prior Notice Required', description: 'Discuss in group chat beforehand; weekends only', vectorEffect: { guestPreference: 'weekends-only' } },
      { value: 'occasional_welcome', label: 'Occasional Free Access', description: 'Friends and partners welcome with simple heads-up', vectorEffect: { guestPreference: 'weekends-only' } },
      { value: 'open_door', label: 'Open Door Anytime', description: 'Guests welcome anytime without formal permission', vectorEffect: { guestPreference: 'anytime' } },
      { value: 'strictly_no_guests', label: 'Rare / Minimal Overnight Guests', description: 'Prefer home to remain exclusively for tenants', vectorEffect: { guestPreference: 'rarely' } }
    ]
  },
  {
    id: 'q13_parties_gatherings',
    number: 13,
    category: 'social',
    categoryLabel: 'Social Dynamics & Energy',
    categoryIcon: 'Users',
    question: 'Hosting house parties, dinner get-togethers, or game nights:',
    subtitle: 'Aligning frequency of social events in common spaces.',
    options: [
      { value: 'rare_parties', label: 'Rarely / Special Occasions Only', description: '1-2 times a year maximum with unanimous consensus', vectorEffect: { noiseTolerance: 'low' } },
      { value: 'monthly_dinners', label: '1 - 2 Times a Month', description: 'Weekend dinners or chill board game sessions with friends', vectorEffect: { noiseTolerance: 'moderate' } },
      { value: 'frequent_weekends', label: 'Active Weekend Host', description: 'Love hosting weekend gatherings and socializing', vectorEffect: { noiseTolerance: 'high' } }
    ]
  },
  {
    id: 'q14_conflict_style',
    number: 14,
    category: 'social',
    categoryLabel: 'Social Dynamics & Energy',
    categoryIcon: 'Users',
    question: 'When a flatmate issue arises, what is your conflict resolution style?',
    subtitle: 'Communication style is vital for long-term peaceful cohabitation.',
    options: [
      { value: 'direct_calm', label: 'Direct & Calm Discussion', description: 'Address issues immediately in person with respectful solutions' },
      { value: 'polite_text', label: 'Polite Text / WhatsApp Message', description: 'Send a thoughtful heads-up note in chat to avoid awkwardness' },
      { value: 'scheduled_checkin', label: 'Monthly Roommate Check-in', description: 'Review house dynamics over tea or a scheduled review' }
    ]
  },
  {
    id: 'q15_personality_type',
    number: 15,
    category: 'social',
    categoryLabel: 'Social Dynamics & Energy',
    categoryIcon: 'Users',
    question: 'Where do you place yourself on the social spectrum?',
    subtitle: 'Big-5 Extraversion dimension calibration.',
    options: [
      { value: 'introvert', label: 'Introverted', description: 'Keeps to myself, values privacy, quiet environment', vectorEffect: { socialLifestyle: 'introvert' } },
      { value: 'ambivert', label: 'Ambivert (Balanced)', description: 'Adaptable to both quiet work and cheerful banter', vectorEffect: { socialLifestyle: 'moderate' } },
      { value: 'extrovert', label: 'Extroverted', description: 'Energized by talking, cooking together, and shared activities', vectorEffect: { socialLifestyle: 'extrovert' } }
    ]
  },

  // Category 4: Work Habits, Study & Noise (Q16 - Q20)
  {
    id: 'q16_work_location',
    number: 16,
    category: 'study_work',
    categoryLabel: 'Work & Study Habits',
    categoryIcon: 'Briefcase',
    question: 'What is your regular work / study schedule setup?',
    subtitle: 'Determines daytime apartment occupancy and bandwidth.',
    options: [
      { value: 'full_wfh', label: '100% Work from Home / Remote', description: 'Home all day during business hours on video calls' },
      { value: 'hybrid', label: 'Hybrid (2-3 Days Office / Campus)', description: 'Split time between home desk and outside office' },
      { value: 'full_office', label: 'Full-Time Out of Home', description: 'Out 9 AM - 7 PM, only home in evenings and weekends' }
    ]
  },
  {
    id: 'q17_audio_policy',
    number: 17,
    category: 'study_work',
    categoryLabel: 'Work & Study Habits',
    categoryIcon: 'Briefcase',
    question: 'Audio policy in bedrooms and shared living room:',
    subtitle: 'Sound bleed is a frequent issue in shared apartments.',
    options: [
      { value: 'always_headphones', label: 'Headphones Only', description: 'Always wear headphones for music, gaming, and calls', vectorEffect: { noiseTolerance: 'low' } },
      { value: 'moderate_speakers', label: 'Low Speakers During Daytime', description: 'Relaxed daytime listening, headphones after 10 PM', vectorEffect: { noiseTolerance: 'moderate' } },
      { value: 'speaker_enthusiast', label: 'Speakers & Bass Welcome', description: 'Enjoy ambient room audio and TV sound systems', vectorEffect: { noiseTolerance: 'high' } }
    ]
  },
  {
    id: 'q18_focus_environment',
    number: 18,
    category: 'study_work',
    categoryLabel: 'Work & Study Habits',
    categoryIcon: 'Briefcase',
    question: 'What environment do you need when doing intense work or exam prep?',
    subtitle: 'Helps calibrate noise compatibility during study hours.',
    options: [
      { value: 'library_silence', label: 'Library Silence', description: 'Zero distractions, whisper volume only in flat', vectorEffect: { noiseTolerance: 'low' } },
      { value: 'normal_hum', label: 'Normal Background Hum', description: 'Can tune out everyday kitchen noises and walking', vectorEffect: { noiseTolerance: 'moderate' } },
      { value: 'high_resilience', label: 'Immune to Noise', description: 'Can study in a bustling café with zero problem', vectorEffect: { noiseTolerance: 'high' } }
    ]
  },
  {
    id: 'q19_phone_calls',
    number: 19,
    category: 'study_work',
    categoryLabel: 'Work & Study Habits',
    categoryIcon: 'Briefcase',
    question: 'Phone calls and meetings in common spaces:',
    subtitle: 'Respect for common room shared airwaves.',
    options: [
      { value: 'bedroom_only', label: 'Strictly Inside Private Room', description: 'Take all client, family, and personal calls in bedroom' },
      { value: 'short_common', label: 'Quick Calls Fine in Hallway', description: 'Brief updates okay in hall, longer calls taken privately' },
      { value: 'hallway_friendly', label: 'Relaxed Calling Everywhere', description: 'Comfortable pacing and taking calls anywhere in the flat' }
    ]
  },
  {
    id: 'q20_peak_productivity',
    number: 20,
    category: 'study_work',
    categoryLabel: 'Work & Study Habits',
    categoryIcon: 'Briefcase',
    question: 'What time of day is your peak productivity spike?',
    subtitle: 'Synchronizes quiet hours when you are in flow state.',
    options: [
      { value: 'early_morning', label: 'Early Morning (6 AM - 10 AM)', description: 'Fresh and sharp before the world wakes up', vectorEffect: { studyHabit: 'morning' } },
      { value: 'afternoon_standard', label: 'Afternoon (11 AM - 5 PM)', description: 'Consistent flow during standard day hours', vectorEffect: { studyHabit: 'flexible' } },
      { value: 'late_night', label: 'Late Night (10 PM - 2 AM)', description: 'Peak creative or coding bursts at midnight', vectorEffect: { studyHabit: 'night' } }
    ]
  },

  // Category 5: Finance, Sharing & Kitchen Habits (Q21 - Q25)
  {
    id: 'q21_bill_settlement',
    number: 21,
    category: 'finance_sharing',
    categoryLabel: 'Finances & Sharing',
    categoryIcon: 'DollarSign',
    question: 'How quickly do you prefer settling shared utility bills (Wi-Fi, electricity, gas)?',
    subtitle: 'Financial promptness is vital for frictionless co-living.',
    options: [
      { value: 'instant_splitwise', label: 'Instant Settlement (< 24 Hours)', description: 'Pay UPI / Splitwise within hours of bill notification' },
      { value: 'few_days', label: 'Within 2 - 3 Days', description: 'Settled promptly before the week ends' },
      { value: 'monthly_batch', label: 'Monthly Consolidated Batch', description: 'Tally everything once at month-end rent time' }
    ]
  },
  {
    id: 'q22_grocery_sharing',
    number: 22,
    category: 'finance_sharing',
    categoryLabel: 'Finances & Sharing',
    categoryIcon: 'DollarSign',
    question: 'Philosophy on groceries and kitchen consumables:',
    subtitle: 'Avoids misunderstandings about milk, oil, and spices.',
    options: [
      { value: 'strictly_separate', label: 'Strictly Separate Shelves & Food', description: 'Everyone buys their own food, spices, and snacks' },
      { value: 'share_staples', label: 'Share Basic Staples (Oil, Salt, Tea)', description: 'Pool money for common cooking basics, buy personal snacks' },
      { value: 'fully_communal', label: 'Fully Communal Kitchen', description: 'Split all grocery bills equally and cook together' }
    ]
  },
  {
    id: 'q23_cooking_frequency',
    number: 23,
    category: 'finance_sharing',
    categoryLabel: 'Finances & Sharing',
    categoryIcon: 'DollarSign',
    question: 'How often do you cook elaborate meals at home?',
    subtitle: 'Indicates kitchen stove usage and aroma expectations.',
    options: [
      { value: 'daily_cook', label: 'Cook Daily (Lunch & Dinner)', description: 'Active home chef using stove 1-2 times daily' },
      { value: 'simple_cook', label: 'Simple Cooking & Meal Prep', description: 'Quick breakfasts, light dinners, or batch weekend prep' },
      { value: 'mostly_order', label: 'Order In / Eat Out Mostly', description: 'Rarely cook, rely on meal subscriptions and food apps' }
    ]
  },
  {
    id: 'q24_dietary_lifestyle',
    number: 24,
    category: 'finance_sharing',
    categoryLabel: 'Finances & Sharing',
    categoryIcon: 'DollarSign',
    question: 'Dietary habit and kitchen sharing preferences:',
    subtitle: 'Evaluates dietary preferences for harmonious cohabitation.',
    options: [
      { value: 'pure_veg', label: 'Pure Vegetarian / Vegan Only', description: 'Prefer kitchen free of non-veg cooking or separate utensils', vectorEffect: { foodPreference: 'vegetarian' } },
      { value: 'veg_tolerant', label: 'Vegetarian (Non-Veg Friendly)', description: 'I am veg, but okay if roommates cook non-veg food', vectorEffect: { foodPreference: 'vegetarian' } },
      { value: 'non_veg', label: 'Non-Vegetarian / Flexible', description: 'Cook and consume meat, eggs, and all cuisines comfortably', vectorEffect: { foodPreference: 'non-vegetarian' } }
    ]
  },
  {
    id: 'q25_borrowing_belongings',
    number: 25,
    category: 'finance_sharing',
    categoryLabel: 'Finances & Sharing',
    categoryIcon: 'DollarSign',
    question: 'Policy on borrowing kitchen appliances, clothing, or electronics:',
    subtitle: 'Personal property boundaries.',
    options: [
      { value: 'always_ask', label: 'Always Ask Every Single Time', description: 'Polite mutual respect, never assume permission' },
      { value: 'open_sharing', label: 'Open Mutual Sharing', description: 'What is mine is yours between good flatmates' },
      { value: 'strict_personal', label: 'Strictly Personal Use Only', description: 'Prefer not sharing or borrowing personal possessions' }
    ]
  },

  // Category 6: Habits, Boundaries & Cohabitation Vision (Q26 - Q30)
  {
    id: 'q26_smoking_policy',
    number: 26,
    category: 'boundaries_lifestyle',
    categoryLabel: 'Habits & Boundaries',
    categoryIcon: 'ShieldAlert',
    question: 'Smoking, Vaping, and Hookah preference:',
    subtitle: 'Strict non-smoker constraint carries a 100-point conflict penalty.',
    options: [
      { value: 'strictly_non_smoker', label: 'Strictly Non-Smoking Home', description: 'Zero smoking or vaping allowed inside the house or balconies', vectorEffect: { smokingPreference: 'strictly-non-smoker' } },
      { value: 'balcony_only', label: 'Balcony / Outdoor Only', description: 'Fine if restricted exclusively to ventilated balcony areas', vectorEffect: { smokingPreference: 'outside-only' } },
      { value: 'smoker_friendly', label: 'Smoker Friendly', description: 'No issue with smoking or social vaping inside', vectorEffect: { smokingPreference: 'smoker-friendly' } }
    ]
  },
  {
    id: 'q27_alcohol_habits',
    number: 27,
    category: 'boundaries_lifestyle',
    categoryLabel: 'Habits & Boundaries',
    categoryIcon: 'ShieldAlert',
    question: 'Alcohol consumption attitude in the house:',
    subtitle: 'Helps ensure shared cultural and lifestyle alignment.',
    options: [
      { value: 'alcohol_free', label: 'Alcohol-Free Home Preferred', description: 'Teetotaler, prefer no alcohol kept or consumed in flat' },
      { value: 'social_moderate', label: 'Moderate Social Drinks', description: 'Occasional beer or wine on weekend dinners is totally fine' },
      { value: 'party_friendly', label: 'Party & Bar Friendly', description: 'Comfortable with home bar setups and party gatherings' }
    ]
  },
  {
    id: 'q28_pets_attitude',
    number: 28,
    category: 'boundaries_lifestyle',
    categoryLabel: 'Habits & Boundaries',
    categoryIcon: 'ShieldAlert',
    question: 'Attitude towards pets (cats, dogs, birds):',
    subtitle: 'Crucial for allergy sufferers and pet parents.',
    options: [
      { value: 'love_pets', label: 'Love Pets / Have a Pet', description: 'Excited to live with friendly furry companions' },
      { value: 'pet_neutral', label: 'Neutral / Don’t Mind', description: 'Fine as long as the owner handles litter and training' },
      { value: 'no_pets_allergies', label: 'Strictly No Pets / Allergies', description: 'Cannot live with animals due to allergies or comfort' }
    ]
  },
  {
    id: 'q29_climate_ac',
    number: 29,
    category: 'boundaries_lifestyle',
    categoryLabel: 'Habits & Boundaries',
    categoryIcon: 'ShieldAlert',
    question: 'Air conditioning and room climate preference:',
    subtitle: 'Prevents electric bill and thermostat thermostat wars.',
    options: [
      { value: 'arctic_chilly', label: 'Chilly AC (18°C - 21°C)', description: 'Love cold rooms and thick blankets' },
      { value: 'moderate_eco', label: 'Eco-Friendly (24°C - 26°C)', description: 'Balanced cooling without heavy electricity bills' },
      { value: 'fan_natural', label: 'Ceiling Fan & Open Windows', description: 'Prefer natural ventilation, rarely use AC' }
    ]
  },
  {
    id: 'q30_roommate_vision',
    number: 30,
    category: 'boundaries_lifestyle',
    categoryLabel: 'Habits & Boundaries',
    categoryIcon: 'ShieldAlert',
    question: 'What is your ultimate vision for your relationship with your roommate?',
    subtitle: 'Aligns emotional expectations and cohabitation camaraderie.',
    options: [
      { value: 'close_friends', label: 'Best Friends & Comrades', description: 'Hang out, share meals, explore the city together' },
      { value: 'friendly_respectful', label: 'Warm, Respectful Co-habitants', description: 'Friendly greeting, mutual care, but independent daily lives' },
      { value: 'polite_roommates', label: 'Polite & Transactional', description: 'Keep to ourselves, respect boundaries, pay rent on time' }
    ]
  }
];
