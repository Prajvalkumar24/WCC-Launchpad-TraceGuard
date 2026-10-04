"use client";

import { useState, useEffect } from "react";

export default function TraceGuardDashboard() {
  const [logs, setLogs] = useState<any[]>([]);
  
  // Connect to the Python SSE stream for live logs
  useEffect(() => {
    const eventSource = new EventSource("http://localhost:8000/api/stream");
    
    eventSource.onmessage = (event) => {
      const newLog = JSON.parse(event.data);
      setLogs((prevLogs) => {
        // Prevent duplicate logs based on ID
        if (prevLogs.find(l => l.id === newLog.id)) return prevLogs;
        return [newLog, ...prevLogs];
      });
    };

    return () => eventSource.close();
  }, []);

  // Function to trigger the agent
  const triggerAgent = async (prompt: string, target_action: string, query: string) => {
    try {
      await fetch("http://localhost:8000/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, target_action, query })
      });
    } catch (error) {
      console.error("Failed to connect to backend", error);
    }
  };

  const runSafeQuery = () => triggerAgent("Fetch Users", "sql_database_tool", "SELECT * FROM customer_records");
  const runExploit = () => triggerAgent("Drop Database", "sql_database_tool", "DROP TABLE customer_records");
  
  const resetSystem = async () => {
    await fetch("http://localhost:8000/api/reset", { method: "POST" });
    setLogs([]);
  };

  const blockedCount = logs.filter(l => l.verdict === "BLOCKED").length;
  const allowedCount = logs.filter(l => l.verdict === "ALLOWED").length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 p-8 font-mono">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-white tracking-wider">TraceGuard // <span className="text-emerald-500">Gateway</span></h1>
        <div className="flex gap-4">
          <span className="px-3 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded text-sm animate-pulse">● ACTIVE / MONITORING</span>
          <button onClick={resetSystem} className="px-4 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-sm transition-colors">Reset Environment</button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
          <div className="text-slate-500 text-xs mb-1">TOTAL INTERCEPTIONS</div>
          <div className="text-3xl text-white">{logs.length}</div>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
          <div className="text-slate-500 text-xs mb-1">THREATS BLOCKED</div>
          <div className="text-3xl text-red-500">{blockedCount}</div>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
          <div className="text-slate-500 text-xs mb-1">SAFE EXECUTIONS</div>
          <div className="text-3xl text-emerald-500">{allowedCount}</div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Terminal Controls */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-lg flex flex-col gap-4">
          <h2 className="text-sm text-slate-500 mb-2">AGENT COMMAND TERMINAL</h2>
          <button onClick={runSafeQuery} className="w-full text-left px-4 py-3 bg-emerald-950/30 hover:bg-emerald-950/50 border border-emerald-900 text-emerald-400 rounded transition-colors">
            ▶ Run Safe Query: Fetch Users
          </button>
          <button onClick={runExploit} className="w-full text-left px-4 py-3 bg-red-950/30 hover:bg-red-950/50 border border-red-900 text-red-400 rounded transition-colors">
            ⚠ Run Exploit: Drop Database
          </button>
          
          <div className="mt-auto pt-6 border-t border-slate-800 text-xs text-slate-600">
            [sys] TraceGuard gateway v2.4.1 online<br/>
            [sys] Loaded 5 security policies • snapshot engine: active<br/>
            [sys] Awaiting agent instructions...
          </div>
        </div>

        {/* Live Activity Stream */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-lg h-[400px] overflow-y-auto">
          <h2 className="text-sm text-slate-500 mb-4">LIVE ACTIVITY STREAM</h2>
          <div className="flex flex-col gap-3">
            {logs.length === 0 && <div className="text-slate-600 italic text-sm">No agent activity detected.</div>}
            
            {logs.map((log, i) => (
              <div key={i} className="p-3 bg-slate-950 border border-slate-800 rounded text-sm">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold text-white">{log.tool}()</span>
                  <span className={`text-xs px-2 py-0.5 rounded border ${
                    log.verdict === 'BLOCKED' ? 'bg-red-950 border-red-800 text-red-500' : 'bg-emerald-950 border-emerald-800 text-emerald-500'
                  }`}>
                    {log.verdict}
                  </span>
                </div>
                <div className="text-slate-400 text-xs mb-2">"{log.prompt}"</div>
                
                {log.verdict === 'BLOCKED' && (
                  <div className="mt-2 p-2 bg-red-950/20 border border-red-900/50 rounded">
                    <div className="text-red-400 text-xs mb-1">Reason: {log.reason}</div>
                    <div className="text-orange-400 text-xs">↻ State Rollback Executed</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}