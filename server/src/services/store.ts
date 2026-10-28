import fs from 'fs';
import path from 'path';
import { 
  Room, 
  RoommateProfile, 
  UserPreferences, 
  Interaction, 
  RoommateRequest, 
  SavedItem, 
  User 
} from '../types/index.js';
import { isFirebaseActive, firebaseAdmin } from '../config/firebase.js';

// Local storage path for fallback persistence
const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');

// Initial seed data with realistic property photography & student profiles
const DEFAULT_ROOMS: Room[] = [
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
    createdAt: '2026-10-15T10:00:00Z',
    updatedAt: '2026-10-15T10:00:00Z'
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
    createdAt: '2026-10-18T14:30:00Z',
    updatedAt: '2026-10-18T14:30:00Z'
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
    createdAt: '2026-10-19T09:15:00Z',
    updatedAt: '2026-10-19T09:15:00Z'
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
    createdAt: '2026-10-20T16:00:00Z',
    updatedAt: '2026-10-20T16:00:00Z'
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
    createdAt: '2026-10-21T11:20:00Z',
    updatedAt: '2026-10-21T11:20:00Z'
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
    createdAt: '2026-10-22T08:45:00Z',
    updatedAt: '2026-10-22T08:45:00Z'
  }
];

const DEFAULT_ROOMMATES: RoommateProfile[] = [
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
    bio: 'Software engineer at a fintech startup. I like a clean, quiet space during weekdays and occasional board game nights on weekends.',
    updatedAt: '2026-10-20T10:00:00Z'
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
    bio: 'Master of Design student. Warm and friendly, night owl during project submissions, respectful of shared kitchen duties.',
    updatedAt: '2026-10-21T12:00:00Z'
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
    bio: 'Early riser, gym enthusiast, and finance professional. Keeps things very tidy and values personal quiet time.',
    updatedAt: '2026-10-22T09:00:00Z'
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
    bio: 'Data scientist at a healthcare analytics firm. Enjoys cooking healthy meals and weekend treks in the Western Ghats.',
    updatedAt: '2026-10-22T14:00:00Z'
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
    bio: 'Product manager in Powai. Easygoing, respectful of space, clean habits, and punctual with utility bill sharing.',
    updatedAt: '2026-10-23T08:00:00Z'
  }
];

class RoomBridgeStore {
  private users: Map<string, User> = new Map();
  private rooms: Map<string, Room> = new Map();
  private roommates: Map<string, RoommateProfile> = new Map();
  private preferences: Map<string, UserPreferences> = new Map();
  private interactions: Interaction[] = [];
  private roommateRequests: Map<string, RoommateRequest> = new Map();
  private savedItems: SavedItem[] = [];

