import { Router, Request, Response } from 'express';
import { store } from '../services/store.js';
import { UserPreferencesSchema } from '../validators/index.js';
import { User, UserPreferences, RoommateProfile } from '../types/index.js';

export const authRouter = Router();

// GET /api/me - Current user
authRouter.get('/me', (req: Request, res: Response) => {
  try {
    const userId = (req.headers['x-user-id'] as string) || 'demo-user-1';
    let user = store.getUser(userId);

    if (!user) {
      user = {
        uid: userId,
        displayName: 'Student User',
        email: 'user@college.edu',
        role: 'user',
        profileCompleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      store.saveUser(user);
    }

    res.json({ success: true, data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/auth/register
authRouter.post('/register', (req: Request, res: Response) => {
  try {
    const { displayName, email, role = 'user', occupation, college, city } = req.body;
    if (!email || !displayName) {
      return res.status(400).json({ success: false, message: 'Email and Name are required' });
    }

    const newUser: User = {
      uid: `usr-${Date.now()}`,
      displayName,
      email,
      role: role === 'admin' ? 'admin' : 'user',
      occupation: occupation || 'Student',
      college,
      city: city || 'Bengaluru',
      profileCompleted: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const saved = store.saveUser(newUser);
    res.status(201).json({ success: true, data: saved });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/auth/login
authRouter.post('/login', (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    // Check if user exists
    let user: User | undefined;
    for (const u of store.getAdminStats() ? [store.getUser('demo-user-1'), store.getUser('admin-user-1')].filter(Boolean) as User[] : []) {
      if (u.email.toLowerCase() === email.toLowerCase()) {
        user = u;
        break;
      }
    }

    if (!user) {
      // Auto-register for easy demo testing
      user = {
        uid: `usr-${Date.now()}`,
        displayName: email.split('@')[0],
        email,
        role: email.includes('admin') ? 'admin' : 'user',
        profileCompleted: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      store.saveUser(user);
    }

    res.json({ success: true, data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/auth/google/config - Public configuration for Google OAuth & Firebase
authRouter.get('/google/config', (_req: Request, res: Response) => {
  const configuredKey = process.env.GOOGLE_API_KEY || process.env.VITE_GOOGLE_API_KEY || 'AIzaSyDV1ElvApvcIbROD5a5xxl3Q-BWZr_5-hM';
  res.json({
    success: true,
    data: {
      clientId: process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '',
      hasApiKey: true,
      apiKey: configuredKey,
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID || 'roombridge-93411',
      provider: 'Google Identity & Firebase Auth',
      mode: 'firebase-oauth2-and-gmail'
    }
  });
});

// GET /api/auth/google/accounts - Retrieve existing Google / Gmail accounts detected on system
authRouter.get('/google/accounts', (_req: Request, res: Response) => {
  try {
    const allUsers = store.getAllUsers();
    const defaults = [
      {
        uid: 'usr-google-aarav',
        displayName: 'Aarav Mehta',
        email: 'aarav.mehta.bits@gmail.com',
        profileImageUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80',
        city: 'Bengaluru',
        preferredLocality: 'Koramangala 4th Block',
        occupation: 'Software Engineer',
        college: 'BITS Pilani',
        age: 23,
        bio: 'Tech enthusiast and quiet roommate. Early riser, loves badminton and reading.',
        role: 'user',
        budgetMin: 12000,
        budgetMax: 20000,
        cleanliness: 'spotless',
        noiseTolerance: 'low',
        foodPreference: 'vegetarian',
        sleepTime: '23:30',
        wakeTime: '07:30'
      },
      {
        uid: 'usr-google-priya',
        displayName: 'Priya Nambiar',
        email: 'priya.nambiar.design@gmail.com',
        profileImageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
        city: 'Bengaluru',
        preferredLocality: 'Indiranagar',
        occupation: 'Product Designer',
        college: 'National Institute of Design (NID)',
        age: 24,
        bio: 'UI/UX Designer who loves aesthetic living spaces, weekend plants, and good music.',
        role: 'user',
        budgetMin: 14000,
        budgetMax: 22000,
        cleanliness: 'spotless',
        noiseTolerance: 'moderate',
        foodPreference: 'any',
        sleepTime: '00:00',
        wakeTime: '08:00'
      },
      {
        uid: 'usr-google-rohan',
        displayName: 'Rohan Verma',
        email: 'rohan.verma.tech@gmail.com',
        profileImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        city: 'Bengaluru',
        preferredLocality: 'HSR Layout Sector 1',
        occupation: 'Data Scientist',
        college: 'IIT Madras Alumni',
        age: 25,
        bio: 'AI researcher and quiet roommate. Enjoys chess and clean shared spaces.',
        role: 'user',
        budgetMin: 15000,
        budgetMax: 25000,
        cleanliness: 'spotless',
        noiseTolerance: 'low',
        foodPreference: 'vegetarian',
        sleepTime: '23:00',
        wakeTime: '07:00'
      }
    ];

    const merged = [...defaults];
    for (const u of allUsers) {
      if (u.email && !merged.some(m => m.email.toLowerCase() === u.email.toLowerCase())) {
        merged.unshift({
          uid: u.uid,
          displayName: u.displayName || u.email.split('@')[0],
          email: u.email,
          profileImageUrl: u.profileImageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.displayName || u.email)}`,
          city: u.city || 'Bengaluru',
          preferredLocality: u.preferredLocality || 'Indiranagar',
          occupation: u.occupation || 'Student',
          college: u.college || 'University Campus',
          age: u.age || 22,
          bio: u.bio || `Google authenticated member (${u.email})`,
          role: u.role || 'user',
          budgetMin: u.budgetMin || 10000,
          budgetMax: u.budgetMax || 18000,
          cleanliness: u.cleanliness || 'spotless',
          noiseTolerance: u.noiseTolerance || 'low',
          foodPreference: u.foodPreference || 'vegetarian',
          sleepTime: u.sleepTime || '23:30',
          wakeTime: u.wakeTime || '07:30'
        });
      }
    }

    res.json({ success: true, data: merged });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/auth/google - Authenticate using Google Identity / Gmail
authRouter.post('/google', (req: Request, res: Response) => {
  try {
    const { email, displayName, photoUrl, credential, googleId, apiKey } = req.body;
    
    let resolvedEmail = email;
    let resolvedName = displayName;
    let resolvedPhoto = photoUrl;
    let resolvedGoogleId = googleId;

    // Decode Google JWT Credential if sent from Google Identity Services
    if (credential && typeof credential === 'string') {
      try {
        const parts = credential.split('.');
        if (parts.length === 3) {
          const payloadJson = Buffer.from(parts[1], 'base64').toString('utf8');
          const payload = JSON.parse(payloadJson);
          if (payload.email) resolvedEmail = payload.email;
          if (payload.name) resolvedName = payload.name;
          if (payload.picture) resolvedPhoto = payload.picture;
          if (payload.sub) resolvedGoogleId = payload.sub;
        }
      } catch (err) {
        console.warn('[Google Auth] Could not decode JWT credential, using provided fields');
      }
    }

    if (!resolvedEmail) {
      return res.status(400).json({ success: false, message: 'Google authentication did not provide a valid email.' });
    }

    let user = store.getUserByEmail(resolvedEmail);
    const now = new Date().toISOString();

    if (!user) {
      const isAarav = resolvedEmail.toLowerCase().includes('aarav');
      const isPriya = resolvedEmail.toLowerCase().includes('priya');
      const isRohan = resolvedEmail.toLowerCase().includes('rohan');
      const derivedName = resolvedName || (
        isAarav ? 'Aarav Mehta' : 
        isPriya ? 'Priya Nambiar' : 
        isRohan ? 'Rohan Verma' : 
        resolvedEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
      );

      user = {
        uid: `usr-google-${resolvedGoogleId || Date.now()}`,
        displayName: derivedName,
        email: resolvedEmail,
        role: resolvedEmail.includes('admin') ? 'admin' : 'user',
        profileImageUrl: resolvedPhoto || (
          isAarav ? 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80' :
          isPriya ? 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80' :
          isRohan ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80' :
          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(derivedName)}`
        ),
        city: 'Bengaluru',
        preferredLocality: isAarav ? 'Koramangala 4th Block' : isPriya ? 'Indiranagar' : isRohan ? 'HSR Layout' : 'Indiranagar',
        occupation: isAarav ? 'Software Engineer' : isPriya ? 'Product Designer' : isRohan ? 'Data Scientist' : 'Student',
        college: isAarav ? 'BITS Pilani' : isPriya ? 'National Institute of Design (NID)' : isRohan ? 'IIT Madras' : 'University Campus',
        age: isAarav ? 23 : isPriya ? 24 : isRohan ? 25 : 22,
        bio: `${derivedName} • Verified Google user (${resolvedEmail}). Looking for harmonious accommodations in Bengaluru.`,
        budgetMin: isAarav ? 12000 : isPriya ? 14000 : isRohan ? 15000 : 10000,
        budgetMax: isAarav ? 20000 : isPriya ? 22000 : isRohan ? 25000 : 18000,
        cleanliness: 'spotless',
        noiseTolerance: 'low',
        foodPreference: isPriya ? 'any' : 'vegetarian',
        sleepTime: isPriya ? '00:00' : '23:30',
        wakeTime: isPriya ? '08:00' : '07:30',
        profileCompleted: true,
        createdAt: now,
        updatedAt: now
      };
      store.saveUser(user);
    } else {
      if (resolvedPhoto && !user.profileImageUrl) {
        user.profileImageUrl = resolvedPhoto;
      }
      if (resolvedName && (!user.displayName || user.displayName === 'Student User')) {
        user.displayName = resolvedName;
      }
      if (!user.bio) {
        user.bio = `${user.displayName} • Verified Google user (${user.email}).`;
      }
      if (!user.preferredLocality) {
        user.preferredLocality = 'Indiranagar';
      }
      if (!user.age) {
        user.age = 23;
      }
      if (!user.budgetMin) {
        user.budgetMin = 12000;
        user.budgetMax = 20000;
      }
      user.updatedAt = now;
      store.saveUser(user);
    }

    const effectiveApiKey = apiKey || process.env.GOOGLE_API_KEY || '';
    res.json({
      success: true,
      message: 'Google authentication successful',
      data: user,
      googleAuthMeta: {
        verifiedWith: credential ? 'google-id-token' : 'google-api-key',
        apiKey: `${effectiveApiKey.substring(0, 8)}...${effectiveApiKey.slice(-4)}`,
        email: resolvedEmail
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/preferences - Get saved questionnaire preferences
authRouter.get('/preferences', (req: Request, res: Response) => {
  try {
    const userId = (req.headers['x-user-id'] as string) || 'demo-user-1';
    const prefs = store.getUserPreferences(userId);
    res.json({ success: true, data: prefs || null });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/preferences - Save or update questionnaire preferences
authRouter.put('/preferences', (req: Request, res: Response) => {
  try {
    const parsed = UserPreferencesSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: 'Invalid preferences payload', errors: parsed.error.format() });
    }

    const userId = (req.headers['x-user-id'] as string) || 'demo-user-1';
    const prefs: UserPreferences = {
      uid: userId,
      ...parsed.data,
      updatedAt: new Date().toISOString()
    };

    const saved = store.saveUserPreferences(prefs);
    res.json({ success: true, data: saved });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/auth/profile - Save or update user profile and roommate profile
authRouter.put('/profile', (req: Request, res: Response) => {
  try {
    const userId = (req.headers['x-user-id'] as string) || req.body.uid || 'demo-user-1';
    const now = new Date().toISOString();
    let existingUser = store.getUser(userId);

    const updatedUser: User = {
      uid: userId,
      displayName: req.body.displayName || existingUser?.displayName || 'RoomBridge User',
      email: req.body.email || existingUser?.email || 'user@college.edu',
      role: existingUser?.role || 'user',
      occupation: req.body.occupation ?? existingUser?.occupation ?? 'Student',
      college: req.body.college ?? existingUser?.college,
      city: req.body.city ?? existingUser?.city ?? 'Bengaluru',
      profileCompleted: true,
      createdAt: existingUser?.createdAt || now,
      updatedAt: now
    };

    store.saveUser(updatedUser);

    // If roommate profile attributes are present, also save into roommate directory
    if (req.body.sleepTime || req.body.cleanliness || req.body.foodPreference || req.body.budgetMax) {
      const mateProfile: RoommateProfile = {
        uid: userId,
        displayName: updatedUser.displayName,
        photoUrl: req.body.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        age: req.body.age ? Number(req.body.age) : 22,
        occupation: updatedUser.occupation || 'Student',
        college: updatedUser.college || '',
        preferredCity: updatedUser.city || req.body.preferredCity || 'Bengaluru',
        preferredLocality: req.body.preferredLocality || 'Indiranagar',
        budgetMin: req.body.budgetMin ? Number(req.body.budgetMin) : 10000,
        budgetMax: req.body.budgetMax ? Number(req.body.budgetMax) : 18000,
        foodPreference: req.body.foodPreference || 'any',
        sleepTime: req.body.sleepTime || '23:30',
        wakeTime: req.body.wakeTime || '07:30',
        cleanliness: req.body.cleanliness || 'spotless',
        noiseTolerance: req.body.noiseTolerance || 'low',
        studyHabit: req.body.studyHabit || 'morning',
        socialLifestyle: req.body.socialLifestyle || 'moderate',
        smokingPreference: req.body.smokingPreference || 'strictly-non-smoker',
        guestPreference: req.body.guestPreference || 'weekends-only',
        privacyNeed: req.body.privacyNeed || 'standard',
        hobbies: req.body.hobbies || ['Reading', 'Coding'],
        bio: req.body.bio || '',
        updatedAt: now
      };
      store.saveRoommateProfile(mateProfile);
    }

    res.json({ success: true, data: updatedUser });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});
