import json
import httpx
from typing import Dict, Any, Optional
from app.config import settings

class LLMProvider:
    """
    Unified LLM provider abstraction supporting OpenAI, Anthropic,
    and a high-precision deterministic FinOps expert engine.
    """

    async def generate_explanation(self, anomaly_payload: Dict[str, Any]) -> Dict[str, Any]:
        provider = settings.LLM_PROVIDER.lower()
        
        if provider == "openai" and settings.OPENAI_API_KEY:
            try:
                return await self._call_openai(anomaly_payload)
            except Exception as e:
                print(f"[LLMProvider] OpenAI call failed: {e}. Falling back to FinOps Engine.")
                return self._generate_deterministic_explanation(anomaly_payload, fallback_reason="OpenAI API Error")
                
        elif provider == "anthropic" and settings.ANTHROPIC_API_KEY:
            try:
                return await self._call_anthropic(anomaly_payload)
            except Exception as e:
                print(f"[LLMProvider] Anthropic call failed: {e}. Falling back to FinOps Engine.")
                return self._generate_deterministic_explanation(anomaly_payload, fallback_reason="Anthropic API Error")
        
        # Default mock/deterministic engine
        return self._generate_deterministic_explanation(anomaly_payload)

    async def _call_openai(self, data: Dict[str, Any]) -> Dict[str, Any]:
        prompt = self._build_system_prompt(data)
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": settings.OPENAI_MODEL,
                    "messages": [
                        {"role": "system", "content": "You are a Principal Cloud FinOps and Reliability Engineer. Always output valid structured JSON matching the requested schema exactly."},
                        {"role": "user", "content": prompt}
                    ],
                    "response_format": {"type": "json_object"},
                    "temperature": 0.2
                }
            )
            response.raise_for_status()
            res_json = response.json()
            content = res_json["choices"][0]["message"]["content"]
            parsed = json.loads(content)
            parsed["provider_used"] = f"OpenAI ({settings.OPENAI_MODEL})"
            return parsed

    async def _call_anthropic(self, data: Dict[str, Any]) -> Dict[str, Any]:
        prompt = self._build_system_prompt(data)
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": settings.ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "claude-3-haiku-20240307",
                    "max_tokens": 1024,
                    "messages": [
                        {"role": "user", "content": f"{prompt}\nReturn strictly raw valid JSON."}
                    ],
                    "temperature": 0.2
                }
            )
            response.raise_for_status()
            res_json = response.json()
            content = res_json["content"][0]["text"]
            # Extract JSON block if wrapped
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            parsed = json.loads(content.strip())
            parsed["provider_used"] = "Anthropic (Claude 3)"
            return parsed

    def _build_system_prompt(self, data: Dict[str, Any]) -> str:
        return f"""
Analyze the following Cloud Telemetry & Cost Anomaly event:
- Service: {data.get('service')}
- Region: {data.get('region')}
- Environment: {data.get('environment')}
- Baseline Cost: ₹{data.get('baseline_cost_inr', 0):,.2f}
- Current Cost: ₹{data.get('current_cost_inr', 0):,.2f} (+{data.get('cost_increase_pct', 0)}%)
- Anomaly Score: {data.get('anomaly_score', 0)}
- Telemetry: {json.dumps(data.get('telemetry_data', {}))}

Return a JSON object with this exact schema:
{{
  "summary": "Concise 2-sentence summary of what happened and percentage spike",
  "probable_causes": ["Cause 1 with specific metric evidence", "Cause 2"],
  "evidence": {{"key_metrics": "...", "trigger": "..."}},
  "confidence_score": 88.5,
  "business_impact": "Financial loss per day and operational risk description",
  "estimated_financial_loss_inr": {data.get('potential_impact_inr', 0)},
  "recommended_actions": ["Action 1 step-by-step", "Action 2 with CLI or console recommendation"],
  "remediation_code": "Optional AWS CLI command or config snippet to execute"
}}
"""

    def _generate_deterministic_explanation(self, data: Dict[str, Any], fallback_reason: Optional[str] = None) -> Dict[str, Any]:
        """
        Expert deterministic rule-based FinOps LLM engine for offline / keyless evaluation.
        Produces highly realistic, contextual engineering root causes.
        """
        service = data.get("service", "EC2")
        cost_inc = data.get("cost_increase_pct", 100.0)
        baseline = data.get("baseline_cost_inr", 4000.0)
        current = data.get("current_cost_inr", 12000.0)
        impact = data.get("potential_impact_inr", current - baseline)
        telemetry = data.get("telemetry_data", {})
        
        cpu = telemetry.get("cpu_usage", 65.0)
        instance_count = telemetry.get("instance_count", 24)
        retry_rate = telemetry.get("retry_rate", 18.5)
        error_rate = telemetry.get("error_rate", 5.2)
        request_count = telemetry.get("request_count", 45000)

        # Contextual logic per service
        if "EC2" in service or "Autoscaling" in service or "EKS" in service:
            if retry_rate > 10.0:
                cause_title = "Cascading Retry Storm triggering Auto Scaling Group expansion"
                detail_cause = f"Client retry rate spiked to {retry_rate}% after upstream 504 gateway timeouts. The Auto Scaling Group responded to aggregate synthetic load by expanding node instances from 6 to {instance_count} without increasing actual throughput."
                remediation = [
                    "Implement exponential backoff with jitter on client SDKs and API gateways to break retry synchronization.",
                    f"Cap the Auto Scaling Group `MaxSize` to 12 instances while root causing upstream latency.",
                    "Enable AWS Compute Optimizer recommendations for instance right-sizing."
                ]
                cli_code = f"aws autoscaling update-auto-scaling-group --auto-scaling-group-name prod-app-asg --max-size 12 --desired-capacity 8"
            else:
                cause_title = "Runaway Autoscaling triggered by uncapped traffic burst"
                detail_cause = f"Instance count surged from baseline 4 to {instance_count} nodes due to an aggressive CPU target tracking policy ({cpu:.1f}% average CPU) without cooldown dampening."
                remediation = [
                    "Increase autoscaling cooldown period from default 60s to 300s to eliminate metric oscillations.",
                    "Audit CPU target tracking policy threshold and switch to request-count-per-target metric.",
                    "Review target group health checks to ensure failing instances are gracefully terminated."
                ]
                cli_code = f"aws autoscaling put-scaling-policy --auto-scaling-group-name prod-web-asg --policy-name cpu-target-tracking --target-tracking-configuration file://asg-policy.json"
        
        elif "SageMaker" in service or "GPU" in service:
            cause_title = "Idle High-Performance GPU Instances (ml.p4de.24xlarge) left active post-training"
            detail_cause = f"Distributed PyTorch training job completed 14 hours ago, but the orchestration script failed to invoke teardown hooks. Multi-node GPU cluster remained in `InService` state at ₹840/hr per node."
            remediation = [
                "Attach automated CloudWatch event rule with Lambda to terminate SageMaker training instances upon notebook/job exit.",
                "Enforce AWS Service Quotas and Budgets alert at ₹50,000 threshold for ml.p4/p5 instance families.",
                "Transition ad-hoc training scripts to managed SageMaker Training Jobs with automatic shutdown."
            ]
            cli_code = f"aws sagemaker stop-training-job --training-job-name distributed-nlp-h100-v2"
            
        elif "Lambda" in service:
            cause_title = "Recursive Serverless Invocation & SQS Retry Loop"
            detail_cause = f"Lambda function triggered by S3 `ObjectCreated` event generated thumbnail artifacts back into the same source bucket without prefix filtering, generating 2.4M recursive invocations."
            remediation = [
                "Isolate thumbnail destination outputs to a separate S3 prefix or target bucket.",
                "Set Lambda `ReservedConcurrentExecutions` to 50 as a blast-radius governor.",
                "Configure dead-letter queue (DLQ) with max receive count of 3."
            ]
            cli_code = f"aws lambda put-function-concurrency --function-name image-processor-fn --reserved-concurrent-executions 50"
            
        elif "RDS" in service:
            cause_title = "Unindexed Query Storm causing Read Replica auto-provisioning & IOPS surge"
            detail_cause = f"A new deployment released an unindexed `JOIN` query on the `orders` table, maxing CPU to 99% and triggering automated multi-AZ Aurora replica scale-out."
            remediation = [
                "Apply composite index `(user_id, created_at)` via migration.",
                "Enable Aurora Performance Insights and slow query logs.",
                "Scale down surplus read replicas once query latency normalizes."
            ]
            cli_code = f"aws rds modify-db-cluster --db-cluster-identifier prod-aurora-cluster --scaling-configuration MaxCapacity=4"
            
        else:
            cause_title = f"Unusual Resource Allocation Surge in {service}"
            detail_cause = f"Billing rate increased by {cost_inc:.1f}% compared to normal 14-day rolling baseline (₹{baseline:,.0f}/day vs ₹{current:,.0f}/day)."
            remediation = [
                f"Verify latest CI/CD deployments and Terraform drift in {service}.",
                "Inspect resource tagging to identify the responsible engineering squad.",
                "Set automated billing anomaly alerts in AWS Cost Anomaly Detection."
            ]
            cli_code = f"aws ce create-anomaly-subscription --subscription-name SquadAlerts --threshold 10000"

        provider_tag = "CarbonLens FinOps AI Engine (Local Deterministic)"
        if fallback_reason:
            provider_tag += f" [Fallback: {fallback_reason}]"

        return {
            "summary": f"{service} production spend accelerated by +{cost_inc:.1f}% over the baseline window, generating ₹{impact:,.2f} in excess burn rate.",
            "probable_causes": [
                cause_title,
                detail_cause,
                f"Metric correlation: CPU ({cpu:.1f}%), Instance Count ({instance_count}), Retry Rate ({retry_rate:.1f}%), Error Rate ({error_rate:.1f}%)."
            ],
            "evidence": {
                "service": service,
                "baseline_cost": f"₹{baseline:,.2f}/day",
                "current_cost": f"₹{current:,.2f}/day",
                "delta_pct": f"+{cost_inc:.1f}%",
                "telemetry_metrics": {
                    "cpu_utilization": f"{cpu:.1f}%",
                    "instance_count": instance_count,
                    "retry_rate": f"{retry_rate:.1f}%",
                    "requests_sec": f"{request_count / 3600:.1f} req/s"
                }
            },
            "confidence_score": round(min(96.0, 78.0 + (cost_inc * 0.05)), 1),
            "business_impact": f"Projected unbudgeted financial loss of ₹{impact:,.2f}/day (₹{impact * 30:,.2f}/month) if unmitigated. Carbon emissions increased by approximately {impact * 0.018:.1f} kgCO₂e/day.",
            "estimated_financial_loss_inr": float(impact),
            "recommended_actions": remediation,
            "remediation_code": cli_code,
            "provider_used": provider_tag
        }

llm_provider = LLMProvider()
