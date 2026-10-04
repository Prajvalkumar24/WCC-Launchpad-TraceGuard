# TraceGuard // Agentic Safety & Deterministic Gateway

### The Problem
Autonomous AI agents executing tool calls directly in enterprise environments pose catastrophic security risks if they hallucinate destructive commands (e.g., dropping databases or deleting records).

### The Solution
TraceGuard acts as a deterministic middleware firewall for Agentic AI. It intercepts LLM tool calls, evaluates the payload against strict security policies before execution, and triggers an instant SQLite state rollback if a malicious action is detected. 

### Tech Stack
* **Frontend:** Next.js, Tailwind CSS, Server-Sent Events (SSE)
* **Backend:** FastAPI, Python, SQLite (State Management)
* **Design Pattern:** Deterministic Interception Pipeline

### How to Run Locally

**1. Start the Security Engine (Backend)**
```bash
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload