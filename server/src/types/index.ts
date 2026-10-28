// RoomBridge Data Models and Types

export type UserRole = 'user' | 'admin';

export interface User {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  profileImageUrl?: string;
  occupation?: string;
  college?: string;
  city?: string;
  preferredLocality?: string;
  bio?: string;
  age?: number;
  profileCompleted: boolean;
  budgetMin?: number;
  budgetMax?: number;
  foodPreference?: string;
  sleepTime?: string;
  wakeTime?: string;
  cleanliness?: string;
  noiseTolerance?: string;
  createdAt: string;
  updatedAt: string;
}

export type RoomType = 'Private Room' | 'Shared Room' | 'Entire Apartment' | 'Studio';
export type FurnishingType = 'Fully Furnished' | 'Semi Furnished' | 'Unfurnished';
export type RoomStatus = 'available' | 'reserved' | 'occupied';

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
  status: RoomStatus;
  genderRestriction?: 'none' | 'female-only' | 'male-only';
  createdAt: string;
  updatedAt: string;
}

export type CleanlinessLevel = 'relaxed' | 'moderate' | 'spotless';
export type NoiseTolerance = 'low' | 'moderate' | 'high';
export type SocialLifestyle = 'quiet' | 'moderate' | 'social';
export type SmokingPreference = 'strictly-non-smoker' | 'outside-only' | 'smoker';
export type GuestPreference = 'rarely' | 'weekends-only' | 'anytime';
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
  sleepTime: string; // e.g. "23:00"
  wakeTime: string;  // e.g. "07:00"
  cleanliness: CleanlinessLevel;
  noiseTolerance: NoiseTolerance;
  studyHabit: 'morning' | 'night' | 'flexible';
  socialLifestyle: SocialLifestyle;
  smokingPreference: SmokingPreference;
  guestPreference: GuestPreference;
  privacyNeed: 'standard' | 'high';
  hobbies: string[];
  bio?: string;
  updatedAt: string;
}

export type SearchMode = 'room' | 'roommate' | 'both';

export interface RoomPreferences {
  city: string;
  locality?: string;
  maxRent: number;
  maxDeposit?: number;
  roomType?: RoomType;
  furnishing?: FurnishingType;
  requiredAmenities?: string[];
  maxDistanceKm?: number;
  moveInDate?: string;
}

export interface RoommatePreferences {
  budgetMin: number;
  budgetMax: number;
  preferredCity: string;
  foodPreference?: FoodPreference;
  sleepTimeRange?: string; // e.g. "early" (before 23:00) or "late" (after 23:00)
  cleanliness?: CleanlinessLevel;
  noiseTolerance?: NoiseTolerance;
  socialLifestyle?: SocialLifestyle;
  smokingPreference?: SmokingPreference;
  hobbies?: string[];
}

export interface MandatoryRequirements {
  maxRentLimit?: number;
  requiredCity?: string;
  requiredRoomType?: RoomType;
  nonSmokerOnly?: boolean;
}

export interface UserPreferences {
  uid: string;
  searchMode: SearchMode;
  roomPreferences?: RoomPreferences;
  roommatePreferences?: RoommatePreferences;
  mandatoryRequirements?: MandatoryRequirements;
  updatedAt: string;
}

export type InteractionEventType = 
  | 'impression' 
  | 'view' 
  | 'save' 
  | 'unsave' 
  | 'contact_request' 
  | 'request_accepted' 
  | 'request_rejected' 
  | 'successful_match';

export interface Interaction {
  interactionId: string;
  actorId: string;
  targetType: 'room' | 'roommate';
  targetId: string;
  eventType: InteractionEventType;
  timestamp: string;
  recommendationScore?: number;
  recommendationVersion: string;
}

export type RequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';

export interface RoommateRequest {
  requestId: string;
  senderId: string;
  senderName: string;
  senderPhoto?: string;
  receiverId: string;
  receiverName: string;
  status: RequestStatus;
  message?: string;
  compatibilityScore?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SavedItem {
  savedItemId: string;
  userId: string;
  targetType: 'room' | 'roommate';
  targetId: string;
  createdAt: string;
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
