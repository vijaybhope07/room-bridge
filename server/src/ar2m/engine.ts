// AR²M — Adaptive Room & Roommate Matching Framework
// Section 9 of Project Specification

import { 
  Room, 
  RoommateProfile, 
  RoomPreferences, 
  RoommatePreferences, 
  MandatoryRequirements,
  MatchReason,
  CleanlinessLevel,
  NoiseTolerance,
  SocialLifestyle,
  FoodPreference,
  SmokingPreference
} from '../types/index.js';

// ==========================================
// STAGE 4: MATHEMATICAL SIMILARITY FUNCTIONS
// ==========================================

/**
 * Jaccard Similarity between two sets/arrays of string tags
 * J(A, B) = |A ∩ B| / |A ∪ B|
 */
export function calculateJaccardSimilarity(setA: string[] = [], setB: string[] = []): number {
  if (!setA.length && !setB.length) return 1.0; // Both empty -> neutral match
  if (!setA.length || !setB.length) return 0.2; // One missing -> partial default

  const lowerA = new Set(setA.map(s => s.toLowerCase().trim()));
  const lowerB = new Set(setB.map(s => s.toLowerCase().trim()));

  let intersectionCount = 0;
  for (const item of lowerA) {
    if (lowerB.has(item)) intersectionCount++;
  }

  const unionCount = new Set([...lowerA, ...lowerB]).size;
  return unionCount === 0 ? 0 : intersectionCount / unionCount;
}

/**
 * Ordinal Similarity for ranked attributes (e.g. Cleanliness, Noise)
 */
export function calculateOrdinalSimilarity(valueA: string, valueB: string, order: string[]): number {
  const indexA = order.indexOf(valueA);
  const indexB = order.indexOf(valueB);
  if (indexA === -1 || indexB === -1) return 0.5; // Unknown value fallback

  const maxDiff = order.length - 1;
  const actualDiff = Math.abs(indexA - indexB);
  return Math.max(0, 1 - actualDiff / maxDiff);
}

/**
 * Time difference in hours between two 24h clock strings (e.g. "23:00" and "02:00")
 */
export function calculateTimeDifferenceHours(timeA: string, timeB: string): number {
  const [hA, mA] = (timeA || '23:00').split(':').map(Number);
  const [hB, mB] = (timeB || '23:00').split(':').map(Number);

  const minutesA = (hA || 0) * 60 + (mA || 0);
  const minutesB = (hB || 0) * 60 + (mB || 0);

  let diffMinutes = Math.abs(minutesA - minutesB);
  if (diffMinutes > 720) { // Wrap around 24 hours (1440 min / 2 = 720)
    diffMinutes = 1440 - diffMinutes;
  }
  return diffMinutes / 60;
}

// Ordinal maps
const CLEANLINESS_ORDER: CleanlinessLevel[] = ['relaxed', 'moderate', 'spotless'];
const NOISE_ORDER: NoiseTolerance[] = ['low', 'moderate', 'high'];
const SOCIAL_ORDER: SocialLifestyle[] = ['quiet', 'moderate', 'social'];

// ==========================================
// STAGE 1: HARD-CONSTRAINT FILTERING
// ==========================================

export function passesRoomHardConstraints(
  room: Room, 
  mandatory?: MandatoryRequirements
): { passes: boolean; reason?: string } {
  if (room.status !== 'available') {
    return { passes: false, reason: 'Room is currently reserved or occupied' };
  }

  if (mandatory?.maxRentLimit && room.rent > mandatory.maxRentLimit) {
    return { passes: false, reason: `Rent ₹${room.rent} exceeds mandatory limit ₹${mandatory.maxRentLimit}` };
  }

  if (mandatory?.requiredCity && room.city.toLowerCase() !== mandatory.requiredCity.toLowerCase()) {
    return { passes: false, reason: `Room in ${room.city} does not match required city ${mandatory.requiredCity}` };
  }

  if (mandatory?.requiredRoomType && room.roomType !== mandatory.requiredRoomType) {
    return { passes: false, reason: `Room type ${room.roomType} does not match required ${mandatory.requiredRoomType}` };
  }

  return { passes: true };
}

