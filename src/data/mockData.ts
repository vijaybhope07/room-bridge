import { Room, RoommateProfile, AR2MMatchResult, MatchReason } from '../types';

export const DEFAULT_ROOMS: Room[] = [
  {
    roomId: 'room-1',
    ownerId: 'host-101',
    ownerName: 'Sunita Sharma',
    ownerPhone: '+91 98201 44521',
    title: 'Spacious Furnished Private Room near Tech Park & Metro',
    description: 'Bright private master bedroom with attached washroom, study desk, ergonomic chair, and high-speed Wi-Fi. Ideal for students and young tech professionals. 5 minutes walk to Indiranagar metro station.',
    city: 'Bengaluru',
    locality: 'Indiranagar',
    rent: 14500,
    deposit: 30000,
    roomType: 'Private Room',
    bhk: '3 BHK',
    furnishing: 'Fully Furnished',
    amenities: ['High-speed Wi-Fi', 'Air Conditioning', 'Power Backup', 'Washing Machine', 'Refrigerator', 'Attached Balcony'],
    availabilityDate: '2026-11-01',
    distanceKm: 1.8,
    imageUrls: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80'
    ],
    status: 'available',
    genderRestriction: 'none',
    createdAt: '2026-10-15T10:00:00Z'
  },
  {
    roomId: 'room-2',
    ownerId: 'host-102',
    ownerName: 'Vikram Joshi',
    title: 'Modern Twin-Sharing Room in Koramangala Student Hub',
    description: 'Shared 2-sharing room in a newly renovated penthouse. Daily housekeeping, high-speed fiber internet, modular kitchen with microwave and RO water filter.',
    city: 'Bengaluru',
    locality: 'Koramangala 4th Block',
    rent: 9200,
    deposit: 18000,
    roomType: 'Shared Room',
    bhk: '2 BHK',
    furnishing: 'Fully Furnished',
    amenities: ['High-speed Wi-Fi', 'Housekeeping', 'Washing Machine', 'RO Purifier', 'Security Guard', 'Two-wheeler Parking'],
    availabilityDate: '2026-11-05',
    distanceKm: 2.3,
    imageUrls: [
      'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80'
    ],
    status: 'available',
    genderRestriction: 'none',
    createdAt: '2026-10-18T14:30:00Z'
  },
  {
    roomId: 'room-3',
    ownerId: 'host-103',
    ownerName: 'Ananya Deshmukh',
    title: 'Independent Studio Apartment in Quiet Green Enclave',
    description: 'Private 1 RK studio apartment with kitchenette, private bathroom, natural sunlight, and private balcony. Perfect for focused study and remote work.',
    city: 'Pune',
    locality: 'Kothrud',
    rent: 16000,
    deposit: 35000,
    roomType: 'Studio',
    bhk: '1 RK',
    furnishing: 'Fully Furnished',
    amenities: ['High-speed Wi-Fi', 'Private Kitchen', 'Air Conditioning', 'Geyser', 'Gated Society'],
    availabilityDate: '2026-11-10',
    distanceKm: 3.1,
    imageUrls: [
      'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&w=800&q=80'
    ],
    status: 'available',
    genderRestriction: 'none',
    createdAt: '2026-10-19T09:15:00Z'
  },
  {
    roomId: 'room-4',
    ownerId: 'host-104',
    ownerName: 'Rajeev Malhotra',
    title: 'Sunny Deluxe Room in Viman Nagar near Symbiosis',
    description: 'Premium master bedroom with attached bathroom and work desk in a 3 BHK gated community. Swimming pool, gym, and 24/7 security access included.',
    city: 'Pune',
    locality: 'Viman Nagar',
    rent: 13500,
    deposit: 27000,
    roomType: 'Private Room',
    bhk: '3 BHK',
    furnishing: 'Semi Furnished',
    amenities: ['Power Backup', 'Gym', 'Swimming Pool', 'Security Guard', 'Covered Parking', 'Washing Machine'],
    availabilityDate: '2026-11-01',
    distanceKm: 1.2,
    imageUrls: [
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80'
    ],
    status: 'available',
    genderRestriction: 'none',
    createdAt: '2026-10-20T16:00:00Z'
  },
  {
    roomId: 'room-5',
    ownerId: 'host-105',
    ownerName: 'Kavita Patel',
    title: 'Budget-Friendly Shared Accommodation in HSR Layout',
    description: 'Cozy shared room for 2 people with individual wooden wardrobes, study tables, and high-speed Wi-Fi. 2 minutes walk to BDA complex.',
    city: 'Bengaluru',
    locality: 'HSR Layout Sector 2',
    rent: 7800,
    deposit: 15000,
    roomType: 'Shared Room',
    bhk: '2 BHK',
    furnishing: 'Semi Furnished',
    amenities: ['High-speed Wi-Fi', 'Refrigerator', 'Two-wheeler Parking', 'Geyser'],
    availabilityDate: '2026-11-15',
    distanceKm: 4.5,
    imageUrls: [
      'https://images.unsplash.com/photo-1540518614846-7ede433c4ef3?auto=format&fit=crop&w=800&q=80'
    ],
    status: 'available',
    genderRestriction: 'none',
    createdAt: '2026-10-21T11:20:00Z'
  },
  {
    roomId: 'room-6',
    ownerId: 'host-106',
    ownerName: 'Manish Verma',
    title: 'Elegant 2 BHK Entire Apartment in Powai Lake Area',
    description: 'Fully furnished 2 BHK flat suitable for 2-3 roommates sharing. Scenic view of Powai lake, modular kitchen, piped gas, and AC in both bedrooms.',
    city: 'Mumbai',
    locality: 'Powai',
    rent: 36000,
    deposit: 70000,
    roomType: 'Entire Apartment',
    bhk: '2 BHK',
    furnishing: 'Fully Furnished',
    amenities: ['Air Conditioning', 'Power Backup', 'Gym', 'High-speed Wi-Fi', 'Security Guard', 'Elevator'],
    availabilityDate: '2026-11-01',
    distanceKm: 2.1,
    imageUrls: [
      'https://images.unsplash.com/photo-1502005229762-ee1b2b800414?auto=format&fit=crop&w=800&q=80'
    ],
    status: 'available',
    genderRestriction: 'none',
    createdAt: '2026-10-22T08:45:00Z'
  }
];

