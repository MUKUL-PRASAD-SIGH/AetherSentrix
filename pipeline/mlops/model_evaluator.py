"""Model evaluation utilities."""

import numpy as np
from typing import Dict, Any
from sklearn.metrics import (
    confusion_matrix, accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, roc_curve, auc
)
from sklearn.model_selection import cross_val_score
import logging

logger = logging.getLogger(__name__)


class ModelEvaluator:
    """Evaluate model performance."""

    @staticmethod
    def evaluate_classifier(y_true: np.ndarray, y_pred: np.ndarray, 
                           y_proba: np.ndarray = None, 
                           average: str = 'weighted') -> Dict[str, float]:
        """Compute classification metrics."""
        metrics = {
            'accuracy': float(accuracy_score(y_true, y_pred)),
            'precision': float(precision_score(y_true, y_pred, average=average, zero_division=0)),
            'recall': float(recall_score(y_true, y_pred, average=average, zero_division=0)),
            'f1': float(f1_score(y_true, y_pred, average=average, zero_division=0))
        }
        
        # Add ROC-AUC if probability predictions available
        if y_proba is not None:
            try:
                if len(np.unique(y_true)) == 2:
                    metrics['roc_auc'] = float(roc_auc_score(y_true, y_proba[:, 1]))
                else:
                    metrics['roc_auc'] = float(roc_auc_score(y_true, y_proba, multi_class='ovr', average=average))
            except Exception as e:
                logger.warning(f"Could not calculate ROC-AUC: {str(e)}")
        
        return metrics

    @staticmethod
    def evaluate_anomaly_detector(y_true: np.ndarray, y_pred: np.ndarray,
                                 scores: np.ndarray = None) -> Dict[str, float]:
        """Evaluate anomaly detection performance."""
        metrics = {
            'accuracy': float(accuracy_score(y_true, y_pred)),
            'precision': float(precision_score(y_true, y_pred, zero_division=0)),
            'recall': float(recall_score(y_true, y_pred, zero_division=0)),
            'f1': float(f1_score(y_true, y_pred, zero_division=0))
        }
        
        # Add ROC-AUC based on anomaly scores
        if scores is not None:
            try:
                metrics['roc_auc'] = float(roc_auc_score(y_true, scores))
            except Exception as e:
                logger.warning(f"Could not calculate ROC-AUC: {str(e)}")
        
        return metrics

    @staticmethod
    def cross_validate(model, X: np.ndarray, y: np.ndarray, 
                      cv: int = 5, scoring: str = 'accuracy') -> Dict[str, Any]:
        """Perform k-fold cross-validation."""
        scores = cross_val_score(model, X, y, cv=cv, scoring=scoring)
        
        return {
            'mean_score': float(scores.mean()),
            'std_score': float(scores.std()),
            'scores': scores.tolist(),
            'fold_count': cv
        }

    @staticmethod
    def confusion_matrix_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, Any]:
        """Compute confusion matrix and related metrics."""
        cm = confusion_matrix(y_true, y_pred)
        
        return {
            'confusion_matrix': cm.tolist(),
            'true_negatives': int(cm[0, 0]),
            'false_positives': int(cm[0, 1]),
            'false_negatives': int(cm[1, 0]),
            'true_positives': int(cm[1, 1])
        }

    @staticmethod
    def compute_roc_curve(y_true: np.ndarray, y_scores: np.ndarray) -> Dict[str, Any]:
        """Compute ROC curve."""
        fpr, tpr, thresholds = roc_curve(y_true, y_scores)
        roc_auc = auc(fpr, tpr)
        
        return {
            'fpr': fpr.tolist(),
            'tpr': tpr.tolist(),
            'thresholds': thresholds.tolist(),
            'auc': float(roc_auc)
        }

    @staticmethod
    def get_per_class_metrics(y_true: np.ndarray, y_pred: np.ndarray,
                             class_labels: list = None) -> Dict[str, Dict[str, float]]:
        """Get metrics for each class."""
        unique_classes = np.unique(y_true)
        
        metrics_by_class = {}
        for cls in unique_classes:
            cls_mask = y_true == cls
            pred_mask = y_pred == cls
            
            tp = np.sum(cls_mask & pred_mask)
            fp = np.sum((~cls_mask) & pred_mask)
            fn = np.sum(cls_mask & (~pred_mask))
            
            precision = tp / (tp + fp) if (tp + fp) > 0 else 0
            recall = tp / (tp + fn) if (tp + fn) > 0 else 0
            f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
            
            cls_name = class_labels[int(cls)] if class_labels else str(int(cls))
            metrics_by_class[cls_name] = {
                'precision': float(precision),
                'recall': float(recall),
                'f1': float(f1),
                'support': int(np.sum(cls_mask))
            }
        
        return metrics_by_class