export function passesRoommateHardConstraints(
  candidate: RoommateProfile,
  userPreferences?: RoommatePreferences,
  mandatory?: MandatoryRequirements
): { passes: boolean; reason?: string } {
  if (mandatory?.requiredCity && candidate.preferredCity.toLowerCase() !== mandatory.requiredCity.toLowerCase()) {
    return { passes: false, reason: `Location ${candidate.preferredCity} does not match mandatory city ${mandatory.requiredCity}` };
  }

  if (mandatory?.nonSmokerOnly && candidate.smokingPreference === 'smoker') {
    return { passes: false, reason: 'Candidate is an active smoker; non-smoker constraint active' };
  }

  // Budget hard constraint: If candidate's minimum is strictly higher than user's maximum budget
  if (userPreferences?.budgetMax && candidate.budgetMin > userPreferences.budgetMax) {
    return { passes: false, reason: 'Candidate budget range does not overlap with your budget' };
  }

  return { passes: true };
}

// ==========================================
// STAGE 2: ROOM SUITABILITY SCORING
// ==========================================

export function calculateRoomScore(
  room: Room, 
  prefs?: RoomPreferences
): { score: number; reasons: MatchReason[] } {
  const reasons: MatchReason[] = [];

  if (!prefs) {
    return { score: 75, reasons: [{ type: 'neutral', text: 'Baseline room score without specific preferences' }] };
  }

  // 1. Rent Matching (Weight: 25%)
  let rentScore = 50;
  if (prefs.maxRent) {
    if (room.rent <= prefs.maxRent) {
      const savings = (prefs.maxRent - room.rent) / prefs.maxRent;
      // High score when within budget and offering good value
      rentScore = Math.min(100, Math.round(85 + savings * 15));
      reasons.push({ type: 'positive', text: `Rent ₹${room.rent.toLocaleString()}/mo is well within your budget of ₹${prefs.maxRent.toLocaleString()}` });
    } else {
      const overage = (room.rent - prefs.maxRent) / prefs.maxRent;
      rentScore = Math.max(0, Math.round(70 - overage * 120));
      reasons.push({ type: 'warning', text: `Rent ₹${room.rent.toLocaleString()}/mo is above your target budget` });
    }
  }

  // 2. Location & Locality (Weight: 20%)
  let locationScore = 40;
  if (prefs.city && room.city.toLowerCase() === prefs.city.toLowerCase()) {
    if (prefs.locality && room.locality.toLowerCase().includes(prefs.locality.toLowerCase())) {
      locationScore = 100;
      reasons.push({ type: 'positive', text: `Prime location in your preferred neighborhood: ${room.locality}` });
    } else {
      locationScore = 75;
      reasons.push({ type: 'positive', text: `Located in your preferred city of ${room.city}` });
    }
  }

  // 3. Distance from College/Work (Weight: 15%)
  let distanceScore = 50;
  if (room.distanceKm <= 2.5) {
    distanceScore = 100;
    reasons.push({ type: 'positive', text: `Very close commute (${room.distanceKm} km from campus/hub)` });
  } else if (room.distanceKm <= 6.0) {
    distanceScore = 80;
    reasons.push({ type: 'neutral', text: `Manageable distance of ${room.distanceKm} km` });
  } else {
    distanceScore = Math.max(25, Math.round(100 - room.distanceKm * 6));
    reasons.push({ type: 'warning', text: `Longer commute distance (${room.distanceKm} km)` });
  }

  // 4. Room Type (Weight: 10%)
  let roomTypeScore = 70;
  if (prefs.roomType) {
    if (room.roomType === prefs.roomType) {
      roomTypeScore = 100;
      reasons.push({ type: 'positive', text: `Matches preferred accommodation style: ${room.roomType}` });
    } else {
      roomTypeScore = 40;
    }
  }

  // 5. Furnishing (Weight: 10%)
  let furnishingScore = 70;
  if (prefs.furnishing) {
    if (room.furnishing === prefs.furnishing) {
      furnishingScore = 100;
      reasons.push({ type: 'positive', text: `Matches furnishing standard: ${room.furnishing}` });
    } else if (room.furnishing === 'Fully Furnished') {
      furnishingScore = 90;
    } else {
      furnishingScore = 50;
    }
  }

  // 6. Amenities Jaccard Match (Weight: 10%)
  let amenitiesScore = 80;
  if (prefs.requiredAmenities && prefs.requiredAmenities.length > 0) {
    const jaccard = calculateJaccardSimilarity(prefs.requiredAmenities, room.amenities);
    amenitiesScore = Math.round(jaccard * 100);
    const matched = room.amenities.filter(a => prefs.requiredAmenities?.includes(a));
    if (matched.length > 0) {
      reasons.push({ type: 'positive', text: `Includes ${matched.length} of your requested amenities (${matched.slice(0, 3).join(', ')})` });
    }
  }

  // 7. Availability (Weight: 10%)
  const availabilityScore = room.status === 'available' ? 100 : 30;

  // Weighted Sum: 25% Rent + 20% Loc + 15% Dist + 10% Type + 10% Furn + 10% Amen + 10% Avail
  const finalScore = Math.round(
    rentScore * 0.25 +
    locationScore * 0.20 +
    distanceScore * 0.15 +
    roomTypeScore * 0.10 +
    furnishingScore * 0.10 +
    amenitiesScore * 0.10 +
    availabilityScore * 0.10
  );

  return {
    score: Math.min(100, Math.max(0, finalScore)),
    reasons
  };
}

