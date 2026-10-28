// Machine Learning Service Connector
// Interfaces with the Python Random Forest service on port 8000

export interface MLPredictionInput {
  budgetDiff: number;
  locationMatch: number;
  sleepDiffHours: number;
  cleanlinessSim: number;
  noiseSim: number;
  ar2mScore: number;
}

export interface MLPredictionResult {
  available: boolean;
  predictedClass?: string;
  probability?: number;
  modelVersion?: string;
  note?: string;
}

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';

export async function getMLPrediction(features: MLPredictionInput): Promise<MLPredictionResult> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200); // 1.2s timeout

    const res = await fetch(`${ML_SERVICE_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(features),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return {
        available: false,
        note: `ML service returned status ${res.status}; relying on AR²M deterministic matching`
      };
    }

    const data = await res.json();
    return {
      available: true,
      predictedClass: data.predicted_class,
      probability: data.probability,
      modelVersion: data.model_version || 'RandomForest-v1.0'
    };
  } catch (err) {
    // Graceful fallback when Python ML service is offline
    return {
      available: false,
      note: 'ML service offline; relying on AR²M deterministic matching engine'
    };
  }
}
