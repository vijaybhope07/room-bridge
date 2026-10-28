import { Router, Request, Response } from 'express';
import { store } from '../services/store.js';
import { InteractionSchema } from '../validators/index.js';
import { Interaction, SavedItem } from '../types/index.js';

export const interactionsRouter = Router();

// POST /api/interactions - Record behavioral interaction event
interactionsRouter.post('/', (req: Request, res: Response) => {
  try {
    const parsed = InteractionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: 'Invalid interaction payload', errors: parsed.error.format() });
    }

    const interaction: Interaction = {
      interactionId: `int-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ...parsed.data,
      timestamp: new Date().toISOString()
    };

    const recorded = store.recordInteraction(interaction);
    res.status(201).json({ success: true, data: recorded });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/interactions - Get interaction log (optionally by actorId)
interactionsRouter.get('/', (req: Request, res: Response) => {
  try {
    const { actorId } = req.query;
    const list = store.getInteractions(typeof actorId === 'string' ? actorId : undefined);
    res.json({ success: true, count: list.length, data: list });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/saved-items - Save room or roommate profile
interactionsRouter.post('/saved', (req: Request, res: Response) => {
  try {
    const { userId = 'demo-user-1', targetType, targetId } = req.body;
    if (!targetType || !targetId) {
      return res.status(400).json({ success: false, message: 'targetType and targetId are required' });
    }

    const item: SavedItem = {
      savedItemId: `save-${targetType}-${targetId}`,
      userId,
      targetType,
      targetId,
      createdAt: new Date().toISOString()
    };

    const saved = store.saveItem(item);

    // Also record a 'save' interaction event
    store.recordInteraction({
      interactionId: `int-${Date.now()}`,
      actorId: userId,
      targetType,
      targetId,
      eventType: 'save',
      timestamp: new Date().toISOString(),
      recommendationVersion: 'AR2M-v1.0'
    });

    res.status(201).json({ success: true, data: saved });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/saved-items - Unsave item
interactionsRouter.delete('/saved', (req: Request, res: Response) => {
  try {
    const { userId = 'demo-user-1', targetType, targetId } = req.body;
    if (!targetType || !targetId) {
      return res.status(400).json({ success: false, message: 'targetType and targetId are required' });
    }

    const removed = store.unsaveItem(userId, targetType, targetId);
    res.json({ success: true, removed });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/saved-items/:userId - Get saved rooms and roommates for user
interactionsRouter.get('/saved/:userId', (req: Request, res: Response) => {
  try {
    const saved = store.getSavedItems(req.params.userId);
    const rooms = saved.filter(s => s.targetType === 'room').map(s => store.getRoomById(s.targetId)).filter(Boolean);
    const roommates = saved.filter(s => s.targetType === 'roommate').map(s => store.getRoommateByUid(s.targetId)).filter(Boolean);

    res.json({
      success: true,
      data: {
        raw: saved,
        rooms,
        roommates
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});
