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
  category: string;
  categoryLabel: string;
  categoryIcon: string;
  question: string;
  subtitle?: string;
  options: QuestionnaireOption[];
}

export const ROOM_QUESTIONS: BehavioralQuestion[] = [
  {
    "id": "rq1_max_budget",
    "number": 1,
    "category": "budget_lease",
    "categoryLabel": "Budget & Rent",
    "categoryIcon": "DollarSign",
    "question": "What is your maximum monthly rent budget ceiling?",
    "subtitle": "Ensures we never recommend rooms exceeding your financial limit.",
    "options": [
      {
        "value": "under_10k",
        "label": "Under ₹10,000 / mo",
        "description": "Affordable student budget"
      },
      {
        "value": "10k_15k",
        "label": "₹10,000 - ₹15,000 / mo",
        "description": "Moderate shared or private room"
      },
      {
        "value": "15k_22k",
        "label": "₹15,000 - ₹22,000 / mo",
        "description": "Premium private master room or studio"
      },
      {
        "value": "22k_plus",
        "label": "Above ₹22,000 / mo",
        "description": "Luxury 1BHK/2BHK apartment living"
      }
    ]
  },
  {
    "id": "rq2_room_category",
    "number": 2,
    "category": "space_type",
    "categoryLabel": "Room Category",
    "categoryIcon": "Home",
    "question": "Which room type is your primary target?",
    "subtitle": "Select the privacy level you desire.",
    "options": [
      {
        "value": "Private Room",
        "label": "Private Room",
        "description": "Dedicated personal bedroom with lock"
      },
      {
        "value": "Shared Room",
        "label": "Shared Room",
        "description": "Twin-sharing with 1 flatmate for cost savings"
      },
      {
        "value": "Entire Apartment",
        "label": "Entire Apartment",
        "description": "Full 1BHK, 2BHK or 3BHK flat"
      },
      {
        "value": "Studio",
        "label": "Studio Apartment",
        "description": "Self-contained 1RK studio unit"
      }
    ]
  },
  {
    "id": "rq3_furnishing",
    "number": 3,
    "category": "furnishing",
    "categoryLabel": "Furnishing Standards",
    "categoryIcon": "BedSingle",
    "question": "What furnishing standard do you require upon moving in?",
    "subtitle": "Avoids bringing heavy furniture or paying unnecessary rental charges.",
    "options": [
      {
        "value": "Fully Furnished",
        "label": "Fully Furnished",
        "description": "Bed, mattress, wardrobe, study table, AC, and sofa"
      },
      {
        "value": "Semi Furnished",
        "label": "Semi Furnished",
        "description": "Wardrobes, modular kitchen, fans & lights"
      },
      {
        "value": "Unfurnished",
        "label": "Unfurnished",
        "description": "Empty canvas, I will furnish with my own furniture"
      }
    ]
  },
  {
    "id": "rq4_bathroom_type",
    "number": 4,
    "category": "convenience",
    "categoryLabel": "Washroom Preference",
    "categoryIcon": "CheckCircle2",
    "question": "What bathroom configuration do you require?",
    "subtitle": "Privacy in the morning routine.",
    "options": [
      {
        "value": "attached_mandatory",
        "label": "Attached Washroom Mandatory",
        "description": "Exclusive access inside bedroom"
      },
      {
        "value": "shared_one",
        "label": "Shared with Max 1 Person",
        "description": "Comfortable sharing with a clean roommate"
      },
      {
        "value": "common_hallway",
        "label": "Common Hallway Washroom OK",
        "description": "Open to standard flat layout"
      }
    ]
  },
  {
    "id": "rq5_ac_requirement",
    "number": 5,
    "category": "climate",
    "categoryLabel": "Climate & AC",
    "categoryIcon": "Sliders",
    "question": "Is an Air Conditioner (AC) mandatory in the room?",
    "subtitle": "Crucial for summer temperatures in metro cities.",
    "options": [
      {
        "value": "split_ac_must",
        "label": "Split AC Mandatory",
        "description": "Must have dedicated AC in bedroom"
      },
      {
        "value": "cooler_fan_ok",
        "label": "Air Cooler / Ceiling Fan OK",
        "description": "Fine with standard cooling"
      },
      {
        "value": "climate_neutral",
        "label": "Naturally Ventilated Room",
        "description": "No need for AC, prefer natural breeze"
      }
    ]
  },
  {
    "id": "rq6_wfh_desk",
    "number": 6,
    "category": "work_study",
    "categoryLabel": "Work & Study Space",
    "categoryIcon": "Briefcase",
    "question": "Do you need a dedicated Work-From-Home / Study desk setup?",
    "subtitle": "Important for productivity during remote work or study.",
    "options": [
      {
        "value": "dedicated_ergonomic",
        "label": "Dedicated Study Desk & Ergonomic Chair",
        "description": "Need proper workspace inside the bedroom"
      },
      {
        "value": "basic_table",
        "label": "Basic Table & Chair",
        "description": "Casual study or laptop setup"
      },
      {
        "value": "flexible_wfh",
        "label": "Common Area / Flexible",
        "description": "Can study in hall or bed"
      }
    ]
  },
  {
    "id": "rq7_power_backup",
    "number": 7,
    "category": "utility",
    "categoryLabel": "Power Continuity",
    "categoryIcon": "Zap",
    "question": "What is your power backup requirement?",
    "subtitle": "Prevents sudden interruptions during work calls and studies.",
    "options": [
      {
        "value": "full_dg_backup",
        "label": "100% DG Generator Backup",
        "description": "Runs AC, Wi-Fi, and heavy appliances 24/7"
      },
      {
        "value": "inverter_basic",
        "label": "Inverter Backup (Fans, Lights, Wi-Fi)",
        "description": "Basic backup for essential needs"
      },
      {
        "value": "no_preference",
        "label": "Normal Grid Power (Backup Not Essential)",
        "description": "Occasional cuts are manageable"
      }
    ]
  },
  {
    "id": "rq8_wifi_speed",
    "number": 8,
    "category": "connectivity",
    "categoryLabel": "Internet & Connectivity",
    "categoryIcon": "Wifi",
    "question": "Required Wi-Fi and fiber broadband speed:",
    "subtitle": "Ensures seamless streaming, gaming, and remote meetings.",
    "options": [
      {
        "value": "ultra_fast",
        "label": "Ultra High-Speed (200 - 300+ Mbps Fiber)",
        "description": "Heavy video calls, cloud computing & gaming"
      },
      {
        "value": "standard_broadband",
        "label": "Standard Fiber (50 - 100 Mbps)",
        "description": "Smooth everyday browsing & streaming"
      },
      {
        "value": "mobile_hotspot",
        "label": "Personal Mobile Hotspot / Dongle",
        "description": "No requirement for in-house broadband"
      }
    ]
  },
  {
    "id": "rq9_kitchen_cooking",
    "number": 9,
    "category": "food_kitchen",
    "categoryLabel": "Kitchen Facilities",
    "categoryIcon": "Coffee",
    "question": "Kitchen and cooking access preference:",
    "subtitle": "Aligns daily meal habits and cooking autonomy.",
    "options": [
      {
        "value": "full_modular_kitchen",
        "label": "Full Modular Kitchen with Gas & Microwave",
        "description": "Love daily cooking and meal prep"
      },
      {
        "value": "light_cooking",
        "label": "Light Cooking / Tea & Snacks",
        "description": "Mostly tea, breakfast, and instant food"
      },
      {
        "value": "no_cooking_tiffin",
        "label": "Tiffin Service / Meal Ordering",
        "description": "Do not plan to cook, rely on delivery"
      }
    ]
  },
  {
    "id": "rq10_balcony_sunlight",
    "number": 10,
    "category": "ventilation",
    "categoryLabel": "Sunlight & Balcony",
    "categoryIcon": "Sun",
    "question": "Sunlight and private balcony requirement:",
    "subtitle": "Fresh air and natural lighting make a huge difference in living quality.",
    "options": [
      {
        "value": "attached_balcony",
        "label": "Attached Private Balcony with Sunlight",
        "description": "Private outdoor morning coffee spot"
      },
      {
        "value": "large_window",
        "label": "Large Windows with Natural Light",
        "description": "Well-ventilated without attached balcony"
      },
      {
        "value": "internal_room_ok",
        "label": "Standard Room (Light Flexible)",
        "description": "Sunlight is not a primary factor"
      }
    ]
  },
  {
    "id": "rq11_floor_preference",
    "number": 11,
    "category": "building_specs",
    "categoryLabel": "Floor Level",
    "categoryIcon": "Building",
    "question": "Which floor level do you prefer in the building?",
    "subtitle": "Affects accessibility, noise, and views.",
    "options": [
      {
        "value": "ground_first",
        "label": "Ground or 1st Floor",
        "description": "Quick access, no stair climb"
      },
      {
        "value": "mid_floors",
        "label": "Mid Floors (2nd to 5th)",
        "description": "Balanced air and privacy"
      },
      {
        "value": "high_rise",
        "label": "High Rise (6th floor & above)",
        "description": "Panoramic views, breeze, and peace"
      }
    ]
  },
  {
    "id": "rq12_elevator_need",
    "number": 12,
    "category": "building_specs",
    "categoryLabel": "Elevator & Lift",
    "categoryIcon": "ChevronUp",
    "question": "Is an elevator / lift necessary in the property?",
    "subtitle": "Physical convenience especially when carrying luggage.",
    "options": [
      {
        "value": "elevator_must",
        "label": "Elevator Mandatory",
        "description": "Cannot climb stairs daily"
      },
      {
        "value": "walkup_ok",
        "label": "Walk-up OK (Up to 2-3 Floors)",
        "description": "Healthy daily exercise"
      },
      {
        "value": "elevator_not_needed",
        "label": "No Elevator Needed",
        "description": "Ground floor or independent house"
      }
    ]
  },
  {
    "id": "rq13_parking_type",
    "number": 13,
    "category": "mobility",
    "categoryLabel": "Vehicle Parking",
    "categoryIcon": "Car",
    "question": "What parking facility do you require for your vehicle?",
    "subtitle": "Prevents street parking ticketing and damage.",
    "options": [
      {
        "value": "covered_car_parking",
        "label": "Covered 4-Wheeler Car Parking",
        "description": "Dedicated slot for car"
      },
      {
        "value": "two_wheeler_parking",
        "label": "2-Wheeler Scooter / Bike Parking",
        "description": "Safe covered parking for bike"
      },
      {
        "value": "no_vehicle",
        "label": "No Vehicle Parking Needed",
        "description": "Rely on Metro, cabs, or walking"
      }
    ]
  },
  {
    "id": "rq14_society_security",
    "number": 14,
    "category": "safety",
    "categoryLabel": "Security & Safety",
    "categoryIcon": "ShieldCheck",
    "question": "What level of security do you expect in the building?",
    "subtitle": "Peace of mind for late shifts and packages.",
    "options": [
      {
        "value": "gated_24_7",
        "label": "24/7 Gated Security & CCTV",
        "description": "Security guards, boom barrier, CCTV cameras"
      },
      {
        "value": "secure_locks",
        "label": "Biometric / Digital Main Door Lock",
        "description": "Keyless modern access control"
      },
      {
        "value": "standard_residential",
        "label": "Standard Residential Society",
        "description": "Normal neighborly watch"
      }
    ]
  },
  {
    "id": "rq15_drinking_water",
    "number": 15,
    "category": "health_hygiene",
    "categoryLabel": "Drinking Water",
    "categoryIcon": "Droplets",
    "question": "What is your drinking water arrangement preference?",
    "subtitle": "Essential health factor in metro cities.",
    "options": [
      {
        "value": "ro_purifier_fitted",
        "label": "Fitted RO Water Purifier",
        "description": "Unlimited pure drinking water on tap"
      },
      {
        "value": "mineral_water_cans",
        "label": "Delivered Mineral Water Cans (Bisleri/Kinley)",
        "description": "Regular 20L can delivery"
      },
      {
        "value": "standard_filter",
        "label": "Standard Filter / Boiling",
        "description": "Flexible water setup"
      }
    ]
  },
  {
    "id": "rq16_laundry_machine",
    "number": 16,
    "category": "convenience",
    "categoryLabel": "Laundry & Washing",
    "categoryIcon": "RefreshCw",
    "question": "In-house washing machine preference:",
    "subtitle": "Avoids weekend laundry stress.",
    "options": [
      {
        "value": "fully_automatic",
        "label": "Fully Automatic Front/Top Load Machine",
        "description": "Wash & spin dry directly at home"
      },
      {
        "value": "semi_automatic",
        "label": "Semi-Automatic Machine",
        "description": "Standard functional washing"
      },
      {
        "value": "external_dhobi",
        "label": "Laundry Service / Dry Cleaner Nearby",
        "description": "Outsourced laundry is fine"
      }
    ]
  },
  {
    "id": "rq17_refrigerator",
    "number": 17,
    "category": "kitchen_appliances",
    "categoryLabel": "Refrigerator Sharing",
    "categoryIcon": "Box",
    "question": "Refrigerator access expectation:",
    "subtitle": "Keeping groceries, dairy, and cold beverages fresh.",
    "options": [
      {
        "value": "large_shared_fridge",
        "label": "Double-Door Frost-Free Shared Fridge",
        "description": "Ample freezer and vegetable space"
      },
      {
        "value": "dedicated_mini_fridge",
        "label": "Dedicated Mini-Fridge in Room",
        "description": "Personal private cold storage"
      },
      {
        "value": "standard_fridge",
        "label": "Standard Single Door Fridge OK",
        "description": "Basic everyday cooling"
      }
    ]
  },
  {
    "id": "rq18_housekeeping",
    "number": 18,
    "category": "cleanliness",
    "categoryLabel": "Daily Housekeeping",
    "categoryIcon": "Sparkles",
    "question": "Housekeeping and maid service preference:",
    "subtitle": "Keeps common areas and rooms consistently clean.",
    "options": [
      {
        "value": "daily_maid_service",
        "label": "Daily Maid Service (Sweeping, Mopping, Dusting)",
        "description": "Zero cleaning chores on flatmates"
      },
      {
        "value": "alternate_day_cleaning",
        "label": "2 - 3 Times a Week Cleaning",
        "description": "Periodic thorough cleaning"
      },
      {
        "value": "self_managed_cleaning",
        "label": "Self-Managed by Flatmates",
        "description": "Take turns or clean own space"
      }
    ]
  },
  {
    "id": "rq19_fitness_gym",
    "number": 19,
    "category": "wellness",
    "categoryLabel": "Gym & Clubhouse",
    "categoryIcon": "Activity",
    "question": "Society clubhouse amenities (Gym, Pool, Badminton):",
    "subtitle": "Healthy lifestyle inside the residential complex.",
    "options": [
      {
        "value": "in_society_gym",
        "label": "In-Society Gym & Clubhouse Mandatory",
        "description": "Workout right downstairs"
      },
      {
        "value": "gym_nearby",
        "label": "Commercial Gym Within 500 Meters",
        "description": "Gold's Gym / Cult.fit nearby is fine"
      },
      {
        "value": "no_gym_needed",
        "label": "Not a Priority",
        "description": "No requirement for fitness amenities"
      }
    ]
  },
  {
    "id": "rq20_metro_commute",
    "number": 20,
    "category": "transit",
    "categoryLabel": "Transit & Metro",
    "categoryIcon": "MapPin",
    "question": "Proximity to Metro station or primary bus terminus:",
    "subtitle": "Saves hours of traffic daily in busy metropolitan cities.",
    "options": [
      {
        "value": "walking_metro",
        "label": "Under 10 Minutes Walk (< 800m)",
        "description": "Walk directly to the metro platform"
      },
      {
        "value": "short_auto_metro",
        "label": "Within 2 - 3 km (Short Auto/Bus Ride)",
        "description": "Quick auto or bike commute"
      },
      {
        "value": "commute_flexible",
        "label": "Flexible (Own Vehicle / Remote Work)",
        "description": "Proximity to transit is not critical"
      }
    ]
  },
  {
    "id": "rq21_curfew_rules",
    "number": 21,
    "category": "rules",
    "categoryLabel": "Gate Timings & Curfew",
    "categoryIcon": "Clock",
    "question": "Society gate timings and curfew policy:",
    "subtitle": "Late night shifts or flexible student life requires unrestricted entry.",
    "options": [
      {
        "value": "zero_curfew_24_7",
        "label": "Zero Curfew (24/7 Independent Entry)",
        "description": "Keys to main gate, come and go anytime"
      },
      {
        "value": "moderate_gate_lock",
        "label": "Entry Log After Midnight (Security Gate)",
        "description": "Guard opens gate upon request"
      },
      {
        "value": "early_curfew_ok",
        "label": "Fixed Gate Timings OK (10:30 PM)",
        "description": "Early sleeping lifestyle"
      }
    ]
  },
  {
    "id": "rq22_nonveg_cooking_allowed",
    "number": 22,
    "category": "diet_society",
    "categoryLabel": "Dietary Policy in Property",
    "categoryIcon": "Heart",
    "question": "Dietary cooking policy permitted by owner/society:",
    "subtitle": "Prevents sudden landlord objections over food habits.",
    "options": [
      {
        "value": "nonveg_cooking_free",
        "label": "All Cooking Allowed (Veg & Non-Veg)",
        "description": "Zero restrictions on food preparation"
      },
      {
        "value": "veg_only_cooking",
        "label": "Strict Vegetarian Only Property",
        "description": "No non-veg or eggs cooked on premises"
      },
      {
        "value": "ordering_nonveg_ok",
        "label": "Veg Cooking, Non-Veg Delivery OK",
        "description": "Can order non-veg food from Swiggy/Zomato"
      }
    ]
  },
  {
    "id": "rq23_pet_policy",
    "number": 23,
    "category": "pets",
    "categoryLabel": "Pet Friendliness",
    "categoryIcon": "Award",
    "question": "Property pet policy requirement:",
    "subtitle": "Landlord approval for cats, dogs, or visiting animals.",
    "options": [
      {
        "value": "pet_friendly_property",
        "label": "Pet-Friendly Property Allowed",
        "description": "Welcome to keep trained dogs/cats"
      },
      {
        "value": "no_pets_property",
        "label": "No Pets Policy Preferred",
        "description": "Allergen-free and silent living space"
      },
      {
        "value": "pet_neutral_property",
        "label": "Neutral (Do not have a pet currently)",
        "description": "Does not affect housing choice"
      }
    ]
  },
  {
    "id": "rq24_deposit_expectation",
    "number": 24,
    "category": "finance",
    "categoryLabel": "Security Deposit",
    "categoryIcon": "DollarSign",
    "question": "Security deposit budget comfort:",
    "subtitle": "Avoids getting locked into heavy 6-10 month security deposits.",
    "options": [
      {
        "value": "low_deposit_1_2mo",
        "label": "Low Deposit (1 to 2 Months Rent)",
        "description": "Minimal upfront liquidity lockup"
      },
      {
        "value": "standard_deposit_3mo",
        "label": "Standard Deposit (3 Months Rent)",
        "description": "Typical metro agreement"
      },
      {
        "value": "flexible_deposit",
        "label": "Flexible on Deposit Amount",
        "description": "Prioritizing property quality over deposit"
      }
    ]
  },
  {
    "id": "rq25_lease_period",
    "number": 25,
    "category": "lease_terms",
    "categoryLabel": "Agreement Duration",
    "categoryIcon": "Calendar",
    "question": "Intended lease stay commitment:",
    "subtitle": "Helps match owners with matching lock-in periods.",
    "options": [
      {
        "value": "long_term_11mo",
        "label": "Long Term (11 Months or More)",
        "description": "Stable home for a year or longer"
      },
      {
        "value": "medium_term_6mo",
        "label": "Medium Term (6 Months Lock-in)",
        "description": "Project-based semester or probation"
      },
      {
        "value": "short_term_3mo",
        "label": "Short Term (1 to 3 Months Flexible)",
        "description": "Temporary internship or relocation"
      }
    ]
  }
];

