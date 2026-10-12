import json
import logging
import urllib.request
import urllib.error
from backend.config import settings

logger = logging.getLogger(__name__)

class GeminiProvider:
    """
    Adapter for Google Gemini API.
    Provides plain-language anomaly explanations and inspection guidance.
    Includes deterministic rule-based fallback when key is absent or unavailable.
    """

    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model = settings.MODEL_IDENTIFIER

    def generate_explanation(self, context: dict, user_question: str) -> dict:
        """
        Executes server-side Gemini call or returns structured deterministic fallback.
        """
        # If API key is provided, attempt live call to Gemini API
        if self.api_key:
            try:
                result = self._call_gemini_api(context, user_question)
                if result:
                    return result
            except Exception as e:
                logger.warning(f"Gemini API call failed, falling back to deterministic explanation: {e}")

        # Graceful Deterministic Fallback (Page 7 specification)
        return self._generate_deterministic_explanation(context, user_question)

    def _call_gemini_api(self, context: dict, user_question: str) -> dict:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
        
        system_prompt = (
            "You are Sentinel's campus resource assistant. Use only the supplied facts. "
            "Never invent readings, savings, causes, or policy. Distinguish observed facts from hypotheses. "
            "Return valid JSON matching this exact structure: "
            '{"summary": string, "evidence": [{"label": string, "value": any, "unit": string}], '
            '"suggested_checks": [string], "priority_rationale": string, "caveat": string}. '
            "Do not mark an incident as confirmed without verified physical inspection data."
        )

        user_content = (
            f"Context Data:\n{json.dumps(context, indent=2)}\n\n"
            f"User Question: {user_question}"
        )

        payload = {
            "contents": [
                {"role": "user", "parts": [{"text": f"{system_prompt}\n\n{user_content}"}]}
            ],
            "generationConfig": {
                "response_mime_type": "application/json",
                "temperature": 0.2
            }
        }

        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )

        with urllib.request.urlopen(req, timeout=10) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            candidate = res_data.get("candidates", [])[0]
            text = candidate.get("content", {}).get("parts", [])[0].get("text", "")
            return json.loads(text)

    def _generate_deterministic_explanation(self, ctx: dict, user_question: str) -> dict:
        space = ctx.get("space_name", "Academic Space")
        building = ctx.get("building_name", "Campus Complex")
        res_type = ctx.get("resource_type", "electricity")
        unit = ctx.get("unit", "kWh")
        actual = ctx.get("observed_value", 0.0)
        baseline = ctx.get("expected_baseline", 0.0)
        dev = ctx.get("deviation_pct", 0.0)
        anomaly_type = ctx.get("anomaly_type", "unusual_draw")

        # Context-aware summary
        if res_type == "water":
            summary = (
                f"Continuous flow detected in {space} ({building}) averaging {actual} {unit}, "
                f"which is {dev:.1f}% above historical baseline ({baseline} {unit})."
            )
            checks = [
                "Inspect restroom fixtures and automatic flush valves for mechanical jamming.",
                "Verify riser pipe pressure gauges and acoustic vibration for concealed joint leaks.",
                "Check roof storage tank overflow float switches.",
                "Validate ultrasonic sub-meter calibration against physical sight glasses."
            ]
            rationale = "High water draw during off-peak hours indicates structural plumbing leakage rather than student usage."
        elif res_type == "electricity":
            summary = (
                f"Electrical power draw in {space} reached {actual} {unit}, deviating by {dev:.1f}% "
                f"from the scheduled room baseline of {baseline} {unit}."
            )
            checks = [
                "Cross-reference classroom schedule with Central Facilities ERP to confirm occupancy.",
                "Perform physical walkthrough of laboratory workstations and server power racks.",
                "Inspect split AC thermostat overrides and corridor circuit breakers.",
                "Review smart energy sub-meter pulse logs for transient voltage spikes."
            ]
            rationale = f"Unscheduled load of {actual} {unit} sustained during off-hours leads to avoidable utility expenditure."
        else:
            summary = f"Solid waste generation in {space} is {dev:.1f}% higher than weekly baseline."
            checks = [
                "Review cafeteria packaging and food prep logs.",
                "Verify recycling segregation bins.",
                "Audit logistics weighbridge receipts."
            ]
            rationale = "Elevated organic refuse flags batch preparation waste."

        evidence = [
            {"label": "Observed consumption", "value": actual, "unit": unit},
            {"label": "Expected baseline", "value": baseline, "unit": unit},
            {"label": "Deviation magnitude", "value": round(dev, 1), "unit": "%"}
        ]

        return {
            "summary": summary,
            "evidence": evidence,
            "suggested_checks": checks,
            "priority_rationale": rationale,
            "caveat": "AI-generated advisory diagnostic. Physical on-site inspection required prior to corrective mechanical action."
        }

gemini_provider = GeminiProvider()