export const DEFAULT_ROOMMATES: RoommateProfile[] = [
  {
    uid: 'user-mate-1',
    displayName: 'Aarav Mehta',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    age: 23,
    occupation: 'Software Engineer',
    college: 'BITS Pilani Alumni',
    preferredCity: 'Bengaluru',
    preferredLocality: 'Indiranagar',
    budgetMin: 12000,
    budgetMax: 18000,
    foodPreference: 'vegetarian',
    sleepTime: '23:30',
    wakeTime: '07:30',
    cleanliness: 'spotless',
    noiseTolerance: 'low',
    studyHabit: 'morning',
    socialLifestyle: 'moderate',
    smokingPreference: 'strictly-non-smoker',
    guestPreference: 'weekends-only',
    privacyNeed: 'standard',
    hobbies: ['Coding', 'Badminton', 'Reading', 'Coffee'],
    bio: 'Software engineer at a fintech startup. I like a clean, quiet space during weekdays and occasional board game nights on weekends.'
  },
  {
    uid: 'user-mate-2',
    displayName: 'Priya Nambiar',
    photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    age: 22,
    occupation: 'Design Student',
    college: 'NID Bengaluru',
    preferredCity: 'Bengaluru',
    preferredLocality: 'Koramangala',
    budgetMin: 8000,
    budgetMax: 14000,
    foodPreference: 'any',
    sleepTime: '01:00',
    wakeTime: '08:30',
    cleanliness: 'moderate',
    noiseTolerance: 'moderate',
    studyHabit: 'night',
    socialLifestyle: 'social',
    smokingPreference: 'strictly-non-smoker',
    guestPreference: 'weekends-only',
    privacyNeed: 'standard',
    hobbies: ['UI/UX', 'Photography', 'Painting', 'Indie Music'],
    bio: 'Master of Design student. Warm and friendly, night owl during project submissions, respectful of shared kitchen duties.'
  },
  {
    uid: 'user-mate-3',
    displayName: 'Rohan Deshmukh',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    age: 24,
    occupation: 'Financial Analyst',
    college: 'Symbiosis Pune',
    preferredCity: 'Pune',
    preferredLocality: 'Viman Nagar',
    budgetMin: 10000,
    budgetMax: 16000,
    foodPreference: 'non-vegetarian',
    sleepTime: '23:00',
    wakeTime: '06:30',
    cleanliness: 'spotless',
    noiseTolerance: 'low',
    studyHabit: 'morning',
    socialLifestyle: 'quiet',
    smokingPreference: 'strictly-non-smoker',
    guestPreference: 'rarely',
    privacyNeed: 'high',
    hobbies: ['Fitness', 'Stock Markets', 'Running', 'Podcasts'],
    bio: 'Early riser, gym enthusiast, and finance professional. Keeps things very tidy and values personal quiet time.'
  },
  {
    uid: 'user-mate-4',
    displayName: 'Sneha Kulkarni',
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    age: 23,
    occupation: 'Data Scientist',
    college: 'COEP Pune',
    preferredCity: 'Pune',
    preferredLocality: 'Kothrud',
    budgetMin: 9000,
    budgetMax: 15000,
    foodPreference: 'vegetarian',
    sleepTime: '00:00',
    wakeTime: '07:30',
    cleanliness: 'moderate',
    noiseTolerance: 'moderate',
    studyHabit: 'flexible',
    socialLifestyle: 'moderate',
    smokingPreference: 'strictly-non-smoker',
    guestPreference: 'weekends-only',
    privacyNeed: 'standard',
    hobbies: ['Chess', 'Hiking', 'Cooking', 'Machine Learning'],
    bio: 'Data scientist at a healthcare analytics firm. Enjoys cooking healthy meals and weekend treks in the Western Ghats.'
  },
  {
    uid: 'user-mate-5',
    displayName: 'Tanmay Saxena',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    age: 25,
    occupation: 'Product Manager',
    college: 'IIT Bombay Alumni',
    preferredCity: 'Mumbai',
    preferredLocality: 'Powai',
    budgetMin: 18000,
    budgetMax: 26000,
    foodPreference: 'any',
    sleepTime: '00:30',
    wakeTime: '08:00',
    cleanliness: 'spotless',
    noiseTolerance: 'moderate',
    studyHabit: 'flexible',
    socialLifestyle: 'moderate',
    smokingPreference: 'strictly-non-smoker',
    guestPreference: 'weekends-only',
    privacyNeed: 'standard',
    hobbies: ['Tech Podcasts', 'Squash', 'Travel', 'Blogging'],
    bio: 'Product manager in Powai. Easygoing, respectful of space, clean habits, and punctual with utility bill sharing.'
  }
];

