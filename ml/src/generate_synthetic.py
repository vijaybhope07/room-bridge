"""
RoomBridge ML Pipeline: Synthetic Dataset Generator
Generates reproducible pairwise candidate interactions with ground-truth behavioral outcomes
"""
import os
import json
import numpy as np
import pandas as pd

def generate_synthetic_data(num_samples: int = 1500, random_seed: int = 42) -> pd.DataFrame:
    np.random.seed(random_seed)

    # Features:
    # 1. budget_diff: absolute difference in monthly budget (0 to 10,000)
    budget_diff = np.random.exponential(scale=2500, size=num_samples).clip(0, 10000)

    # 2. location_match: 1 if same city/locality, 0 otherwise
    location_match = np.random.binomial(n=1, p=0.72, size=num_samples)

    # 3. sleep_diff_hours: difference in bedtime in hours (0 to 6)
    sleep_diff_hours = np.random.exponential(scale=1.5, size=num_samples).clip(0, 6.0)

    # 4. cleanliness_sim: ordinal cleanliness similarity (0.0 to 1.0)
    cleanliness_sim = np.random.beta(a=4, b=2, size=num_samples)

    # 5. noise_sim: ordinal noise tolerance similarity (0.0 to 1.0)
    noise_sim = np.random.beta(a=3.5, b=2, size=num_samples)

    # 6. ar2m_score: deterministic baseline score (30 to 98)
    base_ar2m = (
        (1 - budget_diff / 10000) * 20 +
        location_match * 20 +
        (1 - sleep_diff_hours / 6.0) * 20 +
        cleanliness_sim * 20 +
        noise_sim * 20
    ).clip(10, 100)

    # Probability of mutual successful match derived with realistic noise
    logit = (
        0.045 * base_ar2m +
        1.2 * location_match -
        0.0003 * budget_diff -
        0.4 * sleep_diff_hours +
        1.8 * cleanliness_sim +
        1.2 * noise_sim -
        4.8
    )
    prob_success = 1.0 / (1.0 + np.exp(-logit))
    is_successful_match = (np.random.rand(num_samples) < prob_success).astype(int)

    df = pd.DataFrame({
        'budget_diff': np.round(budget_diff, 2),
        'location_match': location_match,
        'sleep_diff_hours': np.round(sleep_diff_hours, 2),
        'cleanliness_sim': np.round(cleanliness_sim, 3),
        'noise_sim': np.round(noise_sim, 3),
        'ar2m_score': np.round(base_ar2m, 1),
        'is_successful_match': is_successful_match
    })

    return df

if __name__ == '__main__':
    data_dir = os.path.join(os.path.dirname(__file__), '..', 'data')
    os.makedirs(data_dir, exist_ok=True)
    df = generate_synthetic_data(num_samples=1500)
    output_path = os.path.join(data_dir, 'synthetic_training_dataset.csv')
    df.to_csv(output_path, index=False)
    print(f"Generated {len(df)} synthetic interaction rows saved to {output_path}")
    print(df.head())
