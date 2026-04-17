from __future__ import annotations

import pandas as pd
from typing import Any, Dict, List


class FeatureExtractor:
    def __init__(self):
        self.extracted_features = []

    def extract_features(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """Extract features from a single event (Legacy/Serial)."""
        return self.extract_features_batch([event])[0]

    def extract_features_batch(self, events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Extract features from a batch of events using vectorized Pandas operations."""
        if not events:
            return []

        df = pd.DataFrame(events)
        
        # Ensure metadata is present for all
        if "metadata" not in df.columns:
            df["metadata"] = [{} for _ in range(len(df))]
        else:
            df["metadata"] = df["metadata"].apply(lambda x: x if isinstance(x, dict) else {})

        # Vectorized mapping of standard fields
        df["event_id"] = df.get("event_id", pd.Series(["unknown"] * len(df))).fillna("unknown")
        df["timestamp"] = df.get("timestamp", pd.Series(["2026-04-14T00:00:00Z"] * len(df))).fillna("2026-04-14T00:00:00Z")
        df["user"] = df.get("user", pd.Series(["unknown"] * len(df))).fillna("unknown")
        df["host"] = df.get("host", pd.Series(["unknown"] * len(df))).fillna("unknown")
        
        # IP Resolution
        df["source_ip"] = df.get("source_ip", df.get("ip", pd.Series(["0.0.0.0"] * len(df)))).fillna("0.0.0.0")
        
        # Destination IP (check both root and metadata)
        dest_ips = []
        for _, row in df.iterrows():
            dest_ips.append(row.get("destination_ip") or row.get("metadata", {}).get("destination_ip") or "0.0.0.0")
        df["destination_ip"] = dest_ips

        df["event_type"] = df.get("event_type", pd.Series(["unknown"] * len(df))).fillna("unknown")
        df["action"] = df.get("action", pd.Series(["unknown"] * len(df))).fillna("unknown")
        df["outcome"] = df.get("outcome", pd.Series(["unknown"] * len(df))).fillna("unknown")

        # Numeric features
        numeric_cols = [
            "login_attempt_rate", "failed_login_ratio", "session_duration", 
            "unique_ips", "periodicity", "endpoint_anomaly_score", 
            "behavior_baseline_deviation", "network_confidence_score"
        ]
        
        for col in numeric_cols:
            df[col] = pd.to_numeric(df.get(col, 0.0), errors='coerce').fillna(0.0 if col != "unique_ips" else 1.0)

        # Special handling for bytes
        df["bytes_transferred"] = pd.to_numeric(
            df.get("bytes_transferred", df.get("outbound_bytes", 0.0)), 
            errors='coerce'
        ).fillna(0.0)
        
        # Business logic: Data exfiltration default bytes
        mask = (df["bytes_transferred"] == 0.0) & (df["event_type"] == "data_exfiltration")
        df.loc[mask, "bytes_transferred"] = 25_000_000.0

        # Convert back to list of dicts
        results = df.to_dict("records")
        self.extracted_features.extend(results)
        return results

    def get_extraction_count(self) -> int:
        return len(self.extracted_features)

    def _as_float(self, value: Any, default: float) -> float:
        if value is None:
            return default
        try:
            return float(value)
        except (TypeError, ValueError):
            return default

