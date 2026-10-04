import re

BLOCKED_PATTERNS = [
    r"\bDROP\b",
    r"\bDELETE\b",
    r"\bTRUNCATE\b",
    r"\bALTER\b",
    r"\bUPDATE\b.*SET\s+balance\s*=\s*0"
]

def inspect_tool_call(tool_name: str, arguments: dict) -> dict:
    if tool_name == "sql_database_tool":
        query = arguments.get("query", "").strip()
        for pattern in BLOCKED_PATTERNS:
            if re.search(pattern, query, re.IGNORECASE):
                return {
                    "verdict": "BLOCKED",
                    "reason": f"Security Policy Violation: Query matched destructive pattern '{pattern}'",
                    "query": query
                }
        return {
            "verdict": "ALLOWED",
            "reason": "Safe read/query passed validation checks.",
            "query": query
        }
    return {
        "verdict": "ALLOWED",
        "reason": "Non-sensitive tool execution.",
        "query": ""
    }