export const ROOMMATE_QUESTIONS: BehavioralQuestion[] = [
  {
    "id": "mq1_bedtime_schedule",
    "number": 1,
    "category": "chronotype",
    "categoryLabel": "Sleep & Night Routine",
    "categoryIcon": "Moon",
    "question": "What is your typical weekday lights-out sleep time?",
    "subtitle": "Sleep alignment prevents late-night noise friction.",
    "options": [
      {
        "value": "22:00",
        "label": "10:00 PM (Early Bird)",
        "description": "Quiet hours start early, up with the sun"
      },
      {
        "value": "23:30",
        "label": "11:30 PM (Standard)",
        "description": "Balanced weekday bedtime"
      },
      {
        "value": "01:00",
        "label": "01:00 AM (Late Professional)",
        "description": "Nighttime reading, work, or gaming"
      },
      {
        "value": "02:30",
        "label": "02:30 AM+ (True Night Owl)",
        "description": "Nocturnal creative/developer rhythm"
      }
    ]
  },
  {
    "id": "mq2_waketime_schedule",
    "number": 2,
    "category": "chronotype",
    "categoryLabel": "Morning Routine",
    "categoryIcon": "Clock",
    "question": "When do you usually wake up in the morning?",
    "subtitle": "Ensures no morning washroom collisions or noise clashes.",
    "options": [
      {
        "value": "06:30",
        "label": "6:30 AM or Earlier",
        "description": "Early morning workout, study, or meditation"
      },
      {
        "value": "07:30",
        "label": "7:30 AM - 8:00 AM",
        "description": "Standard professional schedule"
      },
      {
        "value": "09:00",
        "label": "9:00 AM - 10:00 AM",
        "description": "Flexible remote work / college morning"
      },
      {
        "value": "11:00",
        "label": "After 10:30 AM",
        "description": "Late riser, sleeps in"
      }
    ]
  },
  {
    "id": "mq3_sleep_sensitivity",
    "number": 3,
    "category": "chronotype",
    "categoryLabel": "Sound Sensitivity",
    "categoryIcon": "Sliders",
    "question": "How sensitive are you to ambient noise or lights while sleeping?",
    "subtitle": "Crucial for matching room sharing and hallway noise tolerance.",
    "options": [
      {
        "value": "light_sleeper",
        "label": "Light Sleeper (Needs Quiet & Darkness)",
        "description": "Easily startled by doors or whispers"
      },
      {
        "value": "moderate_sleeper",
        "label": "Moderate Sleeper",
        "description": "Normal everyday house sounds are fine"
      },
      {
        "value": "deep_sleeper",
        "label": "Deep Sleeper (Sleeps Through Anything)",
        "description": "Unbothered by ambient music or alarms"
      }
    ]
  },
  {
    "id": "mq4_alarm_habits",
    "number": 4,
    "category": "chronotype",
    "categoryLabel": "Morning Alarms",
    "categoryIcon": "Clock",
    "question": "How do you handle your morning wake-up alarm?",
    "subtitle": "Continuous snoozing is a top complaint among flatmates.",
    "options": [
      {
        "value": "single_alarm",
        "label": "Single Alarm Riser",
        "description": "Turn off immediately upon ringing"
      },
      {
        "value": "few_snoozes",
        "label": "1 - 2 Snoozes (5-10 mins)",
        "description": "Gentle transition out of bed"
      },
      {
        "value": "multi_snoozer",
        "label": "Multiple Alarms (Rings Repeatedly)",
        "description": "Need multiple alarms over 30 mins"
      }
    ]
  },
  {
    "id": "mq5_dishes_hygiene",
    "number": 5,
    "category": "cleanliness",
    "categoryLabel": "Kitchen & Sink Hygiene",
    "categoryIcon": "CheckCircle2",
    "question": "What is your rule for used dishes in the kitchen sink?",
    "subtitle": "Number one reason for flatmate kitchen friction.",
    "options": [
      {
        "value": "clean_immediately",
        "label": "Wash Immediately After Meal",
        "description": "Sink kept strictly empty at all times"
      },
      {
        "value": "cleared_same_day",
        "label": "Cleaned Same Day (Before Bed)",
        "description": "Soaked and cleared before night"
      },
      {
        "value": "next_morning_maid",
        "label": "Left for Daily Maid in Morning",
        "description": "Maid washes all utensils daily"
      }
    ]
  },
  {
    "id": "mq6_bathroom_cleanliness",
    "number": 6,
    "category": "cleanliness",
    "categoryLabel": "Washroom Cleanliness",
    "categoryIcon": "CheckCircle2",
    "question": "What is your standard for shared bathroom maintenance?",
    "subtitle": "Keeps shared washrooms fresh, hygienic, and pleasant.",
    "options": [
      {
        "value": "dry_spotless",
        "label": "Spotless & Dry Floor After Use",
        "description": "Wiper used on floor, hair cleared from drain"
      },
      {
        "value": "standard_tidy",
        "label": "Moderate & Tidy",
        "description": "Clean counters, weekly thorough scrubbing"
      },
      {
        "value": "relaxed_cleaning",
        "label": "Relaxed Approach",
        "description": "Cleaned primarily when maid arrives"
      }
    ]
  },
  {
    "id": "mq7_bedroom_tidiness",
    "number": 7,
    "category": "cleanliness",
    "categoryLabel": "Personal Room Tidiness",
    "categoryIcon": "BedSingle",
    "question": "How tidy do you keep your personal bedroom?",
    "subtitle": "Affects overall apartment aesthetic and shared space vibe.",
    "options": [
      {
        "value": "neat_minimalist",
        "label": "Minimalist & Spotless (Bed Made Daily)",
        "description": "Everything organized in drawers"
      },
      {
        "value": "lived_in_clean",
        "label": "Lived-In & Comfortable",
        "description": "Clean, but clothes and books on desk"
      },
      {
        "value": "creative_chaos",
        "label": "Creative Clutter",
        "description": "Disorganized but clean, works for me"
      }
    ]
  },
  {
    "id": "mq8_common_areas",
    "number": 8,
    "category": "cleanliness",
    "categoryLabel": "Living Room Clutter",
    "categoryIcon": "Home",
    "question": "How should common living room and sofa areas be kept?",
    "subtitle": "Ensures everyone feels comfortable relaxing in shared halls.",
    "options": [
      {
        "value": "zero_clutter_hall",
        "label": "Strictly Clutter-Free Common Areas",
        "description": "No shoes, bags, or dirty clothes left in hall"
      },
      {
        "value": "reasonable_belongings",
        "label": "Reasonable Everyday Stuff OK",
        "description": "Jackets and study notes on dining table are fine"
      },
      {
        "value": "relaxed_hall",
        "label": "Lively Shared Lounge",
        "description": "Informal living space"
      }
    ]
  },
  {
    "id": "mq9_trash_disposal",
    "number": 9,
    "category": "cleanliness",
    "categoryLabel": "Waste Disposal",
    "categoryIcon": "Box",
    "question": "Trash disposal and recycling routine:",
    "subtitle": "Prevents odors and pest accumulation.",
    "options": [
      {
        "value": "daily_bin_clear",
        "label": "Binned & Disposed Outside Daily",
        "description": "No trash sits in kitchen overnight"
      },
      {
        "value": "when_full",
        "label": "Cleared Whenever Garbage Bag is Full",
        "description": "Tied and discarded at 90% capacity"
      },
      {
        "value": "maid_takes_trash",
        "label": "Maid Empties Bins on Arrival",
        "description": "Part of daily housekeeping"
      }
    ]
  },
  {
    "id": "mq10_dietary_preference",
    "number": 10,
    "category": "food_diet",
    "categoryLabel": "Dietary Lifestyle",
    "categoryIcon": "Heart",
    "question": "What is your food and dietary lifestyle?",
    "subtitle": "Hard constraint for vegetarian, vegan, and non-veg households.",
    "options": [
      {
        "value": "vegetarian",
        "label": "Strict Vegetarian / Jain Friendly",
        "description": "Plant-based, no eggs or meat in home"
      },
      {
        "value": "non_vegetarian",
        "label": "Non-Vegetarian Cooking Allowed",
        "description": "Cook chicken, eggs, and seafood comfortably"
      },
      {
        "value": "any",
        "label": "Flexible / Any Diet Respectful",
        "description": "Happy to live with vegetarians or non-vegetarians"
      }
    ]
  },
  {
    "id": "mq11_cookware_sharing",
    "number": 11,
    "category": "food_diet",
    "categoryLabel": "Kitchen Utensils",
    "categoryIcon": "Coffee",
    "question": "Utensil and cookware sharing boundary:",
    "subtitle": "Important for religious dietary practices and hygiene peace.",
    "options": [
      {
        "value": "separate_cookware",
        "label": "Strictly Separate Utensils for Veg / Non-Veg",
        "description": "Do not mix pans, plates, or cutlery"
      },
      {
        "value": "shared_cookware",
        "label": "Comfortable Sharing All Pots & Pans",
        "description": "All washed clean in soap together"
      },
      {
        "value": "personal_set",
        "label": "I Keep My Own Private Utensil Set",
        "description": "Prefer not sharing cooking equipment"
      }
    ]
  },
  {
    "id": "mq12_smoking_policy",
    "number": 12,
    "category": "lifestyle_substances",
    "categoryLabel": "Smoking & Vaping",
    "categoryIcon": "ShieldAlert",
    "question": "Smoking, vaping, and hookah attitude at home:",
    "subtitle": "Strict non-smoker filter prevents passive smoke discomfort.",
    "options": [
      {
        "value": "strictly_non_smoker",
        "label": "Strictly Non-Smoking Home",
        "description": "Zero smoke or vape inside the apartment"
      },
      {
        "value": "outside_only",
        "label": "Balcony or Outdoor Terrace Only",
        "description": "OK if restricted strictly outside closed doors"
      },
      {
        "value": "smoker_friendly",
        "label": "Smoker Friendly",
        "description": "Comfortable living with active smokers"
      }
    ]
  },
  {
    "id": "mq13_alcohol_attitude",
    "number": 13,
    "category": "lifestyle_substances",
    "categoryLabel": "Alcohol & Drinks",
    "categoryIcon": "ShieldAlert",
    "question": "Alcohol consumption policy inside the apartment:",
    "subtitle": "Ensures cultural and personal lifestyle harmony.",
    "options": [
      {
        "value": "alcohol_free_home",
        "label": "Alcohol-Free Home Preferred",
        "description": "Teetotaler household, no drinking at home"
      },
      {
        "value": "social_weekend_drinks",
        "label": "Moderate Social Drinks OK",
        "description": "Occasional beer or wine on weekend dinners"
      },
      {
        "value": "party_drinks_ok",
        "label": "Party & Bar Friendly",
        "description": "Open to cocktail nights and home bar setups"
      }
    ]
  },
  {
    "id": "mq14_daytime_routine",
    "number": 14,
    "category": "work_study",
    "categoryLabel": "Daytime Occupation",
    "categoryIcon": "Briefcase",
    "question": "What is your typical daytime occupancy routine?",
    "subtitle": "Determines house quietness during 9 AM to 6 PM.",
    "options": [
      {
        "value": "full_wfh",
        "label": "Work-From-Home All Day",
        "description": "Spend most of daytime inside the flat"
      },
      {
        "value": "office_college",
        "label": "Go to Office / College Daily",
        "description": "Away from 9 AM to 6:30 PM weekdays"
      },
      {
        "value": "hybrid_schedule",
        "label": "Hybrid (2 - 3 Days Home)",
        "description": "Alternating office and home routine"
      }
    ]
  },
  {
    "id": "mq15_sound_music_volume",
    "number": 15,
    "category": "noise_boundaries",
    "categoryLabel": "Music & Calls Volume",
    "categoryIcon": "Sliders",
    "question": "Phone calls and music listening volume in common spaces:",
    "subtitle": "Respects quiet study hours and focus time.",
    "options": [
      {
        "value": "headphones_rule",
        "label": "Headphones Mandatory for Audio",
        "description": "Never play speakers loud in common halls"
      },
      {
        "value": "low_volume_ambient",
        "label": "Low Ambient Volume OK",
        "description": "Soft background acoustics during day"
      },
      {
        "value": "speaker_free",
        "label": "Free Loud Speaker Living",
        "description": "Love open music and TV sounds"
      }
    ]
  },
  {
    "id": "mq16_social_energy",
    "number": 16,
    "category": "social",
    "categoryLabel": "Social Vibe",
    "categoryIcon": "Users",
    "question": "How do you describe your home social personality?",
    "subtitle": "Introverts need quiet recharging; extroverts crave banter.",
    "options": [
      {
        "value": "introverted_quiet",
        "label": "Introverted (Quiet Sanctuary)",
        "description": "Home is my personal zen space to recharge"
      },
      {
        "value": "balanced_social",
        "label": "Balanced & Friendly",
        "description": "Enjoy casual chats and occasional dinners together"
      },
      {
        "value": "extroverted_lively",
        "label": "Extroverted & High Energy",
        "description": "Love having people around and lively energy"
      }
    ]
  },
  {
    "id": "mq17_day_guests",
    "number": 17,
    "category": "guests",
    "categoryLabel": "Day Guests",
    "categoryIcon": "Users",
    "question": "Hosting day guests and study group friends:",
    "subtitle": "Sets boundaries for unexpected visitors.",
    "options": [
      {
        "value": "advance_notice_guests",
        "label": "Notice Appreciated Before Inviting",
        "description": "Quick heads-up on WhatsApp group"
      },
      {
        "value": "guests_welcome_anytime",
        "label": "Friends Welcome Anytime",
        "description": "Open door policy for study and work mates"
      },
      {
        "value": "rare_guests_only",
        "label": "Rare Guests / Quiet House Preferred",
        "description": "Prefer external meetups at cafes"
      }
    ]
  },
  {
    "id": "mq18_overnight_visitors",
    "number": 18,
    "category": "guests",
    "categoryLabel": "Overnight Guests",
    "categoryIcon": "Moon",
    "question": "Overnight guests policy (Friends / Siblings / Partners):",
    "subtitle": "Prevents uncomfortable privacy boundary surprises.",
    "options": [
      {
        "value": "weekend_advance_notice",
        "label": "Weekends with Advance Notice",
        "description": "Notice on chat, maximum 1-2 nights"
      },
      {
        "value": "partners_friends_welcome",
        "label": "Partners & Friends Welcome",
        "description": "Open and respectful attitude"
      },
      {
        "value": "strictly_no_overnight",
        "label": "Strictly No Overnight Guests",
        "description": "Privacy-first home policy"
      }
    ]
  },
  {
    "id": "mq19_weekend_vibe",
    "number": 19,
    "category": "social",
    "categoryLabel": "Weekend Lifestyle",
    "categoryIcon": "Sparkles",
    "question": "How do you spend your Saturday & Sunday weekends at home?",
    "subtitle": "Aligns recovery rhythms and noise expectations.",
    "options": [
      {
        "value": "peaceful_recharging",
        "label": "Peaceful Rest, Reading & Cooking",
        "description": "Quiet weekends to recharge for Monday"
      },
      {
        "value": "outing_exploring",
        "label": "Out Exploring the City / Travel",
        "description": "Rarely at home on weekends"
      },
      {
        "value": "weekend_get_togethers",
        "label": "Hosting Small Dinners or Board Games",
        "description": "Social home weekend vibes"
      }
    ]
  },
  {
    "id": "mq20_grocery_sharing",
    "number": 20,
    "category": "finances",
    "categoryLabel": "Shared Staples",
    "categoryIcon": "DollarSign",
    "question": "Sharing common household supplies (Oil, Salt, Dish Soap, Wi-Fi):",
    "subtitle": "Ensures transparent, stress-free household budgeting.",
    "options": [
      {
        "value": "split_common_supplies",
        "label": "Split Common Staples 50-50",
        "description": "Basic spices, cooking oil, and cleaning liquids pooled"
      },
      {
        "value": "keep_separate",
        "label": "Everything 100% Individual",
        "description": "Buy my own groceries and cleaning supplies"
      },
      {
        "value": "monthly_pot",
        "label": "Monthly House Fund (₹500 each)",
        "description": "Common fund for all shared items"
      }
    ]
  },
  {
    "id": "mq21_utility_bills_split",
    "number": 21,
    "category": "finances",
    "categoryLabel": "Bill Splitting",
    "categoryIcon": "DollarSign",
    "question": "How should monthly electricity, water, and Wi-Fi bills be settled?",
    "subtitle": "Punctuality in finances prevents awkward reminders.",
    "options": [
      {
        "value": "split_app_immediate",
        "label": "Splitwise App Immediately on Due Date",
        "description": "Paid within 24 hours of generation"
      },
      {
        "value": "monthly_reconciliation",
        "label": "Single Month-End Calculation",
        "description": "Settle all utilities along with rent"
      },
      {
        "value": "rotate_bills",
        "label": "Rotate Who Pays Which Bill",
        "description": "One person pays Wi-Fi, other pays maid"
      }
    ]
  },
  {
    "id": "mq22_borrowing_items",
    "number": 22,
    "category": "boundaries",
    "categoryLabel": "Personal Belongings",
    "categoryIcon": "ShieldCheck",
    "question": "Borrowing clothes, chargers, or personal electronics:",
    "subtitle": "Clear property respect boundaries.",
    "options": [
      {
        "value": "ask_every_time",
        "label": "Strictly Ask Permission Every Single Time",
        "description": "Respect private property boundaries"
      },
      {
        "value": "casual_sharing",
        "label": "Casual Sharing OK Between Friends",
        "description": "Chargers, books, and umbrellas are free to borrow"
      },
      {
        "value": "strictly_no_borrowing",
        "label": "Zero Borrowing / Keep Own Belongings",
        "description": "Strict separation of personal items"
      }
    ]
  },
  {
    "id": "mq23_conflict_resolution",
    "number": 23,
    "category": "communication",
    "categoryLabel": "Conflict Resolution",
    "categoryIcon": "MessageSquare",
    "question": "When a flatmate disagreement arises, how do you handle it?",
    "subtitle": "Emotional intelligence and mature communication.",
    "options": [
      {
        "value": "direct_calm_chat",
        "label": "Direct, Calm 1-on-1 Conversation",
        "description": "Talk it out over coffee politely without drama"
      },
      {
        "value": "group_chat_text",
        "label": "Group Chat / Text Message",
        "description": "Draft a polite text message to explain"
      },
      {
        "value": "give_space_then_talk",
        "label": "Give Cool-Off Space First",
        "description": "Sleep on it, address when emotions are calm"
      }
    ]
  },
  {
    "id": "mq24_pet_comfort",
    "number": 24,
    "category": "pets",
    "categoryLabel": "Pet Living Attitude",
    "categoryIcon": "Heart",
    "question": "Attitude towards pets (cats, dogs, birds) inside the house:",
    "subtitle": "Crucial for allergy sufferers and pet enthusiasts.",
    "options": [
      {
        "value": "love_pets_home",
        "label": "Love Pets / Have or Want a Pet",
        "description": "Thrilled to live with furry friends"
      },
      {
        "value": "pet_neutral",
        "label": "Neutral as Long as Owner Cleans Up",
        "description": "OK if well trained and no shedding in room"
      },
      {
        "value": "strictly_no_pets",
        "label": "Strictly Pet-Free (Allergies / Discomfort)",
        "description": "Cannot reside with animals"
      }
    ]
  },
  {
    "id": "mq25_roommate_vision",
    "number": 25,
    "category": "vision",
    "categoryLabel": "Roommate Bond",
    "categoryIcon": "Users",
    "question": "What is your ideal relationship with your future roommate?",
    "subtitle": "Aligns mutual expectations for an enjoyable cohousing journey.",
    "options": [
      {
        "value": "best_friends",
        "label": "Close Friends & City Exploring Companions",
        "description": "Hang out, share meals, watch movies, bond"
      },
      {
        "value": "warm_respectful",
        "label": "Warm, Respectful Cohabitants",
        "description": "Friendly greeting, care for each other, independent lives"
      },
      {
        "value": "polite_transactional",
        "label": "Polite & Strictly Transactional",
        "description": "Quiet, pay rent on time, mind own business"
      }
    ]
  }
];

