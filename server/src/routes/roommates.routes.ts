import { Router, Request, Response } from 'express';
import { store } from '../services/store.js';
import { RoommateProfileSchema, RoommateRequestCreateSchema } from '../validators/index.js';
import { RoommateProfile, RoommateRequest } from '../types/index.js';

export const roommatesRouter = Router();

// GET /api/roommates - List and filter roommate profiles
roommatesRouter.get('/', (req: Request, res: Response) => {
  try {
    let roommates = store.getAllRoommates();
    const { city, food, cleanliness, maxBudget, minBudget } = req.query;

    if (city && typeof city === 'string' && city !== 'all') {
      roommates = roommates.filter(rm => rm.preferredCity.toLowerCase() === city.toLowerCase());
    }

    if (food && typeof food === 'string' && food !== 'any') {
      roommates = roommates.filter(rm => rm.foodPreference === food || rm.foodPreference === 'any');
    }

    if (cleanliness && typeof cleanliness === 'string') {
      roommates = roommates.filter(rm => rm.cleanliness === cleanliness);
    }

    if (maxBudget) {
      roommates = roommates.filter(rm => rm.budgetMin <= Number(maxBudget));
    }

    if (minBudget) {
      roommates = roommates.filter(rm => rm.budgetMax >= Number(minBudget));
    }

    res.json({
      success: true,
      count: roommates.length,
      data: roommates
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/roommates/:uid - Get single roommate profile
roommatesRouter.get('/:uid', (req: Request, res: Response) => {
  try {
    const roommate = store.getRoommateByUid(req.params.uid);
    if (!roommate) {
      return res.status(404).json({ success: false, message: 'Roommate profile not found' });
    }
    res.json({ success: true, data: roommate });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/roommates - Create or update roommate profile
roommatesRouter.post('/', (req: Request, res: Response) => {
  try {
    const parsed = RoommateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parsed.error.format()
      });
    }

    const uid = req.body.uid || `user-${Date.now()}`;
    const profile: RoommateProfile = {
      uid,
      ...parsed.data,
      updatedAt: new Date().toISOString()
    };

    const saved = store.saveRoommateProfile(profile);
    res.status(201).json({ success: true, data: saved });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/roommates/requests - Send roommate connect request
roommatesRouter.post('/requests', (req: Request, res: Response) => {
  try {
    const parsed = RoommateRequestCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: 'Invalid request data', errors: parsed.error.format() });
    }

    const senderId = req.body.senderId || 'demo-user-1';
    const sender = store.getUser(senderId) || { displayName: 'Karan Sharma', profileImageUrl: undefined };
    const receiver = store.getRoommateByUid(parsed.data.receiverId) || { displayName: 'Peer' };

    const newRequest: RoommateRequest = {
      requestId: `req-${Date.now()}`,
      senderId,
      senderName: sender.displayName,
      senderPhoto: sender.profileImageUrl,
      receiverId: parsed.data.receiverId,
      receiverName: receiver.displayName,
      status: 'pending',
      message: parsed.data.message || "Hi, I noticed our lifestyles and budget match on RoomBridge. Let's connect!",
      compatibilityScore: parsed.data.compatibilityScore,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const created = store.createRequest(newRequest);
    res.status(201).json({ success: true, data: created });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/roommates/requests/:userId - Get requests for user
roommatesRouter.get('/requests/:userId', (req: Request, res: Response) => {
  try {
    const requests = store.getRequestsForUser(req.params.userId);
    res.json({ success: true, data: requests });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/roommates/requests/:id - Accept or decline request
roommatesRouter.patch('/requests/:id', (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    if (!['pending', 'accepted', 'declined', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const updated = store.updateRequestStatus(req.params.id, status);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});