// ==========================================
// STAGE 3, 4, 5: ROOMMATE COMPATIBILITY & CONFLICT
// ==========================================

export function calculateRoommateCompatibility(
  candidate: RoommateProfile,
  userPrefs?: RoommatePreferences
): { baseScore: number; conflictPenalty: number; finalScore: number; reasons: MatchReason[] } {
  const reasons: MatchReason[] = [];

  if (!userPrefs) {
    return {
      baseScore: 78,
      conflictPenalty: 0,
      finalScore: 78,
      reasons: [{ type: 'neutral', text: 'Default compatibility baseline' }]
    };
  }

  // 1. Budget Compatibility (15%)
  let budgetScore = 75;
  if (userPrefs.budgetMin && userPrefs.budgetMax) {
    const overlapMin = Math.max(userPrefs.budgetMin, candidate.budgetMin);
    const overlapMax = Math.min(userPrefs.budgetMax, candidate.budgetMax);
    if (overlapMax >= overlapMin) {
      budgetScore = 100;
      reasons.push({ type: 'positive', text: `Aligned budget range (₹${candidate.budgetMin.toLocaleString()} - ₹${candidate.budgetMax.toLocaleString()})` });
    } else {
      const gap = Math.abs(userPrefs.budgetMax - candidate.budgetMin);
      budgetScore = Math.max(20, Math.round(80 - (gap / 1000) * 10));
      reasons.push({ type: 'warning', text: 'Minor budget overlap discrepancy' });
    }
  }

  // 2. Location Compatibility (10%)
  let locationScore = 60;
  if (userPrefs.preferredCity && candidate.preferredCity.toLowerCase() === userPrefs.preferredCity.toLowerCase()) {
    locationScore = 100;
    reasons.push({ type: 'positive', text: `Looking to live in the same city: ${candidate.preferredCity}` });
  }

  // 3. Food Preference (10%)
  let foodScore = 80;
  if (userPrefs.foodPreference) {
    if (userPrefs.foodPreference === 'any' || candidate.foodPreference === 'any' || userPrefs.foodPreference === candidate.foodPreference) {
      foodScore = 100;
      reasons.push({ type: 'positive', text: `Compatible dietary preference: ${candidate.foodPreference}` });
    } else {
      foodScore = 50;
    }
  }

  // 4. Sleep & Wake Schedule (15%)
  let sleepScore = 85;
  const userTargetSleep = userPrefs.sleepTimeRange === 'early' ? '22:30' : '00:30';
  const hoursDiff = calculateTimeDifferenceHours(userTargetSleep, candidate.sleepTime);
  if (hoursDiff <= 1.0) {
    sleepScore = 100;
    reasons.push({ type: 'positive', text: `Synchronized sleep schedule (~${candidate.sleepTime} bedtime)` });
  } else if (hoursDiff <= 2.5) {
    sleepScore = 75;
    reasons.push({ type: 'neutral', text: `Compatible sleep routine (${hoursDiff.toFixed(1)} hrs variance)` });
  } else {
    sleepScore = Math.max(20, Math.round(100 - hoursDiff * 20));
  }

  // 5. Cleanliness Preference (15%)
  let cleanScore = 80;
  if (userPrefs.cleanliness) {
    const sim = calculateOrdinalSimilarity(userPrefs.cleanliness, candidate.cleanliness, CLEANLINESS_ORDER);
    cleanScore = Math.round(sim * 100);
    if (sim >= 0.9) {
      reasons.push({ type: 'positive', text: `Identical cleanliness expectation: ${candidate.cleanliness}` });
    }
  }

  // 6. Noise Tolerance (10%)
  let noiseScore = 80;
  if (userPrefs.noiseTolerance) {
    const sim = calculateOrdinalSimilarity(userPrefs.noiseTolerance, candidate.noiseTolerance, NOISE_ORDER);
    noiseScore = Math.round(sim * 100);
    if (sim >= 0.9) {
      reasons.push({ type: 'positive', text: `Aligned noise tolerance level: ${candidate.noiseTolerance}` });
    }
  }

  // 7. Study / Work Routine (10%)
  const studyScore = 85;

  // 8. Social Lifestyle (5%)
  let socialScore = 75;
  if (userPrefs.socialLifestyle) {
    const sim = calculateOrdinalSimilarity(userPrefs.socialLifestyle, candidate.socialLifestyle, SOCIAL_ORDER);
    socialScore = Math.round(sim * 100);
  }

  // 9. Smoking Compatibility (5%)
  let smokingScore = 80;
  if (userPrefs.smokingPreference) {
    if (userPrefs.smokingPreference === candidate.smokingPreference) {
      smokingScore = 100;
      reasons.push({ type: 'positive', text: `Matching smoking habit preference: ${candidate.smokingPreference}` });
    } else {
      smokingScore = 40;
    }
  }

  // 10. Privacy & Hobbies (5%)
  let hobbyScore = 70;
  if (userPrefs.hobbies && userPrefs.hobbies.length > 0) {
    const jaccard = calculateJaccardSimilarity(userPrefs.hobbies, candidate.hobbies);
    hobbyScore = Math.round(jaccard * 100);
    const shared = candidate.hobbies.filter(h => userPrefs.hobbies?.includes(h));
    if (shared.length > 0) {
      reasons.push({ type: 'positive', text: `Shared hobbies: ${shared.slice(0, 2).join(', ')}` });
    }
  }

  // Base Compatibility (Weighted 100%)
  const baseScore = Math.round(
    budgetScore * 0.15 +
    locationScore * 0.10 +
    foodScore * 0.10 +
    sleepScore * 0.15 +
    cleanScore * 0.15 +
    noiseScore * 0.10 +
    studyScore * 0.10 +
    socialScore * 0.05 +
    smokingScore * 0.05 +
    hobbyScore * 0.05
  );

  // ==========================================
  // STAGE 5: CONFLICT PENALTY DETECTION
  // ==========================================
  let conflictPenalty = 0;

  // 1. Extreme Sleep Schedule Conflict (e.g. night owl vs early riser >= 3.5 hrs)
  if (hoursDiff >= 3.5) {
    conflictPenalty += 12;
    reasons.push({ type: 'warning', text: `Potential sleep conflict: ${hoursDiff.toFixed(1)} hrs bedtime gap` });
  }

  // 2. Cleanliness Clash (Spotless vs Relaxed)
  if (userPrefs.cleanliness && (
    (userPrefs.cleanliness === 'spotless' && candidate.cleanliness === 'relaxed') ||
    (userPrefs.cleanliness === 'relaxed' && candidate.cleanliness === 'spotless')
  )) {
    conflictPenalty += 14;
    reasons.push({ type: 'warning', text: 'Significant cleanliness preference mismatch (Spotless vs Relaxed)' });
  }

  // 3. Smoking Clash (Strictly non-smoker vs active smoker)
  if (
    (userPrefs.smokingPreference === 'strictly-non-smoker' && candidate.smokingPreference === 'smoker') ||
    (userPrefs.smokingPreference === 'smoker' && candidate.smokingPreference === 'strictly-non-smoker')
  ) {
    conflictPenalty += 16;
    reasons.push({ type: 'warning', text: 'Smoking preference conflict' });
  }

  // 4. Noise Sensitivity Conflict (Low noise tolerance vs High noise candidate)
  if (userPrefs.noiseTolerance === 'low' && candidate.noiseTolerance === 'high') {
    conflictPenalty += 8;
    reasons.push({ type: 'warning', text: 'Potential noise sensitivity difference' });
  }

  const finalScore = Math.max(0, Math.min(100, baseScore - conflictPenalty));

  return {
    baseScore,
    conflictPenalty,
    finalScore,
    reasons
  };
}

// ==========================================
// STAGE 6: COMBINED RECOMMENDATION (FIND BOTH)
// Overall Score = α × Room Score + β × Roommate Score
// (α = 0.45, β = 0.55)
// ==========================================

export function calculateCombinedScore(
  roomScore: number, 
  roommateScore: number, 
  alpha = 0.45, 
  beta = 0.55
): number {
  return Math.round(alpha * roomScore + beta * roommateScore);
}