export const COMBINED_QUESTIONS: BehavioralQuestion[] = [
  {
    "id": "rq1_max_budget",
    "number": 1,
    "category": "budget_lease",
    "categoryLabel": "Budget & Rent",
    "categoryIcon": "DollarSign",
    "question": "What is your maximum monthly rent budget ceiling?",
    "subtitle": "Ensures we never recommend rooms exceeding your financial limit.",
    "options": [
      {
        "value": "under_10k",
        "label": "Under ₹10,000 / mo",
        "description": "Affordable student budget"
      },
      {
        "value": "10k_15k",
        "label": "₹10,000 - ₹15,000 / mo",
        "description": "Moderate shared or private room"
      },
      {
        "value": "15k_22k",
        "label": "₹15,000 - ₹22,000 / mo",
        "description": "Premium private master room or studio"
      },
      {
        "value": "22k_plus",
        "label": "Above ₹22,000 / mo",
        "description": "Luxury 1BHK/2BHK apartment living"
      }
    ]
  },
  {
    "id": "rq2_room_category",
    "number": 2,
    "category": "space_type",
    "categoryLabel": "Room Category",
    "categoryIcon": "Home",
    "question": "Which room type is your primary target?",
    "subtitle": "Select the privacy level you desire.",
    "options": [
      {
        "value": "Private Room",
        "label": "Private Room",
        "description": "Dedicated personal bedroom with lock"
      },
      {
        "value": "Shared Room",
        "label": "Shared Room",
        "description": "Twin-sharing with 1 flatmate for cost savings"
      },
      {
        "value": "Entire Apartment",
        "label": "Entire Apartment",
        "description": "Full 1BHK, 2BHK or 3BHK flat"
      },
      {
        "value": "Studio",
        "label": "Studio Apartment",
        "description": "Self-contained 1RK studio unit"
      }
    ]
  },
  {
    "id": "rq3_furnishing",
    "number": 3,
    "category": "furnishing",
    "categoryLabel": "Furnishing Standards",
    "categoryIcon": "BedSingle",
    "question": "What furnishing standard do you require upon moving in?",
    "subtitle": "Avoids bringing heavy furniture or paying unnecessary rental charges.",
    "options": [
      {
        "value": "Fully Furnished",
        "label": "Fully Furnished",
        "description": "Bed, mattress, wardrobe, study table, AC, and sofa"
      },
      {
        "value": "Semi Furnished",
        "label": "Semi Furnished",
        "description": "Wardrobes, modular kitchen, fans & lights"
      },
      {
        "value": "Unfurnished",
        "label": "Unfurnished",
        "description": "Empty canvas, I will furnish with my own furniture"
      }
    ]
  },
  {
    "id": "rq4_bathroom_type",
    "number": 4,
    "category": "convenience",
    "categoryLabel": "Washroom Preference",
    "categoryIcon": "CheckCircle2",
    "question": "What bathroom configuration do you require?",
    "subtitle": "Privacy in the morning routine.",
    "options": [
      {
        "value": "attached_mandatory",
        "label": "Attached Washroom Mandatory",
        "description": "Exclusive access inside bedroom"
      },
      {
        "value": "shared_one",
        "label": "Shared with Max 1 Person",
        "description": "Comfortable sharing with a clean roommate"
      },
      {
        "value": "common_hallway",
        "label": "Common Hallway Washroom OK",
        "description": "Open to standard flat layout"
      }
    ]
  },
  {
    "id": "rq5_ac_requirement",
    "number": 5,
    "category": "climate",
    "categoryLabel": "Climate & AC",
    "categoryIcon": "Sliders",
    "question": "Is an Air Conditioner (AC) mandatory in the room?",
    "subtitle": "Crucial for summer temperatures in metro cities.",
    "options": [
      {
        "value": "split_ac_must",
        "label": "Split AC Mandatory",
        "description": "Must have dedicated AC in bedroom"
      },
      {
        "value": "cooler_fan_ok",
        "label": "Air Cooler / Ceiling Fan OK",
        "description": "Fine with standard cooling"
      },
      {
        "value": "climate_neutral",
        "label": "Naturally Ventilated Room",
        "description": "No need for AC, prefer natural breeze"
      }
    ]
  },
  {
    "id": "rq6_wfh_desk",
    "number": 6,
    "category": "work_study",
    "categoryLabel": "Work & Study Space",
    "categoryIcon": "Briefcase",
    "question": "Do you need a dedicated Work-From-Home / Study desk setup?",
    "subtitle": "Important for productivity during remote work or study.",
    "options": [
      {
        "value": "dedicated_ergonomic",
        "label": "Dedicated Study Desk & Ergonomic Chair",
        "description": "Need proper workspace inside the bedroom"
      },
      {
        "value": "basic_table",
        "label": "Basic Table & Chair",
        "description": "Casual study or laptop setup"
      },
      {
        "value": "flexible_wfh",
        "label": "Common Area / Flexible",
        "description": "Can study in hall or bed"
      }
    ]
  },
  {
    "id": "rq7_power_backup",
    "number": 7,
    "category": "utility",
    "categoryLabel": "Power Continuity",
    "categoryIcon": "Zap",
    "question": "What is your power backup requirement?",
    "subtitle": "Prevents sudden interruptions during work calls and studies.",
    "options": [
      {
        "value": "full_dg_backup",
        "label": "100% DG Generator Backup",
        "description": "Runs AC, Wi-Fi, and heavy appliances 24/7"
      },
      {
        "value": "inverter_basic",
        "label": "Inverter Backup (Fans, Lights, Wi-Fi)",
        "description": "Basic backup for essential needs"
      },
      {
        "value": "no_preference",
        "label": "Normal Grid Power (Backup Not Essential)",
        "description": "Occasional cuts are manageable"
      }
    ]
  },
  {
    "id": "rq8_wifi_speed",
    "number": 8,
    "category": "connectivity",
    "categoryLabel": "Internet & Connectivity",
    "categoryIcon": "Wifi",
    "question": "Required Wi-Fi and fiber broadband speed:",
    "subtitle": "Ensures seamless streaming, gaming, and remote meetings.",
    "options": [
      {
        "value": "ultra_fast",
        "label": "Ultra High-Speed (200 - 300+ Mbps Fiber)",
        "description": "Heavy video calls, cloud computing & gaming"
      },
      {
        "value": "standard_broadband",
        "label": "Standard Fiber (50 - 100 Mbps)",
        "description": "Smooth everyday browsing & streaming"
      },
      {
        "value": "mobile_hotspot",
        "label": "Personal Mobile Hotspot / Dongle",
        "description": "No requirement for in-house broadband"
      }
    ]
  },
  {
    "id": "rq9_kitchen_cooking",
    "number": 9,
    "category": "food_kitchen",
    "categoryLabel": "Kitchen Facilities",
    "categoryIcon": "Coffee",
    "question": "Kitchen and cooking access preference:",
    "subtitle": "Aligns daily meal habits and cooking autonomy.",
    "options": [
      {
        "value": "full_modular_kitchen",
        "label": "Full Modular Kitchen with Gas & Microwave",
        "description": "Love daily cooking and meal prep"
      },
      {
        "value": "light_cooking",
        "label": "Light Cooking / Tea & Snacks",
        "description": "Mostly tea, breakfast, and instant food"
      },
      {
        "value": "no_cooking_tiffin",
        "label": "Tiffin Service / Meal Ordering",
        "description": "Do not plan to cook, rely on delivery"
      }
    ]
  },
  {
    "id": "rq10_balcony_sunlight",
    "number": 10,
    "category": "ventilation",
    "categoryLabel": "Sunlight & Balcony",
    "categoryIcon": "Sun",
    "question": "Sunlight and private balcony requirement:",
    "subtitle": "Fresh air and natural lighting make a huge difference in living quality.",
    "options": [
      {
        "value": "attached_balcony",
        "label": "Attached Private Balcony with Sunlight",
        "description": "Private outdoor morning coffee spot"
      },
      {
        "value": "large_window",
        "label": "Large Windows with Natural Light",
        "description": "Well-ventilated without attached balcony"
      },
      {
        "value": "internal_room_ok",
        "label": "Standard Room (Light Flexible)",
        "description": "Sunlight is not a primary factor"
      }
    ]
  },
  {
    "id": "rq13_parking_type",
    "number": 11,
    "category": "mobility",
    "categoryLabel": "Vehicle Parking",
    "categoryIcon": "Car",
    "question": "What parking facility do you require for your vehicle?",
    "subtitle": "Prevents street parking ticketing and damage.",
    "options": [
      {
        "value": "covered_car_parking",
        "label": "Covered 4-Wheeler Car Parking",
        "description": "Dedicated slot for car"
      },
      {
        "value": "two_wheeler_parking",
        "label": "2-Wheeler Scooter / Bike Parking",
        "description": "Safe covered parking for bike"
      },
      {
        "value": "no_vehicle",
        "label": "No Vehicle Parking Needed",
        "description": "Rely on Metro, cabs, or walking"
      }
    ]
  },
  {
    "id": "rq20_metro_commute",
    "number": 12,
    "category": "transit",
    "categoryLabel": "Transit & Metro",
    "categoryIcon": "MapPin",
    "question": "Proximity to Metro station or primary bus terminus:",
    "subtitle": "Saves hours of traffic daily in busy metropolitan cities.",
    "options": [
      {
        "value": "walking_metro",
        "label": "Under 10 Minutes Walk (< 800m)",
        "description": "Walk directly to the metro platform"
      },
      {
        "value": "short_auto_metro",
        "label": "Within 2 - 3 km (Short Auto/Bus Ride)",
        "description": "Quick auto or bike commute"
      },
      {
        "value": "commute_flexible",
        "label": "Flexible (Own Vehicle / Remote Work)",
        "description": "Proximity to transit is not critical"
      }
    ]
  },
  {
    "id": "mq1_bedtime_schedule",
    "number": 13,
    "category": "chronotype",
    "categoryLabel": "Sleep & Night Routine",
    "categoryIcon": "Moon",
    "question": "What is your typical weekday lights-out sleep time?",
    "subtitle": "Sleep alignment prevents late-night noise friction.",
    "options": [
      {
        "value": "22:00",
        "label": "10:00 PM (Early Bird)",
        "description": "Quiet hours start early, up with the sun"
      },
      {
        "value": "23:30",
        "label": "11:30 PM (Standard)",
        "description": "Balanced weekday bedtime"
      },
      {
        "value": "01:00",
        "label": "01:00 AM (Late Professional)",
        "description": "Nighttime reading, work, or gaming"
      },
      {
        "value": "02:30",
        "label": "02:30 AM+ (True Night Owl)",
        "description": "Nocturnal creative/developer rhythm"
      }
    ]
  },
  {
    "id": "mq2_waketime_schedule",
    "number": 14,
    "category": "chronotype",
    "categoryLabel": "Morning Routine",
    "categoryIcon": "Clock",
    "question": "When do you usually wake up in the morning?",
    "subtitle": "Ensures no morning washroom collisions or noise clashes.",
    "options": [
      {
        "value": "06:30",
        "label": "6:30 AM or Earlier",
        "description": "Early morning workout, study, or meditation"
      },
      {
        "value": "07:30",
        "label": "7:30 AM - 8:00 AM",
        "description": "Standard professional schedule"
      },
      {
        "value": "09:00",
        "label": "9:00 AM - 10:00 AM",
        "description": "Flexible remote work / college morning"
      },
      {
        "value": "11:00",
        "label": "After 10:30 AM",
        "description": "Late riser, sleeps in"
      }
    ]
  },
  {
    "id": "mq3_sleep_sensitivity",
    "number": 15,
    "category": "chronotype",
    "categoryLabel": "Sound Sensitivity",
    "categoryIcon": "Sliders",
    "question": "How sensitive are you to ambient noise or lights while sleeping?",
    "subtitle": "Crucial for matching room sharing and hallway noise tolerance.",
    "options": [
      {
        "value": "light_sleeper",
        "label": "Light Sleeper (Needs Quiet & Darkness)",
        "description": "Easily startled by doors or whispers"
      },
      {
        "value": "moderate_sleeper",
        "label": "Moderate Sleeper",
        "description": "Normal everyday house sounds are fine"
      },
      {
        "value": "deep_sleeper",
        "label": "Deep Sleeper (Sleeps Through Anything)",
        "description": "Unbothered by ambient music or alarms"
      }
    ]
  },
  {
    "id": "mq5_dishes_hygiene",
    "number": 16,
    "category": "cleanliness",
    "categoryLabel": "Kitchen & Sink Hygiene",
    "categoryIcon": "CheckCircle2",
    "question": "What is your rule for used dishes in the kitchen sink?",
    "subtitle": "Number one reason for flatmate kitchen friction.",
    "options": [
      {
        "value": "clean_immediately",
        "label": "Wash Immediately After Meal",
        "description": "Sink kept strictly empty at all times"
      },
      {
        "value": "cleared_same_day",
        "label": "Cleaned Same Day (Before Bed)",
        "description": "Soaked and cleared before night"
      },
      {
        "value": "next_morning_maid",
        "label": "Left for Daily Maid in Morning",
        "description": "Maid washes all utensils daily"
      }
    ]
  },
  {
    "id": "mq6_bathroom_cleanliness",
    "number": 17,
    "category": "cleanliness",
    "categoryLabel": "Washroom Cleanliness",
    "categoryIcon": "CheckCircle2",
    "question": "What is your standard for shared bathroom maintenance?",
    "subtitle": "Keeps shared washrooms fresh, hygienic, and pleasant.",
    "options": [
      {
        "value": "dry_spotless",
        "label": "Spotless & Dry Floor After Use",
        "description": "Wiper used on floor, hair cleared from drain"
      },
      {
        "value": "standard_tidy",
        "label": "Moderate & Tidy",
        "description": "Clean counters, weekly thorough scrubbing"
      },
      {
        "value": "relaxed_cleaning",
        "label": "Relaxed Approach",
        "description": "Cleaned primarily when maid arrives"
      }
    ]
  },
  {
    "id": "mq8_common_areas",
    "number": 18,
    "category": "cleanliness",
    "categoryLabel": "Living Room Clutter",
    "categoryIcon": "Home",
    "question": "How should common living room and sofa areas be kept?",
    "subtitle": "Ensures everyone feels comfortable relaxing in shared halls.",
    "options": [
      {
        "value": "zero_clutter_hall",
        "label": "Strictly Clutter-Free Common Areas",
        "description": "No shoes, bags, or dirty clothes left in hall"
      },
      {
        "value": "reasonable_belongings",
        "label": "Reasonable Everyday Stuff OK",
        "description": "Jackets and study notes on dining table are fine"
      },
      {
        "value": "relaxed_hall",
        "label": "Lively Shared Lounge",
        "description": "Informal living space"
      }
    ]
  },
  {
    "id": "mq10_dietary_preference",
    "number": 19,
    "category": "food_diet",
    "categoryLabel": "Dietary Lifestyle",
    "categoryIcon": "Heart",
    "question": "What is your food and dietary lifestyle?",
    "subtitle": "Hard constraint for vegetarian, vegan, and non-veg households.",
    "options": [
      {
        "value": "vegetarian",
        "label": "Strict Vegetarian / Jain Friendly",
        "description": "Plant-based, no eggs or meat in home"
      },
      {
        "value": "non_vegetarian",
        "label": "Non-Vegetarian Cooking Allowed",
        "description": "Cook chicken, eggs, and seafood comfortably"
      },
      {
        "value": "any",
        "label": "Flexible / Any Diet Respectful",
        "description": "Happy to live with vegetarians or non-vegetarians"
      }
    ]
  },
  {
    "id": "mq12_smoking_policy",
    "number": 20,
    "category": "lifestyle_substances",
    "categoryLabel": "Smoking & Vaping",
    "categoryIcon": "ShieldAlert",
    "question": "Smoking, vaping, and hookah attitude at home:",
    "subtitle": "Strict non-smoker filter prevents passive smoke discomfort.",
    "options": [
      {
        "value": "strictly_non_smoker",
        "label": "Strictly Non-Smoking Home",
        "description": "Zero smoke or vape inside the apartment"
      },
      {
        "value": "outside_only",
        "label": "Balcony or Outdoor Terrace Only",
        "description": "OK if restricted strictly outside closed doors"
      },
      {
        "value": "smoker_friendly",
        "label": "Smoker Friendly",
        "description": "Comfortable living with active smokers"
      }
    ]
  },
  {
    "id": "mq13_alcohol_attitude",
    "number": 21,
    "category": "lifestyle_substances",
    "categoryLabel": "Alcohol & Drinks",
    "categoryIcon": "ShieldAlert",
    "question": "Alcohol consumption policy inside the apartment:",
    "subtitle": "Ensures cultural and personal lifestyle harmony.",
    "options": [
      {
        "value": "alcohol_free_home",
        "label": "Alcohol-Free Home Preferred",
        "description": "Teetotaler household, no drinking at home"
      },
      {
        "value": "social_weekend_drinks",
        "label": "Moderate Social Drinks OK",
        "description": "Occasional beer or wine on weekend dinners"
      },
      {
        "value": "party_drinks_ok",
        "label": "Party & Bar Friendly",
        "description": "Open to cocktail nights and home bar setups"
      }
    ]
  },
  {
    "id": "mq15_sound_music_volume",
    "number": 22,
    "category": "noise_boundaries",
    "categoryLabel": "Music & Calls Volume",
    "categoryIcon": "Sliders",
    "question": "Phone calls and music listening volume in common spaces:",
    "subtitle": "Respects quiet study hours and focus time.",
    "options": [
      {
        "value": "headphones_rule",
        "label": "Headphones Mandatory for Audio",
        "description": "Never play speakers loud in common halls"
      },
      {
        "value": "low_volume_ambient",
        "label": "Low Ambient Volume OK",
        "description": "Soft background acoustics during day"
      },
      {
        "value": "speaker_free",
        "label": "Free Loud Speaker Living",
        "description": "Love open music and TV sounds"
      }
    ]
  },
  {
    "id": "mq16_social_energy",
    "number": 23,
    "category": "social",
    "categoryLabel": "Social Vibe",
    "categoryIcon": "Users",
    "question": "How do you describe your home social personality?",
    "subtitle": "Introverts need quiet recharging; extroverts crave banter.",
    "options": [
      {
        "value": "introverted_quiet",
        "label": "Introverted (Quiet Sanctuary)",
        "description": "Home is my personal zen space to recharge"
      },
      {
        "value": "balanced_social",
        "label": "Balanced & Friendly",
        "description": "Enjoy casual chats and occasional dinners together"
      },
      {
        "value": "extroverted_lively",
        "label": "Extroverted & High Energy",
        "description": "Love having people around and lively energy"
      }
    ]
  },
  {
    "id": "mq18_overnight_visitors",
    "number": 24,
    "category": "guests",
    "categoryLabel": "Overnight Guests",
    "categoryIcon": "Moon",
    "question": "Overnight guests policy (Friends / Siblings / Partners):",
    "subtitle": "Prevents uncomfortable privacy boundary surprises.",
    "options": [
      {
        "value": "weekend_advance_notice",
        "label": "Weekends with Advance Notice",
        "description": "Notice on chat, maximum 1-2 nights"
      },
      {
        "value": "partners_friends_welcome",
        "label": "Partners & Friends Welcome",
        "description": "Open and respectful attitude"
      },
      {
        "value": "strictly_no_overnight",
        "label": "Strictly No Overnight Guests",
        "description": "Privacy-first home policy"
      }
    ]
  },
  {
    "id": "mq25_roommate_vision",
    "number": 25,
    "category": "vision",
    "categoryLabel": "Roommate Bond",
    "categoryIcon": "Users",
    "question": "What is your ideal relationship with your future roommate?",
    "subtitle": "Aligns mutual expectations for an enjoyable cohousing journey.",
    "options": [
      {
        "value": "best_friends",
        "label": "Close Friends & City Exploring Companions",
        "description": "Hang out, share meals, watch movies, bond"
      },
      {
        "value": "warm_respectful",
        "label": "Warm, Respectful Cohabitants",
        "description": "Friendly greeting, care for each other, independent lives"
      },
      {
        "value": "polite_transactional",
        "label": "Polite & Strictly Transactional",
        "description": "Quiet, pay rent on time, mind own business"
      }
    ]
  }
];

export const BEHAVIORAL_QUESTIONS: BehavioralQuestion[] = COMBINED_QUESTIONS;

export function getQuestionsForIntent(intent: 'room' | 'roommate' | 'combined'): BehavioralQuestion[] {
  if (intent === 'room') return ROOM_QUESTIONS;
  if (intent === 'roommate') return ROOMMATE_QUESTIONS;
  return COMBINED_QUESTIONS;
}
