# Placeholder for confidence scoring logic
def compute_confidence(agent_scores: list) -> float:
    if not agent_scores:
        return 0.5
    return sum(agent_scores) / len(agent_scores)
