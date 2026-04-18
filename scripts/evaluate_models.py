#!/usr/bin/env python3
"""
AetherSentrix Model Evaluation & Trace Script
Generates fake synthetic data rounds to measure exact statistics of the running AI Models
(AnomalyDetector & ThreatClassifier) and prints a verbose Trace of a specific event
to demonstrate exactly what happens mathematically inside the pipeline.
"""

import sys
import os
import json
import time
import numpy as np

# Add project root to path so we can import modules natively
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from pipeline.simulation.attack_simulator import EventGenerator, ScenarioLibrary, AttackSimulator
from pipeline.ingestion.event_ingestor import EventIngestor
from pipeline.normalization.event_normalizer import EventNormalizer
from pipeline.feature_extraction.feature_extractor import FeatureExtractor
from pipeline.detection_engine import DetectionEngine
from pipeline.mlops.model_evaluator import ModelEvaluator

def print_section(title: str):
    print(f"\n{'-'*60}")
    print(f"{title}")
    print(f"{'-'*60}")

def run_trace_showcase(engine: DetectionEngine, normalizer: EventNormalizer, extractor: FeatureExtractor, generator: EventGenerator):
    """Verbose, step-by-step trace of exactly what happens inside the AI."""
    print_section("🔍 STEP-BY-STEP X-RAY TRACE: WHAT'S GOING ON IN THE AI?")
    
    # 1. Generate a simulated event (e.g., from an attacker)
    print("STEP 1: A raw event hits the system (Simulated).")
    raw_events = generator.generate_events("brute_force", count=1)
    raw_event = raw_events[0]
    
    print("\n   [Raw Telemetry Payload]")
    print(f"   {json.dumps(raw_event, indent=2)}")
    
    # 2. Normalization
    print("\nSTEP 2: The pipeline normalizes the payload into standard schema.")
    normalized = normalizer.normalize_event(raw_event)
    
    # 3. Feature Extraction
    print("\nSTEP 3: The `FeatureExtractor` strips telemetry into mathematical metrics used by the models.")
    extracted = extractor.extract_features(normalized)
    
    print(f"   [Feature Array Formatted for SNN/LNN]")
    # Printing specific subsets of the dictionary mapping to show the metrics
    vital_metrics = {k: v for k, v in extracted.items() if isinstance(v, (int, float))}
    for key, val in vital_metrics.items():
        print(f"   - {key}: {val}")

    # 4. Processing in Isolation Forest
    print("\nSTEP 4: Evaluating against Isolation Forest for Anomaly Detection.")
    print("   -> Forest receives normalized mathematical vector.")
    
    anomaly_score = engine.anomaly_detector.score_batch([extracted])[0]
    is_anomaly = anomaly_score > 0.5
    print(f"   -> [Isolation Forest Anomaly Score]: {anomaly_score:.3f} (Threshold 0.5) -> {'ISOLATION DETECTED' if is_anomaly else 'BASELINE'}")
    
    print("\nSTEP 5: Evaluating against XGBoost+RF Ensemble for Classification.")
    classification = engine.classifier.predict_batch([extracted])[0]
    expected_threat = classification.get('threat_category', 'unknown') if isinstance(classification, dict) else classification
    risk = classification.get('risk_score', 0.0) if isinstance(classification, dict) else 0.0
    print(f"   -> [Ensemble Voting Output]: Threat Context = {expected_threat.upper()}, Calculated Risk = {risk:.3f}")
    
    print("\nSTEP 6: Confidence Fusion & Explainability Layer")
    detect_res = engine.detect_events([normalized])
    
    print(f"   -> [Final Alert Confidence]: {detect_res['confidence'].upper()}")
    print(f"   -> [Plain English Logic]:")
    print(f"      {detect_res['explanation']['text']}")

    return
