from app.models.domain import VerdictType

class VerdictService:
    @staticmethod
    def evaluate_verdict(confidence_score: float) -> VerdictType:
        if confidence_score >= 90.0:
            return VerdictType.VERIFIED
        elif confidence_score >= 70.0:
            return VerdictType.REVIEW
        elif confidence_score >= 40.0:
            return VerdictType.WARNING
        else:
            return VerdictType.BLOCKED

verdict_service = VerdictService()
