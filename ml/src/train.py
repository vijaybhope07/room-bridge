"""
RoomBridge ML Pipeline: Random Forest Model Training & Evaluation
"""
import os
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score, accuracy_score
from generate_synthetic import generate_synthetic_data

def train_and_evaluate():
    # 1. Load or generate training data
    df = generate_synthetic_data(num_samples=2000, random_seed=42)

    features = ['budget_diff', 'location_match', 'sleep_diff_hours', 'cleanliness_sim', 'noise_sim', 'ar2m_score']
    X = df[features]
    y = df['is_successful_match']

    # 2. Train / Test Split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    # 3. Model Fit: RandomForestClassifier
    clf = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        min_samples_split=5,
        random_state=42,
        class_weight='balanced'
    )
    clf.fit(X_train, y_train)

    # 4. Evaluation
    y_pred = clf.predict(X_test)
    y_prob = clf.predict_proba(X_test)[:, 1]

    acc = accuracy_score(y_test, y_pred)
    roc = roc_auc_score(y_test, y_prob)

    print("=========================================")
    print("RoomBridge Random Forest Model Evaluation")
    print("=========================================")
    print(f"Accuracy: {acc:.4f}")
    print(f"ROC-AUC:  {roc:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    print("\nConfusion Matrix:")
    print(confusion_matrix(y_test, y_pred))

    # Feature Importance
    importances = dict(zip(features, clf.feature_importances_))
    print("\nFeature Importances:")
    for feat, imp in sorted(importances.items(), key=lambda x: x[1], reverse=True):
        print(f"  {feat}: {imp:.4f}")

    # 5. Save model artifact
    models_dir = os.path.join(os.path.dirname(__file__), '..', 'models')
    os.makedirs(models_dir, exist_ok=True)
    model_path = os.path.join(models_dir, 'random_forest_model.joblib')
    joblib.dump(clf, model_path)
    print(f"\nModel saved successfully to {model_path}")

if __name__ == '__main__':
    train_and_evaluate()