/**
 * Fallback scoring computation matching the AR²M + Random Forest ensemble
 */
export function computeFallbackRoomRecommendations(
  roomPreferences: any = {},
  mandatory: any = {}
): AR2MMatchResult[] {
  const city = (roomPreferences.preferredCity || 'Bengaluru').toLowerCase();
  const maxBudget = mandatory.maxBudget || roomPreferences.budgetMax || 25000;

  return DEFAULT_ROOMS.map(room => {
    let score = 70;
    const reasons: MatchReason[] = [];

    if (room.city.toLowerCase() === city) {
      score += 15;
      reasons.push({ type: 'positive', text: `Located in your preferred city of ${room.city} (${room.locality})` });
    } else {
      score -= 10;
    }

    if (room.rent <= maxBudget) {
      score += 10;
      reasons.push({ type: 'positive', text: `Rent ₹${room.rent.toLocaleString()}/mo is well within budget limit of ₹${maxBudget.toLocaleString()}` });
    } else {
      score -= 15;
      reasons.push({ type: 'warning', text: `Rent ₹${room.rent.toLocaleString()}/mo exceeds target budget` });
    }

    const ar2mScore = Math.min(98, Math.max(50, score));
    // Simulate Random Forest ensemble adjustment
    const predictedScore = Math.min(99, Math.max(52, ar2mScore + Math.floor(Math.random() * 7) - 3));
    const finalScore = Math.round((ar2mScore + predictedScore) / 2);

    return {
      matchId: `fallback-match-${room.roomId}`,
      userId: 'active-user',
      targetType: 'room' as const,
      targetId: room.roomId,
      room,
      roomScore: ar2mScore,
      conflictPenalty: 0,
      ar2mScore,
      predictedScore,
      finalScore,
      matchingReasons: reasons.length > 0 ? reasons : [{ type: 'positive' as const, text: 'Good amenity and location match' }],
      algorithmVersion: 'SmartMatch-v1.2',
      createdAt: new Date().toISOString()
    };
  }).sort((a, b) => b.finalScore - a.finalScore);
}

