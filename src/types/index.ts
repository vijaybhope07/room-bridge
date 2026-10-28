// Frontend types matching backend data model

export type RoomType = 'Private Room' | 'Shared Room' | 'Entire Apartment' | 'Studio';
export type FurnishingType = 'Fully Furnished' | 'Semi Furnished' | 'Unfurnished';

export interface Room {
  roomId: string;
  ownerId: string;
  ownerName: string;
  ownerPhone?: string;
  title: string;
  description: string;
  city: string;
  locality: string;
  rent: number;
  deposit: number;
  roomType: RoomType;
  bhk: string;
  furnishing: FurnishingType;
  amenities: string[];
  availabilityDate: string;
  distanceKm: number;
  imageUrls: string[];
  status: 'available' | 'reserved' | 'occupied';
  genderRestriction?: 'none' | 'female-only' | 'male-only';
  createdAt: string;
}

export type CleanlinessLevel = 'relaxed' | 'moderate' | 'spotless';
export type NoiseTolerance = 'low' | 'moderate' | 'high';
export type SocialLifestyle = 'quiet' | 'moderate' | 'social';
export type FoodPreference = 'vegetarian' | 'non-vegetarian' | 'vegan' | 'any';

export interface RoommateProfile {
  uid: string;
  displayName: string;
  photoUrl?: string;
  age?: number;
  occupation: string;
  college?: string;
  preferredCity: string;
  preferredLocality?: string;
  budgetMin: number;
  budgetMax: number;
  foodPreference: FoodPreference;
  sleepTime: string;
  wakeTime: string;
  cleanliness: CleanlinessLevel;
  noiseTolerance: NoiseTolerance;
  studyHabit: 'morning' | 'night' | 'flexible';
  socialLifestyle: SocialLifestyle;
  smokingPreference: 'strictly-non-smoker' | 'outside-only' | 'smoker';
  guestPreference: 'rarely' | 'weekends-only' | 'anytime';
  privacyNeed: 'standard' | 'high';
  hobbies: string[];
  bio?: string;
}

export interface MatchReason {
  type: 'positive' | 'warning' | 'neutral';
  text: string;
}

export interface AR2MMatchResult {
  matchId: string;
  userId: string;
  targetType: 'room' | 'roommate' | 'combined';
  targetId: string;
  room?: Room;
  roommate?: RoommateProfile;
  roomScore?: number;
  roommateScore?: number;
  conflictPenalty: number;
  ar2mScore: number;
  predictedScore?: number;
  mlPrediction?: {
    available: boolean;
    predictedClass?: string;
    probability?: number;
    modelVersion?: string;
    note?: string;
  };
  finalScore: number;
  matchingReasons: MatchReason[];
  algorithmVersion: string;
  createdAt: string;
}

export interface RoommateRequest {
  requestId: string;
  senderId: string;
  senderName: string;
  senderPhoto?: string;
  receiverId: string;
  receiverName: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  message?: string;
  compatibilityScore?: number;
  createdAt: string;
}

export interface User {
  uid: string;
  displayName: string;
  email: string;
  role: 'user' | 'admin';
  profileImageUrl?: string;
  occupation?: string;
  college?: string;
  city?: string;
  preferredLocality?: string;
  bio?: string;
  age?: number;
  selectedIntent?: 'room' | 'roommate' | 'combined';
  profileCompleted: boolean;
  budgetMin?: number;
  budgetMax?: number;
  foodPreference?: string;
  sleepTime?: string;
  wakeTime?: string;
  cleanliness?: string;
  noiseTolerance?: string;
}
