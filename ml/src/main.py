"""
RoomBridge ML Service: FastAPI Prediction Endpoint
Exposes /predict and /health
"""
import os
import joblib
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(
    title="RoomBridge ML Service",
    description="Random Forest Roommate Compatibility Prediction Service",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'models', 'random_forest_model.joblib')
model = None

@app.on_event("startup")
def load_model():
    global model
    if os.path.exists(MODEL_PATH):
        try:
            model = joblib.load(MODEL_PATH)
            print(f"[ML Service] Loaded Random Forest model from {MODEL_PATH}")
        except Exception as e:
            print(f"[ML Service] Error loading model: {e}")
    else:
        print("[ML Service] No pre-saved model found. Running in baseline fallback mode.")

class PredictionRequest(BaseModel):
    budgetDiff: float = Field(..., description="Absolute budget variance")
    locationMatch: int = Field(..., description="1 if matching location, 0 otherwise")
    sleepDiffHours: float = Field(..., description="Sleep time difference in hours")
    cleanlinessSim: float = Field(..., description="Cleanliness similarity between 0 and 1")
    noiseSim: float = Field(..., description="Noise similarity between 0 and 1")
    ar2mScore: float = Field(..., description="AR²M deterministic score")

class PredictionResponse(BaseModel):
    predicted_class: str
    probability: float
    model_version: str
    confidence_tier: str

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "RoomBridge ML Engine",
        "model_loaded": model is not None,
        "model_version": "RandomForest-v1.0"
    }

@app.post("/predict", response_model=PredictionResponse)
def predict(request: PredictionRequest):
    features = np.array([[
        request.budgetDiff,
        request.locationMatch,
        request.sleepDiffHours,
        request.cleanlinessSim,
        request.noiseSim,
        request.ar2mScore
    ]])

    if model is not None:
        try:
            prob = float(model.predict_proba(features)[0][1])
            pred_class = "High Compatibility" if prob >= 0.65 else ("Moderate Compatibility" if prob >= 0.40 else "Low Compatibility")
            return PredictionResponse(
                predicted_class=pred_class,
                probability=round(prob, 3),
                model_version="RandomForest-v1.0",
                confidence_tier="High" if prob >= 0.7 or prob <= 0.3 else "Moderate"
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    else:
        # Fallback using calibrated logistic mapping if model binary not yet trained
        score = request.ar2mScore / 100.0
        prob = max(0.05, min(0.98, score * 0.95))
        pred_class = "High Compatibility" if prob >= 0.65 else ("Moderate Compatibility" if prob >= 0.40 else "Low Compatibility")
        return PredictionResponse(
            predicted_class=pred_class,
            probability=round(prob, 3),
            model_version="CalibratedBaseline-v1.0",
            confidence_tier="Estimated"
        )

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