def generate_and_evaluate_synthetic_dataset():
    """Generates 1500 mock events, runs them through the ML pipeline, and calculates full stats"""
    print_section("⚙️ MOCK DATASET GENERATION")
    print("Initializing AetherSentrix Simulation Engines...")
    generator = EventGenerator()
    normalizer = EventNormalizer()
    extractor = FeatureExtractor()
    engine = DetectionEngine()
    
    # Generate ~1000 Benign / Normal events
    print("Generating ~1000 Baseline Traffic Events...")
    normal_events = generator.generate_events("successful_login", count=500) + \
                    generator.generate_events("file_access", count=500)
                    
    # Generate ~500 Malicious events
    print("Generating ~500 Simulated Attack Events across varying vectors...")
    malicious_events = generator.generate_events("brute_force", count=200) + \
                       generator.generate_events("c2_beacon", count=150) + \
                       generator.generate_events("data_exfiltration", count=150)
                       
    all_events = normal_events + malicious_events
    y_true_anomaly = [0] * len(normal_events) + [1] * len(malicious_events)
    
    print(f"Total synthetic batch ready: {len(all_events)} events.")
    
    print_section("🧠 AI MODEL INFERENCE RUN")
    start_time = time.time()
    
    y_pred_anomaly_scores = []
    y_pred_anomaly_labels = []
    
    y_pred_classification = []
    
    # Vectorize and Predict loop
    for event in all_events:
        norm = normalizer.normalize_event(event)
        feat = extractor.extract_features(norm)
        # 1. Anomaly Detector processing stats
        anomaly_score = engine.anomaly_detector.score_batch([feat])[0]
        y_pred_anomaly_scores.append(anomaly_score)
        y_pred_anomaly_labels.append(1 if anomaly_score > 0.5 else 0)
        
        # 2. Threat Classifier processing stats
        # We classify if the classification matched the mal behavior
        clf = engine.classifier.predict_batch([feat])[0]
        threat_cat = clf.get("threat_category", "unknown") if isinstance(clf, dict) else clf
        is_threat = 1 if threat_cat != "unknown" and threat_cat != "benign" else 0
        y_pred_classification.append(is_threat)

    end_time = time.time()
    print(f"Inference complete! Processed {len(all_events)} records in {end_time - start_time:.2f} seconds.")

    print_section("📊 MODEL STATISTICS & ACCURACY METRICS")
    
    y_true_arr = np.array(y_true_anomaly)
    y_pred_anom_arr = np.array(y_pred_anomaly_labels)
    y_scores_arr = np.array(y_pred_anomaly_scores)
    y_pred_class_arr = np.array(y_pred_classification)

    # Use our internal ModelEvaluator
    evaluator = ModelEvaluator()
    
    # 1. Isolation Forest Output (Anomaly Extractor)
    print("MODEL 1: Isolation Forest (Anomaly Detector)")
    anom_metrics = evaluator.evaluate_anomaly_detector(y_true_arr, y_pred_anom_arr, scores=y_scores_arr)
    print(f"  - Accuracy : {anom_metrics['accuracy'] * 100:.2f}%")
    print(f"  - Precision: {anom_metrics['precision'] * 100:.2f}%  (When it isolates behavior, it is an actual anomaly)")
    print(f"  - Recall   : {anom_metrics['recall'] * 100:.2f}%  (Did it catch the anomalies or let them slip?)")
    print(f"  - F1-Score : {anom_metrics['f1'] * 100:.2f}%")
    if 'roc_auc' in anom_metrics:
         print(f"  - ROC-AUC  : {anom_metrics['roc_auc'] * 100:.2f}%")

    # 2. XGBoost + RF Ensemble Output (Threat Classifier)
    print("\nMODEL 2: XGBoost + Random Forest Ensemble (Context/Threat Classifier)")
    class_metrics = evaluator.evaluate_classifier(y_true_arr, y_pred_class_arr)
    print(f"  - Accuracy : {class_metrics['accuracy'] * 100:.2f}%")
    print(f"  - Precision: {class_metrics['precision'] * 100:.2f}%")
    print(f"  - Recall   : {class_metrics['recall'] * 100:.2f}%")
    print(f"  - F1-Score : {class_metrics['f1'] * 100:.2f}%")
    
    print("\n(Note: With purely synthetic, pattern-based demo data, expect artificially high metrics ~95-100%.)")

    # Show the trace using the same instances we built
    run_trace_showcase(engine, normalizer, extractor, generator)


if __name__ == "__main__":
    generate_and_evaluate_synthetic_dataset()
