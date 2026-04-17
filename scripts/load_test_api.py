from __future__ import annotations

import argparse
import json
import statistics
import threading
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any, Dict, List

from api import create_server
from pipeline.feature_extraction.feature_extractor import FeatureExtractor
from pipeline.normalization.event_normalizer import EventNormalizer
from pipeline.simulation.attack_simulator import EventGenerator


def build_payload(batch_size: int) -> Dict[str, Any]:
    generator = EventGenerator()
    normalizer = EventNormalizer()
    extractor = FeatureExtractor()

    events = generator.generate_events("brute_force", count=batch_size)
    normalized_events = [normalizer.normalize_event(event) for event in events]
    feature_vectors = [extractor.extract_features(event) for event in normalized_events]
    events_batch = [[event] for event in normalized_events]
    return {
        "feature_vectors": feature_vectors,
        "events_batch": events_batch,
    }


def post_json(url: str, payload: Dict[str, Any], timeout: float) -> Dict[str, Any]:
    request = urllib.request.Request(
        url=url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


def percentile(values: List[float], ratio: float) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    index = min(len(ordered) - 1, max(0, int(round((len(ordered) - 1) * ratio))))
    return ordered[index]


def run_load_test(
    requests_count: int,
    concurrency: int,
    batch_size: int,
    timeout: float,
    host: str,
    port: int,
) -> Dict[str, Any]:
    server = create_server(host, port)
    server_thread = threading.Thread(target=server.serve_forever, daemon=True)
    server_thread.start()
    time.sleep(0.25)

    url = f"http://{host}:{port}/detect/batch"
    payload = build_payload(batch_size)
    latencies_ms: List[float] = []
    failures = 0
    total_alerts = 0
    started = time.perf_counter()

    def worker() -> Dict[str, Any]:
        request_start = time.perf_counter()
        response = post_json(url, payload, timeout)
        elapsed_ms = (time.perf_counter() - request_start) * 1000
        return {
            "elapsed_ms": elapsed_ms,
            "count": response.get("count", 0),
        }

    try:
        with ThreadPoolExecutor(max_workers=concurrency) as executor:
            futures = [executor.submit(worker) for _ in range(requests_count)]
            for future in as_completed(futures):
                try:
                    result = future.result()
                    latencies_ms.append(result["elapsed_ms"])
                    total_alerts += result["count"]
                except Exception:
                    failures += 1
    finally:
        server.shutdown()
        server.server_close()
        server_thread.join(timeout=2)

    duration = time.perf_counter() - started
    successful_requests = len(latencies_ms)

    return {
        "requests": requests_count,
        "successful_requests": successful_requests,
        "failed_requests": failures,
        "batch_size": batch_size,
        "concurrency": concurrency,
        "alerts_processed": total_alerts,
        "duration_seconds": round(duration, 3),
        "throughput_rps": round(successful_requests / duration, 2) if duration else 0.0,
        "throughput_alerts_per_second": round(total_alerts / duration, 2) if duration else 0.0,
        "avg_latency_ms": round(statistics.mean(latencies_ms), 2) if latencies_ms else 0.0,
        "p50_latency_ms": round(percentile(latencies_ms, 0.50), 2),
        "p95_latency_ms": round(percentile(latencies_ms, 0.95), 2),
        "p99_latency_ms": round(percentile(latencies_ms, 0.99), 2),
    }


def main():
    parser = argparse.ArgumentParser(description="Run local load tests against the AetherSentrix batch detection API.")
    parser.add_argument("--requests", type=int, default=100, help="Total number of HTTP requests to send.")
    parser.add_argument("--concurrency", type=int, default=16, help="Concurrent client workers.")
    parser.add_argument("--batch-size", type=int, default=25, help="Number of events per batch request.")
    parser.add_argument("--timeout", type=float, default=10.0, help="Per-request timeout in seconds.")
    parser.add_argument("--host", default="127.0.0.1", help="Host to bind the local API server to.")
    parser.add_argument("--port", type=int, default=8081, help="Port to bind the local API server to.")
    args = parser.parse_args()

    results = run_load_test(
        requests_count=args.requests,
        concurrency=args.concurrency,
        batch_size=args.batch_size,
        timeout=args.timeout,
        host=args.host,
        port=args.port,
    )

    print("AetherSentrix Local Load Test")
    print("=" * 40)
    for key, value in results.items():
        print(f"{key}: {value}")


if __name__ == "__main__":
    main()
