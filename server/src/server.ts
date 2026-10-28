import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { roomsRouter } from './routes/rooms.routes.js';
import { roommatesRouter } from './routes/roommates.routes.js';
import { recommendationsRouter } from './routes/recommendations.routes.js';
import { interactionsRouter } from './routes/interactions.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { adminRouter } from './routes/admin.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id']
}));
app.use(express.json());

// API Routes
app.use('/api/rooms', roomsRouter);
app.use('/api/roommates', roommatesRouter);
app.use('/api/recommendations', recommendationsRouter);
app.use('/api/interactions', interactionsRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'RoomBridge Express API',
    engine: 'AR²M (Adaptive Room & Roommate Matching)',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[RoomBridge Server Error]:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

app.listen(PORT, () => {
  console.log(`[RoomBridge Backend] Server running on http://localhost:${PORT}`);
  console.log(`[AR²M Engine] Recommendation pipeline online and initialized`);
});