  constructor() {
    this.ensureDataDir();
    this.loadState();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch (e) {
        console.warn('Unable to create data directory, using memory store');
      }
    }
  }

  private loadState() {
    let loadedFromDisk = false;
    if (fs.existsSync(STORE_FILE)) {
      try {
        const raw = fs.readFileSync(STORE_FILE, 'utf8');
        const data = JSON.parse(raw);
        if (data.rooms) data.rooms.forEach((r: Room) => this.rooms.set(r.roomId, r));
        if (data.roommates) data.roommates.forEach((rm: RoommateProfile) => this.roommates.set(rm.uid, rm));
        if (data.users) data.users.forEach((u: User) => this.users.set(u.uid, u));
        if (data.preferences) data.preferences.forEach((p: UserPreferences) => this.preferences.set(p.uid, p));
        if (data.interactions) this.interactions = data.interactions;
        if (data.requests) data.requests.forEach((rq: RoommateRequest) => this.roommateRequests.set(rq.requestId, rq));
        if (data.savedItems) this.savedItems = data.savedItems;
        loadedFromDisk = true;
      } catch (err) {
        console.warn('Error reading store.json, falling back to default seed:', err);
      }
    }

    if (!loadedFromDisk || this.rooms.size === 0) {
      // Seed default rooms and roommates
      DEFAULT_ROOMS.forEach(r => this.rooms.set(r.roomId, r));
      DEFAULT_ROOMMATES.forEach(rm => this.roommates.set(rm.uid, rm));
      
      // Default demo user
      const demoUser: User = {
        uid: 'demo-user-1',
        displayName: 'Karan Sharma',
        email: 'karan.sharma@college.edu',
        role: 'user',
        occupation: 'Computer Science Student',
        college: 'National Institute of Engineering',
        city: 'Bengaluru',
        profileCompleted: true,
        createdAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-10-20T00:00:00Z'
      };
      this.users.set(demoUser.uid, demoUser);

      // Default demo admin user
      const adminUser: User = {
        uid: 'admin-user-1',
        displayName: 'Professor Admin',
        email: 'admin@roombridge.edu',
        role: 'admin',
        city: 'Bengaluru',
        profileCompleted: true,
        createdAt: '2026-09-01T00:00:00Z',
        updatedAt: '2026-10-20T00:00:00Z'
      };
      this.users.set(adminUser.uid, adminUser);

      // Seed initial sample interactions
      this.interactions = [
        {
          interactionId: 'int-1',
          actorId: 'demo-user-1',
          targetType: 'room',
          targetId: 'room-1',
          eventType: 'view',
          timestamp: '2026-10-21T14:22:00Z',
          recommendationScore: 92,
          recommendationVersion: 'AR2M-v1.0'
        },
        {
          interactionId: 'int-2',
          actorId: 'demo-user-1',
          targetType: 'roommate',
          targetId: 'user-mate-1',
          eventType: 'save',
          timestamp: '2026-10-22T11:05:00Z',
          recommendationScore: 94,
          recommendationVersion: 'AR2M-v1.0'
        }
      ];

      this.saveState();
    }
  }

  private saveState() {
    try {
      const state = {
        rooms: Array.from(this.rooms.values()),
        roommates: Array.from(this.roommates.values()),
        users: Array.from(this.users.values()),
        preferences: Array.from(this.preferences.values()),
        interactions: this.interactions,
        requests: Array.from(this.roommateRequests.values()),
        savedItems: this.savedItems
      };
      fs.writeFileSync(STORE_FILE, JSON.stringify(state, null, 2), 'utf8');
    } catch (e) {
      console.warn('Failed to save store state to disk:', e);
    }
  }

  // User operations
  getUser(uid: string): User | undefined {
    return this.users.get(uid);
  }

  getUserByEmail(email: string): User | undefined {
    return Array.from(this.users.values()).find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  saveUser(user: User): User {
    this.users.set(user.uid, user);
    this.saveState();
    return user;
  }

  // Room operations
  getAllRooms(): Room[] {
    return Array.from(this.rooms.values());
  }

  getRoomById(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  createRoom(room: Room): Room {
    this.rooms.set(room.roomId, room);
    this.saveState();
    return room;
  }

  updateRoom(roomId: string, updates: Partial<Room>): Room | undefined {
    const existing = this.rooms.get(roomId);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    this.rooms.set(roomId, updated);
    this.saveState();
    return updated;
  }

  deleteRoom(roomId: string): boolean {
    const deleted = this.rooms.delete(roomId);
    if (deleted) this.saveState();
    return deleted;
  }

  // Roommate profiles
  getAllRoommates(): RoommateProfile[] {
    return Array.from(this.roommates.values());
  }

  getRoommateByUid(uid: string): RoommateProfile | undefined {
    return this.roommates.get(uid);
  }

  saveRoommateProfile(profile: RoommateProfile): RoommateProfile {
    this.roommates.set(profile.uid, profile);
    this.saveState();
    return profile;
  }

  // Preferences
  getUserPreferences(uid: string): UserPreferences | undefined {
    return this.preferences.get(uid);
  }

  saveUserPreferences(prefs: UserPreferences): UserPreferences {
    this.preferences.set(prefs.uid, prefs);
    this.saveState();
    return prefs;
  }

  // Interactions
  recordInteraction(interaction: Interaction): Interaction {
    this.interactions.push(interaction);
    this.saveState();
    return interaction;
  }

  getInteractions(actorId?: string): Interaction[] {
    if (!actorId) return this.interactions;
    return this.interactions.filter(i => i.actorId === actorId);
  }

  // Saved items
  saveItem(item: SavedItem): SavedItem {
    const exists = this.savedItems.some(i => i.userId === item.userId && i.targetType === item.targetType && i.targetId === item.targetId);
    if (!exists) {
      this.savedItems.push(item);
      this.saveState();
    }
    return item;
  }

  unsaveItem(userId: string, targetType: 'room' | 'roommate', targetId: string): boolean {
    const initialLen = this.savedItems.length;
    this.savedItems = this.savedItems.filter(i => !(i.userId === userId && i.targetType === targetType && i.targetId === targetId));
    if (this.savedItems.length !== initialLen) {
      this.saveState();
      return true;
    }
    return false;
  }

  getSavedItems(userId: string): SavedItem[] {
    return this.savedItems.filter(i => i.userId === userId);
  }

  // Roommate requests
  createRequest(request: RoommateRequest): RoommateRequest {
    this.roommateRequests.set(request.requestId, request);
    this.saveState();
    return request;
  }

  updateRequestStatus(requestId: string, status: RoommateRequest['status']): RoommateRequest | undefined {
    const req = this.roommateRequests.get(requestId);
    if (!req) return undefined;
    req.status = status;
    req.updatedAt = new Date().toISOString();
    this.roommateRequests.set(requestId, req);
    this.saveState();
    return req;
  }

  getRequestsForUser(userId: string): { incoming: RoommateRequest[]; outgoing: RoommateRequest[] } {
    const all = Array.from(this.roommateRequests.values());
    return {
      incoming: all.filter(r => r.receiverId === userId),
      outgoing: all.filter(r => r.senderId === userId)
    };
  }

  // Admin stats
  getAdminStats() {
    return {
      totalRooms: this.rooms.size,
      activeRooms: Array.from(this.rooms.values()).filter(r => r.status === 'available').length,
      totalRoommates: this.roommates.size,
      totalUsers: this.users.size,
      totalInteractions: this.interactions.length,
      totalRequests: this.roommateRequests.size,
      datasetSize: this.interactions.length + this.rooms.size + this.roommates.size
    };
  }
}

export const store = new RoomBridgeStore();
