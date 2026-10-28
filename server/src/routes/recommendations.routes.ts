import { Router, Request, Response } from 'express';
import { store } from '../services/store.js';
import { 
  passesRoomHardConstraints, 
  passesRoommateHardConstraints, 
  calculateRoomScore, 
  calculateRoommateCompatibility,
  calculateCombinedScore,
  calculateTimeDifferenceHours,
  calculateOrdinalSimilarity
} from '../ar2m/engine.js';
import { getMLPrediction } from '../services/mlClient.js';
import { AR2MMatchResult, RoomPreferences, RoommatePreferences, MandatoryRequirements } from '../types/index.js';

export const recommendationsRouter = Router();

// POST /api/recommendations/rooms - AR²M Room Recommendations with Random Forest Ensemble
recommendationsRouter.post('/rooms', async (req: Request, res: Response) => {
  try {
    const { roomPreferences, mandatoryRequirements, userId = 'guest-user' } = req.body;
    const allRooms = store.getAllRooms();

    const results: AR2MMatchResult[] = [];

    for (const room of allRooms) {
      // Stage 1: Hard-constraint filtering
      const filterCheck = passesRoomHardConstraints(room, mandatoryRequirements);
      if (!filterCheck.passes) {
        continue; // Discard ineligible rooms
      }

      // Stage 2: Room suitability scoring
      const { score: rawAr2mScore, reasons } = calculateRoomScore(room, roomPreferences);

      // Random Forest ML Prediction for Room Matching
      const budgetDiff = Math.abs((roomPreferences?.budgetMax || 15000) - room.rent);
      const locationMatch = (roomPreferences?.city || '').toLowerCase() === room.city.toLowerCase() ? 1 : 0;

      const mlPrediction = await getMLPrediction({
        budgetDiff,
        locationMatch,
        sleepDiffHours: 0,
        cleanlinessSim: 1,
        noiseSim: 1,
        ar2mScore: rawAr2mScore
      });

      const predictedScore = mlPrediction?.probability !== undefined
        ? Math.round(mlPrediction.probability * 100)
        : Math.round(rawAr2mScore * 0.94);

      // Composite Ensemble: AR²M Score + Random Forest Score = Final Score (Average)
      const finalScore = Math.round((rawAr2mScore + predictedScore) / 2);

      results.push({
        matchId: `match-room-${room.roomId}-${Date.now()}`,
        userId,
        targetType: 'room',
        targetId: room.roomId,
        room,
        roomScore: rawAr2mScore,
        conflictPenalty: 0,
        ar2mScore: rawAr2mScore,
        predictedScore,
        mlPrediction,
        finalScore,
        matchingReasons: reasons,
        algorithmVersion: 'AR²M-v1.0 (Stages 1-2 + Random Forest Evaluator)',
        createdAt: new Date().toISOString()
      });
    }

    // Stage 7: Deterministic ranking (descending score, tiebreaker: distance)
    results.sort((a, b) => {
      if (b.finalScore !== a.finalScore) {
        return b.finalScore - a.finalScore;
      }
      return (a.room?.distanceKm || 0) - (b.room?.distanceKm || 0);
    });

    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/recommendations/roommates - AR²M Roommate Recommendations with Random Forest Ensemble
recommendationsRouter.post('/roommates', async (req: Request, res: Response) => {
  try {
    const { roommatePreferences, mandatoryRequirements, userId = 'guest-user' } = req.body;
    const allCandidates = store.getAllRoommates();

    const results: AR2MMatchResult[] = [];

    for (const candidate of allCandidates) {
      // Don't recommend self
      if (candidate.uid === userId) continue;

      // Stage 1: Hard-constraint filtering
      const filterCheck = passesRoommateHardConstraints(candidate, roommatePreferences, mandatoryRequirements);
      if (!filterCheck.passes) {
        continue;
      }

      // Stage 3, 4, 5: Base compatibility, similarity functions, and conflict detection
      const { baseScore, conflictPenalty, finalScore: rawAr2mScore, reasons } = calculateRoommateCompatibility(candidate, roommatePreferences);

      // Probe ML prediction service
      const cleanOrder = ['relaxed', 'moderate', 'spotless'];
      const noiseOrder = ['low', 'moderate', 'high'];
      const sleepHoursDiff = calculateTimeDifferenceHours('23:00', candidate.sleepTime);
      const cleanlinessSim = calculateOrdinalSimilarity(roommatePreferences?.cleanliness || 'moderate', candidate.cleanliness, cleanOrder);
      const noiseSim = calculateOrdinalSimilarity(roommatePreferences?.noiseTolerance || 'moderate', candidate.noiseTolerance, noiseOrder);

      const mlPrediction = await getMLPrediction({
        budgetDiff: Math.abs((roommatePreferences?.budgetMax || 15000) - candidate.budgetMax),
        locationMatch: candidate.preferredCity.toLowerCase() === (roommatePreferences?.preferredCity || '').toLowerCase() ? 1 : 0,
        sleepDiffHours: sleepHoursDiff,
        cleanlinessSim,
        noiseSim,
        ar2mScore: rawAr2mScore
      });

      // ML Random Forest Predicted Score
      const predictedScore = mlPrediction?.probability !== undefined
        ? Math.round(mlPrediction.probability * 100)
        : Math.round(rawAr2mScore * 0.95);

      // Composite Ensemble: AR²M Score + Random Forest Score = Final Score (Average)
      const finalScore = Math.round((rawAr2mScore + predictedScore) / 2);

      results.push({
        matchId: `match-mate-${candidate.uid}-${Date.now()}`,
        userId,
        targetType: 'roommate',
        targetId: candidate.uid,
        roommate: candidate,
        roommateScore: rawAr2mScore,
        conflictPenalty,
        ar2mScore: rawAr2mScore,
        predictedScore,
        mlPrediction,
        finalScore,
        matchingReasons: reasons,
        algorithmVersion: 'AR²M-v1.0 (Stages 1-5 + Random Forest Evaluator)',
        createdAt: new Date().toISOString()
      });
    }

    // Stage 7: Deterministic ranking
    results.sort((a, b) => b.finalScore - a.finalScore);

    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/recommendations/combined - AR²M Stage 6: Combined Recommendation (Find Both)
recommendationsRouter.post('/combined', async (req: Request, res: Response) => {
  try {
    const { 
      roomPreferences, 
      roommatePreferences, 
      mandatoryRequirements, 
      userId = 'guest-user',
      alpha = 0.45,
      beta = 0.55
    } = req.body;

    const allRooms = store.getAllRooms();
    const allCandidates = store.getAllRoommates();

    // Eligible rooms
    const eligibleRooms = allRooms
      .filter(r => passesRoomHardConstraints(r, mandatoryRequirements).passes)
      .map(r => ({ room: r, ...calculateRoomScore(r, roomPreferences) }));

    // Eligible roommates
    const eligibleRoommates = allCandidates
      .filter(c => c.uid !== userId && passesRoommateHardConstraints(c, roommatePreferences, mandatoryRequirements).passes)
      .map(c => ({ roommate: c, ...calculateRoommateCompatibility(c, roommatePreferences) }));

    const combinations: AR2MMatchResult[] = [];

    // Pair eligible rooms with compatible roommates
    for (const rItem of eligibleRooms.slice(0, 5)) {
      for (const mItem of eligibleRoommates.slice(0, 5)) {
        // City match check between room and roommate
        if (rItem.room.city.toLowerCase() !== mItem.roommate.preferredCity.toLowerCase()) {
          continue;
        }

        const combinedAr2m = calculateCombinedScore(rItem.score, mItem.finalScore, alpha, beta);
        const combinedReasons = [
          ...rItem.reasons.slice(0, 2),
          ...mItem.reasons.slice(0, 2)
        ];

        // Random Forest evaluation for combined match
        const cleanOrder = ['relaxed', 'moderate', 'spotless'];
        const noiseOrder = ['low', 'moderate', 'high'];
        const sleepHoursDiff = calculateTimeDifferenceHours('23:00', mItem.roommate.sleepTime);
        const cleanlinessSim = calculateOrdinalSimilarity(roommatePreferences?.cleanliness || 'moderate', mItem.roommate.cleanliness, cleanOrder);
        const noiseSim = calculateOrdinalSimilarity(roommatePreferences?.noiseTolerance || 'moderate', mItem.roommate.noiseTolerance, noiseOrder);

        const mlPrediction = await getMLPrediction({
          budgetDiff: Math.abs((roomPreferences?.budgetMax || 15000) - rItem.room.rent),
          locationMatch: rItem.room.city.toLowerCase() === (roomPreferences?.city || '').toLowerCase() ? 1 : 0,
          sleepDiffHours: sleepHoursDiff,
          cleanlinessSim,
          noiseSim,
          ar2mScore: combinedAr2m
        });

        const predictedScore = mlPrediction?.probability !== undefined
          ? Math.round(mlPrediction.probability * 100)
          : Math.round(combinedAr2m * 0.95);

        // Combined Ensemble: AR²M Score + Random Forest Score = Final Score
        const finalScore = Math.round((combinedAr2m + predictedScore) / 2);

        combinations.push({
          matchId: `combo-${rItem.room.roomId}-${mItem.roommate.uid}-${Date.now()}`,
          userId,
          targetType: 'combined',
          targetId: `${rItem.room.roomId}+${mItem.roommate.uid}`,
          room: rItem.room,
          roommate: mItem.roommate,
          roomScore: rItem.score,
          roommateScore: mItem.finalScore,
          conflictPenalty: mItem.conflictPenalty,
          ar2mScore: combinedAr2m,
          predictedScore,
          mlPrediction,
          finalScore,
          matchingReasons: combinedReasons,
          algorithmVersion: `AR²M Combined (α=${alpha}, β=${beta} + Random Forest Evaluator)`,
          createdAt: new Date().toISOString()
        });
      }
    }

    // Deterministic ranking
    combinations.sort((a, b) => b.finalScore - a.finalScore);

    res.json({
      success: true,
      count: combinations.length,
      data: combinations
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});
