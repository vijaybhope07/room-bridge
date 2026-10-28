import { Router, Request, Response } from 'express';
import { store } from '../services/store.js';
import { RoomCreateSchema } from '../validators/index.js';
import { Room } from '../types/index.js';

export const roomsRouter = Router();

// GET /api/rooms - List and filter rooms
roomsRouter.get('/', (req: Request, res: Response) => {
  try {
    let rooms = store.getAllRooms();

    const { city, minRent, maxRent, roomType, furnishing, locality, sort } = req.query;

    if (city && typeof city === 'string' && city !== 'all') {
      rooms = rooms.filter(r => r.city.toLowerCase() === city.toLowerCase());
    }

    if (locality && typeof locality === 'string') {
      rooms = rooms.filter(r => r.locality.toLowerCase().includes(locality.toLowerCase()));
    }

    if (minRent) {
      rooms = rooms.filter(r => r.rent >= Number(minRent));
    }

    if (maxRent) {
      rooms = rooms.filter(r => r.rent <= Number(maxRent));
    }

    if (roomType && typeof roomType === 'string' && roomType !== 'all') {
      rooms = rooms.filter(r => r.roomType === roomType);
    }

    if (furnishing && typeof furnishing === 'string' && furnishing !== 'all') {
      rooms = rooms.filter(r => r.furnishing === furnishing);
    }

    // Sorting
    if (sort === 'price_asc') {
      rooms.sort((a, b) => a.rent - b.rent);
    } else if (sort === 'price_desc') {
      rooms.sort((a, b) => b.rent - a.rent);
    } else if (sort === 'distance') {
      rooms.sort((a, b) => a.distanceKm - b.distanceKm);
    } else {
      // Default: newest first
      rooms.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    res.json({
      success: true,
      count: rooms.length,
      data: rooms
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/rooms/:id - Get single room details
roomsRouter.get('/:id', (req: Request, res: Response) => {
  try {
    const room = store.getRoomById(req.params.id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }
    res.json({ success: true, data: room });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/rooms - Create new room listing
roomsRouter.post('/', (req: Request, res: Response) => {
  try {
    const parsed = RoomCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parsed.error.format()
      });
    }

    const newRoom: Room = {
      roomId: `room-${Date.now()}`,
      ownerId: req.body.ownerId || 'host-current-user',
      ownerName: req.body.ownerName || 'Verified Host',
      ownerPhone: req.body.ownerPhone,
      ...parsed.data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const created = store.createRoom(newRoom);
    res.status(201).json({ success: true, data: created });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/rooms/:id - Update room
roomsRouter.patch('/:id', (req: Request, res: Response) => {
  try {
    const updated = store.updateRoom(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/rooms/:id - Delete room
roomsRouter.delete('/:id', (req: Request, res: Response) => {
  try {
    const success = store.deleteRoom(req.params.id);
    if (!success) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }
    res.json({ success: true, message: 'Room deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});
