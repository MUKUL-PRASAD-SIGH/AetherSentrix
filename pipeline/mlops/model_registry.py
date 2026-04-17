from __future__ import annotations

import json
import pickle
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional


class ModelRegistry:
    def __init__(self, registry_dir: str = "data/model_registry"):
        self.registry_dir = Path(registry_dir)
        self.versions_dir = self.registry_dir / "versions"
        self.registry_path = self.registry_dir / "registry.json"
        self.registry_dir.mkdir(parents=True, exist_ok=True)
        self.versions_dir.mkdir(parents=True, exist_ok=True)

    def load_registry(self) -> Dict[str, Any]:
        if not self.registry_path.exists():
            return {
                "active_mode": "synthetic",
                "active_version": None,
                "latest_real_version": None,
                "latest_synthetic_version": None,
                "versions": [],
            }

        try:
            return json.loads(self.registry_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            return {
                "active_mode": "synthetic",
                "active_version": None,
                "latest_real_version": None,
                "latest_synthetic_version": None,
                "versions": [],
            }

    def save_training_run(
        self,
        *,
        source_mode: str,
        dataset_name: str,
        dataset_family: str,
        metrics: Dict[str, Any],
        classifier_bundle: Dict[str, Any],
        anomaly_bundle: Dict[str, Any],
        activate: bool = True,
    ) -> Dict[str, Any]:
        registry = self.load_registry()
        version = datetime.now(timezone.utc).strftime("v%Y%m%dT%H%M%SZ")
        version_dir = self.versions_dir / version
        version_dir.mkdir(parents=True, exist_ok=True)

        classifier_path = version_dir / "classifier.pkl"
        anomaly_path = version_dir / "anomaly.pkl"

        with classifier_path.open("wb") as handle:
            pickle.dump(classifier_bundle, handle)
        with anomaly_path.open("wb") as handle:
            pickle.dump(anomaly_bundle, handle)

        run = {
            "version": version,
            "trained_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "source_mode": source_mode,
            "dataset_name": dataset_name,
            "dataset_family": dataset_family,
            "metrics": metrics,
            "artifacts": {
                "classifier": str(classifier_path),
                "anomaly": str(anomaly_path),
            },
        }
        registry.setdefault("versions", []).append(run)
        registry[f"latest_{source_mode}_version"] = version

        if activate:
            registry["active_mode"] = source_mode
            registry["active_version"] = version

        self.registry_path.write_text(json.dumps(registry, indent=2), encoding="utf-8")
        return run

    def activate_mode(self, mode: str) -> Dict[str, Any]:
        registry = self.load_registry()
        if mode == "real":
            latest_real_version = registry.get("latest_real_version")
            if not latest_real_version:
                raise ValueError("No real-trained model version is available to activate.")
            registry["active_version"] = latest_real_version
        elif mode == "synthetic":
            registry["active_version"] = registry.get("latest_synthetic_version")

        registry["active_mode"] = mode
        self.registry_path.write_text(json.dumps(registry, indent=2), encoding="utf-8")
        return registry

    def load_active_bundles(self) -> Optional[Dict[str, Any]]:
        registry = self.load_registry()
        active_version = registry.get("active_version")
        if not active_version:
            return None

        run = next(
            (item for item in registry.get("versions", []) if item.get("version") == active_version),
            None,
        )
        if not run:
            return None

        classifier_path = Path(run["artifacts"]["classifier"])
        anomaly_path = Path(run["artifacts"]["anomaly"])
        if not classifier_path.exists() or not anomaly_path.exists():
            return None

        with classifier_path.open("rb") as handle:
            classifier_bundle = pickle.load(handle)
        with anomaly_path.open("rb") as handle:
            anomaly_bundle = pickle.load(handle)

        return {
            "metadata": run,
            "classifier": classifier_bundle,
            "anomaly": anomaly_bundle,
        }
