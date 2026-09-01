import numpy as np
from sklearn.ensemble import IsolationForest
from typing import Dict, Any, Tuple, List

class MLAnomalyDetector:
    """
    Combines Isolation Forest unsupervised machine learning with
    statistical rolling Z-score baseline evaluation for cloud usage & billing spikes.
    """

    def __init__(self, contamination: float = 0.05):
        self.contamination = contamination
        self.model = IsolationForest(
            n_estimators=100,
            contamination=self.contamination,
            random_state=42
        )
        self._is_fitted = False

    def train_baseline(self, historical_features: np.ndarray):
        """
        Train Isolation Forest on normal telemetry features:
        [cost_rate, cpu_pct, request_count, error_rate, instance_count]
        """
        if len(historical_features) >= 10:
            self.model.fit(historical_features)
            self._is_fitted = True

    def calculate_zscore(self, current_value: float, baseline_mean: float, baseline_std: float) -> float:
        if baseline_std <= 0:
            baseline_std = max(1.0, baseline_mean * 0.1)
        return (current_value - baseline_mean) / baseline_std

    def evaluate_telemetry(
        self,
        current_cost: float,
        baseline_cost: float,
        cpu_usage: float,
        request_count: float,
        instance_count: int,
        error_rate: float,
        retry_rate: float
    ) -> Tuple[bool, float, str, float]:
        """
        Evaluates current cloud metric vector.
        Returns:
            (is_anomaly: bool, anomaly_score: float [0..1], severity: str, pct_increase: float)
        """
        pct_increase = ((current_cost - baseline_cost) / max(1.0, baseline_cost)) * 100.0
        
        # 1. Statistical component (Z-score calculation)
        estimated_std = max(10.0, baseline_cost * 0.15)
        cost_zscore = self.calculate_zscore(current_cost, baseline_cost, estimated_std)
        
        # 2. Correlative indicator signals
        # If cost spiked drastically without request count growing proportionally -> high anomaly
        request_scaling_ratio = request_count / max(1.0, instance_count * 1000)
        unusual_instance_ratio = instance_count > 15 and cpu_usage < 30.0 # Runaway autoscaling with low CPU or retry loop
        retry_penalty = min(0.3, retry_rate * 0.01)
        error_penalty = min(0.2, error_rate * 0.01)

        # 3. Isolation forest score approximation if not fitted
        if not self._is_fitted:
            # Generate synthetic normal baseline for cold start fitting
            synthetic_normal = np.random.normal(
                loc=[baseline_cost, 45.0, 10000.0, 0.5, 4.0],
                scale=[baseline_cost * 0.1, 10.0, 2000.0, 0.2, 1.0],
                size=(50, 5)
            )
            self.train_baseline(synthetic_normal)

        feature_vector = np.array([[current_cost, cpu_usage, request_count, error_rate, float(instance_count)]])
        
        try:
            # Decision function: lower values indicate abnormal behavior
            raw_score = self.model.decision_function(feature_vector)[0]
            # Normalize to 0 (normal) to 1 (extreme anomaly)
            ml_anomaly_score = float(np.clip(1.0 - (raw_score + 0.5), 0.0, 1.0))
        except Exception:
            ml_anomaly_score = 0.5

        # Weighted composite score
        statistical_score = min(1.0, max(0.0, (cost_zscore - 1.5) / 5.0))
        composite_score = float(np.clip(
            (ml_anomaly_score * 0.45) + 
            (statistical_score * 0.40) + 
            retry_penalty + 
            error_penalty + 
            (0.1 if unusual_instance_ratio else 0.0),
            0.0, 1.0
        ))

        is_anomaly = (composite_score >= 0.45) or (pct_increase >= 50.0)

        # Severity categorization
        if pct_increase >= 200.0 or composite_score >= 0.85:
            severity = "CRITICAL"
        elif pct_increase >= 100.0 or composite_score >= 0.65:
            severity = "HIGH"
        elif pct_increase >= 40.0 or composite_score >= 0.45:
            severity = "MEDIUM"
        else:
            severity = "LOW"

        return is_anomaly, round(composite_score, 3), severity, round(pct_increase, 1)

anomaly_detector = MLAnomalyDetector()
