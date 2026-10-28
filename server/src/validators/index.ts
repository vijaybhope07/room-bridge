import { z } from 'zod';

export const RoomCreateSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  city: z.string().min(2, 'City is required'),
  locality: z.string().min(2, 'Locality is required'),
  rent: z.number().positive('Rent must be positive'),
  deposit: z.number().nonnegative('Deposit cannot be negative'),
  roomType: z.enum(['Private Room', 'Shared Room', 'Entire Apartment', 'Studio']),
  bhk: z.string(),
  furnishing: z.enum(['Fully Furnished', 'Semi Furnished', 'Unfurnished']),
  amenities: z.array(z.string()),
  availabilityDate: z.string(),
  distanceKm: z.number().nonnegative(),
  imageUrls: z.array(z.string()).default([]),
  status: z.enum(['available', 'reserved', 'occupied']).default('available'),
  genderRestriction: z.enum(['none', 'female-only', 'male-only']).optional()
});

export const RoommateProfileSchema = z.object({
  displayName: z.string().min(2),
  photoUrl: z.string().optional(),
  age: z.number().int().min(17).max(99).optional(),
  occupation: z.string().min(2),
  college: z.string().optional(),
  preferredCity: z.string().min(2),
  preferredLocality: z.string().optional(),
  budgetMin: z.number().nonnegative(),
  budgetMax: z.number().positive(),
  foodPreference: z.enum(['vegetarian', 'non-vegetarian', 'vegan', 'any']),
  sleepTime: z.string(), // e.g. "23:00"
  wakeTime: z.string(),  // e.g. "07:00"
  cleanliness: z.enum(['relaxed', 'moderate', 'spotless']),
  noiseTolerance: z.enum(['low', 'moderate', 'high']),
  studyHabit: z.enum(['morning', 'night', 'flexible']),
  socialLifestyle: z.enum(['quiet', 'moderate', 'social']),
  smokingPreference: z.enum(['strictly-non-smoker', 'outside-only', 'smoker']),
  guestPreference: z.enum(['rarely', 'weekends-only', 'anytime']),
  privacyNeed: z.enum(['standard', 'high']),
  hobbies: z.array(z.string()),
  bio: z.string().optional()
});

export const UserPreferencesSchema = z.object({
  searchMode: z.enum(['room', 'roommate', 'both']),
  roomPreferences: z.object({
    city: z.string(),
    locality: z.string().optional(),
    maxRent: z.number().positive(),
    maxDeposit: z.number().optional(),
    roomType: z.enum(['Private Room', 'Shared Room', 'Entire Apartment', 'Studio']).optional(),
    furnishing: z.enum(['Fully Furnished', 'Semi Furnished', 'Unfurnished']).optional(),
    requiredAmenities: z.array(z.string()).optional(),
    maxDistanceKm: z.number().optional(),
    moveInDate: z.string().optional()
  }).optional(),
  roommatePreferences: z.object({
    budgetMin: z.number(),
    budgetMax: z.number(),
    preferredCity: z.string(),
    foodPreference: z.enum(['vegetarian', 'non-vegetarian', 'vegan', 'any']).optional(),
    sleepTimeRange: z.string().optional(),
    cleanliness: z.enum(['relaxed', 'moderate', 'spotless']).optional(),
    noiseTolerance: z.enum(['low', 'moderate', 'high']).optional(),
    socialLifestyle: z.enum(['quiet', 'moderate', 'social']).optional(),
    smokingPreference: z.enum(['strictly-non-smoker', 'outside-only', 'smoker']).optional(),
    hobbies: z.array(z.string()).optional()
  }).optional(),
  mandatoryRequirements: z.object({
    maxRentLimit: z.number().optional(),
    requiredCity: z.string().optional(),
    requiredRoomType: z.enum(['Private Room', 'Shared Room', 'Entire Apartment', 'Studio']).optional(),
    nonSmokerOnly: z.boolean().optional()
  }).optional()
});

export const InteractionSchema = z.object({
  actorId: z.string(),
  targetType: z.enum(['room', 'roommate']),
  targetId: z.string(),
  eventType: z.enum([
    'impression', 
    'view', 
    'save', 
    'unsave', 
    'contact_request', 
    'request_accepted', 
    'request_rejected', 
    'successful_match'
  ]),
  recommendationScore: z.number().optional(),
  recommendationVersion: z.string().default('AR2M-v1.0')
});

export const RoommateRequestCreateSchema = z.object({
  receiverId: z.string(),
  message: z.string().optional(),
  compatibilityScore: z.number().optional()
});
