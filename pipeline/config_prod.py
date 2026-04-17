"""Production configuration for AetherSentrix."""

import os
from typing import Dict, Any

# ML Configuration
ML_CONFIG: Dict[str, Any] = {
    'anomaly_detector': {
        'algorithm': 'isolation_forest',
        'n_estimators': 100,
        'contamination': 0.1,
        'random_state': 42,
        'max_samples': 'auto',
        'n_jobs': -1
    },
    'threat_classifier': {
        'algorithm': 'xgboost_rf_ensemble',
        'xgb_config': {
            'n_estimators': 200,
            'max_depth': 6,
            'learning_rate': 0.1,
            'objective': 'multi:softprob',
        },
        'rf_config': {
            'n_estimators': 100,
            'max_depth': 10,
            'class_weight': 'balanced'
        },
        'num_classes': 15
    },
    'feature_config': {
        'scaler_type': 'standard',
        'fill_missing': 'mean',
        'outlier_threshold': 3.0
    }
}

# Data Configuration
DATA_CONFIG: Dict[str, Any] = {
    'dataset_path': 'data/datasets/cicids2017_final.csv',
    'processed_data_cache': 'data/datasets/processed/',
    'train_size': 0.7,
    'val_size': 0.15,
    'test_size': 0.15,
    'random_state': 42
}

# Model Registry Configuration
REGISTRY_CONFIG: Dict[str, Any] = {
    'registry_dir': 'data/model_registry/',
    'versions_dir': 'data/model_registry/versions/',
    'default_version': 'latest',
    'max_versions': 10,
    'keep_best_n': 5
}

# API Configuration
API_CONFIG: Dict[str, Any] = {
    'title': 'AetherSentrix SOC API',
    'version': '2.0.0',
    'description': 'Production-grade API for AI threat detection',
    'host': os.getenv('API_HOST', 'localhost'),
    'port': int(os.getenv('API_PORT', '8000')),
    'enable_https': os.getenv('ENABLE_HTTPS', 'false').lower() == 'true',
    'ssl_cert_path': os.getenv('SSL_CERT_PATH', '/etc/ssl/certs/cert.pem'),
    'ssl_key_path': os.getenv('SSL_KEY_PATH', '/etc/ssl/private/key.pem')
}

# Security Configuration
SECURITY_CONFIG: Dict[str, Any] = {
    'jwt_secret': os.getenv('JWT_SECRET', 'change-me-in-production'),
    'jwt_algorithm': 'HS256',
    'token_expiry_seconds': 3600,
    'encryption_key_path': os.getenv('ENCRYPTION_KEY_PATH', '.encryption_key'),
    'cors_origins': ['http://localhost:3000', 'http://localhost:5173'],
    'enable_cors': True
}

# Logging Configuration
LOGGING_CONFIG: Dict[str, Any] = {
    'level': os.getenv('LOG_LEVEL', 'INFO'),
    'format': 'json',
    'log_file': 'logs/aether.log',
    'max_bytes': 10485760,  # 10MB
    'backup_count': 5
}

# Storage Configuration
STORAGE_CONFIG: Dict[str, Any] = {
    'alerts_file': 'data/alerts.jsonl',
    'events_file': 'data/events.jsonl',
    'audit_log_file': 'data/audit_logs.jsonl'
}

# Cache Configuration
CACHE_CONFIG: Dict[str, Any] = {
    'type': os.getenv('CACHE_TYPE', 'redis'),
    'redis_url': os.getenv('REDIS_URL', 'redis://localhost:6379'),
    'ttl': 300,
    'enable_model_caching': True
}

# Monitoring Configuration
MONITORING_CONFIG: Dict[str, Any] = {
    'prometheus_port': 9090,
    'metrics_path': '/metrics',
    'enable_metrics': True,
    'enable_tracing': False
}

# SIEM Integration Configuration
SIEM_CONFIG: Dict[str, Any] = {
    'supported_formats': ['cef', 'syslog', 'json'],
    'default_format': 'json',
    'webhook_signing': True,
    'webhook_timeout': 5
}

# Detection Configuration
DETECTION_CONFIG: Dict[str, Any] = {
    'anomaly_threshold': 0.7,
    'threat_confidence_threshold': 0.6,
    'alert_severity_mapping': {
        'low': {'anomaly_score': (0.5, 0.65), 'confidence': (0.4, 0.6)},
        'medium': {'anomaly_score': (0.65, 0.8), 'confidence': (0.6, 0.8)},
        'high': {'anomaly_score': (0.8, 0.95), 'confidence': (0.8, 1.0)},
        'critical': {'anomaly_score': (0.95, 1.0), 'confidence': (0.95, 1.0)}
    }
}

# Feature Extraction Configuration
FEATURE_CONFIG: Dict[str, Any] = {
    'use_attack_graph': True,
    'use_explainability': True,
    'max_features': 100,
    'min_feature_importance': 0.01
}


def get_config(key: str, default: Any = None) -> Any:
    """Get configuration value by key."""
    config_map = {
        'ml': ML_CONFIG,
        'data': DATA_CONFIG,
        'registry': REGISTRY_CONFIG,
        'api': API_CONFIG,
        'security': SECURITY_CONFIG,
        'logging': LOGGING_CONFIG,
        'storage': STORAGE_CONFIG,
        'cache': CACHE_CONFIG,
        'monitoring': MONITORING_CONFIG,
        'siem': SIEM_CONFIG,
        'detection': DETECTION_CONFIG,
        'features': FEATURE_CONFIG
    }
    return config_map.get(key, default)
