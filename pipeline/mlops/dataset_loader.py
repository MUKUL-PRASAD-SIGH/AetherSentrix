from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional

import pandas as pd

from pipeline.anomaly_detector import FEATURE_KEYS


REAL_DATASET_HINTS = {
    "cicids2017": "CICIDS2017",
    "cicids": "CICIDS2017",
    "unsw-nb15": "UNSW-NB15",
    "unsw_nb15": "UNSW-NB15",
    "nsl-kdd": "NSL-KDD",
    "nsl_kdd": "NSL-KDD",
    "kdd": "NSL-KDD",
    "azure": "Azure Network Security",
    "darpa": "DARPA IDS",
}

LABEL_CANDIDATES = [
    "label",
    "Label",
    "attack_cat",
    "attack",
    "classification",
    "class",
    "threat_category",
]


@dataclass(frozen=True)
class DatasetInfo:
    name: str
    path: str
    rows: int
    columns: int
    dataset_family: str
    supports_labels: bool


class DatasetLoader:
    def __init__(self, dataset_dir: str = "data/datasets"):
        self.dataset_dir = Path(dataset_dir)

    def discover(self) -> List[DatasetInfo]:
        if not self.dataset_dir.exists():
            return []

        datasets: List[DatasetInfo] = []
        for path in sorted(self.dataset_dir.glob("*.csv")):
            try:
                frame = pd.read_csv(path, nrows=20)
            except Exception:
                continue

            datasets.append(
                DatasetInfo(
                    name=path.stem,
                    path=str(path),
                    rows=self._count_rows(path),
                    columns=len(frame.columns),
                    dataset_family=self._guess_family(path.stem),
                    supports_labels=self._find_label_column(frame) is not None,
                )
            )
        return datasets

    def load(
        self,
        dataset_name: Optional[str] = None,
        dataset_path: Optional[str] = None,
    ) -> Dict[str, Any]:
        path = self._resolve_path(dataset_name=dataset_name, dataset_path=dataset_path)
        frame = pd.read_csv(path)
        if frame.empty:
            raise ValueError("Dataset file is empty.")

        label_column = self._find_label_column(frame)
        labels = (
            frame[label_column].map(self._normalize_label).fillna("normal_traffic")
            if label_column
            else pd.Series(["normal_traffic"] * len(frame), index=frame.index)
        )

        feature_frame = pd.DataFrame(index=frame.index)
        feature_frame["login_attempt_rate"] = self._pick_numeric(
            frame,
            ["login_attempt_rate", "Flow Packets/s", "flow_packets_s", "ct_srv_dst", "srv_count", "count"],
            default=1.0,
        )
        feature_frame["failed_login_ratio"] = self._pick_numeric(
            frame,
            ["failed_login_ratio", "failed_login_rate", "serror_rate", "failed_logins_ratio", "is_ftp_login"],
            default=0.0,
        )
        feature_frame["session_duration"] = self._pick_numeric(
            frame,
            ["session_duration", "Flow Duration", "dur", "duration"],
            default=600.0,
        )

        forward_bytes = self._pick_numeric(
            frame,
            ["bytes_transferred", "Total Length of Fwd Packets", "sbytes", "src_bytes"],
            default=0.0,
        )
        reverse_bytes = self._pick_numeric(
            frame,
            ["Total Length of Bwd Packets", "dbytes", "dst_bytes"],
            default=0.0,
        )
        feature_frame["bytes_transferred"] = forward_bytes + reverse_bytes
        feature_frame["unique_ips"] = self._pick_numeric(
            frame,
            ["unique_ips", "ct_dst_src_ltm", "ct_src_dport_ltm", "dst_host_count"],
            default=1.0,
        )

        anomaly_base = self._pick_numeric(
            frame,
            ["endpoint_anomaly_score", "ct_dst_ltm", "dst_host_srv_count", "srv_serror_rate"],
            default=0.0,
        )
        feature_frame["endpoint_anomaly_score"] = self._normalize_series(anomaly_base)
        feature_frame["behavior_baseline_deviation"] = self._normalize_series(
            feature_frame["login_attempt_rate"] + feature_frame["failed_login_ratio"] * 10
        )
        feature_frame["periodicity"] = self._pick_numeric(
            frame,
            ["periodicity", "idle_mean", "Flow IAT Mean"],
            default=0.0,
        )
        feature_frame["periodicity"] = self._normalize_series(feature_frame["periodicity"])
        feature_frame["network_confidence_score"] = 1.0 - self._normalize_series(
            feature_frame["endpoint_anomaly_score"] + feature_frame["behavior_baseline_deviation"]
        )

        for key in FEATURE_KEYS:
            feature_frame[key] = pd.to_numeric(feature_frame[key], errors="coerce").fillna(0.0)

        return {
            "dataset_name": path.stem,
            "dataset_family": self._guess_family(path.stem),
            "path": str(path),
            "features": feature_frame[FEATURE_KEYS],
            "labels": labels.astype(str),
            "rows": len(feature_frame),
        }

    def _resolve_path(self, dataset_name: Optional[str], dataset_path: Optional[str]) -> Path:
        if dataset_path:
            path = Path(dataset_path)
            if not path.exists():
                raise FileNotFoundError(f"Dataset path not found: {dataset_path}")
            return path

        discovered = self.discover()
        if dataset_name:
            for dataset in discovered:
                if dataset.name == dataset_name:
                    return Path(dataset.path)
            raise FileNotFoundError(f"Dataset '{dataset_name}' was not found in {self.dataset_dir}")

        if discovered:
            return Path(discovered[0].path)

        raise FileNotFoundError(
            f"No local real datasets found in {self.dataset_dir}. "
            "Add a CSV such as CICIDS2017/UNSW-NB15/NSL-KDD export or a preprocessed CSV with feature columns."
        )

    def _guess_family(self, stem: str) -> str:
        normalized = stem.lower()
        for hint, family in REAL_DATASET_HINTS.items():
            if hint in normalized:
                return family
        return "Generic CSV"

    def _count_rows(self, path: Path) -> int:
        try:
            with path.open("r", encoding="utf-8", errors="ignore") as handle:
                return max(sum(1 for _ in handle) - 1, 0)
        except Exception:
            return 0

    def _find_label_column(self, frame: pd.DataFrame) -> Optional[str]:
        for column in LABEL_CANDIDATES:
            if column in frame.columns:
                return column
        return None

    def _pick_numeric(self, frame: pd.DataFrame, candidates: List[str], default: float) -> pd.Series:
        for column in candidates:
            if column in frame.columns:
                return pd.to_numeric(frame[column], errors="coerce").fillna(default)
        return pd.Series([default] * len(frame), index=frame.index, dtype="float64")

    def _normalize_series(self, series: pd.Series) -> pd.Series:
        numeric = pd.to_numeric(series, errors="coerce").fillna(0.0).astype("float64")
        max_value = float(numeric.max()) if len(numeric) else 0.0
        min_value = float(numeric.min()) if len(numeric) else 0.0
        span = max_value - min_value
        if span <= 0:
            return pd.Series([0.0] * len(numeric), index=numeric.index, dtype="float64")
        return (numeric - min_value) / span

    def _normalize_label(self, raw_label: Any) -> str:
        label = str(raw_label).strip().lower().replace("-", "_").replace(" ", "_")
        if label in {"benign", "normal", "normal_traffic", "0"}:
            return "normal_traffic"
        if "brute" in label or "patator" in label:
            return "brute_force"
        if "bot" in label or "c2" in label or "beacon" in label:
            return "c2_beaconing"
        if "infiltration" in label or "lateral" in label:
            return "lateral_movement"
        if "exfil" in label or "data_theft" in label:
            return "data_exfiltration"
        if "ransom" in label:
            return "ransomware"
        if "phish" in label:
            return "phishing"
        if "sql" in label:
            return "sql_injection"
        if "xss" in label:
            return "xss"
        if "ddos" in label or label == "dos":
            return "ddos"
        if "privilege" in label or label == "u2r":
            return "privilege_escalation"
        if "malware" in label or "shellcode" in label or "worm" in label or "trojan" in label:
            return "malware_infection"
        return label or "normal_traffic"