export function computeFallbackRoommateRecommendations(
  roommatePreferences: any = {},
  mandatory: any = {}
): AR2MMatchResult[] {
  const city = (roommatePreferences.preferredCity || 'Bengaluru').toLowerCase();
  const targetClean = roommatePreferences.cleanliness || 'spotless';
  const targetFood = roommatePreferences.foodPreference || 'vegetarian';

  return DEFAULT_ROOMMATES.map(mate => {
    let score = 72;
    const reasons: MatchReason[] = [];

    if (mate.preferredCity.toLowerCase() === city) {
      score += 12;
      reasons.push({ type: 'positive', text: `Cohabitant in target city: ${mate.preferredCity}` });
    }

    if (mate.cleanliness === targetClean) {
      score += 8;
      reasons.push({ type: 'positive', text: `High hygiene alignment: Both prefer ${targetClean} living spaces` });
    }

    if (mate.foodPreference === targetFood || targetFood === 'any' || mate.foodPreference === 'any') {
      score += 6;
      reasons.push({ type: 'positive', text: `Dietary harmony: Compatible food preferences` });
    }

    const ar2mScore = Math.min(98, Math.max(55, score));
    const predictedScore = Math.min(99, Math.max(54, ar2mScore + Math.floor(Math.random() * 6) - 2));
    const finalScore = Math.round((ar2mScore + predictedScore) / 2);

    return {
      matchId: `fallback-mate-${mate.uid}`,
      userId: 'active-user',
      targetType: 'roommate' as const,
      targetId: mate.uid,
      roommate: mate,
      roommateScore: ar2mScore,
      conflictPenalty: 0,
      ar2mScore,
      predictedScore,
      finalScore,
      matchingReasons: reasons.length > 0 ? reasons : [{ type: 'positive' as const, text: 'Strong lifestyle and schedule compatibility' }],
      algorithmVersion: 'SmartMatch-v1.2',
      createdAt: new Date().toISOString()
    };
  }).sort((a, b) => b.finalScore - a.finalScore);
}

export function computeFallbackCombinedRecommendations(
  roomPreferences: any = {},
  roommatePreferences: any = {},
  mandatory: any = {}
): AR2MMatchResult[] {
  const roomMatches = computeFallbackRoomRecommendations(roomPreferences, mandatory);
  const mateMatches = computeFallbackRoommateRecommendations(roommatePreferences, mandatory);

  const combined: AR2MMatchResult[] = [];
  const limit = Math.min(roomMatches.length, mateMatches.length);

  for (let i = 0; i < limit; i++) {
    const rm = roomMatches[i];
    const mm = mateMatches[i];
    const ar2mScore = Math.round((rm.ar2mScore + mm.ar2mScore) / 2);
    const predictedScore = Math.round(((rm.predictedScore || rm.ar2mScore) + (mm.predictedScore || mm.ar2mScore)) / 2);
    const finalScore = Math.round((ar2mScore + predictedScore) / 2);

    combined.push({
      matchId: `fallback-comb-${i}`,
      userId: 'active-user',
      targetType: 'combined' as const,
      targetId: `${rm.room?.roomId}+${mm.roommate?.uid}`,
      room: rm.room,
      roommate: mm.roommate,
      roomScore: rm.ar2mScore,
      roommateScore: mm.ar2mScore,
      conflictPenalty: 0,
      ar2mScore,
      predictedScore,
      finalScore,
      matchingReasons: [...rm.matchingReasons.slice(0, 1), ...mm.matchingReasons.slice(0, 1)],
      algorithmVersion: 'SmartMatch-v1.2',
      createdAt: new Date().toISOString()
    });
  }

  return combined.sort((a, b) => b.finalScore - a.finalScore);
}
