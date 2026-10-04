import os
import json
import asyncio
from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

from database import init_database, get_current_records, execute_raw_sql, restore_snapshot
from firewall import inspect_tool_call

app = FastAPI(title="TraceGuard Security Gateway")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

audit_logs = []
init_database()

class CommandRequest(BaseModel):
    prompt: str
    target_action: str
    query: str

@app.get("/api/state")
def get_state():
    return {"database": get_current_records(), "logs": audit_logs}

@app.post("/api/reset")
def reset_environment():
    global audit_logs
    audit_logs = []
    init_database()
    return {"status": "Environment reset to clean snapshot"}

@app.post("/api/simulate")
async def simulate_agent_action(request: CommandRequest):
    timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
    inspection = inspect_tool_call(request.target_action, {"query": request.query})
    
    log_entry = {
        "id": len(audit_logs) + 1,
        "timestamp": timestamp,
        "prompt": request.prompt,
        "tool": request.target_action,
        "query": request.query,
        "verdict": inspection["verdict"],
        "reason": inspection["reason"],
        "rollback_executed": False
    }

    if inspection["verdict"] == "BLOCKED":
        restore_snapshot()
        log_entry["rollback_executed"] = True
        audit_logs.append(log_entry)
        return {"status": "BLOCKED", "message": "TraceGuard halted execution.", "log": log_entry, "database": get_current_records()}
    else:
        try:
            execute_raw_sql(request.query)
            audit_logs.append(log_entry)
            return {"status": "SUCCESS", "message": "Action executed successfully.", "log": log_entry, "database": get_current_records()}
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/stream")
async def stream_audit_feed():
    async def event_publisher():
        last_index = 0
        while True:
            if last_index < len(audit_logs):
                new_logs = audit_logs[last_index:]
                for log in new_logs:
                    yield {"data": json.dumps(log)}
                last_index = len(audit_logs)
            await asyncio.sleep(0.4)
    return EventSourceResponse(event_publisher())
