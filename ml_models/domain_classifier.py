# Simple keyword-based classifier for now
def classify_domain(query: str) -> str:
    query = query.lower()
    if any(k in query for k in ["health", "medical", "doctor", "disease"]):
        return "Healthcare"
    if any(k in query for k in ["finance", "money", "stock", "market", "economy"]):
        return "Finance"
    if any(k in query for k in ["tech", "software", "ai", "computer", "algorithm"]):
        return "Technology"
    if any(k in query for k in ["policy", "government", "law", "regulation"]):
        return "Policy"
    return "General Research"
